// Move o acervo estático (src/constants/games.js + os arquivos em public/) para
// a tabela `jogos` e os baldes do Supabase.
//
//   node scripts/migrar-jogos-do-codigo.mjs SENHA_DO_ADMIN            ensaio, não escreve
//   node scripts/migrar-jogos-do-codigo.mjs SENHA_DO_ADMIN --aplicar  faz de verdade
//
// POR QUE: os jogos do código só mudam com deploy — o painel do GM não os
// enxerga, não dá para corrigir uma capa errada nem tirar um jogo do ar sem
// alguém abrir o editor. E as ROMs viajam dentro do repositório, que é público.
//
// Sobe usando a SESSÃO DE ADMIN, e não a chave de serviço, de propósito: assim
// a migração passa exatamente pelas mesmas policies que o painel usa. Se algo
// aqui falhar por permissão, é porque o painel também falharia.
//
// É IDEMPOTENTE. Os arquivos sobem com upsert e a linha é gravada com
// `Prefer: resolution=merge-duplicates`, então rodar duas vezes não duplica
// nada nem gera lixo. Rodar de novo depois de corrigir um jogo no games.js
// atualiza a linha.
//
// O QUE ELE NÃO FAZ: não apaga nada de public/ nem mexe no games.js. A retirada
// do acervo estático é um segundo passo, e só depois de conferir que as linhas
// novas funcionam — enquanto os dois existirem, a vitrine usa a do banco e a
// sala de jogo usa a do código, e as duas mostram a mesma coisa.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { games } from '../src/constants/games.js';
import { SUPABASE_URL, SUPABASE_CHAVE } from '../src/constants/supabase.js';

const APLICAR = process.argv.includes('--aplicar');
const SENHA = process.argv[2];
const PUBLICO = new URL('../public/', import.meta.url);

// O balde `capas` só aceita estes tipos desde supabase/02-storage.sql — é o que
// barra SVG e HTML servidos inline num domínio da empresa.
const TIPOS_DE_IMAGEM = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};

// Teto do balde `roms`, definido em supabase/02-storage.sql. É o teto do projeto
// também, então não adianta subir aqui sem mudar o plano.
const TETO_ROM = 50 * 1024 * 1024;

const mb = (b) => (b / 1024 / 1024).toFixed(1).replace('.', ',');
const extensaoDe = (caminho) => caminho.split('?')[0].split('.').pop().toLowerCase();

const entrar = async () => {
  const r = await (
    await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: SUPABASE_CHAVE, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dev.team.winup@gmail.com', password: SENHA }),
    })
  ).json();
  if (!r.access_token) throw new Error(`não entrei: ${JSON.stringify(r).slice(0, 140)}`);
  return { apikey: SUPABASE_CHAVE, Authorization: `Bearer ${r.access_token}` };
};

// Lê o arquivo de public/ ou baixa o de fora. A capa do sms-sonic aponta para a
// Wikipedia: hotlink de imagem de terceiro quebra no dia em que eles mudarem a
// política de referer, e nenhum dos 133 jogos do banco faz isso.
const carregar = async (url) => {
  if (/^https?:/.test(url)) {
    const r = await fetch(url, { headers: { 'User-Agent': 'sopra-fitas-migracao/1.0' } });
    if (!r.ok) throw new Error(`baixar ${url}: HTTP ${r.status}`);
    return { bytes: Buffer.from(await r.arrayBuffer()), origem: 'baixado de fora' };
  }
  const caminho = new URL(`.${url}`, PUBLICO);
  if (!existsSync(caminho)) throw new Error(`não achei public${url}`);
  return { bytes: readFileSync(caminho), origem: `public${url}` };
};

// O acervo do banco já teve 29 jogos com a imagem da capa gravada no campo da
// ROM. O emulador recebe um PNG, abre em tela preta e não reclama de nada — o
// erro só aparece para quem clica em Jogar. Migrar em silêncio um arquivo
// desses seria repetir isso, então a checagem é por assinatura de bytes, não
// por extensão: extensão é o que quem cadastrou digitou, assinatura é o que o
// arquivo é.
const ASSINATURAS = [
  [[0x89, 0x50, 0x4e, 0x47], 'PNG'],
  [[0xff, 0xd8, 0xff], 'JPEG'],
  [[0x47, 0x49, 0x46, 0x38], 'GIF'],
  [[0x52, 0x49, 0x46, 0x46], 'RIFF (WEBP)'],
  [[0x3c, 0x3f, 0x78, 0x6d], 'XML/SVG'],
  [[0x3c, 0x21, 0x44, 0x4f], 'HTML'],
];

const pareceImagem = (bytes) =>
  ASSINATURAS.find(([assinatura]) => assinatura.every((b, i) => bytes[i] === b))?.[1] ?? null;

