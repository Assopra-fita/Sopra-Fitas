import {
  aoResolverPremiado,
  exibirPremiado,
  premiadoDisponivel,
  prepararPremiado,
  registrar,
} from './anuncioPremiado';

// Liga o anúncio premiado ao botão JOGAR do EmulatorJS.
//
// É o único gatilho de premiado do site: um anúncio por jogo começado, no
// momento de maior intenção — a pessoa já escolheu o jogo, já esperou o
// emulador montar, e o dedo está no botão.
//
// O CLIQUE ORIGINAL NÃO É INTERCEPTADO, e isso é a decisão mais importante
// deste arquivo. Segurar o clique para abrir o anúncio e depois refazê-lo por
// código traria de volta o defeito documentado em Emulator.jsx: sem gesto do
// usuário o Chrome mantém o AudioContext suspenso, e o core Emscripten, que é
// movido pelo áudio, não desenha um quadro sequer. Tela preta com o emulador
// jurando que está rodando.
//
// Então o clique segue inteiro para a biblioteca. O que fazemos é subir junto:
//
//   1. Fase de captura, antes do listener da biblioteca (que é de bolha) e
//      ainda dentro do gesto: abre o premiado. Dentro do gesto é também o que
//      dá ao anúncio o direito de tocar com som.
//   2. A biblioteca faz o trabalho dela: baixa o core e começa o jogo. Isso
//      leva segundos, e acontece atrás do anúncio.
//   3. Se o jogo ficar pronto com o anúncio ainda na tela, ele é pausado — dois
//      áudios ao mesmo tempo seria pior que anúncio nenhum.
//   4. Anúncio fechado, o jogo despausa.
//
// O jogador espera o anúncio para jogar, que é o pedido. Mas o tempo do anúncio
// cai em cima do tempo de download do core, que ele esperaria de qualquer
// forma: é o maior dos dois, e não a soma.
//
// QUANDO O ANÚNCIO NÃO CHEGOU A TEMPO DO CLIQUE, ele não é descartado: o clique
// deixa um pedido de aviso e um novo pedido ao Ad Manager, e o anúncio entra na
// tela assim que carregar. O jogo é pausado nessa hora, esteja rodando ou não.
// Medido, o anúncio fica pronto por volta de 1,5 s, e o botão JOGAR aparece
// entre 0,9 s e 2,2 s conforme a rede — ou seja, o clique cai bem no meio dessa
// disputa, e desistir ali era jogar fora boa parte das exibições.

// A classe vem do `createStartButton` do EmulatorJS 4.2.3. Se um dia a versão
// da CDN mudar em Emulator.jsx, é este seletor que precisa ser conferido: sem o
// botão a função sai calada e o jogo abre sem anúncio.
const SELETOR_DO_BOTAO = '.ejs_start_button';

// Até quando vale a pena ainda jogar um anúncio na cara de quem já clicou.
// Passado isso, a pessoa está jogando há tempo demais para ser interrompida —
// e um anúncio que demorou tudo isso não ia chegar mesmo.
const JANELA_DE_ESPERA = 10 * 1000;

// Quantos pedidos no total por clique. Resposta vazia do Ad Manager pode ser
// falta de campanha naquele segundo, e aí a segunda tentativa resolve. Só que
// quando a unidade não tem demanda NENHUMA — que é o que dá para medir hoje —
// insistir é só gastar rede do jogador para receber o mesmo vazio.
const MAX_TENTATIVAS = 2;

export const ligarPremiadoAoBotaoJogar = (emulador) => {
  const botao = emulador?.elements?.parent?.querySelector(SELETOR_DO_BOTAO);
  if (!botao) {
    registrar('botão JOGAR não encontrado — o jogo abre sem anúncio');
    return;
  }

  let anuncioNaTela = false;
  let aindaQuer = false;

  const mostrar = () => {
    if (!aindaQuer || !premiadoDisponivel()) return;
    aindaQuer = false;
    anuncioNaTela = true;

    // O jogo pode já ter começado, quando o anúncio chega atrasado. O evento
    // `start` abaixo cobre o caminho contrário.
    if (emulador.started) {
      registrar('anúncio chegou com o jogo já rodando: pausando');
      emulador.pause?.(true);
    }

    exibirPremiado().then(() => {
      anuncioNaTela = false;
      registrar('anúncio saiu da tela: despausando o jogo');
      // `true` para o botão de pausa da barra do emulador não trocar de
      // desenho: para o jogador, o jogo nunca esteve pausado.
      //
      // O opcional cobre o anúncio que fecha antes de o jogo existir: até o
      // evento `start`, `play` ainda não foi definido pela biblioteca.
      emulador.play?.(true);
    });
  };

  let tentativas = 0;

  const desistir = (porque) => {
    if (!aindaQuer) return;
    aindaQuer = false;
    aoResolverPremiado(null);
    registrar(`${porque} — o jogo segue sem anúncio`);
  };

  // Fica de olho no desfecho do pedido em pé. Vazio não é o fim: pede outro,
  // até o limite. O jogador não está esperando por nada disso — o core está
  // baixando por baixo o tempo todo.
  const esperar = () => {
    aoResolverPremiado((chegou) => {
      if (!aindaQuer) return;
      if (chegou) return mostrar();

      if (tentativas >= MAX_TENTATIVAS) {
        return desistir('o Ad Manager não devolveu anúncio nenhum');
      }

      tentativas += 1;
      registrar(`resposta vazia: tentando de novo (${tentativas}/${MAX_TENTATIVAS})`);
      prepararPremiado();
      esperar();
    });
  };

  botao.addEventListener(
    'click',
    () => {
      aindaQuer = true;

      // Caminho feliz: o anúncio já está carregado e abre aqui dentro, no
      // gesto, que é o que garante o direito de tocar com som.
      mostrar();
      if (!aindaQuer) {
        registrar('clique no JOGAR: anúncio abriu na hora');
        return;
      }

      // Não estava pronto. Em vez de desistir, espera o desfecho do pedido que
      // já está em pé — `prepararPremiado` é no-op enquanto ele não voltar, e é
      // exatamente esse o caso quando o clique chega antes da resposta.
      registrar('clique no JOGAR sem anúncio pronto: esperando o desfecho');
      tentativas = 1;
      prepararPremiado();
      esperar();

      setTimeout(() => desistir('o anúncio não chegou na janela'), JANELA_DE_ESPERA);
    },
    // `once` porque a própria biblioteca remove o botão no primeiro clique.
    { capture: true, once: true }
  );

  emulador.on('start', () => {
    if (!anuncioNaTela) return;
    registrar('jogo ficou pronto com o anúncio na tela: pausando');
    emulador.pause?.(true);
  });
};
