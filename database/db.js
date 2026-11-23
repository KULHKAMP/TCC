/* =====================================================
   database/db.js — Camada de Banco de Dados Híbrida
   Conecta preferencialmente ao MySQL do XAMPP (phpMyAdmin).
   Suporta também PostgreSQL e SQLite como fallback.
   ===================================================== */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const Database = require('better-sqlite3');

let tipoBanco = 'sqlite';
let mysqlPool = null;
let pgPool = null;
let sqliteDb = null;

// 20 PRODUTOS 100% REAIS COM FOTOS DE ALTA QUALIDADE
const PRODUTOS_REAIS = [
  // ===== 1. CONSOLES (6 produtos) =====
  {
    id: 1,
    categoria: 'consoles',
    nome: 'PlayStation 5 Slim 1TB Edition',
    preco: 3899.90,
    preco_antigo: 4499.00,
    destaque: 'Mais Vendido',
    descricao_curta: 'Console PlayStation 5 Slim com leitor de Blu-ray Ultra HD, SSD ultrarrápido de 1TB e controle sem fio DualSense com feedback háptico.',
    descricao_completa: `Experimente o carregamento na velocidade da luz com um SSD de ultra-alta velocidade, imersão mais profunda com suporte a feedback tátil, gatilhos adaptáveis e áudio 3D, além de uma geração totalmente nova de jogos incríveis de PlayStation.

O design mais fino do PS5 Slim oferece toda a potência do console original em um chassi 30% mais compacto e leve, com 1TB de armazenamento integrado para guardar todos os seus títulos favoritos sem preocupações.

Destaques:
• SSD de 1TB de altíssima velocidade para carregamento instantâneo.
• Controle DualSense com gatilhos adaptáveis e resposta tátil imersiva.
• Áudio 3D Tempest AudioTech para localização espacial realista de som.
• Gráficos até 4K com suporte a Ray Tracing e taxa de até 120 FPS.`,
    especificacoes: {
      "Processador": "x86-64-AMD Ryzen Zen 2 (8 núcleos / 16 threads até 3.5 GHz)",
      "GPU": "Motor gráfico baseado em AMD Radeon RDNA 2 com aceleração Ray Tracing",
      "Memória": "GDDR6 16GB",
      "Armazenamento": "1TB SSD NVMe ultrarrápido (leitura de 5.5 GB/s)",
      "Resolução": "Suporte a 4K 120Hz, 8K e VRR (HDMI 2.1)",
      "Garantia": "12 meses de garantia oficial Sony Brasil"
    },
    imagens: [
      "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?auto=format&fit=crop&w=1000&q=80"
    ],
    avaliacoes: [
      { nome_autor: "Lucas Moreira", nota: 5, titulo: "Sensacional! Entrega muito rápida", comentario: "O console é lindo, super silencioso e o carregamento do SSD é instantâneo. O controle DualSense é uma experiência à parte. Recomendo 100%!" },
      { nome_autor: "Mariana Costa", nota: 5, titulo: "Melhor compra do ano", comentario: "Chegou bem embalado, tudo lacrado e com nota fiscal. O tamanho Slim é bem mais prático de colocar no rack da sala." }
    ]
  },
  {
    id: 2,
    categoria: 'consoles',
    nome: 'Nintendo Switch OLED 64GB Neon',
    preco: 2299.00,
    preco_antigo: 2699.00,
    destaque: 'Frete Grátis',
    descricao_curta: 'Tela OLED vibrante de 7 polegadas com cores vívidas e alto contraste, suporte ajustável amplo, base com porta LAN com fio e 64GB de memória interna.',
    descricao_completa: `Jogue em casa na TV ou em qualquer lugar com uma tela OLED vibrante de 7 polegadas com o console Nintendo Switch - Modelo OLED. O console inclui suporte ajustável amplo para o modo semiportátil, base com porta LAN com fio integrada e 64 GB de armazenamento interno.`,
    especificacoes: {
      "Tela": "OLED multi-touch de 7.0 polegadas (1280x720)",
      "Armazenamento": "64GB interno (expansível via microSD)",
      "Bateria": "Íon de lítio 4310 mAh (4.5 a 9 horas de duração)",
      "Garantia": "12 meses oficial Nintendo Brasil"
    },
    imagens: [
      "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1612287266632-29904dd3315b?auto=format&fit=crop&w=1000&q=80"
    ],
    avaliacoes: [
      { nome_autor: "Camila Fernandes", nota: 5, titulo: "A tela OLED faz toda a diferença!", comentario: "A qualidade da tela é incrível. As cores são vivas e os pretos são profundos. Jogar Zelda nela é espetacular." }
    ]
  },
  {
    id: 3,
    categoria: 'consoles',
    nome: 'Xbox Series X 1TB Black',
    preco: 4199.00,
    preco_antigo: 4799.00,
    destaque: '12 TFLOPS Poder Puro',
    descricao_curta: 'O console mais rápido e poderoso de todos os tempos. Jogue milhares de títulos com 12 Teraflops de processamento e Quick Resume.',
    descricao_completa: `Apresentamos o Xbox Series X, o console mais potente da Microsoft com arquitetura Xbox Velocity, SSD NVMe de 1TB customizado e retrocompatibilidade com quatro gerações de jogos.`,
    especificacoes: {
      "Processador": "AMD Zen 2 Customizado de 8 núcleos a 3.8 GHz",
      "GPU": "12 TFLOPS, 52 CUs a 1.825 GHz RDNA 2",
      "Memória": "GDDR6 de 16GB",
      "Garantia": "12 meses oficial Microsoft"
    },
    imagens: [
      "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=1000&q=80"
    ],
    avaliacoes: [
      { nome_autor: "Thiago Ramos", nota: 5, titulo: "Monstro de desempenho!", comentario: "O Quick Resume é revolucionário. O console não faz barulho nenhum e o Game Pass fecha o pacote perfeito." }
    ]
  },
  {
    id: 4,
    categoria: 'consoles',
    nome: 'PlayStation 5 Pro 2TB Edition',
    preco: 6499.00,
    preco_antigo: 6999.00,
    destaque: 'Lançamento Pro',
    descricao_curta: 'O console mais avançado da PlayStation com tecnologia PSSR de inteligência artificial, Ray Tracing avançado e 2TB de SSD ultrarrápido.',
    descricao_completa: `Testemunhe uma fidelidade visual impressionante com o PlayStation 5 Pro. Com a tecnologia PlayStation Spectral Super Resolution (PSSR), desfrute de taxas de quadros ultra-altas a 60 FPS ou 120 FPS combinadas com Ray Tracing de altíssimo nível.`,
    especificacoes: {
      "Armazenamento": "2TB SSD NVMe de altíssima velocidade",
      "Tecnologias": "PSSR AI Upscaling, Advanced Ray Tracing, Wi-Fi 7",
      "Saída de Vídeo": "Suporte a 4K 120Hz e 8K nativo",
      "Garantia": "12 meses Sony Brasil"
    },
    imagens: [
      "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?auto=format&fit=crop&w=1000&q=80"
    ],
    avaliacoes: [
      { nome_autor: "Renan Vasconcelos", nota: 5, titulo: "Outro patamar de gráficos!", comentario: "A nitidez do PSSR nos jogos compatíveis é impressionante. Os 60 FPS com Ray Tracing valem cada centavo." }
    ]
  },
  {
    id: 5,
    categoria: 'consoles',
    nome: 'Xbox Series S 512GB All-Digital',
    preco: 2499.00,
    preco_antigo: 2899.00,
    destaque: 'Melhor Custo-Benefício',
    descricao_curta: 'Desempenho de nova geração no menor chassi de Xbox de todos os tempos. Totalmente digital, rápido e compacto com Quick Resume.',
    descricao_completa: `O Xbox Series S é a melhor porta de entrada para a nova geração de jogos. Construído para jogos sem disco a até 120 FPS em 1440p com tempos de carregamento instantâneos.`,
    especificacoes: {
      "Armazenamento": "512GB SSD NVMe customizado",
      "Resolução": "Até 1440p a 120 FPS com suporte a 4K Upscaling",
      "Áudio": "Dolby Atmos e Dolby Vision",
      "Garantia": "12 meses Microsoft"
    },
    imagens: [
      "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=1000&q=80"
    ],
    avaliacoes: [
      { nome_autor: "Danilo Faria", nota: 5, titulo: "Perfeito para o Game Pass", comentario: "Super pequeno, cabe em qualquer mochila. Roda todos os jogos novos com rapidez incrível." }
    ]
  },
  {
    id: 6,
    categoria: 'consoles',
    nome: 'Steam Deck OLED 512GB Portátil Valve',
    preco: 4399.00,
    preco_antigo: 4899.00,
    destaque: 'PC Portátil Nº 1',
    descricao_curta: 'Toda a sua biblioteca de jogos da Steam na palma das mãos. Tela OLED HDR de 7.4 polegadas com taxa de atualização de 90Hz e bateria aprimorada.',
    descricao_completa: `O Steam Deck OLED traz a tela OLED mais brilhante e vibrante já colocada em um console portátil. Cores profundas, pretos puros e taxa de resposta de 90Hz tornam seus jogos de PC portáteis uma experiência incomparável.`,
    especificacoes: {
      "Tela": "7.4 polegadas OLED HDR 90Hz (1280x800)",
      "Armazenamento": "512GB NVMe SSD de alta velocidade",
      "Bateria": "50Wh com autonomia de 3 a 12 horas",
      "Sistema": "SteamOS baseado em Linux (compatível com Proton)"
    },
    imagens: [
      "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&w=1000&q=80"
    ],
    avaliacoes: [
      { nome_autor: "Vinicius Prado", nota: 5, titulo: "Liberdade total para jogar jogos de PC", comentario: "Zerei Cyberpunk e Elden Ring no sofá. A tela OLED de 90Hz é um espetáculo." }
    ]
  },

  // ===== 2. JOGOS (8 produtos) =====
  {
    id: 7,
    categoria: 'jogos',
    nome: 'Grand Theft Auto VI (GTA 6) — Edição Especial',
    preco: 349.90,
    preco_antigo: 399.90,
    destaque: 'Pré-Venda Mais Aguardada',
    descricao_curta: 'Retorne ao estado de Leonida e às ruas vibrantes e neon de Vice City na maior e mais imersiva evolução da franquia Grand Theft Auto.',
    descricao_completa: `Grand Theft Auto VI leva você ao estado de Leonida, lar das ruas iluminadas em neon de Vice City e arredores, na maior e mais imersiva evolução da série Grand Theft Auto de todos os tempos. Acompanhe a história de Lucia e Jason em uma narrativa eletrizante de crime e sobrevivência.`,
    especificacoes: {
      "Plataformas": "PlayStation 5, Xbox Series X/S",
      "Desenvolvedora": "Rockstar Games",
      "Gênero": "Ação / Aventura / Mundo Aberto",
      "Classificação": "18 anos"
    },
    imagens: [
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80"
    ],
    avaliacoes: [
      { nome_autor: "Guilherme Santos", nota: 5, titulo: "Garantido na pré-venda!", comentario: "Esperei mais de 10 anos por esse lançamento! A Rockstar nunca decepciona, Vice City vai ser épica." }
    ]
  },
  {
    id: 8,
    categoria: 'jogos',
    nome: 'Elden Ring: Shadow of the Erdtree Edition',
    preco: 299.90,
    preco_antigo: 349.90,
    destaque: 'Jogo do Ano (GOTY)',
    descricao_curta: 'A obra-prima aclamada mundialmente de Hidetaka Miyazaki e George R.R. Martin. Inclui o jogo base completo e a colossal expansão Shadow of the Erdtree.',
    descricao_completa: `Guiados pelo Empyrean Miquella, os jogadores são convocados para a Terra das Sombras. Descubra os segredos obscuros do mundo ao encontrar outros que seguem os passos de Miquella com novos chefes, magias e armas épicas.`,
    especificacoes: {
      "Plataformas": "PlayStation 5, PS4, Xbox Series X/S, PC",
      "Desenvolvedora": "FromSoftware / Bandai Namco",
      "Gênero": "RPG de Ação / Soulslike",
      "Classificação": "16 anos"
    },
    imagens: [
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?auto=format&fit=crop&w=1000&q=80"
    ],
    avaliacoes: [
      { nome_autor: "Matheus Siqueira", nota: 5, titulo: "Um dos melhores jogos da história", comentario: "A expansão é maior do que muitos jogos completos por aí. Chefes desafiadores e direção de arte sem igual." }
    ]
  },
  {
    id: 9,
    categoria: 'jogos',
    nome: 'God of War Ragnarök — Edição Completa',
    preco: 249.90,
    preco_antigo: 349.90,
    destaque: 'Dublagem 100% BR',
    descricao_curta: 'Embarque em uma jornada épica e comovente enquanto Kratos e Atreus lutam para manter seus laços e o destino dos Nove Reinos.',
    descricao_completa: `O Fimbulwinter já começou. Kratos e Atreus viajam pelos Nove Reinos em busca de respostas enquanto as forças asgardianas se preparam para uma batalha profetizada que causará o fim do mundo. Totalmente dublado em Português do Brasil.`,
    especificacoes: {
      "Plataformas": "PlayStation 5, PlayStation 4, PC",
      "Desenvolvedora": "Santa Monica Studio",
      "Gênero": "Ação / Aventura Cinematográfica",
      "Classificação": "18 anos"
    },
    imagens: [
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=1000&q=80"
    ],
    avaliacoes: [
      { nome_autor: "Felipe Andrade", nota: 5, titulo: "História inesquecível", comentario: "A dublagem do Kratos e do Atreus é uma obra de arte. As lutas contra os deuses nórdicos são grandiosas demais!" }
    ]
  },
  {
    id: 10,
    categoria: 'jogos',
    nome: 'EA SPORTS FC 25',
    preco: 279.90,
    preco_antigo: 359.90,
    destaque: 'Futebol Nº 1 do Mundo',
    descricao_curta: 'Mais de 19.000 atletas totalmente licenciados, 700 times, 120 estádios e a revolucionária tecnologia FC IQ para controle tático definitivo.',
    descricao_completa: `O EA SPORTS FC 25 oferece mais maneiras de vencer pelo clube. Una-se no 5x5 Rush, uma nova maneira de jogar com amigos no Ultimate Team, Clubs e Kick-Off com jogabilidade em campo reduzido.`,
    especificacoes: {
      "Plataformas": "PS5, PS4, Xbox Series X/S, PC, Switch",
      "Desenvolvedora": "EA Sports",
      "Gênero": "Esporte / Futebol",
      "Classificação": "Livre"
    },
    imagens: [
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1000&q=80"
    ],
    avaliacoes: [
      { nome_autor: "Rafael Martins", nota: 5, titulo: "Modo Rush é viciante!", comentario: "A movimentação dos jogadores é bem mais tática e realista. Jogaço para o fim de semana com os amigos." }
    ]
  },
  {
    id: 11,
    categoria: 'jogos',
    nome: 'The Last of Us Part I Remastered',
    preco: 229.90,
    preco_antigo: 299.90,
    destaque: 'Clássico Aclamado',
    descricao_curta: 'Reviva a inesquecível jornada de Joel e Ellie através dos Estados Unidos pós-pandêmico. Reconstruído do zero com fidelidade visual impressionante.',
    descricao_completa: `Em uma civilização devastada por infectados e sobreviventes implacáveis, Joel é contratado para tirar Ellie, de 14 anos, de uma zona de quarentena militar. O que começa como um pequeno trabalho logo se torna uma jornada brutal por todo o país.`,
    especificacoes: {
      "Plataformas": "PlayStation 5, PC",
      "Desenvolvedora": "Naughty Dog",
      "Gênero": "Ação / Narrativa / Sobrevivência",
      "Classificação": "18 anos"
    },
    imagens: [
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1000&q=80"
    ],
    avaliacoes: [
      { nome_autor: "Julia Nogueira", nota: 5, titulo: "Emocionante do início ao fim", comentario: "Os gráficos no PS5 são impecáveis e a atuação dos personagens é de chorar. Uma obra-prima dos games." }
    ]
  },
  {
    id: 12,
    categoria: 'jogos',
    nome: 'Cyberpunk 2077: Ultimate Edition',
    preco: 199.90,
    preco_antigo: 279.90,
    destaque: 'Com Expansão Phantom Liberty',
    descricao_curta: 'Mergulhe em Night City como o mercenário cibernético V. Inclui o jogo base aprimorado e o aclamado thriller de espionagem Phantom Liberty.',
    descricao_completa: `Cyberpunk 2077 é um RPG de ação e aventura em mundo aberto ambientado na megalópole de Night City, onde você joga como um mercenário urbano lutando pela sobrevivência em uma teia de corporações e inteligências artificiais renegadas.`,
    especificacoes: {
      "Plataformas": "PlayStation 5, Xbox Series X/S, PC",
      "Desenvolvedora": "CD PROJEKT RED",
      "Gênero": "RPG de Ação Cyberpunk",
      "Classificação": "18 anos"
    },
    imagens: [
      "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=1000&q=80"
    ],
    avaliacoes: [
      { nome_autor: "Leonardo Diniz", nota: 5, titulo: "Visual absurdo no PS5", comentario: "Night City é viva demais, cada esquina parece um filme sci-fi. A expansão com Idris Elba é incrível." }
    ]
  },
  {
    id: 13,
    categoria: 'jogos',
    nome: 'Resident Evil 4 Remake — Gold Edition',
    preco: 219.90,
    preco_antigo: 269.90,
    destaque: 'Terror & Ação',
    descricao_curta: 'O clássico cult que redefiniu o gênero do survival horror, reimaginado com gráficos hiper-realistas na RE Engine e jogabilidade moderna.',
    descricao_completa: `Seis anos após o desastre biológico em Raccoon City, Leon S. Kennedy foi enviado para resgatar a filha do presidente em uma vila remota na Europa, onde algo terrivelmente errado acontece com os moradores locais.`,
    especificacoes: {
      "Plataformas": "PS5, PS4, Xbox Series X/S, PC",
      "Desenvolvedora": "Capcom",
      "Gênero": "Survival Horror / Ação",
      "Classificação": "18 anos"
    },
    imagens: [
      "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?auto=format&fit=crop&w=1000&q=80"
    ],
    avaliacoes: [
      { nome_autor: "Bruno Pacheco", nota: 5, titulo: "Remake perfeito!", comentario: "Respeitou o clássico e melhorou tudo que precisava. O combate com a faca e o gancho da Ada Wong é sensacional." }
    ]
  },
  {
    id: 14,
    categoria: 'jogos',
    nome: "Marvel's Spider-Man 2 — PS5",
    preco: 259.90,
    preco_antigo: 349.90,
    destaque: 'Exclusivo PlayStation',
    descricao_curta: 'Alterne rapidamente entre Peter Parker e Miles Morales enfrentando a força descomunal de Venom e os Caçadores de Kraven por Nova York.',
    descricao_completa: `Os Homens-Aranha Peter Parker e Miles Morales retornam para um novo capítulo emocionante na aclamada franquia da Insomniac Games. Balance, pule e use as novas asas de teia para viajar por toda Nova York da Marvel.`,
    especificacoes: {
      "Plataformas": "PlayStation 5",
      "Desenvolvedora": "Insomniac Games",
      "Gênero": "Ação / Super-Herói / Mundo Aberto",
      "Classificação": "12 anos"
    },
    imagens: [
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80"
    ],
    avaliacoes: [
      { nome_autor: "Caio Varella", nota: 5, titulo: "Gráficos e velocidade inacreditáveis", comentario: "A velocidade para se balançar pelos prédios usando o SSD do PS5 é mágica. As batalhas com o traje simbionte são épicas." }
    ]
  },

  // ===== 3. ACESSÓRIOS (6 produtos) =====
  {
    id: 15,
    categoria: 'acessorios',
    nome: 'Headset Gamer HyperX Cloud III Wireless',
    preco: 649.90,
    preco_antigo: 799.90,
    destaque: 'Bateria de 120 Horas',
    descricao_curta: 'Drivers angulados de 53mm, áudio espacial DTS Headphone:X, almofadas memory foam confortáveis e bateria monstruosa de até 120 horas.',
    descricao_completa: `O HyperX Cloud III Wireless é a evolução do lendário Cloud II. Conhecido por seu conforto extremo, qualidade de áudio cristalina e microfone ultra-limpo de 10mm com filtro interno de malha.`,
    especificacoes: {
      "Drivers": "Neodímio de 53 mm",
      "Conectividade": "Sem fio 2.4GHz via dongle USB-C/USB-A",
      "Bateria": "Até 120 horas de reprodução contínua",
      "Compatibilidade": "PC, PS5, PS4, Nintendo Switch e Celular"
    },
    imagens: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80"
    ],
    avaliacoes: [
      { nome_autor: "Renata Abreu", nota: 5, titulo: "Bateria que não acaba mais", comentario: "Uso há duas semanas todo dia e ainda não precisei recarregar. O conforto é padrão HyperX, o melhor de todos." }
    ]
  },
  {
    id: 16,
    categoria: 'acessorios',
    nome: 'Controle Sony DualSense Sem Fio Midnight Black',
    preco: 429.90,
    preco_antigo: 499.90,
    destaque: 'Gatilhos Adaptáveis',
    descricao_curta: 'Feedback tátil imersivo, gatilhos dinâmicos adaptáveis com resistência variável e microfone embutido em um acabamento preto fosco elegante.',
    descricao_completa: `Descubra uma experiência de jogo mais profunda e imersiva que dá vida à ação nas palmas das suas mãos com o controle sem fio DualSense oficial para PlayStation 5.`,
    especificacoes: {
      "Recursos": "Gatilhos Adaptáveis, Resposta Háptica, Touchpad capacitivo",
      "Conexão": "Bluetooth 5.1 e USB-C",
      "Compatibilidade": "PS5, PC, Mac, iOS e Android",
      "Garantia": "12 meses oficial Sony"
    },
    imagens: [
      "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=1000&q=80"
    ],
    avaliacoes: [
      { nome_autor: "Diego Martins", nota: 5, titulo: "Lindo demais na cor preta", comentario: "A cor Midnight Black é muito estilosa. Os gatilhos funcionando nos jogos do PS5 e no PC são fantásticos." }
    ]
  },
  {
    id: 17,
    categoria: 'acessorios',
    nome: 'Controle Xbox Wireless Controller Carbon Black',
    preco: 399.90,
    preco_antigo: 469.90,
    destaque: 'Mapeamento Personalizado',
    descricao_curta: 'Design esculpido com superfícies texturizadas antiderrapantes, botão Share dedicado e emparelhamento instantâneo com PC e consoles Xbox.',
    descricao_completa: `Experimente o design modernizado do Controle sem Fio Xbox, com superfícies esculpidas e geometria refinada para maior conforto durante o jogo. Conecte, jogue e alterne rapidamente entre dispositivos.`,
    especificacoes: {
      "Conectividade": "Xbox Wireless e Bluetooth",
      "Alimentação": "2 pilhas AA ou Bateria Recarregável Xbox",
      "Compatibilidade": "Xbox Series X/S, Xbox One, Windows 10/11, Android e iOS"
    },
    imagens: [
      "https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=1000&q=80"
    ],
    avaliacoes: [
      { nome_autor: "Marcelo Dias", nota: 5, titulo: "O mais anatômico para PC", comentario: "Conectou no Windows em 2 segundos sem nenhum driver extra. A pegada e o direcional em cruz são excelentes." }
    ]
  },
  {
    id: 18,
    categoria: 'acessorios',
    nome: 'Teclado Mecânico Gamer Redragon Kumara RGB ABNT2',
    preco: 249.90,
    preco_antigo: 329.90,
    destaque: 'Formato Compacto TKL',
    descricao_curta: 'Switches mecânicos Outemu Blue com feedback tátil e audível, iluminação Chroma RGB configurável e layout padrão brasileiro ABNT2 com tecla Ç.',
    descricao_completa: `O Redragon Kumara é um dos teclados mecânicos mais vendidos e confiáveis do Brasil. Chassi reforçado em alumínio ABS, teclas em Double-Shot Injection e sistema anti-ghosting em 100% das teclas.`,
    especificacoes: {
      "Formato": "Tenkeyless (TKL compacto 80%)",
      "Switches": "Mecânicos Outemu Blue (com sistema Hot-Swap)",
      "Padrão": "ABNT2 (com Ç)",
      "Cabo": "1.8 metros reforçado em malha trançada"
    },
    imagens: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80"
    ],
    avaliacoes: [
      { nome_autor: "Pedro Henrique", nota: 5, titulo: "Melhor custo benefício nacional", comentario: "Muito resistente, clique delicioso para digitar e o RGB tem vários modos bonitos. Recomendo para qualquer setup." }
    ]
  },
  {
    id: 19,
    categoria: 'acessorios',
    nome: 'Mouse Gamer Logitech G502 HERO 25.600 DPI',
    preco: 289.90,
    preco_antigo: 379.90,
    destaque: 'Sensor HERO 25K',
    descricao_curta: 'Sensor óptico HERO 25K de precisão submícron, 11 botões programáveis, pesos internos ajustáveis e roda de rolagem hiperveloz.',
    descricao_completa: `O G502 HERO é o mouse gamer mais popular do mundo. Conta com o sensor de última geração HERO 25K que oferece rastreamento 1:1 sem suavização ou aceleração, além de 5 pesos de 3,6g inclusos para você ajustar o centro de equilíbrio perfeito.`,
    especificacoes: {
      "DPI Máximo": "25.600 DPI ajustável",
      "Botões": "11 botões totalmente programáveis",
      "Iluminação": "LIGHTSYNC RGB personalizável",
      "Garantia": "24 meses oficial Logitech Brasil"
    },
    imagens: [
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1000&q=80"
    ],
    avaliacoes: [
      { nome_autor: "Lucas Fagundes", nota: 5, titulo: "Lendário! Não troco por nada", comentario: "A precisão da mira no CS e no Valorant é inacreditável. Os botões extras do polegar ajudam demais." }
    ]
  },
  {
    id: 20,
    categoria: 'acessorios',
    nome: 'Volante Gamer Logitech G29 Driving Force com Pedais',
    preco: 1799.00,
    preco_antigo: 2199.00,
    destaque: 'Force Feedback com 2 Motores',
    descricao_curta: 'Volante com Force Feedback realista de dois motores, rotação de 900 graus, acabamento em couro costurado à mão e pedais em aço inoxidável.',
    descricao_completa: `Sinta os pneus em cada curva e tipo de terreno, o subesterço ou sobreesterço e muito mais. O Force Feedback de dois motores potente simula efeitos de vibração com realismo para que você possa reagir com precisão imediata.`,
    especificacoes: {
      "Rotação": "900 graus (duas voltas e meia de trava a trava)",
      "Materiais": "Alumínio anodizado e couro automotivo genuíno costurado à mão",
      "Pedais": "Acelerador, freio não-linear e embreagem em aço escovado",
      "Compatibilidade": "PlayStation 5, PlayStation 4 e PC"
    },
    imagens: [
      "https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=1000&q=80"
    ],
    avaliacoes: [
      { nome_autor: "Eduardo Silveira", nota: 5, titulo: "Imersão inacreditável no Gran Turismo", comentario: "Parece que você está pilotando um carro de corrida de verdade. A resistência do freio é muito realista." }
    ]
  }
];

