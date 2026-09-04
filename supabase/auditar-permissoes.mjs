// Exercita TODA ação de administrador que existe em src/services/, com sessões
// reais, contra o banco de produção.
//
//   node supabase/auditar-permissoes.mjs <senha-do-admin>
//
// O que ele responde, e que nenhuma leitura de policy responde sozinha: o GM
// consegue mesmo fazer o trabalho dele, e o jogador comum é mesmo barrado em
// cada uma dessas ações. Foi rodando isto que apareceu o buraco que a parte 3
// fechou — um jogador gravava os próprios pontos direto pelo PostgREST, e
// nenhuma leitura de policy tinha me mostrado.
//
// ESTE SCRIPT ESCREVE, ao contrário do conferir.mjs. Tudo que ele cria, ele
// apaga: uma conta comum descartável, uma missão pendente, um jogo e um desafio
// de teste. As alterações em linha existente são gravadas de volta com o valor
// original, e o fim do script confere que não sobrou lixo.
//
// Precisa de access_token_supabase no .env, para pegar a chave de serviço —
// que é o que permite montar o cenário (criar a conta cobaia) sem depender das
// permissões que estão justamente sob teste.
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const RAIZ = new URL('../', import.meta.url).pathname;
const REF = 'maataycmixcmozjhezfe';
const SENHA_ADMIN = process.argv[2];
const ADMIN = 'dev.team.winup@gmail.com';

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')
    .filter((l) => l.trim() && !l.startsWith('#') && l.includes('='))
    .map((l) => { const [k, ...r] = l.split('='); return [k.trim(), r.join('=').trim().replace(/^["']|["']$/g, '')]; })
);
const c = readFileSync(new URL('../src/constants/supabase.js', import.meta.url), 'utf8');
const URL_SB = c.match(/SUPABASE_URL\s*=\s*'([^']+)'/)[1];
const PUB = c.match(/SUPABASE_CHAVE\s*=\s*'([^']+)'/)[1];

const chaves = await (await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys?reveal=true`,
  { headers: { Authorization: `Bearer ${env.access_token_supabase}` } })).json();
const SERVICO = chaves.find((k) => k.name === 'service_role').api_key;
const HS = { apikey: SERVICO, Authorization: `Bearer ${SERVICO}`, 'Content-Type': 'application/json' };

const entrar = async (email, senha) => {
  const r = await (await fetch(`${URL_SB}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: PUB, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: senha }),
  })).json();
  if (!r.access_token) throw new Error(`não entrou como ${email}: ${JSON.stringify(r).slice(0, 120)}`);
  return { apikey: PUB, Authorization: `Bearer ${r.access_token}`, 'Content-Type': 'application/json' };
};

// `...opcoes` vem ANTES de `headers`, e não depois. Ao contrário, a chave
// `headers` de dentro de `opcoes` substituiria o objeto inteiro em vez de se
// somar a ele, e toda chamada com Prefer ou Range sairia sem o token — o que dá
// 401 e parece falta de permissão.
const rest = (H) => async (caminho, opcoes = {}) => {
  const r = await fetch(`${URL_SB}/rest/v1/${caminho}`, { ...opcoes, headers: { ...H, ...(opcoes.headers ?? {}) } });
  const t = await r.text();
  let corpo = null;
  try { corpo = t ? JSON.parse(t) : null; } catch { corpo = t; }
  return { status: r.status, ok: r.ok, corpo, cru: t };
};

let ok = 0, falhou = 0;
const linha = (passou, titulo, nota = '') => {
  console.log(`    ${passou ? '✓' : '✗'} ${titulo.padEnd(48)} ${passou ? '' : nota}`);
  passou ? ok++ : falhou++;
};

