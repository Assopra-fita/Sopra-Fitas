// Confere os 157 jogos da tabela `jogos` do jeito que o visitante os encontra:
// baixando o começo de cada arquivo e olhando o que ele é de verdade.
//
//   node supabase/conferir-acervo.mjs            confere tudo
//   node supabase/conferir-acervo.mjs --so-ruins lista só o que está quebrado
//
// SÓ LEITURA, e só com a chave pública — nenhum privilégio especial.
//
// POR QUE POR ASSINATURA DE BYTES: o defeito mais comum do acervo é a capa
// gravada no campo da ROM. O emulador recebe um PNG, abre em tela preta e não
// escreve nada no console; o jogo aparece bonito na vitrine e só falha para
// quem clica em Jogar. Extensão e content-type não pegam isso, porque os dois
// vêm de quem enviou o arquivo. Os primeiros bytes vêm do arquivo.
import { SUPABASE_URL, CABECALHOS_SUPABASE } from '../src/constants/supabase.js';

const SO_RUINS = process.argv.includes('--so-ruins');

// Assinaturas de imagem e de documento, que num campo de ROM são sempre erro.
const NAO_E_ROM = [
  [[0x89, 0x50, 0x4e, 0x47], 'PNG'],
  [[0xff, 0xd8, 0xff], 'JPEG'],
  [[0x47, 0x49, 0x46, 0x38], 'GIF'],
  [[0x52, 0x49, 0x46, 0x46], 'RIFF/WEBP'],
  [[0x3c, 0x3f, 0x78, 0x6d], 'XML'],
  [[0x3c, 0x21, 0x44, 0x4f], 'HTML'],
  [[0x3c, 0x68, 0x74, 0x6d], 'HTML'],
];

// Assinaturas que confirmam uma ROM de verdade. A lista é curta de propósito:
// a maioria dos formatos de cartucho não tem número mágico nenhum, então o
// certo é usá-la só para CONFIRMAR, nunca para reprovar.
const E_ROM = [
  [[0x4e, 0x45, 0x53, 0x1a], 'iNES (NES)'],
  [[0x53, 0x45, 0x47, 0x41], 'SEGA'],
];

const bate = (bytes, tabela) =>
  tabela.find(([assinatura]) => assinatura.every((b, i) => bytes[i] === b))?.[1] ?? null;

// --- Qual sistema a ROM é DE VERDADE ---
//
// A extensão do arquivo é o que quem cadastrou digitou, e o `core` é o que ele
// escolheu no formulário. Quando os dois discordam, quem manda é o conteúdo.
//
// Isto achou 20 jogos com o core de um sistema e a ROM de outro. O sintoma não
// é tela preta: o RetroArch não consegue carregar a ROM, desiste e mostra o
// PRÓPRIO MENU DE CONFIGURAÇÃO no lugar do jogo. Conferido em /jogar/starfox2,
// que exibia o menu do FCEUmm — core de NES — com uma ROM de Super Nintendo.
// Depois de trocar o core para `snes`, a Arwing apareceu na tela.
//
// A correção é de UM CAMPO: o arquivo sempre estava certo.
const trecho = async (url, de, ate) => {
  const r = await fetch(url, { headers: { Range: `bytes=${de}-${ate}` } });
  if (!r.ok && r.status !== 206) return null;
  return new Uint8Array(await r.arrayBuffer());
};

const texto = (bytes, i, n) =>
  bytes ? Array.from(bytes.slice(i, i + n), (b) => String.fromCharCode(b)).join('') : '';

const LOGO_GAMEBOY = [0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b];

export const sistemaDaRom = async (url, extensao) => {
  const ini = await trecho(url, 0, 0x400);
  if (!ini) return null;

  if (texto(ini, 0, 4) === 'NES\x1a') return 'nes';
  if (ini[0] === 0x80 && ini[1] === 0x37 && ini[2] === 0x12 && ini[3] === 0x40) return 'n64';
  if (texto(ini, 0x100, 4) === 'SEGA') return 'md';
  // Game Boy e Game Boy Color: logo da Nintendo em 0x104, que o console confere
  // no boot. É a assinatura mais confiável que existe no formato.
  if (LOGO_GAMEBOY.every((b, i) => ini[0x104 + i] === b)) return 'gb';
  // Game Boy Advance: o byte 0xB2 do cabeçalho vale sempre 0x96, e 0x00 é um
  // salto ARM (0xEA no byte 3).
  if (ini[0xb2] === 0x96 && ini[3] === 0xea) return 'gba';
  // Cabeçalho de copiador Super Wild Card: 512 bytes na frente da ROM de SNES,
  // com 0xAA 0xBB 0x04 no offset 8. Sem isto, `gekitouburning` passava por
  // "formato desconhecido" e o core errado ficava lá.
  if (ini[8] === 0xaa && ini[9] === 0xbb && ini[10] === 0x04) return 'snes';
  // Cabeçalho de copiador com o nome do jogo em ASCII na frente (SWC/FIG).
  if (/^[A-Z0-9 ]{8,}$/.test(texto(ini, 0, 16))) return 'snes';

  for (const off of [0x1ff0, 0x3ff0, 0x7ff0]) {
    if (texto(await trecho(url, off, off + 8), 0, 8) === 'TMR SEGA') return 'sms';
  }
  // SNES sem cabeçalho de copiador: não tem número mágico, então vale o nome
  // interno em ASCII num dos quatro offsets possíveis.
  for (const off of [0x7fc0, 0x81c0, 0xffc0, 0x101c0]) {
    const nome = texto(await trecho(url, off, off + 20), 0, 21);
    if (nome && /^[\x20-\x7E]{15,21}$/.test(nome)) return 'snes';
  }
  // Atari 2600 não tem cabeçalho nenhum: um cartucho é código puro. Aqui a
  // extensão é a única pista, e é aceitável porque nenhum outro sistema usa
  // `.a26` e o tamanho é sempre minúsculo.
  if (extensao === 'a26') return 'atari';

  return null;
};

