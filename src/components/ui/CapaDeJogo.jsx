import React from 'react';

// Capa com altura fixa. Sem isto, cada card fica do tamanho da imagem que
// recebeu e os cards da mesma linha saem de tamanhos diferentes — era o que
// acontecia na lista de jogos relacionados.
//
// A altura vem por tamanho nomeado, não por número: o valor em pixels é
// decisão de design e mora no CSS.
const ALTURAS = { pequena: 130, media: 150, grande: 160 };

const CapaDeJogo = ({ src, alt, tamanho = 'grande', prioridade = false }) => (
  <div className={`capa capa--${tamanho}`}>
    <img
      className="capa__img"
      src={src}
      alt={alt}
      loading={prioridade ? 'eager' : 'lazy'}
      decoding="async"
      width="200"
      height={ALTURAS[tamanho]}
    />
  </div>
);

export default CapaDeJogo;
