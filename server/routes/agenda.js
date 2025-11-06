const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// GET /api/agenda
router.get('/', auth, async (req, res) => {
  const db = req.app.locals.db;
  const events = await db.all('SELECT * FROM events WHERE user_id = ? ORDER BY start ASC', [req.user.id]);
  res.json(events);
});

// POST /api/agenda
router.post('/', auth, async (req, res) => {
  const db = req.app.locals.db;
  const { title, details, start, end, completed } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const result = await db.run('INSERT INTO events (user_id, title, details, start, end, completed) VALUES (?, ?, ?, ?, ?, ?)', [req.user.id, title, details || null, start || null, end || null, completed ? 1 : 0]);
  const event = await db.get('SELECT * FROM events WHERE id = ?', [result.lastID]);
  res.json(event);
});

// PUT /api/agenda/:id
router.put('/:id', auth, async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const { title, details, start, end, completed } = req.body;
  const existing = await db.get('SELECT * FROM events WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const completedValue = (typeof completed !== 'undefined') ? (completed ? 1 : 0) : existing.completed;

  await db.run('UPDATE events SET title = ?, details = ?, start = ?, end = ?, completed = ? WHERE id = ?', [title || existing.title, details || existing.details, start || existing.start, end || existing.end, completedValue, id]);
  const updated = await db.get('SELECT * FROM events WHERE id = ?', [id]);
  res.json(updated);
});

// DELETE /api/agenda/:id
router.delete('/:id', auth, async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const existing = await db.get('SELECT * FROM events WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  await db.run('DELETE FROM events WHERE id = ?', [id]);
  res.json({ success: true });
});

module.exports = router;
