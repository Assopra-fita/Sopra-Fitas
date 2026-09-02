// Anúncio premiado (rewarded) do Google Ad Manager: o slot, e só ele.
//
// Quem liga isto ao botão JOGAR é src/lib/premiadoAoJogar.js. A separação é de
// propósito: este arquivo conhece o GPT e não conhece o EmulatorJS.
//
// O premiado é de uso único. O exemplo oficial do GPT destrói o slot no
// fechamento, e é isso que libera o caminho para pedir o próximo — sem o
// destroySlots o slot fica gasto e nenhum outro anúncio chega.

// Unidade de anúncio no Ad Manager.
//
// ATENÇÃO AO CAMINHO: esta unidade fica na RAIZ da rede, e não debaixo de
// `assoprafitas.com` como os banners (`.../assoprafitas.com/content1`) e o
// interstitial. Não é descuido, é onde ela foi criada no painel — e o Ad
// Manager responde a um caminho errado exatamente como responde a uma unidade
// que não existe: HTTP 200 com resposta vazia, sem erro nenhum. Alinhar este
// caminho com o dos banners "por coerência" desliga o anúncio em silêncio.
//
// O texto da recompensa ("assista a um anúncio para jogar") é configurado no
// painel: quem desenha a oferta é o Google, não este arquivo.
const ID_DO_SLOT = '/23340104016/premiado';

// Unidade de demonstração do Google, que sempre devolve um anúncio de teste.
// É a do exemplo oficial do GPT, e existe justamente para dar pra ver o fluxo
// inteiro — som, pausa do jogo, retomada — sem depender de campanha real nem
// do domínio de produção. Ligada por `?premiado=teste` em qualquer URL.
const ID_DE_TESTE = '/22639388115/rewarded_web_example';

// `?premiado=teste` troca a unidade pela de demonstração E liga os logs.
// `?premiado=log` mantém a unidade REAL e liga só os logs — é o modo de
// conferir, inclusive em produção, se o inventário de vocês está preenchendo.
const modo = () => {
  try {
    return new URLSearchParams(window.location.search).get('premiado');
  } catch {
    return null;
  }
};

const emTeste = () => modo() === 'teste';

// Rastro do fluxo. O anúncio cobre a tela inteira: sem isto não há como ver se
// o jogo pausou embaixo dele na hora certa.
export const registrar = (mensagem) => {
  if (modo()) console.info('[premiado]', mensagem);
};

// Teto para o anúncio fechar sozinho. É o `rewardedSlotClosed` que despausa o
// jogo; se ele não vier — GPT engasgado, criativo quebrado — o jogo ficaria
// parado para sempre atrás de um anúncio morto.
//
// Um minuto, e não os 30 s de antes: medido, o teto de 30 s despausava o jogo
// com o anúncio AINDA rodando. Vídeo premiado costuma dar 15 a 30 s, mas
// depois dele vem o quadro final, que o jogador fecha na hora que quiser. Som
// de jogo por baixo de anúncio no ar é exatamente o que a pausa existe para
// evitar, então o teto tem que ficar longe do tempo normal de um anúncio.
const TETO_DE_EXIBICAO = 60 * 1000;

let slot = null;
// Evento do `rewardedSlotReady`. É ele que carrega o `makeRewardedVisible`, e a
// presença dele é o que significa "tem anúncio pronto para este clique".
let anuncioPronto = null;
// `resolve` de quem está esperando o anúncio fechar para despausar o jogo.
let aoFechar = null;
let ouvintesLigados = false;
// Quem quer ser avisado no desfecho do pedido em pé — `true` se um anúncio
// chegou, `false` se o Ad Manager respondeu vazio. É o que permite ao botão
// JOGAR esperar em vez de desistir, e tentar de novo em vez de ficar preso
// esperando uma resposta que já veio e veio vazia.
let aoResolver = null;

const avisarDesfecho = (chegou) => {
  const avisar = aoResolver;
  aoResolver = null;
  if (avisar) avisar(chegou);
};

const gpt = () => {
  window.googletag = window.googletag || { cmd: [] };
  return window.googletag;
};

