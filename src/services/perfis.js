import { supabase, desembrulhar, escrever, contar } from './consulta';

// Tudo que o site lê ou escreve na tabela `profiles`.
//
// A regra de ouro desta tabela é **nunca pedir `email`** daqui. Antes ela valia
// por disciplina: a RLS filtra linha, não coluna, e a política de leitura é
// `USING (true)` porque o ranking precisa mesmo ver todo mundo — então a coluna
// ia junto para o navegador de qualquer visitante, com a chave anônima que
// viaja no bundle autorizando.
//
// Hoje quem impede é o banco: `anon` e `authenticated` só têm GRANT de SELECT
// nas colunas id, nome, pontos (e role, para quem está logado). Pedir `email`
// ou `*` por aqui devolve erro de permissão, de propósito. Quem precisa do
// e-mail é só a tela do GM, e ela passa pela função `listar_jogadores_admin`.

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

// Tela do GM, a única que precisa do e-mail.
//
// Não dá para pedir `*` aqui: o e-mail não está no GRANT de coluna de ninguém
// que venha do navegador. Quem devolve é uma função no banco que confere o
// papel de quem chamou antes de responder — o filtro deixa de ser "o cliente
// não pediu" e passa a ser "o banco não entrega".
export const listarJogadores = () =>
  desembrulhar(supabase.rpc('listar_jogadores_admin'));

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

// `id` em vez de `*` pelo mesmo motivo: `*` inclui o e-mail, e o GRANT de
// coluna barra a consulta inteira mesmo quando só se quer a contagem.
export const contarJogadores = () =>
  contar(supabase.from('profiles').select('id', { count: 'exact', head: true }));
