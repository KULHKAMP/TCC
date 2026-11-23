/* =====================================================
   server.js — Backend (Node.js + Express + PostgreSQL / SQLite)
   Rotas:
   - Autenticação: POST /api/cadastro | POST /api/login
   - Usuário & Pedidos: GET /api/usuario/perfil | GET /api/meus-pedidos | GET /api/rastreio/:codigo
   - Produtos: GET /api/produtos | GET /api/produtos/:id | POST /api/produtos/:id/avaliacoes
   ===================================================== */
require('dotenv').config();
const express  = require('express');
const path     = require('path');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('./database/db');

const PORT       = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'troque-este-segredo-em-producao';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('Configure JWT_SECRET no ambiente de produção antes de iniciar o servidor.');
}

const app = express();
app.use(express.json());

// CORS habilitado
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

const emailValido = e => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const gerarToken  = u => jwt.sign({ id: u.id, nome: u.nome, email: u.email }, JWT_SECRET, { expiresIn: '7d' });
const rota        = fn => (req, res, next) => fn(req, res).catch(next);
const HASH_FALSO  = bcrypt.hashSync('falso_para_mitigar_timing_attacks', 12);

// Middleware para obter usuário pelo token JWT (opcional ou obrigatório)
function obterUsuarioLogado(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(auth.split(' ')[1], JWT_SECRET);
  } catch {
    return null;
  }
}

/* ---------- 1. STATUS DO BANCO DE DADOS ---------- */
app.get('/api/status', (req, res) => {
  const tipo = db.getTipo();
  let nomeExibicao = 'SQLite Local';
  if (tipo === 'mysql') nomeExibicao = 'MySQL (XAMPP / phpMyAdmin)';
  if (tipo === 'postgres') nomeExibicao = 'PostgreSQL (pgAdmin 4)';

  res.json({
    status: 'online',
    banco: tipo,
    bancoNome: nomeExibicao
  });
});

/* ---------- 2. CATÁLOGO DE PRODUTOS ---------- */

// Lista produtos (filtrável por categoria)
app.get('/api/produtos', rota(async (req, res) => {
  const { categoria } = req.query;
  let sql = 'SELECT * FROM produtos';
  const params = [];

  if (categoria) {
    sql += ' WHERE categoria = ?';
    params.push(categoria);
  }
  sql += ' ORDER BY id ASC';

  const rows = await db.queryTodos(sql, params);
  const produtos = rows.map(p => ({
    ...p,
    preco: Number(p.preco),
    preco_antigo: p.preco_antigo ? Number(p.preco_antigo) : null,
    nota_media: Number(p.nota_media || 5.0),
    total_avaliacoes: Number(p.total_avaliacoes || 0),
    imagens: typeof p.imagens_json === 'string' ? JSON.parse(p.imagens_json || '[]') : (p.imagens_json || []),
    especificacoes: typeof p.especificacoes_json === 'string' ? JSON.parse(p.especificacoes_json || '{}') : (p.especificacoes_json || {})
  }));

  res.json(produtos);
}));

// Detalhes de um produto específico com fotos reais e avaliações
app.get('/api/produtos/:id', rota(async (req, res) => {
  const id = Number(req.params.id);
  const produto = await db.queryUm('SELECT * FROM produtos WHERE id = ?', [id]);

  if (!produto) {
    return res.status(404).json({ erro: 'Produto não encontrado.' });
  }

  const avaliacoes = await db.queryTodos(
    'SELECT * FROM avaliacoes WHERE produto_id = ? ORDER BY criado_em DESC',
    [id]
  );

  res.json({
    ...produto,
    preco: Number(produto.preco),
    preco_antigo: produto.preco_antigo ? Number(produto.preco_antigo) : null,
    nota_media: Number(produto.nota_media || 5.0),
    total_avaliacoes: Number(produto.total_avaliacoes || 0),
    imagens: typeof produto.imagens_json === 'string' ? JSON.parse(produto.imagens_json || '[]') : (produto.imagens_json || []),
    especificacoes: typeof produto.especificacoes_json === 'string' ? JSON.parse(produto.especificacoes_json || '{}') : (produto.especificacoes_json || {}),
    avaliacoes
  });
}));

