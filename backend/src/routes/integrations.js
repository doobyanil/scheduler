const express = require('express');
const axios = require('axios');
const { pool } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/canvas/connect', authenticateToken, async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;

    const tokenResponse = await axios.post('https://canvas.instructure.com/login/oauth2/token', {
      grant_type: 'authorization_code',
      client_id: process.env.CANVAS_CLIENT_ID,
      client_secret: process.env.CANVAS_CLIENT_SECRET,
      redirect_uri,
      code
    });

    const { access_token, refresh_token } = tokenResponse.data;

    res.json({
      message: 'Canvas connected successfully',
      access_token,
      refresh_token
    });
  } catch (error) {
    console.error('Canvas connect error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/canvas/courses', authenticateToken, async (req, res) => {
  try {
    const { access_token } = req.headers;

    const response = await axios.get('https://canvas.instructure.com/api/v1/courses', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    res.json({ courses: response.data });
  } catch (error) {
    console.error('Canvas courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/canvas/sync', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.body;
    const { access_token } = req.headers;

    const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
    const course = courseResult.rows[0];

    const assignmentsResult = await pool.query('SELECT * FROM assignments WHERE course_id = $1', [courseId]);

    for (const assignment of assignmentsResult.rows) {
      if (assignment.canvas_assignment_id) {
        await axios.put(
          `https://canvas.instructure.com/api/v1/courses/${course.canvas_course_id}/assignments/${assignment.canvas_assignment_id}`,
          {
            assignment: {
              due_at: assignment.due_date.toISOString()
            }
          },
          {
            headers: {
              Authorization: `Bearer ${access_token}`
            }
          }
        );
      }
    }

    res.json({ message: 'Canvas sync completed' });
  } catch (error) {
    console.error('Canvas sync error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/canvas/disconnect', authenticateToken, async (req, res) => {
  try {
    res.json({ message: 'Canvas disconnected successfully' });
  } catch (error) {
    console.error('Canvas disconnect error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
