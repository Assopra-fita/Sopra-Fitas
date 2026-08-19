import React from 'react';

// A casca da tabela (rolagem horizontal, cabeçalho, corpo) fica aqui; cada
// célula continua sendo responsabilidade da tela, pelo `render` da coluna.
//
// A rolagem horizontal é sempre ligada: a tabela de players tem 5 colunas com
// campo e botão dentro, e no celular não cabe de outro jeito.
const Tabela = ({ colunas, dados, chave, vazio }) => {
  if (!dados?.length && vazio) return vazio;

  return (
    <div className="tabela-casca">
      <table className="tabela">
        <thead>
          <tr>
            {colunas.map((coluna) => (
              <th key={coluna.cabecalho} scope="col">
                {coluna.cabecalho}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {dados.map((linha) => (
            <tr key={chave(linha)}>
              {colunas.map((coluna) => (
                <td key={coluna.cabecalho}>{coluna.render(linha)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Tabela;
