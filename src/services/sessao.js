import { supabase } from './consulta';

// Autenticação. O cliente do Supabase guarda o token no localStorage sozinho;
// aqui só se dá nome às operações, para nenhuma tela precisar conhecer a forma
// da resposta do `supabase.auth`.

export const obterSessao = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
};

export const obterUsuario = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

// Devolve a função de cancelar, para o efeito que assinou poder desfazer.
// O evento INITIAL_SESSION dispara já na assinatura, então quem assina não
// precisa chamar obterSessao antes — fazer os dois duplica a consulta.
export const assinarSessao = (aoMudar) => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_evento, sessao) => aoMudar(sessao));

  return () => subscription.unsubscribe();
};

export const entrar = async (email, senha) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });
  if (error) throw error;
};

export const cadastrar = async (email, senha) => {
  const { error } = await supabase.auth.signUp({ email, password: senha });
  if (error) throw error;
};

export const sair = () => supabase.auth.signOut();