const ligarOuvintes = () => {
  if (ouvintesLigados) return;
  ouvintesLigados = true;

  const pubads = window.googletag.pubads();

  // Os três eventos são do serviço inteiro, e não deste slot: a comparação com
  // `slot` é o que impede um premiado de outra origem de mexer neste estado.
  pubads.addEventListener('rewardedSlotReady', (evento) => {
    if (evento.slot !== slot) return;
    anuncioPronto = evento;
    registrar('anúncio carregado e pronto');
    avisarDesfecho(true);
  });

  pubads.addEventListener('rewardedSlotClosed', (evento) => {
    if (evento.slot !== slot) return;
    registrar('anúncio fechado');
    encerrar();
  });

  pubads.addEventListener('slotRenderEnded', (evento) => {
    if (evento.slot !== slot || !evento.isEmpty) return;
    registrar('o Ad Manager respondeu SEM anúncio para este slot');
    // `encerrar` primeiro: ele destrói o slot gasto, e é isso que deixa o
    // caminho livre para quem for avisado pedir outro.
    encerrar();
    avisarDesfecho(false);
  });
};

const encerrar = () => {
  anuncioPronto = null;

  const gasto = slot;
  slot = null;
  if (gasto) window.googletag.destroySlots([gasto]);

  const despausar = aoFechar;
  aoFechar = null;
  if (despausar) despausar();
};

// Pede um premiado. Chamada quando uma sala de jogo abre — é lá que um clique
// em JOGAR vai acontecer daqui a alguns segundos, e um premiado pedido na hora
// certa chega novo, em vez de envelhecer parado desde a Home. Chamada de novo
// no próprio clique, para o caso de o primeiro pedido ter voltado vazio.
//
// Sem efeito quando já existe um pedido em pé ou um anúncio carregado.
export const prepararPremiado = () => {
  if (slot || anuncioPronto) return;

  // `cmd.push` antes de o gpt.js existir é só uma fila: nada aqui dentro roda
  // enquanto a fila LEVE do index.html não injetar o script — o que na sala de
  // jogo acontece no DOMContentLoaded, para o anúncio ter tempo de carregar
  // antes de o botão JOGAR aparecer.
  gpt().cmd.push(() => {
    if (slot) return;
    ligarOuvintes();

    const id = emTeste() ? ID_DE_TESTE : ID_DO_SLOT;

    // Devolve null quando o navegador não suporta o formato.
    const novo = window.googletag.defineOutOfPageSlot(
      id,
      window.googletag.enums.OutOfPageFormat.REWARDED
    );
    if (!novo) {
      registrar('este navegador não suporta anúncio premiado');
      return;
    }

    slot = novo.addService(window.googletag.pubads());
    window.googletag.display(slot);
    registrar(`pedido enviado para ${id}`);
  });
};

// Tem anúncio carregado agora? Consultar isto é de graça: nenhuma rede, nenhum
// await. É o que permite decidir dentro do próprio clique do jogador.
export const premiadoDisponivel = () => anuncioPronto !== null;

// Avisa o desfecho do pedido em pé: `true` anúncio carregado, `false` resposta
// vazia. Para quem clicou no JOGAR antes de a resposta chegar. Uma inscrição
// por vez, e a última manda — só existe um botão JOGAR por jogo, então não há
// fila para guardar. Passar `null` cancela a inscrição.
export const aoResolverPremiado = (fn) => {
  aoResolver = fn;
};

// Abre o premiado e resolve quando ele fechar. Nunca rejeita: falhar aqui é
// falhar em mostrar publicidade, e isso jamais pode deixar um jogo pausado.
//
// PRECISA ser chamada de dentro do gesto do jogador. `makeRewardedVisible` fora
// de um clique real abre um anúncio que o navegador é livre para deixar mudo, e
// premiado mudo não é premiado.
export const exibirPremiado = () =>
  new Promise((resolve) => {
    const evento = anuncioPronto;
    // Zerado antes de abrir: um segundo clique no meio do anúncio não tenta
    // abrir o mesmo premiado de novo.
    anuncioPronto = null;

    if (!evento) return resolve();

    let jaFechou = false;
    let teto = null;

    const fechar = () => {
      if (jaFechou) return;
      jaFechou = true;
      clearTimeout(teto);
      aoFechar = null;
      resolve();
    };

    teto = setTimeout(fechar, TETO_DE_EXIBICAO);
    aoFechar = fechar;

    try {
      evento.makeRewardedVisible();
    } catch (falha) {
      console.error('Não deu para abrir o anúncio premiado:', falha);
      fechar();
    }
  });
