// Repõe de uma vez as ROMs dos jogos cadastrados com imagem no campo da ROM.
//
//   node scripts/repor-roms.mjs SENHA ~/Downloads/roms             ensaio
//   node scripts/repor-roms.mjs SENHA ~/Downloads/roms --aplicar    faz de verdade
//
// POR QUE ELE EXISTE: 29 jogos do acervo têm um PNG no lugar da ROM — a capa
// foi selecionada duas vezes no formulário. A ROM de verdade nunca chegou a ser
// enviada, e não está em lugar nenhum: procurei no balde (168 arquivos), em
// public/ e public/roms/, no espelho local de backup/arquivos/, no histórico
// inteiro do git (75 ROMs) e nos outros dois projetos Supabase da conta.
//
// Consertar pelo painel são 29 idas ao formulário. Aqui é largar os arquivos
// numa pasta e rodar uma vez.
//
// COMO ELE CASA ARQUIVO COM JOGO, em ordem de confiança:
//   1. o nome do arquivo é igual ao id do jogo;
//   2. o nome gravado DENTRO do cartucho bate com o nome do jogo;
//   3. o nome do arquivo bate com o nome do jogo.
//
// A segunda é a boa: o nome interno é o que a fabricante gravou na ROM, não o
// que quem baixou digitou. "sfc_terranigma_ptbr_v2.smc" casa com Terranigma
// porque o cartucho se identifica como TERRANIGMA lá dentro.
//
// Nada sobe sem passar por três conferências: o arquivo tem que ser binário de
// jogo (não imagem), o sistema detectado tem que bater com o console do
// cadastro, e o tamanho tem que caber no teto de 50 MB do balde.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SUPABASE_URL, SUPABASE_CHAVE, CABECALHOS_SUPABASE } from '../src/constants/supabase.js';
import { romEhImagem } from '../src/lib/rom.js';

const SENHA = process.argv[2];
const PASTA = process.argv[3];
const APLICAR = process.argv.includes('--aplicar');
const TETO = 50 * 1024 * 1024;

if (!SENHA || !PASTA) {
  console.error('uso: node scripts/repor-roms.mjs SENHA PASTA_COM_AS_ROMS [--aplicar]');
  process.exit(1);
}

const EXTENSOES = /\.(sfc|smc|swc|fig|nes|fds|gba|gb|gbc|md|smd|gen|bin|z64|n64|v64|a26|sms|gg)$/i;
const LOGO_GAMEBOY = [0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b];
const texto = (b, i, n) => b.slice(i, i + n).toString('latin1');
const limpo = (s) => s.replace(/[^\x20-\x7e]/g, ' ').replace(/\s+/g, ' ').trim();
const chave = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

// Sistema e nome interno, lidos do arquivo local. Mesmas assinaturas de
// supabase/conferir-acervo.mjs, que é quem confere o resultado depois.
const inspecionar = (caminho) => {
  const b = readFileSync(caminho);
  const ext = caminho.split('.').pop().toLowerCase();

  if (b[0] === 0x89 && b[1] === 0x50) return { sistema: null, motivo: 'é um PNG' };
  if (b[0] === 0xff && b[1] === 0xd8) return { sistema: null, motivo: 'é um JPEG' };

  if (texto(b, 0, 4) === 'NES\x1a') return { sistema: 'nes', interno: '' };
  if (b[0] === 0x80 && b[1] === 0x37 && b[2] === 0x12 && b[3] === 0x40)
    return { sistema: 'n64', interno: limpo(texto(b, 0x20, 20)) };
  if (texto(b, 0x100, 4) === 'SEGA')
    return { sistema: 'md', interno: limpo(texto(b, 0x150, 32)) || limpo(texto(b, 0x120, 32)) };
  if (LOGO_GAMEBOY.every((x, i) => b[0x104 + i] === x))
    return { sistema: 'gb', interno: limpo(texto(b, 0x134, 15)) };
  if (b[0xb2] === 0x96 && b[3] === 0xea) return { sistema: 'gba', interno: limpo(texto(b, 0xa0, 12)) };

  for (const off of [0x7fc0, 0x81c0, 0xffc0, 0x101c0]) {
    const nome = texto(b, off, 21);
    if (/^[\x20-\x7e]{15,21}$/.test(nome)) return { sistema: 'snes', interno: limpo(nome) };
  }
  for (const off of [0x1ff0, 0x3ff0, 0x7ff0]) {
    if (texto(b, off, 8) === 'TMR SEGA') return { sistema: 'sms', interno: '' };
  }
  if (ext === 'a26') return { sistema: 'atari', interno: '' };

  return { sistema: null, motivo: 'não reconheci o formato' };
};