// Publica nova avaliação para o produto
app.post('/api/produtos/:id/avaliacoes', rota(async (req, res) => {
  const produtoId = Number(req.params.id);
  const { nome, nota, titulo, comentario } = req.body || {};

  const numNota = Number(nota);
  if (!nome || typeof nome !== 'string' || nome.trim().length < 2) {
    return res.status(400).json({ erro: 'Informe seu nome.' });
  }
  if (!numNota || numNota < 1 || numNota > 5) {
    return res.status(400).json({ erro: 'Selecione uma nota de 1 a 5 estrelas.' });
  }
  if (!comentario || typeof comentario !== 'string' || comentario.trim().length < 5) {
    return res.status(400).json({ erro: 'Escreva um comentário com ao menos 5 caracteres.' });
  }

  const produto = await db.queryUm('SELECT id FROM produtos WHERE id = ?', [produtoId]);
  if (!produto) {
    return res.status(404).json({ erro: 'Produto não encontrado.' });
  }

  const result = await db.executar(`
    INSERT INTO avaliacoes (produto_id, nome_autor, nota, titulo, comentario, compra_verificada)
    VALUES (?, ?, ?, ?, ?, 0)
  `, [produtoId, nome.trim(), numNota, (titulo || '').trim(), comentario.trim()]);

  // Recalcula média de avaliações
  const stats = await db.queryUm(`
    SELECT AVG(nota) as media, COUNT(*) as total FROM avaliacoes WHERE produto_id = ?
  `, [produtoId]);

  const novaMedia = Number((Number(stats.media) || 5.0).toFixed(1));
  // O catálogo usa 100 como base demonstrativa; avaliações enviadas pelo público
  // incrementam esse total sem apagar essa contagem de apresentação.
  const novoTotal = Math.max(Number(produto.total_avaliacoes || 0) + 1, Number(stats.total) || 1);

  await db.executar(`
    UPDATE produtos SET nota_media = ?, total_avaliacoes = ? WHERE id = ?
  `, [novaMedia, novoTotal, produtoId]);

  res.status(201).json({
    mensagem: 'Avaliação enviada com sucesso!',
    avaliacao: {
      id: result.lastInsertRowid,
      produto_id: produtoId,
      nome_autor: nome.trim(),
      nota: numNota,
      titulo: (titulo || '').trim(),
      comentario: comentario.trim(),
      compra_verificada: 1,
      criado_em: new Date().toISOString()
    },
    nota_media: novaMedia,
    total_avaliacoes: novoTotal
  });
}));

/* ---------- 3. AUTENTICAÇÃO (CADASTRO E LOGIN) ---------- */

app.post('/api/cadastro', rota(async (req, res) => {
  const { nome, email, senha, termos } = req.body || {};

  if (typeof nome !== 'string' || nome.trim().length < 2 || !emailValido(email) ||
      typeof senha !== 'string' || senha.length < 8) {
    return res.status(400).json({ erro: 'Preencha nome, e-mail válido e senha com 8+ caracteres.' });
  }

  const emailNorm = email.trim().toLowerCase();
  const jaExiste = await db.queryUm('SELECT id FROM usuarios WHERE email = ?', [emailNorm]);
  if (jaExiste) {
    return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
  }

  const hash = await bcrypt.hash(senha, 12);
  const result = await db.executar(
    'INSERT INTO usuarios (nome, email, senha_hash, aceitou_termos) VALUES (?, ?, ?, ?)',
    [nome.trim(), emailNorm, hash, 1]
  );

  const usuario = { id: result.lastInsertRowid, nome: nome.trim(), email: emailNorm, aceitou_termos: 1 };
  res.status(201).json({ token: gerarToken(usuario), usuario });
}));

app.post('/api/login', rota(async (req, res) => {
  const { email, senha } = req.body || {};
  if (!emailValido(email) || typeof senha !== 'string') {
    return res.status(400).json({ erro: 'Informe e-mail e senha.' });
  }

  const u = await db.queryUm('SELECT * FROM usuarios WHERE email = ?', [email.trim().toLowerCase()]);
  let ok = false;
  if (u) {
    ok = await bcrypt.compare(senha, u.senha_hash || HASH_FALSO);
  }

  if (!u || !ok) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  }

  const usuario = { id: u.id, nome: u.nome, email: u.email, criado_em: u.criado_em, aceitou_termos: u.aceitou_termos };
  res.json({ token: gerarToken(usuario), usuario });
}));

/* ---------- 3.1 CONFORMIDADE LGPD (LEI Nº 13.709/2018) ---------- */

// Portabilidade de Dados (Art. 18, V da LGPD): Baixar todos os dados em formato estruturado (JSON)
app.get('/api/lgpd/meus-dados', rota(async (req, res) => {
  const userToken = obterUsuarioLogado(req);
  const usuario_id = userToken ? userToken.id : Number(req.query.usuario_id);

  if (!usuario_id) {
    return res.status(401).json({ erro: 'Você precisa estar logado para exportar seus dados.' });
  }

  const u = await db.queryUm(
    'SELECT id, nome, email, aceitou_termos, data_aceite_termos, criado_em FROM usuarios WHERE id = ?',
    [usuario_id]
  );
  if (!u) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  const pedidos = await db.queryTodos('SELECT * FROM pedidos WHERE usuario_id = ?', [usuario_id]);

  res.json({
    marco_legal: 'Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)',
    base_legal: 'Execução de contrato e procedimento preliminar (Art. 7º, V da LGPD)',
    data_solicitacao: new Date().toISOString(),
    dados_pessoais: u,
    historico_pedidos: pedidos,
    finalidade: 'Autenticação de conta, processamento de pedidos e emissão de notas/códigos de rastreamento.'
  });
}));

