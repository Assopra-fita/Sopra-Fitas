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

// O Supabase responde em inglês. Quem erra a senha não deveria receber
// "Invalid login credentials" num site em português.
const EM_PORTUGUES = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'Email not confirmed':
    'Confirme seu e-mail antes de entrar. O link foi enviado no cadastro — confira também a caixa de spam.',
  'User already registered': 'Esse e-mail já tem conta. Tente entrar.',
  'Password should be at least 6 characters':
    'A senha precisa de pelo menos 6 caracteres.',
  'Unable to validate email address: invalid format':
    'Esse e-mail não parece válido.',
  'Signups not allowed for this instance':
    'O cadastro está fechado no momento.',
};

const traduzir = (erro) => {
  const texto = erro?.message ?? '';
  if (EM_PORTUGUES[texto]) return new Error(EM_PORTUGUES[texto]);

  // A de limite de tentativas vem com o número de segundos no meio.
  const espera = texto.match(/only request this after (\d+) seconds/);
  if (espera) {
    return new Error(
      `Muitas tentativas seguidas. Tente de novo em ${espera[1]} segundos.`
    );
  }

  return erro;
};

export const entrar = async (email, senha) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });
  if (error) throw traduzir(error);
};

export const cadastrar = async (email, senha) => {
  const { error } = await supabase.auth.signUp({ email, password: senha });
  if (error) throw traduzir(error);
};

export const sair = () => supabase.auth.signOut();