// Console do cadastro -> sistema, e o core que o painel gravaria.
const DO_CONSOLE = [
  [/super\s*nintendo|snes/i, 'snes', 'snes'],
  [/mega\s*drive|genesis/i, 'md', 'segaMD'],
  [/master\s*system/i, 'sms', 'smsplus'],
  [/game\s*boy\s*advance|gba/i, 'gba', 'gba'],
  [/game\s*boy/i, 'gb', 'gambatte'],
  [/nintendo\s*64|n64/i, 'n64', 'mupen64plus_next'],
  [/atari/i, 'atari', 'stella2014'],
  [/nes|nintendinho|famicom/i, 'nes', 'nes'],
];
const doConsole = (nome) => DO_CONSOLE.find(([re]) => re.test(String(nome)))?.slice(1) ?? [null, null];

// ---------------------------------------------------------------------------

const jogos = (
  await (
    await fetch(`${SUPABASE_URL}/rest/v1/jogos?select=id,nome,console,core,rom_url&order=nome`, {
      headers: CABECALHOS_SUPABASE,
    })
  ).json()
).filter((j) => romEhImagem(j.rom_url));

console.log(`\n  ${jogos.length} jogos esperando ROM.`);

const arquivos = readdirSync(PASTA).filter((f) => EXTENSOES.test(f));
console.log(`  ${arquivos.length} arquivos de ROM em ${PASTA}\n`);

const casados = [];
const sobrando = [];

for (const arq of arquivos) {
  const caminho = join(PASTA, arq);
  const tamanho = statSync(caminho).size;
  const base = arq.replace(EXTENSOES, '');
  const { sistema, interno, motivo } = inspecionar(caminho);

  if (!sistema) {
    sobrando.push(`${arq} — ${motivo}`);
    continue;
  }

  const candidato =
    jogos.find((j) => chave(j.id) === chave(base)) ??
    (interno && jogos.find((j) => chave(j.nome).startsWith(chave(interno).slice(0, 10)))) ??
    (interno && jogos.find((j) => chave(interno).startsWith(chave(j.nome).slice(0, 10)))) ??
    jogos.find((j) => chave(j.nome) === chave(base)) ??
    jogos.find((j) => chave(base).includes(chave(j.nome)) && chave(j.nome).length > 8);

  if (!candidato) {
    sobrando.push(`${arq} — ${sistema}${interno ? ` "${interno}"` : ''}, não bate com nenhum dos que faltam`);
    continue;
  }
  if (casados.some((c) => c.jogo.id === candidato.id)) {
    sobrando.push(`${arq} — ${candidato.nome} já foi casado com outro arquivo`);
    continue;
  }

  const [sistemaEsperado, core] = doConsole(candidato.console);
  if (sistemaEsperado && sistema !== sistemaEsperado) {
    sobrando.push(`${arq} — é ${sistema}, mas ${candidato.nome} está cadastrado como ${candidato.console}`);
    continue;
  }
  if (tamanho > TETO) {
    sobrando.push(`${arq} — ${(tamanho / 1024 / 1024).toFixed(1)} MB, acima do teto de 50 MB do balde`);
    continue;
  }

  // O nome de dentro do cartucho confirma, ou desmente, o casamento feito pelo
  // nome do arquivo. "Terranigma.sfc" com "ALADDIN" gravado dentro é um arquivo
  // renomeado, não o jogo — e subir isso trocaria um defeito por outro pior,
  // porque aí o jogo ABRE, só que é outro.
  const confere =
    !interno ||
    chave(interno).slice(0, 8) === chave(candidato.nome).slice(0, 8) ||
    chave(candidato.nome).includes(chave(interno).slice(0, 8)) ||
    chave(interno).includes(chave(candidato.nome).slice(0, 8));

  casados.push({ jogo: candidato, arq, caminho, tamanho, sistema, interno, confere, core: core ?? candidato.core });
}

