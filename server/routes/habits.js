const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// GET /api/habits
router.get('/', auth, async (req, res) => {
  const db = req.app.locals.db;
  const habits = await db.all('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
  res.json(habits);
});

// POST /api/habits
router.post('/', auth, async (req, res) => {
  const db = req.app.locals.db;
  const { title, notes, frequency } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const result = await db.run('INSERT INTO habits (user_id, title, notes, frequency) VALUES (?, ?, ?, ?)', [req.user.id, title, notes || null, frequency || null]);
  const habit = await db.get('SELECT * FROM habits WHERE id = ?', [result.lastID]);
  res.json(habit);
});

// PUT /api/habits/:id
router.put('/:id', auth, async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const { title, notes, frequency } = req.body;
  const existing = await db.get('SELECT * FROM habits WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  await db.run('UPDATE habits SET title = ?, notes = ?, frequency = ? WHERE id = ?', [title || existing.title, notes || existing.notes, frequency || existing.frequency, id]);
  const updated = await db.get('SELECT * FROM habits WHERE id = ?', [id]);
  res.json(updated);
});

// DELETE /api/habits/:id
router.delete('/:id', auth, async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const existing = await db.get('SELECT * FROM habits WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  await db.run('DELETE FROM habits WHERE id = ?', [id]);
  res.json({ success: true });
});

module.exports = router;
