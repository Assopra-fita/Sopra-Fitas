import React from 'react';

// A casca da tabela (rolagem horizontal, cabeçalho, corpo) fica aqui; cada
// célula continua sendo responsabilidade da tela, pelo `render` da coluna.
//
// A rolagem horizontal é sempre ligada: a tabela de players tem 5 colunas com
// campo e botão dentro, e no celular não cabe de outro jeito.
//
// Uma coluna pode trazer `classe`, aplicada ao cabeçalho e à célula: é por onde
// uma tela esconde no celular a coluna que só interessa no desktop, sem depender
// de nth-child, que quebra em silêncio ao reordenar colunas. E `className` vai
// na casca, para a tela poder escopar as próprias regras sem vazar para as
// outras tabelas do projeto.
const Tabela = ({ colunas, dados, chave, vazio, className = '' }) => {
  if (!dados?.length && vazio) return vazio;

  return (
    <div className={['tabela-casca', className].filter(Boolean).join(' ')}>
      <table className="tabela">
        <thead>
          <tr>
            {colunas.map((coluna) => (
              <th key={coluna.cabecalho} scope="col" className={coluna.classe}>
                {coluna.cabecalho}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {dados.map((linha) => (
            <tr key={chave(linha)}>
              {colunas.map((coluna) => (
                <td key={coluna.cabecalho} className={coluna.classe}>
                  {coluna.render(linha)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Tabela;
