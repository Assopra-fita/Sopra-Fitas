import React, { useEffect, useRef } from 'react';
import { ligarPremiadoAoBotaoJogar } from '../lib/premiadoAoJogar';

// Versão fixa do EmulatorJS. Apontar para uma branch faz um commit de terceiro
// quebrar todos os jogos sem aviso.
const CDN = 'https://cdn.emulatorjs.org/4.2.3/data/';

// Controles virtuais do Mega Drive, sem os botões de velocidade.
//
// O gamepad virtual do EmulatorJS é desenhado DENTRO do canvas — medido em
// celular, ele cobre 45,3% da imagem em retrato. Parte disso é jogo: o d-pad e
// os botões de ação precisam estar ao alcance do polegar. Mas quatro dos
// botões ficam em `location: "center"`, bem no miolo da tela, e dois deles não
// são do videogame: "Rápido" e "Lento" são truque de emulador.
//
// A biblioteca só acrescenta os botões de velocidade quando NÃO existe um
// `VirtualGamepadSettings` — ela empurra `speedControlButtons` no ramo padrão
// de cada esquema de controle. Declarar o layout, ainda que idêntico ao
// padrão, é o que os remove.
//
// Fora isso, este layout é o mesmo do 4.2.3, com os mesmos `input_value`, que
// são os números de botão do libretro e não podem mudar. Reposicionar o d-pad
// e os botões de ação para fora da imagem depende de mover os agrupamentos
// `.ejs_virtualGamepad_*`, que é CSS e está na Fase 6 do roadmap.
const CONTROLES = {
  segaMD: [
    { type: 'button', text: 'A', id: 'a', location: 'right', right: 145, top: 70, bold: true, input_value: 1 },
    { type: 'button', text: 'B', id: 'b', location: 'right', right: 75, top: 70, bold: true, input_value: 0 },
    { type: 'button', text: 'C', id: 'c', location: 'right', right: 5, top: 70, bold: true, input_value: 8 },
    { type: 'button', text: 'X', id: 'x', location: 'right', right: 145, top: 0, bold: true, input_value: 10 },
    { type: 'button', text: 'Y', id: 'y', location: 'right', right: 75, top: 0, bold: true, input_value: 9 },
    { type: 'button', text: 'Z', id: 'z', location: 'right', right: 5, top: 0, bold: true, input_value: 11 },
    { type: 'dpad', id: 'dpad', location: 'left', left: '50%', right: '50%', joystickInput: false, inputValues: [4, 5, 6, 7] },
    { type: 'button', text: 'Mode', id: 'mode', location: 'center', left: -5, fontSize: 15, block: true, input_value: 2 },
    { type: 'button', text: 'Start', id: 'start', location: 'center', left: 60, fontSize: 15, block: true, input_value: 3 },
  ],
};

// De qual esquema de controle é este core.
const ESQUEMA_DO_CORE = {
  genesis_plus_gx: 'segaMD',
  picodrive: 'segaMD',
  segaMD: 'segaMD',
};

// Script que não faz nada, para o loader "carregar" no lugar do emulator.min.js
// quando ele já foi executado neste documento. Ver o comentário no efeito.
const SCRIPT_VAZIO = 'data:text/javascript,void%200';

// O emulator.min.js já rodou nesta página? Ele declara a classe `EmulatorJS` no
// escopo léxico global, que sobrevive à remoção da tag <script>. `typeof` numa
// variável não declarada devolve "undefined" sem lançar, então isto é seguro na
// primeira vez.
const emulatorJsJaExecutou = () => {
  try {
    return typeof EmulatorJS === 'function';
  } catch {
    return false;
  }
};

