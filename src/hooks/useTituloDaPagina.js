import { useEffect } from 'react';
import { MARCA, TITULO_PADRAO as PADRAO } from '../lib/seo';

// Numa SPA o <title> do index.html vale para todas as rotas, então buscador e
// aba do navegador mostravam o mesmo texto em qualquer página.
export const useTituloDaPagina = (titulo) => {
  useEffect(() => {
    document.title = titulo ? `${titulo} — ${MARCA}` : PADRAO;
    return () => {
      document.title = PADRAO;
    };
  }, [titulo]);
};
