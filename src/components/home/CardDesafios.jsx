import React from 'react';
import { Target, Star } from 'lucide-react';
import { cardLateralStyle } from './estilos';

const CardDesafios = ({ missoes, carregando }) => (
  <div
    style={{
      ...cardLateralStyle,
      border: '1px solid #b77a09',
      boxShadow: '0 4px 15px rgba(224, 168, 16, 0.18)',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '1px solid #333',
        paddingBottom: '5px',
        marginBottom: '10px',
      }}
    >
      <Target size={18} color="#ad630f" />
      <span
        style={{
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '0.85rem',
        }}
      >
        DESAFIOS DO MÊS
      </span>
    </div>

    {/* Rolagem própria: sem o teto, cada desafio novo alonga esta
        coluna e aumenta o vão embaixo dos filtros, já que a grade de
        jogos só começa depois da coluna mais alta da section */}
    <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
      {carregando ? (
        <span style={{ color: '#666', fontSize: '0.8rem' }}>
          Buscando missões...
        </span>
      ) : missoes.length === 0 ? (
        <span style={{ color: '#555', fontSize: '0.75rem' }}>
          Nenhum desafio no momento.
        </span>
      ) : (
        missoes.map((missao, idx) => (
          <div
            key={idx}
            style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '8px',
              borderRadius: '6px',
              marginBottom: '8px',
              borderLeft: '3px solid #b78009',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: '#7209b7',
                marginBottom: '2px',
              }}
            >
              {missao.titulo}
            </div>

            <div
              style={{
                fontSize: '0.7rem',
                color: '#aaa',
                lineHeight: '1.2',
              }}
            >
              {missao.objetivo}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '4px',
              }}
            >
              <Star size={10} color="#fca311" fill="#fca311" />
              <span
                style={{
                  fontSize: '0.7rem',
                  color: '#fca311',
                  fontWeight: 'bold',
                }}
              >
                +{missao.recompensa} pts
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

export default CardDesafios;
