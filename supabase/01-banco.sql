-- Correções de segurança — PARTE 1 de 2: schema public.
-- Projeto Supabase do Sopra Fitas (maataycmixcmozjhezfe).
--
-- COMO RODAR: painel do Supabase -> SQL Editor -> colar tudo -> Run.
-- Depois rode a PARTE 2 (02-storage.sql), que é separada de propósito.
--
-- POR QUE SEPARADO: as políticas do Storage moram em storage.objects, cuja dona
-- é supabase_storage_admin. O papel `postgres`, que é quem o SQL Editor usa,
-- não é dono dessa tabela nem membro de quem é (conferido: pg_has_role
-- ('postgres','supabase_storage_admin','MEMBER') = false). Se os dois blocos
-- estivessem na mesma transação, o erro no Storage faria ROLLBACK de tudo — e o
-- painel mostraria um erro só, dando a impressão de que faltou pouco quando na
-- verdade nada teria sido aplicado.
--
-- ROLLBACK: não existe PITR neste projeto e a lista de backups está vazia
-- (conferido na Management API). O que existe é o retrato de antes em
-- backup/privado/estado-antes-das-correcoes.json, com as 24 políticas, as
-- funções, os grants de coluna e o estado da RLS.
--
-- Tudo aqui saiu de leitura do banco de produção, não de suposição.

begin;

-- Cotos de segurança da própria transação. Sem isto, um lock preso segura as
-- 5 tabelas em ACCESS EXCLUSIVE até o statement_timeout de 2 minutos estourar —
-- e o site fica fora do ar esse tempo todo para, no fim, dar rollback.
set local lock_timeout = '5s';
set local statement_timeout = '60s';


-- ============================================================
-- 1. aprovar_missao_gm: qualquer visitante credita pontos a quem quiser
-- ============================================================
-- A pior de todas.
--
-- A função é SECURITY DEFINER — roda como dona da tabela, atravessando toda a
-- RLS — e o GRANT de EXECUTE está em `public`, que inclui `anon`. Dentro dela
-- não há uma única checagem de quem chamou.
--
-- Comprovado em produção: um POST sem login nenhum em
--     /rest/v1/rpc/aprovar_missao_gm  {"id_jogador":"...","qtd_pontos":999999}
-- devolveu HTTP 204. O teste foi feito com um uuid inexistente, então nada foi
-- alterado — mas o id de qualquer jogador é público, porque o ranking devolve
-- `id` (src/services/perfis.js). Todo o placar do site é forjável por quem
-- nunca criou conta.
--
-- Quatro correções no mesmo lugar:
--   a) exige que quem chama seja admin;
--   b) search_path fixo, obrigatório em SECURITY DEFINER;
--   c) só credita se a missão realmente saiu de 'pendente' — hoje dois cliques
--      no botão Aprovar creditam duas vezes;
--   d) faixa de pontos, para um clique errado não gravar um número absurdo.
create or replace function public.aprovar_missao_gm(
  id_missao uuid,
  id_jogador uuid,
  qtd_pontos integer
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  aprovou integer;
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ) then
    raise exception 'apenas admin aprova missao' using errcode = '42501';
  end if;

  if qtd_pontos is null or qtd_pontos < 0 or qtd_pontos > 10000 then
    raise exception 'pontuacao fora da faixa' using errcode = '22023';
  end if;

  -- A transição só acontece uma vez. Se a missão já não estava pendente,
  -- row_count vem zero e nenhum ponto é creditado.
  update public.missoes
     set status = 'aprovado'
   where id = id_missao
     and user_id = id_jogador
     and status = 'pendente';

  get diagnostics aprovou = row_count;

  if aprovou > 0 then
    update public.profiles
       set pontos = coalesce(pontos, 0) + qtd_pontos
     where id = id_jogador;
  end if;
end;
$$;

revoke execute on function public.aprovar_missao_gm(uuid, uuid, integer) from public, anon;
grant  execute on function public.aprovar_missao_gm(uuid, uuid, integer) to authenticated;


-- ============================================================
-- 2. atualizar_pontos: o jogador escreve o próprio placar
-- ============================================================
-- Também SECURITY DEFINER, também com EXECUTE para `public`. Filtra por
-- auth.uid(), então o anônimo não atinge ninguém — mas qualquer pessoa logada
-- chama atualizar_pontos(999999) e grava o próprio placar por cima da RLS.
--
-- Nenhuma linha do site chama esta função: não existe .rpc('atualizar_pontos')
-- em src/. É código morto com privilégio de dono.
drop function if exists public.atualizar_pontos(integer);


