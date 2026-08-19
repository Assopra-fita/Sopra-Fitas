import React, { useEffect, useRef } from 'react';

const Emulator = ({ gameUrl, core }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // --- 1. LIMPEZA PREVENTIVA (Antes de carregar um novo jogo) ---
    const limparTudo = () => {
      // Se o player já existe, tenta parar o áudio e os processos
      if (window.EJS_player) {
        if (typeof window.EJS_player.stop === 'function') window.EJS_player.stop();
        if (typeof window.EJS_player.destroy === 'function') window.EJS_player.destroy();
      }

      // Remove o script antigo se ele existir
      const existingScript = document.getElementById('emulator-script');
      if (existingScript) existingScript.remove();

      // Limpa o conteúdo de dentro da div do jogo para não sobrar lixo visual ou áudio
      const gameDiv = document.getElementById('game');
      if (gameDiv) {
        gameDiv.innerHTML = '';
      }

      // Reseta as variáveis globais que o EmulatorJS usa
      delete window.EJS_player;
      delete window.EJS_core;
      delete window.EJS_gameUrl;
      delete window.EJS_pathtodata;
      delete window.EJS_startOnLoaded;
    };

    limparTudo();

    // --- 2. CONFIGURAÇÕES GLOBAIS ---
    window.EJS_player = '#game';
    window.EJS_core = core;
    window.EJS_gameUrl = gameUrl;
    window.EJS_pathtodata = 'https://cdn.emulatorjs.org/4.2.3/data/';
    window.EJS_startOnLoaded = true;
    window.EJS_DEBUG_XX = false; // Desativado para evitar logs desnecessários

    // --- 3. INJEÇÃO DO SCRIPT ---
    const script = document.createElement('script');
    script.src = 'https://cdn.emulatorjs.org/4.2.3/data/loader.js';
    script.id = 'emulator-script';
    script.async = true;

    document.body.appendChild(script);

    // --- 4. CLEANUP (Quando o componente morre ou muda de jogo) ---
    return () => {
      limparTudo();
    };
  }, [gameUrl, core]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        background: '#000', // Garante que o fundo fique preto enquanto carrega
      }}
    >
      <div id="game" style={{ width: '100%', height: '100%' }}></div>
    </div>
  );
};

export default Emulator;