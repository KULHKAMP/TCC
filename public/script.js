/* =====================================================
   script.js — Lógica do front-end (GameVault)
   Compatível com todas as páginas (Home, Consoles, Jogos, Acessórios, Carrinho, Produto, Login, Rastreio)
   ===================================================== */

/* ---------- 1. MENU HAMBÚRGUER ---------- */
const btnMenu = document.getElementById('btn-menu');
const menu    = document.getElementById('menu');

if (btnMenu && menu) {
  function alternarMenu(forcar) {
    const aberto = menu.classList.toggle('aberto', forcar);
    btnMenu.classList.toggle('aberto', aberto);
    btnMenu.setAttribute('aria-expanded', aberto);
  }
  btnMenu.addEventListener('click', () => alternarMenu());
  menu.addEventListener('click', e => { if (e.target.tagName === 'A') alternarMenu(false); });
}

/* ---------- 2. CARRINHO (LocalStorage) ---------- */
let carrinho = [];
try { carrinho = JSON.parse(localStorage.getItem('carrinho')) || []; } catch {}

const contador = document.getElementById('contador-carrinho');
const atualizarContador = () => {
  if (contador) contador.textContent = carrinho.length;
};
atualizarContador();

// Requisito: Precisa estar logado para adicionar ao carrinho!
function adicionarAoCarrinho(id, qtd = 1, nome = 'Produto') {
  const token = localStorage.getItem('token');
  if (!token) {
    mostrarModalLoginObrigatorio(nome);
    return;
  }

  for (let i = 0; i < qtd; i++) {
    carrinho.push(Number(id));
  }
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  atualizarContador();
  mostrarToast(`🎮 ${nome} adicionado ao carrinho! (${qtd}x)`);

  // Se já estiver na página de carrinho, atualiza a exibição
  if (document.getElementById('carrinho-conteudo')) {
    renderizarPaginaCarrinho();
  }
}

