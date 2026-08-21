// Eventos de medição que dependem de uma ação real de quem está no site.
//
// O Pixel do Facebook é carregado no index.html e deixa `window.fbq` de pé.
// Ele pode simplesmente não existir: bloqueador de anúncio, rede fora do ar,
// ou alguém navegando com scripts de terceiros barrados. Medir nunca pode
// derrubar o que a pessoa veio fazer, então aqui a chamada é sempre uma
// tentativa silenciosa — falhou, o site segue.
//
// Nome no padrão do Facebook. Significa "alguém terminou de criar uma conta",
// e não "alguém abriu uma página".
export const CONTA_CRIADA = 'CompleteRegistration';

export const medir = (evento) => {
  try {
    window.fbq?.('track', evento);
  } catch (falha) {
    console.error(`Não deu para registrar o evento ${evento}:`, falha);
  }
};
