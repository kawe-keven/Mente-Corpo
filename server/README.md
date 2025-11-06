# Mente-Corpo - Backend

Backend mínimo para a aplicação Mente-Corpo.

Stack: Node.js + Express + SQLite

Setup (Windows / PowerShell):

1. Ir para a pasta `server`:

```powershell
cd server
```

2. Instalar dependências:

```powershell
npm install
```

3. Rodar em desenvolvimento (nodemon):

```powershell
npm run dev
```

A API ficará disponível em `http://localhost:4000`.

Principais endpoints (JSON):

- POST /api/auth/register  { name, email, password }
- POST /api/auth/login     { email, password } -> { user, token }
- GET  /api/users/me       (Authorization: Bearer <token>)

- GET  /api/habits         (authed)
- POST /api/habits         (authed) { title, notes?, frequency? }
- PUT  /api/habits/:id     (authed)
- DELETE /api/habits/:id   (authed)

- GET /api/agenda          (authed)
- POST /api/agenda         (authed) { title, details?, start?, end? }
- PUT /api/agenda/:id      (authed)
- DELETE /api/agenda/:id   (authed)

- GET /api/chat            (authed)
- POST /api/chat           (authed) { content }

Observações:
- Em desenvolvimento o JWT secret padrão é `dev_secret`. Para produção, setar a variável de ambiente `JWT_SECRET`.
- O banco SQLite é criado em `server/data/database.db` automaticamente.

Próximos passos recomendados:
- Adaptar chamadas do frontend para consumir os endpoints (ex.: `fetch('/api/auth/login', ...)`).
- Melhorar validação de entrada e tratamento de erros.
- Considerar usar migrations (knex/migrate) para projetos maiores.
