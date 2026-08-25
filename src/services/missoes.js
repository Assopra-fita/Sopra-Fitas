import { supabase, desembrulhar, contar } from './consulta';
import {
  enviarArquivo,
  extensaoDe,
  nomeAleatorio,
  validarImagem,
} from './armazenamento';

// O ciclo da missão: o jogador envia um print, o GM confere e credita pontos.
// É o único jeito de ganhar ponto no site.

// A fila do GM. Não pede `email` no embed: o nome basta para conferir o print,
// e a coluna estava viajando para o navegador sem necessidade.
export const listarPendentes = () =>
  desembrulhar(
    supabase
      .from('missoes')
      .select('*, profiles (nome)')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false })
  );

export const contarPendentes = () =>
  contar(
    supabase
      .from('missoes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente')
  );

// Envio do print pelo jogador.
//
// ATENÇÃO: o upload e o insert não são transacionais entre si. Se o insert
// falhar depois do upload, o arquivo fica no bucket sem nenhuma linha
// apontando para ele. Resolver isso de verdade pede uma função no banco; aqui
// o que dá para fazer é validar antes de subir, para reduzir a chance.
export const enviarPrint = async ({ userId, gameId, gameNome, arquivo }) => {
  validarImagem(arquivo, 'O print');

  const printUrl = await enviarArquivo({
    balde: 'prints',
    // Identificador aleatório, nunca o id de quem enviou: o nome do arquivo
    // viaja para qualquer um que liste o bucket, e o bucket ainda responde à
    // listagem anônima. Quem sabe de quem é o print é a coluna `user_id`
    // desta mesma linha. Fechar a listagem é a outra metade, e depende do
    // painel do Supabase.
    caminho: nomeAleatorio(extensaoDe(arquivo)),
    arquivo,
  });

  return desembrulhar(
    supabase.from('missoes').insert({
      user_id: userId,
      game_id: gameId,
      game_nome: gameNome,
      print_url: printUrl,
      status: 'pendente',
    })
  );
};

// Único ponto do sistema que credita pontos. Quem soma é a função no banco,
// não o cliente — o corpo dela não está neste repositório.
export const aprovarMissao = ({ idMissao, idJogador, pontos }) =>
  desembrulhar(
    supabase.rpc('aprovar_missao_gm', {
      id_missao: idMissao,
      id_jogador: idJogador,
      qtd_pontos: pontos,
    })
  );

// Só muda o status: o print continua público no bucket.
export const rejeitarMissao = (id) =>
  desembrulhar(
    supabase.from('missoes').update({ status: 'rejeitado' }).eq('id', id)
  );

// O que o jogador enviou e em que pé está cada envio.
//
// Sem esta consulta ele mandava o print e nunca mais sabia o que aconteceu: o
// status só existia na fila do GM, e nem a aprovação nem a recusa avisavam
// ninguém. Pede as colunas nomeadas e não `*`: a linha tem o print e o id do
// jogador, e a tela não precisa carregar o segundo para desenhar o primeiro.
export const listarMinhasMissoes = (userId) =>
  desembrulhar(
    supabase
      .from('missoes')
      .select('id, game_id, game_nome, print_url, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  );