// ---------------------------------------------------------------------------
// A bateria. `deve` = 'pode' (a ação tem que funcionar) ou 'nao' (tem que ser
// barrada). Devolver 200 com lista vazia conta como barrado: é assim que a RLS
// recusa um update, e é o erro que já me enganou uma vez.
// ---------------------------------------------------------------------------
const bateria = async (rotulo, H, deve, contexto) => {
  console.log(`\n  ${rotulo}`);
  const r = rest(H);
  const esperado = (passou) => (deve === 'pode' ? passou : !passou);
  // O app pede .select('id') depois de escrever; pedir a representação inteira
  // exigiria SELECT em email e devolveria 403 sem o UPDATE ter sido barrado.
  const REP = { Prefer: 'return=representation' };
  const SO_ID = '&select=id';

  // --- AdminDashboard ---
  {
    // Contar linhas de profiles não é privilégio: é o mesmo número que o
    // ranking já mostra. Vale para os dois papéis.
    const a = await r('profiles?select=id', { method: 'HEAD', headers: { Prefer: 'count=exact', Range: '0-0' } });
    linha(a.ok, 'contarJogadores (vale para os dois papéis)', `HTTP ${a.status}`);
    const b = await r('jogos?select=*', { method: 'HEAD', headers: { Prefer: 'count=exact', Range: '0-0' } });
    linha(b.ok, 'contarJogos (público, sempre funciona)', `HTTP ${b.status}`);
    // A fila de missões não responde 403 para quem não é admin: a RLS filtra
    // linha, então ele recebe 200 com os PRÓPRIOS envios (nenhum, aqui). O que
    // separa admin de jogador é enxergar a fila dos OUTROS.
    const d = await r('missoes?select=id,user_id&status=eq.pendente');
    const viuAFila = Array.isArray(d.corpo) && d.corpo.some((m) => m.id === contexto.pendente.id);
    linha(esperado(d.ok && viuAFila), 'listarPendentes (fila de aprovação)', `HTTP ${d.status}, ${Array.isArray(d.corpo) ? d.corpo.length : '?'} linhas`);
  }

  // --- AdminUsuarios ---
  {
    const a = await fetch(`${URL_SB}/rest/v1/rpc/listar_jogadores_admin`, { method: 'POST', headers: H, body: '{}' });
    const corpo = await a.json().catch(() => null);
    const temEmail = Array.isArray(corpo) && corpo.some((x) => x.email);
    linha(esperado(a.ok && temEmail), 'listarJogadores (com e-mail)', `HTTP ${a.status}`);

    const antes = contexto.cobaia.pontos;
    const p = await r(`profiles?id=eq.${contexto.cobaia.id}${SO_ID}`, { method: 'PATCH', headers: REP, body: JSON.stringify({ pontos: 4242 }) });
    const mudou = Array.isArray(p.corpo) && p.corpo.length === 1;
    linha(esperado(mudou), 'atualizarPontos', `HTTP ${p.status}, ${Array.isArray(p.corpo) ? p.corpo.length : '?'} linhas`);
    if (mudou) await fetch(`${URL_SB}/rest/v1/profiles?id=eq.${contexto.cobaia.id}`, { method: 'PATCH', headers: HS, body: JSON.stringify({ pontos: antes }) });

    const q = await r(`profiles?id=eq.${contexto.cobaia.id}${SO_ID}`, { method: 'PATCH', headers: REP, body: JSON.stringify({ role: 'admin' }) });
    const promoveu = Array.isArray(q.corpo) && q.corpo.length === 1;
    linha(esperado(promoveu), 'definirPapel', `HTTP ${q.status}, ${Array.isArray(q.corpo) ? q.corpo.length : '?'} linhas`);
    if (promoveu) await fetch(`${URL_SB}/rest/v1/profiles?id=eq.${contexto.cobaia.id}`, { method: 'PATCH', headers: HS, body: JSON.stringify({ role: 'user' }) });
  }

  // --- AdminJogos / AdminGerenciarJogos ---
  {
    const a = await r('jogos?select=*&order=nome.asc&limit=5');
    linha(a.ok, 'listarAcervo (público, sempre funciona)', `HTTP ${a.status}`);

    const alvo = contexto.jogo;
    const b = await r(`jogos?id=eq.${alvo.id}`, { method: 'PATCH', headers: REP, body: JSON.stringify({ nome: alvo.nome }) });
    linha(esperado(Array.isArray(b.corpo) && b.corpo.length === 1), 'atualizarJogo', `HTTP ${b.status}, ${Array.isArray(b.corpo) ? b.corpo.length : '?'} linhas`);

    const id = `zz-teste-${randomUUID().slice(0, 8)}`;
    const cria = await r('jogos', { method: 'POST', headers: REP, body: JSON.stringify([{ id, nome: 'Teste de permissão', console: 'Teste', core: 'nes',
      capa_url: 'https://exemplo.invalido/c.png', rom_url: 'https://exemplo.invalido/r.nes' }]) });
    const criou = cria.ok && Array.isArray(cria.corpo) && cria.corpo.length === 1;
    linha(esperado(criou), 'cadastrarJogo (linha)', `HTTP ${cria.status} ${cria.cru.slice(0,110)}`);

    if (criou) {
      const apaga = await r(`jogos?id=eq.${id}`, { method: 'DELETE', headers: REP });
      linha(esperado(Array.isArray(apaga.corpo) && apaga.corpo.length === 1), 'removerJogo (linha)', `HTTP ${apaga.status}`);
      await fetch(`${URL_SB}/rest/v1/jogos?id=eq.${id}`, { method: 'DELETE', headers: HS });
    } else {
      linha(esperado(false), 'removerJogo (linha)', 'não criou, não dá para apagar');
    }
  }

  // --- Storage ---
  {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    const nome = `zz-teste-${randomUUID().slice(0, 8)}.png`;
    const sobe = await fetch(`${URL_SB}/storage/v1/object/capas/${nome}`, {
      method: 'POST', headers: { apikey: H.apikey, Authorization: H.Authorization, 'Content-Type': 'image/png' }, body: png,
    });
    linha(esperado(sobe.ok), 'enviarArquivo (capa)', `HTTP ${sobe.status}`);

    const rom = await fetch(`${URL_SB}/storage/v1/object/roms/${nome.replace('.png', '.nes')}`, {
      method: 'POST', headers: { apikey: H.apikey, Authorization: H.Authorization, 'Content-Type': 'application/octet-stream' }, body: Buffer.from('NES\x1a'),
    });
    linha(esperado(rom.ok), 'enviarArquivo (ROM)', `HTTP ${rom.status}`);

    if (sobe.ok) {
      const apaga = await fetch(`${URL_SB}/storage/v1/object/capas/${nome}`, { method: 'DELETE', headers: { apikey: H.apikey, Authorization: H.Authorization } });
      linha(esperado(apaga.ok), 'removerArquivos', `HTTP ${apaga.status}`);
    } else {
      linha(esperado(false), 'removerArquivos', 'não subiu, não dá para apagar');
    }
    // Limpeza garantida, com a chave de serviço.
    for (const [balde, arq] of [['capas', nome], ['roms', nome.replace('.png', '.nes')]]) {
      await fetch(`${URL_SB}/storage/v1/object/${balde}/${arq}`, { method: 'DELETE', headers: { apikey: SERVICO, Authorization: `Bearer ${SERVICO}` } });
    }
  }

  // --- AdminDesafios ---
  {
    const cria = await r('missoes_globais', { method: 'POST', headers: REP, body: JSON.stringify([{ titulo: 'zz teste', objetivo: 'teste de permissão', recompensa: 1, tipo: 'mensal' }]) });
    const criou = cria.ok && Array.isArray(cria.corpo) && cria.corpo.length === 1;
    linha(esperado(criou), 'criarDesafio', `HTTP ${cria.status}`);
    if (criou) {
      const apaga = await r(`missoes_globais?id=eq.${cria.corpo[0].id}`, { method: 'DELETE', headers: REP });
      linha(esperado(Array.isArray(apaga.corpo) && apaga.corpo.length === 1), 'removerDesafio', `HTTP ${apaga.status}`);
      await fetch(`${URL_SB}/rest/v1/missoes_globais?id=eq.${cria.corpo[0].id}`, { method: 'DELETE', headers: HS });
    } else {
      linha(esperado(false), 'removerDesafio', 'não criou');
    }
  }

  // --- AdminMissoes: aprovar e rejeitar ---
  {
    // Missão pendente descartável, criada pela chave de serviço em nome da cobaia.
    const nova = await (await fetch(`${URL_SB}/rest/v1/missoes`, {
      method: 'POST', headers: { ...HS, Prefer: 'return=representation' },
      body: JSON.stringify([{ user_id: contexto.cobaia.id, game_id: 'zz-teste', game_nome: 'Teste', print_url: 'https://exemplo.invalido/x.png', status: 'pendente' }]),
    })).json();
    const idMissao = nova[0]?.id;

    const ap = await fetch(`${URL_SB}/rest/v1/rpc/aprovar_missao_gm`, {
      method: 'POST', headers: H,
      body: JSON.stringify({ id_missao: idMissao, id_jogador: contexto.cobaia.id, qtd_pontos: 7 }),
    });
    const creditou = (await (await fetch(`${URL_SB}/rest/v1/profiles?select=pontos&id=eq.${contexto.cobaia.id}`, { headers: HS })).json())[0]?.pontos;
    linha(esperado(ap.ok && creditou === contexto.cobaia.pontos + 7), 'aprovarMissao (creditou de verdade)', `HTTP ${ap.status}, pontos=${creditou}`);
    await fetch(`${URL_SB}/rest/v1/profiles?id=eq.${contexto.cobaia.id}`, { method: 'PATCH', headers: HS, body: JSON.stringify({ pontos: contexto.cobaia.pontos }) });

    // Segunda aprovação da MESMA missão não pode creditar de novo.
    if (deve === 'pode') {
      await fetch(`${URL_SB}/rest/v1/rpc/aprovar_missao_gm`, {
        method: 'POST', headers: H,
        body: JSON.stringify({ id_missao: idMissao, id_jogador: contexto.cobaia.id, qtd_pontos: 7 }),
      });
      const depois = (await (await fetch(`${URL_SB}/rest/v1/profiles?select=pontos&id=eq.${contexto.cobaia.id}`, { headers: HS })).json())[0]?.pontos;
      linha(depois === contexto.cobaia.pontos, 'aprovar duas vezes NÃO credita dobrado', `pontos=${depois}`);
    }

    await fetch(`${URL_SB}/rest/v1/missoes?id=eq.${idMissao}`, { method: 'PATCH', headers: HS, body: JSON.stringify({ status: 'pendente' }) });
    const rj = await r(`missoes?id=eq.${idMissao}`, { method: 'PATCH', headers: REP, body: JSON.stringify({ status: 'rejeitado' }) });
    linha(esperado(Array.isArray(rj.corpo) && rj.corpo.length === 1), 'rejeitarMissao', `HTTP ${rj.status}, ${Array.isArray(rj.corpo) ? rj.corpo.length : '?'} linhas`);

    await fetch(`${URL_SB}/rest/v1/missoes?id=eq.${idMissao}`, { method: 'DELETE', headers: HS });
    await fetch(`${URL_SB}/rest/v1/profiles?id=eq.${contexto.cobaia.id}`, { method: 'PATCH', headers: HS, body: JSON.stringify({ pontos: contexto.cobaia.pontos }) });
  }
};

