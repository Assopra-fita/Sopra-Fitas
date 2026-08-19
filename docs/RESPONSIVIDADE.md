# Responsividade — problemas medidos

Levantamento feito medindo cada tela em 10 larguras (320, 360, 390, 414, 600, 768, 900, 1024, 1280, 1440) e em paisagem de celular. **Cada item traz o número que o comprova** — nada aqui é impressão.

> O ambiente local **não serve anúncios**, então os slots ficam vazios nas medições e cheios em produção. Itens marcados como fora do escopo dependem de decisão de quem cuida da monetização.

**43 problemas**, sendo 13 de severidade alta.

---

## Tela inicial — 11 problemas

> A tela inicial nao tem transbordo horizontal em nenhuma das 13 medicoes: document.documentElement.scrollWidth e igual a window.innerWidth em 320, 360, 390, 414, 600, 768, 844x390, 900, 1024, 1100, 1101, 1280 e 1440, nenhum elemento ultrapassa a janela e nao ha sobreposicao entre cabecalho, busca, filtros, laterais, grade, paginacao e rodape. O defeito central e a largura do card de jogo, que varia 2,5x sem qualquer logica de tela: 292px em 320, 158px em 360, 173px em 768, 159px em 900, 163px em 1100 e 118px em 1101 - o pior ponto e a fronteira de 1100/1101, onde um unico pixel de janela derruba o card de 163.3px para 118.3px porque a grade migra para uma coluna central de 521px espremida entre laterais fixas de 260px e 240px. O segundo defeito estrutural e a ordem no celular: o primeiro jogo so aparece a 1627.5px do topo (2,54 telas em 360x640 e 4,39 telas na paisagem 844x390); os anuncios respondem por 500px disso, que estao fora do escopo, mas os cards de Desafios e Top 5 respondem por outros 552.7px que estao dentro. Sobre os itens perguntados: o card de Desafios do mes nao corta texto dentro dos desafios, mas esconde o terceiro atras de um max-height de 260px contra 368px de conteudo (108px ocultos ate em 1440, onde ha espaco de sobra); o Top 5 esta legivel, nenhum nome truncado, so a numeracao #4/#5 fica em 11.2px; e o rodape nao apresentou defeito (60.2px de altura, 12.8px de fonte no celular e 16px acima de 768, centralizado, sem transbordo). Nota de execucao: outra sessao editou src/styles/paginas.css e CabecalhoHome.jsx durante a medicao (16:01, 16:02 e 16:12) - todos os numeros deste relatorio sao da ultima passada, com md5 851fc90f estavel antes e depois; nessa janela o campo de busca, que estava preso em 293px em qualquer largura, ja foi corrigido com width:100% e agora mede 600px em 768 e 540px em 1440.

### 🔴 Alta — Card de jogo esmagado a 118px entre 1101 e 1187px de largura

**Onde:** Tela inicial (/) · larguras 1101 a 1187px

**Evidência medida:** Card mede 118.3px em 1101, 130.5px em 1150 e chega a 140.0px so em 1188. Em 1100px o mesmo card mede 163.3px: um pixel de largura de janela derruba o card em 27,5% e a grade de 1060px para 521px. Piso aceitavel de 140px so e cruzado a partir de 1188.

**Causa:** src/styles/paginas.css:745 .home__secao usa colunas fixas de 260px e 240px nas laterais; src/styles/paginas.css:880 forca repeat(4, minmax(0,1fr)) na grade a partir de 1101px; src/hooks/useBreakpoint.js:4 TABLET=1100 decide onde a grade migra para a coluna central. Conta em 1101: 1101 - 40 (padding) - 260 - 240 - 40 (2 gaps) = 521px de coluna central; (521 - 48) / 4 = 118,25px por card.

**Correção:** Subir o limiar de tres colunas para 1250px, onde a conta ja fecha: useBreakpoint.js TABLET = 1250; paginas.css:880 vira @media (min-width: 1251px) e paginas.css:894 vira @media (max-width: 1250px). Resultado medido: em 1250 o card volta a 155.5px e entre 1101 e 1250 a grade usa auto-fill com 6 colunas de 163.3px (12 jogos = 2 linhas cheias).

### 🔴 Alta — Card gigante de 292px em telas de 320px (grade cai para 1 coluna)

**Onde:** Tela inicial (/) · larguras 320 a 343px

**Evidência medida:** Em 320px a grade tem 292px e 1 unica coluna: card de 292x267.7px, contra o teto aceitavel de 230px. Em 360px o mesmo card mede 158px. A pagina fica com 5248px de altura (contra 3482px em 360) porque os 12 jogos viram 12 linhas.

**Causa:** src/styles/paginas.css:871 .home__grade usa repeat(auto-fill, minmax(150px, 1fr)) com gap de 16px, e src/styles/paginas.css:904 deixa .home__conteudo com padding lateral de 14px. Largura util em 320 = 292px, abaixo dos 2x150+16 = 316px que auto-fill exige para abrir a segunda coluna.

**Correção:** @media (max-width: 343px) { .home__grade { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } } -> 2 colunas de 141px em 320px, dentro da faixa de 140 a 230.

### 🔴 Alta — 1627px de rolagem ate o primeiro jogo no celular

**Onde:** Tela inicial (/) · larguras 320 a 1100px (pior caso na paisagem 844x390)

**Evidência medida:** Primeiro card em y=1627.5px nas larguras 320/360/390 = 2.54 telas em 360x640 e 1.93 telas em 390x844. Em paisagem 844x390 o primeiro card fica em y=1711.6px = 4.39 telas. Decomposicao medida em 360px: padding 120 + busca 104 + filtros 170.8 + anuncio 250 + card Desafios 328.4 + anuncio 250 + card Top 5 224.3. Fora os anuncios (500px), os dois cards laterais empurram 552.7px antes do primeiro jogo.

**Causa:** src/pages/Home.jsx:257 renderiza a grade ({isTablet && gradeDeJogos}) depois de <section class=home__secao>, e src/styles/paginas.css:894 da order:2 a coluna esquerda no ramo de coluna unica. A ordem visual no celular fica: busca, filtros, anuncio, Desafios, anuncio, Top 5 e so entao os jogos. Os 500px de anuncio sao fora do escopo; os 552.7px de Desafios + Top 5 nao.

**Correção:** Mover a grade para dentro da secao logo apos a coluna central e reordenar: em Home.jsx colocar {isTablet && <div className="home__grade-mobile">{gradeDeJogos}</div>} como filho de .home__secao; em paginas.css, dentro de @media (max-width:1100px): .home__secao { display: flex; flex-direction: column; } .home__coluna--centro { order: 1 } .home__grade-mobile { order: 2 } .home__coluna--esquerda { order: 3 } .home__coluna--direita { order: 4 }. Ganho medido: o primeiro card sobe de 1627.5px para cerca de 475px.

### 🔴 Alta — Alvos de toque abaixo de 44px em seis controles do celular

**Onde:** Tela inicial (/) · larguras 320 a 768px (os tres ultimos tambem em 900 a 1440)

**Evidência medida:** Medido em 320/360/390/414/600/768: link Ranking do cabecalho 16.0x44px (largura de 16px), link da logo 52.4x28px, botao Entrar 97.9x34px, cada um dos 10 filtros 69.0x35.2px, cada um dos 6 botoes de paginacao 38.0x38.4px, link Ver tudo do Top 5 44.9x16.8px. Em 900 a 1440 permanecem abaixo: filtro 73.6x37.6, paginacao 38x38.4, Ver tudo 44.9x16.8.

**Causa:** src/styles/paginas.css:842 .home__filtro com min-height:34px; src/styles/paginas.css:688 .paginacao__botao com min-width/min-height:38px; src/styles/componentes.css:64 .btn--compacto com min-height:34px; src/styles/paginas.css:610 esconde o texto do .topo__link no celular deixando so o icone de 16px; .lateral__ver-tudo (paginas.css:447) e .topo__logo (paginas.css:555) nao tem altura minima.

