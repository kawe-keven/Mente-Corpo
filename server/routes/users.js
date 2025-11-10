const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const auth = require('../middleware/auth');

// GET /api/users/me
router.get('/me', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const user = await db.get(
      'SELECT id, name, email, created_at FROM users WHERE id = ?', 
      [req.user.id]
    );
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/users/me - Atualizar perfil
router.put('/me', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, email, currentPassword, newPassword } = req.body;
    
    // Buscar usuário atual
    const currentUser = await db.get(
      'SELECT * FROM users WHERE id = ?', 
      [req.user.id]
    );
    
    if (!currentUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const updates = {};
    const params = [];
    
    // Atualizar nome se fornecido
    if (name !== undefined) {
      if (name.trim() === '') {
        return res.status(400).json({ error: 'Nome não pode estar vazio' });
      }
      if (name.length > 50) {
        return res.status(400).json({ error: 'Nome muito longo (máx. 50 caracteres)' });
      }
      updates.name = 'name = ?';
      params.push(name.trim());
    }
    
    // Atualizar email se fornecido
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Formato de email inválido' });
      }
      
      // Verificar se email já existe (excluindo o usuário atual)
      const existingUser = await db.get(
        'SELECT id FROM users WHERE email = ? AND id != ?', 
        [email.toLowerCase().trim(), req.user.id]
      );
      
      if (existingUser) {
        return res.status(400).json({ error: 'Email já está em uso' });
      }
      
      updates.email = 'email = ?';
      params.push(email.toLowerCase().trim());
    }
    
    // Atualizar senha se fornecida
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Senha atual é obrigatória para alterar a senha' });
      }
      
      // Verificar senha atual
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword, 
        currentUser.password_hash
      );
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Senha atual incorreta' });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
      }
      
      const newHash = await bcrypt.hash(newPassword, 12);
      updates.password = 'password_hash = ?';
      params.push(newHash);
    }
    
    // Se não há nada para atualizar
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nenhum dado para atualizar' });
    }
    
    // Construir e executar query
    const setClause = Object.values(updates).join(', ');
    params.push(req.user.id);
    
    await db.run(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      params
    );
    
    // Buscar usuário atualizado
    const updatedUser = await db.get(
      'SELECT id, name, email, created_at FROM users WHERE id = ?', 
      [req.user.id]
    );
    
    res.json({ 
      user: updatedUser,
      message: 'Perfil atualizado com sucesso' 
    });
    
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;