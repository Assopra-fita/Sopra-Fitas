import React from 'react';
import { AlertTriangle } from 'lucide-react';

const AvisoPrint = () => {
  return (
    <div className="aviso-topo">
      <AlertTriangle size={16} />
      <span>
        Dica de Pro: Para validar missões, use o print nativo do seu aparelho
        (Win+Shift+S ou Celular). Prints do emulador podem sair pretos!
      </span>
    </div>
  );
};

export default AvisoPrint;