**Correção:** Dentro de @media (max-width: 768px): .home__filtro { min-height: 44px } .paginacao__botao { min-width: 44px; min-height: 44px } .btn--compacto { min-height: 44px } .topo__link { min-width: 44px; justify-content: center } .topo__logo { min-height: 44px } e, em qualquer largura, .lateral__ver-tudo { display: inline-flex; align-items: center; min-height: 44px; padding: 0 4px }.

### 🟡 Média — Card Desafios do mes esconde o terceiro desafio atras de rolagem interna

**Onde:** Tela inicial (/) · larguras 320, 360, 390, 414, 1101, 1280, 1440

**Evidência medida:** .lateral__lista tem clientHeight 260px contra scrollHeight 368px em 1101/1280/1440 (108px ocultos), 353px em 320 (93px ocultos), 338px em 360 e 390 (78px ocultos) e 289px em 414 (29px ocultos). Apenas 2 dos 3 desafios ficam visiveis. Os textos em si nao sao truncados: nenhum titulo ou objetivo tem scrollHeight maior que a propria caixa; o que corta e o teto da lista.

**Causa:** src/styles/paginas.css:456 .lateral__lista { max-height: 260px; overflow-y: auto }. O comentario justifica o teto pelo desktop (evitar que a coluna lateral estique a secao), mas ele tambem se aplica no celular, onde a coluna e unica e a rolagem aninhada dentro da rolagem da pagina nao tem justificativa. Em 1440 a coluna esquerda tem 618.4px de altura e ainda assim a lista para em 260px.

**Correção:** Trocar por um teto proporcional a janela e so no layout de tres colunas: .lateral__lista { overflow-y: auto } e @media (min-width: 1101px) { .lateral__lista { max-height: calc(100vh - 200px) } }. Em 1440 isso libera os 368px inteiros; no celular a lista passa a crescer no fluxo da pagina.

### 🟡 Média — Faixa vazia de 55px entre o cabecalho fixo e o conteudo no celular

**Onde:** Tela inicial (/) · larguras 320 a 768px

**Evidência medida:** .topo mede 65px de altura em todas as larguras ate 768 (medido em 320, 360, 390, 414, 600 e 768), enquanto .home__conteudo tem padding-top de 120px: sobram 55px de tela preta antes do primeiro elemento util. Acima de 768 o ajuste esta correto: topo de 75px contra padding de 100px, folga de 25px.

**Causa:** src/styles/paginas.css:904, bloco @media (max-width: 768px), .home__conteudo { padding: 120px 14px 40px }. O valor 120 foi dimensionado para um cabecalho que quebrava em duas linhas; o cabecalho atual cabe em uma so.

**Correção:** .home__conteudo { padding: 85px 14px 40px } dentro do mesmo @media (65px do cabecalho + 20px de respiro).

### 🟡 Média — Texto de leitura abaixo de 12px em cinco elementos

**Onde:** Tela inicial (/) · larguras todas, de 320 a 1440 (valores identicos em todas)

**Evidência medida:** font-size computado: .desafio__objetivo 11.52px (3 ocorrencias, e texto corrido de leitura), .desafio__recompensa 11.52px (3), .card-jogo__console 11.2px (12 por pagina), .lateral__ver-tudo 11.2px, .top5__posicao 11.2px (2). Nenhum deles aumenta em nenhuma das 13 medicoes.

**Causa:** src/styles/paginas.css:482 (.desafio__objetivo 0.72rem), :488 (.desafio__recompensa 0.72rem), :657 (.card-jogo__console 0.7rem), :447 (.lateral__ver-tudo 0.7rem), :526 (.top5__posicao 0.7rem). Com raiz de 16px, 0.7rem = 11.2px e 0.72rem = 11.52px.

**Correção:** Piso de 0.75rem (12px) nos rotulos curtos (.card-jogo__console, .lateral__ver-tudo, .top5__posicao, .desafio__recompensa) e 0.8rem (12.8px) em .desafio__objetivo, que e o unico texto corrido do grupo.

### 🟡 Média — Filtros ocupam 4 linhas e 170.8px de altura acima da dobra no celular

**Onde:** Tela inicial (/) · larguras 320, 360, 390 (4 linhas), 414 (3 linhas), 1101 (3 linhas)

**Evidência medida:** 10 botoes de filtro quebram em 4 linhas em 320/360/390, formando um bloco de 170.8px; 3 linhas em 414; 2 linhas de 600 a 1440 (85.2px); e voltam a 3 linhas em 1101 (132.8px), porque ali a coluna central encolhe para 521px. Sao 170.8px consumidos antes de qualquer jogo aparecer.

**Causa:** src/styles/paginas.css:835 .home__filtros { display: flex; flex-wrap: wrap } com 10 pilulas de largura variavel (69px cada no celular) numa faixa util de 292 a 362px.

**Correção:** No celular trocar a quebra por rolagem horizontal: @media (max-width: 768px) { .home__filtros { flex-wrap: nowrap; overflow-x: auto; justify-content: flex-start; scroll-snap-type: x proximity } .home__filtro { flex: 0 0 auto; scroll-snap-align: start } }. Devolve cerca de 128px de altura acima da dobra.

### 🟡 Média — Ultima linha da grade com 2 de 5 cards entre 854 e 1019px

**Onde:** Tela inicial (/) · larguras 854 a 1019px (medido em 900)

**Evidência medida:** Em 900px a grade tem 860px e 5 colunas de 159.2px: os 12 jogos da pagina fecham 2 linhas cheias e uma terceira com apenas 2 cards (40% preenchida). Em 768 sao 4 colunas (3 linhas cheias) e em 1024 sao 6 colunas (2 linhas cheias) - so a contagem de 5 nao divide 12.

**Causa:** src/styles/paginas.css:871 usa repeat(auto-fill, minmax(150px, 1fr)), que nao conhece a paginacao de 12 itens fixada em src/pages/Home.jsx:76. Cinco colunas ocorrem quando a grade mede entre 814 e 979px, ou seja de 854 a 1019px de janela.

**Correção:** Fixar nessa faixa uma contagem que divide 12: @media (min-width: 854px) and (max-width: 1019px) { .home__grade { grid-template-columns: repeat(4, minmax(0, 1fr)) } } -> em 900px sao 4 cards de 203px e 3 linhas cheias.

### 🔵 Baixa — Botao de sorteio vira uma barra de 332x50px sem rotulo no celular

**Onde:** Tela inicial (/) · larguras 320 a 768px

**Evidência medida:** Medido: 300x50px em 320, 332x50 em 360, 362x50 em 390 e 600x50 em 768 - largura total da coluna para um icone de dados de 24px, sem texto. Acima de 768 o mesmo botao mede 50x50 ao lado da busca. Os 50px de altura entram no orcamento acima da dobra logo abaixo do campo de busca.

**Causa:** src/styles/paginas.css:904, bloco @media (max-width: 768px): .home__busca { flex-direction: column } somado a .home__sorteio { width: 100%; border-radius: 14px }. A regra base do botao esta em paginas.css:821.

**Correção:** Manter o botao ao lado do campo tambem no celular (remover o flex-direction: column e deixar .home__busca-campo { flex: 1 } cuidar do resto), ou, se a pilha for intencional, dar rotulo visivel: .home__sorteio { gap: 8px } com o texto "Sortear um jogo" ao lado do icone.

### 🔵 Baixa — Colunas 8px mais largas que a secao em 320px, deixando a margem direita com 6px · ⛔ **fora do escopo (anúncio)**

**Onde:** Tela inicial (/) · larguras 320px (e qualquer largura abaixo de 328px)

**Evidência medida:** .home__secao mede 292px (x=14 ate 306) mas as tres colunas medem 300px (x=14 ate 314): a faixa lateral direita da pagina fica com 6px contra 14px na esquerda, uma assimetria visivel de 8px. O min-content medido do bloco .anuncio da coluna esquerda e exatamente 300px, contra 250px do da direita.

