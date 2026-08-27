import React from 'react';
import { numerosDePagina } from '../../lib/paginacao';

const Paginacao = ({ paginaAtual, totalPaginas, aoMudar, isMobile }) => {
  if (totalPaginas <= 1) return null;

  return (
    <nav className="paginacao" aria-label="Paginação dos jogos">
      <button
        type="button"
        className="paginacao__botao"
        onClick={() => aoMudar(paginaAtual - 1)}
        disabled={paginaAtual === 1}
        aria-label="Página anterior"
      >
        &lt;
      </button>

      {numerosDePagina(paginaAtual, totalPaginas, isMobile ? 5 : 7).map(
        (item, idx) =>
          item === '...' ? (
            <span className="paginacao__reticencias" key={`reticencias-${idx}`}>
              ...
            </span>
          ) : (
            <button
              type="button"
              className="paginacao__botao"
              key={item}
              onClick={() => aoMudar(item)}
              aria-label={`Página ${item}`}
              aria-current={paginaAtual === item ? 'page' : undefined}
            >
              {item}
            </button>
          )
      )}

      <button
        type="button"
        className="paginacao__botao"
        onClick={() => aoMudar(paginaAtual + 1)}
        disabled={paginaAtual === totalPaginas}
        aria-label="Próxima página"
      >
        &gt;
      </button>
    </nav>
  );
};

export default Paginacao;
