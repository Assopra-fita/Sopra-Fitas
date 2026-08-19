import { semAcento } from '../lib/texto';

// Categorias exibidas nos filtros da Home, na ordem em que aparecem.
export const CATEGORIAS = [
  'Todos',
  '❤️ Favoritos',
  'SNES',
  'MASTER SYSTEM',
  'MEGA DRIVE',
  'NES',
  'GBA',
  'GAME BOY',
  'NINTENDO 64',
  'ATARI',
];

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
