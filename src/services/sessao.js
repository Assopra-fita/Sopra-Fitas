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

// --- Recuperação de senha que funciona onde quer que o link caia ---
//
// O link do e-mail volta para o endereço passado em `redirectTo`, MAS só se
// esse endereço estiver na lista de redirecionamentos do painel do Auth. Fora
// da lista, o Supabase ignora o `redirectTo` e manda para a Site URL — que
// aqui é a Home. O jogador chegaria na vitrine, sem tela de trocar senha e sem
// entender por quê.
//
// Como a lista fica num painel que nem todo mundo do time acessa, o site não
// depende dela: em vez de exigir que o link caia em /nova-senha, ele detecta a
// recuperação em QUALQUER rota e leva para lá.
//
// A assinatura é feita no carregamento do módulo, e não dentro de um
// componente, de propósito: o cliente lê o fragmento da URL durante a própria
// inicialização, e o evento pode disparar antes de o React montar. Assinando
// aqui, o evento é guardado e entregue a quem chegar depois.
let recuperacaoDetectada = false;
const ouvintesDeRecuperacao = new Set();

supabase.auth.onAuthStateChange((evento) => {
  if (evento !== 'PASSWORD_RECOVERY') return;

  recuperacaoDetectada = true;
  for (const ouvinte of ouvintesDeRecuperacao) {
    try {
      ouvinte();
    } catch (e) {
      console.error('Falha ao tratar a recuperação de senha:', e);
    }
  }
});

// Avisa quando o link de recuperação for reconhecido. Chama na hora se ele já
// tiver sido reconhecido antes desta assinatura.
export const aoDetectarRecuperacao = (aoRecuperar) => {
  if (recuperacaoDetectada) {
    aoRecuperar();
    return () => {};
  }

  ouvintesDeRecuperacao.add(aoRecuperar);
  return () => ouvintesDeRecuperacao.delete(aoRecuperar);
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
  'New password should be different from the old password.':
    'A senha nova precisa ser diferente da atual.',
  'Auth session missing!':
    'O link de recuperação expirou ou já foi usado. Peça um novo.',
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

export const cadastrar = async (email, senha, nome) => {
  const { error } = await supabase.auth.signUp({
    email,
    password: senha,
    // O nome vai para `raw_user_meta_data`, e é o único lugar onde ele cabe
    // neste momento: com confirmação de e-mail ligada o signUp não abre sessão,
    // e a linha em `profiles` só nasce depois. Era por isso que 120 dos 184
    // perfis estavam com o nome em branco — o campo simplesmente não existia.
    // Quem copia daqui para `profiles` é o useSessao, no primeiro login.
    options: { data: { nome: nome?.trim() || undefined } },
  });
  if (error) throw traduzir(error);
};

// Sair conferindo o erro, e não de olhos fechados.
//
// O `signOut` só apaga a sessão local depois de o servidor responder: falha de
// rede que não seja 401, 403 ou 404 retorna ANTES de limpar. Ignorando o erro,
// a tela dizia "Você saiu da conta" com o token ainda válido no aparelho e a
// renovação automática ligada — pior num computador compartilhado.
export const sair = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw traduzir(error);
};

// Recuperação de senha. Quem esquecia a senha perdia a conta e os pontos
// junto: não havia caminho nenhum de volta na tela de login.
//
// O fluxo tem duas pontas. Aqui pede-se o e-mail; o Supabase manda um link que
// volta para `/nova-senha` com o token no fragmento da URL. O cliente detecta
// esse fragmento sozinho — `detectSessionInUrl` é o padrão — e abre uma sessão
// temporária. É ela que autoriza o `definirNovaSenha` da tela seguinte.
//
// ATENÇÃO: este endereço precisa estar na lista de redirecionamentos do Auth,
// no painel do Supabase. Fora da lista, o Supabase ignora o `redirectTo` e
// manda o link para a Site URL — a tela de nova senha nunca abre.
export const CAMINHO_NOVA_SENHA = '/nova-senha';

export const pedirRecuperacaoDeSenha = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${CAMINHO_NOVA_SENHA}`,
  });
  if (error) throw traduzir(error);
};

export const definirNovaSenha = async (senha) => {
  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) throw traduzir(error);
};
