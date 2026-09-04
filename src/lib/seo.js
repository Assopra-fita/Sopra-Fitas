import { romEhImagem } from './rom.js';	// com .js: seo.js também é importado pelos scripts de build, que rodam no Node
const SITE = 'https://assoprafitas.com';

// O nome da marca mora aqui e em mais nenhum lugar do JavaScript. Ele
// aparecia escrito à mão em 10 arquivos, e trocar exigia caçar um por um.
//
// O DOMÍNIO é outra coisa e não acompanha: `assoprafitas.com` continua sendo o
// endereço enquanto o novo não é registrado. Nome e endereço divergirem por um
// tempo é normal; o que não pode é o canonical apontar para domínio que não
// existe.
export const MARCA = 'Sopra Fitas';

// Onde o Google costuma cortar a exibição do título.
const LIMITE_DO_TITULO = 60;

export const TITULO_PADRAO = `${MARCA} — Jogos clássicos no navegador`;
export const DESCRICAO_PADRAO =
  'Jogue os clássicos de Super Nintendo, Mega Drive, Game Boy e mais direto no navegador, sem instalar nada.';

// Dois nomes por console, e é de propósito:
//
// - `curto` vai no título, onde o espaço é caro. O Google mostra cerca de 60
//   caracteres e corta o resto, então "SNES" no lugar de "Super Nintendo"
//   devolve 7 caracteres para o nome do jogo, que é o que a pessoa procurou.
// - `longo` vai na descrição, onde cabe e soa melhor em português.
//
// Quem procura busca pelos dois, então cada um aparece onde rende mais.
const CONSOLES = {
  SNES: { curto: 'SNES', longo: 'Super Nintendo' },
  'MASTER SYSTEM': { curto: 'Master System', longo: 'Master System' },
  'MEGA DRIVE': { curto: 'Mega Drive', longo: 'Mega Drive' },
  NES: { curto: 'NES', longo: 'Nintendo' },
  GBA: { curto: 'GBA', longo: 'Game Boy Advance' },
  'GAME BOY': { curto: 'Game Boy', longo: 'Game Boy' },
  'NINTENDO 64': { curto: 'N64', longo: 'Nintendo 64' },
  ATARI: { curto: 'Atari', longo: 'Atari 2600' },
};

// O texto de uma página de jogo, num lugar só: a tela usa para preencher as
// tags no navegador e o gerador de páginas estáticas usa para escrever o HTML
// que vai no deploy. Se os dois divergirem, o robô vê uma coisa e o visitante
// outra.
export const seoDoJogo = (jogo, consoleCanonico) => {
  const nomes = CONSOLES[consoleCanonico];
  const curto = nomes?.curto ?? consoleCanonico ?? '';
  const longo = nomes?.longo ?? consoleCanonico ?? '';

  // O Google mostra cerca de 60 caracteres do título e corta o resto. Em nome
  // de jogo comprido, a marca no fim seria justamente o pedaço cortado — então
  // ela sai, e o espaço fica para o nome, que é o que a pessoa digitou.
  const semMarca = curto
    ? `Jogar ${jogo.nome} Online - ${curto}`
    : `Jogar ${jogo.nome} Online`;
  const comMarca = `${semMarca} | ${MARCA}`;

  return {
    titulo: comMarca.length > LIMITE_DO_TITULO ? semMarca : comMarca,
    descricao: longo
      ? `Jogue ${jogo.nome} de ${longo} online direto no navegador. Reviva esse clássico no ${MARCA}.`
      : `Jogue ${jogo.nome} online direto no navegador, sem instalar nada, no ${MARCA}.`,
    canonical: `${SITE}/jogar/${jogo.id}`,
    imagem: jogo.capa_url?.startsWith('http')
      ? jogo.capa_url
      : `${SITE}${jogo.capa_url ?? '/og-imagem.jpg'}`,

    // Jogo com imagem no campo da ROM sai do índice. A página existe e explica
    // o que houve, mas mandar o buscador anunciar "Jogar Axelay Online" para
    // uma tela que não abre é pior que não ter a página: gasta orçamento de
    // rastreio e traz gente para uma decepção. Volta ao índice sozinho quando
    // alguém subir a ROM certa pelo painel.
    naoIndexar: romEhImagem(jogo.rom_url),
  };
};

export const seoPadrao = (caminho = '/') => ({
  titulo: TITULO_PADRAO,
  descricao: DESCRICAO_PADRAO,
  canonical: `${SITE}${caminho}`,
  imagem: `${SITE}/og-imagem.jpg`,
});

// As outras rotas públicas também são função, e não texto escrito em dois
// lugares: era assim que a marca antiga sobreviveu no HTML servido de /ranking
// e /login enquanto a tela já mostrava a nova.
export const seoDoRanking = () => ({
  ...seoPadrao('/ranking'),
  titulo: `Ranking global — ${MARCA}`,
  descricao: `Veja quem mais pontuou no ${MARCA} jogando os clássicos direto no navegador.`,
});

export const seoDoLogin = () => ({
  ...seoPadrao('/login'),
  titulo: `Entrar — ${MARCA}`,
});

// A página de um jogo que não existe. Sem isto ela herdava título, descrição e
// canonical da Home, ou seja, se anunciava ao buscador como sendo a Home.
export const seoDeJogoInexistente = (id) => ({
  titulo: `Jogo não encontrado — ${MARCA}`,
  descricao: DESCRICAO_PADRAO,
  canonical: `${SITE}/jogar/${id}`,
  imagem: `${SITE}/og-imagem.jpg`,
  naoIndexar: true,
});