const seguros = casados.filter((c) => c.confere);
const duvidosos = casados.filter((c) => !c.confere);

const mostrar = (c) => {
  console.log(`  ${c.jogo.nome.slice(0, 34).padEnd(35)} <- ${c.arq}`);
  console.log(
    `     ${(c.tamanho / 1024 / 1024).toFixed(1)} MB · ${c.sistema}` +
      (c.interno ? ` · dentro do cartucho: "${c.interno}"` : '') +
      (c.core !== c.jogo.core ? ` · core ${c.jogo.core} -> ${c.core}` : '')
  );
};

console.log('  --- CASADOS ---');
for (const c of seguros) mostrar(c);
if (!seguros.length) console.log('  (nenhum)');

if (duvidosos.length) {
  console.log('\n  --- NÃO VOU SUBIR: o nome de dentro do cartucho é outro jogo ---');
  for (const c of duvidosos) mostrar(c);
  console.log('     Se o arquivo estiver certo mesmo, renomeie para o id do jogo e rode de novo com --forcar.');
}

if (sobrando.length) {
  console.log('\n  --- NÃO USADOS ---');
  for (const s of sobrando) console.log(`  ${s}`);
}

const paraSubir = process.argv.includes('--forcar') ? casados : seguros;
const faltando = jogos.filter((j) => !paraSubir.some((c) => c.jogo.id === j.id));
if (faltando.length) {
  console.log(`\n  --- AINDA SEM ROM (${faltando.length}) ---`);
  for (const j of faltando) console.log(`  ${j.nome.slice(0, 40).padEnd(41)} ${j.console}`);
}

if (!APLICAR) {
  console.log(`\n  Ensaio. ${paraSubir.length} seriam repostos. Rode com --aplicar para valer.`);
  process.exit(0);
}

// --- Aplicando, pela sessão de admin: as mesmas policies do painel ---
const entrada = await (
  await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_CHAVE, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dev.team.winup@gmail.com', password: SENHA }),
  })
).json();
if (!entrada.access_token) {
  console.error(`  não entrei: ${JSON.stringify(entrada).slice(0, 140)}`);
  process.exit(1);
}
const H = { apikey: SUPABASE_CHAVE, Authorization: `Bearer ${entrada.access_token}` };

console.log('\n  --- APLICANDO ---');
let feitos = 0;
for (const c of paraSubir) {
  const ext = c.arq.split('.').pop().toLowerCase();
  const nome = `${c.jogo.id}.${ext}`;
  try {
    const sobe = await fetch(`${SUPABASE_URL}/storage/v1/object/roms/${encodeURIComponent(nome)}`, {
      method: 'POST',
      headers: { ...H, 'Content-Type': 'application/octet-stream', 'x-upsert': 'true' },
      body: readFileSync(c.caminho),
    });
    if (!sobe.ok) throw new Error(`subir: HTTP ${sobe.status} ${(await sobe.text()).slice(0, 100)}`);

    const url = `${SUPABASE_URL}/storage/v1/object/public/roms/${nome}`;
    const grava = await fetch(`${SUPABASE_URL}/rest/v1/jogos?id=eq.${encodeURIComponent(c.jogo.id)}&select=id`, {
      method: 'PATCH',
      headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ rom_url: url, core: c.core }),
    });
    const linhas = grava.ok ? (await grava.json()).length : -1;
    if (linhas !== 1) throw new Error(`gravar linha: HTTP ${grava.status}`);

    const confere = await fetch(url, { method: 'HEAD' });
    if (!confere.ok) throw new Error(`não abre depois de subir: HTTP ${confere.status}`);

    console.log(`  ✓ ${c.jogo.nome}`);
    feitos++;
  } catch (e) {
    console.log(`  ✗ ${c.jogo.nome}: ${e.message}`);
  }
}

console.log(`\n  ${feitos} de ${paraSubir.length} repostos.`);
console.log('  Confira com: node supabase/conferir-acervo.mjs --so-ruins');
