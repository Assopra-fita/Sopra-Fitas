// Entrega das capas pelo redimensionador do Supabase Storage.
//
// O PROBLEMA MEDIDO (PageSpeed, 15/09, Moto G Power em 4G lento): a Home
// baixava 2.115 KiB só de capa. A pior, `show-do-milhao-capa.jpg`, são 551 KiB
// de uma imagem 1427x2000 para caber numa caixa de 93x130 — 300 vezes mais
// pixel do que a tela usa. O acervo inteiro está assim porque o painel sobe o
// arquivo como veio, e ninguém redimensiona nada.
//
// O Storage tem um endpoint de transformação ligado neste projeto. Trocar
// `/object/public/` por `/render/image/public/` e pedir o tamanho certo.
//
// Medido no site no ar, celular a dpr 1,75, nas 12 capas da primeira página:
//
//   as 12 capas          2.119,8 KiB  ->  199,3 KiB   (10,6x)
//   imagem da página     2.144,3 KiB  ->  225,7 KiB   (89,5%)
//   show-do-milhao         551,5 KiB  ->   11,7 KiB
//   as 128 capas do acervo inteiro, somadas: 2.381 KiB, média de 18,6 KiB
//
// Ver a Home INTEIRA hoje custa quase o mesmo que UMA página custava antes.
//
// (Uma primeira versão deste comentário dizia 98 KiB. Era a soma de SEIS
// capas comparada contra o total de DOZE — metade do número contra o dobro da
// amostra. O ganho verdadeiro é 199 KiB, e continua sendo 10 vezes.)
//
// POR QUE ESTES NÚMEROS. A caixa da capa tem largura de no máximo ~300 CSS px
// (o card mais largo do desktop) e altura fixa de 130 a 160 px, com
// `object-fit: contain` — ou seja, a imagem é encaixada dentro, sem corte.
//
// Para capa em pé, que é a maioria, quem limita é a ALTURA: 160 CSS px viram
// 320 px de tela em aparelho 2x. Para capa deitada, quem limita é a largura:
// 300 CSS px viram 600. Daí `600x320`, que cobre os dois casos.
//
// Medido que subir de 400 para 600 de largura custa 3 KiB no total das seis —
// a altura é que manda no tamanho do arquivo, então não vale economizar ali e
// entregar capa borrada no desktop.
//
// A ALTURA DE 320 FICA, mesmo com o PageSpeed pedindo menos. Ele mede num
// aparelho a dpr 1,75, onde a caixa de 130 CSS precisa de 228 px e 320 sobra.
// Mas celular a dpr 3 é o comum hoje, e ali a mesma caixa pede 390: baixar
// para 260 deixaria a capa macia para a maioria das pessoas para agradar o
// medidor. 320 já é o meio-termo — cobre até dpr 2,46.
//
// A qualidade caiu de 72 para 60, que é onde dá para economizar sem custo:
// medido em sequência nas 12 capas da primeira página, 191,6 KiB viram 168,3
// (12% menos), e ampliando 3x a arte lado a lado não dá para dizer qual é
// qual. A diferença média é de 6,5 níveis em 255.
//
// UM ÚNICO JOGO DE PARÂMETROS, de propósito: cada querystring diferente é um
// arquivo novo para o CDN gerar e guardar. Com um só, são 157 variantes no
// total — uma por capa — e a segunda visita de qualquer pessoa já pega tudo
// pronto. Uma `srcset` com dois tamanhos dobraria isso para economizar cerca
// de 20 KiB no celular, e não compensa.
const LARGURA = 600;
const ALTURA = 320;
const QUALIDADE = 60;

// O formato não é pedido: o endpoint devolve WebP sozinho para quem manda
// `Accept: image/webp`, e JPEG para quem não manda. Conferido nos dois casos.
const PARAMETROS = `width=${LARGURA}&height=${ALTURA}&resize=contain&quality=${QUALIDADE}`;

const CAMINHO_DO_OBJETO = '/storage/v1/object/public/';
const CAMINHO_DA_RENDERIZACAO = '/storage/v1/render/image/public/';

// Devolve o endereço da capa no tamanho que a tela usa.
//
// Endereço que não seja um objeto público do Storage volta intacto: hoje as 157
// capas estão todas no balde, mas um cadastro futuro pode apontar para fora, e
// aí o certo é entregar o que foi cadastrado em vez de montar uma URL que dá
// 400. Vale o mesmo para valor vazio, que o card já sabe tratar.
const redimensionar = (url, parametros) => {
  if (typeof url !== 'string' || !url.includes(CAMINHO_DO_OBJETO)) return url;

  const [endereco, consulta] = url.split('?');
  const separador = consulta ? `?${consulta}&` : '?';

  return endereco.replace(CAMINHO_DO_OBJETO, CAMINHO_DA_RENDERIZACAO) + separador + parametros;
};

export const capaNoTamanhoCerto = (url) => redimensionar(url, PARAMETROS);

// Miniatura da tela de gerenciar acervo, que desenha a capa num quadrado de
// 40x40 e lista os 157 jogos de uma vez. Sem isto ela baixava o acervo inteiro
// de capas — 17,3 MB — para montar uma coluna de polegares.
//
// 80 de lado cobre aparelho 2x. Qualidade mais baixa que a do card porque a
// diferença não aparece nesse tamanho.
const MINIATURA = 'width=80&height=80&resize=contain&quality=60';

export const miniaturaDaCapa = (url) => redimensionar(url, MINIATURA);