**Causa:** O slot GPT content1 e declarado com tamanhos [250x250, 300x250, 336x280] em index.html:66-69 e o de menor largura util acaba fixando 300px de min-content, acima dos 292px que sobram em 320px com o padding de 14px de .home__conteudo (paginas.css:904). Problema causado pelo anuncio: registrado, mas fora do escopo por decisao da dona.

**Correção:** Se um dia entrar no escopo: reduzir o padding lateral para 10px abaixo de 344px, ou declarar apenas o tamanho 250x250 para o slot nessas larguras. Nenhuma mudanca de CSS proprio resolve enquanto o slot exigir 300px.

---

## Sala de jogo — 10 problemas

> A sala de jogo não tem transbordo horizontal em nenhuma das 13 resoluções medidas nos dois jogos: document.documentElement.scrollWidth ficou exatamente igual a window.innerWidth em 320, 360, 390, 414, 600, 768, 900, 1024, 1280, 1440 e nas paisagens 844x390, 740x360 e 667x375; o cromo também não atrapalha, o topo do emulador fica em y=20 no retrato e y=0 na paisagem, e o modal de enviar print cabe inteiro em todas as larguras (caixa de 280x232,6 em 320 e 400x232,6 daí para cima), inclusive se o aparelho for girado com ele aberto. O problema mais grave é lógico, não visual: a condição isGameFocus em GameRoom.jsx:30 só olha orientação e altura, então qualquer janela de desktop em paisagem com 600px ou menos de altura de viewport (medido em 1024x600, 1280x600 e 1280x560) cai no modo compacto e perde o título, a descrição, o card de missão, os jogos relacionados e o botão Enviar Print, com a página travada em scrollHeight igual à altura da janela — e em 900x601 tudo volta, o que confirma o gatilho. Depois vem a barra de controles, que por não ter media query nenhuma quebra em 3 linhas e 144px de altura em 320px, contra um emulador de apenas 210px de altura, e volta a 2 linhas em 768 e 1024. Nenhum controle da tela atinge o alvo de toque de 44px: 34px de altura no retrato, 26px na paisagem, 24x27 no X do modal e 21px no campo de arquivo. A grade de relacionados colapsa para 1 coluna com card de 280px em 320px por causa do minmax(150px, 1fr), e o texto do painel vaza 12px da caixa em 320 por causa do minWidth de 250px. Registrei também, marcado como fora do escopo, o fato de o emulador encolher de 560x420 (viewport de 600px) para 384x288 (viewport de 1024px) porque os trilhos de anúncio de 300px entram já aos 768px — os anúncios carregaram de verdade neste ambiente, então essas medidas são reais, e a parte corrigível sem mexer em anúncio é subir o ponto de virada de 3 colunas para ~1200px.

### 🔴 Alta — Janela de desktop com altura de viewport ≤600px entra no modo compacto e apaga a página inteira

**Onde:** Sala de jogo (/jogar/atari-asteroids e /jogar/snes-aladdin) · larguras Qualquer largura em paisagem com altura de viewport ≤600px — confirmado em 1024x600, 1280x600 e 1280x560. Não ocorre em 900x601.

**Evidência medida:** Em 1280x600 o container recebe a classe 'game-shell--focus'; document.querySelector('h1') retorna null, o botão 'Enviar Print' não existe, os dois <aside> ficam com display:none e document.documentElement.scrollHeight = 600 = window.innerHeight, ou seja, não há como rolar para nada. Em 1024x600 idem (emulador 753,3x565). Em 900x601 — 1px a mais de altura — tudo volta: h1 presente, Enviar Print presente, asides com display:flex, scrollHeight = 1759.

**Causa:** src/pages/GameRoom.jsx:30-32, getLayout(): isGameFocus = window.matchMedia('(orientation: landscape) and (max-height: 600px)').matches. A media query não restringe largura nem tipo de ponteiro, então um notebook com a janela em 600px de altura satisfaz a condição. O comentário das linhas 28-29 afirma 'Tablet/desktop deitado não entra', o que é mensuravelmente falso.

**Correção:** Restringir a consulta a telas realmente pequenas: window.matchMedia('(orientation: landscape) and (max-height: 600px) and (max-width: 900px)') — ou, melhor, '(orientation: landscape) and (max-height: 600px) and (pointer: coarse)'. Em CSS: @media (orientation: landscape) and (max-height: 600px) and (max-width: 900px) { .game-shell { height: 100dvh; overflow: hidden } }

### 🔴 Alta — Barra de controles quebra em 2 e 3 linhas e come a altura do emulador

**Onde:** Sala de jogo · larguras 320 (3 linhas), 360, 390, 414, 768 e 1024 (2 linhas). Só cabe em 1 linha a partir de 556px de largura útil (600, 900, 1280, 1440).

**Evidência medida:** 320x568: barra com 280x144 (3 linhas) contra um emulador de apenas 280x210 — os controles ocupam 69% da altura da área de jogo. A soma das larguras dos 5 botões é 456,9px (Sair 71,2 + Salvar 83,3 + Carregar 97,5 + Reiniciar 96,8 + Tela Cheia 108,1) mais 40px de gap e o divisor, ≈508px, contra 276px de largura útil. 360/390/414: barra de 102px de altura, 2 linhas. 768: 428x100, 2 linhas. 1024: 384x102, 2 linhas. Nenhuma delas rola (overflow-x fica 'visible' fora do modo paisagem: scrollWidth = clientWidth em todas).

**Causa:** src/pages/GameRoom.jsx:361-378 — fora do isGameFocus a barra usa flexWrap:'wrap', padding 10px e gap 10px, sem nenhuma media query; e src/pages/GameRoom.jsx:139-151 (estiloBotao) mantém rótulo textual completo com padding '8px 12px' e whiteSpace:'nowrap' em qualquer largura.

**Correção:** Migrar a barra para CSS e, abaixo de 480px, ou rolar horizontalmente como já se faz no modo paisagem, ou esconder o rótulo: .barra-jogo { display:flex; justify-content:center; gap:10px; padding:10px } @media (max-width: 480px) { .barra-jogo { flex-wrap: nowrap; overflow-x: auto; gap: 6px; padding: 6px; scrollbar-width: none } .barra-jogo button { padding: 8px 10px } } — o que reduz a barra de 144px para ~50px em 320. Para 768/1024 a barra só volta a uma linha corrigindo a largura do main (ver item dos trilhos de anúncio).

### 🔴 Alta — Todos os botões de controle do jogo estão abaixo do alvo de toque de 44px

**Onde:** Sala de jogo · larguras 320, 360, 390, 414, 600 (34px de altura) e paisagem 844x390 / 740x360 / 667x375 (26px de altura)

**Evidência medida:** Retrato: Sair 71,2x34; Salvar 83,3x34; Carregar 97,5x34; Reiniciar 96,8x34; Tela Cheia 108,1x32 — medido igual em 320, 360, 390, 414 e 600. Botão 'Enviar Print' 196x35 em 320 e 266x35 em 390. Paisagem 844x390: Sair 58,2x26; Salvar 68,7x26; Carregar 81,2x26; Reiniciar 80,5x26; Tela Cheia 90,1x26. Nenhum controle da tela chega a 44px de altura em nenhuma largura de celular.

**Causa:** src/pages/GameRoom.jsx:139-151, estiloBotao: padding '8px 12px' (e '5px 8px' quando isGameFocus) com fonte 0,8rem/0,7rem e nenhum min-height. O botão 'Enviar Print' (linha ~527) tem padding '10px' e também nenhum min-height.

