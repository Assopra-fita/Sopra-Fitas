import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Gamepad, Home } from 'lucide-react';
import Emulator from '../components/Emulator';
import AnuncioGPT from '../components/AnuncioGPT';
import BarraDeControles from '../components/jogo/BarraDeControles';
import FichaDoJogo from '../components/jogo/FichaDoJogo';
import JogosRelacionados from '../components/jogo/JogosRelacionados';
import ModalDeMissao from '../components/jogo/ModalDeMissao';
import ModalDeRecompensa from '../components/jogo/ModalDeRecompensa';
import { Aviso, Botao, Carregando, EstadoErro } from '../components/ui';
import { obterSessao } from '../services/sessao';
import { enviarPrint as enviarPrintDaMissao } from '../services/missoes';
import { ArquivoInvalido } from '../services/armazenamento';
import { useSeoDaPagina } from '../hooks/useSeoDaPagina';
import { seoDoJogo, seoDeJogoInexistente } from '../lib/seo';
import { normalizarConsole } from '../constants/consoles';
import { useAviso } from '../hooks/useAviso';
import { useJogo } from '../hooks/useJogo';
import { useRelacionados } from '../hooks/useRelacionados';
import { useEmulador } from '../hooks/useEmulador';
import { prepararPremiado } from '../lib/anuncioPremiado';

