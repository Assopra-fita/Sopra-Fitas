// Service worker do Sopra Fitas.
//
// Existe por dois motivos, nesta ordem:
//
// 1. Sem um service worker com tratador de `fetch`, o Chrome não oferece
//    instalar o site. O manifest sozinho não basta.
// 2. Repetir a visita fica rápido e a casca do site abre mesmo com a rede ruim.
//
// O que ele NÃO faz, de propósito:
//
// - não guarda ROM nem estado de jogo. O acervo passa de 70 MB e estourar a
//   cota do navegador faz o próprio navegador apagar o cache inteiro, sem
//   aviso. Jogo baixado é decisão à parte, não efeito colateral de cache.
// - não guarda nada do Supabase. Ranking, pontos e missões precisam ser os de
//   agora; servir versão velha disso é pior do que não abrir.
// - não guarda o emulador do CDN. É origem de terceiro e versão fixa; deixar
//   o cache HTTP do navegador cuidar dele é mais simples e mais correto.

// Suba a versão para invalidar tudo que ficou para trás.
const VERSAO = 'sopra-fitas-v1';
const CASCA = `${VERSAO}-casca`;
const ESTATICOS = `${VERSAO}-estaticos`;

// A casca mínima para a primeira tela desenhar sem rede.
const ARQUIVOS_DA_CASCA = ['/', '/index.html', '/logo.webp', '/manifest.json'];

// Extensões de ROM. Precisam passar direto: são grandes e imutáveis, e quem
// cuida delas é o cabeçalho de cache do servidor.
const ROM = /\.(sfc|smc|fig|swc|md|smd|bin|gen|nes|fds|unf|gba|gbc|gb|sms|a26|z64|n64|v64)$/i;

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CASCA)
      .then((cache) => cache.addAll(ARQUIVOS_DA_CASCA))
      // Um arquivo da casca que falhe não pode impedir a instalação inteira.
      .catch((e) => console.warn('[sw] casca incompleta:', e))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) =>
        Promise.all(
          nomes
            .filter((nome) => !nome.startsWith(VERSAO))
            .map((nome) => caches.delete(nome))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Rede primeiro, cache como rede de segurança. Vale para a navegação: assim um
// deploy novo aparece na primeira visita, e não na segunda.
const redePrimeiro = async (requisicao) => {
  try {
    const resposta = await fetch(requisicao);
    // Só guarda resposta boa: gravar um 500 ou um redirecionamento aqui
    // deixaria o site quebrado até o usuário limpar o navegador.
    if (resposta.ok && resposta.type === 'basic') {
      const cache = await caches.open(CASCA);
      cache.put('/index.html', resposta.clone());
    }
    return resposta;
  } catch (e) {
    const guardada = await caches.match('/index.html');
    if (guardada) return guardada;
    throw e;
  }
};

// Teto do cache de estáticos. Cada deploy gera nomes com hash novo, e os
// antigos ficariam guardados para sempre: sem teto isso cresce a cada deploy
// até o navegador decidir apagar tudo de uma vez.
const TETO_ESTATICOS = 60;

const aparar = async (nomeDoCache, teto) => {
  const cache = await caches.open(nomeDoCache);
  const chaves = await cache.keys();
  // As mais antigas saem primeiro: a ordem das chaves é a de inserção.
  for (const chave of chaves.slice(0, Math.max(0, chaves.length - teto))) {
    await cache.delete(chave);
  }
};

// Cache primeiro, para o que tem hash no nome ou muda pouco.
const cachePrimeiro = async (requisicao) => {
  const guardada = await caches.match(requisicao);
  if (guardada) return guardada;

  const resposta = await fetch(requisicao);
  // Resposta opaca ou com erro não entra no cache: guardá-la é gravar um
  // defeito que só some quando o usuário limpa o navegador.
  if (resposta.ok && resposta.type === 'basic') {
    const cache = await caches.open(ESTATICOS);
    await cache.put(requisicao, resposta.clone());
    await aparar(ESTATICOS, TETO_ESTATICOS);
  }
  return resposta;
};

self.addEventListener('fetch', (evento) => {
  const { request } = evento;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Só mexe no que é do próprio site.
  if (url.origin !== self.location.origin) return;

  if (ROM.test(url.pathname)) return;

  if (request.mode === 'navigate') {
    evento.respondWith(redePrimeiro(request));
    return;
  }

  const ehEstatico =
    url.pathname.startsWith('/assets/') ||
    /\.(css|js|webp|png|jpe?g|svg|woff2?)$/i.test(url.pathname);

  if (ehEstatico) evento.respondWith(cachePrimeiro(request));
});