**Correção:** .barra-jogo button, .missao__enviar { min-height: 44px; padding-inline: 12px } e, no modo paisagem, manter compacto sem descer de 40px: @media (orientation: landscape) and (max-height: 600px) { .barra-jogo button { min-height: 40px; padding: 6px 10px } } — a barra em paisagem hoje mede 35px de altura total, então ela precisa subir para ~48px, o que ainda deixa 342px de 390 para o emulador.

### 🟡 Média — Grade de jogos relacionados vira coluna única com card gigante em 320px

**Onde:** Sala de jogo · larguras 320 (única largura em que colapsa para 1 coluna)

**Evidência medida:** Em 320x568 o gridTemplateColumns computado é '280px' — 1 coluna — e cada card mede 280px de largura, bem acima da faixa aceitável de ~140 a ~230px. Os 4 cards ocupam 4 linhas. Para comparar: em 360 a mesma grade dá 2 colunas de 150px e em 390, 2 colunas de 165px.

**Causa:** src/pages/GameRoom.jsx:574-577 — gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' com gap de 20px. Em 320 a largura útil da grade é 280px e 2x150+20 = 320 > 280, então só cabe uma faixa, que estica para 280px.

**Correção:** .relacionados__grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px } — em 280px de largura útil isso dá 2 colunas de 134px, dentro da faixa, e não muda nada de 360 para cima.

### 🟡 Média — Botão de fechar e campo de arquivo do modal 'Enviar Print' bem abaixo do alvo de toque

**Onde:** Modal Enviar Print (sala de jogo) · larguras Todas: 320, 360, 390, 414, 600, 768, 900, 1024, 1280, 1440

**Evidência medida:** O botão X mede 24x27px em todas as larguras (em 320x568 fica em x=260, y=183,7). O <input type="file"> mede 21px de altura (218x21 em 320; 338x21 de 600 para cima). Ambos abaixo de 44px em qualquer eixo. A caixa do modal em si está correta: 280x232,6 em 320 e 400x232,6 de 600 para cima, sempre inteira dentro da janela (scrollHeight da caixa 231 = clientHeight, nada cortado), inclusive girando para 844x390 com o modal aberto (base em 311,3 contra 390 de janela).

**Causa:** src/pages/GameRoom.jsx:699-711 — o botão de fechar é position:absolute com background:none, border:none e nenhum padding, então herda só o tamanho do ícone <X size={24} />. E src/pages/GameRoom.jsx:733-739 — o input de arquivo recebe apenas width:100% e color, sem altura mínima.

**Correção:** .modal__fechar { position: absolute; top: 8px; right: 8px; width: 44px; height: 44px; display: grid; place-items: center; background: none; border: none } e .modal__arquivo { width: 100%; min-height: 44px; padding: 10px 0 }. A caixa tem 232,6px de altura e sobra de 167px em 320x568, então há espaço de sobra para o crescimento.

### 🟡 Média — Emulador ENCOLHE quando a janela cresce: 560px de largura em 600px de tela contra 384px em 1024px · ⛔ **fora do escopo (anúncio)**

**Onde:** Sala de jogo · larguras 768, 900 e 1024 (o vale); comparar com 600 e 1280

**Evidência medida:** Largura x altura do #tela-do-jogo medida: 600px de viewport → 560x420; 768 → 428x321; 900 → 560x420; 1024 → 384x288; 1280 → 640x480; 1440 → 800x600. Ou seja, ao passar de 600 para 1024px de janela o jogo perde 176px de largura e 132px de altura. Em 1024 o emulador ocupa 37,5% da largura da tela. Efeito colateral medido: a barra de controles, que cabe em 1 linha aos 600px (58px de altura), volta a 2 linhas em 768 (100px) e 1024 (102px).

**Causa:** src/pages/GameRoom.jsx:28 (isMobile = innerWidth < 768) liga o layout de 3 colunas já em 768px, e os dois <aside> de publicidade têm width fixo de 300px (src/pages/GameRoom.jsx:287 e 655). Em 1024 sobram 424px para o <main> (menos 40px de padding = 384 úteis). Em 768 e 900 o aside da direita nem cabe e quebra para o rodapé (y=1357,6 e y=1414,6).

**Correção:** Fora do escopo por ser dimensão de anúncio; a parte não-anúncio da correção é subir o ponto de virada para 3 colunas, de 768 para ~1200px: @media (max-width: 1199px) { .sala-de-jogo { flex-direction: column } .sala-de-jogo__aside { width: 100%; border: none } }. Assim 768, 900 e 1024 mantêm o emulador em largura cheia (728, 860 e 984px úteis) e a barra em 1 linha.

### 🔵 Baixa — Card de missão travado em 300px fixos numa coluna estreita entre 768 e 1024

**Onde:** Sala de jogo · larguras 768, 900 e 1024 (em 320-600 ele é 100% e em 1280/1440 fica corretamente ao lado da descrição)

**Evidência medida:** 768x1024: a linha flex mede 386px e o card de missão 300px fixos → ele quebra para a linha de baixo (y do card 622,2 contra 482 da descrição) e deixa 86px vazios à direita. 900x1200: linha 518px, card 300px → 218px vazios. 1024x768: linha 342px, card 300px → 42px vazios. Só em 1280 (linha 598px) e 1440 (linha 758px) os dois ficam lado a lado, com wrap=false.

**Causa:** src/pages/GameRoom.jsx:504 — width: isMobile ? '100%' : '300px', e isMobile é window.innerWidth < 768. Entre 768 e 1279 a coluna central não tem os 250+300+20 = 570px necessários para as duas colunas, mas o card já perdeu o '100%'.

**Correção:** Deixar o card fluido e só fixá-lo quando houver espaço real: .painel-missao { width: 100%; } @media (min-width: 1200px) { .painel-missao { width: 300px; flex: 0 0 300px } }. Em vez de amarrar a decisão a isMobile lido em JS, usar container/media query.

### 🔵 Baixa — Rótulos dos botões com 11,2px no modo paisagem

**Onde:** Sala de jogo — paisagem (isGameFocus) · larguras 844x390, 740x360 e 667x375

**Evidência medida:** font-size computado de 11,2px (0,7rem) nos cinco botões da barra — Sair, Salvar, Carregar, Reiniciar e Tela Cheia — medido nas três resoluções de paisagem. Nenhum outro texto da tela fica abaixo de 12px em nenhuma largura de retrato (a varredura por font-size < 12px voltou vazia em 320, 360, 390, 414, 600, 768, 900, 1024, 1280 e 1440).

**Causa:** src/pages/GameRoom.jsx:149 — fontSize: isGameFocus ? '0.7rem' : '0.8rem'.

**Correção:** fontSize: isGameFocus ? '0.75rem' : '0.8rem' (12px), ou em CSS .barra-jogo--compacta button { font-size: 0.75rem }. A barra tem 844px e os botões somam 378,7px, então há folga de sobra para o texto crescer sem gerar rolagem.

### 🔵 Baixa — Título e descrição vazam 12px da caixa de informações em 320px

**Onde:** Sala de jogo · larguras 320 (idêntico em atari-asteroids e snes-aladdin)

**Evidência medida:** Em 320x568 o bloco da descrição mede 250px e termina em x=291, enquanto o conteúdo do painel-pai termina em x=279 — 12px além. Visualmente o texto encosta a 8px da borda do card em vez dos 20px de padding. Não gera rolagem horizontal (document.scrollWidth = 320 = innerWidth), mas invade o padding do painel.

**Causa:** src/pages/GameRoom.jsx:461 — <div style={{ flex: 1, minWidth: '250px' }}>. Em 320 a largura útil dentro do painel é 238px, menor que o minWidth de 250px, e flex-basis mínimo não deixa o item encolher.

**Correção:** .painel-jogo__texto { flex: 1 1 250px; min-width: 0 } ou min-width: min(250px, 100%). Com min-width:0 o bloco encolhe para os 238px disponíveis e o padding de 20px do painel é preservado.

### 🔵 Baixa — Última linha da grade de relacionados sempre com 1 card sozinho quando dá 3 colunas

