import React, { useEffect, useRef } from 'react';

const AnuncioGPT = ({ adId }) => {
  const displayed = useRef(false);

  useEffect(() => {
    if (displayed.current) return;
    displayed.current = true;

    window.googletag = window.googletag || { cmd: [] };

    // O banner espera a fila PESADA, e não o gpt.js. Desde que o script passou
    // a carregar cedo na sala de jogo (para o anúncio premiado do botão JOGAR
    // chegar a tempo), pedir o criativo junto voltaria a colocar dois 300x250
    // disputando rede com o core do emulador — que é o que a fila resolve.
    const pedir = function () {
      googletag.cmd.push(function () {
        googletag.display(adId);
      });
    };

    if (typeof window.aoLiberarAnuncios === 'function') {
      window.aoLiberarAnuncios(pedir);
    } else {
      pedir();
    }
  }, [adId]);

  return (
    // A moldura do anúncio saiu do estilo inline para src/styles/componentes.css.
    // Não é preciosismo: no celular ela precisa sangrar para fora do respiro da
    // página para caber um criativo de 336px, e estilo inline vence media query
    // — a regra existia e não pegava.
    <div className="anuncio">
      <div
        id={adId}
        style={{ minWidth: 250, minHeight: 250 }}
      />
    </div>
  );
};

export default AnuncioGPT;
