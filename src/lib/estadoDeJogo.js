// Guarda o save state de cada jogo no IndexedDB do navegador.
// O quickSave do EmulatorJS grava no sistema de arquivos em memória e some
// no refresh, então a persistência entre sessões fica por nossa conta.
const BANCO = 'sopra-fitas';
const ARMAZEM = 'estados';
const VERSAO = 1;

const abrir = () =>
  new Promise((resolve, reject) => {
    const pedido = indexedDB.open(BANCO, VERSAO);
    pedido.onupgradeneeded = () => {
      const db = pedido.result;
      if (!db.objectStoreNames.contains(ARMAZEM)) db.createObjectStore(ARMAZEM);
    };
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });

const transacao = async (modo, executar) => {
  const db = await abrir();
  try {
    return await new Promise((resolve, reject) => {
      const pedido = executar(db.transaction(ARMAZEM, modo).objectStore(ARMAZEM));
      pedido.onsuccess = () => resolve(pedido.result);
      pedido.onerror = () => reject(pedido.error);
    });
  } finally {
    db.close();
  }
};

export const gravarEstado = (gameId, bytes) =>
  transacao('readwrite', (armazem) => armazem.put(bytes, gameId));

export const lerEstado = (gameId) =>
  transacao('readonly', (armazem) => armazem.get(gameId));
