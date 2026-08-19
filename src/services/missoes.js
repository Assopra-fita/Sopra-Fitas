import { supabase, desembrulhar, contar } from './consulta';
import { enviarArquivo, validarImagem } from './armazenamento';

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

  const extensao = arquivo.name.split('.').pop();
  const printUrl = await enviarArquivo({
    balde: 'prints',
    // O nome do arquivo carrega o id do usuário, e o bucket é público: quem
    // listar o bucket correlaciona cada print a uma conta. Trocar isto por um
    // identificador aleatório é item da Fase 0 e depende do painel do Supabase.
    caminho: `${userId}_${Date.now()}.${extensao}`,
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
