-- Correções de segurança no projeto Supabase do Sopra Fitas.
--
-- Tudo aqui saiu de leitura do banco de produção, não de suposição: pg_policies,
-- has_table_privilege e information_schema.columns. Cada bloco diz o que estava
-- errado e o que a correção faz.
--
-- CONTEXTO QUE VALE PARA TODAS: o papel `anon` tem GRANT de SELECT, INSERT,
-- UPDATE e DELETE em TODAS as tabelas de public. A chave anônima viaja no
-- bundle que qualquer visitante baixa. Ou seja: a RLS é a única coisa entre a
-- internet e os dados. Onde ela está desligada ou frouxa, está aberto.


-- ============================================================
-- 1. jogos: qualquer um insere jogo
-- ============================================================
-- A política abaixo se chama "Inserção para autenticados", mas foi criada para
-- o papel {public} — que INCLUI o anônimo — com WITH CHECK true, ou seja, sem
-- checar nada. O nome descreve a intenção; o efeito é outro.
--
-- Comprovado em produção: um POST anônimo em /rest/v1/jogos atravessou a RLS e
-- só parou na restrição NOT NULL da coluna id. Quem barrou foi o banco, não a
-- política.
--
-- UPDATE e DELETE já estavam protegidos pela política ALL mais abaixo, então
-- não há o que corrigir neles.
drop policy if exists "Inserção para autenticados" on public.jogos;

-- Duas políticas idênticas de leitura pública. Uma basta; a outra só confunde
-- quem for auditar depois.
drop policy if exists "Todos podem ver jogos" on public.jogos;

-- A política de administração prende o acesso ao e-mail mary.hunter177@gmail.com
-- escrito no meio do SQL. Isso quebra no dia em que essa pessoa sair, e ignora
-- a coluna `role` que o resto do sistema usa para decidir quem é admin
-- (missoes já decide assim). Passa a usar a mesma regra do resto.
drop policy if exists "Apenas Admin gerencia jogos" on public.jogos;

create policy "admin gerencia jogos"
  on public.jogos for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));


-- ============================================================
-- 2. profiles: os 186 e-mails são legíveis por qualquer um
-- ============================================================
-- A política de SELECT é `USING (true)` para {public}. RLS filtra LINHA, não
-- COLUNA, então liberar a linha libera o e-mail junto.
--
-- O ranking público precisa mesmo ler perfil de todo mundo — mas só as colunas
-- id, nome e pontos (src/services/perfis.js:33). Então a correção não é fechar
-- a linha, é tirar a coluna: GRANT por coluna, que o Postgres suporta.
--
-- Não muda uma linha de código: o ranking continua funcionando igual.
revoke select (email) on public.profiles from anon;

-- Duas políticas de leitura idênticas de novo.
drop policy if exists "Todos podem ver perfis" on public.profiles;

-- ESCALONAMENTO DE PRIVILÉGIO. Estas duas políticas deixam o jogador editar o
-- próprio perfil, e nenhuma das duas impede que ele mude a própria coluna
-- `role` para 'admin'. Políticas permissivas se somam com OR, então basta uma
-- frouxa para o buraco existir — e vira admin de missões, que aprova envio e
-- distribui ponto.
--
--   "Usuario edita proprio perfil"              USING (auth.uid() = id), sem WITH CHECK
--       -> sem WITH CHECK, o Postgres usa o USING como checagem. Trocar o role
--          não viola auth.uid() = id, então passa.
--   "Usuários podem atualizar seus próprios perfis"  WITH CHECK (auth.uid() = id)
--       -> mesmo problema.
--
-- Sobra a terceira, que é a correta: ela exige que o `role` do novo registro
-- seja igual ao que já está gravado.
drop policy if exists "Usuario edita proprio perfil" on public.profiles;
drop policy if exists "Usuários podem atualizar seus próprios perfis" on public.profiles;


-- ============================================================
-- 3. missoes: envio em nome de outro jogador
-- ============================================================
-- A política de INSERT é WITH CHECK true para {authenticated}: qualquer pessoa
-- logada pode gravar uma missão com o user_id de OUTRO jogador, e o print vai
-- para a fila de aprovação no nome dele.
drop policy if exists "Permitir Envio Missao" on public.missoes;

create policy "jogador envia a propria missao"
  on public.missoes for insert to authenticated
  with check (auth.uid() = user_id);


-- ============================================================
-- 4. missoes_globais: RLS desligada
-- ============================================================
-- Sem RLS e com GRANT total para anon, os 3 desafios podem ser reescritos ou
-- apagados por qualquer visitante.
alter table public.missoes_globais enable row level security;

create policy "todos leem os desafios"
  on public.missoes_globais for select to anon, authenticated
  using (true);

create policy "admin gerencia os desafios"
  on public.missoes_globais for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));


-- ============================================================
-- 5. loja_shopee: tabela morta e aberta
-- ============================================================
-- 33 linhas, RLS desligada, GRANT total para anon, e nenhuma referência no
-- código — a loja de afiliados foi removida do projeto num commit anterior.
--
-- Aqui a RLS é ligada SEM nenhuma política, que em Postgres significa negar
-- tudo para quem não é dono da tabela. Trancar em vez de apagar: se alguém
-- ainda quiser esses dados, eles continuam lá para exportar.
alter table public.loja_shopee enable row level security;