**Onde:** Sala de jogo · larguras 600, 900 e 1280

**Evidência medida:** 600x960 e 900x1200: 3 colunas de 173,3px com 4 cards → 2 linhas, sendo a segunda com 1 card só. 1280x800: 3 colunas de 200px com 4 cards → mesma sobra. Só em 1440 (4 colunas de 185px) a grade fecha em 1 linha; em 360-414 e 768/1024 (2 colunas) fecha em 2 linhas cheias.

**Causa:** src/pages/GameRoom.jsx:352-357 (useMemo relacionados) fixa quantos = Math.min(4, copia.length), enquanto a grade em src/pages/GameRoom.jsx:574-577 é auto-fill, ou seja, o número de colunas varia de 1 a 4 mas a lista tem sempre 4 itens.

**Correção:** Subir a lista para 6 itens — const quantos = Math.min(6, copia.length) — o que fecha exatamente 2 linhas em 3 colunas e 3 linhas em 2 colunas; ou, mantendo 4 itens, travar a grade em 2 ou 4 colunas: grid-template-columns: repeat(2, 1fr); @media (min-width: 1100px) { grid-template-columns: repeat(4, 1fr) }.

---

## Login, ranking e 404 — 11 problemas

> A migração para CSS não deixou nada catastrófico nas três telas: não há transbordo horizontal em nenhuma das 33 combinações medidas (scrollWidth == innerWidth em 320, 360, 390, 414, 600, 768, 900, 1024, 1280, 1440 e na paisagem 844x390), nenhum elemento se sobrepõe a outro, e a /pagina-que-nao-existe está limpa — cabe inteira na tela em todas as larguras, título sem estouro, botão de 212,2x44px. No login, os campos ficam confortáveis no celular (218x44px em 320, 288x44 em 390, sempre 44px de altura, com rótulo associado); o problema do login não é o campo e sim o que vem antes dele: o primeiro campo só aparece a 457,9px do topo em 320x568 e a 401,8px em paisagem 844x390, ou seja, fora da tela. A tabela do ranking não espreme o nome com os dados atuais (154,8px de coluna em 320, o suficiente para 'Player sem nome' em uma linha), mas a grade de 3 colunas tem um defeito real nas telas estreitas: o cabeçalho e as linhas de dados são grids independentes e resolvem as faixas fr de formas diferentes, deixando 'Jogador' 21,8px fora de eixo em 320 e os rótulos POSIÇÃO/JOGADOR colados com 0,5px de respiro. Um nome longo sem espaços ou uma pontuação de 6 dígitos ainda quebram a linha no celular (76px de conteúdo cortado em 320, altura da linha subindo de 59,8 para 88,6px) — não é hipótese, foi medido injetando os valores. Alvos de toque: só um falha, o botão fantasma 'Criar conta'/'Fazer login', com 102,6x34px em todas as larguras; texto abaixo de 12px: só a unidade 'XP' do ranking, com 11,2px. Nada aqui foi causado por anúncio — nenhuma das três telas tem slot de anúncio no DOM.

### 🔴 Alta — Botão de alternar login/cadastro tem 34px de altura, abaixo do mínimo de 44px

**Onde:** /login · larguras todas (320, 360, 390, 414, 600, 768, 900, 1024, 1280, 1440 e paisagem 844x390)

**Evidência medida:** button.btn.btn--fantasma.btn--compacto medido em 102,6 x 34,0px em todas as 11 combinações. Todo o resto da tela passa: campos 44px, botão Entrar 44px, seta de voltar 44x44.

**Causa:** src/styles/componentes.css:64 — .btn--compacto { min-height: 34px } combinado com a prop `compacto` em src/pages/Login.jsx:148 (Botao variante fantasma compacto). É o único alvo abaixo de 44px das três telas.

**Correção:** Tirar `compacto` desse botão em Login.jsx, ou garantir o alvo no dedo: @media (pointer: coarse) { .btn--compacto { min-height: var(--alvo-toque); } }

### 🔴 Alta — Cabeçalho da grade do ranking não alinha com as linhas de dados nas telas estreitas

**Onde:** /ranking · larguras 320, 360, 390 e 414 (o desalinho zera a partir de ~473px; medido 0 em 600, 768, 900, 1024, 1280, 1440 e 844x390)

**Evidência medida:** Em 320: célula 'Jogador' do cabeçalho começa em x=91,5 e os nomes dos jogadores em x=69,7 → 21,8px de diferença; colunas do cabeçalho 60,5/139,4/58,1 contra 38,7/154,8/64,5 nas linhas. Desalinho da coluna do nome: 21,8px (320), 15,8px (360), 11,3px (390), 7,7px (414). Coluna de pontos: 6,4 / 4,6 / 3,3 / 2,3px.

**Causa:** src/styles/paginas.css:129-136 e :192-197 — cada .ranking__linha é um grid independente com as mesmas faixas fr. O mínimo automático dos itens de grid (min-width:auto) força a 1ª coluna do cabeçalho a caber a palavra 'Posição' (min-content = 60,5px), enquanto nas linhas de dados a 1ª coluna só precisa do ícone/número, então as faixas fr são resolvidas com valores diferentes em cada linha.

**Correção:** Fixar as faixas para que não dependam do conteúdo, nas duas regras: .ranking__linha, .ranking__linha--cabecalho { grid-template-columns: 44px minmax(0,1fr) minmax(64px, max-content); column-gap: var(--esp-sm); } (no bloco @media (max-width:600px) use 36px na 1ª faixa). Com a 1ª faixa fixa, encurte o rótulo do cabeçalho em src/pages/Ranking.jsx de 'Posição' para '#' ou 'Pos.', senão a palavra volta a esticar a coluna.

### 🔴 Alta — Formulário de login começa fora da dobra: o primeiro campo aparece a 457,9px do topo

**Onde:** /login · larguras 320x568 e paisagem 844x390 (crítico); 360x640 no limite

**Evidência medida:** Topo do campo E-mail: 457,9px em 320x568 (81% da altura da tela) e 401,8px em 844x390 — nesse caso, fora do viewport de 390px, ou seja, o usuário abre /login em celular deitado e não vê nenhum campo. Botão 'Entrar' em y=600,1 com viewport de 568 (fora da dobra) e em y=544 com viewport de 390. O bloco .login__instrucoes sozinho ocupa 210,1px em 320 e 154px em paisagem; a marca redonda tem 60px e a caixa 30px de padding.

**Causa:** src/styles/paginas.css:263-291 (.login__instrucoes com os 3 itens sempre abertos), :242-252 (.login__marca 60x60 + margem) e :215-228 (.login__caixa padding var(--esp-xl) = 30px). Nenhuma dessas medidas muda por media query.

**Correção:** @media (max-height: 700px), (max-width: 360px) { .login__marca { width: 44px; height: 44px; } .login__caixa { padding: var(--esp-md); gap: var(--esp-sm); } .login__instrucoes { display: none; } } — ou transformar o bloco de instruções num <details> recolhido, mantendo o texto acessível sem empurrar o formulário.

### 🟡 Média — Os rótulos POSIÇÃO e JOGADOR ficam colados no cabeçalho do celular

**Onde:** /ranking · larguras 320, 360, 390, 414

**Evidência medida:** Em 320 a célula 'Posição' termina em x=91,5 e a célula 'Jogador' começa exatamente em x=91,5; o texto ocupa 60px numa célula de 60,5px → 0,5px de respiro entre as duas palavras. No screenshot em 320px lê-se 'POSIÇÃOJOGADOR' como uma palavra só.

**Causa:** src/styles/paginas.css:192-197 — a grade não tem column-gap e a 1ª faixa é espremida até o min-content do rótulo (mesma causa raiz do desalinho).

**Correção:** Adicionar column-gap: var(--esp-sm) em .ranking__linha (src/styles/paginas.css:129) e encurtar o rótulo para '#' / 'Pos.' no celular.

