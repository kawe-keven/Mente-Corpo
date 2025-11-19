const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// GET /api/content - Buscar todos os conteúdos
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { categoria, busca } = req.query;
    
    let query = 'SELECT * FROM content WHERE 1=1';
    const params = [];
    
    if (categoria && categoria !== 'todos') {
      query += ' AND categoria = ?';
      params.push(categoria);
    }
    
    if (busca) {
      query += ' AND (titulo LIKE ? OR descricao LIKE ?)';
      const searchTerm = `%${busca}%`;
      params.push(searchTerm, searchTerm);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const conteudos = await db.all(query, params);
    res.json(conteudos);
  } catch (error) {
    console.error('Erro ao buscar conteúdos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/content/:id - Buscar conteúdo específico
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    const conteudo = await db.get('SELECT * FROM content WHERE id = ?', [id]);
    
    if (!conteudo) {
      return res.status(404).json({ error: 'Conteúdo não encontrado' });
    }
    
    // Incrementar visualizações
    await db.run('UPDATE content SET views = views + 1 WHERE id = ?', [id]);
    
    res.json(conteudo);
  } catch (error) {
    console.error('Erro ao buscar conteúdo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/content - Criar novo conteúdo (admin apenas - simplificado)
router.post('/', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { titulo, categoria, descricao, imagem, tipo, autor, url } = req.body;
    
    if (!titulo || titulo.trim() === '') {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }
    
    if (!categoria) {
      return res.status(400).json({ error: 'Categoria é obrigatória' });
    }
    
    const validCategories = ['saude', 'fitness', 'nutricao', 'mental', 'estilo'];
    if (!validCategories.includes(categoria)) {
      return res.status(400).json({ error: 'Categoria inválida' });
    }
    
    const validTypes = ['artigo', 'video'];
    if (tipo && !validTypes.includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido' });
    }
    
    const result = await db.run(
      `INSERT INTO content (titulo, categoria, descricao, imagem, tipo, autor, url) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        titulo.trim(),
        categoria,
        descricao ? descricao.trim() : null,
        imagem || null,
        tipo || 'artigo',
        autor || null,
        url || null
      ]
    );
    
    const conteudo = await db.get('SELECT * FROM content WHERE id = ?', [result.lastID]);
    res.status(201).json(conteudo);
  } catch (error) {
    console.error('Erro ao criar conteúdo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/content/:id - Atualizar conteúdo
router.put('/:id', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { titulo, categoria, descricao, imagem, tipo, autor, url } = req.body;
    
    const existing = await db.get('SELECT * FROM content WHERE id = ?', [id]);
    
    if (!existing) {
      return res.status(404).json({ error: 'Conteúdo não encontrado' });
    }
    
    await db.run(
      `UPDATE content 
       SET titulo = ?, categoria = ?, descricao = ?, imagem = ?, tipo = ?, autor = ?, url = ?
       WHERE id = ?`,
      [
        titulo || existing.titulo,
        categoria || existing.categoria,
        descricao !== undefined ? descricao : existing.descricao,
        imagem !== undefined ? imagem : existing.imagem,
        tipo || existing.tipo,
        autor !== undefined ? autor : existing.autor,
        url !== undefined ? url : existing.url,
        id
      ]
    );
    
    const updated = await db.get('SELECT * FROM content WHERE id = ?', [id]);
    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar conteúdo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/content/:id - Deletar conteúdo
router.delete('/:id', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    const existing = await db.get('SELECT * FROM content WHERE id = ?', [id]);
    
    if (!existing) {
      return res.status(404).json({ error: 'Conteúdo não encontrado' });
    }
    
    await db.run('DELETE FROM content WHERE id = ?', [id]);
    
    res.json({ message: 'Conteúdo deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar conteúdo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/content/:id/like - Curtir/descurtir conteúdo
router.post('/:id/like', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const userId = req.user.id;
    
    const conteudo = await db.get('SELECT * FROM content WHERE id = ?', [id]);
    
    if (!conteudo) {
      return res.status(404).json({ error: 'Conteúdo não encontrado' });
    }
    
    // Verificar se já curtiu
    const existing = await db.get(
      'SELECT * FROM content_likes WHERE user_id = ? AND content_id = ?',
      [userId, id]
    );
    
    if (existing) {
      // Remover curtida
      await db.run('DELETE FROM content_likes WHERE user_id = ? AND content_id = ?', [userId, id]);
      await db.run('UPDATE content SET likes = likes - 1 WHERE id = ?', [id]);
      res.json({ liked: false, message: 'Curtida removida' });
    } else {
      // Adicionar curtida
      await db.run('INSERT INTO content_likes (user_id, content_id) VALUES (?, ?)', [userId, id]);
      await db.run('UPDATE content SET likes = likes + 1 WHERE id = ?', [id]);
      res.json({ liked: true, message: 'Conteúdo curtido' });
    }
  } catch (error) {
    console.error('Erro ao curtir conteúdo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/content/:id/liked - Verificar se usuário curtiu
router.get('/:id/liked', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const userId = req.user.id;
    
    const liked = await db.get(
      'SELECT * FROM content_likes WHERE user_id = ? AND content_id = ?',
      [userId, id]
    );
    
    res.json({ liked: !!liked });
  } catch (error) {
    console.error('Erro ao verificar curtida:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