// Fotos de produto correspondentes ao SKU/modelo anunciado (fontes de catálogo).
const IMAGENS_PRODUTOS = {
  1: ['https://www.jib.co.th/img_master/product/original/2026011408550082892_2.png'],
  2: ['https://images.tcdn.com.br/img/img_prod/1042771/console_nintendo_switch_oled_neon_azul_vermelho_64gb_hegskabaa_nintendo_2019_1_897d564ece62b522db2a8a383428c284.jpg'],
  3: ['https://cdn.awsli.com.br/800x800/948/948792/produto/71168363/1-9ogq92ybgu.jpg'],
  4: ['https://ennap.com/cdn/shop/files/PS5PRO-Hero-1.png'],
  5: ['https://images.tcdn.com.br/img/img_prod/621461/console_xbox_series_s_512gb_branco_3663_2_bc86f6d1e608c481d91624840b3458e7.jpg'],
  6: ['https://www.discoazul.co.uk/uploads/media/images/consola-portatil-steam-deck-oled-nvme-512-gb-1.jpg'],
  7: ['https://bbpcdn.pstatic.gr/bpimg29/2m820R/1SOmGa_SX1024Y1024/1726058558/grand-theft-auto-vi-ps5.jpg'],
  8: ['https://cdn11.bigcommerce.com/s-xs1cevxe43/images/stencil/1280x1280/attribute_rule_images/15980_source_1708536507.jpg'],
  9: ['https://gameone.ph/media/catalog/product/mpiowebpcache/d378a0f20f83637cdb1392af8dc032a2/g/o/god-of-war-ragnarok-695121.11.webp'],
  10: ['https://i5.walmartimages.com/seo/EA-Sports-FC-25-PlayStation-5-Physical_53cd7a88-728a-4db0-be0f-678bad2cb725.9e436d6a6c9e21c7dfe615bfe3f0d900.jpeg?odnBg=FFFFFF&odnHeight=768&odnWidth=768'],
  11: ['https://i5.walmartimages.com/asr/5b6a11fd-d71f-4507-b8ed-9d582d7d0b7e.d144a2c0e4c4b12111946b75f2334f58.jpeg'],
  12: ['https://carrefourbr.vtexassets.com/arquivos/ids/182804541/image-0.jpg?v=638730174113770000'],
  13: ['https://www.librephonia.com/44522-thickbox_default/juego-resident-evil-4-gold-edition-para-playstation-5-ps5.jpg'],
  14: ['https://a-static.mlcdn.com.br/800x800/jogo-marvel-spider-man-2-ps5-midia-fisica-pt-br-original-sony/bunkertech/so000103ps5/593db9a4ee927df4b02f1f33573fb268.jpeg'],
  15: ['https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/115/MTA-167789185/hyper_x_hyperx_cloud_iii_wireless_gaming_headset_-_black_red_full01_vblz6fhq.jpg'],
  16: ['https://www.costco.com.mx/medias/sys_master/products/h4b/h3d/398628244652062.jpg'],
  17: ['https://www.pbtech.com/imgprod/G/A/GAMMST2032__1.jpg'],
  18: ['https://img.terabyteshop.com.br/produto/g/teclado-mecanico-gamer-redragon-kumara-k552-rgb-switch-red-abnt2-black-open-box_75055.png'],
  19: ['https://resource.logitech.com/b_white/content/dam/gaming/en/non-braid/hyjal-g502-hero/g502-hero-gallery-2-nb.png'],
  20: ['https://www.bhphotovideo.com/images/images1500x1500/logitech_941_000110_g29_driving_force_racing_1374569.jpg']
};
for (const produto of PRODUTOS_REAIS) {
  if (IMAGENS_PRODUTOS[produto.id]) produto.imagens = IMAGENS_PRODUTOS[produto.id];
}

