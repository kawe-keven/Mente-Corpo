const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

async function initDb() {
  const dbPath = path.join(__dirname, 'data', 'database.db');
  // ensure folder
  const fs = require('fs');
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const db = await sqlite.open({ filename: dbPath, driver: sqlite3.Database });

  // create tables if not exist
  await db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      notes TEXT,
      frequency TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      details TEXT,
      start DATETIME,
      end DATETIME,
      completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Migration: ensure 'completed' column exists on existing databases
  try {
    const cols = await db.all("PRAGMA table_info('events')");
    const hasCompleted = cols.some(c => c.name === 'completed');
    if (!hasCompleted) {
      await db.run("ALTER TABLE events ADD COLUMN completed INTEGER DEFAULT 0");
      console.log('Migration: added events.completed column');
    }
  } catch (err) {
    console.warn('Could not run migration for events.completed:', err.message || err);
  }

  // =============================================
  // 🔐 SISTEMA DE AUTENTICAÇÃO - PARTE NOVA
  // =============================================
  
  // Função para criar usuário (REGISTRO)
  db.createUser = async (name, email, password) => {
    try {
      console.log(`📝 Tentando criar usuário: ${email}`);
      
      // Hash da senha com bcrypt
      const passwordHash = await bcrypt.hash(password, 12);
      
      // Inserir no banco
      const result = await db.run(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
        [name, email, passwordHash]
      );
      
      console.log(`✅ Usuário criado com ID: ${result.lastID}`);
      return { 
        success: true, 
        userId: result.lastID,
        message: 'Usuário criado com sucesso' 
      };
      
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error.message);
      
      if (error.message.includes('UNIQUE constraint failed')) {
        return { 
          success: false, 
          error: 'Este email já está cadastrado' 
        };
      }
      
      return { 
        success: false, 
        error: 'Erro ao criar usuário: ' + error.message 
      };
    }
  };

  // Função para verificar login
  db.verifyLogin = async (email, password) => {
    try {
      console.log(`🔐 Tentando login para: ${email}`);
      
      // Buscar usuário pelo email
      const user = await db.get(
        "SELECT id, name, email, password_hash FROM users WHERE email = ?",
        [email]
      );

      if (!user) {
        console.log('❌ Usuário não encontrado');
        return { 
          success: false, 
          error: 'Email não cadastrado' 
        };
      }

      // Verificar senha com bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        console.log('❌ Senha incorreta');
        return { 
          success: false, 
          error: 'Senha incorreta' 
        };
      }

      console.log(`✅ Login bem-sucedido para: ${user.name}`);
      return { 
        success: true, 
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      };
      
    } catch (error) {
      console.error('💥 Erro no login:', error.message);
      return { 
        success: false, 
        error: 'Erro interno no servidor' 
      };
    }
  };

  // Função para buscar usuário por ID (sem senha)
  db.getUserById = async (userId) => {
    return await db.get(
      "SELECT id, name, email, created_at FROM users WHERE id = ?",
      [userId]
    );
  };

  return db;
}

module.exports = { initDb };