const express = require('express');
const { pool } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/courses/:courseId/assignments', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await pool.query('SELECT * FROM assignments WHERE course_id = $1 ORDER BY due_date', [courseId]);
    res.json({ assignments: result.rows });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/courses/:courseId/assignments', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, type, due_date, weight, min_prep_days, required_topics } = req.body;

    const result = await pool.query(
      'INSERT INTO assignments (course_id, title, type, due_date, original_due_date, weight, min_prep_days) VALUES ($1, $2, $3, $4, $4, $5, $6) RETURNING *',
      [courseId, title, type, due_date, weight, min_prep_days]
    );

    const assignment = result.rows[0];

    if (required_topics && required_topics.length > 0) {
      for (const topicId of required_topics) {
        await pool.query(
          'INSERT INTO assignment_topics (assignment_id, topic_id) VALUES ($1, $2)',
          [assignment.id, topicId]
        );
      }
    }

    res.status(201).json({ assignment });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, due_date, weight, min_prep_days, required_topics } = req.body;

    const result = await pool.query(
      'UPDATE assignments SET title = $1, type = $2, due_date = $3, weight = $4, min_prep_days = $5 WHERE id = $6 RETURNING *',
      [title, type, due_date, weight, min_prep_days, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await pool.query('DELETE FROM assignment_topics WHERE assignment_id = $1', [id]);

    if (required_topics && required_topics.length > 0) {
      for (const topicId of required_topics) {
        await pool.query(
          'INSERT INTO assignment_topics (assignment_id, topic_id) VALUES ($1, $2)',
          [id, topicId]
        );
      }
    }

    res.json({ assignment: result.rows[0] });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM assignments WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await pool.query('DELETE FROM assignment_topics WHERE assignment_id = $1', [id]);

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
