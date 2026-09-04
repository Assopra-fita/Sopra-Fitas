// A regra de "este cadastro tem imagem no campo da ROM".
//
// Mora aqui, sozinha e sem dependência nenhuma, porque quatro lugares precisam
// dela e um deles é script de build: a vitrine, a sala de jogo, o gerador de
// páginas e o de sitemap. Se estivesse em `services/jogos.js`, importá-la nos
// scripts arrastaria o cliente do Supabase para dentro do build.
//
// O DEFEITO QUE ELA PEGA: o formulário do painel aceita qualquer arquivo no
// campo da ROM, e 28 dos 157 jogos do acervo têm ali uma imagem — na maioria, a
// própria capa enviada duas vezes. Medido em 04/09/2026 por
// supabase/conferir-acervo.mjs, que baixa os 16 primeiros bytes de cada arquivo
// e compara com as assinaturas de PNG, JPEG, GIF, WEBP, XML e HTML.
//
// O modo de falhar é o pior que existe: o emulador recebe o PNG, monta o
// canvas, pinta tudo de preto e não escreve NADA — nem erro de rede, nem log no
// console, nem aviso na tela. Conferido no site no ar em /jogar/axelay: canvas
// presente, 100% preto, zero erro. Quem clica em Jogar fica olhando para um
// retângulo escuro sem saber se a culpa é da internet dele.
//
// POR QUE PELA EXTENSÃO E NÃO PELOS BYTES: olhar os bytes exigiria uma
// requisição por jogo — 157 na Home — e a extensão já denuncia os 28 casos. É
// filtro barato para o sintoma conhecido, não validação. A validação de verdade
// é o script, que roda contra os arquivos.
const EXTENSAO_DE_IMAGEM = /\.(png|jpe?g|webp|gif|svg|avif|bmp)(\?|$)/i;

export const romEhImagem = (url) => EXTENSAO_DE_IMAGEM.test(String(url ?? ''));