// Modal quando usuário não logado tenta adicionar ao carrinho
function mostrarModalLoginObrigatorio(nomeProduto) {
  let modal = document.getElementById('modal-login-obrigatorio');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-login-obrigatorio';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card" style="text-align: center; max-width: 440px;">
      <span style="font-size: 3rem; display: block; margin-bottom: 10px;">🔒</span>
      <h2 style="color: var(--ciano); margin-bottom: 8px;">Login Necessário</h2>
      <p style="color: var(--suave); font-size: 0.95rem; margin-bottom: 20px;">
        Você precisa estar conectado à sua conta para adicionar <strong>${nomeProduto}</strong> ao seu carrinho.
      </p>
      <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        <a href="login.html" class="btn" style="flex: 1; min-width: 140px;">Fazer Login</a>
        <button type="button" class="btn btn-secundario" id="btn-fechar-modal-login" style="flex: 1; min-width: 140px;">Continuar Olhando</button>
      </div>
    </div>
  `;

  modal.hidden = false;
  modal.querySelector('#btn-fechar-modal-login').addEventListener('click', () => modal.hidden = true);
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });
}

/* ---------- 3. NOTIFICAÇÃO FLUTUANTE (Toast) ---------- */
function mostrarToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => { toast.hidden = true; }, 3200);
}

/* ---------- 4. FORMATADOR DE MOEDA E ROTA DA API ---------- */
const moeda = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Em produção, o Express entrega o site e a API no mesmo domínio. Para um
// frontend hospedado separadamente, GAMEVAULT_API_BASE pode apontar para a API.
const API_BASE = window.GAMEVAULT_API_BASE || (
  location.port === '3000' || !['localhost', '127.0.0.1'].includes(location.hostname)
    ? '/api'
    : 'http://localhost:3000/api'
);

/* ---------- 5. BASE DE DADOS LOCAL COM 20 PRODUTOS REAIS ---------- */
const PRODUTOS_LOCAIS = [
  // CONSOLES (6)
  {
    id: 1, categoria: 'consoles', nome: 'PlayStation 5 Slim 1TB Edition', preco: 3899.90, preco_antigo: 4499.00, destaque: 'Mais Vendido', nota_media: 4.9, total_avaliacoes: 142,
    descricao_curta: 'Console PlayStation 5 Slim com leitor de Blu-ray Ultra HD, SSD ultrarrápido de 1TB e controle sem fio DualSense com feedback háptico.',
    descricao_completa: 'Experimente carregamento ultrarrápido no SSD de 1TB, áudio 3D imersivo e taxas de até 120 FPS com Ray Tracing.',
    especificacoes: { "Armazenamento": "1TB SSD NVMe", "Resolução": "4K 120Hz / 8K", "Garantia": "12 meses Sony Brasil" },
    imagens: [
      "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 2, categoria: 'consoles', nome: 'Nintendo Switch OLED 64GB Neon', preco: 2299.00, preco_antigo: 2699.00, destaque: 'Frete Grátis', nota_media: 4.8, total_avaliacoes: 98,
    descricao_curta: 'Tela OLED vibrante de 7 polegadas com cores vívidas e alto contraste, suporte ajustável amplo, base com porta LAN com fio e 64GB de memória.',
    descricao_completa: 'Jogue na TV ou em qualquer lugar com a tela OLED vibrante de 7 polegadas do modelo Nintendo Switch OLED.',
    especificacoes: { "Tela": "7.0 polegadas OLED", "Armazenamento": "64GB interno", "Bateria": "4.5 a 9 horas" },
    imagens: [
      "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1612287266632-29904dd3315b?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 3, categoria: 'consoles', nome: 'Xbox Series X 1TB Black', preco: 4199.00, preco_antigo: 4799.00, destaque: '12 TFLOPS', nota_media: 4.9, total_avaliacoes: 84,
    descricao_curta: 'O console mais rápido e poderoso de todos os tempos. Jogue milhares de títulos com 12 Teraflops de processamento e Quick Resume.',
    descricao_completa: 'Potência gráfica incomparável em 4K nativo a 120 FPS com Xbox Velocity Architecture.',
    especificacoes: { "GPU": "12 TFLOPS RDNA 2", "Armazenamento": "1TB SSD NVMe", "Memória": "16GB GDDR6" },
    imagens: [
      "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 4, categoria: 'consoles', nome: 'PlayStation 5 Pro 2TB Edition', preco: 6499.00, preco_antigo: 6999.00, destaque: 'Lançamento Pro', nota_media: 5.0, total_avaliacoes: 42,
    descricao_curta: 'O console mais avançado da PlayStation com tecnologia PSSR de inteligência artificial, Ray Tracing avançado e 2TB de SSD ultrarrápido.',
    descricao_completa: 'PlayStation Spectral Super Resolution para 60 FPS estáveis com Ray Tracing no máximo.',
    especificacoes: { "Armazenamento": "2TB SSD NVMe", "Tecnologia": "PSSR AI Upscaling e Wi-Fi 7" },
    imagens: [
      "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 5, categoria: 'consoles', nome: 'Xbox Series S 512GB All-Digital', preco: 2499.00, preco_antigo: 2899.00, destaque: 'Custo-Benefício', nota_media: 4.8, total_avaliacoes: 110,
    descricao_curta: 'Desempenho de nova geração no menor chassi de Xbox de todos os tempos. Totalmente digital, rápido e compacto com Quick Resume.',
    descricao_completa: 'A melhor porta de entrada para a nova geração. Compacto, rápido e silencioso.',
    especificacoes: { "Armazenamento": "512GB SSD NVMe", "Resolução": "1440p até 120 FPS" },
    imagens: [
      "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 6, categoria: 'consoles', nome: 'Steam Deck OLED 512GB Portátil Valve', preco: 4399.00, preco_antigo: 4899.00, destaque: 'PC Portátil Nº 1', nota_media: 4.9, total_avaliacoes: 64,
    descricao_curta: 'Toda a sua biblioteca de jogos da Steam na palma das mãos. Tela OLED HDR de 7.4 polegadas com taxa de atualização de 90Hz e bateria aprimorada.',
    descricao_completa: 'Leve seus jogos de PC favoritos para qualquer lugar com a tela OLED vibrante de 90Hz.',
    especificacoes: { "Tela": "7.4 polegadas OLED 90Hz", "Armazenamento": "512GB NVMe SSD" },
    imagens: [
      "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=1000&q=80"
    ]
  },

  // JOGOS (8)
  {
    id: 7, categoria: 'jogos', nome: 'Grand Theft Auto VI (GTA 6) — Edição Especial', preco: 349.90, preco_antigo: 399.90, destaque: 'Pré-Venda Mais Aguardada', nota_media: 5.0, total_avaliacoes: 480,
    descricao_curta: 'Retorne ao estado de Leonida e às ruas vibrantes e neon de Vice City na maior e mais imersiva evolução da franquia Grand Theft Auto.',
    descricao_completa: 'Acompanhe a história de Lucia e Jason em Vice City na maior revolução gráfica e de mundo aberto de todos os tempos.',
    especificacoes: { "Plataformas": "PS5, Xbox Series X/S", "Gênero": "Ação / Mundo Aberto", "Classificação": "18 anos" },
    imagens: [
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 8, categoria: 'jogos', nome: 'Elden Ring: Shadow of the Erdtree Edition', preco: 299.90, preco_antigo: 349.90, destaque: 'Jogo do Ano (GOTY)', nota_media: 4.9, total_avaliacoes: 310,
    descricao_curta: 'A obra-prima aclamada mundialmente de Hidetaka Miyazaki e George R.R. Martin. Inclui o jogo base completo e a colossal expansão Shadow of the Erdtree.',
    descricao_completa: 'Explore a Terra das Sombras com novos chefes, centenas de armas e magias no RPG do ano.',
    especificacoes: { "Plataformas": "PS5, PS4, Xbox Series X/S, PC", "Gênero": "RPG / Soulslike", "Classificação": "16 anos" },
    imagens: [
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 9, categoria: 'jogos', nome: 'God of War Ragnarök — Edição Completa', preco: 249.90, preco_antigo: 349.90, destaque: 'Dublagem 100% BR', nota_media: 4.9, total_avaliacoes: 265,
    descricao_curta: 'Embarque em uma jornada épica e comovente enquanto Kratos e Atreus lutam para manter seus laços e o destino dos Nove Reinos.',
    descricao_completa: 'Viaje pelos Nove Reinos e lute contra deuses nórdicos em uma narrativa inesquecível totalmente dublada em português.',
    especificacoes: { "Plataformas": "PS5, PS4, PC", "Gênero": "Ação / Aventura", "Classificação": "18 anos" },
    imagens: [
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 10, categoria: 'jogos', nome: 'EA SPORTS FC 25', preco: 279.90, preco_antigo: 359.90, destaque: 'Futebol Nº 1 do Mundo', nota_media: 4.7, total_avaliacoes: 190,
    descricao_curta: 'Mais de 19.000 atletas totalmente licenciados, 700 times, 120 estádios e a revolucionária tecnologia FC IQ para controle tático definitivo.',
    descricao_completa: 'Viva o futebol mais autêntico com o novo modo Rush 5x5 e táticas aprimoradas.',
    especificacoes: { "Plataformas": "PS5, PS4, Xbox, PC, Switch", "Gênero": "Esporte / Futebol", "Classificação": "Livre" },
    imagens: [
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 11, categoria: 'jogos', nome: 'The Last of Us Part I Remastered', preco: 229.90, preco_antigo: 299.90, destaque: 'Clássico Aclamado', nota_media: 4.9, total_avaliacoes: 210,
    descricao_curta: 'Reviva a inesquecível jornada de Joel e Ellie através dos Estados Unidos pós-pandêmico. Reconstruído do zero com fidelidade visual impressionante.',
    descricao_completa: 'A obra-prima cinematográfica da Naughty Dog recriada do zero com gráficos de ponta.',
    especificacoes: { "Plataformas": "PlayStation 5, PC", "Gênero": "Narrativa / Sobrevivência", "Classificação": "18 anos" },
    imagens: [
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 12, categoria: 'jogos', nome: 'Cyberpunk 2077: Ultimate Edition', preco: 199.90, preco_antigo: 279.90, destaque: 'Com Phantom Liberty', nota_media: 4.8, total_avaliacoes: 180,
    descricao_curta: 'Mergulhe em Night City como o mercenário cibernético V. Inclui o jogo base aprimorado e o aclamado thriller de espionagem Phantom Liberty.',
    descricao_completa: 'Explore a metrópole mais impressionante dos videogames com Ray Tracing e história densa.',
    especificacoes: { "Plataformas": "PS5, Xbox Series X/S, PC", "Gênero": "RPG Cyberpunk", "Classificação": "18 anos" },
    imagens: [
      "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 13, categoria: 'jogos', nome: 'Resident Evil 4 Remake — Gold Edition', preco: 219.90, preco_antigo: 269.90, destaque: 'Terror & Ação', nota_media: 4.9, total_avaliacoes: 145,
    descricao_curta: 'O clássico cult que redefiniu o gênero do survival horror, reimaginado com gráficos hiper-realistas na RE Engine e jogabilidade moderna.',
    descricao_completa: 'Acompanhe Leon S. Kennedy no resgate da filha do presidente em um vilarejo aterrorizante.',
    especificacoes: { "Plataformas": "PS5, PS4, Xbox Series, PC", "Gênero": "Survival Horror", "Classificação": "18 anos" },
    imagens: [
      "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 14, categoria: 'jogos', nome: "Marvel's Spider-Man 2 — PS5", preco: 259.90, preco_antigo: 349.90, destaque: 'Exclusivo PlayStation', nota_media: 4.9, total_avaliacoes: 230,
    descricao_curta: 'Alterne rapidamente entre Peter Parker e Miles Morales enfrentando a força descomunal de Venom e os Caçadores de Kraven por Nova York.',
    descricao_completa: 'Balance pela Nova York da Marvel com velocidade estonteante e o poder do traje simbionte.',
    especificacoes: { "Plataformas": "PlayStation 5", "Gênero": "Ação / Super-Herói", "Classificação": "12 anos" },
    imagens: [
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80"
    ]
  },

  // ACESSÓRIOS (6)
  {
    id: 15, categoria: 'acessorios', nome: 'Headset Gamer HyperX Cloud III Wireless', preco: 649.90, preco_antigo: 799.90, destaque: 'Bateria de 120 Horas', nota_media: 4.9, total_avaliacoes: 156,
    descricao_curta: 'Drivers angulados de 53mm, áudio espacial DTS Headphone:X, almofadas memory foam confortáveis e bateria monstruosa de até 120 horas.',
    descricao_completa: 'Conforto lendário HyperX com bateria para jogar semanas inteiras sem recarregar.',
    especificacoes: { "Drivers": "Neodímio de 53 mm", "Bateria": "120 horas", "Conexão": "Wireless 2.4GHz" },
    imagens: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 16, categoria: 'acessorios', nome: 'Controle Sony DualSense Sem Fio Midnight Black', preco: 429.90, preco_antigo: 499.90, destaque: 'Gatilhos Adaptáveis', nota_media: 4.9, total_avaliacoes: 204,
    descricao_curta: 'Feedback tátil imersivo, gatilhos dinâmicos adaptáveis com resistência variável e microfone embutido em um acabamento preto fosco elegante.',
    descricao_completa: 'Viva a ação nas palmas das mãos com os gatilhos com resistência adaptável do DualSense.',
    especificacoes: { "Conexão": "Bluetooth 5.1 e USB-C", "Compatibilidade": "PS5, PC, Mac, Celular" },
    imagens: [
      "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 17, categoria: 'acessorios', nome: 'Controle Xbox Wireless Controller Carbon Black', preco: 399.90, preco_antigo: 469.90, destaque: 'Mapeamento Personalizado', nota_media: 4.8, total_avaliacoes: 180,
    descricao_curta: 'Design esculpido com superfícies texturizadas antiderrapantes, botão Share dedicado e emparelhamento instantâneo com PC e consoles Xbox.',
    descricao_completa: 'A melhor ergonomia para jogar no PC e no Xbox com conectividade sem fio rápida.',
    especificacoes: { "Conectividade": "Xbox Wireless e Bluetooth", "Compatibilidade": "Xbox Series, One, PC" },
    imagens: [
      "https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 18, categoria: 'acessorios', nome: 'Teclado Mecânico Gamer Redragon Kumara RGB ABNT2', preco: 249.90, preco_antigo: 329.90, destaque: 'Formato Compacto TKL', nota_media: 4.8, total_avaliacoes: 220,
    descricao_curta: 'Switches mecânicos Outemu Blue com feedback tátil e audível, iluminação Chroma RGB configurável e layout padrão brasileiro ABNT2 com tecla Ç.',
    descricao_completa: 'Resistência de alta qualidade, teclas Double-Shot e switch mecânico veloz para jogos.',
    especificacoes: { "Formato": "TKL 80%", "Switches": "Outemu Blue Hot-Swap", "Padrão": "ABNT2 (com Ç)" },
    imagens: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 19, categoria: 'acessorios', nome: 'Mouse Gamer Logitech G502 HERO 25.600 DPI', preco: 289.90, preco_antigo: 379.90, destaque: 'Sensor HERO 25K', nota_media: 5.0, total_avaliacoes: 340,
    descricao_curta: 'Sensor óptico HERO 25K de precisão submícron, 11 botões programáveis, pesos internos ajustáveis e roda de rolagem hiperveloz.',
    descricao_completa: 'O mouse gamer mais consagrado do mundo com precisão 1:1 e peso ajustável.',
    especificacoes: { "Sensor": "HERO 25.600 DPI", "Botões": "11 programáveis", "Garantia": "2 anos Logitech" },
    imagens: [
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 20, categoria: 'acessorios', nome: 'Volante Gamer Logitech G29 Driving Force com Pedais', preco: 1799.00, preco_antigo: 2199.00, destaque: 'Force Feedback', nota_media: 4.9, total_avaliacoes: 85,
    descricao_curta: 'Volante com Force Feedback realista de dois motores, rotação de 900 graus, acabamento em couro costurado à mão e pedais em aço inoxidável.',
    descricao_completa: 'Imersão absoluta em simuladores de corrida com pedais em aço e Force Feedback com 2 motores.',
    especificacoes: { "Rotação": "900 graus", "Materiais": "Couro automotivo e aço", "Compatibilidade": "PS5, PS4, PC" },
    imagens: [
      "https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=1000&q=80"
    ]
  }
];

// Mantém o catálogo reserva alinhado às fotos reais dos modelos e edições anunciados.
const IMAGENS_PRODUTOS = {
  1: 'https://www.jib.co.th/img_master/product/original/2026011408550082892_2.png',
  2: 'https://images.tcdn.com.br/img/img_prod/1042771/console_nintendo_switch_oled_neon_azul_vermelho_64gb_hegskabaa_nintendo_2019_1_897d564ece62b522db2a8a383428c284.jpg',
  3: 'https://cdn.awsli.com.br/800x800/948/948792/produto/71168363/1-9ogq92ybgu.jpg',
  4: 'https://ennap.com/cdn/shop/files/PS5PRO-Hero-1.png',
  5: 'https://images.tcdn.com.br/img/img_prod/621461/console_xbox_series_s_512gb_branco_3663_2_bc86f6d1e608c481d91624840b3458e7.jpg',
  6: 'https://www.discoazul.co.uk/uploads/media/images/consola-portatil-steam-deck-oled-nvme-512-gb-1.jpg',
  7: 'https://bbpcdn.pstatic.gr/bpimg29/2m820R/1SOmGa_SX1024Y1024/1726058558/grand-theft-auto-vi-ps5.jpg',
  8: 'https://cdn11.bigcommerce.com/s-xs1cevxe43/images/stencil/1280x1280/attribute_rule_images/15980_source_1708536507.jpg',
  9: 'https://gameone.ph/media/catalog/product/mpiowebpcache/d378a0f20f83637cdb1392af8dc032a2/g/o/god-of-war-ragnarok-695121.11.webp',
  10: 'https://i5.walmartimages.com/seo/EA-Sports-FC-25-PlayStation-5-Physical_53cd7a88-728a-4db0-be0f-678bad2cb725.9e436d6a6c9e21c7dfe615bfe3f0d900.jpeg?odnBg=FFFFFF&odnHeight=768&odnWidth=768',
  11: 'https://i5.walmartimages.com/asr/5b6a11fd-d71f-4507-b8ed-9d582d7d0b7e.d144a2c0e4c4b12111946b75f2334f58.jpeg',
  12: 'https://carrefourbr.vtexassets.com/arquivos/ids/182804541/image-0.jpg?v=638730174113770000',
  13: 'https://www.librephonia.com/44522-thickbox_default/juego-resident-evil-4-gold-edition-para-playstation-5-ps5.jpg',
  14: 'https://a-static.mlcdn.com.br/800x800/jogo-marvel-spider-man-2-ps5-midia-fisica-pt-br-original-sony/bunkertech/so000103ps5/593db9a4ee927df4b02f1f33573fb268.jpeg',
  15: 'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/115/MTA-167789185/hyper_x_hyperx_cloud_iii_wireless_gaming_headset_-_black_red_full01_vblz6fhq.jpg',
  16: 'https://www.costco.com.mx/medias/sys_master/products/h4b/h3d/398628244652062.jpg',
  17: 'https://www.pbtech.com/imgprod/G/A/GAMMST2032__1.jpg',
  18: 'https://img.terabyteshop.com.br/produto/g/teclado-mecanico-gamer-redragon-kumara-k552-rgb-switch-red-abnt2-black-open-box_75055.png',
  19: 'https://resource.logitech.com/b_white/content/dam/gaming/en/non-braid/hyjal-g502-hero/g502-hero-gallery-2-nb.png',
  20: 'https://www.bhphotovideo.com/images/images1500x1500/logitech_941_000110_g29_driving_force_racing_1374569.jpg'
};
PRODUTOS_LOCAIS.forEach(produto => {
  if (IMAGENS_PRODUTOS[produto.id]) produto.imagens = [IMAGENS_PRODUTOS[produto.id]];
  produto.total_avaliacoes = 100;
  produto.avaliacoes = [
    { nome_autor: 'Marina Lopes', nota: 5, titulo: '[DEMO] Boa impressão', comentario: `Comentário fictício para apresentação de ${produto.nome}.`, compra_verificada: 0 },
    { nome_autor: 'Pedro Azevedo', nota: produto.id % 4 === 0 ? 4 : 5, titulo: '[DEMO] Avaliação demonstrativa', comentario: `Avaliação fictícia usada como exemplo para ${produto.nome}.`, compra_verificada: 0 }
  ];
});

function gerarEstrelasHtml(nota) {
  const cheias = Math.round(Number(nota) || 5);
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += i <= cheias ? '★' : '☆';
  }
  return html;
}

/* ---------- 6. GERENCIAMENTO DO USUÁRIO NO HEADER (PERFIL, PEDIDOS E LOGOUT) ---------- */
function configurarHeaderAuth() {
  const token = localStorage.getItem('token');
  const nomeUsuario = localStorage.getItem('usuario');
  const emailUsuario = localStorage.getItem('usuario_email') || 'usuario@gamevault.com';

  const acoesHeader = document.querySelector('.acoes');
  if (!acoesHeader) return;

  const antigo = document.getElementById('wrapper-auth');
  if (antigo) antigo.remove();
  const linkEstaticoLogin = acoesHeader.querySelector('a[href="login.html"]');
  if (linkEstaticoLogin) linkEstaticoLogin.remove();

  const containerAuth = document.createElement('div');
  containerAuth.id = 'wrapper-auth';

  if (token && nomeUsuario) {
    const primeiroNome = nomeUsuario.split(' ')[0];
    const inicial = primeiroNome[0].toUpperCase();

    containerAuth.innerHTML = `
      <div class="usuario-menu-wrapper" id="menu-usuario-wrapper">
        <button type="button" class="btn-usuario-header" id="btn-toggle-user" aria-haspopup="true" aria-expanded="false">
          <span class="avatar-header">${inicial}</span>
          <span class="nome-usuario-header">${primeiroNome}</span>
          <span class="seta-header">▼</span>
        </button>

        <div class="dropdown-usuario" id="dropdown-usuario-menu" hidden>
          <div class="dropdown-cabecalho">
            <strong>${nomeUsuario}</strong>
            <span>${emailUsuario}</span>
          </div>
          <div class="dropdown-divisor"></div>
          <button type="button" class="dropdown-item" id="btn-modal-perfil">
            👤 Meu Perfil
          </button>
          <button type="button" class="dropdown-item" id="btn-modal-pedidos">
            📦 Meus Pedidos
          </button>
          <div class="dropdown-divisor"></div>
          <button type="button" class="dropdown-item item-sair" id="btn-fazer-logout">
            🚪 Sair da conta
          </button>
        </div>
      </div>
    `;

    const hamburguer = acoesHeader.querySelector('.hamburguer');
    acoesHeader.insertBefore(containerAuth, hamburguer);

    const btnToggle = containerAuth.querySelector('#btn-toggle-user');
    const dropdown = containerAuth.querySelector('#dropdown-usuario-menu');
    const wrapper = containerAuth.querySelector('#menu-usuario-wrapper');

    btnToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const aberto = !dropdown.hidden;
      dropdown.hidden = aberto;
      wrapper.classList.toggle('aberto', !aberto);
    });

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        dropdown.hidden = true;
        wrapper.classList.remove('aberto');
      }
    });

    containerAuth.querySelector('#btn-modal-perfil').addEventListener('click', () => {
      dropdown.hidden = true;
      abrirModalPerfil(nomeUsuario, emailUsuario);
    });

    containerAuth.querySelector('#btn-modal-pedidos').addEventListener('click', () => {
      dropdown.hidden = true;
      abrirModalPedidos();
    });

    // Requisito: Quando deslogar, O CARRINHO CONTINUA no navegador!
    containerAuth.querySelector('#btn-fazer-logout').addEventListener('click', () => {
      dropdown.hidden = true;
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      localStorage.removeItem('usuario_id');
      localStorage.removeItem('usuario_email');
      // NOTA: localStorage.getItem('carrinho') continua intacto!
      mostrarToast('Você saiu da sua conta. Seus produtos continuam no carrinho!');
      configurarHeaderAuth();
      if (document.getElementById('carrinho-conteudo')) {
        renderizarPaginaCarrinho();
      }
    });

  } else {
    // Não logado: botão clássico de Entrar
    containerAuth.innerHTML = `
      <a href="login.html" class="icone-btn" aria-label="Entrar ou criar conta" title="Entrar na conta">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>
      </a>
    `;
    const hamburguer = acoesHeader.querySelector('.hamburguer');
    acoesHeader.insertBefore(containerAuth, hamburguer);
  }
}

// Modal Meu Perfil
function abrirModalPerfil(nome, email) {
  let modal = document.getElementById('modal-perfil');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-perfil';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  const inicial = (nome || 'U')[0].toUpperCase();
  const usuarioId = localStorage.getItem('usuario_id');

  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-cabecalho">
        <h2>Meu Perfil</h2>
        <button type="button" class="modal-fechar" id="fechar-modal-perfil">&times;</button>
      </div>
      <div class="perfil-avatar-bloco">
        <div class="perfil-avatar-grande">${inicial}</div>
        <div>
          <h3 style="color: var(--txt); font-size: 1.2rem;">${nome}</h3>
          <span style="color: var(--ok); font-size: 0.85rem;">🟢 Conta Ativa no GameVault</span>
        </div>
      </div>
      <div class="perfil-info-item">
        <div class="perfil-info-label">Nome Completo</div>
        <div class="perfil-info-valor">${nome}</div>
      </div>
      <div class="perfil-info-item">
        <div class="perfil-info-label">E-mail Cadastrado</div>
        <div class="perfil-info-valor">${email}</div>
      </div>
      <div class="perfil-info-item">
        <div class="perfil-info-label">Banco de Dados Ativo</div>
        <div class="perfil-info-valor" style="color: var(--ciano);">🐬 MySQL do XAMPP (phpMyAdmin)</div>
      </div>

      <!-- Bloco de Direitos do Titular LGPD (Lei nº 13.709/2018) -->
      <div class="bloco-lgpd-perfil">
        <h4>🛡️ Privacidade & Direitos LGPD (Lei 13.709/2018)</h4>
        <p>Consentimento ativo (Art. 7º, I). Você possui total controle sobre seus dados pessoais armazenados.</p>
        <div class="botoes-lgpd-acoes">
          <button type="button" class="btn-lgpd-acao" id="btn-exportar-dados-lgpd">
            📥 Exportar Meus Dados (JSON - Art. 18, V)
          </button>
          <button type="button" class="btn-lgpd-acao btn-excluir" id="btn-excluir-conta-lgpd">
            🗑️ Excluir Minha Conta (Art. 18, VI)
          </button>
        </div>
      </div>

      <button type="button" class="btn" style="margin-top: 14px;" id="fechar-modal-perfil-btn">Fechar</button>
    </div>
  `;

  modal.hidden = false;
  modal.querySelector('#fechar-modal-perfil').addEventListener('click', () => modal.hidden = true);
  modal.querySelector('#fechar-modal-perfil-btn').addEventListener('click', () => modal.hidden = true);
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });

  // LGPD: Exportar dados em JSON (Art. 18, V)
  modal.querySelector('#btn-exportar-dados-lgpd').addEventListener('click', async () => {
    try {
      mostrarToast('Gerando arquivo com seus dados pessoais...');
      const resp = await fetch(`${API_BASE}/lgpd/meus-dados?usuario_id=${usuarioId}`);
      if (!resp.ok) throw new Error('Não foi possível exportar os dados.');
      const dados = await resp.json();
      
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gamevault-dados-lgpd-${usuarioId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      mostrarToast('Download dos dados concluído com sucesso!');
    } catch (err) {
      mostrarToast(err.message || 'Erro ao exportar dados.');
    }
  });

  // LGPD: Solicitar Exclusão da Conta (Art. 18, VI)
  modal.querySelector('#btn-excluir-conta-lgpd').addEventListener('click', async () => {
    const confirmou = confirm('Atenção (LGPD Art. 18, VI):\n\nTem certeza que deseja excluir definitivamente sua conta e todos os dados associados?\nEsta ação não poderá ser desfeita.');
    if (!confirmou) return;

    try {
      const resp = await fetch(`${API_BASE}/lgpd/minha-conta`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuarioId })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.erro || 'Falha ao excluir conta.');

      modal.hidden = true;
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      localStorage.removeItem('usuario_id');
      localStorage.removeItem('usuario_email');
      mostrarToast('Sua conta foi excluída em conformidade com a LGPD.');
      setTimeout(() => { location.href = 'index.html'; }, 1200);
    } catch (err) {
      mostrarToast(err.message || 'Erro ao solicitar exclusão.');
    }
  });
}

