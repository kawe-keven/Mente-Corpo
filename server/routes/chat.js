const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// GET /api/chat - list recent messages
router.get('/', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const messages = await db.all(`
      SELECT m.id, m.content, m.created_at, m.user_id, u.name as user_name
      FROM messages m
      JOIN users u ON u.id = m.user_id
      ORDER BY m.created_at DESC
      LIMIT 100
    `);
    
    res.json(messages.reverse());
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/chat - create message
router.post('/', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Conteúdo da mensagem é obrigatório' });
    }
    
    if (content.length > 500) {
      return res.status(400).json({ error: 'Mensagem muito longa (máx. 500 caracteres)' });
    }

    const result = await db.run(
      'INSERT INTO messages (user_id, content) VALUES (?, ?)', 
      [req.user.id, content.trim()]
    );
    
    const message = await db.get(
      `SELECT m.id, m.content, m.created_at, m.user_id, u.name as user_name 
       FROM messages m 
       JOIN users u ON u.id = m.user_id 
       WHERE m.id = ?`, 
      [result.lastID]
    );
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Erro ao criar mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/chat/:id - delete message (apenas própria mensagem)
router.delete('/:id', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const message = await db.get(
      'SELECT * FROM messages WHERE id = ? AND user_id = ?', 
      [id, req.user.id]
    );
    
    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }
    
    await db.run('DELETE FROM messages WHERE id = ?', [id]);
    res.json({ success: true, message: 'Mensagem excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;