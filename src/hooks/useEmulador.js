import { useCallback, useRef } from 'react';
import { gravarEstado, lerEstado } from '../lib/estadoDeJogo';

// O ID da div que o EmulatorJS ocupa e que o fullscreen usa como alvo.
// Renomear aqui sem renomear no CSS e no componente Emulator quebra os dois.
const ID_DA_TELA = 'tela-do-jogo';

// Os controles da barra da sala de jogo.
//
// A instância real do emulador chega pelo callback `aoPronto` do componente
// Emulator. Antes daqui os botões chamavam métodos em `window.EJS_player`, que
// é só uma string com o seletor CSS: o `if` passava porque string não-vazia é
// verdadeira, e a chamada seguinte lançava TypeError em silêncio. Salvar,
// carregar e reiniciar não faziam nada.
export const useEmulador = (gameId, mostrarAviso) => {
  const emuladorRef = useRef(null);

  const aoPronto = useCallback((emulador) => {
    emuladorRef.current = emulador;
  }, []);

  const gerenciador = () => emuladorRef.current?.gameManager ?? null;

  const salvar = useCallback(async () => {
    const g = gerenciador();
    if (!g) return mostrarAviso('O jogo ainda está carregando', { erro: true });

    try {
      await gravarEstado(gameId, g.getState());
      mostrarAviso('Progresso salvo neste aparelho');
    } catch (e) {
      console.error('Falha ao salvar o estado:', e);
      mostrarAviso('Não foi possível salvar', { erro: true });
    }
  }, [gameId, mostrarAviso]);

  const carregar = useCallback(async () => {
    const g = gerenciador();
    if (!g) return mostrarAviso('O jogo ainda está carregando', { erro: true });

    try {
      const estado = await lerEstado(gameId);
      if (!estado) return mostrarAviso('Nenhum progresso salvo aqui', { erro: true });

      g.loadState(estado);
      mostrarAviso('Progresso carregado');
    } catch (e) {
      console.error('Falha ao carregar o estado:', e);
      mostrarAviso('Não foi possível carregar', { erro: true });
    }
  }, [gameId, mostrarAviso]);

  const reiniciar = useCallback(() => {
    const g = gerenciador();
    if (!g) return mostrarAviso('O jogo ainda está carregando', { erro: true });

    g.restart();
    mostrarAviso('Jogo reiniciado');
  }, [mostrarAviso]);

  const telaCheia = useCallback(() => {
    const elem = document.getElementById(ID_DA_TELA);
    if (!elem) return;

    const pedido = elem.requestFullscreen?.() ?? elem.webkitRequestFullscreen?.();
    // Depois do fullscreen, tenta deitar a tela sozinho (Android).
    // iOS e Safari não suportam o lock — ignorar sem quebrar.
    Promise.resolve(pedido)
      .then(() => screen.orientation?.lock?.('landscape'))
      .catch(() => {});
  }, []);

  return { aoPronto, salvar, carregar, reiniciar, telaCheia, ID_DA_TELA };
};