// Modal Meus Pedidos
async function abrirModalPedidos() {
  let modal = document.getElementById('modal-pedidos');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-pedidos';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-cabecalho">
        <h2>Meus Pedidos</h2>
        <button type="button" class="modal-fechar" id="fechar-modal-pedidos">&times;</button>
      </div>
      <div id="conteudo-pedidos" class="pedidos-lista">
        <p class="suave" style="text-align: center; padding: 20px;">Buscando seus pedidos...</p>
      </div>
    </div>
  `;

  modal.hidden = false;
  modal.querySelector('#fechar-modal-pedidos').addEventListener('click', () => modal.hidden = true);
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });

  const containerPedidos = modal.querySelector('#conteudo-pedidos');
  const token = localStorage.getItem('token');
  const usuarioId = localStorage.getItem('usuario_id');

  let pedidos = [];
  try {
    const resp = await fetch(`${API_BASE}/meus-pedidos?usuario_id=${usuarioId || ''}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (resp.ok) pedidos = await resp.json();
  } catch {}

  if (!pedidos || pedidos.length === 0) {
    const pedidosLocais = JSON.parse(localStorage.getItem('pedidos_usuario') || '[]');
    pedidos = pedidosLocais;
  }

  if (pedidos.length === 0) {
    containerPedidos.innerHTML = `
      <div style="text-align: center; padding: 24px 10px;">
        <span style="font-size: 2.8rem;">📦</span>
        <h4 style="margin: 12px 0 6px; color: var(--txt);">Nenhum pedido realizado ainda</h4>
        <p style="color: var(--suave); font-size: 0.9rem; margin-bottom: 18px;">
          Adicione consoles, jogos e acessórios ao carrinho e conclua a compra para acompanhar a entrega!
        </p>
        <a href="index.html" class="btn" style="display: inline-block;">Ver Catálogo</a>
      </div>
    `;
    return;
  }

  containerPedidos.innerHTML = pedidos.map(p => {
    const dataObj = p.criado_em ? new Date(p.criado_em) : new Date();
    const dataFormatada = dataObj.toLocaleDateString('pt-BR');
    const demonstrativa = String(a.titulo || '').startsWith('[DEMO]');
    const tituloVisivel = String(a.titulo || '').replace(/^\[DEMO\]\s*/i, '');
    const codigo = p.codigo_rastreio || `GV${p.id}BR`;

    return `
      <div class="pedido-item-card">
        <div class="pedido-item-topo">
          <strong>Pedido #${p.id}</strong>
          <span class="pedido-status-badge">${p.status || 'Confirmado'}</span>
        </div>
        <div class="pedido-codigo-rastreio">
          <span>Rastreio: <strong>${codigo}</strong></span>
          <a href="rastreio.html?codigo=${encodeURIComponent(codigo)}" class="btn-rastrear-mini">
            Rastrear entrega &rarr;
          </a>
        </div>
        <div style="font-size: 0.8rem; color: var(--suave);">Realizado em: ${dataFormatada}</div>
      </div>
    `;
  }).join('');
}

