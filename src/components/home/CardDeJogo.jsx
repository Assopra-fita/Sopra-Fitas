import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Botao, CapaDeJogo } from '../ui';

const CardDeJogo = ({ jogo, favorito, aoAlternarFavorito, isMobile }) => (
  <article className="card-jogo">
    <button
      type="button"
      className="card-jogo__favorito"
      onClick={() => aoAlternarFavorito(jogo.id)}
      aria-label={
        favorito
          ? `Remover ${jogo.nome} dos favoritos`
          : `Favoritar ${jogo.nome}`
      }
      aria-pressed={favorito}
    >
      <Heart
        size={18}
        color={favorito ? '#ff4d4d' : 'white'}
        fill={favorito ? '#ff4d4d' : 'none'}
      />
    </button>

    <CapaDeJogo
      src={jogo.capa_url}
      alt={jogo.nome}
      tamanho={isMobile ? 'pequena' : 'grande'}
    />

    <h3 className="card-jogo__nome">{jogo.nome}</h3>
    <span className="card-jogo__console">{jogo.console}</span>

    <Botao para={`/jogar/${jogo.id}`} cheio>
      Jogar
    </Botao>
  </article>
);

export default CardDeJogo;
