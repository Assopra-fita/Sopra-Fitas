// Confere, contra o banco de produção, se cada correção de segurança pegou.
//
//   node supabase/conferir.mjs           conferência completa
//   node supabase/conferir.mjs --antes   só mostra o estado, sem julgar
//
// Só faz LEITURA do banco. A única exceção está no fim e é declarada: um
// cadastro de teste de ponta a ponta, que cria uma conta com e-mail
// descartável, confere se o gatilho criou o perfil, e apaga a conta em seguida.
// É o único jeito de saber se o `revoke execute` em handle_new_user quebrou o
// cadastro — o caminho mais caro de quebrar e o mais silencioso.
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

// Escolhe a chave secreta do projeto, preferindo a NOVA (`sb_secret_...`) à
// legada (`service_role`, um JWT).
//
// As duas ignoram a RLS por igual. A diferença é que a legada existe desde que
// o projeto foi criado, pelo time anterior, e não há como saber quem ficou com
// uma cópia. As legadas foram desligadas no projeto justamente por isso — este
// fallback existe só para o script não quebrar se alguém religar.
const escolherSegredo = (chaves) =>
  chaves.find((k) => k.type === 'secret')?.api_key ??
  chaves.find((k) => k.name === 'service_role')?.api_key ??
  null;

const RAIZ = new URL('../', import.meta.url);
const env = Object.fromEntries(
  readFileSync(new URL('.env', RAIZ), 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const [k, ...r] = l.split('=');
      return [k.trim(), r.join('=').trim().replace(/^["']|["']$/g, '')];
    })
);

const REF = 'maataycmixcmozjhezfe';
const constantes = readFileSync(new URL('src/constants/supabase.js', RAIZ), 'utf8');
const pegar = (nome) => constantes.match(new RegExp(`${nome}\\s*=\\s*'([^']+)'`))[1];
const URL_SB = pegar('SUPABASE_URL');
const PUB = pegar('SUPABASE_CHAVE');

const q = async (sql) => {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query/read-only`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.access_token_supabase}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const t = await r.text();
  try {
    return JSON.parse(t);
  } catch {
    throw new Error(t.slice(0, 300));
  }
};

let ok = 0;
let falhou = 0;
const marcar = (passou, titulo, nota = '') => {
  console.log(`  ${passou ? '✓' : '✗'}  ${titulo.padEnd(56)} ${passou ? '' : nota}`);
  passou ? ok++ : falhou++;
};
const checar = async (titulo, sql, esperado) => {
  const r = await q(sql);
  const valor = r[0] ? Object.values(r[0])[0] : null;
  marcar(String(valor) === String(esperado), titulo, `esperava ${esperado}, veio ${valor}`);
};

console.log('\n=== funções com privilégio de dono ===');
await checar(
  'anon NÃO executa aprovar_missao_gm',
  `select has_function_privilege('anon','public.aprovar_missao_gm(uuid,uuid,integer)','EXECUTE')`,
  'false'
);
await checar(
  'aprovar_missao_gm confere se quem chama é admin',
  `select (pg_get_functiondef(p.oid) like '%role = ''admin''%')::text from pg_proc p
     join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='aprovar_missao_gm'`,
  'true'
);
await checar(
  'nenhuma função de public sem search_path fixo',
  `select count(*)::text from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' and p.prosecdef and p.proconfig is null`,
  '0'
);
await checar(
  'atualizar_pontos não existe mais',
  `select count(*)::text from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' and p.proname='atualizar_pontos'`,
  '0'
);

console.log('\n=== profiles: os e-mails ===');
await checar(
  'anon NÃO lê a coluna email',
  `select has_column_privilege('anon','public.profiles','email','SELECT')`,
  'false'
);
await checar(
  'authenticated NÃO lê a coluna email',
  `select has_column_privilege('authenticated','public.profiles','email','SELECT')`,
  'false'
);
await checar(
  'anon AINDA lê nome (o ranking depende)',
  `select has_column_privilege('anon','public.profiles','nome','SELECT')`,
  'true'
);
await checar(
  'anon AINDA lê pontos (o ranking depende)',
  `select has_column_privilege('anon','public.profiles','pontos','SELECT')`,
  'true'
);
await checar(
  'authenticated lê role (as guardas de tela dependem)',
  `select has_column_privilege('authenticated','public.profiles','role','SELECT')`,
  'true'
);
await checar(
  'listar_jogadores_admin é só para quem está logado',
  `select has_function_privilege('authenticated','public.listar_jogadores_admin()','EXECUTE')`,
  'true'
);
await checar(
  'anon NÃO executa listar_jogadores_admin',
  `select has_function_privilege('anon','public.listar_jogadores_admin()','EXECUTE')`,
  'false'
);
await checar(
  'nenhum UPDATE de profiles deixa trocar o próprio role',
  `select count(*)::text from pg_policies where schemaname='public' and tablename='profiles'
     and cmd='UPDATE' and coalesce(with_check, qual) not like '%role%'`,
  '0'
);
await checar(
  'coluna role tem restrição de valor',
  `select count(*)::text from pg_constraint where conrelid='public.profiles'::regclass
     and contype='c' and conname='profiles_role_valido'`,
  '1'
);

console.log('\n=== RLS e escrita anônima ===');
await checar(
  'nenhuma tabela de public com RLS desligada',
  `select count(*)::text from pg_class c join pg_namespace n on n.oid=c.relnamespace
     where n.nspname='public' and c.relkind='r' and not c.relrowsecurity`,
  '0'
);
await checar(
  'loja_shopee trancada (RLS ligada, zero políticas)',
  `select count(*)::text from pg_policies where schemaname='public' and tablename='loja_shopee'`,
  '0'
);
await checar(
  'missoes_globais com leitura pública',
  `select count(*)::text from pg_policies where schemaname='public' and tablename='missoes_globais' and cmd='SELECT'`,
  '1'
);
await checar(
  'nenhuma política de escrita alcança o anônimo',
  `select count(*)::text from pg_policies where schemaname='public'
     and cmd in ('INSERT','UPDATE','DELETE','ALL')
     and ('anon' = any(roles) or ('public' = any(roles) and coalesce(with_check,qual) = 'true'))`,
  '0'
);
await checar(
  'nenhum e-mail cravado dentro de policy',
  `select count(*)::text from pg_policies where schemaname in ('public','storage')
     and coalesce(qual,'')||coalesce(with_check,'') like '%@gmail.com%'`,
  '0'
);
await checar(
  'apagar conta no painel leva perfil e missões junto',
  `select count(*)::text from pg_constraint
     where contype='f' and confdeltype='c'
       and conname in ('profiles_id_fkey','missoes_to_profiles_fk')`,
  '2'
);

console.log('\n=== chaves do projeto ===');
{
  // As chaves legadas (`anon` e `service_role`, os dois JWT) existem desde que o
  // projeto foi criado, pelo time anterior. A `service_role` legada tem BYPASSRLS:
  // ela ignora TODA política deste repositório. Não há como saber quem ficou com
  // uma cópia, e não há como trocar o valor dela — só desligar.
  //
  // Medido antes de desligar: um GET em /rest/v1/profiles?select=email com a
  // chave legada devolvia 200 e a lista de e-mails. Depois: 401 "Legacy API keys
  // are disabled". A propagação levou cerca de 40 segundos.
  //
  // O site não depende delas: o bundle usa a chave publicável nova
  // (sb_publishable_...), conferido baixando o JS de produção.
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys/legacy`, {
    headers: { Authorization: `Bearer ${env.access_token_supabase}` },
  });
  const estado = await r.json();
  marcar(estado.enabled === false, 'chaves legadas (JWT) continuam desligadas', JSON.stringify(estado));

  const chaves = await (
    await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys`, {
      headers: { Authorization: `Bearer ${env.access_token_supabase}` },
    })
  ).json();
  marcar(
    chaves.some((k) => k.type === 'secret') && chaves.some((k) => k.type === 'publishable'),
    'existem as chaves novas (publishable e secret)',
    chaves.map((k) => k.type).join(', ')
  );
  marcar(PUB.startsWith('sb_publishable_'), 'o site usa a chave publicável nova', PUB.slice(0, 12));
}

