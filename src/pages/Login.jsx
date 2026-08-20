import React, { useState } from 'react';
import { entrar, cadastrar } from '../services/sessao';
import { useNavigate, Link } from 'react-router-dom';
import { Gamepad2, ArrowLeft, Info, Loader2, CheckCircle2 } from 'lucide-react';
import { useTituloDaPagina } from '../hooks/useTituloDaPagina';
import { useAviso } from '../hooks/useAviso';
import { Aviso, Botao, Campo } from '../components/ui';

const Login = () => {
  useTituloDaPagina('Entrar');

  const { aviso, mostrarAviso, limparAviso } = useAviso();

  const navigate = useNavigate();
  const [enviando, setEnviando] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // false = tela de login (padrão) | true = tela de cadastro
  const [criandoConta, setCriandoConta] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);

    try {
      if (criandoConta) {
        await cadastrar(email, senha);

        // Fixo: quem acabou de se cadastrar precisa ler isto inteiro, e some
        // antes de terminar se durar três segundos.
        mostrarAviso(
          'Conta criada! O link de confirmação foi enviado para o seu e-mail — confira também a caixa de spam.',
          { fixo: true }
        );
        setCriandoConta(false);
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

  const alternarModo = () => {
    limparAviso();
    setCriandoConta((atual) => !atual);
    setEmail('');
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
          <h1 className="login__titulo">Sopra Fitas</h1>
          <p className="login__chamada">
            {criandoConta
              ? 'Crie sua conta e comece a pontuar'
              : 'Entre para continuar jogando'}
          </p>
        </div>

        <section className="login__instrucoes">
          <h2 className="login__instrucoes-titulo">
            {criandoConta ? (
              <Info size={16} aria-hidden="true" />
            ) : (
              <CheckCircle2 size={16} aria-hidden="true" />
            )}
            {criandoConta ? 'Passo a passo' : 'Antes de entrar'}
          </h2>

          <ul>
            {criandoConta ? (
              <>
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
            ) : (
              <>
                <li>
                  Entrar serve para <strong>pontuar e enviar missões</strong>. O
                  progresso dos jogos fica salvo neste aparelho.
                </li>
                <li>Ainda não tem conta? Toque em "Criar conta".</li>
                <li>Não recebeu o e-mail de confirmação? Veja o spam.</li>
              </>
            )}
          </ul>
        </section>

        <Aviso aviso={aviso} aoFechar={limparAviso} />

        <form onSubmit={enviar} className="login__formulario">
          <Campo
            rotulo="E-mail"
            type="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <Campo
            rotulo="Senha"
            type="password"
            placeholder="Mínimo de 6 caracteres"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete={criandoConta ? 'new-password' : 'current-password'}
            minLength={6}
            required
          />

          <Botao type="submit" cheio disabled={enviando}>
            {enviando ? (
              <Loader2 className="animate-spin" size={18} aria-hidden="true" />
            ) : criandoConta ? (
              'Criar conta grátis'
            ) : (
              'Entrar'
            )}
          </Botao>
        </form>

        <div className="login__alternar">
          <p>{criandoConta ? 'Já tem conta?' : 'Primeira vez no Sopra Fitas?'}</p>

          <Botao
            variante="fantasma"
            compacto
            onClick={alternarModo}
            disabled={enviando}
          >
            {criandoConta ? 'Fazer login' : 'Criar conta'}
          </Botao>
        </div>
      </div>
    </main>
  );
};

export default Login;
