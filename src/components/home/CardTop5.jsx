import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Medal } from 'lucide-react';
import { cardLateralStyle } from './estilos';

// Coroa para o 1º, medalha para 2º e 3º, número para o resto.
const iconeDaPosicao = (index) => {
  if (index === 0) return <Crown size={14} color="#fca311" fill="#fca311" />;
  if (index === 1) return <Medal size={14} color="#C0C0C0" />;
  if (index === 2) return <Medal size={14} color="#CD7F32" />;

  return (
    <span style={{ color: '#666', fontSize: '0.7rem', fontWeight: 'bold' }}>
      #{index + 1}
    </span>
  );
};

const CardTop5 = ({ ranking, carregando }) => (
  <div
    style={{
      ...cardLateralStyle,
      background: 'rgba(30, 30, 30, 0.9)',
      boxShadow: '0 4px 15px rgba(168, 99, 9, 0.25)',
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        borderBottom: '1px solid #333',
        paddingBottom: '5px',
        marginBottom: '8px',
        gap: '8px',
      }}
    >
      <span
        style={{
          color: '#fca311',
          fontWeight: 'bold',
          fontSize: '0.85rem',
        }}
      >
        TOP 5
      </span>
      <Link
        to="/ranking"
        style={{
          fontSize: '0.7rem',
          color: '#888',
          textDecoration: 'none',
        }}
      >
        Ver tudo
      </Link>
    </div>

    {carregando ? (
      <span style={{ color: '#666', fontSize: '0.8rem' }}>
        Carregando...
      </span>
    ) : (
      ranking.map((user, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            padding: '6px 0',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              minWidth: 0,
            }}
          >
            {iconeDaPosicao(idx)}
            <span
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user.nome || '---'}
            </span>
          </div>
          <span style={{ color: '#fca311', fontWeight: 'bold' }}>
            {user.pontos}
          </span>
        </div>
      ))
    )}
  </div>
);

export default CardTop5;
