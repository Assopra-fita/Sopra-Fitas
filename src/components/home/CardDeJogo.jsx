import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const CardDeJogo = ({ jogo, favorito, aoAlternarFavorito, isMobile }) => (
  <div
    style={{
      background: '#242038',
      borderRadius: '12px',
      padding: isMobile ? '10px' : '12px',
      textAlign: 'center',
      border: '1px solid #333',
      position: 'relative',
      minWidth: 0,
    }}
  >
    <button
      onClick={() => aoAlternarFavorito(jogo.id)}
      aria-label={
        favorito
          ? `Remover ${jogo.nome} dos favoritos`
          : `Favoritar ${jogo.nome}`
      }
      aria-pressed={favorito}
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.6)',
        border: 'none',
        borderRadius: '50%',
        cursor: 'pointer',
        zIndex: 10,
        // 13px de recuo leva o alvo de toque a 44x44, o mínimo confortável
        padding: '13px',
        lineHeight: 0,
      }}
    >
      <Heart
        size={18}
        color={favorito ? '#ff4d4d' : 'white'}
        fill={favorito ? '#ff4d4d' : 'none'}
      />
    </button>

    <div
      style={{
        height: isMobile ? '130px' : '160px',
        marginBottom: '10px',
        borderRadius: '8px',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      <img
        src={jogo.capa_url}
        alt={jogo.nome}
        loading="lazy"
        decoding="async"
        width="200"
        height={isMobile ? 130 : 160}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>

    <h3
      style={{
        fontSize: isMobile ? '0.78rem' : '0.85rem',
        color: '#fff',
        marginBottom: '5px',
        height: isMobile ? '32px' : '35px',
        overflow: 'hidden',
      }}
    >
      {jogo.nome}
    </h3>

    <span
      style={{
        fontSize: '0.7rem',
        color: '#aaa',
        display: 'block',
        marginBottom: '10px',
      }}
    >
      {jogo.console}
    </span>

    <Link to={`/jogar/${jogo.id}`} style={{ display: 'block' }}>
      <button
        style={{
          background: '#fca311',
          color: '#1a1a2e',
          border: 'none',
          // Altura mínima fixa em vez de recuo calculado: a ação principal do
          // card precisa de 44px para o polegar, independente do tamanho da fonte
          minHeight: '44px',
          padding: '8px 0',
          borderRadius: '6px',
          cursor: 'pointer',
          width: '100%',
          fontWeight: 'bold',
          fontSize: isMobile ? '0.8rem' : '0.9rem',
        }}
      >
        JOGAR
      </button>
    </Link>
  </div>
);

export default CardDeJogo;