// ---------------------------------------------------------------------------

console.log('=== preparando ===');
const senhaCobaia = randomUUID() + 'Aa1!';
const emailCobaia = `zz-teste-${randomUUID().slice(0, 8)}@exemplo.invalido`;
const cobaiaAuth = await (await fetch(`${URL_SB}/auth/v1/admin/users`, {
  method: 'POST', headers: HS, body: JSON.stringify({ email: emailCobaia, email_confirm: true, password: senhaCobaia }),
})).json();
const cobaia = { id: cobaiaAuth.id, pontos: 0 };
console.log(`  conta comum de teste criada: ${emailCobaia}`);

const jogo = (await (await fetch(`${URL_SB}/rest/v1/jogos?select=id,nome&limit=1`, { headers: HS })).json())[0];
const idAdmin = (await (await fetch(`${URL_SB}/rest/v1/profiles?select=id&email=eq.${encodeURIComponent(ADMIN)}`, { headers: HS })).json())[0].id;

// Nenhuma das 5 missões do banco está pendente (4 aprovadas, 1 rejeitada), e
// sem nenhuma pendente a checagem de "o admin enxerga a fila" não checa nada:
// zero linhas é o resultado certo pelo motivo errado.
//
// A pendente pertence à conta de ADMIN, não à cobaia. Assim a checagem separa
// os dois papéis de verdade: o admin tem que enxergá-la, e a cobaia não — se
// pertencesse à cobaia, ela a veria pela policy de "vejo as minhas" e o teste
// não distinguiria nada.
const pendente = (await (await fetch(`${URL_SB}/rest/v1/missoes`, {
  method: 'POST', headers: { ...HS, Prefer: 'return=representation' },
  body: JSON.stringify([{ user_id: idAdmin, game_id: 'zz-fila', game_nome: 'Teste de fila', print_url: 'https://exemplo.invalido/fila.png', status: 'pendente' }]),
})).json())[0];
console.log(`  missão pendente de teste criada: ${pendente.id}`);

