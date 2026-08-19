import React, { useEffect, useRef } from 'react';

// Versão fixa do EmulatorJS. Apontar para uma branch faz um commit de terceiro
// quebrar todos os jogos sem aviso.
const CDN = 'https://cdn.emulatorjs.org/4.2.3/data/';

// O EmulatorJS é configurado por variáveis globais e cria a instância real em
// window.EJS_emulator. Atenção: window.EJS_player é só o SELETOR CSS de onde
// montar — chamar métodos nele não funciona, é uma string.
const Emulator = ({ gameUrl, core, onPronto }) => {
  const containerRef = useRef(null);

  // Guardado em ref para o efeito abaixo não remontar o emulador toda vez que
  // o pai recriar a função.
  const prontoRef = useRef(onPronto);
  useEffect(() => {
    prontoRef.current = onPronto;
  });

  useEffect(() => {
    // --- 1. ENCERRA O JOGO ANTERIOR ---
    const encerrar = () => {
      const emulador = window.EJS_emulator;
      if (emulador) {
        try {
          // Encerramento oficial: grava a memória de bateria, para o loop e
          // desmonta o sistema de arquivos. É o mesmo que o EmulatorJS dispara
          // no beforeunload — era só por isso que recarregar a página calava
          // o áudio.
          emulador.callEvent('exit');
        } catch (e) {
          console.warn('Falha ao encerrar o emulador:', e);
        }
      }

      const scriptAntigo = document.getElementById('emulator-script');
      if (scriptAntigo) scriptAntigo.remove();

      const divJogo = document.getElementById('game');
      if (divJogo) divJogo.innerHTML = '';

      delete window.EJS_emulator;
      delete window.EJS_ready;
      delete window.EJS_player;
      delete window.EJS_core;
      delete window.EJS_gameUrl;
      delete window.EJS_pathtodata;
      delete window.EJS_startOnLoaded;
    };

    encerrar();

    // --- 2. CONFIGURAÇÕES GLOBAIS ---
    window.EJS_player = '#game';
    window.EJS_core = core;
    window.EJS_gameUrl = gameUrl;
    window.EJS_pathtodata = CDN;
    window.EJS_startOnLoaded = true;
    window.EJS_DEBUG_XX = false;

    // O loader registra este callback como o evento "ready" e é por ele que
    // conseguimos a instância para os botões de salvar, carregar e reiniciar.
    window.EJS_ready = () => {
      if (typeof prontoRef.current === 'function') {
        prontoRef.current(window.EJS_emulator);
      }
    };

    // --- 3. INJEÇÃO DO SCRIPT ---
    const script = document.createElement('script');
    script.src = `${CDN}loader.js`;
    script.id = 'emulator-script';
    script.async = true;

    document.body.appendChild(script);

    // --- 4. LIMPEZA (troca de jogo ou saída da tela) ---
    return () => {
      if (typeof prontoRef.current === 'function') prontoRef.current(null);
      encerrar();
    };
  }, [gameUrl, core]);

  return (
    <div ref={containerRef} className="emulador">
      <div className="emulador__tela" id="game"></div>
    </div>
  );
};

export default Emulator;
