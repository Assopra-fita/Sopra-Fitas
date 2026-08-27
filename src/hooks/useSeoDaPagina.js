import { useEffect } from 'react';
import { TITULO_PADRAO, DESCRICAO_PADRAO } from '../lib/seo';

const PADRAO_IMAGEM = 'https://assoprafitas.com/og-imagem.jpg';
const PADRAO_CANONICAL = 'https://assoprafitas.com/';

// Escreve ou reescreve uma tag do <head>. Cria se não existir, para funcionar
// mesmo numa página que veio sem ela.
const definir = (seletor, criar, atributo, valor) => {
  let tag = document.head.querySelector(seletor);
  if (!tag) {
    tag = criar();
    document.head.appendChild(tag);
  }
  tag.setAttribute(atributo, valor);
};

const criarCanonical = () => {
  const l = document.createElement('link');
  l.rel = 'canonical';
  return l;
};

const meta = (nome, valor, porPropriedade = false) =>
  definir(
    porPropriedade ? `meta[property="${nome}"]` : `meta[name="${nome}"]`,
    () => {
      const t = document.createElement('meta');
      t.setAttribute(porPropriedade ? 'property' : 'name', nome);
      return t;
    },
    'content',
    valor
  );

// Título, descrição, endereço canônico e prévia de compartilhamento da rota.
//
// Numa SPA o <head> do index.html vale para todas as rotas: sem isto, cada
// página de jogo se anunciava como sendo a Home. O canonical era o pior deles,
// porque é uma instrução direta ao buscador dizendo que a página é duplicata
// de outra.
//
// ATENÇÃO: isto roda no navegador. O Google executa JavaScript e enxerga o
// resultado, mas WhatsApp, Facebook e X não executam — para a prévia do link
// funcionar neles, a tag precisa vir no HTML já servido. É o que o
// scripts/gerar-paginas.mjs resolve, gerando um HTML por jogo no build.
export const useSeoDaPagina = ({
  titulo,
  descricao,
  canonical,
  imagem,
  naoIndexar = false,
} = {}) => {
  useEffect(() => {
    const t = titulo ?? TITULO_PADRAO;
    const d = descricao ?? DESCRICAO_PADRAO;
    const c = canonical ?? 'https://assoprafitas.com/';
    const i = imagem ?? PADRAO_IMAGEM;

    document.title = t;
    meta('description', d);
    definir('link[rel="canonical"]', criarCanonical, 'href', c);

    meta('og:title', t, true);
    meta('og:description', d, true);
    meta('og:url', c, true);
    meta('og:image', i, true);
    meta('twitter:title', t);
    meta('twitter:description', d);
    meta('twitter:image', i);

    // Endereço de jogo que não existe não deve entrar no índice. `follow` para
    // o buscador ainda seguir os links de saída da tela de erro.
    meta('robots', naoIndexar ? 'noindex, follow' : 'index, follow');

    // Uma tela que não declara SEO herda o que a anterior deixou: navegar de um
    // jogo para o perfil deixava lá o canonical do jogo. A limpeza devolve o
    // padrão da Home ao sair.
    return () => {
      document.title = TITULO_PADRAO;
      meta('description', DESCRICAO_PADRAO);
      definir('link[rel="canonical"]', criarCanonical, 'href', PADRAO_CANONICAL);
      meta('og:title', TITULO_PADRAO, true);
      meta('og:description', DESCRICAO_PADRAO, true);
      meta('og:url', PADRAO_CANONICAL, true);
      meta('og:image', PADRAO_IMAGEM, true);
      meta('twitter:title', TITULO_PADRAO);
      meta('twitter:description', DESCRICAO_PADRAO);
      meta('twitter:image', PADRAO_IMAGEM);
      meta('robots', 'index, follow');
    };
  }, [titulo, descricao, canonical, imagem, naoIndexar]);
};
