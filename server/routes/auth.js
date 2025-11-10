const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, email, password } = req.body;
    
    // Validações
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }
    
    if (name && name.length > 50) {
      return res.status(400).json({ error: 'Nome muito longo (máx. 50 caracteres)' });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await db.run(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name ? name.trim() : null, email.toLowerCase().trim(), hash]
    );
    
    const user = await db.get(
      'SELECT id, name, email, created_at FROM users WHERE id = ?', 
      [result.lastID]
    );
    
    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      SECRET, 
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ 
      user, 
      token,
      message: 'Usuário criado com sucesso' 
    });
  } catch (err) {
    console.error('Erro no registro:', err);
    
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    const user = await db.get(
      'SELECT id, name, email, password_hash FROM users WHERE email = ?', 
      [email.toLowerCase().trim()]
    );
    
    if (!user) {
      // Simular tempo de verificação para prevenir timing attacks
      await bcrypt.compare(password, '$2b$12$fakeHashForTimingAttackPrevention');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const ok = await bcrypt.compare(password, user.password_hash);
    
    if (!ok) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email 
      }, 
      token,
      message: 'Login realizado com sucesso'
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Função auxiliar para validar email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = router;