const GameRoom = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const { aviso, mostrarAviso, limparAviso } = useAviso();
  const { jogo, erro } = useJogo(gameId);
  const relacionados = useRelacionados(gameId);
  const emulador = useEmulador(gameId, mostrarAviso);

  // As mesmas tags que o build escreve no HTML de cada jogo. Aqui elas cobrem
  // o jogo cadastrado depois do último deploy, que ainda não tem página gerada.
  //
  // Enquanto o jogo carrega, e também quando ele não existe, o canonical já é o
  // desta URL — nunca o da Home. Passar `undefined` aqui fazia toda página de
  // jogo se declarar duplicata da Home durante o carregamento, e para sempre
  // quando dava erro.
  useSeoDaPagina(
    jogo
      ? seoDoJogo(jogo, normalizarConsole(jogo.console))
      : seoDeJogoInexistente(gameId)
  );

  // Falha do emulador ao iniciar, separada do erro de "jogo não encontrado":
  // aqui o jogo existe, o que faltou foi memória no navegador.
  const [falhaDoEmulador, setFalhaDoEmulador] = useState(null);

  // `{ assistir }` enquanto o jogo está travado por anúncio não assistido, e
  // null quando está liberado. Quem decide isso é src/lib/premiadoAoJogar.js.
  const [anuncioExigido, setAnuncioExigido] = useState(null);

  const [sessao, setSessao] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [arquivo, setArquivo] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setFalhaDoEmulador(null);
    setAnuncioExigido(null);
    window.scrollTo(0, 0);

    // Pede o anúncio premiado do botão JOGAR aqui, e não lá no componente
    // Emulator: este efeito roda assim que a sala abre, enquanto o Emulator só
    // monta depois de o Supabase devolver a ficha do jogo. Essa ida ao banco é
    // meio segundo que o anúncio ganha para carregar antes do clique.
    prepararPremiado();

    let ativo = true;
    obterSessao()
      .then((s) => ativo && setSessao(s))
      .catch((e) => console.error('Erro ao obter a sessão:', e));

    return () => {
      ativo = false;
    };
  }, [gameId]);

  // O emulador é encerrado no cleanup do componente Emulator, então dá para
  // sair pela navegação normal. Antes era preciso recarregar a página inteira,
  // porque o áudio continuava tocando depois de sair.
  const sair = () => navigate('/');

  const abrirEnvioDePrint = () =>
    sessao
      ? setModalAberto(true)
      : mostrarAviso('Entre na sua conta para enviar o print', { erro: true });

  const enviarPrint = async (e) => {
    e.preventDefault();
    if (!sessao) return mostrarAviso('Você precisa estar logado', { erro: true });

    setEnviando(true);
    try {
      await enviarPrintDaMissao({
        userId: sessao.user.id,
        gameId,
        gameNome: jogo.nome,
        arquivo,
      });

      setModalAberto(false);
      setArquivo(null);
      mostrarAviso(
        'Missão enviada! Acompanhe em Perfil › Minhas missões.'
      );
    } catch (falha) {
      // Arquivo errado tem mensagem própria e já explica o que fazer; o resto
      // é falha de rede ou do banco.
      mostrarAviso(
        falha instanceof ArquivoInvalido
          ? falha.message
          : 'Erro ao enviar: ' + falha.message,
        { erro: true }
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="sala">
      {/* Escondidos por CSS, nunca desmontados: o iframe do GPT não sobrevive a
          uma remontagem, porque googletag.display só roda uma vez por slot */}
      <aside className="sala__lateral sala__lateral--esquerda">
        <h2 className="sala__rotulo-anuncio">Publicidade</h2>
        <AnuncioGPT adId="div-gpt-ad-1775680124469-0" />
      </aside>

      <main className="sala__principal">
        {erro ? (
          <div className="sala__falha">
            <Gamepad size={40} aria-hidden="true" />
            {/* Um endereço é uma rota, e uma rota precisa de título de
                primeiro nível — inclusive quando o que ela mostra é um erro. */}
            <h1 className="sala__falha-titulo">Jogo não encontrado</h1>
            <EstadoErro>{erro}</EstadoErro>
            <Botao para="/">
              <Home size={16} aria-hidden="true" /> Voltar para os jogos
            </Botao>
          </div>
        ) : !jogo ? (
          <Carregando>Carregando jogo...</Carregando>
        ) : (
          <div className="sala__coluna">
            <div className="sala__tela" id={emulador.ID_DA_TELA}>
              {/* O emulador sai da árvore quando falha, em vez de a mensagem
                  ser desenhada por cima dele. Disputar `z-index` com a barra de
                  menu da biblioteca não funcionou — o botão de ajustes ficava
                  por cima do texto — e desmontar ainda dispara o encerramento,
                  soltando o que a instância morta ainda segurava. */}
              {falhaDoEmulador === 'memoria' ? (
                <div className="sala__sem-memoria" role="alert">
                  <h2>O navegador ficou sem memória</h2>
                  <p>
                    Cada jogo aberto reserva um pedaço de memória que o
                    navegador só devolve quando a aba fecha. Depois de alguns
                    jogos na mesma visita, não sobra espaço para o próximo.
                  </p>
                  <p className="sala__sem-memoria-saida">
                    <strong>Feche esta aba e abra o jogo de novo.</strong>{' '}
                    Voltar para a Home não resolve.
                  </p>
                </div>
              ) : (
                <Emulator
                  gameUrl={jogo.rom_url}
                  core={jogo.core}
                  onPronto={emulador.aoPronto}
                  aoFalhar={setFalhaDoEmulador}
                  aoExigirAnuncio={setAnuncioExigido}
                />
              )}
            </div>

            <BarraDeControles
              aoSair={sair}
              aoSalvar={emulador.salvar}
              aoCarregar={emulador.carregar}
              aoReiniciar={emulador.reiniciar}
              aoTelaCheia={emulador.telaCheia}
            />

            <Aviso aviso={aviso} aoFechar={limparAviso} className="sala__aviso" />

            {/* Escondido por CSS no celular deitado, onde a tela inteira é do
                jogo. Antes era desmontado por um ternário de JavaScript. */}
            <div className="sala__abaixo">
              <FichaDoJogo jogo={jogo} aoEnviarPrint={abrirEnvioDePrint} />
              <JogosRelacionados jogos={relacionados} />
            </div>
          </div>
        )}
      </main>

      {/* Idem: escondido, nunca desmontado */}
      <aside className="sala__lateral sala__lateral--direita">
        <h2 className="sala__rotulo-anuncio">Publicidade</h2>
        <AnuncioGPT adId="div-gpt-ad-1775680168607-0" />
      </aside>

      {anuncioExigido && (
        <ModalDeRecompensa aoAssistir={anuncioExigido.assistir} aoSair={sair} />
      )}

      {modalAberto && (
        <ModalDeMissao
          enviando={enviando}
          aoEscolherArquivo={(e) => setArquivo(e.target.files[0])}
          aoEnviar={enviarPrint}
          aoFechar={() => setModalAberto(false)}
        />
      )}
    </div>
  );
};

export default GameRoom;