const contexto = { cobaia, jogo, pendente };

const Hadmin = await entrar(ADMIN, SENHA_ADMIN);
const Hcomum = await entrar(emailCobaia, senhaCobaia);

const admins = async () => (await (await fetch(`${URL_SB}/rest/v1/profiles?select=email&role=eq.admin`, { headers: HS })).json()).map((x) => x.email);

console.log(`  admins agora: ${(await admins()).join(', ')}`);

console.log('\n\n======== O GM deve poder fazer o trabalho dele ========');
await bateria('sessão de admin', Hadmin, 'pode', contexto);

console.log('\n\n======== O jogador comum deve ser barrado em tudo isso ========');
await bateria('sessão de jogador comum', Hcomum, 'nao', contexto);

console.log('\n\n======== E ainda assim poder jogar ========');
{
  const r = rest(Hcomum);
  const a = await r('profiles?select=id,nome,pontos&order=pontos.desc&limit=5');
  linha(a.ok && a.corpo.length > 0, 'ver o ranking');
  const b = await r(`profiles?select=nome,pontos,role&id=eq.${cobaia.id}`);
  linha(b.ok && b.corpo.length === 1, 'ver o próprio perfil');
  const c2 = await r(`profiles?id=eq.${cobaia.id}&select=id`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ nome: 'Cobaia' }) });
  linha(Array.isArray(c2.corpo) && c2.corpo.length === 1, 'mudar o próprio nome');
  const d = await r(`missoes?select=id,status&user_id=eq.${cobaia.id}`);
  linha(d.ok, 'ver as próprias missões');
  const e = await r('missoes', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify([{ user_id: cobaia.id, game_id: 'zz', game_nome: 'Teste', print_url: 'https://exemplo.invalido/y.png', status: 'pendente' }]) });
  const enviou = e.ok && Array.isArray(e.corpo) && e.corpo.length === 1;
  linha(enviou, 'enviar print de missão própria', `HTTP ${e.status}`);
  if (enviou) await fetch(`${URL_SB}/rest/v1/missoes?id=eq.${e.corpo[0].id}`, { method: 'DELETE', headers: HS });
  const f = await r('jogos?select=id,nome&limit=3');
  linha(f.ok && f.corpo.length > 0, 'ver o catálogo');
  const g = await r('missoes_globais?select=id,titulo');
  linha(g.ok && g.corpo.length > 0, 'ver os desafios do mês');
  // E o que ele NÃO pode: enviar missão no nome de outra pessoa.
  const h = await r('missoes', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify([{ user_id: jogo && contexto.cobaia.id === null ? null : '00000000-0000-0000-0000-000000000000', game_id: 'zz', game_nome: 'T', print_url: 'https://exemplo.invalido/z.png', status: 'pendente' }]) });
  linha(!h.ok, 'NÃO enviar missão no nome de outro', `HTTP ${h.status}`);

  // O buraco que a parte 3 fechou: escrever o próprio placar.
  const i = await r(`profiles?id=eq.${cobaia.id}&select=id`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ pontos: 999999 }) });
  const mexeu = Array.isArray(i.corpo) && i.corpo.length === 1;
  linha(!mexeu, 'NÃO gravar os próprios pontos', `HTTP ${i.status}, ${Array.isArray(i.corpo) ? i.corpo.length : '?'} linhas`);
  if (mexeu) await fetch(`${URL_SB}/rest/v1/profiles?id=eq.${cobaia.id}`, { method: 'PATCH', headers: HS, body: JSON.stringify({ pontos: 0 }) });

  const j = await r(`profiles?id=eq.${cobaia.id}&select=id`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ email: 'invadido@exemplo.invalido' }) });
  linha(!(Array.isArray(j.corpo) && j.corpo.length === 1), 'NÃO trocar o próprio e-mail', `HTTP ${j.status}`);

  const k = await r(`profiles?id=eq.${cobaia.id}&select=id`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ role: 'admin' }) });
  linha(!(Array.isArray(k.corpo) && k.corpo.length === 1), 'NÃO se promover a admin', `HTTP ${k.status}`);

  // E aprovar a própria missão, que é o caminho para pontos sem passar pelo GM.
  const m = await (await fetch(`${URL_SB}/rest/v1/missoes`, { method: 'POST', headers: { ...HS, Prefer: 'return=representation' },
    body: JSON.stringify([{ user_id: cobaia.id, game_id: 'zz', game_nome: 'T', print_url: 'https://exemplo.invalido/w.png', status: 'pendente' }]) })).json();
  const n = await r(`missoes?id=eq.${m[0].id}&select=id`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ status: 'aprovado' }) });
  linha(!(Array.isArray(n.corpo) && n.corpo.length === 1), 'NÃO aprovar a própria missão', `HTTP ${n.status}`);

  const o = await fetch(`${URL_SB}/rest/v1/rpc/aprovar_missao_gm`, { method: 'POST', headers: Hcomum,
    body: JSON.stringify({ id_missao: m[0].id, id_jogador: cobaia.id, qtd_pontos: 500 }) });
  linha(!o.ok, 'NÃO chamar a função de creditar pontos', `HTTP ${o.status}`);
  await fetch(`${URL_SB}/rest/v1/missoes?id=eq.${m[0].id}`, { method: 'DELETE', headers: HS });

  const pf = (await (await fetch(`${URL_SB}/rest/v1/profiles?select=pontos,email,role&id=eq.${cobaia.id}`, { headers: HS })).json())[0];
  linha(pf.pontos === 0 && pf.role === 'user' && !String(pf.email).includes('invadido'),
    'a linha dele continua intacta depois de tudo', JSON.stringify(pf));
}

