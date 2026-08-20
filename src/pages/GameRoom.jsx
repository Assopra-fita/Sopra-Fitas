import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Emulator from '../components/Emulator';
import { obterSessao } from '../services/sessao';
import { obterJogo, listarOutros } from '../services/jogos';
import { enviarPrint as enviarPrintDaMissao } from '../services/missoes';
import { ArquivoInvalido } from '../services/armazenamento';
import {
  Calendar,
  Gamepad,
  ArrowRight,
  Download,
  Upload,
  RotateCcw,
  Maximize,
  Trophy,
  X,
  Home,
} from 'lucide-react';
import AnuncioGPT from '../components/AnuncioGPT';
import { acharJogo, outrosJogos as outrosDoAcervo } from '../constants/games';
import CapaDeJogo from '../components/ui/CapaDeJogo';
import { Aviso, Botao, Campo, Carregando, EstadoErro } from '../components/ui';
import { useTituloDaPagina } from '../hooks/useTituloDaPagina';
import { useAviso } from '../hooks/useAviso';
import { gravarEstado, lerEstado } from '../lib/estadoDeJogo';

const GameRoom = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [modalAberto, setModalAberto] = useState(false);
  const [arquivo, setArquivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [sessao, setSessao] = useState(null);

  const [jogoAtual, setJogoAtual] = useState(null);
  const [erroJogo, setErroJogo] = useState(null);
  const [outrosJogos, setOutrosJogos] = useState([]);

  useTituloDaPagina(jogoAtual?.nome);

  // A instância real do emulador, entregue pelo componente Emulator quando o
  // EmulatorJS termina de carregar. Antes daqui os botões chamavam métodos em
  // window.EJS_player, que é só uma string com o seletor CSS — nunca funcionaram.
  const emuladorRef = useRef(null);

  const { aviso, mostrarAviso, limparAviso } = useAviso();

  useEffect(() => {
    window.scrollTo(0, 0);

    let ativo = true;
    obterSessao()
      .then((s) => {
        if (ativo) setSessao(s);
      })
      .catch((e) => console.error('Erro ao obter a sessão:', e));

    return () => {
      ativo = false;
    };
  }, [gameId]);

  const salvarJogo = async () => {
    const gerenciador = emuladorRef.current?.gameManager;
    if (!gerenciador) return mostrarAviso('O jogo ainda está carregando', { erro: true });

    try {
      await gravarEstado(gameId, gerenciador.getState());
      mostrarAviso('Progresso salvo neste aparelho');
    } catch (e) {
      console.error('Falha ao salvar o estado:', e);
      mostrarAviso('Não foi possível salvar', { erro: true });
    }
  };

  const carregarJogo = async () => {
    const gerenciador = emuladorRef.current?.gameManager;
    if (!gerenciador) return mostrarAviso('O jogo ainda está carregando', { erro: true });

    try {
      const estado = await lerEstado(gameId);
      if (!estado) return mostrarAviso('Nenhum progresso salvo aqui', { erro: true });

      gerenciador.loadState(estado);
      mostrarAviso('Progresso carregado');
    } catch (e) {
      console.error('Falha ao carregar o estado:', e);
      mostrarAviso('Não foi possível carregar', { erro: true });
    }
  };

  const reiniciarJogo = () => {
    const gerenciador = emuladorRef.current?.gameManager;
    if (!gerenciador) return mostrarAviso('O jogo ainda está carregando', { erro: true });

    gerenciador.restart();
    mostrarAviso('Jogo reiniciado');
  };

  const telaCheia = () => {
    const elem = document.getElementById('tela-do-jogo');
    if (!elem) return;

    const pedido = elem.requestFullscreen?.() ?? elem.webkitRequestFullscreen?.();
    // Depois do fullscreen, tenta deitar a tela sozinho (Android).
    // iOS/Safari não suportam o lock - ignorar sem quebrar.
    Promise.resolve(pedido)
      .then(() => screen.orientation?.lock?.('landscape'))
      .catch(() => {});
  };

  // O emulador é encerrado no cleanup do componente Emulator, então dá para sair
  // pela navegação normal. Antes era preciso recarregar a página inteira porque
  // o áudio continuava tocando.
  const sairDoJogo = () => navigate('/');

  // Sorteia sem mexer no array do estado. O `.sort()` ordena no próprio lugar,
  // e um comparador aleatório não produz permutação uniforme. Medido em 200 mil
  // rodadas nos dois tamanhos que esta lista tem — 23 sem o banco e 31 com ele:
  // o primeiro do acervo saía em 10,5% e 8,3% dos sorteios, contra 3,2% e 3,1%
  // do último, quando o justo seriam 4,3% e 3,2% para todos. Na prática eram
  // sempre os mesmos jogos aparecendo.
  //
  // Fisher-Yates parcial embaralha só os itens que vão ser usados.
  const relacionados = useMemo(() => {
    const copia = [...outrosJogos];
    const quantos = Math.min(4, copia.length);

    for (let i = 0; i < quantos; i++) {
      const j = i + Math.floor(Math.random() * (copia.length - i));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }

    return copia.slice(0, quantos);
  }, [outrosJogos]);

  const enviarPrint = async (e) => {
    e.preventDefault();
    if (!sessao) return mostrarAviso('Você precisa estar logado', { erro: true });

    setEnviando(true);
    try {
      await enviarPrintDaMissao({
        userId: sessao.user.id,
        gameId,
        gameNome: jogoAtual.nome,
        arquivo,
      });

      setModalAberto(false);
      setArquivo(null);
      mostrarAviso('Missão enviada! O GM vai analisar seu print.');
    } catch (error) {
      // Arquivo errado tem mensagem própria e já explica o que fazer; o resto
      // é falha de rede ou do banco.
      mostrarAviso(
        error instanceof ArquivoInvalido
          ? error.message
          : 'Erro ao enviar: ' + error.message,
        true
      );
    } finally {
      setEnviando(false);
    }
  };

  useEffect(() => {
    // Sem isto, o erro (ou o jogo anterior) sobrevive à navegação entre jogos
    setJogoAtual(null);
    setErroJogo(null);

    let ativo = true;

    const buscarJogoAtual = async () => {
      const doCatalogo = acharJogo(gameId);

      if (doCatalogo) {
        if (ativo) setJogoAtual(doCatalogo);
        return;
      }

      try {
        const doBanco = await obterJogo(gameId);
        if (!ativo) return;

        if (!doBanco) {
          setErroJogo('Não encontramos esse jogo no acervo.');
          return;
        }

        setJogoAtual(doBanco);
      } catch (e) {
        console.error('Erro ao obter o jogo:', e);
        if (ativo) setErroJogo('Não encontramos esse jogo no acervo.');
      }
    };

    const buscarOutrosJogos = async () => {
      const doCatalogo = outrosDoAcervo(gameId);

      try {
        const doBanco = await listarOutros(gameId, 8);
        if (!ativo) return;
        setOutrosJogos(doBanco?.length ? [...doBanco, ...doCatalogo] : doCatalogo);
      } catch (e) {
        console.error('Erro ao buscar outros jogos:', e);
        // O acervo do código sozinho já enche a lista de relacionados.
        if (ativo) setOutrosJogos(doCatalogo);
      }
    };

    buscarJogoAtual();
    buscarOutrosJogos();

    return () => {
      ativo = false;
    };
  }, [gameId]);

  return (
    <div className="sala">
      {/* Escondidos por CSS, nunca desmontados: o iframe do GPT não sobrevive a
          uma remontagem, porque googletag.display só roda uma vez por slot */}
      <aside className="sala__lateral sala__lateral--esquerda">
        <h2 className="sala__rotulo-anuncio">Publicidade</h2>
        <AnuncioGPT adId="div-gpt-ad-1775680124469-0" />
      </aside>

      <main className="sala__principal">
        {erroJogo ? (
          <div className="sala__falha">
            <Gamepad size={40} aria-hidden="true" />
            {/* Um endereço é uma rota, e uma rota precisa de título de
                primeiro nível — inclusive quando o que ela mostra é um erro. */}
            <h1 className="sala__falha-titulo">Jogo não encontrado</h1>
            <EstadoErro>{erroJogo}</EstadoErro>
            <Botao para="/">
              <Home size={16} aria-hidden="true" /> Voltar para os jogos
            </Botao>
          </div>
        ) : !jogoAtual ? (
          <Carregando>Carregando jogo...</Carregando>
        ) : (
          <div className="sala__coluna">
            <div className="sala__tela" id="tela-do-jogo">
              <Emulator
                gameUrl={jogoAtual.rom_url}
                core={jogoAtual.core}
                onPronto={(emulador) => {
                  emuladorRef.current = emulador;
                }}
              />
            </div>

            <div className="barra-jogo">
              <button
                type="button"
                className="barra-jogo__botao barra-jogo__botao--sair"
                onClick={sairDoJogo}
              >
                <Home aria-hidden="true" /> Sair
              </button>

              <span className="barra-jogo__divisor" aria-hidden="true" />

              <button
                type="button"
                className="barra-jogo__botao"
                onClick={salvarJogo}
              >
                <Download aria-hidden="true" /> Salvar
              </button>
              <button
                type="button"
                className="barra-jogo__botao"
                onClick={carregarJogo}
              >
                <Upload aria-hidden="true" /> Carregar
              </button>
              <button
                type="button"
                className="barra-jogo__botao"
                onClick={reiniciarJogo}
              >
                <RotateCcw aria-hidden="true" /> Reiniciar
              </button>
              <button
                type="button"
                className="barra-jogo__botao barra-jogo__botao--tela-cheia"
                onClick={telaCheia}
              >
                <Maximize aria-hidden="true" /> Tela cheia
              </button>
            </div>

            <Aviso aviso={aviso} aoFechar={limparAviso} className="sala__aviso" />

            {/* Escondido por CSS no celular deitado, onde a tela inteira é do
                jogo. Antes era desmontado por um ternário de JavaScript. */}
            <div className="sala__abaixo">
              <div className="painel-jogo">
                <div className="painel-jogo__texto">
                  <h1 className="painel-jogo__titulo">{jogoAtual.nome}</h1>

                  <p className="painel-jogo__ficha">
                    <span>
                      <Calendar size={14} aria-hidden="true" /> {jogoAtual.ano}
                    </span>
                    <span>
                      <Gamepad size={14} aria-hidden="true" />{' '}
                      {jogoAtual.fabricante}
                    </span>
                  </p>

                  <p className="painel-jogo__descricao">{jogoAtual.descricao}</p>
                </div>

                <div className="painel-missao">
                  <h2 className="painel-missao__titulo">
                    <Trophy size={20} aria-hidden="true" /> Missão de jogo
                  </h2>
                  <p className="painel-missao__texto">
                    Tire um print da sua maior pontuação ou do final do jogo e
                    nos envie!
                  </p>
                  <Botao
                    cheio
                    onClick={() =>
                      sessao
                        ? setModalAberto(true)
                        : mostrarAviso(
                            'Entre na sua conta para enviar o print',
                            true
                          )
                    }
                  >
                    Enviar print
                  </Botao>
                </div>
              </div>

              <section className="relacionados">
                <h2 className="relacionados__titulo">
                  <ArrowRight size={20} aria-hidden="true" /> Jogos relacionados
                </h2>

                <div className="relacionados__grade">
                  {relacionados.map((jogo) => (
                    <Link
                      key={jogo.id}
                      to={`/jogar/${jogo.id}`}
                      className="relacionados__card"
                    >
                      <CapaDeJogo
                        src={jogo.capa_url}
                        alt={jogo.nome}
                        tamanho="media"
                      />
                      <span className="relacionados__nome">{jogo.nome}</span>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Idem: escondido, nunca desmontado */}
      <aside className="sala__lateral sala__lateral--direita">
        <h2 className="sala__rotulo-anuncio">Publicidade</h2>
        <AnuncioGPT adId="div-gpt-ad-1775680168607-0" />
      </aside>

      {modalAberto && (
        <div className="modal">
          <div className="modal__caixa" role="dialog" aria-modal="true" aria-labelledby="titulo-missao">
            <button
              type="button"
              className="modal__fechar"
              onClick={() => setModalAberto(false)}
              aria-label="Fechar"
            >
              <X size={24} aria-hidden="true" />
            </button>

            <h2 className="modal__titulo" id="titulo-missao">
              <Trophy size={22} aria-hidden="true" /> Enviar missão
            </h2>

            <form onSubmit={enviarPrint} className="modal__formulario">
              <Campo
                tipo="file"
                accept="image/*"
                rotulo="Print da tela"
                ajuda="Use o print nativo do aparelho, não foto da tela"
                onChange={(e) => setArquivo(e.target.files[0])}
              />

              <Botao type="submit" cheio disabled={enviando}>
                {enviando ? 'Enviando...' : 'Confirmar envio'}
              </Botao>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameRoom;
