import React from 'react';
import { Target, Star } from 'lucide-react';

const CardDesafios = ({ missoes, carregando }) => (
  <section className="lateral lateral--desafios">
    <h2 className="lateral__titulo">
      <span className="lateral__titulo-texto">
        <Target size={18} aria-hidden="true" /> Desafios do mês
      </span>
    </h2>

    <div className="lateral__lista">
      {carregando && <p className="lateral__vazio">Buscando missões...</p>}

      {!carregando && missoes.length === 0 && (
        <p className="lateral__vazio">Nenhum desafio no momento.</p>
      )}

      {!carregando &&
        missoes.map((missao) => (
          <article className="desafio" key={missao.id ?? missao.titulo}>
            <h3 className="desafio__titulo">{missao.titulo}</h3>
            <p className="desafio__objetivo">{missao.objetivo}</p>
            <p className="desafio__recompensa">
              <Star size={10} aria-hidden="true" /> +{missao.recompensa} pts
            </p>
          </article>
        ))}
    </div>
  </section>
);

export default CardDesafios;
