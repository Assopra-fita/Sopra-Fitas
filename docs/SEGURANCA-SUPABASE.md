# Segurança do banco — o que foi fechado em 04/09/2026

Auditoria do projeto Supabase do Sopra Fitas, feita no dia em que o acesso de
administrador passou para a organização da Winup. Tudo aqui foi medido contra o
banco de produção — políticas, privilégios e chamadas reais — e não deduzido da
leitura do código.

O que aplicou as correções está em [`supabase/01-banco.sql`](../supabase/01-banco.sql)
e [`supabase/02-storage.sql`](../supabase/02-storage.sql). O que confere se elas
continuam de pé está em [`supabase/conferir.mjs`](../supabase/conferir.mjs):

```
node supabase/conferir.mjs
```

São 38 verificações. Vale rodar depois de qualquer mexida no banco, e
especialmente depois de criar tabela nova.

## Por que a RLS era a única defesa

A chave anônima do Supabase viaja dentro do bundle que qualquer visitante baixa
— isso é assim por projeto, não é descuido. Ela dá ao papel `anon` os privilégios
de SELECT, INSERT, UPDATE e DELETE em todas as tabelas.

O que decide o que o visitante realmente consegue fazer são as políticas de RLS.
Onde a RLS estava desligada, frouxa, ou contornada por uma função com privilégio
de dono, estava aberto para a internet inteira.

## As oito falhas

### 1. Qualquer visitante podia escrever o placar de qualquer jogador

`aprovar_missao_gm` roda como dona das tabelas — atravessa toda a RLS — e o
direito de executá-la estava concedido a `public`, que inclui quem não tem
conta. Dentro dela não havia nenhuma checagem de quem chamou.

Um `POST` sem login em `/rest/v1/rpc/aprovar_missao_gm` respondeu **HTTP 204**.
O teste usou um identificador inexistente, então nada foi alterado — mas o
identificador de qualquer jogador é público, porque o ranking o devolve. Todo o
placar era forjável por quem nunca criou conta.

Hoje: exige ser administrador, tem faixa de pontuação, e só credita se a missão
saiu mesmo de "pendente" — antes, dois cliques no botão Aprovar creditavam duas
vezes.

### 2. Os 186 e-mails eram legíveis por qualquer um

A RLS filtra **linha**, não **coluna**. A política de leitura de `profiles` era
`USING (true)` porque o ranking precisa mesmo mostrar todo mundo — e isso levava
a coluna `email` junto.

`GET /rest/v1/profiles?select=email` com a chave pública devolvia 200 e a lista.

Hoje: `anon` só alcança `id`, `nome` e `pontos`. A tela do GM, que precisa do
e-mail, passa por uma função que confere o papel de quem chamou antes de
responder. O ranking continua funcionando igual.

### 3. Um jogador podia se promover a administrador

Duas políticas deixavam a pessoa editar o próprio perfil sem impedir que ela
mudasse a própria coluna `role` para `admin`. Políticas permissivas se somam com
OU, então bastava uma frouxa. Quem virasse administrador aprovava missão e
distribuía ponto.

Hoje: as duas frouxas saíram. As que ficaram exigem que o papel gravado seja
igual ao que a pessoa já tem, e a coluna passou a aceitar só `user` ou `admin`.

### 4. Qualquer um cadastrava jogo no catálogo

Uma política chamada "Inserção para autenticados" tinha sido criada para o papel
`public` — que inclui o anônimo — sem checar nada. O nome descrevia a intenção;
o efeito era outro. Um `POST` anônimo em `/rest/v1/jogos` atravessava a RLS e só
parava numa restrição de coluna obrigatória: quem barrava era o banco, não a
política.

### 5. Qualquer visitante subia arquivo no balde das ROMs

A política "Acesso Publico Leitura 235ib_1" tinha nome de leitura mas era de
INSERT, para anônimo. A irmã "_2" era de UPDATE. Sem teto de tamanho e sem lista
de tipos aceitos.

