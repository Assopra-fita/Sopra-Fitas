import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import { obterSessao, definirNovaSenha } from '../services/sessao';
import { useTituloDaPagina } from '../hooks/useTituloDaPagina';
import { useAviso } from '../hooks/useAviso';
import { MARCA } from '../lib/seo';
import { Aviso, Botao, Campo, Carregando } from '../components/ui';

// A segunda ponta da recuperação de senha. Chega-se aqui pelo link do e-mail,
// que traz o token no fragmento da URL: o cliente do Supabase lê o fragmento
// sozinho e abre uma sessão temporária antes de a tela montar.
//
// `obterSessao` espera essa leitura terminar — o getSession do Supabase aguarda
// a promessa de inicialização, que inclui a detecção do fragmento. Consultar
// direto o localStorage aqui daria "sem sessão" numa corrida de milissegundos.
const NovaSenha = () => {
  useTituloDaPagina('Nova senha');

  const { aviso, mostrarAviso, limparAviso } = useAviso();

  const [conferindo, setConferindo] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [senha, setSenha] = useState('');
  const [repetida, setRepetida] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [trocada, setTrocada] = useState(false);

  useEffect(() => {
    let ativo = true;

    obterSessao()
      .then((sessao) => {
        if (!ativo) return;
        setAutorizado(Boolean(sessao));
      })
      .catch((e) => console.error('Erro ao conferir a sessão:', e))
      .finally(() => {
        if (ativo) setConferindo(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const salvar = async (e) => {
    e.preventDefault();

    // Conferido aqui e não pelo `pattern` do campo: a mensagem precisa dizer
    // qual dos dois campos está diferente, e o navegador só diria "inválido".
    if (senha !== repetida)
      return mostrarAviso('As duas senhas não são iguais.', { erro: true });

    setSalvando(true);
    try {
      await definirNovaSenha(senha);

      // Fica na tela em vez de redirecionar sozinha: a sessão da recuperação
      // já é a sessão da conta, e mandar a pessoa embora num temporizador
      // esconde justamente a frase que ela precisa ler antes de sair.
      setSenha('');
      setRepetida('');
      setTrocada(true);
      mostrarAviso('Senha trocada. Você já está dentro da sua conta.', {
        fixo: true,
      });
    } catch (erro) {
      mostrarAviso(erro.message, { erro: true });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className="login">
      <div className="login__caixa">
        <Link to="/" className="login__voltar" aria-label="Voltar para a Home">
          <ArrowLeft size={24} aria-hidden="true" />
        </Link>

        <div className="login__marca" aria-hidden="true">
          <KeyRound size={32} />
        </div>

        <div>
          <h1 className="login__titulo">Escolher nova senha</h1>
          <p className="login__chamada">
            {trocada
              ? `Bom jogo no ${MARCA}`
              : autorizado
                ? `Depois disso você entra normalmente no ${MARCA}`
                : 'Este link não vale mais'}
          </p>
        </div>

        {conferindo ? (
          <Carregando>Conferindo o link...</Carregando>
        ) : trocada ? (
          <>
            <Aviso aviso={aviso} />

            <Botao para="/" cheio>
              Ir para os jogos
            </Botao>
          </>
        ) : autorizado ? (
          <>
            <Aviso aviso={aviso} aoFechar={limparAviso} />

            <form onSubmit={salvar} className="login__formulario">
              <Campo
                rotulo="Nova senha"
                tipo="password"
                placeholder="Mínimo de 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />

              <Campo
                rotulo="Repita a nova senha"
                tipo="password"
                placeholder="A mesma senha de novo"
                value={repetida}
                onChange={(e) => setRepetida(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />

              <Botao type="submit" cheio disabled={salvando}>
                {salvando ? (
                  <Loader2 className="animate-spin" size={18} aria-hidden="true" />
                ) : (
                  'Salvar nova senha'
                )}
              </Botao>
            </form>
          </>
        ) : (
          <>
            <section className="login__instrucoes">
              <h2 className="login__instrucoes-titulo">
                <KeyRound size={16} aria-hidden="true" />O que aconteceu
              </h2>

              <ul>
                <li>
                  O link de redefinição <strong>vale por uma hora</strong> e só
                  pode ser usado uma vez.
                </li>
                <li>
                  Abrir o link num navegador diferente do que pediu também não
                  funciona.
                </li>
                <li className="login__aviso">
                  Peça um link novo na tela de login, em "Esqueci minha senha".
                </li>
              </ul>
            </section>

            <Botao para="/login" cheio>
              Pedir um link novo
            </Botao>
          </>
        )}
      </div>
    </main>
  );
};

export default NovaSenha;
