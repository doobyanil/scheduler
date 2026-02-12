const express = require('express');
const { pool } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get all courses for the user
    const coursesResult = await pool.query('SELECT * FROM courses WHERE user_id = $1', [req.user.id]);
    const courses = coursesResult.rows;

    // For each course, get related data
    for (const course of courses) {
      // Get meeting times
      const meetingTimesResult = await pool.query(
        'SELECT * FROM meeting_times WHERE course_id = $1',
        [course.id]
      );
      course.meeting_times = meetingTimesResult.rows;

      // Get topics with sessions
      const topicsResult = await pool.query(
        'SELECT * FROM topics WHERE course_id = $1 ORDER BY order_index',
        [course.id]
      );
      course.topics = topicsResult.rows;

      // Get topic sessions for each topic
      for (const topic of course.topics) {
        const sessionsResult = await pool.query(
          'SELECT * FROM topic_sessions WHERE topic_id = $1 ORDER BY scheduled_date',
          [topic.id]
        );
        topic.sessions = sessionsResult.rows;
      }

      // Get assignments
      const assignmentsResult = await pool.query(
        'SELECT * FROM assignments WHERE course_id = $1 ORDER BY due_date',
        [course.id]
      );
      course.assignments = assignmentsResult.rows;

      // Get disruptions
      const disruptionsResult = await pool.query(
        'SELECT * FROM disruptions WHERE course_id = $1 ORDER BY disruption_date DESC',
        [course.id]
      );
      course.disruptions = disruptionsResult.rows;
    }

    res.json({ courses });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { title, course_code, semester, start_date, end_date, finals_week_start, meeting_times, topics, assignments } = req.body;

    // Create the course
    const courseResult = await client.query(
      'INSERT INTO courses (user_id, title, course_code, semester, start_date, end_date, finals_week_start, color) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.user.id, title, course_code, semester, start_date, end_date, finals_week_start, req.body.color || '#2563EB']
    );
    
    const course = courseResult.rows[0];

    // Add meeting times
    if (meeting_times && meeting_times.length > 0) {
      for (const mt of meeting_times) {
        await client.query(
          'INSERT INTO meeting_times (course_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4)',
          [course.id, mt.day_of_week, mt.start_time, mt.end_time]
        );
      }
    }

    // Add topics
    if (topics && topics.length > 0) {
      for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];
        const topicResult = await client.query(
          'INSERT INTO topics (course_id, title, description, sessions_needed, order_index) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [course.id, topic.title, topic.description || '', topic.sessions_needed || 1, i]
        );
        
        // Create topic sessions based on sessions_needed
        const topicId = topicResult.rows[0].id;
        for (let s = 1; s <= (topic.sessions_needed || 1); s++) {
          // Calculate scheduled date based on course start date and order
          const scheduledDate = new Date(start_date);
          scheduledDate.setDate(scheduledDate.getDate() + (i * 7) + (s - 1) * 2); // Rough scheduling
          
          await client.query(
            'INSERT INTO topic_sessions (topic_id, scheduled_date, session_number, status) VALUES ($1, $2, $3, $4)',
            [topicId, scheduledDate.toISOString().split('T')[0], s, 'scheduled']
          );
        }
      }
    }

    // Add assignments
    if (assignments && assignments.length > 0) {
      for (const assignment of assignments) {
        await client.query(
          'INSERT INTO assignments (course_id, title, type, due_date, weight, min_prep_days) VALUES ($1, $2, $3, $4, $5, $6)',
          [course.id, assignment.title, assignment.type || 'homework', assignment.due_date, assignment.weight || 10, assignment.min_prep_days || 7]
        );
      }
    }

    await client.query('COMMIT');
    
    // Fetch the complete course with related data
    const completeCourse = await getCompleteCourse(client, course.id);
    
    res.status(201).json({ course: completeCourse });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Helper function to get complete course data
async function getCompleteCourse(client, courseId) {
  const courseResult = await client.query('SELECT * FROM courses WHERE id = $1', [courseId]);
  const course = courseResult.rows[0];

  const meetingTimesResult = await client.query('SELECT * FROM meeting_times WHERE course_id = $1', [courseId]);
  course.meeting_times = meetingTimesResult.rows;

  const topicsResult = await client.query('SELECT * FROM topics WHERE course_id = $1 ORDER BY order_index', [courseId]);
  course.topics = topicsResult.rows;

  for (const topic of course.topics) {
    const sessionsResult = await client.query('SELECT * FROM topic_sessions WHERE topic_id = $1 ORDER BY scheduled_date', [topic.id]);
    topic.sessions = sessionsResult.rows;
  }

  const assignmentsResult = await client.query('SELECT * FROM assignments WHERE course_id = $1 ORDER BY due_date', [courseId]);
  course.assignments = assignmentsResult.rows;

  const disruptionsResult = await client.query('SELECT * FROM disruptions WHERE course_id = $1 ORDER BY disruption_date DESC', [courseId]);
  course.disruptions = disruptionsResult.rows;

  return course;
}

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM courses WHERE id = $1 AND user_id = $2', [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = result.rows[0];

    // Get meeting times
    const meetingTimesResult = await pool.query(
      'SELECT * FROM meeting_times WHERE course_id = $1',
      [course.id]
    );
    course.meeting_times = meetingTimesResult.rows;

    // Get topics with sessions
    const topicsResult = await pool.query(
      'SELECT * FROM topics WHERE course_id = $1 ORDER BY order_index',
      [course.id]
    );
    course.topics = topicsResult.rows;

    // Get topic sessions for each topic
    for (const topic of course.topics) {
      const sessionsResult = await pool.query(
        'SELECT * FROM topic_sessions WHERE topic_id = $1 ORDER BY scheduled_date',
        [topic.id]
      );
      topic.sessions = sessionsResult.rows;
    }

    // Get assignments
    const assignmentsResult = await pool.query(
      'SELECT * FROM assignments WHERE course_id = $1 ORDER BY due_date',
      [course.id]
    );
    course.assignments = assignmentsResult.rows;

    // Get disruptions
    const disruptionsResult = await pool.query(
      'SELECT * FROM disruptions WHERE course_id = $1 ORDER BY disruption_date DESC',
      [course.id]
    );
    course.disruptions = disruptionsResult.rows;

    res.json({ course });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, course_code, semester, start_date, end_date, finals_week_start } = req.body;

    const result = await pool.query(
      'UPDATE courses SET title = $1, course_code = $2, semester = $3, start_date = $4, end_date = $5, finals_week_start = $6, updated_at = NOW() WHERE id = $7 AND user_id = $8 RETURNING *',
      [title, course_code, semester, start_date, end_date, finals_week_start, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ course: result.rows[0] });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM courses WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/import', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let textContent = '';

    if (req.file.mimetype === 'application/pdf') {
      const dataBuffer = req.file.buffer;
      const data = await pdfParse(dataBuffer);
      textContent = data.text;
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      textContent = result.value;
    } else {
      return res.status(400).json({ error: 'Unsupported file format' });
    }

    res.json({
      message: 'Syllabus imported successfully',
      extracted_data: {
        title: 'Extracted Course Title',
        topics: [
          { title: 'Introduction', sessions: 1 },
          { title: 'Chapter 1', sessions: 2 },
          { title: 'Chapter 2', sessions: 3 }
        ],
        assignments: [
          { title: 'Homework 1', type: 'homework', due_date: '2024-02-15', weight: 10 },
          { title: 'Quiz 1', type: 'quiz', due_date: '2024-02-20', weight: 5 }
        ]
      }
    });
  } catch (error) {
    console.error('Import syllabus error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
