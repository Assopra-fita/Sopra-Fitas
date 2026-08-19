// Gera public/sitemap.xml a partir das rotas públicas e do catálogo estático.
// Rode com: node scripts/gerar-sitemap.mjs
//
// Os jogos cadastrados pelo painel ficam no Supabase e não entram aqui: para
// incluí-los seria preciso consultar o banco na geração.
import { writeFileSync } from 'node:fs';
import { games } from '../src/constants/games.js';

const SITE = 'https://assoprafitas.com';
const hoje = new Date().toISOString().slice(0, 10);

const urls = [
  { loc: '/', prioridade: '1.0', frequencia: 'daily' },
  { loc: '/ranking', prioridade: '0.7', frequencia: 'daily' },
  { loc: '/login', prioridade: '0.3', frequencia: 'monthly' },
  ...games.map((j) => ({
    loc: `/jogar/${j.id}`,
    prioridade: '0.8',
    frequencia: 'weekly',
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${SITE}${encodeURI(u.loc)}</loc>
    <lastmod>${hoje}</lastmod>
    <changefreq>${u.frequencia}</changefreq>
    <priority>${u.prioridade}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

writeFileSync(new URL('../public/sitemap.xml', import.meta.url), xml);
console.log(`sitemap.xml gerado com ${urls.length} endereços`);
