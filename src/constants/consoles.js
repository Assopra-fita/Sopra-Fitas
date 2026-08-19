import { semAcento } from '../lib/texto';

// Fonte única do que o site suporta. O filtro da Home e o formulário de
// cadastro saem daqui, então não podem mais divergir — foi essa divergência
// que deixou 67 jogos invisíveis em qualquer categoria.
//
// `core` é o nome do núcleo do EmulatorJS e precisa existir no catálogo oficial
// dele: um nome inválido abre o jogo em tela preta sem erro nenhum, que foi o
// que aconteceu com 'stella' (o correto é 'stella2014').
export const CONSOLES = [
  {
    valor: 'SNES',
    rotulo: 'Super Nintendo',
    core: 'snes9x',
    extensoes: ['sfc', 'smc', 'fig', 'swc'],
  },
  {
    valor: 'MASTER SYSTEM',
    rotulo: 'Master System',
    core: 'smsplus',
    extensoes: ['sms'],
  },
  {
    valor: 'MEGA DRIVE',
    rotulo: 'Mega Drive',
    core: 'genesis_plus_gx',
    extensoes: ['md', 'bin', 'gen', 'smd'],
  },
  {
    valor: 'NES',
    rotulo: 'Nintendo (NES)',
    core: 'nestopia',
    extensoes: ['nes', 'fds', 'unf'],
  },
  {
    valor: 'GBA',
    rotulo: 'Game Boy Advance',
    core: 'mgba',
    extensoes: ['gba'],
  },
  {
    valor: 'GAME BOY',
    rotulo: 'Game Boy / Color',
    core: 'gambatte',
    extensoes: ['gb', 'gbc'],
  },
  {
    valor: 'NINTENDO 64',
    rotulo: 'Nintendo 64',
    core: 'mupen64plus_next',
    extensoes: ['z64', 'n64', 'v64'],
  },
  {
    valor: 'ATARI',
    rotulo: 'Atari 2600',
    core: 'stella2014',
    extensoes: ['a26', 'bin'],
  },
];

// Categorias exibidas nos filtros da Home, na ordem em que aparecem.
export const CATEGORIAS = [
  'Todos',
  '❤️ Favoritos',
  ...CONSOLES.map((c) => c.valor),
];

export const acharConsole = (valor) =>
  CONSOLES.find((c) => c.valor === normalizarConsole(valor)) || null;

// Extensões aceitas para o console escolhido, prontas para o atributo accept.
export const aceitarRom = (valor) => {
  const alvo = acharConsole(valor);
  return alvo ? alvo.extensoes.map((e) => `.${e}`).join(',') : '';
};

// O campo `console` da tabela `jogos` é texto livre, então o mesmo videogame
// chega gravado de várias formas ('Super Nintendo', 'Super Nitendo', 'game Boy').
// Sem normalizar, o filtro por comparação exata escondia 67 dos 160 jogos.
const SINONIMOS = {
  'SUPER NINTENDO': 'SNES',
  'SUPER NITENDO': 'SNES',
  SUPERNINTENDO: 'SNES',
  SNES: 'SNES',

  'MEGA DRIVE': 'MEGA DRIVE',
  MEGADRIVE: 'MEGA DRIVE',
  GENESIS: 'MEGA DRIVE',
  'SEGA GENESIS': 'MEGA DRIVE',

  'MASTER SYSTEM': 'MASTER SYSTEM',
  MASTERSYSTEM: 'MASTER SYSTEM',

  NES: 'NES',
  NINTENDO: 'NES',
  NINTENDINHO: 'NES',

  'GAME BOY': 'GAME BOY',
  GAMEBOY: 'GAME BOY',
  'GAME BOY COLOR': 'GAME BOY',
  GBC: 'GAME BOY',

  GBA: 'GBA',
  'GAME BOY ADVANCE': 'GBA',

  'NINTENDO 64': 'NINTENDO 64',
  N64: 'NINTENDO 64',

  ATARI: 'ATARI',
  'ATARI 2600': 'ATARI',
};

// Deixa o valor comparável: sem acento, sem espaço sobrando, em maiúsculas.
const achatar = (valor) => semAcento(valor).toUpperCase();

// Devolve a categoria canônica do jogo. Valores desconhecidos voltam achatados
// em vez de virarem null, para continuarem visíveis em "Todos".
export const normalizarConsole = (valor) => {
  const achatado = achatar(valor);
  return SINONIMOS[achatado] || achatado;
};
