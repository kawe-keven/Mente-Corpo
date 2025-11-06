const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const habitsRoutes = require('./routes/habits');
const agendaRoutes = require('./routes/agenda');
const chatRoutes = require('./routes/chat');

const PORT = process.env.PORT || 4000;

(async () => {
  const app = express();
  app.use(express.json());
  app.use(cors());

  // init DB and share via app.locals
  const db = await initDb();
  app.locals.db = db;

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/habits', habitsRoutes);
  app.use('/api/agenda', agendaRoutes);
  app.use('/api/chat', chatRoutes);

  // Serve frontend (mvp/) under the /mvp path so existing absolute links work
  const mvpPath = path.join(__dirname, '..', 'mvp');
  app.use('/mvp', express.static(mvpPath));

  // Redirect root to the app welcome page
  app.get('/', (req, res) => {
    res.redirect('/mvp/inicio/inicio.html');
  });

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
})();
