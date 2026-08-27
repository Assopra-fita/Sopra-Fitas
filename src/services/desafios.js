import { supabase, desembrulhar } from './consulta';

// Desafios do mês: a tabela `missoes_globais`.
//
// Apesar do nome parecido, não tem acoplamento nenhum com `missoes`. É um
// mural: o texto aparece no topo da Home, não há botão de participar nem
// contador de progresso. Para receber a recompensa, o jogador manda um print
// pelo fluxo normal e o GM digita o valor à mão.

export const listarDesafios = (limite) => {
  const consulta = supabase
    .from('missoes_globais')
    .select('*')
    .order('created_at', { ascending: false });

  return desembrulhar(limite ? consulta.limit(limite) : consulta);
};

export const criarDesafio = ({ titulo, objetivo, recompensa }) =>
  desembrulhar(
    supabase
      .from('missoes_globais')
      .insert([{ titulo, objetivo, recompensa, tipo: 'mensal' }])
  );

export const removerDesafio = (id) =>
  desembrulhar(supabase.from('missoes_globais').delete().eq('id', id));