// Números e comentários de demonstração para a loja de apresentação.
const NOMES_DEMONSTRACAO = ['Marina Lopes', 'Pedro Azevedo', 'Bianca Martins'];
for (const produto of PRODUTOS_REAIS) {
  produto.total_avaliacoes_demo = 100;
  produto.avaliacoes = (produto.avaliacoes || []).map(a => ({
    ...a,
    titulo: `[DEMO] ${a.titulo || 'Impressões de demonstração'}`,
    compra_verificada: 0
  }));
  if (produto.avaliacoes.length < 2) {
    produto.avaliacoes.push({
      nome_autor: NOMES_DEMONSTRACAO[(produto.id + 1) % NOMES_DEMONSTRACAO.length],
      nota: produto.id % 4 === 0 ? 4 : 5,
      titulo: '[DEMO] Avaliação demonstrativa',
      comentario: `Comentário fictício para apresentação da página do produto ${produto.nome}.`,
      compra_verificada: 0
    });
  }
}

function adaptarQueryParaPg(sql) {
  let contador = 1;
  return sql.replace(/\?/g, () => `$${contador++}`);
}

async function sincronizarCatalogoPostgres(pool) {
  for (const p of PRODUTOS_REAIS) {
    const soma = p.avaliacoes.reduce((acc, avaliacao) => acc + avaliacao.nota, 0);
    const media = (soma / p.avaliacoes.length).toFixed(1);
    await pool.query(`
      INSERT INTO produtos (id, categoria, nome, preco, preco_antigo, destaque, descricao_curta, descricao_completa, especificacoes_json, imagens_json, nota_media, total_avaliacoes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        categoria = EXCLUDED.categoria, nome = EXCLUDED.nome, preco = EXCLUDED.preco,
        preco_antigo = EXCLUDED.preco_antigo, destaque = EXCLUDED.destaque,
        descricao_curta = EXCLUDED.descricao_curta, descricao_completa = EXCLUDED.descricao_completa,
        especificacoes_json = EXCLUDED.especificacoes_json, imagens_json = EXCLUDED.imagens_json,
        nota_media = EXCLUDED.nota_media, total_avaliacoes = EXCLUDED.total_avaliacoes
    `, [p.id, p.categoria, p.nome, p.preco, p.preco_antigo, p.destaque, p.descricao_curta,
      p.descricao_completa, JSON.stringify(p.especificacoes), JSON.stringify(p.imagens), media,
      p.total_avaliacoes_demo || p.avaliacoes.length]);

    for (const a of p.avaliacoes) {
      await pool.query(`
        INSERT INTO avaliacoes (produto_id, nome_autor, nota, titulo, comentario, compra_verificada)
        SELECT $1::integer, $2::varchar, $3::integer, $4::varchar, $5::text, 0::integer
        WHERE NOT EXISTS (SELECT 1 FROM avaliacoes WHERE produto_id = $1::integer AND nome_autor = $2::varchar)
      `, [p.id, a.nome_autor, a.nota, a.titulo, a.comentario]);
      await pool.query(
        'UPDATE avaliacoes SET titulo = $1, compra_verificada = 0 WHERE produto_id = $2 AND nome_autor = $3',
        [a.titulo, p.id, a.nome_autor]
      );
    }
  }
  await pool.query(`SELECT setval(pg_get_serial_sequence('produtos', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM produtos), 1), 1))`);
}

