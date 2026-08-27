import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Medal } from 'lucide-react';

// Coroa para o 1º, medalha para 2º e 3º, número para o resto.
const iconeDaPosicao = (index) => {
  if (index === 0)
    return <Crown size={14} color="var(--primaria)" fill="var(--primaria)" />;
  if (index === 1) return <Medal size={14} color="var(--medalha-prata)" />;
  if (index === 2) return <Medal size={14} color="var(--medalha-bronze)" />;

  return <span className="top5__posicao">#{index + 1}</span>;
};

const CardTop5 = ({ ranking, carregando }) => (
  <section className="lateral">
    <h2 className="lateral__titulo">
      <span className="lateral__titulo-texto">Top 5</span>
      <Link to="/ranking" className="lateral__ver-tudo">
        Ver tudo
      </Link>
    </h2>

    {carregando && <p className="lateral__vazio">Carregando...</p>}

    {!carregando && ranking.length === 0 && (
      <p className="lateral__vazio">Ninguém pontuou ainda.</p>
    )}

    {!carregando &&
      ranking.map((usuario, posicao) => (
        <div className="top5__linha" key={usuario.id ?? posicao}>
          <span className="top5__jogador">
            {iconeDaPosicao(posicao)}
            <span className="top5__nome">{usuario.nome || '---'}</span>
          </span>
          <span className="top5__pontos">{usuario.pontos}</span>
        </div>
      ))}
  </section>
);

export default CardTop5;
