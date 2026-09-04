// Gera dist/sitemap.xml a partir das rotas públicas e do catálogo do Supabase.
// Rode com: node scripts/gerar-sitemap.mjs, DEPOIS do vite build.
//
// Escreve em dist/ e não em public/, como o gerar-paginas.mjs ao lado. Escrever
// em public/ não funcionava: o `vite build` copia public/ para dist/ ANTES de
// este script rodar, então o sitemap publicado era sempre o que estava
// commitado, nunca o recém-gerado. Ficava uma versão atrasada para trás — os
// jogos adicionados desde o último commit do arquivo não entravam, e nenhum
// jogo cadastrado pelo painel entrava nunca.
//
// O catálogo inteiro vem do Supabase desde que os 24 jogos do código foram para
// a tabela `jogos` — ver docs/CATALOGO-DE-JOGOS.md. Por isso o script PARA se o
// banco não responder: um sitemap com 3 endereços diz ao buscador que o site
// tem três páginas, e ele apaga da busca as 157 que sumiram.
import { writeFileSync, existsSync } from 'node:fs';
import { romEhImagem } from '../src/lib/rom.js';
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
  const r = await fetch(`${SUPABASE_URL}/rest/v1/jogos?select=id,rom_url`, {
    headers: CABECALHOS_SUPABASE,
  });
  if (!r.ok) throw new Error(`Supabase respondeu ${r.status}`);
  doBanco = await r.json();
} catch (e) {
  throw new Error(
    `[sitemap] o banco não respondeu (${e.message}), e ele é a única fonte do ` +
      'catálogo. Abortando em vez de publicar um sitemap com 3 endereços.'
  );
}

if (doBanco.length === 0) {
  throw new Error('[sitemap] o banco devolveu lista vazia. Abortando.');
}

// Jogo com imagem no campo da ROM fica de fora. O sitemap é a lista que a
// gente ENTREGA ao buscador dizendo "vale a pena rastrear isto"; incluir um
// jogo que não abre gasta orçamento de rastreio e leva gente a uma decepção.
// A página dele continua existindo e explica o que houve — ela só sai da
// lista, e volta sozinha quando alguém subir a ROM certa.
const quebrados = doBanco.filter((j) => romEhImagem(j.rom_url));
const ids = [...new Set(doBanco.filter((j) => !romEhImagem(j.rom_url)).map((j) => j.id))];
if (quebrados.length) {
  console.warn(`[sitemap] ${quebrados.length} jogos fora da lista por terem imagem no campo da ROM`);
}

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
