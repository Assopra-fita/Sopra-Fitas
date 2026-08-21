// Gera um HTML por rota pública dentro de dist/, depois do build.
//
// Por que isto existe: o site é uma SPA e o vercel.json manda qualquer
// endereço para o mesmo index.html. As tags de título, descrição e canonical
// escritas pelo React só existem depois que o JavaScript roda — o Google
// executa e enxerga, mas WhatsApp, Facebook e X não executam. Para a prévia do
// link funcionar neles, a tag precisa vir no HTML já servido.
//
// A Vercel confere o sistema de arquivos ANTES de aplicar o rewrite, então
// dist/jogar/<id>/index.html é servido no lugar do fallback da SPA.
//
// Jogo cadastrado pelo painel depois do último deploy não tem página gerada e
// cai no fallback, com as tags genéricas até o próximo deploy. É o preço de
// não ter servidor de aplicação.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { games } from '../src/constants/games.js';
import {
  SUPABASE_URL,
  CABECALHOS_SUPABASE,
} from '../src/constants/supabase.js';
import { normalizarConsole } from '../src/constants/consoles.js';
import { seoDoJogo, seoDoRanking, seoDoLogin } from '../src/lib/seo.js';

const RAIZ = new URL('../dist/', import.meta.url);
const TEMPO_LIMITE = 20_000;

// Um id vira caminho de pasta. Sem esta trava, um id com "../" escreveria fora
// de dist/ — inclusive por cima do index.html da SPA — e um id com barra ou
// com % malformado derrubaria o build sem dizer de quem era a culpa.
//
// A regra recusa o que é perigoso em vez de exigir uma lista curta de
// caracteres: apóstrofo é legal em caminho de URL e há jogo cadastrado com um
// ("tomorrow's-joe"), e uma trava estreita demais tiraria do ar uma página que
// funciona.
const idPerigoso = (id) => {
  const t = String(id ?? '');
  if (!t) return 'vazio';
  if (t.includes('/') || t.includes('\\')) return 'tem barra';
  if (t.split('.').some((parte) => parte === '') && t.includes('..')) return 'tem ".."';
  if (t.startsWith('.')) return 'começa com ponto';
  if (/[\u0000-\u001f\u007f]/.test(t)) return 'tem caractere de controle';
  if (t.includes('%')) return 'tem % (risco de decodificação)';
  if (t.length > 120) return 'longo demais para nome de pasta';
  return null;
};