### 🟡 Média — Nome de jogador longo sem espaços estoura a linha e é cortado pelo overflow:hidden da tabela

**Onde:** /ranking · larguras 320 (76px cortados), 360 (36px), 390 (6px); sem corte de 414 para cima

**Evidência medida:** Teste com o nome injetado 'MegaSuperJogadorBrasileiro1998' (30 caracteres, formato plausível de nick — o banco local só tem nomes curtos: 'Reve', 'ms', 'Player sem nome'). Em 320 as faixas viram 24px / 291,45px / 33,73px: o nome termina em x=346,5 contra a borda da linha em x=304 (42,5px para fora) e .ranking__tabela fica com scrollWidth 364 contra clientWidth 288 → 76px de conteúdo cortado sem barra de rolagem. A coluna de pontos é espremida de 64,5 para 33,7px e '500 XP' quebra em duas linhas (altura da linha de 59,8 para 88,6px). O documento não transborda justamente porque a tabela corta (scrollWidth do documento continua 320).

**Causa:** src/styles/paginas.css:131 e :195 (faixas fr sem minmax(0,...) → itens de grid com min-width:auto) somado a src/styles/paginas.css:121-127 (.ranking__tabela { overflow: hidden }), que esconde o estouro em vez de expor.

**Correção:** .ranking__linha, .ranking__linha--cabecalho { grid-template-columns: 44px minmax(0,1fr) minmax(64px,max-content); } e .ranking__jogador { min-width: 0; overflow-wrap: anywhere; }

### 🟡 Média — Pontuação de 6 dígitos quebra a coluna de pontos em duas linhas

**Onde:** /ranking · larguras 320, 360, 390 (em 414 e acima continua em uma linha)

**Evidência medida:** Trocando os pontos por 128450 (os dados atuais só têm '500'), a célula .ranking__pontos vai de 28,8 para 57,6px de altura e a linha de 59,8 para 88,6px em 320, 360 e 390. Coluna de pontos disponível: 64,5px (320), 74,5px (360), 82px (390) contra 88px em 414, onde já cabe.

**Causa:** src/styles/paginas.css:176-190 — .ranking__pontos com font-size 1.2rem (19,2px) e o 'XP' como span inline dentro da mesma célula, numa faixa de 1fr que no celular vale ~65-82px.

**Correção:** .ranking__pontos { white-space: nowrap; } e, no @media (max-width:600px), font-size: 1rem; além de dar à faixa de pontos um mínimo próprio: minmax(64px, max-content).

### 🟡 Média — Cabeçalho do ranking empurra a primeira linha para fora da tela em celular deitado

**Onde:** /ranking · larguras paisagem 844x390 (zero linhas visíveis) e 320x568 (3 linhas visíveis)

**Evidência medida:** Topo da primeira linha de jogador: y=405 com viewport de 390px em 844x390 → nenhuma linha visível sem rolar; y=386,2 em 320x568 → cabem 3 linhas de 59,8px. Em 844x390 o .casca volta ao padding de 40px (contra 20px em <=768) e o troféu tem 60x60 + margin-bottom de 50px do .ranking__cabecalho.

**Causa:** src/styles/componentes.css:142-147 e :175-179 — o media query da casca é só por largura (max-width:768px), então um celular deitado de 844px recebe o padding de desktop; src/styles/paginas.css:99-103 (.ranking__cabecalho { margin-bottom: 50px }) e :116-119 (troféu 60px) também não mudam no celular.

**Correção:** @media (max-height: 500px) { .casca { padding: var(--esp-md); } .ranking__cabecalho { margin-bottom: var(--esp-md); } .ranking__trofeu { width: 36px; height: 36px; } } e reduzir .ranking__cabecalho { margin-bottom: var(--esp-lg) } dentro do @media (max-width: 600px) já existente.

### 🔵 Baixa — Texto abaixo de 12px: a unidade XP do ranking

**Onde:** /ranking · larguras todas as 11 combinações medidas (320 a 1440 e 844x390)

**Evidência medida:** span.ranking__unidade com font-size computado de 11,2px, 50 ocorrências por página (uma por jogador). É o único texto abaixo de 12px das três telas — login (mínimo 12,48px na lista de instruções) e 404 (mínimo 14,4px) passam.

**Causa:** src/styles/paginas.css:187-190 — .ranking__unidade { font-size: 0.7rem }

**Correção:** .ranking__unidade { font-size: 0.75rem; } (12px)

### 🔵 Baixa — Número da posição sai da própria caixa a partir do 10º colocado

**Onde:** /ranking · larguras todas as larguras medidas

**Evidência medida:** span.ranking__numero com width computada de 24px e scrollWidth de 29px para '#10' a '#50' — 2,5px de texto para fora de cada lado da caixa, o que também desalinha os números em relação à coroa e às medalhas dos três primeiros. Sem corte visível porque a coluna pai tem 38,7px (320) a 124,7px (1440).

**Causa:** src/styles/paginas.css:160-165 — .ranking__numero { width: 24px } com text-align center, dimensionado para um dígito.

**Correção:** .ranking__numero { min-width: 24px; width: auto; padding: 0 2px; }

### 🔵 Baixa — Campos de login com 15,2px e viewport que proíbe zoom

**Onde:** /login · larguras todas (o meta viewport vale para as três telas)

**Evidência medida:** input.campo__entrada com font-size computado de 15,2px em todas as larguras (abaixo dos 16px que o Safari do iOS usa como limiar para dar zoom automático ao focar). Meta lida do DOM: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover' — o usuário não consegue ampliar nenhuma das três telas.

**Causa:** src/styles/componentes.css:101-111 (.campo__entrada { font-size: 0.95rem }) e index.html:20-23 (maximum-scale=1.0, user-scalable=no).

**Correção:** .campo__entrada { font-size: 1rem; } e remover maximum-scale=1.0, user-scalable=no do meta viewport em index.html.

### 🔵 Baixa — Área clicável do link 'Voltar' ocupa a largura inteira do conteúdo

**Onde:** /ranking · larguras todas (290px em 320, 330px em 360, 570px em 600, 800px de 900 para cima)

**Evidência medida:** a.link-voltar medido com 290x44 em 320 e 800x44 em 1280/1440, enquanto o texto 'Voltar para a Home' ocupa cerca de 180px — o restante da faixa é clicável mas parece vazio. Altura de 44px está correta.

**Causa:** src/styles/componentes.css:128-136 (.link-voltar é inline-flex) dentro de src/styles/componentes.css:151-157 (.casca__conteudo é flex column, align-items default stretch), o que estica o link.

**Correção:** .link-voltar { align-self: flex-start; }

---

## Painel do GM — 11 problemas

> O painel do GM está partido em dois: /admin-dashboard e /admin-desafios, já migradas para CSS, passaram limpas em todas as dez larguras mais a paisagem 844x390 — zero transbordo horizontal, zero fonte abaixo de 12px, grades que se reorganizam, e só dois defeitos leves (o botão .btn--compacto com 34px de altura e a grade de atalhos que cai para uma coluna em 600px por falta de 10px). As quatro telas ainda em estilo inline não têm uma única media query e concentram todos os problemas graves. O mais sério é /admin-usuarios: o wrapper da tabela usa overflow:hidden, então em 320px 409px da tabela ficam permanentemente cortados e as colunas Editar Pontos, Cargo e Ações — ou seja, tudo que a tela existe para fazer — são inalcançáveis por toque até 600px de largura. /admin-gerenciar-jogos acertou o overflowX:auto, mas com 7 colunas e 825px de largura mínima só a coluna Capa cabe em 320px, e seu cabeçalho flex sem wrap quebra título e botão em 3 linhas cada. Há dois transbordos horizontais reais: 45px em /painel-admin-jogos a 320px, causado pelos input[type=file] de 278px intrínsecos, e 62px em /admin-missoes a 320px quando há prints pendentes (medido com resposta simulada, porque o banco local está sem missões). O padding fixo de 40px dessas quatro telas custa 50px de conteúdo por viewport comparado às migradas, e em /painel-admin-jogos empurra os campos de texto para 178px em uma tela de 320px. Nada aqui é causado por anúncio: as seis rotas de admin não renderizam nenhum slot, e a altura de cromo é saudável em todas (o primeiro título aparece entre 81,6px e 112,6px do topo, sempre dentro da primeira dobra). O caminho mais curto para a maior parte disso já está pronto no repositório: os componentes CascaDePagina, Tabela (com .tabela-casca { overflow-x: auto }, hoje sem nenhum uso), Campo e Botao resolvem sozinhos o padding, o corte da tabela e os alvos de toque.

