import React from 'react';

// Seis telas de admin reimplementavam este cabeçalho, com 4 cores de título e
// 3 tamanhos de ícone. Quatro delas não tinham nenhum <h1> — uma tela é uma
// rota, e uma rota precisa de um título de primeiro nível.
const CabecalhoPagina = ({ icone, titulo, subtitulo, acao }) => (
  <header className="cabecalho-pagina">
    <div>
      <h1 className="cabecalho-pagina__titulo">
        {icone}
        {titulo}
      </h1>
      {subtitulo && <p className="cabecalho-pagina__subtitulo">{subtitulo}</p>}
    </div>

    {acao}
  </header>
);

export default CabecalhoPagina;
