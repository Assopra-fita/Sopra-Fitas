import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CapaDeJogo } from '../ui';

const JogosRelacionados = ({ jogos }) => {
  if (!jogos.length) return null;

  return (
    <section className="relacionados">
      <h2 className="relacionados__titulo">
        <ArrowRight size={20} aria-hidden="true" /> Jogos relacionados
      </h2>

      <div className="relacionados__grade">
        {jogos.map((jogo) => (
          <Link
            key={jogo.id}
            to={`/jogar/${jogo.id}`}
            className="relacionados__card"
          >
            <CapaDeJogo src={jogo.capa_url} alt={jogo.nome} tamanho="media" />
            <span className="relacionados__nome">{jogo.nome}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default JogosRelacionados;