async function inicializarBanco() {
  const tipoEscolhido = (process.env.DB_TIPO || 'mysql').toLowerCase();
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || (tipoEscolhido === 'mysql' ? 3306 : 5432);
  const user = process.env.DB_USER || (tipoEscolhido === 'mysql' ? 'root' : 'postgres');
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || (tipoEscolhido === 'mysql' ? 'loja_games' : 'TCC');

  // PostgreSQL explícito: usa toda a configuração do .env e falha claramente
  // se a conexão não estiver disponível, sem gravar contas em outro banco.
  if (tipoEscolhido === 'postgres') {
    const pool = new Pool(process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 }
      : { host, port, user, password, database, connectionTimeoutMillis: 5000 });
    try {
      const client = await pool.connect();
      try {
        await client.query(fs.readFileSync(path.join(__dirname, 'schema_postgres.sql'), 'utf8'));
        await client.query('UPDATE usuarios SET senha_plana = NULL WHERE senha_plana IS NOT NULL');
      } finally {
        client.release();
      }
      await sincronizarCatalogoPostgres(pool);
      pgPool = pool;
      tipoBanco = 'postgres';
      console.log(`\n🐘 Conectado ao PostgreSQL: banco "${database}" em ${host}:${port} como "${user}"`);
      return;
    } catch (err) {
      await pool.end().catch(() => {});
      throw new Error(`DB_TIPO=postgres, mas não foi possível conectar a ${user}@${host}:${port}/${database}: ${err.message}`);
    }
  }

  // ===== 1. TENTATIVA COM MYSQL (XAMPP / phpMyAdmin) =====
  if (tipoEscolhido === 'mysql' || port === 3306) {
    try {
      // 1.1 Garante criação do banco e executa o schema com multipleStatements
      const connTemp = await mysql.createConnection({ host, port, user, password, multipleStatements: true });
      await connTemp.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; USE \`${database}\`;`);
      const schemaMysql = fs.readFileSync(path.join(__dirname, 'schema_mysql.sql'), 'utf8');
      await connTemp.query(schemaMysql);
      await connTemp.query('ALTER TABLE usuarios MODIFY senha_plana VARCHAR(255) NULL');
      await connTemp.query('UPDATE usuarios SET senha_plana = NULL WHERE senha_plana IS NOT NULL');
      await connTemp.end();

      // 1.2 Cria Pool
      const pool = mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4'
      });

      console.log(`\n🐬 CONECTADO AO MYSQL DO XAMPP (phpMyAdmin): Banco "${database}" como usuário "${user}"`);
      console.log(`👉 Visualize e edite tabelas e senhas no phpMyAdmin: http://localhost/phpmyadmin/`);

      // 1.4 Sincroniza os 20 produtos reais
      for (const p of PRODUTOS_REAIS) {
        const soma = p.avaliacoes ? p.avaliacoes.reduce((acc, a) => acc + a.nota, 0) : 5;
        const media = p.avaliacoes && p.avaliacoes.length > 0 ? (soma / p.avaliacoes.length).toFixed(1) : 5.0;
        const totalAval = p.total_avaliacoes_demo || (p.avaliacoes ? p.avaliacoes.length : 0);

        await pool.query(`
          INSERT INTO produtos (id, categoria, nome, preco, preco_antigo, destaque, descricao_curta, descricao_completa, especificacoes_json, imagens_json, nota_media, total_avaliacoes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            categoria = VALUES(categoria),
            nome = VALUES(nome),
            preco = VALUES(preco),
            preco_antigo = VALUES(preco_antigo),
            destaque = VALUES(destaque),
            descricao_curta = VALUES(descricao_curta),
            descricao_completa = VALUES(descricao_completa),
            especificacoes_json = VALUES(especificacoes_json),
            imagens_json = VALUES(imagens_json),
            nota_media = VALUES(nota_media),
            total_avaliacoes = VALUES(total_avaliacoes)
        `, [
          p.id, p.categoria, p.nome, p.preco, p.preco_antigo, p.destaque,
          p.descricao_curta, p.descricao_completa,
          JSON.stringify(p.especificacoes), JSON.stringify(p.imagens),
          media, totalAval
        ]);

        if (p.avaliacoes) {
          for (const a of p.avaliacoes) {
            const [existente] = await pool.query(
              'SELECT id FROM avaliacoes WHERE produto_id = ? AND nome_autor = ?',
              [p.id, a.nome_autor]
            );
            if (!existente || existente.length === 0) {
              await pool.query(
                'INSERT INTO avaliacoes (produto_id, nome_autor, nota, titulo, comentario, compra_verificada) VALUES (?, ?, ?, ?, ?, 0)',
                [p.id, a.nome_autor, a.nota, a.titulo, a.comentario]
              );
            } else {
              await pool.query(
                'UPDATE avaliacoes SET titulo = ?, compra_verificada = 0 WHERE produto_id = ? AND nome_autor = ?',
                [a.titulo, p.id, a.nome_autor]
              );
            }
          }
        }
      }

      mysqlPool = pool;
      tipoBanco = 'mysql';
      return;
    } catch (err) {
      console.warn(`⚠️ Não foi possível conectar ao MySQL do XAMPP: ${err.message}`);
    }
  }

  // ===== 3. FALLBACK: SQLITE LOCAL =====
  tipoBanco = 'sqlite';
  const dbFile = path.join(__dirname, 'loja.db');
  sqliteDb = new Database(dbFile);
  sqliteDb.pragma('foreign_keys = ON');
  sqliteDb.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  console.log(`\n💾 Usando banco de dados local SQLite: loja.db`);
}