console.log('\n=== storage ===');
await checar(
  'anônimo NÃO sobe arquivo em balde nenhum',
  `select count(*)::text from pg_policies where schemaname='storage' and tablename='objects'
     and cmd in ('INSERT','UPDATE','ALL') and 'anon' = any(roles)`,
  '0'
);
await checar(
  'anônimo NÃO lista o conteúdo dos baldes',
  `select count(*)::text from pg_policies where schemaname='storage' and tablename='objects'
     and cmd in ('SELECT','ALL') and ('anon' = any(roles) or 'public' = any(roles))`,
  '0'
);
await checar(
  'todo balde com teto de tamanho',
  `select count(*)::text from storage.buckets where file_size_limit is null`,
  '0'
);
await checar(
  'baldes de imagem recusam SVG e HTML',
  `select count(*)::text from storage.buckets
     where name in ('capas','prints','imagens_loja') and allowed_mime_types is null`,
  '0'
);

console.log('\n=== o que o VISITANTE consegue (chave pública, como no site) ===');
const rest = async (caminho, extra = {}) => {
  const r = await fetch(`${URL_SB}/rest/v1/${caminho}`, {
    headers: { apikey: PUB, Authorization: `Bearer ${PUB}`, ...extra },
  });
  return { status: r.status, corpo: await r.text() };
};
// 'linhas' = tem que devolver dados; 'vazio' = 200 com lista vazia, que é como
// o PostgREST responde a tabela com RLS e nenhuma policy; 'erro' = negado.
const anon = async (titulo, caminho, deve) => {
  const { status, corpo } = await rest(caminho);
  const linhas = status === 200 && corpo.trim().startsWith('[') ? JSON.parse(corpo).length : -1;
  const passou =
    deve === 'linhas' ? linhas > 0 : deve === 'vazio' ? linhas === 0 : status !== 200 && !corpo.includes('@');
  marcar(passou, titulo, `HTTP ${status} ${corpo.slice(0, 80)}`);
};
await anon('ranking público (id, nome, pontos)', 'profiles?select=id,nome,pontos&limit=3', 'linhas');
await anon('catálogo de jogos', 'jogos?select=id,nome,console&limit=3', 'linhas');
await anon('desafios do mês', 'missoes_globais?select=id,titulo&limit=3', 'linhas');
await anon('pedir e-mail é BARRADO', 'profiles?select=email&limit=1', 'erro');
await anon('pedir * em profiles é BARRADO', 'profiles?select=*&limit=1', 'erro');
await anon('loja_shopee trancada', 'loja_shopee?select=*&limit=1', 'vazio');

