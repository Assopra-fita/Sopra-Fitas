// Cópia de tudo que dá para ler do Supabase, para um lugar que é nosso.
//
// POR QUE ISTO EXISTE: o acervo inteiro — 133 jogos, 186 perfis, e os 534 MB de
// ROM, capa e print que eles referenciam — vive só no projeto do Supabase.
// Nenhum arquivo está hospedado em outro lugar. Enquanto o acesso de
// administrador daquele projeto não estiver com a gente, tudo depende de uma
// conta que não controlamos.
//
//   node scripts/exportar-supabase.mjs              só as tabelas
//   node scripts/exportar-supabase.mjs --arquivos   baixa também os buckets
//
// SÓ LEITURA. Este script nunca escreve no Supabase.
//
// O QUE ELE NÃO ALCANÇA, e nenhuma chave pública alcança: as contas em
// auth.users (senhas incluídas), as políticas de RLS, as triggers e as functions
// do banco. Isso exige a chave secreta do projeto. Ver docs/MIGRACAO-SUPABASE.md.
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { SUPABASE_URL, CABECALHOS_SUPABASE } from '../src/constants/supabase.js';

const PASTA = new URL('../backup/', import.meta.url);
const PASTA_PRIVADA = new URL('privado/', PASTA);
const PASTA_ARQUIVOS = new URL('arquivos/', PASTA);

// As tabelas que o site usa, e onde cada uma pode ser gravada.
//
// `privada` marca o que carrega dado pessoal. Esses arquivos vão para
// backup/privado/, que está no .gitignore: os 186 e-mails da tabela profiles
// não podem entrar num repositório, e um export é justamente a forma mais fácil
// de vazá-los sem perceber.
//
// A ordenação é sempre por `id`, que é chave primária: única e nunca nula. Com
// coluna repetida ou nula a paginação em blocos não é estável — duas consultas
// separadas podem devolver a mesma linha duas vezes e perder outra no meio do
// empate, e o backup sai errado sem nada indicar.
//
// `soRLS` marca a tabela que a chave PÚBLICA nunca consegue ler por inteiro: a
// RLS de `missoes` mostra ao visitante apenas os envios dele, então sem chave
// secreta o resultado é sempre zero. Não é erro, mas também não é backup.
const TABELAS = [
  { nome: 'jogos', arquivo: 'acervo.json' },
  { nome: 'missoes_globais', arquivo: 'desafios.json' },
  { nome: 'missoes', arquivo: 'missoes.json', privada: true, soRLS: true },
  { nome: 'profiles', arquivo: 'perfis.json', privada: true },
];

// Os três baldes de Storage, com as colunas que guardam a URL de cada um.
const BALDES = [
  { balde: 'roms', tabela: 'jogos', coluna: 'rom_url' },
  { balde: 'capas', tabela: 'jogos', coluna: 'capa_url' },
  { balde: 'prints', tabela: 'missoes', coluna: 'print_url' },
];

// O Storage devolve 429 quando apanha. Medido: 16 pedidos ao mesmo tempo
// derrubaram 36 de 266. Quatro passa limpo, e o tempo total muda pouco porque o
// gargalo é banda, não fila.
const EM_PARALELO = 4;

