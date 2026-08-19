import React from 'react';
import { Loader2 } from 'lucide-react';

// Blocos de "carregando", "vazio" e "erro". Antes cada tela escrevia o seu, e
// duas delas apagavam a página inteira em vez de mostrar o aviso no lugar.
export const Carregando = ({ children = 'Carregando...' }) => (
  <p className="estado" role="status">
    <Loader2 className="animate-spin" size={32} aria-hidden="true" />
    {children}
  </p>
);

export const EstadoVazio = ({ icone, children }) => (
  <div className="estado">
    {icone}
    <span>{children}</span>
  </div>
);

export const EstadoErro = ({ children }) => (
  <p className="estado estado-erro" role="alert">
    {children}
  </p>
);
