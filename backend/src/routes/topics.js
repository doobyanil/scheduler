const express = require('express');
const { pool } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/courses/:courseId/topics', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await pool.query('SELECT * FROM topics WHERE course_id = $1 ORDER BY order_index', [courseId]);
    res.json({ topics: result.rows });
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/courses/:courseId/topics', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, sessions_needed, order_index } = req.body;

    const result = await pool.query(
      'INSERT INTO topics (course_id, title, description, sessions_needed, order_index) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [courseId, title, description, sessions_needed, order_index]
    );

    res.status(201).json({ topic: result.rows[0] });
  } catch (error) {
    console.error('Create topic error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, sessions_needed, order_index } = req.body;

    const result = await pool.query(
      'UPDATE topics SET title = $1, description = $2, sessions_needed = $3, order_index = $4 WHERE id = $5 RETURNING *',
      [title, description, sessions_needed, order_index, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    res.json({ topic: result.rows[0] });
  } catch (error) {
    console.error('Update topic error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM topics WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/prerequisites', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { prerequisite_id } = req.body;

    await pool.query(
      'INSERT INTO topic_prerequisites (topic_id, prerequisite_id) VALUES ($1, $2)',
      [id, prerequisite_id]
    );

    res.status(201).json({ message: 'Prerequisite added successfully' });
  } catch (error) {
    console.error('Add prerequisite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/prerequisites/:prereqId', authenticateToken, async (req, res) => {
  try {
    const { id, prereqId } = req.params;

    await pool.query(
      'DELETE FROM topic_prerequisites WHERE topic_id = $1 AND prerequisite_id = $2',
      [id, prereqId]
    );

    res.json({ message: 'Prerequisite removed successfully' });
  } catch (error) {
    console.error('Remove prerequisite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
