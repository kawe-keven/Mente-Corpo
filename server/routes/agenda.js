const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// GET /api/agenda
router.get('/', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const events = await db.all(
      'SELECT * FROM events WHERE user_id = ? ORDER BY start ASC', 
      [req.user.id]
    );
    
    // Converter completed de número para boolean
    const eventsWithBool = events.map(event => ({
      ...event,
      completed: Boolean(event.completed)
    }));
    
    res.json(eventsWithBool);
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/agenda
router.post('/', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { title, details, start, end, completed } = req.body;
    
    // Validações
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }
    
    if (title.length > 100) {
      return res.status(400).json({ error: 'Título muito longo (máx. 100 caracteres)' });
    }
    
    // Validar datas
    if (start && isNaN(new Date(start).getTime())) {
      return res.status(400).json({ error: 'Data de início inválida' });
    }
    
    if (end && isNaN(new Date(end).getTime())) {
      return res.status(400).json({ error: 'Data de fim inválida' });
    }
    
    // Validar se end é depois de start
    if (start && end && new Date(end) < new Date(start)) {
      return res.status(400).json({ error: 'Data de fim não pode ser anterior à data de início' });
    }

    const result = await db.run(
      'INSERT INTO events (user_id, title, details, start, end, completed) VALUES (?, ?, ?, ?, ?, ?)', 
      [
        req.user.id, 
        title.trim(), 
        details ? details.trim() : null, 
        start || null, 
        end || null, 
        completed ? 1 : 0
      ]
    );
    
    const event = await db.get('SELECT * FROM events WHERE id = ?', [result.lastID]);
    
    // Converter completed para boolean
    event.completed = Boolean(event.completed);
    
    res.status(201).json(event);
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/agenda/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { title, details, start, end, completed } = req.body;
    
    // Validar ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Verificar se evento existe e pertence ao usuário
    const existing = await db.get(
      'SELECT * FROM events WHERE id = ? AND user_id = ?', 
      [id, req.user.id]
    );
    
    if (!existing) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    
    // Validações dos dados
    if (title && title.trim() === '') {
      return res.status(400).json({ error: 'Título não pode estar vazio' });
    }
    
    if (title && title.length > 100) {
      return res.status(400).json({ error: 'Título muito longo (máx. 100 caracteres)' });
    }
    
    // Validar datas
    if (start && isNaN(new Date(start).getTime())) {
      return res.status(400).json({ error: 'Data de início inválida' });
    }
    
    if (end && isNaN(new Date(end).getTime())) {
      return res.status(400).json({ error: 'Data de fim inválida' });
    }
    
    if (start && end && new Date(end) < new Date(start)) {
      return res.status(400).json({ error: 'Data de fim não pode ser anterior à data de início' });
    }

    const completedValue = (typeof completed !== 'undefined') ? (completed ? 1 : 0) : existing.completed;

    await db.run(
      'UPDATE events SET title = ?, details = ?, start = ?, end = ?, completed = ? WHERE id = ?', 
      [
        title ? title.trim() : existing.title,
        details !== undefined ? (details ? details.trim() : null) : existing.details,
        start || existing.start,
        end || existing.end,
        completedValue,
        id
      ]
    );
    
    const updated = await db.get('SELECT * FROM events WHERE id = ?', [id]);
    updated.completed = Boolean(updated.completed);
    
    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/agenda/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    console.log('🗑️ DELETE /api/agenda/:id - ID:', id, 'User:', req.user.id);
    
    // Validar ID
    if (!id || isNaN(parseInt(id))) {
      console.log('❌ ID inválido:', id);
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const existing = await db.get(
      'SELECT * FROM events WHERE id = ? AND user_id = ?', 
      [id, req.user.id]
    );
    
    console.log('📋 Evento existente:', existing);
    
    if (!existing) {
      console.log('❌ Evento não encontrado - ID:', id, 'User:', req.user.id);
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    
    await db.run('DELETE FROM events WHERE id = ?', [id]);
    console.log('✅ Evento excluído com sucesso - ID:', id);
    res.json({ success: true, message: 'Evento excluído com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao excluir evento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;