-- =====================================================
-- schema.sql — Estrutura do banco (SQLite)
-- Executado automaticamente pelo server.js ao iniciar.
-- =====================================================

-- 1. USUÁRIOS: a senha NUNCA é salva em texto puro, apenas o hash (bcrypt)
CREATE TABLE IF NOT EXISTS usuarios (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,          -- UNIQUE impede e-mails duplicados
  senha_hash TEXT NOT NULL,
  criado_em  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. PEDIDOS: cada pedido pertence a um usuário e tem 4 status possíveis
CREATE TABLE IF NOT EXISTS pedidos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,   -- número do pedido
  usuario_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'confirmado'
                  CHECK (status IN ('confirmado', 'separacao', 'enviado', 'entregue')),
  codigo_rastreio TEXT UNIQUE,                         -- preenchido quando o pedido é postado
  criado_em       DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índice para acelerar a busca por código de rastreio
CREATE INDEX IF NOT EXISTS idx_pedidos_rastreio ON pedidos(codigo_rastreio);

-- 3. PRODUTOS: catálogo detalhado com fotos reais, especificações e estoque
CREATE TABLE IF NOT EXISTS produtos (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  categoria           TEXT NOT NULL,
  nome                TEXT NOT NULL,
  preco               REAL NOT NULL,
  preco_antigo        REAL,
  parcelas            INTEGER DEFAULT 10,
  em_estoque          INTEGER DEFAULT 1,
  nota_media          REAL DEFAULT 5.0,
  total_avaliacoes    INTEGER DEFAULT 0,
  destaque            TEXT DEFAULT 'Frete Grátis',
  descricao_curta     TEXT,
  descricao_completa  TEXT,
  especificacoes_json TEXT, -- JSON com atributos técnicos
  imagens_json        TEXT  -- JSON com URLs das fotos reais
);

-- 4. AVALIAÇÕES: comentários e notas dos clientes para cada produto
CREATE TABLE IF NOT EXISTS avaliacoes (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id        INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  nome_autor        TEXT NOT NULL,
  nota              INTEGER NOT NULL CHECK(nota BETWEEN 1 AND 5),
  titulo            TEXT,
  comentario        TEXT NOT NULL,
  compra_verificada INTEGER DEFAULT 1,
  criado_em         DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_produto ON avaliacoes(produto_id);

