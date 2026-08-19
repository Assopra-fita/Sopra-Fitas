import React from 'react';

// Onze telas reimplementavam esta casca, com quatro fundos diferentes para o
// mesmo conceito e três grafias de font-family.
//
// A largura é escolhida por tela: um formulário não quer 1200px, e a tabela de
// jogadores tem cinco colunas e não cabe em 600px.
const CascaDePagina = ({ largura = 'medio', children }) => (
  <div className="casca">
    <div className={`casca__conteudo casca__conteudo--${largura}`}>
      {children}
    </div>
  </div>
);

export default CascaDePagina;