-- ============================================================
-- 3. handle_new_user: gatilho sem search_path fixo
-- ============================================================
-- Roda como SECURITY DEFINER a cada cadastro. Hoje anon e authenticated não têm
-- CREATE no schema public, então não dá para sequestrar o search_path dela —
-- isto é blindagem preventiva, não buraco aberto. O linter do próprio Supabase
-- reclama dela (function_search_path_mutable).
--
-- O revoke de EXECUTE não quebra o cadastro: o Postgres confere esse privilégio
-- na hora de CRIAR o gatilho, não na hora de disparar. Ainda assim é o caminho
-- mais caro de quebrar, então o script de conferência testa um cadastro real
-- de ponta a ponta depois que isto rodar.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, pontos)
  values (new.id, new.email, 0);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;


-- ============================================================
-- 4. profiles: os 186 e-mails são legíveis por qualquer um
-- ============================================================
-- A política de SELECT é USING (true) para {public}. RLS filtra LINHA, não
-- COLUNA, então liberar a linha libera o e-mail junto.
--
-- Comprovado: GET /rest/v1/profiles?select=email com a chave pública devolveu
-- 200 e um e-mail real.
--
-- O ranking público precisa mesmo ler perfil de todo mundo — mas só id, nome e
-- pontos. A correção não é fechar a linha, é tirar a coluna.
--
-- ATENÇÃO AO MECANISMO: `revoke select (email)` sozinho NÃO funciona. O
-- Postgres não deixa um revoke de coluna derrubar um grant dado na tabela
-- inteira, e foi assim que estes foram dados. Tem que zerar o grant da tabela e
-- reconceder coluna a coluna. Feito errado, o comando roda, diz "Success", e o
-- e-mail continua aberto.
revoke select on public.profiles from anon, authenticated;
grant  select (id, nome, pontos)       on public.profiles to anon;
grant  select (id, nome, pontos, role) on public.profiles to authenticated;

-- Duas políticas de leitura idênticas. Uma basta; a outra só confunde quem for
-- auditar depois.
drop policy if exists "Todos podem ver perfis" on public.profiles;

-- A tela do GM precisa do e-mail, e acabou de perder o acesso à coluna. Passa a
-- ler por uma função que confere o papel de quem chamou — o filtro deixa de ser
-- "o cliente não pediu" e passa a ser "o banco não entrega".
--
-- Ela RECUSA em vez de devolver lista vazia. Uma função que filtra em silêncio
-- faria a tela mostrar "nenhum jogador" quando o certo é dizer "sem permissão",
-- e um dia alguém ia debugar isso achando que o banco estava vazio.
create or replace function public.listar_jogadores_admin()
returns table (id uuid, email text, nome text, pontos integer, role text)
language plpgsql
security definer
set search_path = ''
stable
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ) then
    raise exception 'apenas admin lista jogadores' using errcode = '42501';
  end if;

  return query
    select p.id, p.email, p.nome, p.pontos, p.role
      from public.profiles p
     order by p.pontos desc nulls last;
end;
$$;

revoke execute on function public.listar_jogadores_admin() from public, anon;
grant  execute on function public.listar_jogadores_admin() to authenticated;

-- ESCALONAMENTO DE PRIVILÉGIO. Duas políticas deixam o jogador editar o próprio
-- perfil, e nenhuma das duas impede que ele mude a própria coluna `role` para
-- 'admin'. Políticas permissivas se somam com OR, então basta uma frouxa para o
-- buraco existir — e vira admin de missões, que aprova envio e distribui ponto.
--
--   "Usuario edita proprio perfil"                   USING (auth.uid() = id), sem WITH CHECK
--       -> sem WITH CHECK, o Postgres usa o USING como checagem. Trocar o role
--          não viola auth.uid() = id, então passa.
--   "Usuários podem atualizar seus próprios perfis"  WITH CHECK (auth.uid() = id)
--       -> mesmo problema.
--
-- Sobram as duas corretas, que continuam de pé:
--   "Usuários atualizam próprio perfil limitado"  exige que o role gravado seja
--      igual ao que a pessoa já tem — ou seja, não dá para se promover.
--   "Admins podem atualizar qualquer perfil"      exige que QUEM CHAMA seja admin.
drop policy if exists "Usuario edita proprio perfil" on public.profiles;
drop policy if exists "Usuários podem atualizar seus próprios perfis" on public.profiles;

-- `role` é texto livre sem restrição nenhuma, e é nele que TODO o poder de admin
-- passa a se apoiar depois destas correções. Um 'Admin' com maiúscula, ou um
-- espaço sobrando, tranca a pessoa do lado de fora sem erro nenhum aparecer.
-- Hoje só existem 'user' (185) e 'admin' (2), então a restrição entra sem
-- rejeitar nenhuma linha.
alter table public.profiles alter column role set default 'user';
update public.profiles set role = 'user' where role is null;
alter table public.profiles alter column role set not null;
alter table public.profiles drop constraint if exists profiles_role_valido;
alter table public.profiles add constraint profiles_role_valido
  check (role in ('user', 'admin'));


