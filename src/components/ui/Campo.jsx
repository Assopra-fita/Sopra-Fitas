import React, { useId } from 'react';

// Nenhum campo do projeto tinha rótulo associado nem autoComplete: o leitor de
// tela anunciava apenas "caixa de edição", e o navegador não conseguia
// preencher e-mail e senha automaticamente.
const Campo = ({
  rotulo,
  ajuda,
  erro,
  tipo = 'text',
  opcoes,
  compacto = false,
  className = '',
  ...resto
}) => {
  const id = useId();
  const idAjuda = ajuda ? `${id}-ajuda` : undefined;
  const idErro = erro ? `${id}-erro` : undefined;
  const descrito = [idAjuda, idErro].filter(Boolean).join(' ') || undefined;

  const classesEntrada = [
    'campo__entrada',
    tipo === 'textarea' ? 'campo__entrada--area' : '',
    compacto ? 'campo__entrada--compacto' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={['campo', className].filter(Boolean).join(' ')}>
      {rotulo && (
        <label className="campo__rotulo" htmlFor={id}>
          {rotulo}
        </label>
      )}

      {tipo === 'textarea' ? (
        <textarea
          id={id}
          className={classesEntrada}
          aria-describedby={descrito}
          aria-invalid={erro ? true : undefined}
          {...resto}
        />
      ) : tipo === 'select' ? (
        <select
          id={id}
          className={classesEntrada}
          aria-describedby={descrito}
          aria-invalid={erro ? true : undefined}
          {...resto}
        >
          {opcoes?.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={tipo}
          className={classesEntrada}
          aria-describedby={descrito}
          aria-invalid={erro ? true : undefined}
          {...resto}
        />
      )}

      {ajuda && (
        <span className="campo__ajuda" id={idAjuda}>
          {ajuda}
        </span>
      )}
      {erro && (
        <span className="campo__erro" id={idErro} role="alert">
          {erro}
        </span>
      )}
    </div>
  );
};

export default Campo;
