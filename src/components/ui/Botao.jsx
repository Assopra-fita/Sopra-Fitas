import React from 'react';
import { Link } from 'react-router-dom';

// Existiam 8 cópias do botão amarelo no projeto e nenhuma era igual à outra:
// divergiam em cor de fundo, cor de texto e raio. Agora é uma peça só, e o
// visual dela mora em src/styles/componentes.css.
const Botao = ({
  variante = 'primaria',
  cheio = false,
  compacto = false,
  para,
  href,
  className = '',
  children,
  ...resto
}) => {
  const classes = [
    'btn',
    `btn--${variante}`,
    cheio ? 'btn--cheio' : '',
    compacto ? 'btn--compacto' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Um botão que navega deve ser link, para funcionar com clique do meio,
  // "abrir em nova aba" e leitores de tela.
  if (para) {
    return (
      <Link to={para} className={classes} {...resto}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...resto}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...resto}>
      {children}
    </button>
  );
};

export default Botao;
