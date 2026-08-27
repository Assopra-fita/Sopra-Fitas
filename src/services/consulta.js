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

// Escrita que precisa PROVAR que mudou alguma linha.
//
// `update()` sem `.select()` não pede `Prefer: return=representation`, então o
// PostgREST responde 204 sem corpo — e responde 204 do mesmo jeito quando a
// policy de RLS filtrou a linha e nada mudou. Ou seja: `desembrulhar` não
// levanta erro nenhum e a tela anuncia sucesso sobre uma escrita que não
// aconteceu. É o comportamento que fazia o perfil dizer "Nickname atualizado"
// e o nome sumir no carregamento seguinte.
//
// Quem chama passa a consulta JÁ com `.select()`; aqui só se confere que veio
// linha de volta.
export const escrever = async (consulta, oQue = 'a alteração') => {
  const { data, error } = await consulta;
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(
      `O banco não aplicou ${oQue}. Isso costuma ser permissão: a linha existe, mas a policy não deixa gravar.`
    );
  }
  return data;
};

// Para consultas de contagem, em que o dado interessante vem fora de `data`.
export const contar = async (consulta) => {
  const { count, error } = await consulta;
  if (error) throw error;
  return count ?? 0;
};

export { supabase };
