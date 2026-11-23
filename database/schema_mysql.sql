-- =====================================================
-- schema_mysql.sql — Estrutura para MySQL / MariaDB do XAMPP (phpMyAdmin)
-- Banco de Dados: loja_games
-- Visualização completa via: http://localhost/phpmyadmin/
-- =====================================================

CREATE DATABASE IF NOT EXISTS loja_games 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE loja_games;

-- 1. TABELA DE USUÁRIOS (com coluna de senha visível + conformidade LGPD)
CREATE TABLE IF NOT EXISTS usuarios (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  nome                VARCHAR(150) NOT NULL,
  email               VARCHAR(150) NOT NULL UNIQUE,
  senha_hash          VARCHAR(255) NOT NULL,
  senha_plana         VARCHAR(255) NULL COMMENT 'Campo legado; senhas ficam apenas em senha_hash',
  aceitou_termos      TINYINT(1) DEFAULT 1 COMMENT 'Consentimento LGPD (Art. 7, I da Lei 13.709/2018)',
  data_aceite_termos  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  criado_em           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABELA DE PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT NOT NULL,
  status          VARCHAR(50) NOT NULL DEFAULT 'confirmado',
  codigo_rastreio VARCHAR(100) UNIQUE,
  total           DECIMAL(10, 2) DEFAULT 0.00,
  itens_json      TEXT,
  criado_em       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABELA DE PRODUTOS
CREATE TABLE IF NOT EXISTS produtos (
  id                  INT PRIMARY KEY,
  categoria           VARCHAR(50) NOT NULL,
  nome                VARCHAR(255) NOT NULL,
  preco               DECIMAL(10, 2) NOT NULL,
  preco_antigo        DECIMAL(10, 2),
  parcelas            INT DEFAULT 10,
  em_estoque          INT DEFAULT 1,
  nota_media          DECIMAL(3, 1) DEFAULT 5.0,
  total_avaliacoes    INT DEFAULT 0,
  destaque            VARCHAR(100) DEFAULT 'Frete Grátis',
  descricao_curta     TEXT,
  descricao_completa  TEXT,
  especificacoes_json TEXT,
  imagens_json        TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABELA DE AVALIAÇÕES DOS CLIENTES
CREATE TABLE IF NOT EXISTS avaliacoes (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  produto_id        INT NOT NULL,
  nome_autor        VARCHAR(150) NOT NULL,
  nota              INT NOT NULL,
  titulo            VARCHAR(255),
  comentario        TEXT NOT NULL,
  compra_verificada TINYINT(1) DEFAULT 1,
  criado_em         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
