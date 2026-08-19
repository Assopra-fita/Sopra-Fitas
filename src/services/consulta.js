import { supabase } from '../supabaseClient';

// Ponto único por onde toda consulta ao Supabase passa.
//
// O cliente devolve `{ data, error }` e nunca lança: ignorar o `error` é uma
// linha que não se escreve, e era o que acontecia em quatro caminhos de escrita
// do projeto — a tela dizia que salvou sem ter salvado. Aqui o erro vira
// exceção, então esquecer dele passa a ser um erro visível e não um silêncio.
export const desembrulhar = async (consulta) => {
  const { data, error } = await consulta;
  if (error) throw error;
  return data;
};

// Para consultas de contagem, em que o dado interessante vem fora de `data`.
export const contar = async (consulta) => {
  const { count, error } = await consulta;
  if (error) throw error;
  return count ?? 0;
};

export { supabase };
