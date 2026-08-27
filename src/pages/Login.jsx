import React, { useState } from 'react';
import { entrar, cadastrar, pedirRecuperacaoDeSenha } from '../services/sessao';
import { useNavigate, Link } from 'react-router-dom';
import { Gamepad2, ArrowLeft, Info, Loader2, CheckCircle2, KeyRound } from 'lucide-react';
import { useSeoDaPagina } from '../hooks/useSeoDaPagina';
import { seoDoLogin, MARCA } from '../lib/seo';
import { useAviso } from '../hooks/useAviso';
import { medir, CONTA_CRIADA } from '../lib/medicao';
import { Aviso, Botao, Campo } from '../components/ui';

// As três coisas que esta tela faz. Era um booleano de dois estados até a
// recuperação de senha entrar; com três, booleano vira condição aninhada.
const ENTRAR = 'entrar';
const CRIAR = 'criar';
const RECUPERAR = 'recuperar';

const TEXTOS = {
  [ENTRAR]: {
    chamada: 'Entre para continuar jogando',
    tituloInstrucoes: 'Antes de entrar',
    acao: 'Entrar',
  },
  [CRIAR]: {
    chamada: 'Crie sua conta e comece a pontuar',
    tituloInstrucoes: 'Passo a passo',
    acao: 'Criar conta grátis',
  },
  [RECUPERAR]: {
    chamada: 'Recupere o acesso à sua conta',
    tituloInstrucoes: 'Como funciona',
    acao: 'Enviar link de recuperação',
  },
};

