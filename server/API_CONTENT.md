# API de Conteúdo Masculino

## Endpoints

### GET /api/content
Buscar todos os conteúdos com filtros opcionais.

**Query Parameters:**
- `categoria` (opcional): Filtrar por categoria (saude, fitness, nutricao, mental, estilo)
- `busca` (opcional): Buscar por texto no título ou descrição

**Exemplo:**
```
GET /api/content?categoria=saude&busca=próstata
```

**Response:**
```json
[
  {
    "id": 1,
    "titulo": "Câncer de Próstata: Prevenção e Diagnóstico Precoce",
    "categoria": "saude",
    "descricao": "Entenda a importância do exame...",
    "imagem": "https://...",
    "tipo": "artigo",
    "autor": "Dr. Marcos Silva",
    "url": null,
    "likes": 0,
    "views": 0,
    "created_at": "2025-11-19..."
  }
]
```

---

### GET /api/content/:id
Buscar conteúdo específico por ID. Incrementa automaticamente o contador de visualizações.

**Exemplo:**
```
GET /api/content/1
```

**Response:**
```json
{
  "id": 1,
  "titulo": "Câncer de Próstata: Prevenção e Diagnóstico Precoce",
  "categoria": "saude",
  "descricao": "Entenda a importância do exame...",
  "imagem": "https://...",
  "tipo": "artigo",
  "autor": "Dr. Marcos Silva",
  "url": null,
  "likes": 0,
  "views": 1,
  "created_at": "2025-11-19..."
}
```

---

### POST /api/content
Criar novo conteúdo (requer autenticação).

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "titulo": "Novo Artigo de Saúde",
  "categoria": "saude",
  "descricao": "Descrição do conteúdo",
  "imagem": "https://...",
  "tipo": "artigo",
  "autor": "Dr. Nome do Autor",
  "url": "https://link-do-conteudo.com"
}
```

**Response:**
```json
{
  "id": 16,
  "titulo": "Novo Artigo de Saúde",
  "categoria": "saude",
  ...
}
```

---

### PUT /api/content/:id
Atualizar conteúdo existente (requer autenticação).

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "titulo": "Título Atualizado",
  "descricao": "Nova descrição"
}
```

---

### DELETE /api/content/:id
Deletar conteúdo (requer autenticação).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Conteúdo deletado com sucesso"
}
```

---

### POST /api/content/:id/like
Curtir ou descurtir conteúdo (requer autenticação).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "liked": true,
  "message": "Conteúdo curtido"
}
```
ou
```json
{
  "liked": false,
  "message": "Curtida removida"
}
```

---

### GET /api/content/:id/liked
Verificar se o usuário curtiu determinado conteúdo (requer autenticação).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "liked": true
}
```

---

## Estrutura do Banco de Dados

### Tabela: content
```sql
CREATE TABLE content (
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
```

### Tabela: content_likes
```sql
CREATE TABLE content_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(content_id) REFERENCES content(id) ON DELETE CASCADE,
  UNIQUE(user_id, content_id)
);
```

## Categorias Válidas
- `saude` - Saúde
- `fitness` - Fitness
- `nutricao` - Nutrição
- `mental` - Saúde Mental
- `estilo` - Estilo de Vida

## Tipos de Conteúdo
- `artigo` - Artigo escrito
- `video` - Vídeo

## Dados Iniciais
O banco de dados é automaticamente populado com 15 conteúdos iniciais sobre saúde masculina quando criado pela primeira vez.
