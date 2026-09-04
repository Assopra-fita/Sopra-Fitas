-- Correções de segurança — PARTE 2 de 2: Storage.
-- Rodar DEPOIS de 01-banco.sql.
--
-- ESTE ARQUIVO NÃO TEM begin/commit, DE PROPÓSITO, e é separado do 01 pelo
-- mesmo motivo.
--
-- storage.objects pertence a supabase_storage_admin, não a `postgres`, e no
-- Postgres criar ou derrubar política exige ser DONO da tabela — ter todos os
-- privilégios, mesmo com grant option, não basta. Isso levantou a suspeita de
-- que a PARTE B fosse falhar com "must be owner of table objects".
--
-- Na prática ela rodou: o caminho do SQL Editor tem permissão para mexer aqui.
-- A separação fica assim mesmo, porque a suspeita era razoável e o custo de
-- estar errado é alto: se os dois blocos estivessem na mesma transação e o
-- Storage falhasse, o ROLLBACK levaria junto as nove correções do 01-banco.sql
-- e o painel mostraria um erro só, dando a impressão de que faltou pouco.
--
-- Se um dia falhar mesmo, a PARTE A já terá sido aplicada (sem transação, cada
-- comando vale por si) e o fim do arquivo diz como fazer a PARTE B pelo painel.


-- ============================================================
-- PARTE A — limites de balde. Isto roda.
-- ============================================================
-- Hoje os quatro baldes estão com file_size_limit NULO. A validação de tamanho
-- e de tipo mora só em src/services/armazenamento.js, ou seja, no navegador de
-- quem envia — o que não é controle nenhum: basta chamar a API direto.
--
-- O teto do PROJETO é 50 MB (conferido em /config/storage: fileSizeLimit
-- 52428800), e o Storage aplica o MENOR entre o do projeto e o do balde. Por
-- isso `roms` recebe 50 MB e não os 64 MB que o código diz — 64 nunca valeu.
update storage.buckets set file_size_limit = 52428800 where name = 'roms';
update storage.buckets set file_size_limit =  5242880 where name in ('capas', 'prints', 'imagens_loja');

-- Tipo de arquivo aceito, do lado do servidor.
--
-- O que isto barra de concreto: SVG e HTML. Os baldes são PÚBLICOS e servem
-- pelo domínio do Storage; um SVG é executado como documento pelo navegador,
-- então um arquivo "de imagem" enviado por qualquer conta cadastrada vira
-- script rodando num endereço do projeto.
--
-- `roms` fica sem lista: ROM não tem tipo MIME próprio, o navegador manda
-- application/octet-stream ou string vazia dependendo da extensão, e uma lista
-- aqui quebraria upload legítimo sem ganho real — o teto de 50 MB e a política
-- de admin já cobrem esse balde.
update storage.buckets
   set allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif']
 where name in ('capas', 'prints', 'imagens_loja');


-- ============================================================
-- PARTE B — políticas. Pode falhar por falta de dono; ver o fim do arquivo.
-- ============================================================

-- B1. Qualquer visitante sobe arquivo no balde `roms`.
--
-- A política "Acesso Publico Leitura 235ib_1" tem nome de leitura mas é de
-- INSERT, para {anon,authenticated}, com WITH CHECK (bucket_id = 'roms'). A
-- irmã "_2" é de UPDATE nas mesmas condições.
--
-- Efeito: hospedagem de arquivo grátis e anônima num domínio da empresa, com a
-- conta pagando o egresso — e sobrescrita das 144 ROMs que estão no ar.
drop policy if exists "Acesso Publico Leitura 235ib_1" on storage.objects;
drop policy if exists "Acesso Publico Leitura 235ib_2" on storage.objects;

-- B2. As quatro políticas de admin repetem o e-mail da Mary cravado no SQL.
-- Mesma troca das tabelas: passa a valer a coluna `role`.
drop policy if exists "Apenas admin Mary Hunter sobe arquivos 1k7xxg_0" on storage.objects;
drop policy if exists "Apenas admin Mary Hunter sobe arquivos 1k7xxg_1" on storage.objects;
drop policy if exists "Apenas admin Mary Hunter sobe arquivos 1k7xxg_2" on storage.objects;
drop policy if exists "Apenas admin Mary Hunter sobe arquivos 1k7xxg_3" on storage.objects;

create policy "admin gerencia arquivos"
  on storage.objects for all to authenticated
  using       (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check  (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- B3. Listagem anônima de TODOS os baldes.
--
-- "Enable read access for all users" é SELECT para anon com USING (true), sem
-- filtro de balde. Balde público não consulta RLS para BAIXAR pelo endereço
-- público — mas consulta para LISTAR. Com esta política, um anônimo lista o
-- conteúdo inteiro dos quatro baldes, incluindo os prints das missões.
--
-- Os prints têm nome aleatório justamente para não ligar arquivo a pessoa
-- (src/services/armazenamento.js), e a listagem anula esse cuidado: quem lista
-- vê todos e pode cruzar com a ordem de criação.
--
-- Nenhuma linha do site chama .list(). Derrubar isto não muda nada para o
-- visitante: capa, ROM e print continuam abrindo pelo endereço público.
drop policy if exists "Enable read access for all users" on storage.objects;
drop policy if exists "Permitir Ver Prints" on storage.objects;
drop policy if exists "Acesso Publico Leitura 235ib_0" on storage.objects;


-- ============================================================
-- SE A PARTE B FALHAR: o mesmo, pelo painel
-- ============================================================
-- Storage -> Policies -> storage.objects. Some as políticas abaixo, uma a uma
-- pelo botão de apagar de cada linha:
--
--   Acesso Publico Leitura 235ib_1              (INSERT anônimo no balde roms)
--   Acesso Publico Leitura 235ib_2              (UPDATE anônimo no balde roms)
--   Acesso Publico Leitura 235ib_0              (listagem anônima do balde roms)
--   Enable read access for all users            (listagem anônima de tudo)
--   Permitir Ver Prints                         (listagem dos prints)
--   Apenas admin Mary Hunter sobe arquivos 1k7xxg_0
--   Apenas admin Mary Hunter sobe arquivos 1k7xxg_1
--   Apenas admin Mary Hunter sobe arquivos 1k7xxg_2
--   Apenas admin Mary Hunter sobe arquivos 1k7xxg_3
--
-- Depois, New Policy -> For full customization, e crie UMA política:
--
--   Nome      : admin gerencia arquivos
--   Allowed   : ALL
--   Target    : authenticated
--   USING     : exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
--   WITH CHECK: exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
--
-- NÃO apague "Permitir Upload Prints" — é ela que deixa o jogador enviar o
-- print da missão dele.
--
-- Depois de qualquer um dos dois caminhos, rode `node supabase/conferir.mjs`:
-- ele testa se a capa e a ROM continuam abrindo para o visitante e se a
-- listagem anônima parou de responder.