const buscar = async (caminho, cabecalhos = {}) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${caminho}`, {
    headers: { ...CABECALHOS_SUPABASE, ...cabecalhos },
  });
  if (!r.ok) throw new Error(`${r.status} em ${caminho}: ${(await r.text()).slice(0, 120)}`);
  return r.json();
};

// Em blocos porque o PostgREST tem teto de linhas por resposta. Sem isto, um
// acervo que cresce faria o backup parar de trazer tudo em silêncio.
const listarTudo = async (tabela) => {
  const tudo = [];
  const passo = 500;
  for (let de = 0; ; de += passo) {
    const bloco = await buscar(`${tabela}?select=*&order=id`, {
      Range: `${de}-${de + passo - 1}`,
    });
    tudo.push(...bloco);
    if (bloco.length < passo) return tudo;
  }
};

mkdirSync(PASTA, { recursive: true });
mkdirSync(PASTA_PRIVADA, { recursive: true });

const linhas = {};
// Falhas ficam guardadas para o fim decidir o código de saída. Um backup que
// falha pela metade e sai com 0 é pior que um que não roda: quem agendar isso
// vai acreditar que tem cópia quando não tem.
const falhasDeTabela = [];

for (const t of TABELAS) {
  try {
    const dados = await listarTudo(t.nome);
    linhas[t.nome] = dados;

    // Só grava se veio: um erro no meio da paginação não pode substituir o
    // backup anterior, que estava íntegro, por um arquivo truncado.
    const destino = new URL(t.arquivo, t.privada ? PASTA_PRIVADA : PASTA);
    writeFileSync(destino, JSON.stringify(dados, null, 2) + '\n');

    const onde = t.privada ? `backup/privado/${t.arquivo} (fora do git)` : `backup/${t.arquivo}`;
    console.log(`${String(dados.length).padStart(4)} linhas de ${t.nome.padEnd(16)} -> ${onde}`);

    if (dados.length === 0 && t.soRLS) {
      console.log(`     ATENÇÃO: a RLS esconde ${t.nome} da chave pública. Isto NÃO é backup`);
      console.log(`     desta tabela nem do balde que depende dela — só a chave secreta lê tudo.`);
      falhasDeTabela.push(`${t.nome}: zero linhas, a chave pública não enxerga`);
    }
  } catch (e) {
    linhas[t.nome] = [];
    console.log(`  !! ${t.nome}: ${e.message}`);
    console.log(`     o arquivo anterior foi PRESERVADO, não sobrescrito`);
    falhasDeTabela.push(`${t.nome}: ${e.message}`);
  }
}

const encerrar = () => {
  if (!falhasDeTabela.length) return;
  console.log(`\nBACKUP INCOMPLETO — ${falhasDeTabela.length} tabela(s):`);
  for (const f of falhasDeTabela) console.log(`  ${f}`);
  process.exitCode = 1;
};

if (!process.argv.includes('--arquivos')) {
  console.log('\nRode com --arquivos para baixar também os buckets roms, capas e prints.');
  encerrar();
  process.exit(process.exitCode ?? 0);
}

mkdirSync(PASTA_ARQUIVOS, { recursive: true });

// Nome estável e sem colisão: id do dono + o balde. O nome original não serve
// porque dois jogos podem ter capa com o mesmo nome de arquivo.
const nomeLocal = (url, dono, balde) => {
  const ext = new URL(url).pathname.split('.').pop().slice(0, 5) || 'bin';
  return `${balde}/${dono}.${ext}`;
};

const fila = [];
for (const { balde, tabela, coluna } of BALDES) {
  mkdirSync(new URL(`${balde}/`, PASTA_ARQUIVOS), { recursive: true });
  for (const linha of linhas[tabela] ?? []) {
    if (linha[coluna]) fila.push([linha[coluna], nomeLocal(linha[coluna], linha.id, balde)]);
  }
}

let feitos = 0;
const falhas = [];
const total = fila.length;

const trabalhar = async () => {
  for (;;) {
    const item = fila.shift();
    if (!item) return;
    const [url, nome] = item;
    const destino = new URL(nome, PASTA_ARQUIVOS);

    // Pula o que já veio: dá para rodar de novo sem refazer meio giga.
    if (existsSync(destino) && statSync(destino).size > 0) {
      feitos += 1;
      continue;
    }

    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
    } catch (e) {
      falhas.push(`${nome}: ${e.message}`);
    }
    feitos += 1;
    if (feitos % 25 === 0) console.log(`  ${feitos}/${total} arquivos...`);
  }
};

await Promise.all(Array.from({ length: EM_PARALELO }, trabalhar));

console.log(`\n${total - falhas.length} de ${total} arquivos em backup/arquivos/`);
for (const f of falhas) console.log(`  !! ${f}`);
if (falhas.length) falhasDeTabela.push(`${falhas.length} arquivo(s) não baixado(s)`);

// "266 de 266" não quer dizer completo: se uma tabela veio vazia, o balde que
// depende dela também veio, e o total bate por ser zero de zero.
for (const { balde, tabela } of BALDES) {
  if ((linhas[tabela] ?? []).length === 0) {
    console.log(`  !! balde ${balde}: nenhum arquivo, porque ${tabela} veio sem linhas`);
  }
}

encerrar();
