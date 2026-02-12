const express = require('express');
const { pool } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ics = require('ics');
const sgMail = require('@sendgrid/mail');

const router = express.Router();
if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.')) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

router.post('/courses/:courseId/export/pdf', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
    const course = courseResult.rows[0];

    const topicsResult = await pool.query('SELECT * FROM topics WHERE course_id = $1 ORDER BY order_index', [courseId]);
    const assignmentsResult = await pool.query('SELECT * FROM assignments WHERE course_id = $1 ORDER BY due_date', [courseId]);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${course.title}_schedule.pdf"`);

    doc.pipe(res);
    doc.fontSize(24).text(course.title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Semester: ${course.semester}`);
    doc.text(`Start Date: ${course.start_date}`);
    doc.text(`End Date: ${course.end_date}`);
    doc.moveDown();

    doc.fontSize(18).text('Topics:');
    topicsResult.rows.forEach((topic, index) => {
      doc.fontSize(12).text(`${index + 1}. ${topic.title}`);
    });
    doc.moveDown();

    doc.fontSize(18).text('Assignments:');
    assignmentsResult.rows.forEach((assignment) => {
      doc.fontSize(12).text(`• ${assignment.title} (${assignment.type}) - ${assignment.due_date.toLocaleDateString()}`);
    });

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/courses/:courseId/export/csv', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
    const course = courseResult.rows[0];

    const assignmentsResult = await pool.query('SELECT * FROM assignments WHERE course_id = $1 ORDER BY due_date', [courseId]);

    const csvWriter = createCsvWriter({
      path: 'schedule.csv',
      header: [
        { id: 'title', title: 'Title' },
        { id: 'type', title: 'Type' },
        { id: 'due_date', title: 'Due Date' },
        { id: 'weight', title: 'Weight' }
      ]
    });

    const records = assignmentsResult.rows.map(assignment => ({
      title: assignment.title,
      type: assignment.type,
      due_date: assignment.due_date.toLocaleDateString(),
      weight: assignment.weight
    }));

    await csvWriter.writeRecords(records);

    res.download('schedule.csv', `${course.title}_schedule.csv`, (err) => {
      if (err) {
        res.status(500).json({ error: 'Error downloading CSV' });
      }
    });
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/courses/:courseId/export/ics', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
    const course = courseResult.rows[0];

    const assignmentsResult = await pool.query('SELECT * FROM assignments WHERE course_id = $1', [courseId]);

    const events = assignmentsResult.rows.map(assignment => {
      const date = new Date(assignment.due_date);
      return {
        start: [date.getFullYear(), date.getMonth() + 1, date.getDate()],
        title: assignment.title,
        description: `Type: ${assignment.type}, Weight: ${assignment.weight}%`,
        categories: ['Academic']
      };
    });

    ics.createEvents(events, (error, value) => {
      if (error) {
        res.status(500).json({ error: 'Error creating calendar file' });
        return;
      }

      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', `attachment; filename="${course.title}_schedule.ics"`);
      res.send(value);
    });
  } catch (error) {
    console.error('Export ICS error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/courses/:courseId/notify', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { disruption_reason, affected_items } = req.body;

    const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
    const course = courseResult.rows[0];

    const msg = {
      to: 'students@example.com',
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `Schedule Update for ${course.title}`,
      text: `Dear Students,\n\nThis is to inform you that there has been a schedule change for ${course.title} due to ${disruption_reason}.\n\nThe following items have been affected:\n${affected_items.map(item => `• ${item.title} - ${item.date}`).join('\n')}\n\nPlease update your calendars accordingly.\n\nBest regards,\n${req.user.first_name} ${req.user.last_name}`,
      html: `
        <p>Dear Students,</p>
        <p>This is to inform you that there has been a schedule change for <strong>${course.title}</strong> due to ${disruption_reason}.</p>
        <p>The following items have been affected:</p>
        <ul>
          ${affected_items.map(item => `<li>${item.title} - ${item.date}</li>`).join('')}
        </ul>
        <p>Please update your calendars accordingly.</p>
        <p>Best regards,<br>${req.user.first_name} ${req.user.last_name}</p>
      `
    };

    await sgMail.send(msg);

    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/courses/:courseId/changelog', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await pool.query('SELECT * FROM change_logs WHERE course_id = $1 ORDER BY created_at DESC', [courseId]);
    res.json({ changelog: result.rows });
  } catch (error) {
    console.error('Get changelog error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