const escapar = (t) =>
  String(t ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const buscarDoBanco = async () => {
  const cancelar = AbortSignal.timeout(TEMPO_LIMITE);
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/jogos?select=id,nome,console,capa_url`,
    { headers: CABECALHOS_SUPABASE, signal: cancelar }
  );
  if (!r.ok) throw new Error(`Supabase respondeu ${r.status}`);

  const dados = await r.json();
  if (!Array.isArray(dados)) throw new Error('resposta do Supabase não é uma lista');
  return dados;
};

// Cada troca declara o que procura e com o que substitui. Se alguma não casar,
// o build para: sem isso, uma mudança de formato no index.html faria as páginas
// saírem com as tags da Home, silenciosamente, que é o pior resultado possível
// — 157 páginas dizendo ao buscador que são duplicata da home.
const TROCAS = [
  ['title', /<title>[\s\S]*?<\/title>/, (s) => `<title>${escapar(s.titulo)}</title>`],
  ['description', /<meta\s+name="description"[\s\S]*?\/>/, (s) => `<meta name="description" content="${escapar(s.descricao)}" />`],
  ['canonical', /<link rel="canonical"[^>]*\/>/, (s) => `<link rel="canonical" href="${escapar(s.canonical)}" />`],
  ['og:url', /<meta property="og:url"[^>]*\/>/, (s) => `<meta property="og:url" content="${escapar(s.canonical)}" />`],
  ['og:title', /<meta property="og:title"[^>]*\/>/, (s) => `<meta property="og:title" content="${escapar(s.titulo)}" />`],
  ['og:description', /<meta\s+property="og:description"[\s\S]*?\/>/, (s) => `<meta property="og:description" content="${escapar(s.descricao)}" />`],
  ['og:image', /<meta property="og:image"[^>]*\/>/, (s) => `<meta property="og:image" content="${escapar(s.imagem)}" />`],
  // A capa do jogo é retrato pequeno, não o cartão 1200x630 da Home. Declarar a
  // dimensão errada faz o Facebook montar o card esticado antes de terminar de
  // baixar a imagem; sem as tags ele mede o arquivo e acerta sozinho.
  ['og:image:width', /\s*<meta property="og:image:width"[^>]*\/>/, (s) => (s.imagemPadrao ? `\n    <meta property="og:image:width" content="1200" />` : '')],
  ['og:image:height', /\s*<meta property="og:image:height"[^>]*\/>/, (s) => (s.imagemPadrao ? `\n    <meta property="og:image:height" content="630" />` : '')],
  // summary_large_image exige 300x157 no mínimo, e capa de jogo não chega lá.
  ['twitter:card', /<meta name="twitter:card"[^>]*\/>/, (s) => `<meta name="twitter:card" content="${s.imagemPadrao ? 'summary_large_image' : 'summary'}" />`],
  ['twitter:title', /<meta name="twitter:title"[^>]*\/>/, (s) => `<meta name="twitter:title" content="${escapar(s.titulo)}" />`],
  ['twitter:description', /<meta\s+name="twitter:description"[\s\S]*?\/>/, (s) => `<meta name="twitter:description" content="${escapar(s.descricao)}" />`],
  ['twitter:image', /<meta name="twitter:image"[^>]*\/>/, (s) => `<meta name="twitter:image" content="${escapar(s.imagem)}" />`],
];

const trocarTags = (html, seo, onde) => {
  let saida = html;

  for (const [nome, procura, montar] of TROCAS) {
    if (!procura.test(saida)) {
      throw new Error(
        `a tag ${nome} não foi encontrada no index.html do build (gerando ${onde}). ` +
          'O formato do index.html mudou e este script precisa acompanhar.'
      );
    }
    // Função como substituto, e não texto: como texto, um "$&" ou "$'" no nome
    // do jogo seria interpretado como padrão de substituição e injetaria HTML.
    saida = saida.replace(procura, () => montar(seo));
  }

  if (seo.naoIndexar && !/name="robots"/.test(saida)) {
    saida = saida.replace(
      /<link rel="canonical"[^>]*\/>/,
      (m) => `${m}\n    <meta name="robots" content="noindex, follow" />`
    );
  }

  return saida;
};

const modelo = readFileSync(new URL('index.html', RAIZ), 'utf8');

let doBanco = [];
try {
  doBanco = await buscarDoBanco();
  if (doBanco.length === 0) {
    console.warn('[paginas] o banco devolveu lista vazia — gerando só o acervo do código');
  }
} catch (e) {
  // Sem rede o build não pode quebrar: gera o acervo do código e avisa alto.
  console.warn(`[paginas] banco indisponível (${e.message}); gerando só o acervo do código`);
}

const porId = new Map();
for (const j of [...doBanco, ...games]) if (!porId.has(j.id)) porId.set(j.id, j);

const escrever = (caminho, seo) => {
  const pasta = new URL(`${caminho}/`, RAIZ);
  if (!pasta.pathname.startsWith(new URL('.', RAIZ).pathname)) {
    throw new Error(`caminho fora de dist/: ${caminho}`);
  }
  mkdirSync(pasta, { recursive: true });
  writeFileSync(new URL('index.html', pasta), trocarTags(modelo, seo, caminho));
};

const recusados = [];
let escritas = 0;

for (const jogo of porId.values()) {
  const motivo = idPerigoso(jogo.id);
  if (motivo) {
    recusados.push(`"${jogo.id}" (${motivo})`);
    continue;
  }
  escrever(`jogar/${jogo.id}`, seoDoJogo(jogo, normalizarConsole(jogo.console)));
  escritas++;
}

escrever('ranking', { ...seoDoRanking(), imagemPadrao: true });
escrever('login', { ...seoDoLogin(), imagemPadrao: true });

console.log(
  `gerado HTML próprio para ${escritas} jogos ` +
    `(${doBanco.length} do banco, ${games.length} do código) e 2 rotas`
);

if (recusados.length) {
  console.warn(
    `[paginas] ${recusados.length} jogos ficaram sem página gerada porque o id ` +
      `não vale como caminho: ${recusados.join(', ')}. ` +
      'Eles continuam abrindo pelo site, com as tags escritas no navegador.'
  );
}