async function queryTodos(sql, params = []) {
  if (tipoBanco === 'mysql') {
    const [rows] = await mysqlPool.query(sql, params);
    return rows;
  } else if (tipoBanco === 'postgres') {
    const res = await pgPool.query(adaptarQueryParaPg(sql), params);
    return res.rows;
  } else {
    return sqliteDb.prepare(sql).all(...params);
  }
}

async function queryUm(sql, params = []) {
  if (tipoBanco === 'mysql') {
    const [rows] = await mysqlPool.query(sql, params);
    return rows[0] || null;
  } else if (tipoBanco === 'postgres') {
    const res = await pgPool.query(adaptarQueryParaPg(sql), params);
    return res.rows[0] || null;
  } else {
    return sqliteDb.prepare(sql).get(...params) || null;
  }
}

async function executar(sql, params = []) {
  if (tipoBanco === 'mysql') {
    const [result] = await mysqlPool.query(sql, params);
    return {
      lastInsertRowid: result.insertId,
      rowCount: result.affectedRows
    };
  } else if (tipoBanco === 'postgres') {
    let sqlPg = adaptarQueryParaPg(sql);
    if (!sqlPg.toUpperCase().includes('RETURNING') && sqlPg.trim().toUpperCase().startsWith('INSERT')) {
      sqlPg += ' RETURNING id';
    }
    const res = await pgPool.query(sqlPg, params);
    return {
      lastInsertRowid: res.rows[0] ? res.rows[0].id : null,
      rowCount: res.rowCount
    };
  } else {
    const info = sqliteDb.prepare(sql).run(...params);
    return {
      lastInsertRowid: info.lastInsertRowid,
      rowCount: info.changes
    };
  }
}

module.exports = {
  inicializarBanco,
  queryTodos,
  queryUm,
  executar,
  getTipo: () => tipoBanco,
  PRODUTOS_REAIS
};
