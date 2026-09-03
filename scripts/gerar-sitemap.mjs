// Gera dist/sitemap.xml a partir das rotas públicas e do catálogo estático.
// Rode com: node scripts/gerar-sitemap.mjs, DEPOIS do vite build.
//
// Escreve em dist/ e não em public/, como o gerar-paginas.mjs ao lado. Escrever
// em public/ não funcionava: o `vite build` copia public/ para dist/ ANTES de
// este script rodar, então o sitemap publicado era sempre o que estava
// commitado, nunca o recém-gerado. Ficava uma versão atrasada para trás — os
// jogos adicionados desde o último commit do arquivo não entravam, e nenhum
// jogo cadastrado pelo painel entrava nunca.
//
// Inclui o acervo do código e o cadastrado pelo painel, que vive no Supabase.
// Sem o segundo, o sitemap listava 27 de 160 endereços: os outros 130 só seriam
// descobertos pelos links da vitrine, e só até onde a paginação alcança.
import { writeFileSync, existsSync } from 'node:fs';
import { games } from '../src/constants/games.js';
import {
  SUPABASE_URL,
  CABECALHOS_SUPABASE,
} from '../src/constants/supabase.js';

const SITE = 'https://assoprafitas.com';
const hoje = new Date().toISOString().slice(0, 10);

// `encodeURI` não escapa & nem ', e um id com & fecharia a entidade errada e
// derrubaria o XML inteiro — o buscador descarta o sitemap completo, não só
// a linha ruim.
const escaparXml = (t) =>
  String(t)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll("'", '&apos;')
    .replaceAll('"', '&quot;');

let doBanco = [];
try {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/jogos?select=id`, {
    headers: CABECALHOS_SUPABASE,
  });
  if (r.ok) doBanco = await r.json();
  else console.warn(`[sitemap] Supabase respondeu ${r.status}`);
} catch (e) {
  console.warn(`[sitemap] banco indisponível (${e.message}); gerando só o acervo do código`);
}

// Sem repetir id que exista nas duas fontes.
const ids = [...new Set([...doBanco.map((j) => j.id), ...games.map((j) => j.id)])];

const urls = [
  { loc: '/', prioridade: '1.0', frequencia: 'daily' },
  { loc: '/ranking', prioridade: '0.7', frequencia: 'daily' },
  { loc: '/login', prioridade: '0.3', frequencia: 'monthly' },
  ...ids.map((id) => ({
    loc: `/jogar/${id}`,
    prioridade: '0.8',
    frequencia: 'weekly',
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escaparXml(SITE + encodeURI(u.loc))}</loc>
    <lastmod>${hoje}</lastmod>
    <changefreq>${u.frequencia}</changefreq>
    <priority>${u.prioridade}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

const destino = new URL('../dist/sitemap.xml', import.meta.url);

// Sem dist/ o script rodou fora de hora, e gravar aqui criaria um arquivo solto
// que ninguém publica. Falhar alto é melhor que gerar sitemap que não sai.
if (!existsSync(new URL('../dist/', import.meta.url))) {
  throw new Error('dist/ não existe: rode o `vite build` antes deste script.');
}

writeFileSync(destino, xml);
console.log(`dist/sitemap.xml gerado com ${urls.length} endereços`);