configurarHeaderAuth();

/* ---------- 7. RENDERIZAÇÃO DO CATÁLOGO (Home e Páginas de Categoria) ---------- */
async function carregarCatalogo() {
  const grades = document.querySelectorAll('[data-categoria]');
  if (grades.length === 0) return;

  let produtos = PRODUTOS_LOCAIS;

  try {
    const resp = await fetch(`${API_BASE}/produtos`);
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        produtos = data;
      }
    }
  } catch (e) {}

  grades.forEach(grade => {
    const cat = grade.dataset.categoria;
    const prodsDaCategoria = produtos.filter(p => p.categoria === cat);

    grade.innerHTML = prodsDaCategoria.map(p => {
      const imgPrincipal = (p.imagens && p.imagens[0]) || '';
      const nota = Number(p.nota_media || 5.0);
      const total = Number(p.total_avaliacoes || 0);
      const precoDe = p.preco_antigo ? `<div class="preco-de">${moeda(p.preco_antigo)}</div>` : '';

      return `
        <article class="card produto" data-prod-id="${p.id}">
          <div class="produto-img-wrapper">
            ${p.destaque ? `<span class="tag-badge">${p.destaque}</span>` : ''}
            <img src="${imgPrincipal}" alt="${p.nome}" class="produto-img" loading="lazy" onerror="this.onerror=null;this.hidden=true;">
          </div>
          <div class="produto-info">
            <span class="produto-categoria-label">${p.categoria}</span>
            <h3>${p.nome}</h3>
            <div class="avaliacao-mini">
              <span class="estrelas-amarelas">${gerarEstrelasHtml(nota)}</span>
              <span class="nota-num">${nota.toFixed(1)}</span>
              <span class="total-num">(${total})</span>
            </div>
            <div class="preco-container">
              ${precoDe}
              <div class="preco">${moeda(p.preco)}</div>
              <div class="preco-condicao">à vista no Pix ou 10x sem juros</div>
            </div>
            <div class="produto-botoes">
              <button type="button" class="btn btn-add-cart" data-id="${p.id}" data-nome="${p.nome}">Adicionar ao carrinho</button>
              <a href="produto.html?id=${p.id}" class="btn-detalhes">Ver detalhes completos &rarr;</a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  });
}
carregarCatalogo();

document.addEventListener('click', e => {
  const btnAdd = e.target.closest('.btn-add-cart');
  if (btnAdd) {
    e.stopPropagation();
    adicionarAoCarrinho(btnAdd.dataset.id, 1, btnAdd.dataset.nome || 'Produto');
    return;
  }

  const card = e.target.closest('.produto[data-prod-id]');
  if (card && !e.target.closest('a') && !e.target.closest('button')) {
    const id = card.dataset.prodId;
    if (id) location.href = `produto.html?id=${id}`;
  }
});

/* ---------- 8. PÁGINA DO CARRINHO (carrinho.html) ---------- */
function renderizarPaginaCarrinho() {
  const containerConteudo = document.getElementById('carrinho-conteudo');
  const containerVazio = document.getElementById('carrinho-vazio');
  const listaItens = document.getElementById('lista-itens-carrinho');

  if (!containerConteudo || !containerVazio || !listaItens) return;

  if (carrinho.length === 0) {
    containerConteudo.hidden = true;
    containerVazio.hidden = false;
    return;
  }

  containerVazio.hidden = true;
  containerConteudo.hidden = false;

  // Agrupa produtos por ID e conta quantidades
  const contagem = {};
  carrinho.forEach(id => {
    contagem[id] = (contagem[id] || 0) + 1;
  });

  const idsUnicos = Object.keys(contagem).map(Number);
  let subtotalGeral = 0;

  listaItens.innerHTML = idsUnicos.map(id => {
    const prod = PRODUTOS_LOCAIS.find(p => p.id === id) || {
      id, nome: 'Produto GameVault', preco: 199.90, categoria: 'games',
      imagens: ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80']
    };

    const qtd = contagem[id];
    const subtotalItem = prod.preco * qtd;
    subtotalGeral += subtotalItem;

    return `
      <div class="carrinho-item" data-id="${prod.id}">
        <img src="${prod.imagens[0]}" alt="${prod.nome}" class="carrinho-item-img">
        <div class="carrinho-item-info">
          <span class="carrinho-item-cat">${prod.categoria}</span>
          <h4><a href="produto.html?id=${prod.id}">${prod.nome}</a></h4>
          <div class="carrinho-item-unit">${moeda(prod.preco)} cada</div>
        </div>

        <div class="carrinho-item-qtd">
          <button type="button" class="btn-qtd-menos" data-id="${prod.id}">−</button>
          <span>${qtd}</span>
          <button type="button" class="btn-qtd-mais" data-id="${prod.id}">+</button>
        </div>

        <div style="display: flex; align-items: center; gap: 12px; justify-content: flex-end;">
          <div class="carrinho-item-subtotal">${moeda(subtotalItem)}</div>
          <button type="button" class="btn-remover-item" data-id="${prod.id}" title="Remover item">🗑️</button>
        </div>
      </div>
    `;
  }).join('');

  // Resumo financeiro
  const descontoPix = subtotalGeral * 0.10;
  const totalPix = subtotalGeral - descontoPix;
  const valorParcela = (subtotalGeral / 10).toFixed(2);

  document.getElementById('resumo-qtd-itens').textContent = carrinho.length;
  document.getElementById('resumo-subtotal').textContent = moeda(subtotalGeral);
  document.getElementById('resumo-desconto').textContent = `- ${moeda(descontoPix)}`;
  document.getElementById('resumo-total-pix').textContent = moeda(totalPix);
  document.getElementById('resumo-parcelas').textContent = `ou em até 10x de ${moeda(valorParcela)} sem juros no cartão`;
}

// Eventos de clique dentro da página de carrinho
document.addEventListener('click', async e => {
  // Aumentar quantidade
  const btnMais = e.target.closest('.btn-qtd-mais');
  if (btnMais) {
    const id = Number(btnMais.dataset.id);
    carrinho.push(id);
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarContador();
    renderizarPaginaCarrinho();
    return;
  }

  // Diminuir quantidade
  const btnMenos = e.target.closest('.btn-qtd-menos');
  if (btnMenos) {
    const id = Number(btnMenos.dataset.id);
    const idx = carrinho.indexOf(id);
    if (idx !== -1) {
      carrinho.splice(idx, 1);
      localStorage.setItem('carrinho', JSON.stringify(carrinho));
      atualizarContador();
      renderizarPaginaCarrinho();
    }
    return;
  }

  // Remover item inteiro
  const btnRemover = e.target.closest('.btn-remover-item');
  if (btnRemover) {
    const id = Number(btnRemover.dataset.id);
    carrinho = carrinho.filter(item => item !== id);
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarContador();
    renderizarPaginaCarrinho();
    mostrarToast('Item removido do carrinho.');
    return;
  }

  // Limpar todo o carrinho
  const btnLimpar = e.target.closest('#btn-limpar-carrinho');
  if (btnLimpar) {
    if (confirm('Deseja realmente esvaziar seu carrinho?')) {
      carrinho = [];
      localStorage.setItem('carrinho', JSON.stringify(carrinho));
      atualizarContador();
      renderizarPaginaCarrinho();
      mostrarToast('Carrinho esvaziado.');
    }
    return;
  }

  // Finalizar Compra
  const btnFinalizar = e.target.closest('#btn-finalizar-pedido');
  if (btnFinalizar) {
    const token = localStorage.getItem('token');
    const usuarioId = localStorage.getItem('usuario_id');

    if (!token) {
      mostrarModalLoginObrigatorio('finalizar a sua compra');
      return;
    }

    if (carrinho.length === 0) return;

    btnFinalizar.disabled = true;
    btnFinalizar.textContent = 'Gravando pedido no banco...';

    try {
      const resp = await fetch(`${API_BASE}/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ usuario_id: usuarioId, itens: carrinho })
      });

      let json = null;
      try { json = await resp.json(); } catch {}

      const pedidoId = (json && json.pedido && json.pedido.id) ? json.pedido.id : Math.floor(100 + Math.random() * 900);
      const codigoRastreio = (json && json.pedido && json.pedido.codigo_rastreio) ? json.pedido.codigo_rastreio : `GV${Math.floor(100000000 + Math.random() * 900000000)}BR`;

      // Salva pedido no histórico local
      const pedidosLocais = JSON.parse(localStorage.getItem('pedidos_usuario') || '[]');
      pedidosLocais.unshift({
        id: pedidoId,
        status: 'confirmado',
        codigo_rastreio: codigoRastreio,
        criado_em: new Date().toISOString()
      });
      localStorage.setItem('pedidos_usuario', JSON.stringify(pedidosLocais));

      // Limpa carrinho após finalizar
      carrinho = [];
      localStorage.setItem('carrinho', JSON.stringify(carrinho));
      atualizarContador();

      // Exibe Modal de Sucesso
      const modalSucesso = document.getElementById('modal-sucesso-pedido');
      if (modalSucesso) {
        document.getElementById('sucesso-pedido-id').textContent = `#${pedidoId}`;
        document.getElementById('sucesso-codigo-rastreio').textContent = codigoRastreio;
        document.getElementById('link-rastrear-sucesso').href = `rastreio.html?codigo=${encodeURIComponent(codigoRastreio)}`;
        modalSucesso.hidden = false;
      } else {
        alert(`🎉 Compra realizada com sucesso!\nCódigo de rastreio: ${codigoRastreio}`);
        location.href = `rastreio.html?codigo=${encodeURIComponent(codigoRastreio)}`;
      }

    } catch (err) {
      alert('Erro ao processar pedido. Tente novamente.');
      btnFinalizar.disabled = false;
      btnFinalizar.textContent = 'Finalizar Compra';
    }
  }
});

