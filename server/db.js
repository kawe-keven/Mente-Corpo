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

    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      categoria TEXT NOT NULL,
      descricao TEXT,
      imagem TEXT,
      tipo TEXT DEFAULT 'artigo',
      autor TEXT,
      url TEXT,
      likes INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS content_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(content_id) REFERENCES content(id) ON DELETE CASCADE,
      UNIQUE(user_id, content_id)
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

  // Seed initial content data if table is empty
  try {
    const count = await db.get("SELECT COUNT(*) as count FROM content");
    if (count.count === 0) {
      console.log('📚 Inserindo conteúdos iniciais...');
      
      const initialContent = [
        {
          titulo: 'Câncer de Próstata: Prevenção e Diagnóstico Precoce',
          categoria: 'saude',
          descricao: 'Entenda a importância do exame de PSA e toque retal para detecção precoce do câncer de próstata, principal câncer entre homens.',
          imagem: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=250&fit=crop',
          tipo: 'artigo',
          autor: 'Dr. Marcos Silva - Urologista'
        },
        {
          titulo: 'Testosterona: Sinais de Deficiência e Tratamentos',
          categoria: 'saude',
          descricao: 'Conheça os sintomas da baixa testosterona, quando procurar ajuda médica e as opções de tratamento disponíveis.',
          imagem: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=250&fit=crop',
          tipo: 'artigo',
          autor: 'Dr. Pedro Santos - Endocrinologista'
        },
        {
          titulo: 'Treino de Força Após os 40: Construindo Massa Muscular',
          categoria: 'fitness',
          descricao: 'Protocolo específico de musculação para homens acima de 40 anos, focando em ganho de massa e prevenção de lesões.',
          imagem: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=250&fit=crop',
          tipo: 'video',
          autor: 'Prof. Carlos Mendes - Ed. Física'
        },
        {
          titulo: 'Saúde Mental Masculina: Rompendo o Silêncio',
          categoria: 'mental',
          descricao: 'A importância de buscar ajuda psicológica. Dados mostram que homens buscam 50% menos ajuda que mulheres para questões emocionais.',
          imagem: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=250&fit=crop',
          tipo: 'artigo',
          autor: 'Psic. Roberto Alves'
        },
        {
          titulo: 'Dieta para Hipertrofia Masculina',
          categoria: 'nutricao',
          descricao: 'Plano alimentar completo com cálculo de macros, horários de refeições e suplementação para ganho de massa muscular.',
          imagem: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=250&fit=crop',
          tipo: 'artigo',
          autor: 'Nutr. João Ferreira'
        },
        {
          titulo: 'Disfunção Erétil: Causas e Tratamentos Modernos',
          categoria: 'saude',
          descricao: 'Abordagem médica sobre as causas físicas e psicológicas da disfunção erétil e os tratamentos mais eficazes disponíveis.',
          imagem: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400&h=250&fit=crop',
          tipo: 'artigo',
          autor: 'Dr. André Costa - Urologista'
        },
        {
          titulo: 'Depressão em Homens: Sintomas Diferentes',
          categoria: 'mental',
          descricao: 'Como a depressão se manifesta diferentemente em homens: irritabilidade, agressividade e comportamentos de risco.',
          imagem: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop',
          tipo: 'video',
          autor: 'Dr. Luís Martins - Psiquiatra'
        },
        {
          titulo: 'HIIT para Queima de Gordura Abdominal',
          categoria: 'fitness',
          descricao: 'Treino intervalado de alta intensidade focado na redução da gordura visceral, fator de risco para doenças cardíacas.',
          imagem: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=250&fit=crop',
          tipo: 'video',
          autor: 'Prof. Ricardo Lima'
        },
        {
          titulo: 'Calvície Masculina: Tratamentos Comprovados',
          categoria: 'estilo',
          descricao: 'Opções baseadas em evidências científicas: minoxidil, finasterida e transplante capilar. O que realmente funciona.',
          imagem: 'https://images.unsplash.com/photo-1622296089863-eb7fc0daa1e1?w=400&h=250&fit=crop',
          tipo: 'artigo',
          autor: 'Dr. Felipe Rocha - Dermatologista'
        },
        {
          titulo: 'Suplementação Essencial para Homens',
          categoria: 'nutricao',
          descricao: 'Vitamina D, Ômega-3, Zinco e Magnésio: suplementos com evidências científicas para saúde masculina.',
          imagem: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=400&h=250&fit=crop',
          tipo: 'artigo',
          autor: 'Nutr. Marcos Oliveira'
        },
        {
          titulo: 'Saúde Cardiovascular: Exercícios Preventivos',
          categoria: 'fitness',
          descricao: 'Protocolo de exercícios aeróbicos e anaeróbicos para prevenção de infartos e AVC, principais causas de morte em homens.',
          imagem: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&h=250&fit=crop',
          tipo: 'video',
          autor: 'Dr. Tiago Cardoso - Cardiologista'
        },
        {
          titulo: 'Gerenciamento de Estresse no Trabalho',
          categoria: 'mental',
          descricao: 'Técnicas práticas de mindfulness e gestão de tempo para reduzir o estresse ocupacional e prevenir burnout.',
          imagem: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=250&fit=crop',
          tipo: 'artigo',
          autor: 'Psic. Fernando Dias'
        },
        {
          titulo: 'Alimentação Anti-inflamatória para Homens',
          categoria: 'nutricao',
          descricao: 'Como reduzir inflamações crônicas através da dieta, prevenindo doenças cardiovasculares e articulares.',
          imagem: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=250&fit=crop',
          tipo: 'artigo',
          autor: 'Nutr. Gabriel Costa'
        },
        {
          titulo: 'Sono de Qualidade: Impacto na Testosterona',
          categoria: 'estilo',
          descricao: 'A relação entre privação de sono e queda nos níveis de testosterona. Estratégias para melhorar a qualidade do sono.',
          imagem: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=250&fit=crop',
          tipo: 'video',
          autor: 'Dr. Alexandre Nunes'
        },
        {
          titulo: 'Cuidados com a Pele Masculina',
          categoria: 'estilo',
          descricao: 'Rotina básica de skincare para homens: proteção solar, hidratação e prevenção do envelhecimento precoce.',
          imagem: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=250&fit=crop',
          tipo: 'artigo',
          autor: 'Dr. Renato Souza - Dermatologista'
        }
      ];

      for (const content of initialContent) {
        await db.run(
          `INSERT INTO content (titulo, categoria, descricao, imagem, tipo, autor) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [content.titulo, content.categoria, content.descricao, content.imagem, content.tipo, content.autor]
        );
      }
      
      console.log('✅ Conteúdos iniciais inseridos com sucesso!');
    }
  } catch (err) {
    console.warn('Erro ao inserir conteúdos iniciais:', err.message || err);
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