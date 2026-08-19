# Roadmap — Primeira limpeza do Sopra Fitas

Levantamento técnico completo do estado do projeto, com o que precisa ser corrigido, em que ordem e por quê.

**Método:** cada item foi verificado empiricamente — comando executado, resposta HTTP medida, arquivo lido, bytes contados. Nada aqui é impressão. Onde a conclusão depende de configuração fora do repositório (painel do Supabase, da Vercel, do Google Ad Manager), isso está dito explicitamente em vez de assumido.

**Números levantados:** 93 constatações verificadas, 78 confirmadas, 11 derrubadas na conferência, 4 dependentes de checagem externa, mais 35 achados novos que a varredura inicial não tinha pego.

- [Progresso](#progresso)
- [Sumário executivo](#sumário-executivo)
- [Ordem de execução](#ordem-de-execução)
- [Fase 0 — Urgente: dado pessoal exposto](#fase-0--urgente-dado-pessoal-exposto)
- [Fase 1 — O que está quebrado para o usuário](#fase-1--o-que-está-quebrado-para-o-usuário)
- [Fase 2 — Peso e velocidade](#fase-2--peso-e-velocidade)
- [Fase 3 — Limpeza estrutural do código](#fase-3--limpeza-estrutural-do-código)
- [Fase 4 — Layout e navegação](#fase-4--layout-e-navegação)
- [Fase 5 — Higiene: SEO, acessibilidade e qualidade](#fase-5--higiene-seo-acessibilidade-e-qualidade)
- [Avaliado e descartado](#avaliado-e-descartado)
- [Depende de checagem fora do repositório](#depende-de-checagem-fora-do-repositório)

---

## Progresso

17 de 93 tarefas concluídas. As caixas são marcadas conforme cada item entra em produção.

| Fase | Frente | Prioridade | Progresso | Feitas |
| :---: | --- | --- | --- | :---: |
| **0** | Dado pessoal exposto | Urgente | `██░░░░░░░░` | 1/6 |
| **1** | Quebrado para o usuário | Alta | `██████░░░░` | 15/26 |
| **2** | Peso e velocidade | Alta | `░░░░░░░░░░` | 0/9 |
| **3** | Limpeza estrutural | Média | `░░░░░░░░░░` | 1/23 |
| **4** | Layout e navegação | Média | `░░░░░░░░░░` | 0/11 |
| **5** | SEO, acessibilidade e qualidade | Baixa | `░░░░░░░░░░` | 0/18 |
| | **Total** | | `██░░░░░░░░` | **17/93** |

---

## Sumário executivo

Cinco números que resumem o estado do produto:

| | Hoje | Depois da limpeza |
| --- | --- | --- |
| **Peso do primeiro acesso** | 2,25 MiB · ~47 s em 3G lenta | 0,66 MiB · ~14 s *(−70%)* |
| **Jogos que realmente abrem** | ~106 de 160 anunciados | 160 de 160 |
| **Catálogo visível nos filtros** | 93 de 160 *(42% invisível)* | 160 de 160 |
| **Salvar / carregar progresso** | **nunca funcionou** | funcionando |
| **Peso do repositório** | 397 MiB, sendo 199 MiB duplicata pura | ~198 MiB |

Três leituras que importam para a decisão:

**O site em si não é o problema — o conteúdo é.** O aplicativo inteiro (HTML + JS + CSS, já comprimido) pesa **118 KB**. Os outros 2,13 MiB do primeiro acesso são imagens mal dimensionadas e scripts de terceiros. Dá para cortar 70% do tempo de carregamento **sem tocar em uma linha de lógica**, só tratando imagem.

**A maior parte do catálogo está morta ou escondida.** O rodapé anuncia 160 jogos. Cerca de 54 não iniciam e 67 não aparecem em nenhum filtro de console. Nenhum desses casos é bug de código difícil: são dados errados no banco, cadastrados por um formulário que aceita qualquer coisa.

**A complexidade está concentrada, não espalhada.** Das 190 funções do projeto, **96,8% têm complexidade ciclomática ≤ 9** — perfeitamente saudável. O problema são dois componentes-deus (`Home` com 33, `GameRoom` com 24) que concentram tudo. Isso é uma boa notícia: não é reescrita, é quebrar dois arquivos.

### De onde vêm os 2,25 MiB do primeiro acesso

```mermaid
pie showData title Primeiro acesso à Home — 2,25 MiB
    "12 capas da primeira página" : 1700
    "2 logos" : 249
    "Anúncios e pixel" : 229
    "App inteiro — HTML+JS+CSS" : 118
    "JSON dos 133 jogos" : 16
```

## Ordem de execução

As fases estão ordenadas por retorno sobre esforço. A Fase 3 é a única que exige refatoração de verdade; todas as outras são correções pontuais.

```mermaid
flowchart LR
    F0["FASE 0<br/>Dado pessoal exposto<br/>horas"]:::urg
    F1["FASE 1<br/>Quebrado para o usuário<br/>dias"]:::alta
    F2["FASE 2<br/>Peso e velocidade<br/>dias"]:::alta
    F3["FASE 3<br/>Limpeza estrutural<br/>semanas"]:::media
    F4["FASE 4<br/>Layout e navegação<br/>dias"]:::media
    F5["FASE 5<br/>SEO, acessibilidade<br/>dias"]:::baixa

    F0 --> F1 --> F2 --> F3
    F2 --> F4
    F3 --> F5
    F4 --> F5

    classDef urg fill:#7f1d1d,stroke:#b91c1c,color:#fff
    classDef alta fill:#8a4b1f,stroke:#c2670f,color:#fff
    classDef media fill:#8a6d1f,stroke:#c9a227,color:#fff
    classDef baixa fill:#1f4f6f,stroke:#2f7c9c,color:#fff
```

A Fase 3 vem depois da 1 e da 2 de propósito: refatorar código que ainda tem bug conhecido é retrabalho garantido, e o ganho de performance da Fase 2 não depende de arquitetura nenhuma.

---

## Fase 0 — Urgente: dado pessoal exposto

**Dois itens. Não são refatoração — são configuração de permissão no painel do Supabase.** Devem ser tratados antes de qualquer outra coisa do roadmap, inclusive antes de abrir uma branch.

### 0.1 — E-mail dos 184 usuários legível por qualquer visitante

[`Ranking.jsx:32-36`](../src/pages/Ranking.jsx#L32-L36) faz `select('id, nome, email, pontos')` — o e-mail trafega para o navegador mesmo sem a tela exibi-lo. Com a chave anônima que está no bundle público dá para paginar a tabela e extrair a base inteira: a verificação retornou **184 registros**, com e-mail completo.

Risco de LGPD e lista pronta para phishing.

A correção tem **duas camadas, ambas necessárias**: remover `email` do `select` resolve a tela, mas não fecha o buraco — a chave anônima permite consultar a coluna diretamente. É preciso também restringir o `SELECT` em `profiles` por RLS e expor o ranking por uma *view* pública com apenas `id`, `nome` e `pontos`.

**Tarefas**

- [x] Remover `email` do `select` em [`Ranking.jsx:34`](../src/pages/Ranking.jsx#L34)
- [ ] Restringir o `SELECT` em `profiles` por RLS ao próprio usuário
- [ ] Criar view pública de ranking expondo só `id`, `nome` e `pontos`

### 0.2 — Prints dos jogadores listáveis, com o autor identificável

O bucket `prints` responde a listagem com a chave anônima. Como o arquivo é nomeado `{user_id}_{timestamp}` ([`GameRoom.jsx:152`](../src/pages/GameRoom.jsx#L152)), cada print fica amarrado ao `profiles.id` do autor — e `profiles` devolve nome e e-mail. Na verificação, **todos os prints existentes foram associados a contas reais**.

Print de tela costuma capturar notificação de celular, nick e conversa.

Correção: tirar a permissão de listagem do papel anônimo, tornar o bucket privado servindo ao GM por URL assinada, e parar de usar o `user.id` como nome de arquivo — usar um identificador aleatório e guardar a associação só na tabela `missoes`.

---

**Tarefas**

- [ ] Remover a permissão de listagem anônima do bucket `prints`
- [ ] Tornar o bucket privado e servir ao GM por URL assinada
- [ ] Trocar o nome do arquivo de print por identificador aleatório

## Fase 1 — O que está quebrado para o usuário

### 1.1 — Salvar, Carregar e Reiniciar nunca funcionaram

**Criticidade máxima.** [`Emulator.jsx:36`](../src/components/Emulator.jsx#L36) define `window.EJS_player = '#game'` — uma **string** com o seletor CSS. O emulador de verdade é criado pelo loader em `window.EJS_emulator`, que o código nunca referencia.

Como string não-vazia é *truthy*, o `if (window.EJS_player)` de [`GameRoom.jsx:88-96`](../src/pages/GameRoom.jsx#L88-L96) passa e a chamada seguinte lança `TypeError`. Sem `try/catch`, o botão falha em silêncio.

O jogador clica em Salvar, não recebe retorno nenhum, volta depois e perdeu tudo. Num Chrono Trigger ou Harvest Moon isso são horas de progresso. **A funcionalidade que a tela de login anuncia como "salve seus jogos na nuvem" não existe em nenhuma linha do projeto.**

O mesmo defeito explica outro sintoma: em `finalizarEmulador` os guards `typeof … === 'function'` são sempre falsos, então `stop()` e `destroy()` nunca executam. O emulador nunca é encerrado — sair pelo botão "voltar" do navegador ou clicar num jogo relacionado deixa a música tocando por baixo do site. É por isso que o botão Sair precisa recarregar a página inteira: o reload virou o único jeito de matar o áudio.

> Corrigir isto destrava trocar `window.location.href` por navegação SPA, que hoje refaz todo o download de anúncios e do catálogo a cada saída de jogo.

**Tarefas**

- [x] Guardar a instância real do emulador (`window.EJS_emulator`) numa ref
- [x] Fazer Salvar, Carregar e Reiniciar chamarem a instância, com retorno visual
- [x] Encerrar o emulador de verdade no cleanup do componente
- [x] Trocar `window.location.href` por `navigate('/')` no botão Sair

### 1.2 — 54 dos 160 jogos não iniciam

| Origem | Quantidade | Causa |
| --- | :---: | --- |
| Banco — `rom_url` aponta para um **PNG** | 29 | a capa foi selecionada no campo da ROM no cadastro |
| Banco — `core` incompatível com a extensão | 20 | ROM de SNES com core `nes`, ROM de GBA com core `snes` |
| Estático — arquivo inexistente | 4 | Batman Forever, Battletoads, Battletoads & DD, Super Mario 64 |
| Estático — core inexistente | 1 | Asteroids: o core é `stella2014`, não `stella` |

Os 29 casos de PNG têm todos o mesmo padrão — o nome-base do arquivo é idêntico ao da capa. O formulário aceitou uma imagem no campo da ROM sem reclamar.

Correções, em ordem de custo:

- **Asteroids:** trocar `stella` por `stella2014` em duas linhas. Ressuscita o único jogo de Atari do site.
- **Super Mario 64:** o `rom_url` pede `/Super_Mario_64.z64`, o arquivo é `/mario64.z64`. A ROM está íntegra e o core está certo — é uma linha, e ressuscita o único jogo de N64.
- **Os 49 do banco:** um `UPDATE` corrigindo `rom_url` e `core`, mais validação no formulário. O `core` deveria ser **derivado da extensão**, não escolhido à mão.
- **Os 3 da SEGA:** ver 1.3, não é só renomear.

**Tarefas**

- [x] Asteroids: core `stella` → `stella2014`
- [x] Super Mario 64: `rom_url` → `/mario64.z64`
- [ ] Corrigir os 29 jogos com `rom_url` apontando para PNG
- [ ] Corrigir os 20 jogos com `core` incompatível com a extensão
- [ ] Validar tipo e extensão do arquivo no formulário de cadastro
- [ ] Derivar o `core` da extensão em vez de deixá-lo livre

### 1.3 — As 22 ROMs de Mega Drive em `public/` estão corrompidas

Batman Forever, Battletoads e Battletoads & Double Dragon estão cadastrados como SNES, mas os arquivos no disco são de Mega Drive — o cabeçalho traz `SEGA GENESIS` no offset `0x100`. Só que **renomear não resolve**: todos os 22 arquivos `.md` da raiz de `public/` foram re-encodados como texto UTF-8 em algum ponto do histórico, e todo byte `>= 0x80` virou a sequência `EF BF BD`.

| Verificação | Resultado |
| --- | --- |
| Ocorrências de `EF BF BD` por arquivo | de 148 mil a 2 milhões — **em todos os 22** |
| Tamanho | inflado 1,6× a 2×, nenhum é potência de 2 |
| Cabeçalho | destruído: `battletoads.md` começa com `00 EF BF BD EF BF BD…` |
| Controle: ROMs SEGA em `.smd` e `.bin` | **zero** ocorrências, tamanho correto |

A corrupção atingiu especificamente a extensão `.md`. **Os binários precisam ser substituídos por cópias íntegras.** Enquanto não houver, o certo é tirar os três cards do ar em vez de deixá-los quebrados.

**Tarefas**

- [ ] Substituir as 22 ROMs `.md` por cópias íntegras
- [ ] Enquanto não houver ROM válida, remover do catálogo os 3 cards da SEGA

### 1.4 — 67 dos 160 jogos não aparecem em nenhum filtro

O filtro compara texto exato ([`Home.jsx:181`](../src/pages/Home.jsx#L181)) e a coluna `console` do banco é **texto livre**, com default `'Super Nintendo'` — valor que não existe na lista de categorias da Home.

Distribuição real da coluna no banco:

```text
MEGA DRIVE 33 · GAME BOY 19 · SNES 12 · GBA 2
Super Nintendo 55  ← invisível
Game Boy 8 · Nintendo 1 · Super Nitendo 1 · Game boy 1 · game Boy 1  ← invisíveis
```

**42% do catálogo só aparece em "Todos".** Inclui um erro de digitação gravado no banco (`Super Nitendo`).

Correção em duas frentes: normalizar a coluna com um `UPDATE`, e trocar o campo de texto livre do formulário por um `<select>` fechado — senão o problema volta a cada cadastro.

**Tarefas**

- [x] Normalizar o valor de console na comparação do filtro
- [ ] `UPDATE` normalizando a coluna `console` na tabela `jogos`
- [ ] Trocar o campo de texto livre por `<select>` fechado no cadastro
- [ ] Definir a que console pertence o registro gravado como `Nintendo`

### 1.5 — Falhas que deixam o usuário preso

| Problema | Onde | Efeito |
| --- | --- | --- |
| Nenhuma rota 404 | [`App.jsx:22-58`](../src/App.jsx#L22-L58) | qualquer URL errada renderiza página **totalmente vazia** |
| GameRoom sem estado de erro | [`GameRoom.jsx:186-201`](../src/pages/GameRoom.jsx#L186-L201) | "Carregando jogo…" eterno, sem link de saída |
| "Enviar Print" oferecido a quem está deslogado | [`GameRoom.jsx:472`](../src/pages/GameRoom.jsx#L472) | só falha no final, depois de escolher o arquivo |
| Desfavoritar prende numa página vazia | `Home.jsx` | a paginação não reseta e os botões somem |
| Busca não ignora acento | `Home.jsx` | digitar "pokemon" retorna zero jogos |
| Erro no Ranking vira "Ninguém pontuou ainda" | `Ranking.jsx` | falha de rede parece estado vazio |
| Sem recuperação de senha | `Login.jsx` | quem esquece a senha **perde a conta e os pontos** |
| `/loja` sem nenhum link no site | `App.jsx:32` | a loja de afiliados é inalcançável navegando |
| Jogador nunca sabe o que houve com a missão | `GameRoom.jsx` / `AdminMissoes.jsx` | não existe tela de status |

**Tarefas**

- [x] Adicionar rota de 404
- [x] Dar estado de erro à sala de jogo, com link de saída
- [x] Exigir login antes de abrir o modal de envio de print
- [x] Limitar a página atual ao total válido, para desfavoritar não esvaziar a tela
- [x] Fazer a busca ignorar acentos
- [x] Distinguir erro de estado vazio no Ranking
- [ ] Implementar recuperação de senha
- [x] Criar ponto de entrada para `/loja`
- [ ] Criar tela de acompanhamento das missões enviadas

### 1.6 — O CDN do emulador já está quebrado

[`Emulator.jsx:39`](../src/components/Emulator.jsx#L39) aponta para o branch `@main` de um repositório de terceiros, num caminho que **não contém os arquivos do emulador**. O `emulator.min.js` responde 404 e o loader cai num fallback que o próprio EmulatorJS registra no console como *"THIS METHOD IS A FAILSAFE, AND NOT OFFICIALLY SUPPORTED"*.

Resultado por jogo aberto: **16 idas ao CDN em vez de 1**, incluindo um 404 puro, carregando a versão não-minificada.

Correção: apontar para o CDN oficial com versão fixada — `https://cdn.emulatorjs.org/4.2.3/data/`, onde o build minificado existe. Resolve os 404, reduz o peso e congela a versão, eliminando o risco de um commit de terceiro derrubar todos os jogos sem aviso.

---

**Tarefas**

- [x] Apontar o EmulatorJS para o CDN oficial em versão fixa

## Fase 2 — Peso e velocidade

### 2.1 — Imagens: o maior ganho do roadmap inteiro

84,6% do primeiro acesso são imagens. As capas têm em média 204 KiB e são exibidas numa caixa de 160px de altura. A maior tem **763 KiB e 1426×2000 px**.

| Ação | Ganho medido |
| --- | --- |
| Converter as 60 capas para WebP 400×320 q80 | 12,55 MB → **1,61 MB** (−87,2%) |
| Adicionar `loading="lazy"` e `decoding="async"` | 8 dos 12 cards da página 1 ficam abaixo da dobra no mobile |
| Dar `height`/`aspect-ratio` ao logo | elimina o salto de layout na entrada |

**Efeito combinado: 2,25 MiB → 0,66 MiB, ou 47 s → 14 s em 3G lenta.** Sem tocar em lógica.

**Tarefas**

- [ ] Converter as 60 capas para WebP 400×320
- [ ] Adicionar `loading="lazy"` e `decoding="async"` nos cards
- [ ] Dar dimensão fixa ao logo da Home

### 2.2 — Cache: hoje não existe

Medido em produção, não suposto:

```bash
$ curl -sI https://assoprafitas.com/assets/index-CEGMpbNX.js
cache-control: public, max-age=0, must-revalidate
```

**Todo arquivo do site** é servido com `max-age=0` — inclusive os assets que já têm hash de conteúdo no nome e nunca mudam. Um visitante recorrente paga cerca de **55 idas ao servidor** só para revalidar coisas que já tem em cache.

Correção: adicionar um bloco `headers` no [`vercel.json`](../vercel.json) com `max-age=31536000, immutable` para `/assets/*` (é seguro, os nomes têm hash), cache semanal para capas e ROMs, e manter `max-age=0` apenas para o `index.html`.

**Tarefas**

- [ ] Adicionar bloco `headers` no `vercel.json` com cache imutável para `/assets/*`
- [ ] Definir cache semanal para capas e ROMs

### 2.3 — 199 MiB de duplicata pura no repositório

`public/roms/` e `public/capas/` são cópias byte a byte do que já está na raiz de `public/`, e **nenhuma linha de código as referencia** — nem o fonte, nem o bundle gerado.

| Medida | Valor |
| --- | --- |
| Arquivos duplicados idênticos | 123 |
| Desperdício | **198,71 MiB** |
| Par com mesmo nome e conteúdo diferente | 1 — `logo.jpg` (a versão usada é a da raiz) |

Além disso, 83% de `public/` (332 MB) são ROMs e capas órfãs, incluindo jogos inteiros que nunca aparecem no site.

Isso não afeta a navegação — o navegador nunca baixa as duplicatas. Afeta **build, deploy e clone**: hoje o repositório é inviável de clonar em rede fraca.

**Tarefas**

- [ ] Remover `public/roms/` e `public/capas/`
- [ ] Decidir o destino das ROMs e capas órfãs

### 2.4 — Bundle e divisão de código

O bundle é um chunk único de 486 KB (136 KB gzip). Composição medida:

| Parte | Peso | % |
| --- | --- | :---: |
| react + react-dom | 197,7 KB | 41,6% |
| @supabase/supabase-js | 159,1 KB | 33,5% |
| código da aplicação | 81,8 KB | 17,2% |
| react-router-dom | 27,5 KB | 5,8% |
| lucide-react | 8,8 KB | 1,8% |

O ganho aqui é menor do que parece à primeira vista (ver [Avaliado e descartado](#avaliado-e-descartado)), mas vale por **higiene de cache**: separar React, Router e Supabase em chunks próprios faz o código da aplicação — que muda toda semana — parar de invalidar os 62 KB do React a cada deploy.

---

**Tarefas**

- [ ] Separar react, router e supabase em chunks próprios
- [ ] Envolver as rotas admin em `React.lazy`

## Fase 3 — Limpeza estrutural do código

Esta é a fase que o time vai sentir no dia a dia. Todas as medições abaixo saíram de ferramenta — ESLint configurado com as regras de métrica, e um detector de clones com tokenização e janela deslizante.

### 3.1 — A complexidade está concentrada em dois arquivos

| Componente | Complexidade ciclomática | Linhas na função |
| --- | :---: | :---: |
| `Home` | **33** | **874** |
| `GameRoom` | **24** | **655** |
| `Login` | 10 | 298 |
| demais 187 funções | ≤ 9 | — |

Distribuição das 190 funções do projeto: **96,8% têm complexidade ≤ 9**. Apenas duas passam de 10.

Isso muda a conversa. O código não está "todo ruim": ele tem dois componentes-deus e um monte de folha simples. `Home` sozinho acumula sessão, perfil, ranking, missões, catálogo, favoritos, busca, filtro, paginação, responsividade, sorteio e toda a renderização — numa única função de 874 linhas.

**Alvo:** extrair hooks (`useSessao`, `useCatalogo`, `useFavoritos`, `usePaginacao`) e componentes de apresentação, deixando `Home` e `GameRoom` como orquestradores de ~120 linhas.

**Tarefas**

- [ ] Extrair hooks da Home: sessão, catálogo, favoritos e paginação
- [ ] Extrair os componentes de apresentação da Home
- [ ] Extrair hooks e componentes da sala de jogo
- [ ] Tirar `gerarNumerosPagina` do componente como função pura

### 3.2 — Duplicação: 23% do projeto, 48% das telas de admin

Medido com três janelas de tokens, para não depender de um único critério:

| Escopo | Janela 30 | Janela 50 | Janela 80 *(conservadora)* |
| --- | :---: | :---: | :---: |
| Telas de admin (1.668 linhas) | 48,4% | **23,6%** | 6,3% |
| Projeto inteiro (4.488 linhas) | — | **22,7%** | — |

Piores arquivos: `Perfil.jsx` 41,4% · `AdminJogos.jsx` 38,4% · `AdminUsuarios.jsx` 35,8%.

O que mais chama atenção é a **ausência total de reuso** — não é código copiado e mantido igual, é código copiado e divergido:

| Componente conceitual | Ocorrências | Variantes distintas |
| --- | :---: | :---: |
| Botão primário amarelo | 8 | **8** — nenhuma cópia igual a outra |
| Card escuro | 23 | 20 — **7 tons** de "superfície escura" |
| Link de voltar | 11 | 8 — 3 tamanhos de ícone diferentes |
| Casca de página | 11 | 8 — 4 fundos, 3 grafias de `fontFamily` |
| Input | 10 | 9 |

E **379 cores hexadecimais escritas à mão**, 54 valores distintos. O [`index.css`](../src/index.css) já declara variáveis CSS — e o uso de `var(--…)` nos arquivos `.jsx` é **zero**.

**Tarefas**

- [ ] Criar `components/ui` com Botão, Card, Input, Layout e link de voltar
- [ ] Criar tokens de cor e substituir as 379 cores escritas à mão
- [ ] Migrar as telas para os componentes compartilhados

### 3.3 — A duplicação já custa dinheiro, medido

Dois números que provam a consequência prática em vez de apontar o cheiro:

**53% dos erros de lint são dois defeitos multiplicados por copy-paste.** Dos 19 achados do ESLint, 7 são o mesmo bloco `useEffect(() => { fetchX() }, [])` copiado em cinco arquivos, e 3 são a mesma destruturação inútil dentro do bloco de upload copiado duas vezes. Não são 19 problemas: são 2, colados 10 vezes. Cada correção hoje precisa ser feita cinco vezes.

**A duplicação de dados já está causando bug em produção.** Os 27 jogos do catálogo estático existem em duas estruturas (`games[]` e `gamesDb{}`), com 5 campos duplicados por jogo — 135 pares. **Quatro já estão dessincronizados:**

| Jogo | Divergência |
| --- | --- |
| Sonic (Master System) | capa aponta para a Wikipédia numa estrutura e para `/sonicthehedgehog.jpg` na outra |
| Contra III | `'Contra III'` × `'Contra III: The Alien Wars'` |
| Donkey Kong Country | `/dkc.png` × `/dkc.jpg` |
| Super Mario World | Wikipédia × `/supermarioworld.jpg` |

Como a Home lê uma estrutura e a sala de jogo lê a outra, **a capa e o nome mudam entre a listagem e a tela do jogo, hoje, no ar**. 137 das 234 linhas do `games[]` (58,5%) são pura repetição.

**Tarefas**

- [ ] Unificar `games[]` e `gamesDb{}` numa fonte única
- [ ] Corrigir as 4 divergências que já existem entre as duas

### 3.4 — Nenhuma camada entre a tela e o banco

| Medida | Valor |
| --- | --- |
| Páginas que importam `supabaseClient` direto | **13 de 13 (100%)** |
| Chamadas ao Supabase espalhadas nos componentes | 51 |
| Arquivos de serviço, repositório ou hook de dados | **0** |
| Handlers com a forma idêntica `fetch → setState` | 17, somando 241 linhas |

Operadores de query encadeados dentro do JSX: 19 `.select(`, 16 `.eq(`, 9 `.order(`, 6 `.update(`, 4 `.insert(`. A tela monta SQL.

Consequência direta: os três blocos de upload (`AdminJogos`, `AdminLoja`, `GameRoom`) repetem a mesma sequência — `split('.').pop()` → montar caminho → `upload(..., {upsert:true})` → `getPublicUrl` → gravar na tabela — e **os três têm zero validação de tipo ou tamanho de arquivo**. Foi assim que 29 capas PNG entraram no campo da ROM.

**Tarefas**

- [ ] Criar `services/` como único lugar que monta consulta
- [ ] Unificar os 3 blocos de upload, com validação de tipo e tamanho
- [ ] Criar um guard de rota único para as telas administrativas

### 3.5 — Responsividade: duas implementações que discordam

| Medida | Valor |
| --- | --- |
| Media queries no projeto | **0** |
| Páginas que tratam responsividade | 2 de 13 |
| Implementações independentes de "é mobile?" | 2, com regras diferentes |

`GameRoom` usa `innerWidth < 768 || innerHeight < 600`; `Home` usa `screenWidth <= 768`. **Numa janela de exatamente 768px, a Home considera mobile e a GameRoom considera desktop.** As sete telas de admin não tratam responsividade nenhuma e usam padding fixo de 40px.

Toda a responsividade do produto é ternário JavaScript dentro de objeto de estilo inline, reavaliado a cada evento de resize.

**Tarefas**

- [ ] Unificar a detecção de breakpoint entre Home e sala de jogo
- [ ] Migrar a responsividade de JavaScript para CSS

### 3.6 — Estruturas de dados e complexidade algorítmica

Cada item abaixo foi conferido por três ângulos diferentes — rigor algorítmico, adequação do princípio de design invocado e exequibilidade da correção — com o objetivo explícito de **derrubar a alegação**. Onde o enunciado original exagerava, ele foi corrigido; os números abaixo são os que sobraram.

**O que vale corrigir, e por quê de verdade:**

| Onde | Defeito | Por que consertar |
| --- | --- | --- |
| `[...data, ...games]` em [`Home.jsx:64`](../src/pages/Home.jsx#L64) | união de conjuntos feita com concatenação — **sem deduplicar por `id`** | **já produz bug visível:** "Super Mario World" aparece duas vezes na Home, e o React recebe `key` duplicada |
| `outrosJogos.sort()` em [`GameRoom.jsx:139`](../src/pages/GameRoom.jsx#L139) | `.sort()` é *in-place* e **muta o array do state**; `() => 0.5 - Math.random()` é embaralhamento enviesado | o viés é **posicional** e medido: índice 0 sai em 17,8% dos sorteios, índice 16 em 4,7%. Ordenação usada para amostragem é a ferramenta errada — Fisher-Yates parcial é O(k) em vez de O(n log n) |
| `getStats` em [`AdminDashboard.jsx:49-62`](../src/pages/AdminDashboard.jsx#L49-L62) | três consultas independentes com `await` em série | `Promise.all` leva a latência de `3·RTT` para `max(RTT)`. Nenhuma depende da outra. Correção trivial |
| Upload em [`AdminJogos.jsx:36-56`](../src/pages/AdminJogos.jsx#L36-L56) | capa e ROM sobem em série, sendo independentes | economiza um RTT de handshake. **Só depois de validar o `id`** — paralelizar antes disso agrava o problema de ROM órfã |
| `handleResize` em [`Home.jsx:46-51`](../src/pages/Home.jsx#L46-L51) | guarda a **largura bruta** no estado, mas só usa dois booleanos derivados | re-render a cada quadro do gesto. Onde realmente morde é no **mobile**, onde `resize` dispara quando a barra de URL aparece e some durante a rolagem |
| `key={idx}` em [`Home.jsx:443`](../src/pages/Home.jsx#L443) e [`:650`](../src/pages/Home.jsx#L650) | chave posicional em listas que **reordenam** (ranking por pontos, missões por data) | identidade de elemento errada na reconciliação. As duas listas têm chave natural disponível |
| Filtro de [`AdminGerenciarJogos.jsx:49-52`](../src/pages/AdminGerenciarJogos.jsx#L49-L52) | `j.nome.toLowerCase()` **sem guarda de nulo** | um jogo com `nome` NULL derruba a tela. O `?? ''` é o conserto — dois minutos |
| `select('*')` em [`Home.jsx:60`](../src/pages/Home.jsx#L60) | traz a tabela inteira para exibir 12 cards | enxugar as colunas paga sozinho e é uma linha |

**A calibração honesta — o que NÃO vender como ganho de performance:**

A conferência derrubou a retórica de três itens, e isso importa mais do que parece: levar número inflado para uma reunião é como o argumento inteiro perde credibilidade.

- **`favoritos` como Array em vez de `Set`.** Medido no tamanho real: **0,874 µs contra 0,381 µs**. Chamar isso de "o trecho quadrático do projeto" é dramatização — com 27 jogos e no máximo 27 favoritos, a diferença é imperceptível. A troca continua certa, mas o argumento é **semântico** (um conjunto deve ser modelado como conjunto), não de velocidade.
- **`useMemo` no `jogosFiltrados`.** Medido: **1,84 µs por render**, ordens de grandeza abaixo do custo de reconciliar os 12 cards que estão na tela. Recomendar `useMemo` aqui é otimização sem alvo. O que paga sozinho é apenas içar o `busca.toLowerCase()` para fora do predicado — uma linha.
- **`Object.values(gamesDb).filter()` a cada troca de jogo.** São ~2 µs e dois arrays pequenos, uma vez por navegação, ao lado de uma requisição de rede na mesma função. **Isto não é uma tarefa** — vira subproduto grátis quando o `games.js` for unificado.

**Item derrubado na conferência:** trocar o *refetch* da tabela após uma edição por atualização otimista. O veredito foi que hoje isso seria **trocar correção por microtimização** — quatro caminhos de escrita não reportam erro e os `update` não usam `.select()`, então a tela mostraria uma alteração que pode não ter acontecido no banco. Só faz sentido depois que o tratamento de erro existir.

> Resumo para a reunião: **o site não está lento por causa de algoritmo.** Está lento por causa das imagens da Fase 2. O que a Fase 3 entrega é código que escala e que para de produzir bug — três dos itens acima já causam defeito visível hoje.

**Tarefas**

- [x] Içar `busca.toLowerCase()` para fora do predicado do filtro
- [ ] Deduplicar por `id` a união dos catálogos
- [ ] Corrigir o sorteio de relacionados: copiar antes e usar Fisher-Yates
- [ ] Paralelizar as três consultas do painel administrativo
- [ ] Paralelizar os uploads de capa e ROM, depois de validar o id
- [ ] Guardar o booleano de breakpoint em vez da largura em pixels
- [ ] Trocar `key={idx}` por chave natural nas duas listas que reordenam
- [ ] Adicionar guarda de nulo no filtro do admin
- [ ] Enxugar as colunas do `select` da Home

### 3.7 — Alvo estrutural

```mermaid
flowchart TB
    subgraph DEPOIS["Estrutura alvo"]
        direction TB
        PG["pages/<br/>orquestração, ~120 linhas cada"]
        HK["hooks/<br/>useSessao, useCatalogo, useCrudSupabase"]
        SV["services/<br/>o único lugar que monta query"]
        UI["components/ui/<br/>Botao, Card, Input, Layout, VoltarLink"]
        TK["styles/tokens<br/>as 54 cores viram ~12"]
        PG --> HK --> SV
        PG --> UI --> TK
    end
```

**Primeiro passo, o que destrava o resto:** extrair `components/ui` e os tokens de cor. É mecânico, tem risco baixo de regressão, elimina as 8 variantes de botão e as 20 de card, e passa a dar um lugar óbvio para tudo que vier depois.

**Sobre TypeScript:** o projeto já tem `@types/react` instalado e é todo JavaScript. A recomendação é **não** migrar nesta primeira limpeza — o ganho não paga o custo enquanto os dois componentes-deus existirem. Reavaliar depois da 3.1.

---

## Fase 4 — Layout e navegação

| Item | Medição | Correção |
| --- | --- | --- |
| Vãos mortos de anúncio | primeiro jogo a **1.750px** do topo no mobile; ~1.650px também em 768, 844 e 1024px | não reservar 250px fixos quando o slot não preenche |
| Ordem no mobile | logo → busca → filtros → **anúncio → desafios → anúncio → top 5** → jogos | subir a grade de jogos |
| Header quase vazio | só o botão ENTRAR e um `<div/>` de 0×0 | logo e navegação no topo |
| GameRoom desperdiça 600px | dois `<aside>` de "Publicidade" vazios no desktop | recolher quando não há criativo |
| GameRoom em 390×844 | termina com **690px** de "Publicidade" vazia no rodapé | idem |
| Criativo transborda a coluna | iframe de 300px numa coluna de 260px | ajustar a coluna |
| Capas cortadas | `objectFit: cover` corta de **20% a 34%** da arte | padronizar proporção |
| Grade com órfãos | `minmax(160px)` com 12 itens deixa a última linha incompleta em 1440px | ajustar itens por página ao número de colunas |
| Filtros em 4 linhas no mobile | 9 botões quebrando | faixa única com rolagem horizontal |
| Card de desafios | `maxHeight: 260` corta o texto no meio da frase | indicar rolagem |
| Estado da vitrine não vai para a URL | voltar de um jogo devolve para a página 1 | busca, filtro e página na *query string* |
| IDs de anúncio repetidos entre rotas | mesmos IDs na Home e na GameRoom; após navegação SPA o slot não reexibe | IDs distintos por rota |

**Tarefas**

- [ ] Não reservar 250px fixos quando o slot de anúncio não preenche
- [ ] Subir a grade de jogos na ordem visual do celular
- [ ] Colocar logo e navegação no cabeçalho fixo
- [ ] Recolher os painéis de publicidade da sala de jogo quando não há criativo
- [ ] Ajustar a largura da coluna para o criativo de 300px não transbordar
- [ ] Padronizar a proporção das capas para não cortar a arte
- [ ] Ajustar itens por página ao número de colunas da grade
- [ ] Transformar os filtros em faixa única com rolagem horizontal no celular
- [ ] Indicar rolagem no card de desafios
- [ ] Levar busca, filtro e página para a URL
- [ ] Usar IDs de anúncio distintos por rota

## Fase 5 — Higiene: SEO, acessibilidade e qualidade

**SEO** — não existem `robots.txt` nem `sitemap.xml`; o `index.html` não tem nenhuma tag `og:`, `twitter:` ou `canonical`; e o `<title>` é fixo em todas as rotas. Colar o link no WhatsApp não gera prévia nenhuma.

**Acessibilidade** — 13 botões só de ícone sem nome acessível (o leitor de tela anuncia apenas "botão"); **55 elementos clicáveis com menos de 44px** (o coração de favoritar tem 28×31px); zero regras de `:focus` no projeto e 8 inputs com `outline: none`, incluindo e-mail e senha do login; contraste reprovado em `#666` e `#555` (piores casos **2,24:1** e **2,67:1**, contra o mínimo de 4,5:1); nenhum input tem `label` associada nem `autoComplete`; a Home não tem nenhum `<h1>`.

**Qualidade** — `npm run lint` não passa em checkout limpo (17 erros, 2 avisos); 24 `alert()` nativos como feedback de UI em 9 páginas; `animate-spin` usada em 6 lugares e nunca definida, então todos os indicadores de carregamento estão parados; a fonte Inter é referenciada em 12 arquivos e nunca carregada; componentes órfãos (`AvisoPrint`, `AnuncioLateral`, `App.css`, `assets/react.svg`); CSS morto; `public/readme.html` é lixo do CoolROM servido publicamente com redirecionamento para um site de ROMs pirata; o `manifest.json` aponta para um `favicon.ico` que não existe.

**Dados** — 120 dos 184 perfis estão com `nome` NULL, porque o cadastro nunca grava um nome; o pódio da Home já mostra `---`. O Meta Pixel dispara `CompleteRegistration` em **todo carregamento de página**, não no cadastro, o que contamina a métrica de conversão. Apagar um jogo deixa a ROM e a capa no Storage — já há 10 ROMs (14,8 MiB) e 11 capas órfãs acumuladas.

---

**Tarefas — SEO**

- [ ] Criar `robots.txt` e `sitemap.xml`
- [ ] Adicionar tags `og:` e `twitter:` e `canonical`
- [ ] Tornar o `<title>` dinâmico por rota

**Tarefas — Acessibilidade**

- [ ] Dar nome acessível aos 13 botões só de ícone
- [ ] Levar os alvos de toque a 44px
- [ ] Criar estados de foco visíveis e remover os `outline: none`
- [ ] Corrigir o contraste dos cinzas `#666` e `#555`
- [ ] Associar rótulo e `autoComplete` aos campos de formulário
- [ ] Dar um `<h1>` à Home

**Tarefas — Qualidade**

- [ ] Zerar os 17 erros e 2 avisos do lint
- [ ] Substituir os 24 `alert()` por feedback na interface
- [ ] Definir a animação dos indicadores de carregamento
- [ ] Carregar a fonte Inter ou trocar a declaração
- [ ] Remover componentes órfãos, CSS morto e `public/readme.html`
- [ ] Corrigir o ícone que o `manifest.json` aponta

**Tarefas — Dados**

- [ ] Passar a gravar o nome no cadastro e corrigir os 120 perfis sem nome
- [ ] Disparar o evento de cadastro do pixel só no cadastro
- [ ] Apagar os arquivos do Storage junto com o registro

## Avaliado e descartado

Itens levantados na varredura inicial que **não sobreviveram à conferência**. Estão aqui porque mostrar o que foi descartado é o que dá credibilidade ao que ficou.

| Suspeita | Veredito |
| --- | --- |
| "As 7 telas de admin inflam o bundle de todo visitante" | **Magnitude errada.** Elas entram no bundle, sim, mas são **6,7% do bruto e 4,5% do gzip** — não a fatia dominante que a hipótese sugeria |
| "`lucide-react` pode estar entrando inteiro" | **Refutado com número:** 42 dos 3.824 ícones, 8.981 bytes. Se entrasse inteiro o bundle passaria de 17 MB |
| "Subscription do Supabase sem `unsubscribe` (vazamento)" | **Refutado.** Existe exatamente 1 subscription no projeto e ela tem `unsubscribe` correto no cleanup |
| "`setState` após desmontagem vaza memória" | **Refutado.** Em React 19 não vaza nem avisa. Sobra uma corrida de resposta obsoleta na GameRoom, de baixa probabilidade |
| "Cada desafio novo aumenta o vão embaixo dos filtros" | **Invertido.** O `maxHeight: 260` é exatamente a mitigação disso — o próprio comentário do código diz. Confirmada só a outra metade: a grade se alinha pela coluna mais alta |
| "Título com altura fixa desalinha o card" | **Invertido.** A altura fixa é o que *garante* o alinhamento (todos os cards com 295px). O problema real é truncamento de texto |
| "Falta `lang` no `<html>`" | **Refutado.** O atributo existe e é válido |
| "Faltam `alt` nas imagens" | **Refutado.** Todas as 8 imagens têm `alt` — o *grep* de uma linha dava falso positivo porque o JSX quebra atributos em várias linhas |
| "Há risco de XSS" | **Refutado.** Nenhum `dangerouslySetInnerHTML`, nenhum `eval`, e os dois `innerHTML` não recebem dado de usuário |
| "Credenciais do Supabase expostas no código" | **Calibrado.** A chave é *publishable* (anônima) — estar no bundle é o funcionamento normal do Supabase, não um vazamento. Nenhuma `service_role` no repositório. O problema real é ausência de `.env`, que dificulta rotação e separação de ambientes |

### Boas práticas que decidimos NÃO adotar

Esta lista existe para deixar claro que o roadmap tem freio. São padrões corretos em tese, avaliados item a item e recusados **porque o custo não se paga no tamanho deste projeto** — 5.000 linhas, equipe pequena, um único backend.

| Padrão recusado | Motivo |
| --- | --- |
| **React Query / Zustand** | resolveria de fato cache e o par carregando/erro, mas custa uma dependência, um paradigma novo para a equipe e um *provider* — para uma superfície de 6 consultas nas telas do jogador |
| **Camada de Repository/DTO por tabela** | ~5 arquivos e uma indireção por consulta para resolver um problema que não existe: não há intenção de trocar o Supabase, não há segunda implementação e não há suíte de testes que precise de simulação |
| **Context/reducer global de estado** | a reação natural a "14 `useState` num componente" é um *Provider* central. Aqui isso troca um problema real (componente grande) por outro pior: re-render em cascata e indireção. A extração de hooks resolve sem isso |
| **`useCallback`/`useMemo` nos estilos e handlers** | não há `React.memo` em lugar nenhum, então os filhos re-renderizam de qualquer forma. Envolver tudo em memoização adicionaria dezenas de listas de dependência para ganho zero |
| **Virtualizar a lista de jogos** | 12 itens por página. Não aparece no *profiler* |
| **Fatiar os favoritos em chaves separadas no `localStorage`** | serializar 27 ids custa microssegundos; o custo dominante é a chamada síncrona, que não some com mudança de estrutura |
| **Criar `src/utils/format.js` agora** | seria uma pasta vazia esperando conteúdo. O momento de criar é quando a primeira formatação for duplicada |
| **Migrar para TypeScript nesta limpeza** | o ganho não se paga enquanto os dois componentes-deus existirem. Reavaliar depois da 3.1 |

## Depende de checagem fora do repositório

Nada abaixo é verificável lendo o código. São pontos onde o comportamento real depende de painel externo, e por isso estão registrados como pergunta e não como afirmação.

**Supabase** — as *policies* de RLS de cada tabela e dos 4 buckets; o corpo da função `aprovar_missao_gm` (é o único ponto que credita pontos, e é chamada direto do cliente com jogador e quantidade como parâmetros arbitrários — vale confirmar se ela valida quem chamou); a existência da *trigger* que cria a linha em `profiles` após o cadastro; a chave estrangeira de `missoes` para `profiles`; e as URLs de redirecionamento do Auth.

**Vercel** — se há sobrescrita de framework, comando de build ou variáveis de ambiente no painel, já que o `vercel.json` só declara o *rewrite*. E se o tamanho do `dist/` (399,5 MiB) esbarra em algum limite do plano contratado no deploy por Git.

**Google Ad Manager** — se as linhas da rede `/23340104016` estão presentes no `ads.txt`. O arquivo atual tem apenas uma linha de AdSense. Isso **não** é afirmação de perda de receita: é uma conferência que só pode ser feita no painel.

---

*Levantamento de agosto de 2026. Documentação de apoio: [README.md](../README.md) · [ARQUITETURA.md](ARQUITETURA.md) · [CATALOGO-DE-JOGOS.md](CATALOGO-DE-JOGOS.md).*