### 🔴 Alta — Tabela de /admin-usuarios é cortada por overflow:hidden — três colunas ficam inacessíveis no celular

**Onde:** /admin-usuarios · larguras 320, 360, 390, 414 e 600 (resolve sozinho a partir de 768)

**Evidência medida:** Em 320px: casca da tabela com clientWidth 238px e scrollWidth 647px → 409px cortados. As colunas 'Editar Pontos' (começa em 330px), 'Cargo' (478px) e 'Ações' (563px) estão inteiramente fora da área visível. O input de pontos fica em left=386px e o botão Salvar em left=476px, ambos além da janela de 320px. Em 414: 315px cortados. Em 600: 129px cortados, com o botão de promover/rebaixar (left=619,7px) invisível. Teste de rolagem: atribuir scrollLeft=999 move para 409, ou seja o conteúdo existe, mas com overflow:hidden o usuário não consegue arrastar — não há barra nem gesto de toque que alcance.

**Causa:** src/pages/AdminUsuarios.jsx:96-107, o wrapper da tabela usa `overflow: 'hidden'` (linha 102) só para arredondar as bordas; a tabela tem `width: 100%` mas largura mínima de conteúdo de 647px por causa das 5 colunas com padding de 15px, input e botões dentro.

**Correção:** Trocar `overflow: 'hidden'` por `overflowX: 'auto'` no wrapper. Melhor ainda: usar o componente <Tabela> de src/components/ui/Tabela.jsx, que já existe, já embrulha em .tabela-casca { overflow-x: auto } e .tabela { min-width: 560px } — e hoje não é usado por nenhuma tela.

### 🔴 Alta — input[type=file] de /painel-admin-jogos estoura a caixa de upload e a própria página

**Onde:** /painel-admin-jogos · larguras transbordo da janela em 320 e 360; caixa tracejada estourada em 320, 360, 390 e 414

**Evidência medida:** Em 320px: documentElement.scrollWidth 365 vs innerWidth 320 = 45px de transbordo horizontal; os dois input[type=file] vão de left=87px a right=365px (largura intrínseca 278px). Em 360px: 365 vs 360 = 5px. A caixa tracejada que os contém tem clientWidth 176px (320), 216px (360), 246px (390) e 270px (414) contra scrollWidth de 293px — o controle 'Escolher arquivo / Nenhum arquivo selecionado' atravessa a borda tracejada em todas essas larguras.

**Causa:** src/pages/AdminJogos.jsx:236-254 — os dois inputs de arquivo não recebem nenhum estilo; `uploadBoxStyle` (linha 292) não define overflow nem largura. O controle nativo de arquivo tem largura intrínseca fixa de ~278px e não encolhe.

**Correção:** Dar largura controlada ao input: `input[type=file] { width: 100%; max-width: 100%; }` (ou style={{width:'100%'}} nos dois inputs das linhas 239 e 249). Em CSS, junto com `.upload-caixa { overflow: hidden }` como rede de segurança.

### 🔴 Alta — Cartão de missão de /admin-missoes transborda a janela quando há prints pendentes

**Onde:** /admin-missoes · larguras 320 e 360 transbordam a janela; 390 e 414 estouram a borda do cartão

**Evidência medida:** Com dois prints pendentes (resposta do Supabase simulada, já que o banco local está vazio): em 320px documentElement.scrollWidth 382 vs 320 = 62px de transbordo — a pílula com o nome do jogo termina em right=381,9px e o span 'pontos' em right=362,9px (42,9px de excesso). Em 360px: 382 vs 360 = 22px. Em 390px não há transbordo da janela, mas a linha 'Recompensa' tem clientWidth 268 e scrollWidth 302 (34px de conteúdo fora da caixa, ~14px além da borda do cartão); em 414 a mesma linha mede 292 vs 302.

**Causa:** src/pages/AdminMissoes.jsx:155-181 (linha do cabeçalho do cartão: display flex com justifyContent space-between, sem flexWrap, e a pílula do jogo com padding fixo e sem min-width:0) e AdminMissoes.jsx:201-230 (linha de recompensa: flex com gap 15px contendo ícone + rótulo + input de `width: '100px'` fixo + a palavra 'pontos', também sem flexWrap).

**Correção:** Nas duas linhas, acrescentar `flex-wrap: wrap` e `min-width: 0` nos filhos de texto; trocar o `width: '100px'` do input por `flex: 1 1 90px; min-width: 0`. O nome do jogo precisa de `overflow-wrap: anywhere`.

### 🟡 Média — Botões de decisão de /admin-missoes espremidos em grade 1fr/1.5fr no celular

**Onde:** /admin-missoes · larguras 320 e 360

**Evidência medida:** Em 320px a grade resolve para colunas de 90,9375px e 100,766px: 'REJEITAR PRINT' fica com 90,9x69px e 'APROVAR E DEPOSITAR' com 100,8x69px — os dois rótulos quebram em 3 linhas. Em 360px: 90,9x56px e 132,1x56px, ainda 2 linhas cada. Só a partir de 600px os botões ficam em uma linha (41px de altura).

**Causa:** src/pages/AdminMissoes.jsx:233-237 — `gridTemplateColumns: '1fr 1.5fr'` fixo, sem nenhuma media query (o arquivo inteiro é estilo inline).

**Correção:** Uma coluna abaixo de 480px: `.missao__acoes { display: grid; grid-template-columns: 1fr; gap: 15px } @media (min-width: 480px) { .missao__acoes { grid-template-columns: 1fr 1.5fr } }`

### 🟡 Média — Padding fixo de 40px nas quatro telas não migradas rouba um quarto da largura do celular

**Onde:** /admin-usuarios, /admin-missoes, /painel-admin-jogos, /admin-gerenciar-jogos · larguras 320, 360, 390, 414 (todas as larguras abaixo de 768)

**Evidência medida:** Em 320px as quatro telas dão 240px de conteúdo útil (padding computado 40px de cada lado = 80px, 25% da tela). As duas telas já migradas, no mesmo viewport, dão 290px, porque .casca cai para `padding: 20px 15px` na media query de max-width 768 (src/styles/componentes.css). São 50px a mais de conteúdo, +20,8%. Em /painel-admin-jogos o efeito acumula com o padding de 30px do card: os campos de texto ficam com 178px de largura em 320px de tela — 55,6% do viewport é campo, 44,4% é padding e borda.

**Causa:** `padding: '40px'` inline em AdminUsuarios.jsx:68, AdminMissoes.jsx:84, AdminJogos.jsx:128 e AdminGerenciarJogos.jsx:140 (containerStyle). Nenhum desses arquivos tem uma única media query — só as duas telas migradas têm.

**Correção:** Migrar as quatro para <CascaDePagina>, que já resolve isso. Enquanto não migra: `@media (max-width: 768px) { .tela-admin { padding: 20px 15px } .tela-admin__card { padding: 20px } }` — mas o padding só sai de fato quando o estilo inline sair, porque inline vence CSS.

### 🟡 Média — Cabeçalho de /admin-gerenciar-jogos é flex sem wrap: título e botão quebram em 3 linhas cada

**Onde:** /admin-gerenciar-jogos · larguras 320, 360, 390, 414 (normaliza em 600)

