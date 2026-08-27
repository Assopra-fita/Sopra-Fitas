import React from 'react';
import { Target, Star } from 'lucide-react';

const CardDesafios = ({ missoes, carregando }) => (
  <section className="lateral lateral--desafios">
    <h2 className="lateral__titulo">
      <span className="lateral__titulo-texto">
        <Target size={18} aria-hidden="true" /> Desafios do mês
      </span>

      {/* O total no cabeçalho é o que avisa que a lista continua além do que
          cabe na caixa. Tentei antes uma sombra de rolagem em CSS e medi que
          ela não produzia diferença visível: os desafios têm fundo próprio e
          a lista rola com barra sobreposta, que some quando parada. */}
      {!carregando && missoes.length > 0 && (
        <span className="lateral__contagem">
          {missoes.length}
          <span className="visualmente-oculto">
            {missoes.length === 1 ? ' desafio' : ' desafios'}
          </span>
        </span>
      )}
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
