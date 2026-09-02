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
    <div
      style={{
        margin: '10px 0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 250,
        width: '100%',
      }}
    >
      <div
        id={adId}
        style={{ minWidth: 250, minHeight: 250 }}
      />
    </div>
  );
};

export default AnuncioGPT;
