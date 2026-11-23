-- =====================================================
-- schema_postgres.sql — Estrutura para PostgreSQL (pgAdmin 4)
-- Banco de dados: TCC | Usuário: postgres
-- =====================================================

-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS usuarios (
  id             SERIAL PRIMARY KEY,
  nome           VARCHAR(150) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  senha_hash     VARCHAR(255) NOT NULL,
  senha_plana    VARCHAR(255),
  aceitou_termos INTEGER DEFAULT 1,
  criado_em      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
  id              SERIAL PRIMARY KEY,
  usuario_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  status          VARCHAR(50) NOT NULL DEFAULT 'confirmado',
  codigo_rastreio VARCHAR(100) UNIQUE,
  criado_em       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pedidos_rastreio ON pedidos(codigo_rastreio);

-- 3. TABELA DE PRODUTOS (com fotos reais, especificações e estoque)
CREATE TABLE IF NOT EXISTS produtos (
  id                  SERIAL PRIMARY KEY,
  categoria           VARCHAR(50) NOT NULL,
  nome                VARCHAR(255) NOT NULL,
  preco               NUMERIC(10, 2) NOT NULL,
  preco_antigo        NUMERIC(10, 2),
  parcelas            INTEGER DEFAULT 10,
  em_estoque          INTEGER DEFAULT 1,
  nota_media          NUMERIC(3, 1) DEFAULT 5.0,
  total_avaliacoes    INTEGER DEFAULT 0,
  destaque            VARCHAR(100) DEFAULT 'Frete Grátis',
  descricao_curta     TEXT,
  descricao_completa  TEXT,
  especificacoes_json TEXT,
  imagens_json        TEXT
);

-- 4. TABELA DE AVALIAÇÕES DOS CLIENTES
CREATE TABLE IF NOT EXISTS avaliacoes (
  id                SERIAL PRIMARY KEY,
  produto_id        INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  nome_autor        VARCHAR(150) NOT NULL,
  nota              INTEGER NOT NULL CHECK(nota BETWEEN 1 AND 5),
  titulo            VARCHAR(255),
  comentario        TEXT NOT NULL,
  compra_verificada INTEGER DEFAULT 1,
  criado_em         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_produto ON avaliacoes(produto_id);
