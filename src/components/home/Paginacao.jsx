import React from 'react';
import { numerosDePagina } from '../../lib/paginacao';

const estiloBase = {
  border: '1px solid #333',
  padding: '8px 12px',
  borderRadius: '8px',
  fontWeight: 'bold',
  fontSize: '0.85rem',
};

const Paginacao = ({ paginaAtual, totalPaginas, aoMudar, isMobile }) => {
  if (totalPaginas <= 1) return null;

  const naPrimeira = paginaAtual === 1;
  const naUltima = paginaAtual === totalPaginas;

  return (
    <nav
      aria-label="Paginação dos jogos"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '6px',
        marginTop: '30px',
        flexWrap: 'wrap',
      }}
    >
      <button
        onClick={() => aoMudar(paginaAtual - 1)}
        disabled={naPrimeira}
        aria-label="Página anterior"
        style={{
          ...estiloBase,
          background: naPrimeira ? '#1a1a1a' : '#242424',
          color: naPrimeira ? '#444' : '#fff',
          cursor: naPrimeira ? 'default' : 'pointer',
        }}
      >
        &lt;
      </button>

      {numerosDePagina(paginaAtual, totalPaginas, isMobile ? 5 : 7).map(
        (item, idx) =>
          item === '...' ? (
            <span key={`reticencias-${idx}`} style={{ color: '#666', padding: '0 4px' }}>
              ...
            </span>
          ) : (
            <button
              key={item}
              onClick={() => aoMudar(item)}
              aria-label={`Página ${item}`}
              aria-current={paginaAtual === item ? 'page' : undefined}
              style={{
                ...estiloBase,
                background: paginaAtual === item ? '#fca311' : '#242424',
                color: paginaAtual === item ? '#1a1a2e' : '#aaa',
                border: paginaAtual === item ? 'none' : estiloBase.border,
                padding: '8px 14px',
                cursor: 'pointer',
                minWidth: '38px',
              }}
            >
              {item}
            </button>
          )
      )}

      <button
        onClick={() => aoMudar(paginaAtual + 1)}
        disabled={naUltima}
        aria-label="Próxima página"
        style={{
          ...estiloBase,
          background: naUltima ? '#1a1a1a' : '#242424',
          color: naUltima ? '#444' : '#fff',
          cursor: naUltima ? 'default' : 'pointer',
        }}
      >
        &gt;
      </button>
    </nav>
  );
};

export default Paginacao;