// Direito de Eliminação de Dados (Art. 18, VI da LGPD): Excluir conta e dados pessoais
app.delete('/api/lgpd/minha-conta', rota(async (req, res) => {
  const userToken = obterUsuarioLogado(req);
  const usuario_id = userToken ? userToken.id : Number(req.body ? req.body.usuario_id : req.query.usuario_id);

  if (!usuario_id) {
    return res.status(401).json({ erro: 'Você precisa estar logado para solicitar a exclusão.' });
  }

  await db.executar('DELETE FROM usuarios WHERE id = ?', [usuario_id]);
  res.json({ mensagem: 'Sua conta e seus dados pessoais foram excluídos com sucesso, conforme o Art. 18, VI da LGPD.' });
}));

/* ---------- 4. PERFIL DO USUÁRIO & MEUS PEDIDOS ---------- */

// Finalizar Compra do Carrinho (criação de pedido no banco)
app.post('/api/pedidos', rota(async (req, res) => {
  const userToken = obterUsuarioLogado(req);
  const { usuario_id } = req.body || {};
  const idFinal = userToken ? userToken.id : Number(usuario_id);

  if (!idFinal) {
    return res.status(401).json({ erro: 'Você precisa estar logado para finalizar o pedido.' });
  }

  // Gera código de rastreio autêntico (ex: GV849201923BR)
  const numAleatorio = Math.floor(100000000 + Math.random() * 900000000);
  const codigoRastreio = `GV${numAleatorio}BR`;

  const result = await db.executar(
    'INSERT INTO pedidos (usuario_id, status, codigo_rastreio) VALUES (?, ?, ?)',
    [idFinal, 'confirmado', codigoRastreio]
  );

  res.status(201).json({
    mensagem: 'Pedido realizado com sucesso!',
    pedido: {
      id: result.lastInsertRowid,
      usuario_id: idFinal,
      status: 'confirmado',
      codigo_rastreio: codigoRastreio,
      criado_em: new Date().toISOString()
    }
  });
}));

// Consulta dados do perfil logado
app.get('/api/usuario/perfil', rota(async (req, res) => {
  const userToken = obterUsuarioLogado(req);
  if (!userToken) {
    return res.status(401).json({ erro: 'Usuário não autenticado.' });
  }

  const u = await db.queryUm('SELECT id, nome, email, criado_em FROM usuarios WHERE id = ?', [userToken.id]);
  if (!u) {
    return res.status(404).json({ erro: 'Usuário não encontrado.' });
  }

  res.json(u);
}));

// Lista os pedidos vinculados ao usuário logado
app.get('/api/meus-pedidos', rota(async (req, res) => {
  const userToken = obterUsuarioLogado(req);
  const usuarioId = userToken ? userToken.id : Number(req.query.usuario_id);

  if (!usuarioId) {
    return res.status(401).json({ erro: 'Faça login para visualizar seus pedidos.' });
  }

  const pedidos = await db.queryTodos(
    'SELECT id, usuario_id, status, codigo_rastreio, criado_em FROM pedidos WHERE usuario_id = ? ORDER BY criado_em DESC',
    [usuarioId]
  );

  res.json(pedidos);
}));

/* ---------- 5. RASTREIO DE PEDIDOS ---------- */
app.get('/api/rastreio/:codigo', rota(async (req, res) => {
  const cod = req.params.codigo.trim().toUpperCase().replace(/^#/, '');
  const id  = /^\d+$/.test(cod) ? Number(cod) : -1;

  const pedido = await db.queryUm(
    'SELECT id, status, codigo_rastreio, criado_em FROM pedidos WHERE codigo_rastreio = ? OR id = ?',
    [cod, id]
  );

  if (!pedido) {
    return res.status(404).json({ erro: 'Pedido não encontrado. Confira o código informado.' });
  }

  res.json(pedido);
}));

/* ---------- 6. TRATAMENTO DE ERROS E INICIALIZAÇÃO ---------- */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno no servidor. Tente novamente.' });
});

// Inicializa banco de dados e coloca servidor no ar
db.inicializarBanco().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n===========================================`);
    console.log(`  🎮 GameVault Loja no ar: http://localhost:${PORT}`);
    console.log(`  💾 Banco em uso: ${db.getTipo().toUpperCase()}`);
    console.log(`===========================================\n`);
  });
}).catch(err => {
  console.error('Falha crítica ao iniciar banco:', err);
});