// A função de creditar pontos, com uuid inexistente: nada é alterado no banco,
// mas mostra se o anônimo ainda consegue executá-la.
{
  const NADA = '00000000-0000-0000-0000-000000000000';
  const r = await fetch(`${URL_SB}/rest/v1/rpc/aprovar_missao_gm`, {
    method: 'POST',
    headers: { apikey: PUB, Authorization: `Bearer ${PUB}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_missao: NADA, id_jogador: NADA, qtd_pontos: 1 }),
  });
  marcar(r.status !== 204 && r.status !== 200, 'anônimo NÃO credita pontos pela função', `HTTP ${r.status}`);
}

// Listagem de balde e download público: um tem que parar, o outro tem que
// continuar. É a checagem que separa "fechei" de "quebrei o site".
{
  const l = await fetch(`${URL_SB}/storage/v1/object/list/prints`, {
    method: 'POST',
    headers: { apikey: PUB, Authorization: `Bearer ${PUB}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: '', limit: 5 }),
  });
  const corpo = await l.text();
  const itens = l.status === 200 && corpo.trim().startsWith('[') ? JSON.parse(corpo).length : -1;
  marcar(itens <= 0, 'anônimo NÃO lista os prints das missões', `HTTP ${l.status}, ${itens} itens`);

  const jogo = JSON.parse((await rest('jogos?select=capa_url,rom_url&limit=1')).corpo)[0];
  for (const [rotulo, endereco] of [
    ['a capa do jogo continua abrindo', jogo?.capa_url],
    ['a ROM do jogo continua abrindo', jogo?.rom_url],
  ]) {
    if (!endereco) {
      marcar(false, rotulo, 'não achei o endereço no catálogo');
      continue;
    }
    const r = await fetch(endereco, { method: 'HEAD' });
    marcar(r.ok, rotulo, `HTTP ${r.status}`);
  }
}

// --- A única escrita: cadastro de teste, criado e apagado ---
//
// Confere o caminho inteiro de quem se cadastra: a conta nasce em auth.users, o
// gatilho handle_new_user grava a linha em profiles, e o CASCADE limpa os dois
// quando a conta é apagada. Sem isto, um `revoke execute` errado quebraria o
// cadastro de todo mundo sem nenhum sintoma até alguém reclamar.
console.log('\n=== cadastro de ponta a ponta (cria e apaga uma conta de teste) ===');
try {
  const chaves = await (
    await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys?reveal=true`, {
      headers: { Authorization: `Bearer ${env.access_token_supabase}` },
    })
  ).json();
  const K = escolherSegredo(chaves);
  const H = { apikey: K, Authorization: `Bearer ${K}`, 'Content-Type': 'application/json' };
  const email = `teste-${randomUUID()}@exemplo.invalido`;

  const criado = await (
    await fetch(`${URL_SB}/auth/v1/admin/users`, {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ email, email_confirm: true, password: randomUUID() + 'Aa1!' }),
    })
  ).json();
  marcar(!!criado.id, 'a conta de teste foi criada', JSON.stringify(criado).slice(0, 120));

  if (criado.id) {
    const perfil = await (
      await fetch(`${URL_SB}/rest/v1/profiles?select=id,role&id=eq.${criado.id}`, { headers: H })
    ).json();
    marcar(perfil.length === 1, 'o gatilho criou o perfil (cadastro não quebrou)', 'perfil não apareceu');
    marcar(perfil[0]?.role === 'user', 'o perfil nasce como jogador comum', `veio role=${perfil[0]?.role}`);

    const apagou = await fetch(`${URL_SB}/auth/v1/admin/users/${criado.id}`, { method: 'DELETE', headers: H });
    marcar(apagou.ok, 'apagar a conta funciona (CASCADE)', `HTTP ${apagou.status}`);

    const sobrou = await (
      await fetch(`${URL_SB}/rest/v1/profiles?select=id&id=eq.${criado.id}`, { headers: H })
    ).json();
    marcar(sobrou.length === 0, 'o perfil sumiu junto, sem lixo para trás', `sobraram ${sobrou.length}`);
  }
} catch (e) {
  marcar(false, 'cadastro de ponta a ponta', e.message.slice(0, 120));
}

console.log(`\n  ${ok} passaram, ${falhou} falharam\n`);
process.exit(falhou ? 1 : 0);
