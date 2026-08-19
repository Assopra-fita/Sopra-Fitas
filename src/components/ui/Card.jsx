import React from 'react';

// Havia 23 cópias de "card escuro" no projeto, com 20 aparências diferentes e
// sete tons distintos para a mesma superfície.
const Card = ({ destaque = false, centralizado = false, className = '', children, ...resto }) => (
  <div
    className={[
      'card',
      destaque ? 'card--destaque' : '',
      centralizado ? 'card--centralizado' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...resto}
  >
    {children}
  </div>
);

export default Card;