renderizarPaginaCarrinho();

/* ---------- 9. PÁGINA DE DETALHES DO PRODUTO (produto.html) ---------- */
async function carregarPaginaProduto() {
  const container = document.getElementById('produto-detalhe');
  if (!container) return;

  const params = new URLSearchParams(location.search);
  const produtoId = Number(params.get('id')) || 1;

  let produto = null;

  try {
    const resp = await fetch(`${API_BASE}/produtos/${produtoId}`);
    if (resp.ok) produto = await resp.json();
  } catch (e) {}

  if (!produto) {
    produto = PRODUTOS_LOCAIS.find(p => p.id === produtoId) || PRODUTOS_LOCAIS[0];
  }

  const loading = document.getElementById('produto-loading');
  if (loading) loading.hidden = true;
  container.hidden = false;
  document.getElementById('abas-container').hidden = false;
  document.getElementById('secao-avaliacoes').hidden = false;
  document.getElementById('secao-relacionados').hidden = false;

  document.title = `${produto.nome} — GameVault`;

  document.getElementById('crumb-categoria').textContent = produto.categoria.toUpperCase();
  document.getElementById('crumb-nome').textContent = produto.nome;

  document.getElementById('prod-categoria').textContent = produto.categoria;
  document.getElementById('prod-nome').textContent = produto.nome;
  document.getElementById('prod-desc-curta').textContent = produto.descricao_curta || '';
  document.getElementById('prod-preco').textContent = moeda(produto.preco);

  if (produto.preco_antigo) {
    const elAntigo = document.getElementById('prod-preco-antigo');
    elAntigo.textContent = `De ${moeda(produto.preco_antigo)}`;
    elAntigo.hidden = false;
  }

  const valorParcela = (produto.preco / 10).toFixed(2);
  document.getElementById('prod-parcelas').textContent = `ou em até 10x de ${moeda(valorParcela)} sem juros no cartão`;

  const tagDestaque = document.getElementById('tag-destaque');
  if (tagDestaque) {
    if (produto.destaque) {
      tagDestaque.textContent = produto.destaque;
      tagDestaque.hidden = false;
    } else {
      tagDestaque.hidden = true;
    }
  }

  const imagens = (produto.imagens && produto.imagens.length > 0)
    ? produto.imagens
    : ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80'];

  const fotoPrincipal = document.getElementById('foto-principal');
  fotoPrincipal.src = imagens[0];
  fotoPrincipal.alt = produto.nome;

  const miniaturasLista = document.getElementById('miniaturas-lista');
  miniaturasLista.innerHTML = imagens.map((url, i) => `
    <div class="miniatura-item ${i === 0 ? 'ativa' : ''}" data-index="${i}">
      <img src="${url}" alt="Foto ${i + 1} de ${produto.nome}" loading="lazy">
    </div>
  `).join('');

  miniaturasLista.addEventListener('click', e => {
    const item = e.target.closest('.miniatura-item');
    if (!item) return;
    const idx = Number(item.dataset.index);
    fotoPrincipal.style.opacity = '0.4';
    setTimeout(() => {
      fotoPrincipal.src = imagens[idx];
      fotoPrincipal.style.opacity = '1';
    }, 120);
    miniaturasLista.querySelectorAll('.miniatura-item').forEach(m => m.classList.toggle('ativa', m === item));
  });

  let qtd = 1;
  const qtdInput = document.getElementById('qtd-input');
  document.getElementById('qtd-menos').addEventListener('click', () => {
    if (qtd > 1) { qtd--; qtdInput.value = qtd; }
  });
  document.getElementById('qtd-mais').addEventListener('click', () => {
    if (qtd < 99) { qtd++; qtdInput.value = qtd; }
  });

  document.getElementById('btn-add-carrinho').addEventListener('click', () => {
    adicionarAoCarrinho(produto.id, qtd, produto.nome);
  });

  const btnFrete = document.getElementById('btn-calc-frete');
  const cepInput = document.getElementById('cep-input');
  const freteResultado = document.getElementById('frete-resultado');

  cepInput.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5, 8);
    e.target.value = v;
  });

  btnFrete.addEventListener('click', () => {
    const cepLimpo = cepInput.value.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      alert('Por favor, informe um CEP válido com 8 dígitos.');
      return;
    }
    freteResultado.hidden = false;
  });

  document.getElementById('prod-desc-completa').textContent = produto.descricao_completa || produto.descricao_curta;

  const specsTabela = document.getElementById('specs-tabela-corpo');
  const specs = produto.especificacoes || {};
  specsTabela.innerHTML = Object.entries(specs).map(([chave, valor]) => `
    <tr>
      <td>${chave}</td>
      <td>${valor}</td>
    </tr>
  `).join('');

  document.querySelectorAll('.aba-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.aba-btn').forEach(b => b.classList.toggle('ativa', b === btn));
      document.querySelectorAll('.aba-conteudo').forEach(c => {
        c.hidden = c.id !== btn.dataset.secao;
        c.classList.toggle('ativo', c.id === btn.dataset.secao);
      });
    });
  });

  renderizarAvaliacoes(produto, produto.avaliacoes || []);
  configurarFormAvaliacao(produto);
  renderizarRelacionados(produto);
}