**Evidência medida:** Em 320px o cabeçalho mede 108px de altura: o h2 'Gerenciar Acervo de Jogos' fica com 133,6px de largura em 3 linhas e o link '+ Adicionar Novo' com 106,4x84,8px, também em 3 linhas. Em 360px idem (108px). Em 390px: 84,8px, 2 linhas. Em 414px: 72px. Em 600px e acima: 41,6px, uma linha só. O flexWrap computado é 'nowrap' em todas.

**Causa:** src/pages/AdminGerenciarJogos.jsx:153 — `const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }`, sem flexWrap e sem gap.

**Correção:** `flexWrap: 'wrap', gap: '15px'` no headerStyle, e `whiteSpace: 'nowrap'` no botão para ele não quebrar depois de descer de linha.

### 🟡 Média — Tabela de 7 colunas de /admin-gerenciar-jogos exige arrastar 587px no celular para ver o nome do jogo

**Onde:** /admin-gerenciar-jogos · larguras 320 a 900 (cabe inteira só a partir de 1024)

**Evidência medida:** Largura mínima da tabela: 825px em todas as larguras até 900px. Em 320px a casca tem clientWidth 238px → 587px escondidos (a rolagem funciona: overflowX computado 'auto', scrollLeft chega a 587). Só a coluna 'Capa' (67,1px) cabe; 'Nome' começa em 312,7px, ou seja é preciso arrastar antes de saber de que jogo é a linha. Em 600px: 307px escondidos; 768px: 139px; 900px: 7px. A coluna 'ID' fica com 245,6px — mais larga que 'Nome' (118,8px) — até 900px.

**Causa:** src/pages/AdminGerenciarJogos.jsx:157 (tableWrapper com overflowX auto, correto) somado a 7 colunas com padding de 15px cada (thStyle/tdStyle, linhas 161-162) e nenhuma media query para esconder colunas secundárias.

**Correção:** Abaixo de 768px, esconder ID, Ano e Fabricante (`@media (max-width: 767px) { .acervo th:nth-child(2), .acervo td:nth-child(2), ... { display: none } }`) e reduzir o padding das células para 10px; ou trocar a tabela por lista de cards no celular. Manter a primeira coluna útil (Nome) com `position: sticky; left: 0`.

### 🟡 Média — Alvos de toque abaixo de 44px em todas as telas não migradas — e no botão compacto da migrada

**Onde:** /admin-usuarios, /admin-gerenciar-jogos, /painel-admin-jogos, /admin-missoes, /admin-desafios · larguras todas as larguras medidas (320 a 1440 e paisagem 844x390)

**Evidência medida:** Link 'Voltar': 21,6px de altura em /admin-gerenciar-jogos, /painel-admin-jogos e /admin-missoes, e 24px em /admin-usuarios — contra 44px do .link-voltar das telas migradas. /admin-usuarios em 360px: input de pontos 80x27px, botão Salvar 28x28px, botão de cargo 20x23px, totalizando 553 elementos clicáveis abaixo de 44px na página. /admin-gerenciar-jogos: botões Editar e Deletar 32x32px, campo de busca com 18px de altura (o container de 44px não é <label>, então tocar no padding não foca o campo) — 268 alvos abaixo de 44px. /painel-admin-jogos: os dois inputs de arquivo com 21px de altura. /admin-missoes: input de pontos 100x33px. /admin-desafios (já migrada): 3 botões .btn--perigo.btn--compacto com 50x34px.

**Causa:** Estilos inline com padding de 5-6px e sem min-height: AdminUsuarios.jsx:211-228 (inputPontosStyle, btnSaveStyle), AdminGerenciarJogos.jsx:156 (inputBusca sem padding próprio) e 165-168 (btnEdit/btnTrash/btnSave/btnCancel com padding 6px). Na tela migrada, .btn--compacto define `min-height: 34px` em src/styles/componentes.css.

**Correção:** `min-height: 44px; min-width: 44px` nos controles de linha de tabela (usar a variável --alvo-toque que já existe em tokens.css); no campo de busca, mover o padding do container para o próprio input ou envolver em <label>. Para .btn--compacto: `@media (pointer: coarse) { .btn--compacto { min-height: 44px } }`.

### 🔵 Baixa — Campos de formulário com 13,33px nas telas não migradas provocam zoom automático no iOS

**Onde:** /painel-admin-jogos, /admin-missoes, /admin-usuarios · larguras todas, mas o efeito de zoom só incomoda no celular (320 a 414)

**Evidência medida:** font-size computado de 13,3333px em todos os input, select e textarea de /painel-admin-jogos (inputStyle não declara font-size, então cai no padrão do agente de usuário), no input de pontos de /admin-missoes e no input de pontos de /admin-usuarios. O Safari do iOS dá zoom ao focar campo com fonte abaixo de 16px. Nenhum texto de leitura ficou abaixo de 12px em nenhuma tela ou largura — o menor medido foi exatamente 12px (e-mail em /admin-usuarios e cabeçalho de tabela em /admin-gerenciar-jogos), então o critério de 'texto pequeno demais' não foi violado.

**Causa:** src/pages/AdminJogos.jsx:283-290 (inputStyle sem font-size), AdminMissoes.jsx:216-224 e AdminUsuarios.jsx:211-218. As telas migradas usam .campo__entrada com 0,95rem = 15,2px — melhor, mas ainda abaixo de 16px.

**Correção:** `font-size: 16px` (1rem) em todos os campos; em .campo__entrada, trocar 0.95rem por 1rem.

### 🔵 Baixa — Grade de atalhos do painel cai para uma coluna em 600px por falta de 10px

**Onde:** /admin-dashboard · larguras 600 (e toda a faixa de ~561 a 619px)

**Evidência medida:** Em 600px a .grade-cartoes resolve para 1 coluna de 570px: os 6 cartões de atalho ficam com 570px de largura para 3 linhas de texto cada, e a página passa a ter 1768px de altura (contra 1090px em 768px). Cabem 2 colunas com 280px mínimos apenas a partir de 580px de área útil (2×280 + 20 de gap), e a área útil em 600px é exatamente 570px — faltam 10px. A .painel__numeros, com minmax(200px,1fr), já faz 2 colunas de 275px na mesma largura, deixando a última linha com 1 item de 2.

**Causa:** src/styles/paginas.css / .grade-cartoes em src/styles/componentes.css: `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))` com gap de var(--esp-lg)=20px.

**Correção:** `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))` na .grade-cartoes — com 260px, 600px de tela já dá 2 colunas de 275px.

### 🔵 Baixa — Campos de texto gigantes nas telas de formulário em larguras médias

**Onde:** /admin-desafios, /admin-usuarios · larguras 768, 844x390 e 900 em /admin-desafios; 1280 e 1440 em /admin-usuarios

**Evidência medida:** /admin-desafios: a .admin__duas-colunas só vira 2 colunas acima de 900px (media query max-width:900), então em 768px o campo de uma linha 'Nome do desafio' fica com 696px de largura, em 844x390 com 762px e em 900px com 818px — para um campo que recebe uma frase curta, e o campo numérico 'Recompensa em pontos' fica do mesmo tamanho. /admin-usuarios: a tabela não tem max-width, então em 1440px a coluna 'Nickname' fica com 509,2px só para apelido + e-mail.

**Causa:** src/styles/paginas.css:932-935 (breakpoint da .admin__duas-colunas em 900px) e ausência de max-width no formulário; em AdminUsuarios.jsx:63-72 o container não tem maxWidth nem margin auto, ao contrário de AdminMissoes (800px) e AdminGerenciarJogos (1200px).

**Correção:** Baixar o breakpoint da .admin__duas-colunas para 720px e limitar campos de valor curto (`.campo--curto { max-width: 220px }` para o de pontos). Em /admin-usuarios, envolver com o mesmo maxWidth das outras telas (1200px) ou migrar para <CascaDePagina largura="total">.

