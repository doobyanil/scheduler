const express = require('express');
const { pool } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const SchedulingAlgorithm = require('../services/schedulingAlgorithm');

const router = express.Router();

router.post('/courses/:courseId/disruptions', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { disruption_date, reason, notes } = req.body;

    const result = await pool.query(
      'INSERT INTO disruptions (course_id, disruption_date, reason, notes, announced_date) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [courseId, disruption_date, reason, notes]
    );

    res.status(201).json({ disruption: result.rows[0] });
  } catch (error) {
    console.error('Create disruption error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/courses/:courseId/disruptions', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await pool.query('SELECT * FROM disruptions WHERE course_id = $1', [courseId]);
    res.json({ disruptions: result.rows });
  } catch (error) {
    console.error('Get disruptions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/reschedule-options', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const disruptionResult = await pool.query('SELECT * FROM disruptions WHERE id = $1', [id]);
    if (disruptionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Disruption not found' });
    }

    const disruption = disruptionResult.rows[0];

    const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1', [disruption.course_id]);
    const course = courseResult.rows[0];

    const topicsResult = await pool.query('SELECT * FROM topics WHERE course_id = $1', [disruption.course_id]);
    const topics = topicsResult.rows;

    const assignmentsResult = await pool.query('SELECT * FROM assignments WHERE course_id = $1', [disruption.course_id]);
    const assignments = assignmentsResult.rows;

    const meetingTimesResult = await pool.query('SELECT * FROM meeting_times WHERE course_id = $1', [disruption.course_id]);
    const meetingTimes = meetingTimesResult.rows;

    const courseWithDetails = {
      ...course,
      topics,
      assignments,
      meeting_times: meetingTimes
    };

    const algorithm = new SchedulingAlgorithm(courseWithDetails, [disruption]);
    const options = algorithm.generateReschedulingOptions();

    const versionNumbersResult = await pool.query(
      'SELECT MAX(version_number) as max_version FROM schedule_versions WHERE course_id = $1 AND disruption_id = $2',
      [disruption.course_id, id]
    );

    const nextVersionNumber = (versionNumbersResult.rows[0].max_version || 0) + 1;

    for (let i = 0; i < options.length; i++) {
      await pool.query(
        'INSERT INTO schedule_versions (course_id, disruption_id, version_number, strategy_name, schedule_data, score, pros, cons) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          disruption.course_id,
          id,
          nextVersionNumber + i,
          options[i].strategy.name,
          JSON.stringify(options[i].strategy),
          options[i].score,
          options[i].pros,
          options[i].cons
        ]
      );
    }

    res.json({
      message: 'Rescheduling options generated',
      options: options.map(option => ({
        name: option.strategy.name,
        score: option.score,
        pros: option.pros,
        cons: option.cons,
        preview: option.strategy
      }))
    });
  } catch (error) {
    console.error('Generate reschedule options error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/apply-schedule', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { strategy_name } = req.body;

    const disruptionResult = await pool.query('SELECT * FROM disruptions WHERE id = $1', [id]);
    if (disruptionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Disruption not found' });
    }

    const disruption = disruptionResult.rows[0];

    const versionResult = await pool.query(
      'SELECT * FROM schedule_versions WHERE course_id = $1 AND disruption_id = $2 AND strategy_name = $3 ORDER BY version_number DESC',
      [disruption.course_id, id, strategy_name]
    );

    if (versionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule version not found' });
    }

    const scheduleVersion = versionResult.rows[0];

    await pool.query(
      'UPDATE schedule_versions SET applied = TRUE, applied_at = NOW() WHERE id = $1',
      [scheduleVersion.id]
    );

    await pool.query(
      'UPDATE disruptions SET resolved = TRUE WHERE id = $1',
      [id]
    );

    res.json({ message: 'Schedule applied successfully' });
  } catch (error) {
    console.error('Apply schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/courses/:courseId/schedule-versions', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await pool.query('SELECT * FROM schedule_versions WHERE course_id = $1', [courseId]);
    res.json({ versions: result.rows });
  } catch (error) {
    console.error('Get schedule versions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
