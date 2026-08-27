import { supabase, desembrulhar, contar } from './consulta';
import { caminhoNoBalde, enviarArquivo, removerArquivos } from './armazenamento';

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

// Apaga a linha e, em seguida, a capa e a ROM que só ela referenciava.
//
// A ordem importa. A linha é a fonte da verdade: apagando os arquivos primeiro,
// um delete que falhasse deixaria o jogo no acervo apontando para arquivo que
// não existe mais — card com capa quebrada e emulador em tela preta. Na ordem
// inversa o pior caso é arquivo órfão, que é justamente o que já vinha
// acumulando: 10 ROMs e 11 capas sem dono no Storage.
//
// Falhar ao apagar arquivo não derruba a operação, porque a linha já saiu e não
// há como voltar atrás. O retorno diz o que sobrou, para a tela contar a
// verdade em vez de dizer "removido" e deixar 8 MB para trás.
export const removerJogo = async (jogo) => {
  await desembrulhar(supabase.from('jogos').delete().eq('id', jogo.id));

  // Nem todo jogo tem arquivo no Storage: parte do acervo foi cadastrada com a
  // capa ou a ROM apontando para fora do projeto. `caminhoNoBalde` devolve null
  // nesses casos, e a contagem é o que deixa a tela dizer "não havia nada para
  // apagar" em vez de anunciar uma limpeza que não aconteceu.
  const daCapa = caminhoNoBalde(jogo.capa_url, 'capas');
  const daRom = caminhoNoBalde(jogo.rom_url, 'roms');
  const quantos = [daCapa, daRom].filter(Boolean).length;

  try {
    await Promise.all([
      removerArquivos('capas', [daCapa]),
      removerArquivos('roms', [daRom]),
    ]);
    return { arquivosRemovidos: true, quantos };
  } catch (falha) {
    console.error('Erro ao apagar os arquivos do Storage:', falha);
    return { arquivosRemovidos: false, quantos, falha };
  }
};

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
