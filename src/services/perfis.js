import { supabase, desembrulhar, escrever, contar } from './consulta';

// Tudo que o site lê ou escreve na tabela `profiles`.
//
// A regra de ouro desta tabela: **nunca pedir `email`** numa consulta que
// alimenta tela pública. A coluna já trafegou para o navegador de qualquer
// visitante pelo ranking, e a chave anônima que autoriza isso viaja no bundle.
// Quem impede de verdade são as policies de RLS; aqui a gente só não pede.

const UM = (colunas) => supabase.from('profiles').select(colunas);

// Perfil do cabeçalho: pontos e nome do próprio usuário.
export const obterResumo = (userId) =>
  desembrulhar(UM('pontos, nome').eq('id', userId).single());

// Perfil da tela de conta, que também mostra o papel.
export const obterPerfil = (userId) =>
  desembrulhar(UM('nome, pontos, role').eq('id', userId).single());

// Só o papel, para as guardas de tela.
export const obterPapel = async (userId) => {
  const perfil = await desembrulhar(UM('role').eq('id', userId).single());
  return perfil?.role ?? null;
};

export const atualizarNome = (userId, nome) =>
  escrever(
    supabase.from('profiles').update({ nome }).eq('id', userId).select('id'),
    'o nome'
  );

// Ranking público: id, nome e pontos, nada além disso.
export const listarRanking = (limite = 50) =>
  desembrulhar(
    UM('id, nome, pontos').order('pontos', { ascending: false }).limit(limite)
  );

// Tela do GM, que precisa de todas as colunas para editar.
export const listarJogadores = () =>
  desembrulhar(UM('*').order('pontos', { ascending: false }));

export const atualizarPontos = (userId, pontos) =>
  escrever(
    supabase.from('profiles').update({ pontos }).eq('id', userId).select('id'),
    'os pontos'
  );

export const definirPapel = (userId, papel) =>
  escrever(
    supabase.from('profiles').update({ role: papel }).eq('id', userId).select('id'),
    'o papel'
  );

export const contarJogadores = () =>
  contar(supabase.from('profiles').select('*', { count: 'exact', head: true }));
