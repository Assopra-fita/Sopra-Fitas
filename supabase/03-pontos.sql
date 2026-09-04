-- Correções de segurança — PARTE 3: o jogador escrevia o próprio placar.
-- Rodar depois de 01-banco.sql.
--
-- Achado depois das duas primeiras partes, exercitando cada ação de admin com
-- sessões reais. Comprovado em produção com uma conta comum recém-criada:
--
--   PATCH /rest/v1/profiles?id=eq.<ele mesmo>   {"pontos": 4242}
--   -> HTTP 200, 1 linha alterada
--
-- A política "Usuários atualizam próprio perfil limitado" prende a coluna
-- `role` — o WITH CHECK exige que o papel gravado seja igual ao que a pessoa já
-- tem — e não prende mais nada. `pontos` ficou de fora, e é a moeda do site: é
-- ela que ordena o ranking e que o GM credita ao aprovar missão.
--
-- É o mesmo buraco da função `atualizar_pontos`, que a parte 1 apagou, só que
-- pela porta da frente do PostgREST em vez de por uma função com privilégio de
-- dono. Fechar um sem o outro não fecha nada.


-- ============================================================
-- 1. `pontos` entra na trava da política
-- ============================================================
-- POR QUE AQUI, e não num GRANT por coluna: tirar o UPDATE de `pontos` de
-- `authenticated` fecharia também para o GM, que é `authenticated` como
-- qualquer outro — não existe papel "admin" no Postgres, quem separa é a
-- policy. Como políticas permissivas se somam com OU, prender a coluna na
-- política de auto-edição resolve os dois casos de uma vez:
--
--   jogador mexendo no próprio ponto  -> a de auto-edição recusa (mudou pontos)
--                                        a de admin recusa (não é admin)   = barrado
--   GM mexendo no ponto de alguém     -> a de admin aceita                 = liberado
--   jogador mudando o próprio nome    -> a de auto-edição aceita           = liberado

begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

drop policy if exists "Usuários atualizam próprio perfil limitado" on public.profiles;

create policy "Usuários atualizam próprio perfil limitado"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role   = (select p.role   from public.profiles p where p.id = auth.uid())
    and pontos is not distinct from (select p.pontos from public.profiles p where p.id = auth.uid())
  );


-- ============================================================
-- 2. `email` sai por GRANT de coluna, e NÃO pela política
-- ============================================================
-- Ler a própria coluna `email` já era impossível desde a parte 1, mas escrever
-- é outro privilégio: sem trava, a pessoa grava um e-mail qualquer em
-- `profiles`, que passa a divergir de auth.users — e é o de `profiles` que a
-- tela do GM mostra.
--
-- A primeira tentativa foi prender `email` dentro do WITH CHECK, junto com
-- `role` e `pontos`. Não funciona, e o modo de falhar é traiçoeiro: o Postgres
-- confere privilégio de coluna também para as colunas citadas DENTRO da
-- política, e `authenticated` perdeu o SELECT em `email` na parte 1. Resultado
-- medido: QUALQUER update na própria linha passou a devolver
--
--     42501  permission denied for table profiles
--
-- inclusive trocar o nome, que é a única coisa que o jogador deveria poder
-- fazer ali. O erro não fala em coluna nenhuma, e a tela mostraria "não
-- consegui salvar o nome" sem pista do motivo.
--
-- GRANT de coluna não tem esse efeito: ele não entra na expressão da política.
revoke update on public.profiles from anon, authenticated;
grant  update (nome, pontos, role) on public.profiles to authenticated;

-- E nada além disso: quem escreve em profiles é o gatilho handle_new_user, que
-- roda como dono e não depende destes grants, e o CASCADE de auth.users.
revoke insert, delete on public.profiles from anon, authenticated;

commit;