Isso é hospedagem de arquivo grátis e anônima num domínio da empresa, com a
conta pagando a banda — e sobrescrita das 144 ROMs no ar.

Hoje: barrado (testado: HTTP 400), com teto de 50 MB por arquivo e, nos baldes
de imagem, recusa de SVG e HTML — que o navegador executa como documento.

### 6. Os desafios da Home podiam ser reescritos por qualquer visitante

`missoes_globais` e `loja_shopee` estavam com RLS desligada e privilégio total
para o anônimo. Eram os dois ERROR que o linter do próprio Supabase apontava.

`loja_shopee` (33 linhas, a loja de afiliados que saiu do projeto) foi trancada
em vez de apagada: os dados continuam lá para exportar.

### 7. Dava para enviar missão no nome de outra pessoa

A política de inserção em `missoes` aceitava qualquer coisa de quem estivesse
logado, inclusive gravar o identificador de outro jogador — e o print ia para a
fila de aprovação no nome dele.

### 8. Dava para listar todos os prints das missões

Os prints recebem nome aleatório justamente para não ligar arquivo a pessoa. Mas
uma política permitia ao anônimo **listar** o conteúdo dos baldes, o que anulava
esse cuidado.

Baixar pelo endereço público não passa por essa política — por isso capa e ROM
continuam abrindo normalmente. Nenhuma tela do site lista balde.

## Consertos que não eram de segurança, mas apareceram no caminho

- **Recuperação de senha estava quebrada em produção.** A Site URL do Auth era
  `http://localhost:3000` e a lista de redirecionamentos estava vazia: o link do
  e-mail mandava a pessoa para o computador dela. Corrigido para o domínio.
- **Apagar uma conta pelo painel falhava** com erro de chave estrangeira, e
  deixava a conta órfã em `auth.users` — ainda capaz de entrar, agora sem perfil.
  As chaves passaram a ter CASCADE.
- **O backup nunca enxergou a tabela `missoes`** e saía com zero linha, porque
  rodava com a chave pública. Passou a usar a chave de serviço quando o token
  está no `.env`.
- **Senha mínima subiu de 6 para 8 caracteres**, com exigência de maiúscula,
  minúscula e número.

## O que continua em aberto

- **67 ROMs comerciais (179 MB) versionadas neste repositório**, que é público.
  Não é falha de segurança e não vaza dado de ninguém, mas é exposição de
  direito autoral. O site não depende delas: as ROMs que ele serve vêm do
  Storage. Combinado tratar numa próxima sessão.
- **Proteção contra senha vazada** (checagem contra bases de vazamento) é
  recurso do plano Pro. A API recusa ligar no plano atual.
- **Sem ponto de restauração.** O plano gratuito não tem PITR e a lista de
  backups do projeto está vazia. O que existe é `scripts/exportar-supabase.mjs`,
  que copia tabelas e arquivos para a máquina. Vale rodar com alguma frequência.
- **Banda do Storage.** Os baldes são públicos e servem ROM. Não há nada
  impedindo outro site de apontar direto para os arquivos e consumir a cota.
- **Tabela nova pode nascer aberta.** Existe uma configuração do Supabase que
  concede privilégio total ao anônimo em toda tabela nova do schema `public` — foi
  assim que duas tabelas ficaram sem proteção. Dá para desarmar isso no caminho
  do SQL Editor, e foi feito, mas não no caminho do Table Editor do painel. A
  defesa que vale nos dois casos é rodar `node supabase/conferir.mjs` depois de
  criar tabela, e olhar Advisors → Security no painel.

## Resultado medido

| | antes | depois |
|---|---|---|
| Verificações de `conferir.mjs` | 8 de 38 | **38 de 38** |
| Avisos do linter do Supabase | 12, com 2 ERROR | **4, nenhum ERROR** |

Os 4 avisos restantes são intencionais: a trava da `loja_shopee`, as duas
funções que quem está logado pode chamar (ambas conferem o papel por dentro), e
a proteção de senha vazada do plano Pro.