-- ============================================================
-- 5. jogos: qualquer um insere jogo
-- ============================================================
-- A política abaixo se chama "Inserção para autenticados", mas foi criada para
-- o papel {public} — que INCLUI o anônimo — com WITH CHECK true, ou seja, sem
-- checar nada. O nome descreve a intenção; o efeito é outro.
--
-- Comprovado em produção: um POST anônimo em /rest/v1/jogos atravessou a RLS e
-- só parou na restrição NOT NULL da coluna id. Quem barrou foi o banco, não a
-- política.
drop policy if exists "Inserção para autenticados" on public.jogos;

-- Duas políticas idênticas de leitura pública, de novo.
drop policy if exists "Todos podem ver jogos" on public.jogos;

-- A política de administração prende o acesso ao e-mail mary.hunter177@gmail.com
-- escrito no meio do SQL. Isso já quebrou: a conta de admin nova (Winup) é
-- admin pela coluna `role`, entra no painel, e mesmo assim NÃO consegue salvar
-- jogo nenhum — testado, o PATCH volta com zero linhas.
drop policy if exists "Apenas Admin gerencia jogos" on public.jogos;

create policy "admin gerencia jogos"
  on public.jogos for all to authenticated
  using       (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check  (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));


-- ============================================================
-- 6. missoes: envio em nome de outro jogador
-- ============================================================
-- A política de INSERT é WITH CHECK true para {authenticated}: qualquer pessoa
-- logada pode gravar uma missão com o user_id de OUTRO jogador, e o print vai
-- para a fila de aprovação no nome dele.
drop policy if exists "Permitir Envio Missao" on public.missoes;

create policy "jogador envia a propria missao"
  on public.missoes for insert to authenticated
  with check (auth.uid() = user_id);


-- ============================================================
-- 7. missoes_globais: RLS desligada
-- ============================================================
-- Sem RLS e com GRANT total para anon, os 3 desafios que aparecem na Home podem
-- ser reescritos ou apagados por qualquer visitante. É um dos dois ERROR que o
-- linter do próprio Supabase aponta (rls_disabled_in_public).
alter table public.missoes_globais enable row level security;

create policy "todos leem os desafios"
  on public.missoes_globais for select to anon, authenticated
  using (true);

create policy "admin gerencia os desafios"
  on public.missoes_globais for all to authenticated
  using       (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check  (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));


-- ============================================================
-- 8. loja_shopee: tabela morta e aberta
-- ============================================================
-- 33 linhas, RLS desligada, GRANT total para anon, e nenhuma referência no
-- repositório inteiro — a loja de afiliados foi removida num commit anterior.
-- É o outro ERROR do linter.
--
-- RLS ligada SEM nenhuma política, que em Postgres significa negar tudo para
-- quem não é dono. Trancar em vez de apagar: se alguém ainda quiser esses
-- dados, eles continuam lá para exportar.
alter table public.loja_shopee enable row level security;


-- ============================================================
-- 9. Apagar um usuário pelo painel de Auth falha hoje
-- ============================================================
-- profiles.id referencia auth.users(id) com NO ACTION, e missoes.user_id
-- referencia profiles(id) também com NO ACTION. Resultado: apagar uma conta
-- pelo painel devolve erro de chave estrangeira, e a saída fácil vira apagar a
-- linha de profiles na mão — que deixa a conta órfã em auth.users, ainda capaz
-- de logar, agora sem perfil.
--
-- Com CASCADE, apagar a conta leva junto o perfil e os envios de missão.
alter table public.missoes  drop constraint if exists missoes_to_profiles_fk;
alter table public.missoes  add  constraint missoes_to_profiles_fk
  foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles add  constraint profiles_id_fkey
  foreign key (id) references auth.users(id) on delete cascade;


-- ============================================================
-- 10. Tabela nova nasce aberta para o anônimo
-- ============================================================
-- Isto é o que reabre o buraco sozinho daqui a alguns meses, e é a resposta
-- para "livre de problemas futuros".
--
-- Existe um ALTER DEFAULT PRIVILEGES de supabase_admin no schema public dando
-- arwdDxtm (tudo) para anon, authenticated e service_role em toda TABELA NOVA.
-- Foi assim que missoes_globais e loja_shopee nasceram com GRANT total para o
-- anônimo, e é por isso que só faltou alguém esquecer de ligar a RLS.
--
-- SEJA HONESTO SOBRE O ALCANCE DESTA LINHA: ela cobre o que o papel `postgres`
-- criar, que é o caso do SQL Editor. NÃO dá para desfazer o default de
-- supabase_admin daqui, porque postgres não é membro dele — conferido. Uma
-- tabela criada pelo Table Editor do painel pode continuar nascendo aberta.
--
-- A defesa que funciona nos dois casos é conferir depois: rode
-- `node supabase/conferir.mjs` toda vez que criar tabela, e olhe o linter em
-- Advisors -> Security no painel.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;

commit;