function renderizarAvaliacoes(produto, listaAvaliacoes) {
  const total = Math.max(Number(produto.total_avaliacoes) || 0, listaAvaliacoes.length);
  const soma = listaAvaliacoes.reduce((acc, a) => acc + Number(a.nota), 0);
  const media = Number(produto.nota_media) || (listaAvaliacoes.length > 0 ? Number((soma / listaAvaliacoes.length).toFixed(1)) : 5.0);

  document.getElementById('topo-estrelas').textContent = gerarEstrelasHtml(media);
  document.getElementById('topo-nota').textContent = media.toFixed(1);
  document.getElementById('topo-total-avaliacoes').textContent = `(${total} avaliaç${total === 1 ? 'ão' : 'ões'})`;

  document.getElementById('dash-nota').textContent = media.toFixed(1);
  document.getElementById('dash-estrelas').textContent = gerarEstrelasHtml(media);
  document.getElementById('dash-total').textContent = `${total} avaliações (inclui avaliações demonstrativas)`;

  const listaEl = document.getElementById('lista-avaliacoes');
  if (listaAvaliacoes.length === 0) {
    listaEl.innerHTML = '<p class="suave">Seja o primeiro a avaliar este produto!</p>';
    return;
  }

  listaEl.innerHTML = listaAvaliacoes.map(a => {
    const iniciais = (a.nome_autor || 'Cliente')
      .split(' ')
      .map(p => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const dataObj = a.criado_em ? new Date(a.criado_em) : new Date();
    const dataFormatada = dataObj.toLocaleDateString('pt-BR');

    return `
      <article class="card card-avaliacao">
        <div class="avaliacao-header">
          <div class="autor-info">
            <div class="autor-avatar">${iniciais}</div>
            <div>
              <span class="autor-nome">${a.nome_autor}</span>
              ${demonstrativa ? '<span class="selo-verificado">Avaliação demonstrativa</span>' : ''}
              ${a.compra_verificada ? '<span class="selo-verificado">✔ Compra Verificada</span>' : ''}
            </div>
          </div>
          <span class="avaliacao-data">${dataFormatada}</span>
        </div>
        <div class="estrelas-amarelas">${gerarEstrelasHtml(a.nota)}</div>
        ${tituloVisivel ? `<div class="avaliacao-titulo">${tituloVisivel}</div>` : ''}
        <p class="avaliacao-texto">${a.comentario}</p>
      </article>
    `;
  }).join('');
}

function configurarFormAvaliacao(produto) {
  const btnAbrir = document.getElementById('btn-abrir-form-aval');
  const btnCancelar = document.getElementById('btn-cancelar-aval');
  const form = document.getElementById('form-nova-avaliacao');
  if (!btnAbrir || !form) return;

  btnAbrir.addEventListener('click', () => {
    form.hidden = false;
    form.scrollIntoView({ behavior: 'smooth' });
  });

  btnCancelar.addEventListener('click', () => {
    form.hidden = true;
  });

  const estrelas = form.querySelectorAll('.estrela-item');
  const inputNota = document.getElementById('input-nota');

  function atualizarEstrelasVisuais(valor) {
    estrelas.forEach(star => {
      const v = Number(star.dataset.valor);
      star.classList.toggle('ativa', v <= valor);
    });
  }

  estrelas.forEach(star => {
    star.addEventListener('click', () => {
      const valor = Number(star.dataset.valor);
      inputNota.value = valor;
      atualizarEstrelasVisuais(valor);
    });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const nome = document.getElementById('aval-nome').value.trim();
    const titulo = document.getElementById('aval-titulo').value.trim();
    const comentario = document.getElementById('aval-comentario').value.trim();
    const nota = Number(inputNota.value) || 5;

    if (!nome || !comentario) {
      alert('Por favor, preencha seu nome e o comentário da avaliação.');
      return;
    }

    const novaAvaliacao = {
      nome_autor: nome,
      nota,
      titulo,
      comentario,
      compra_verificada: 0,
      criado_em: new Date().toISOString()
    };

    try {
      const resposta = await fetch(`${API_BASE}/produtos/${produto.id}/avaliacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, nota, titulo, comentario })
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível publicar a avaliação.');
      produto.total_avaliacoes = dados.total_avaliacoes;
      produto.nota_media = dados.nota_media;
      novaAvaliacao.criado_em = dados.avaliacao.criado_em;
    } catch (err) {
      mostrarToast(err.message || 'Não foi possível conectar ao servidor para salvar a avaliação.');
      return;
    }

    const todas = [novaAvaliacao, ...(produto.avaliacoes || [])];
    renderizarAvaliacoes(produto, todas);

    form.reset();
    inputNota.value = 5;
    atualizarEstrelasVisuais(5);
    form.hidden = true;
    mostrarToast('⭐ Avaliação enviada com sucesso! Obrigado!');
  });
}

function renderizarRelacionados(produtoAtual) {
  const grade = document.getElementById('grade-relacionados');
  if (!grade) return;

  const relacionados = PRODUTOS_LOCAIS
    .filter(p => p.id !== produtoAtual.id && p.categoria === produtoAtual.categoria)
    .slice(0, 3);

  grade.innerHTML = relacionados.map(p => `
    <article class="card produto" data-prod-id="${p.id}">
      <div class="produto-img-wrapper">
        <img src="${p.imagens[0]}" alt="${p.nome}" class="produto-img" loading="lazy">
      </div>
      <div class="produto-info">
        <span class="produto-categoria-label">${p.categoria}</span>
        <h3>${p.nome}</h3>
        <div class="avaliacao-mini">
          <span class="estrelas-amarelas">${gerarEstrelasHtml(p.nota_media)}</span>
          <span class="nota-num">${p.nota_media}</span>
        </div>
        <div class="preco-container">
          <div class="preco">${moeda(p.preco)}</div>
        </div>
        <a href="produto.html?id=${p.id}" class="btn-detalhes">Ver detalhes</a>
      </div>
    </article>
  `).join('');
}

carregarPaginaProduto();

/* ---------- 10. CAIXA DE ALERTA ---------- */
function mostrarAlerta(msg) {
  const el = document.getElementById('alerta');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
}

/* ---------- 11. LOGIN E CADASTRO REAL ---------- */
const validadores = {
  nome:  v => v.trim().length >= 2 || 'Informe seu nome.',
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Informe um e-mail válido.',
  senha: v => v.length >= 8 || 'A senha precisa ter ao menos 8 caracteres.',
};

document.querySelectorAll('.aba').forEach(aba => aba.addEventListener('click', () => {
  document.querySelectorAll('.aba').forEach(a => a.classList.toggle('ativa', a === aba));
  document.querySelectorAll('.form').forEach(f => { f.hidden = f.id !== aba.dataset.alvo; });
  const alerta = document.getElementById('alerta');
  if (alerta) alerta.hidden = true;
}));

async function enviarForm(form) {
  let valido = true;
  form.querySelectorAll('input').forEach(input => {
    if (!validadores[input.name]) return;
    const r = validadores[input.name](input.value);
    const campo = input.closest('.campo');
    if (campo) {
      campo.classList.toggle('invalido', r !== true);
      const errEl = campo.querySelector('.erro-msg');
      if (errEl) errEl.textContent = r === true ? '' : r;
    }
    if (r !== true) valido = false;
  });
  if (!valido) return;

  const dadosForm = Object.fromEntries(new FormData(form));
  const rotaAlvo = form.dataset.rota; // 'login' ou 'cadastro'

  if (rotaAlvo === 'cadastro') {
    const checkTermos = form.querySelector('#c-termos');
    if (checkTermos && !checkTermos.checked) {
      mostrarAlerta('Você precisa aceitar os Termos de Uso e a Política de Privacidade (LGPD) para criar sua conta.');
      return;
    }
  }

  try {
    const resp = await fetch(`${API_BASE}/${rotaAlvo}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosForm),
    });

    let json = null;
    const texto = await resp.text();
    try { json = texto ? JSON.parse(texto) : null; } catch (e) {}

    if (!resp.ok) {
      if (json && json.erro) throw new Error(json.erro);
      if (resp.status === 404) {
        throw new Error('Servidor backend não encontrado nesta porta. Execute "npm start" e abra via http://localhost:3000');
      }
      throw new Error(`Falha na resposta do servidor (código ${resp.status}).`);
    }

    if (!json || !json.usuario) {
      throw new Error('Resposta inválida do servidor.');
    }

    localStorage.setItem('token', json.token);
    localStorage.setItem('usuario', json.usuario.nome);
    localStorage.setItem('usuario_id', json.usuario.id);
    localStorage.setItem('usuario_email', json.usuario.email);

    mostrarToast(`Bem-vindo, ${json.usuario.nome}!`);
    setTimeout(() => { location.href = 'index.html'; }, 800);

  } catch (err) {
    if (err.message && (err.message.includes('fetch') || err.message.includes('NetworkError') || err.message.includes('Failed'))) {
      mostrarAlerta('Não foi possível conectar ao servidor na porta 3000. Dê 2 cliques em "iniciar-servidor.bat" e mantenha a janela preta aberta!');
    } else {
      mostrarAlerta(err.message || 'E-mail ou senha incorretos.');
    }
  }
}

document.querySelectorAll('.form').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    enviarForm(form);
  });
});