const Login = () => {
  useSeoDaPagina(seoDoLogin());

  const { aviso, mostrarAviso, limparAviso } = useAviso();

  const navigate = useNavigate();
  const [enviando, setEnviando] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const [modo, setModo] = useState(ENTRAR);
  const textos = TEXTOS[modo];

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);

    try {
      if (modo === CRIAR) {
        await cadastrar(email, senha, nome);

        // Só se chega nesta linha quando o cadastro deu certo: `cadastrar`
        // levanta erro em qualquer outro caso. Antes o evento morava no
        // index.html e disparava em toda página aberta, sem ninguém ter
        // criado conta nenhuma.
        medir(CONTA_CRIADA);

        // Fixo: quem acabou de se cadastrar precisa ler isto inteiro, e some
        // antes de terminar se durar três segundos.
        mostrarAviso(
          'Conta criada! O link de confirmação foi enviado para o seu e-mail — confira também a caixa de spam.',
          { fixo: true }
        );
        setModo(ENTRAR);
      } else if (modo === RECUPERAR) {
        await pedirRecuperacaoDeSenha(email);

        // A mesma frase para e-mail cadastrado e não cadastrado, de propósito:
        // responder "essa conta não existe" transforma a tela num confirmador
        // de quem tem conta aqui, para qualquer um que teste uma lista.
        mostrarAviso(
          'Se houver conta com esse e-mail, o link de redefinição chegou lá — confira também a caixa de spam.',
          { fixo: true }
        );
        setModo(ENTRAR);
      } else {
        await entrar(email, senha);
        navigate('/');
      }
    } catch (erro) {
      mostrarAviso(erro.message, { erro: true });
    } finally {
      setEnviando(false);
    }
  };

  // O e-mail ATRAVESSA a troca de modo, e é de propósito: quem erra a senha e
  // toca em "Esqueci minha senha" acabou de digitar exatamente o e-mail que a
  // recuperação precisa — apagá-lo obriga a digitar de novo no celular, que é
  // onde digitar custa mais. A senha não atravessa: a de entrar não serve para
  // criar conta, e deixá-la no campo depois de trocar de tela é o tipo de
  // sobra que faz alguém cadastrar sem perceber a senha de outra conta.
  const irPara = (proximo) => {
    limparAviso();
    setModo(proximo);
    setNome('');
    setSenha('');
  };

  return (
    <main className="login">
      <div className="login__caixa">
        <Link to="/" className="login__voltar" aria-label="Voltar para a Home">
          <ArrowLeft size={24} aria-hidden="true" />
        </Link>

        <div className="login__marca" aria-hidden="true">
          <Gamepad2 size={32} />
        </div>

        <div>
          <h1 className="login__titulo">{MARCA}</h1>
          <p className="login__chamada">{textos.chamada}</p>
        </div>

        <section className="login__instrucoes">
          <h2 className="login__instrucoes-titulo">
            {modo === CRIAR ? (
              <Info size={16} aria-hidden="true" />
            ) : modo === RECUPERAR ? (
              <KeyRound size={16} aria-hidden="true" />
            ) : (
              <CheckCircle2 size={16} aria-hidden="true" />
            )}
            {textos.tituloInstrucoes}
          </h2>

          <ul>
            {modo === CRIAR && (
              <>
                <li>
                  O <strong>apelido</strong> é o nome que aparece no ranking.
                  Dá para trocar depois, no seu perfil.
                </li>
                <li>
                  Use um <strong>e-mail de verdade</strong>: você vai receber um
                  link de confirmação.
                </li>
                <li>
                  A senha precisa de no mínimo <strong>6 caracteres</strong>.
                </li>
                <li className="login__aviso">
                  Sem confirmar o e-mail, o login não funciona.
                </li>
              </>
            )}

            {modo === ENTRAR && (
              <>
                <li>
                  Entrar serve para <strong>pontuar e enviar missões</strong>. O
                  progresso dos jogos fica salvo neste aparelho.
                </li>
                <li>Ainda não tem conta? Toque em "Criar conta".</li>
                <li>Não recebeu o e-mail de confirmação? Veja o spam.</li>
              </>
            )}

            {modo === RECUPERAR && (
              <>
                <li>
                  Informe o e-mail da conta. Você recebe um{' '}
                  <strong>link para escolher uma senha nova</strong>.
                </li>
                <li>O link vale por uma hora e só pode ser usado uma vez.</li>
                <li className="login__aviso">
                  Seus pontos continuam na conta — trocar a senha não apaga nada.
                </li>
              </>
            )}
          </ul>
        </section>

        <Aviso aviso={aviso} aoFechar={limparAviso} />

        <form onSubmit={enviar} className="login__formulario">
          {modo === CRIAR && (
            <Campo
              rotulo="Apelido no ranking"
              placeholder="Como você quer ser chamado"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="nickname"
              maxLength={30}
              required
            />
          )}

          <Campo
            rotulo="E-mail"
            tipo="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          {/* A recuperação manda um link e não confere senha nenhuma: pedir a
              senha aqui só teria como resposta possível a que a pessoa esqueceu. */}
          {modo !== RECUPERAR && (
            <Campo
              rotulo="Senha"
              tipo="password"
              placeholder="Mínimo de 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete={modo === CRIAR ? 'new-password' : 'current-password'}
              minLength={6}
              required
            />
          )}

          <Botao type="submit" cheio disabled={enviando}>
            {enviando ? (
              <Loader2 className="animate-spin" size={18} aria-hidden="true" />
            ) : (
              textos.acao
            )}
          </Botao>
        </form>

        {modo === ENTRAR && (
          <Botao
            variante="fantasma"
            compacto
            className="login__esqueci"
            onClick={() => irPara(RECUPERAR)}
            disabled={enviando}
          >
            Esqueci minha senha
          </Botao>
        )}

        <div className="login__alternar">
          <p>
            {modo === CRIAR
              ? 'Já tem conta?'
              : modo === RECUPERAR
                ? 'Lembrou a senha?'
                : `Primeira vez no ${MARCA}?`}
          </p>

          <Botao
            variante="fantasma"
            compacto
            onClick={() => irPara(modo === ENTRAR ? CRIAR : ENTRAR)}
            disabled={enviando}
          >
            {modo === ENTRAR ? 'Criar conta' : 'Fazer login'}
          </Botao>
        </div>
      </div>
    </main>
  );
};

export default Login;
