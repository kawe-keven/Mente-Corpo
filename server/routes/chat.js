const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// GET /api/chat - list recent messages
router.get('/', auth, async (req, res) => {
  const db = req.app.locals.db;
  const messages = await db.all(`
    SELECT m.id, m.content, m.created_at, m.user_id, u.name as user_name
    FROM messages m
    JOIN users u ON u.id = m.user_id
    ORDER BY m.created_at DESC
    LIMIT 100
  `);
  res.json(messages.reverse());
});

// POST /api/chat - create message
router.post('/', auth, async (req, res) => {
  const db = req.app.locals.db;
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'content required' });
  const result = await db.run('INSERT INTO messages (user_id, content) VALUES (?, ?)', [req.user.id, content]);
  const message = await db.get('SELECT m.id, m.content, m.created_at, m.user_id, u.name as user_name FROM messages m JOIN users u ON u.id = m.user_id WHERE m.id = ?', [result.lastID]);
  res.json(message);
});

module.exports = router;
