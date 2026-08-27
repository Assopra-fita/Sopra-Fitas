import { useEffect, useState } from 'react';

const MOBILE = 768;
const TABLET = 1100;

const medir = () => ({
  isMobile: window.innerWidth <= MOBILE,
  isTablet: window.innerWidth <= TABLET,
});

// Guarda os booleanos, não a largura em pixels: assim o componente só
// re-renderiza quando cruza um breakpoint, e não a cada quadro do gesto de
// redimensionar. No celular isso importa porque o evento dispara quando a barra
// de endereço aparece e some durante a rolagem.
export const useBreakpoint = () => {
  const [faixa, setFaixa] = useState(medir);

  useEffect(() => {
    const aoRedimensionar = () => {
      const novo = medir();
      setFaixa((atual) =>
        atual.isMobile === novo.isMobile && atual.isTablet === novo.isTablet
          ? atual
          : novo
      );
    };

    window.addEventListener('resize', aoRedimensionar);
    window.addEventListener('orientationchange', aoRedimensionar);
    return () => {
      window.removeEventListener('resize', aoRedimensionar);
      window.removeEventListener('orientationchange', aoRedimensionar);
    };
  }, []);

  return faixa;
};
