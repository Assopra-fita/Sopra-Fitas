import { supabase, desembrulhar, contar } from './consulta';
import { enviarArquivo } from './armazenamento';

// Tudo que o site lê ou escreve na tabela `jogos`, que é o acervo cadastrado
// pelo painel do GM. O acervo do código vive em constants/games.js e não passa
// por aqui — ver docs/CATALOGO-DE-JOGOS.md.

// Vitrine: só as colunas que o card usa. Pedir `*` trazia descrição e ficha
// técnica de 133 jogos para montar uma grade que não mostra nenhum dos dois.
export const listarParaVitrine = () =>
  desembrulhar(
    supabase.from('jogos').select('id, nome, console, core, rom_url, capa_url')
  );

// Sala de jogo: um jogo, com a ficha técnica completa.
export const obterJogo = (id) =>
  desembrulhar(supabase.from('jogos').select('*').eq('id', id).single());

export const listarOutros = (id, limite = 8) =>
  desembrulhar(supabase.from('jogos').select('*').neq('id', id).limit(limite));

// Tela de gerenciar acervo.
export const listarAcervo = () =>
  desembrulhar(supabase.from('jogos').select('*').order('nome', { ascending: true }));

export const atualizarJogo = (id, dados) =>
  desembrulhar(supabase.from('jogos').update(dados).eq('id', id));

export const removerJogo = (id) =>
  desembrulhar(supabase.from('jogos').delete().eq('id', id));

export const contarJogos = () =>
  contar(supabase.from('jogos').select('*', { count: 'exact', head: true }));

// Cadastro completo: sobe a capa, sobe a ROM e grava a linha.
//
// Os dois envios são disparados juntos porque são independentes entre si — em
// série a espera é a soma, em paralelo é a do maior. A validação dos arquivos
// acontece na tela ANTES de chamar aqui, para não subir 8 MB e só então
// descobrir que o console estava errado.
export const cadastrarJogo = async ({ id, capa, rom, dados }) => {
  const [capaUrl, romUrl] = await Promise.all([
    enviarArquivo({
      balde: 'capas',
      caminho: `${id}-capa.${capa.name.split('.').pop()}`,
      arquivo: capa,
      substituir: true,
    }),
    enviarArquivo({
      balde: 'roms',
      caminho: `${id}.${rom.name.split('.').pop()}`,
      arquivo: rom,
      substituir: true,
    }),
  ]);

  return desembrulhar(
    supabase.from('jogos').insert([{ ...dados, id, capa_url: capaUrl, rom_url: romUrl }])
  );
};