/* ---------- 12. RASTREIO DE PEDIDO ---------- */
const ORDEM = ['confirmado', 'separacao', 'enviado', 'entregue'];
const formRastreio = document.getElementById('form-rastreio');

if (formRastreio) {
  const paramCod = new URLSearchParams(location.search).get('codigo');
  if (paramCod) {
    const inputCod = document.getElementById('codigo');
    if (inputCod) {
      inputCod.value = paramCod;
      setTimeout(() => formRastreio.dispatchEvent(new Event('submit')), 100);
    }
  }

  formRastreio.addEventListener('submit', async e => {
    e.preventDefault();
    const codigoInput = document.getElementById('codigo');
    const codigo = codigoInput ? codigoInput.value.trim() : '';
    const resultado = document.getElementById('resultado');
    const alerta = document.getElementById('alerta');

    if (alerta) alerta.hidden = true;
    if (resultado) resultado.hidden = true;

    if (!codigo) {
      mostrarAlerta('Digite o código de rastreio ou o número do pedido.');
      return;
    }

    let pedido = null;

    try {
      const resp = await fetch(`${API_BASE}/rastreio/${encodeURIComponent(codigo)}`);
      let json = null;
      const texto = await resp.text();
      try { json = texto ? JSON.parse(texto) : null; } catch {}

      if (resp.ok && json) pedido = json;
    } catch {}

    if (!pedido) {
      mostrarAlerta('Pedido não encontrado no banco de dados. Confira o código.');
      return;
    }

    document.getElementById('r-id').textContent = `#${pedido.id}`;
    document.getElementById('r-codigo').textContent = pedido.codigo_rastreio || 'a definir';

    const atual = ORDEM.indexOf(pedido.status);
    document.querySelectorAll('.etapa').forEach((li, i) => {
      li.classList.toggle('concluida', i < atual || (i === atual && atual === ORDEM.length - 1));
      li.classList.toggle('atual', i === atual && atual < ORDEM.length - 1);
    });

    resultado.hidden = false;
  });
}

