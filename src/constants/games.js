// Acervo estático do site: os jogos cujas ROMs vivem em public/ e viajam no
// repositório. O acervo do painel do GM fica na tabela `jogos` do Supabase.
//
// FONTE ÚNICA. Antes eram duas estruturas com os mesmos jogos e campos
// diferentes: um array lido só pela vitrine e um objeto lido só pela sala de
// jogo. Editar uma e esquecer a outra produzia um jogo que aparece na vitrine e
// não abre, ou que abre por link direto e não aparece na vitrine.
//
// Para adicionar um jogo: uma entrada aqui, com os nove campos, e a ROM e a
// capa na raiz de public/. O valor de `console` precisa existir em
// constants/consoles.js, senão o jogo some de todos os filtros.
export const games = [
  // MASTER SYSTEM
  {
    id: 'sms-sonic',
    nome: 'Sonic The Hedgehog',
    console: 'MASTER SYSTEM',
    core: 'smsplus',
    rom_url: '/sonicthehedgehog.sms',
    capa_url: 'https://upload.wikimedia.org/wikipedia/en/b/ba/Sonic_the_Hedgehog_1_Genesis_box_art.jpg',
    ano: '1991',
    fabricante: 'SEGA',
    descricao: 'A estreia do ouriço mais rápido do mundo no Master System!',
  },
  {
    id: 'sms-alex-kidd',
    nome: 'Alex Kidd in Miracle World',
    console: 'MASTER SYSTEM',
    core: 'smsplus',
    rom_url: '/alexkidd.sms',
    capa_url: '/alexkidd.webp',
    ano: '1986',
    fabricante: 'SEGA',
    descricao: 'O maior clássico do Master System! Use o Jokenpô para vencer!',
  },

  // SNES
  {
    id: 'snes-aladdin',
    nome: 'Disney\'s Aladdin',
    console: 'SNES',
    core: 'snes9x',
    rom_url: '/aladdin.sfc',
    capa_url: '/aladdin.webp',
    ano: '1993',
    fabricante: 'Capcom',
    descricao: 'A versão clássica da Capcom baseada no filme da Disney.',
  },
  {
    id: 'snes-chrono-trigger',
    nome: 'Chrono Trigger',
    console: 'SNES',
    core: 'snes9x',
    rom_url: '/chrono-trigger.sfc',
    capa_url: '/chrono-trigger.webp',
    ano: '1995',
    fabricante: 'Square',
    descricao: 'Uma das maiores aventuras RPG de todos os tempos!',
  },
  {
    id: 'snes-contra3',
    nome: 'Contra III: The Alien Wars',
    console: 'SNES',
    core: 'snes9x',
    rom_url: '/contra-3.sfc',
    capa_url: '/contra-3.webp',
    ano: '1992',
    fabricante: 'Konami',
    descricao: 'A maior aventura dos Contra Brothers no futuro!',
  },
  {
    id: 'snes-dkc',
    nome: 'Donkey Kong Country',
    console: 'SNES',
    core: 'snes9x',
    rom_url: '/dkc.sfc',
    capa_url: '/dkc.webp',
    ano: '1994',
    fabricante: 'Rare/Nintendo',
    descricao: 'Donkey e Diddy em uma aventura revolucionária em 3D!',
  },
  {
    id: 'snes-fatal-fury2',
    nome: 'Fatal Fury 2',
    console: 'SNES',
    core: 'snes9x',
    rom_url: '/fatal-fury-2.sfc',
    capa_url: '/fatal-fury-2.webp',
    ano: '1992',
    fabricante: 'SNK',
    descricao: 'Terry Bogard e cia no torneio do Rei das Trevas!',
  },
  {
    id: 'snes-goof-troop',
    nome: 'Goof Troop',
    console: 'SNES',
    core: 'snes9x',
    rom_url: '/goof-troop.sfc',
    capa_url: '/goof-troop.webp',
    ano: '1993',
    fabricante: 'Capcom/Disney',
    descricao: 'Max e PJ salvam o Prefeito X com truques malucos!',
  },
  {
    id: 'snes-harvest-moon',
    nome: 'Harvest Moon',
    console: 'SNES',
    core: 'snes9x',
    rom_url: '/harvest-moon.sfc',
    capa_url: '/harvest-moon.webp',
    ano: '1996',
    fabricante: 'Natsume',
    descricao: 'Reconstrua a fazenda e encontre o amor verdadeiro!',
  },
  {
    id: 'snes-kirbys-avalanche',
    nome: 'Kirby\'s Avalanche',
    console: 'SNES',
    core: 'snes9x',
    rom_url: '/kirbys-avalanche.sfc',
    capa_url: '/kirbys-avalanche.webp',
    ano: '1995',
    fabricante: 'HAL',
    descricao: 'Kirby no puzzle game estilo Puyo Puyo!',
  },
  {
    id: 'snes-kirby-super-star',
    nome: 'Kirby Super Star',
    console: 'SNES',
    core: 'snes9x',
    rom_url: '/kirby-super-star.sfc',
    capa_url: '/kirby-super-star.webp',
    ano: '1996',
    fabricante: 'HAL/Nintendo',
    descricao: 'Múltiplas aventuras do Kirby rosa e faminto!',
  },
  {
    id: 'snes-megaman-x',
    nome: 'Mega Man X',
    console: 'SNES',
    core: 'snes9x',
    rom_url: '/megaman-x.sfc',
    capa_url: '/megaman-x.webp',
    ano: '1993',
    fabricante: 'Capcom',
    descricao: 'O futuro dos Mavericks começa aqui com X!',
  },
  {
    id: 'snes-megaman-x2',
    nome: 'Mega Man X2',
    console: 'SNES',
    core: 'snes9x',
    rom_url: '/megaman-x2.sfc',
    capa_url: '/megaman-x2.webp',
    ano: '1994',
    fabricante: 'Capcom',
    descricao: 'Wire Sponge, Wheel Gator e mais 6 Mavericks!',
  },
  {
    id: 'snes-megaman-x3',
    nome: 'Mega Man X3',
    console: 'SNES',
    core: 'snes9x',
    rom_url: '/megaman-x3.sfc',
    capa_url: '/megaman-x3.webp',
    ano: '1995',
    fabricante: 'Capcom',
    descricao: 'O último grande X do SNES com escolhas morais!',
  },
  {
    id: 'snes-rrr',
    nome: 'Rock n\' Roll Racing',
    console: 'SNES',
    core: 'snes9x',
    rom_url: '/rrr.sfc',
    capa_url: '/rrr.webp',
    ano: '1993',
    fabricante: 'Blizzard',
    descricao: 'Acelere ao som de rock em corridas intergalácticas!',
  },
  {
    id: 'snes-topgear',
    nome: 'Top Gear',
    console: 'SNES',
    core: 'snes9x',
    rom_url: '/topgear.smc',
    capa_url: '/Capa_de_Top_Gear.webp',
    ano: '1992',
    fabricante: 'Kemco/Gremlin',
    descricao: 'O jogo de corrida mais amado do Brasil!',
  },

  // NES
  {
    id: 'nes-contra',
    nome: 'Contra',
    console: 'NES',
    core: 'nestopia',
    rom_url: '/contra.nes',
    capa_url: '/contra.webp',
    ano: '1987',
    fabricante: 'Konami',
    descricao: 'Bill Rizer e Lance Bean contra os aliens!',
  },
  {
    id: 'nes-duck-hunt',
    nome: 'Duck Hunt',
    console: 'NES',
    core: 'nestopia',
    rom_url: '/duck-hunt.nes',
    capa_url: '/duck-hunt.webp',
    ano: '1984',
    fabricante: 'Nintendo',
    descricao: 'O cão zoeiro e sua Zapper na caça aos patos!',
  },

  // GBA
  {
    id: 'gba-zelda-minish-cap',
    nome: 'The Legend of Zelda: The Minish Cap',
    console: 'GBA',
    core: 'mgba',
    rom_url: '/LegendOfZeldaTheMinishCap.gba',
    capa_url: '/zelda.webp',
    ano: '2004',
    fabricante: 'Capcom/Nintendo',
    descricao: 'Link encolhe com Ezlo para salvar Hyrule!',
  },
  {
    id: 'gba-pokemon-fire-red',
    nome: 'Pokémon Fire Red',
    console: 'GBA',
    core: 'mgba',
    rom_url: '/pokemon-fire-red.gba',
    capa_url: '/pokemon-fire-red.webp',
    ano: '2004',
    fabricante: 'Game Freak',
    descricao: 'Kanto em 3D com Pokémon até a Geração III!',
  },

  // GAME BOY
  {
    id: 'gb-pokemon-silver',
    nome: 'Pokémon Silver',
    console: 'GAME BOY',
    core: 'gambatte',
    rom_url: '/PokémonSilver.gbc',
    capa_url: '/pokemon-silver.webp',
    ano: '1999',
    fabricante: 'Game Freak',
    descricao: 'Gold e Silver na região de Johto e Kanto!',
  },

  // NINTENDO 64
  {
    id: 'n64-super-mario-64',
    nome: 'Super Mario 64',
    console: 'NINTENDO 64',
    core: 'mupen64plus_next',
    rom_url: '/mario64.z64',
    capa_url: '/Super_Mario_64.webp',
    ano: '1996',
    fabricante: 'Nintendo',
    descricao: 'A revolução 3D que mudou os games para sempre!',
  },

  // ATARI
  {
    id: 'atari-asteroids',
    nome: 'Asteroids',
    console: 'ATARI',
    core: 'stella2014',
    rom_url: '/asteroids.a26',
    capa_url: '/asteroids.webp',
    ano: '1979',
    fabricante: 'Atari',
    descricao: 'O clássico arcade que definiu os shoot em up!',
  },
];

// Índice por id, montado uma vez no carregamento do módulo. A sala de jogo
// resolve a ROM por id a cada abertura: com busca linear seriam 24
// comparações por jogo aberto, e o índice deixa isso em O(1).
const porId = new Map(games.map((jogo) => [jogo.id, jogo]));

export const acharJogo = (id) => porId.get(id);

// Todos menos um, para a lista de relacionados da sala de jogo.
export const outrosJogos = (id) => games.filter((jogo) => jogo.id !== id);