// Sistema que cada valor de `core` representa. Os dois vocabulários convivem no
// acervo — nome de sistema veio do painel, nome de core veio do código.
export const SISTEMA_DO_CORE = {
  snes: 'snes', snes9x: 'snes', bsnes: 'snes',
  nes: 'nes', nestopia: 'nes', fceumm: 'nes',
  gba: 'gba', mgba: 'gba',
  gb: 'gb', gbc: 'gb', gambatte: 'gb',
  segaMD: 'md', genesis_plus_gx: 'md', picodrive: 'md',
  sms: 'sms', smsplus: 'sms',
  n64: 'n64', mupen64plus_next: 'n64',
  atari2600: 'atari', stella2014: 'atari',
};

const cabeca = async (url) => {
  // Range em vez de GET inteiro: 16 bytes por arquivo em vez de 600 MB.
  const r = await fetch(url, { headers: { Range: 'bytes=0-15' } });
  const bytes = new Uint8Array(await r.arrayBuffer());
  return {
    status: r.status,
    tipo: r.headers.get('content-type') ?? '',
    tamanho: Number(r.headers.get('content-range')?.split('/')[1] ?? 0),
    bytes,
  };
};

const jogos = await (
  await fetch(`${SUPABASE_URL}/rest/v1/jogos?select=id,nome,console,core,rom_url,capa_url&order=nome`, {
    headers: CABECALHOS_SUPABASE,
  })
).json();

console.log(`\n  ${jogos.length} jogos no acervo\n`);

const problemas = [];
const kb = (b) => (b / 1024).toFixed(0);

// De 8 em 8: o Storage devolve 429 quando apanha, e o backup já mediu que 16 em
// paralelo derrubavam 36 de 266 pedidos.
const LOTE = 8;
const resultados = [];
for (let i = 0; i < jogos.length; i += LOTE) {
  resultados.push(
    ...(await Promise.all(
      jogos.slice(i, i + LOTE).map(async (j) => {
        const falhas = [];
        try {
          const rom = await cabeca(j.rom_url);
          if (rom.status >= 400) falhas.push(`ROM não abre (HTTP ${rom.status})`);
          else {
            const disfarce = bate(rom.bytes, NAO_E_ROM);
            if (disfarce) falhas.push(`a ROM é um ${disfarce}`);
            else if (rom.tamanho > 0 && rom.tamanho < 8 * 1024)
              falhas.push(`ROM de ${kb(rom.tamanho)} KB — pequena demais para ser cartucho`);

            else {
              // A ROM é binário de verdade: agora vale perguntar de QUAL sistema.
              const ext = j.rom_url.split('?')[0].split('.').pop().toLowerCase();
              const real = await sistemaDaRom(j.rom_url, ext);
              const doCore = SISTEMA_DO_CORE[j.core];
              if (!doCore) falhas.push(`core "${j.core}" fora do mapa conhecido`);
              else if (!real) falhas.push(`não reconheci o formato da ROM (core ${j.core})`);
              else if (real !== doCore)
                falhas.push(`a ROM é de ${real} e o core é ${j.core} (${doCore})`);
            }
          }

          const capa = await cabeca(j.capa_url);
          if (capa.status >= 400) falhas.push(`capa não abre (HTTP ${capa.status})`);
          else if (!bate(capa.bytes, NAO_E_ROM)) falhas.push('a capa não tem assinatura de imagem');
        } catch (e) {
          falhas.push(`erro de rede: ${e.message.slice(0, 60)}`);
        }
        return { jogo: j, falhas };
      })
    ))
  );
}

for (const { jogo, falhas } of resultados) {
  if (falhas.length) problemas.push({ jogo, falhas });
  if (SO_RUINS && !falhas.length) continue;
  const marca = falhas.length ? '✗' : '✓';
  console.log(`  ${marca} ${jogo.id.padEnd(26)} ${jogo.nome.slice(0, 34).padEnd(35)} ${falhas.join('; ')}`);
}

console.log('\n' + '='.repeat(70));
console.log(`  ${jogos.length - problemas.length} de ${jogos.length} jogos com ROM e capa íntegras`);

if (problemas.length) {
  console.log(`\n  ${problemas.length} COM PROBLEMA:`);
  for (const { jogo, falhas } of problemas) {
    console.log(`    ${jogo.id.padEnd(26)} ${jogo.nome.slice(0, 30).padEnd(31)} ${falhas.join('; ')}`);
  }
  console.log('\n  Todos são corrigíveis pelo painel do GM: reenviar o arquivo certo.');
}

process.exit(problemas.length ? 1 : 0);
