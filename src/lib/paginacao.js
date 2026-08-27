// Monta a régua de páginas com reticências: 1 … 4 5 6 … 20
// Função pura, fora do componente, para poder ser conferida isoladamente.
export const numerosDePagina = (paginaAtual, totalPaginas, maxBotoes) => {
  if (totalPaginas <= maxBotoes)
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);

  const paginas = [1];
  let inicio = Math.max(2, paginaAtual - 1);
  let fim = Math.min(totalPaginas - 1, paginaAtual + 1);

  if (paginaAtual <= 3) {
    fim = Math.min(maxBotoes - 2, totalPaginas - 1);
  } else if (paginaAtual >= totalPaginas - 2) {
    inicio = Math.max(2, totalPaginas - (maxBotoes - 3));
  }

  if (inicio > 2) paginas.push('...');
  for (let i = inicio; i <= fim; i++) paginas.push(i);
  if (fim < totalPaginas - 1) paginas.push('...');
  paginas.push(totalPaginas);

  return paginas;
};
