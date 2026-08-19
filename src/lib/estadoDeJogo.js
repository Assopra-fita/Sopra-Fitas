// Guarda o save state de cada jogo no IndexedDB do navegador.
// O quickSave do EmulatorJS grava no sistema de arquivos em memória e some
// no refresh, então a persistência entre sessões fica por nossa conta.
const BANCO = 'sopra-fitas';
const LOJA = 'estados';
const VERSAO = 1;

const abrir = () =>
  new Promise((resolve, reject) => {
    const pedido = indexedDB.open(BANCO, VERSAO);
    pedido.onupgradeneeded = () => {
      const db = pedido.result;
      if (!db.objectStoreNames.contains(LOJA)) db.createObjectStore(LOJA);
    };
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });

const transacao = async (modo, executar) => {
  const db = await abrir();
  try {
    return await new Promise((resolve, reject) => {
      const pedido = executar(db.transaction(LOJA, modo).objectStore(LOJA));
      pedido.onsuccess = () => resolve(pedido.result);
      pedido.onerror = () => reject(pedido.error);
    });
  } finally {
    db.close();
  }
};

export const gravarEstado = (gameId, bytes) =>
  transacao('readwrite', (loja) => loja.put(bytes, gameId));

export const lerEstado = (gameId) =>
  transacao('readonly', (loja) => loja.get(gameId));