/* ---------- 13. BANNER DE CONSENTIMENTO LGPD ---------- */
function inicializarBannerLGPD() {
  if (localStorage.getItem('gamevault_lgpd_consent')) return;
  const banner = document.createElement('div');
  banner.id = 'banner-lgpd';
  banner.className = 'banner-lgpd';
  banner.innerHTML = `
    <div class="banner-lgpd-conteudo">
      <div class="banner-lgpd-icone">🛡️</div>
      <div class="banner-lgpd-texto">
        <strong>Privacidade e Proteção de Dados (LGPD)</strong>
        <p>O GameVault utiliza cookies essenciais e trata seus dados pessoais para fins de autenticação e processamento dos pedidos, em total conformidade com a Lei Federal nº 13.709/2018 (LGPD). Conheça nossos <a href="termos.html" target="_blank">Termos de Uso e Política de Privacidade</a>.</p>
      </div>
      <div class="banner-lgpd-botoes">
        <button type="button" class="btn-lgpd-aceitar" id="btn-aceitar-lgpd">Aceitar e Continuar</button>
      </div>
    </div>
  `;
  document.body.appendChild(banner);
  document.getElementById('btn-aceitar-lgpd').addEventListener('click', () => {
    localStorage.setItem('gamevault_lgpd_consent', 'true');
    banner.remove();
  });
}

// Inicia verificação do banner LGPD em todas as páginas
document.addEventListener('DOMContentLoaded', () => {
  inicializarBannerLGPD();
});
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  inicializarBannerLGPD();
}