// O EmulatorJS é configurado por variáveis globais e cria a instância real em
// window.EJS_emulator. Atenção: window.EJS_player é só o SELETOR CSS de onde
// montar — chamar métodos nele não funciona, é uma string.
const Emulator = ({ gameUrl, core, onPronto, aoFalhar, aoExigirAnuncio }) => {
  const containerRef = useRef(null);

  // Guardado em ref para o efeito abaixo não remontar o emulador toda vez que
  // o pai recriar a função.
  const prontoRef = useRef(onPronto);
  const falhaRef = useRef(aoFalhar);
  const anuncioRef = useRef(aoExigirAnuncio);
  useEffect(() => {
    prontoRef.current = onPronto;
    falhaRef.current = aoFalhar;
    anuncioRef.current = aoExigirAnuncio;
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

      // Sai o loader que este componente injetou E o script do CORE, que quem
      // injeta é o próprio EmulatorJS. Era esse segundo que ficava para trás:
      // é ele que define EJS_Runtime, a fábrica Emscripten que segura a
      // memória WASM do jogo.
      const scriptAntigo = document.getElementById('emulator-script');
      if (scriptAntigo) scriptAntigo.remove();
      for (const s of document.querySelectorAll('script[src*="emulatorjs"]')) {
        s.remove();
      }

      const divJogo = document.getElementById('game');
      if (divJogo) divJogo.innerHTML = '';

      // Solta SÓ as globais que este componente escreveu, e nunca as classes
      // da biblioteca.
      //
      // Já tentei "apagar toda global EJS_*" aqui, e foi pior: EJS_STORAGE,
      // EJS_DUMMYSTORAGE, EJS_SHADERS, EJS_COMPRESSION, EJS_GameManager e
      // EJS_Runtime são as CLASSES que o emulator.min.js define uma vez por
      // documento. Apagá-las só não quebrava porque o script era reexecutado a
      // cada jogo — e essa reexecução é justamente o defeito que a linha do
      // EJS_paths, mais acima, corrige. Sem a reexecução, apagar as classes
      // deixa o segundo jogo com "window.EJS_STORAGE is not a constructor".
      //
      // `EJS_adBlocked` entra na lista porque o loader a recria a cada jogo
      // fechada sobre a instância antiga.
      for (const chave of [
        'EJS_emulator',
        'EJS_ready',
        'EJS_player',
        'EJS_core',
        'EJS_gameUrl',
        'EJS_pathtodata',
        'EJS_startOnLoaded',
        'EJS_DEBUG_XX',
        'EJS_paths',
        'EJS_adBlocked',
        'EJS_VirtualGamepadSettings',
      ]) {
        // `delete` falha calado em global de script clássico declarada com
        // `var` (não-configurável), então a atribuição é o caminho de reserva.
        try {
          delete window[chave];
        } catch {
          // não-configurável: segue para a atribuição abaixo
        }
        if (chave in window && window[chave] !== undefined) {
          try {
            window[chave] = undefined;
          } catch {
            // travada pelo navegador: não há o que fazer
          }
        }
      }
    };

    encerrar();

    // --- 2. CONFIGURAÇÕES GLOBAIS ---
    window.EJS_player = '#game';
    window.EJS_core = core;
    window.EJS_gameUrl = gameUrl;
    window.EJS_pathtodata = CDN;
    // FALSE de propósito, e é o que faz o jogo aparecer no celular.
    //
    // Com `true`, o EmulatorJS pula a própria tela de início — a do botão
    // JOGAR. Sem esse toque não há gesto do usuário, e o Chrome mantém o
    // AudioContext suspenso pela política de autoplay. O laço principal do
    // core Emscripten é movido pelo áudio: com o áudio suspenso ele não
    // desenha UM quadro sequer.
    //
    // O resultado medido no aparelho era o pior tipo de defeito: o emulador
    // dizia `started: true` e `paused: false`, o canvas existia com 652x491,
    // e a tela ficava preta. Tocar no jogo não resolvia, porque quem precisa
    // receber o toque é algo que chame `resume()`. Forçando o resume à mão,
    // o logo da SEGA aparecia no mesmo instante.
    window.EJS_startOnLoaded = false;
    window.EJS_DEBUG_XX = false;

    const esquema = ESQUEMA_DO_CORE[core];
    if (esquema && CONTROLES[esquema]) {
      window.EJS_VirtualGamepadSettings = CONTROLES[esquema];
    }

    // Segundo jogo em diante, no MESMO documento: impede o loader de executar
    // o emulator.min.js outra vez.
    //
    // O loader não tem guarda nenhuma — ele sempre anexa um `<script>` novo do
    // emulator.min.js (loader.js, `await loadScript("emulator.min.js")`). Só
    // que esse arquivo declara classes no topo de um script clássico, e a
    // segunda execução morre com "Identifier 'EJS_STORAGE' has already been
    // declared". Declaração léxica não some ao remover a tag: ela fica no
    // escopo léxico global até o documento morrer.
    //
    // Resultado medido no aparelho antes disto: o 1º jogo abria, e do 2º em
    // diante `EJS_emulator` ficava `undefined` e a sala nunca montava — sem
    // nenhuma mensagem para o jogador. Como quem navega pelo site nunca
    // recarrega a página, na prática só dava para jogar UM jogo por visita.
    //
    // `EJS_paths` é a saída que o próprio loader oferece: quando a chave existe,
    // ele usa aquele endereço no lugar do arquivo. Apontando para um script
    // vazio, a reexecução não acontece e o loader segue direto para o
    // `new EmulatorJS(...)`, usando a classe que já está declarada.
    if (emulatorJsJaExecutou()) {
      window.EJS_paths = { 'emulator.min.js': SCRIPT_VAZIO };
    }

    // O loader registra este callback como o evento "ready" e é por ele que
    // conseguimos a instância para os botões de salvar, carregar e reiniciar.
    window.EJS_ready = () => {
      if (typeof prontoRef.current === 'function') {
        prontoRef.current(window.EJS_emulator);
      }

      // O "ready" do EmulatorJS 4.2.3 é disparado 20 ms depois de o botão
      // JOGAR entrar na página — antes do clique, e antes do download do core,
      // que só começa no clique. É a primeira hora possível de alcançar o botão.
      ligarPremiadoAoBotaoJogar(window.EJS_emulator, (exigencia) =>
        anuncioRef.current?.(exigencia)
      );

      // Solta a fila de anúncios e medição do index.html. Até aqui eles ficam
      // parados de propósito: medido, com eles no caminho crítico o botão
      // JOGAR demora 7,4 s a aparecer, e sem eles 2,0 s. Agora o emulador já
      // está montado e a disputa por CPU e rede não atrasa mais ninguém.
      window.dispatchEvent(new Event('assopra:emulador-pronto'));
    };

    // --- 3. AVISO QUANDO O EMULADOR NÃO CONSEGUE INICIAR ---
    //
    // O `WebAssembly.instantiate` falha por falta de espaço de endereçamento e
    // a rejeição não é tratada por ninguém: o jogador fica olhando para um
    // "Falha ao iniciar o jogo" em vermelho, que é texto da biblioteca, sem
    // saber que basta fechar a aba.
    //
    // Cada core reserva um bloco contíguo — 128 MB em NES, SNES e GBA; 512 MB
    // em Mega Drive e N64 — e o EmulatorJS 4.2.3 não tem como devolvê-lo: a
    // instância expõe 96 métodos e nenhum destroy. Num Chrome de 32 bits, que
    // é o de boa parte dos celulares de entrada, o espaço acaba depois de
    // alguns jogos. Ver a Fase 6 do roadmap.
    //
    // `failedToStart` é a propriedade que a própria biblioteca levanta, e serve
    // para separar "acabou a memória" de qualquer outra falha de abertura.
    const aoRejeitar = (evento) => {
      const motivo = String(evento?.reason?.message ?? evento?.reason ?? '');
      if (!/Cannot allocate Wasm memory|Out of memory/i.test(motivo)) return;

      evento.preventDefault();
      if (typeof falhaRef.current === 'function') falhaRef.current('memoria');
    };
    window.addEventListener('unhandledrejection', aoRejeitar);

    // --- 4. INJEÇÃO DO SCRIPT ---
    const script = document.createElement('script');
    script.src = `${CDN}loader.js`;
    script.id = 'emulator-script';
    script.async = true;

    document.body.appendChild(script);

    // --- 5. LIMPEZA (troca de jogo ou saída da tela) ---
    return () => {
      window.removeEventListener('unhandledrejection', aoRejeitar);
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
