// Remove acentos e normaliza espaços para comparação de texto.
// Sem isso, buscar "pokemon" não encontra "Pokémon".
export const semAcento = (valor) =>
  (valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ');

// Forma canônica para busca e comparação: sem acento e em minúsculas.
export const paraComparar = (valor) => semAcento(valor).toLowerCase();
