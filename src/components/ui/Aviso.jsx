import React from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

// A faixa de retorno de uma ação. Vem do useAviso; renderizar nada quando não
// há aviso é o caso normal.
//
// `role` muda com a gravidade de propósito: 'alert' interrompe o leitor de tela
// para anunciar a falha na hora, e 'status' espera ele terminar a frase, que é
// o certo para uma confirmação que não exige reação.
const Aviso = ({ aviso, aoFechar, className = '' }) => {
  if (!aviso) return null;

  const Icone = aviso.erro ? AlertTriangle : CheckCircle2;

  return (
    <p
      className={['aviso', aviso.erro ? 'aviso--erro' : '', className]
        .filter(Boolean)
        .join(' ')}
      role={aviso.erro ? 'alert' : 'status'}
    >
      <Icone size={18} aria-hidden="true" />
      <span className="aviso__texto">{aviso.texto}</span>

      {aoFechar && (
        <button
          type="button"
          className="aviso__fechar"
          onClick={aoFechar}
          aria-label="Fechar aviso"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </p>
  );
};

export default Aviso;
