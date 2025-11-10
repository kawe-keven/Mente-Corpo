const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// GET /api/habits
router.get('/', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const habits = await db.all(
      'SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC', 
      [req.user.id]
    );
    res.json(habits);
  } catch (error) {
    console.error('Erro ao buscar hábitos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/habits
router.post('/', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { title, notes, frequency } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }
    
    if (title.length > 100) {
      return res.status(400).json({ error: 'Título muito longo (máx. 100 caracteres)' });
    }
    
    if (notes && notes.length > 500) {
      return res.status(400).json({ error: 'Notas muito longas (máx. 500 caracteres)' });
    }
    
    // Validar frequency se fornecida
    const validFrequencies = ['daily', 'weekly', 'monthly', 'custom', null];
    if (frequency && !validFrequencies.includes(frequency)) {
      return res.status(400).json({ error: 'Frequência inválida' });
    }

    const result = await db.run(
      'INSERT INTO habits (user_id, title, notes, frequency) VALUES (?, ?, ?, ?)', 
      [
        req.user.id, 
        title.trim(), 
        notes ? notes.trim() : null, 
        frequency || null
      ]
    );
    
    const habit = await db.get('SELECT * FROM habits WHERE id = ?', [result.lastID]);
    res.status(201).json(habit);
  } catch (error) {
    console.error('Erro ao criar hábito:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/habits/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { title, notes, frequency } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const existing = await db.get(
      'SELECT * FROM habits WHERE id = ? AND user_id = ?', 
      [id, req.user.id]
    );
    
    if (!existing) {
      return res.status(404).json({ error: 'Hábito não encontrado' });
    }
    
    // Validações
    if (title && title.trim() === '') {
      return res.status(400).json({ error: 'Título não pode estar vazio' });
    }
    
    if (title && title.length > 100) {
      return res.status(400).json({ error: 'Título muito longo (máx. 100 caracteres)' });
    }
    
    if (notes && notes.length > 500) {
      return res.status(400).json({ error: 'Notas muito longas (máx. 500 caracteres)' });
    }
    
    const validFrequencies = ['daily', 'weekly', 'monthly', 'custom', null];
    if (frequency && !validFrequencies.includes(frequency)) {
      return res.status(400).json({ error: 'Frequência inválida' });
    }

    await db.run(
      'UPDATE habits SET title = ?, notes = ?, frequency = ? WHERE id = ?', 
      [
        title ? title.trim() : existing.title,
        notes !== undefined ? (notes ? notes.trim() : null) : existing.notes,
        frequency !== undefined ? frequency : existing.frequency,
        id
      ]
    );
    
    const updated = await db.get('SELECT * FROM habits WHERE id = ?', [id]);
    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar hábito:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/habits/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const existing = await db.get(
      'SELECT * FROM habits WHERE id = ? AND user_id = ?', 
      [id, req.user.id]
    );
    
    if (!existing) {
      return res.status(404).json({ error: 'Hábito não encontrado' });
    }
    
    await db.run('DELETE FROM habits WHERE id = ?', [id]);
    res.json({ success: true, message: 'Hábito excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir hábito:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;