const subir = async (H, balde, nome, bytes, tipo) => {
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${balde}/${nome}`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': tipo, 'x-upsert': 'true' },
    body: bytes,
  });
  if (!r.ok) throw new Error(`subir ${balde}/${nome}: HTTP ${r.status} ${(await r.text()).slice(0, 120)}`);
  return `${SUPABASE_URL}/storage/v1/object/public/${balde}/${nome}`;
};

// ---------------------------------------------------------------------------

if (!SENHA) {
  console.error('Falta a senha do admin: node scripts/migrar-jogos-do-codigo.mjs SENHA [--aplicar]');
  process.exit(1);
}

console.log(APLICAR ? '=== APLICANDO ===\n' : '=== ENSAIO (nada é escrito) ===\n');

const H = await entrar();
const jaNoBanco = new Set(
  (
    await (
      await fetch(`${SUPABASE_URL}/rest/v1/jogos?select=id`, { headers: H })
    ).json()
  ).map((j) => j.id)
);

let subiuBytes = 0;
const problemas = [];
const feitos = [];

for (const jogo of games) {
  const linha = [];
  try {
    const extRom = extensaoDe(jogo.rom_url);
    const extCapa = extensaoDe(jogo.capa_url);
    const tipoCapa = TIPOS_DE_IMAGEM[extCapa];
    if (!tipoCapa) throw new Error(`capa .${extCapa} não é tipo aceito pelo balde capas`);

    const rom = await carregar(jogo.rom_url);
    const capa = await carregar(jogo.capa_url);
    if (rom.bytes.length > TETO_ROM) throw new Error(`ROM tem ${mb(rom.bytes.length)} MB, o teto é ${mb(TETO_ROM)} MB`);

    const disfarce = pareceImagem(rom.bytes);
    if (disfarce) throw new Error(`o arquivo de ROM é um ${disfarce}, não uma ROM`);
    if (!pareceImagem(capa.bytes)) throw new Error('o arquivo de capa não tem assinatura de imagem');

    const nomeRom = `${jogo.id}.${extRom}`;
    const nomeCapa = `${jogo.id}-capa.${extCapa}`;
    linha.push(
      `${jogo.id.padEnd(22)} ${jogo.nome.slice(0, 30).padEnd(31)}`,
      `rom  ${rom.origem.padEnd(32)} ${mb(rom.bytes.length).padStart(6)} MB -> roms/${nomeRom}`,
      `capa ${capa.origem.slice(0, 32).padEnd(32)} ${mb(capa.bytes.length).padStart(6)} MB -> capas/${nomeCapa}`,
      jaNoBanco.has(jogo.id) ? 'JÁ EXISTE no banco: a linha será atualizada' : 'linha nova'
    );
    subiuBytes += rom.bytes.length + capa.bytes.length;

    if (APLICAR) {
      const [romUrl, capaUrl] = await Promise.all([
        subir(H, 'roms', nomeRom, rom.bytes, 'application/octet-stream'),
        subir(H, 'capas', nomeCapa, capa.bytes, tipoCapa),
      ]);

      const r = await fetch(`${SUPABASE_URL}/rest/v1/jogos?select=id`, {
        method: 'POST',
        headers: { ...H, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify([
          {
            id: jogo.id,
            nome: jogo.nome,
            console: jogo.console,
            core: jogo.core,
            ano: jogo.ano,
            fabricante: jogo.fabricante,
            descricao: jogo.descricao,
            capa_url: capaUrl,
            rom_url: romUrl,
          },
        ]),
      });
      if (!r.ok) throw new Error(`gravar linha: HTTP ${r.status} ${(await r.text()).slice(0, 140)}`);

      // Conferência imediata: os dois arquivos abrem para quem não tem login?
      for (const [rotulo, endereco] of [['ROM', romUrl], ['capa', capaUrl]]) {
        const v = await fetch(endereco, { method: 'HEAD' });
        if (!v.ok) throw new Error(`${rotulo} não abre depois de subir: HTTP ${v.status}`);
      }
      linha.push('gravado e conferido');
    }

    feitos.push(jogo.id);
  } catch (e) {
    problemas.push(`${jogo.id}: ${e.message}`);
    linha.push(`FALHOU: ${e.message}`);
  }
  console.log('  ' + linha.join('\n     ') + '\n');
}

console.log('='.repeat(66));
console.log(`  ${feitos.length} de ${games.length} jogos, ${mb(subiuBytes)} MB de arquivo`);
if (problemas.length) {
  console.log(`\n  ${problemas.length} PROBLEMAS:`);
  for (const p of problemas) console.log(`    ${p}`);
}
if (!APLICAR) console.log('\n  Ensaio. Rode com --aplicar para valer.');
process.exit(problemas.length ? 1 : 0);