console.log('\n=== limpando ===');
await fetch(`${URL_SB}/rest/v1/missoes?user_id=eq.${cobaia.id}`, { method: 'DELETE', headers: HS });
await fetch(`${URL_SB}/rest/v1/missoes?game_id=eq.zz-fila`, { method: 'DELETE', headers: HS });
const apagou = await fetch(`${URL_SB}/auth/v1/admin/users/${cobaia.id}`, { method: 'DELETE', headers: HS });
const sobrou = await (await fetch(`${URL_SB}/rest/v1/profiles?select=id&id=eq.${cobaia.id}`, { headers: HS })).json();
console.log(`  conta de teste apagada: HTTP ${apagou.status}, perfis restantes: ${sobrou.length}`);
const lixo = await (await fetch(`${URL_SB}/rest/v1/jogos?select=id&id=like.zz-teste*`, { headers: HS })).json();
const lixo2 = await (await fetch(`${URL_SB}/rest/v1/missoes_globais?select=id&titulo=eq.zz teste`, { headers: HS })).json();
console.log(`  lixo deixado para trás: ${lixo.length} jogos, ${lixo2.length} desafios`);
console.log(`  admins no fim: ${(await admins()).join(', ')}`);

console.log(`\n  ${ok} passaram, ${falhou} falharam\n`);
process.exit(falhou ? 1 : 0);
