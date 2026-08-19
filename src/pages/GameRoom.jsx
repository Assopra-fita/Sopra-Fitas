import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Emulator from '../components/Emulator';
import { supabase } from '../supabaseClient';
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
  Loader2,
  Home,
} from 'lucide-react';
import AnuncioGPT from '../components/AnuncioGPT';
import { gamesDb } from '../constants/games';
import { gravarEstado, lerEstado } from '../lib/estadoDeJogo';

// Lê as dimensões atuais da janela para decidir o layout.
// Precisa olhar a ALTURA também: celular deitado tem largura de desktop (740-930px)
// mas altura pequena, e sem isso a tela de jogo monta o layout de 3 colunas.
const getLayout = () => ({
  isMobile: window.innerWidth < 768 || window.innerHeight < 600,
  // Modo jogo: paisagem em tela baixa (celular). Tablet/desktop deitado não entra.
  isGameFocus: window.matchMedia(
    '(orientation: landscape) and (max-height: 600px)'
  ).matches,
});

const GameRoom = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [layout, setLayout] = useState(getLayout);
  const { isMobile, isGameFocus } = layout;

  const [modalAberto, setModalAberto] = useState(false);
  const [arquivo, setArquivo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [session, setSession] = useState(null);

  const [jogoAtual, setJogoAtual] = useState(null);
  const [erroJogo, setErroJogo] = useState(null);
  const [outrosJogos, setOutrosJogos] = useState([]);

  // A instância real do emulador, entregue pelo componente Emulator quando o
  // EmulatorJS termina de carregar. Antes daqui os botões chamavam métodos em
  // window.EJS_player, que é só uma string com o seletor CSS — nunca funcionaram.
  const emuladorRef = useRef(null);

  const [aviso, setAviso] = useState(null);
  const avisoTimerRef = useRef(null);

  const mostrarAviso = (texto, erro = false) => {
    clearTimeout(avisoTimerRef.current);
    setAviso({ texto, erro });
    avisoTimerRef.current = setTimeout(() => setAviso(null), 2800);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleResize = () => setLayout(getLayout());
    window.addEventListener('resize', handleResize);
    // O iOS às vezes reporta dimensões antigas no 'resize' durante a rotação
    window.addEventListener('orientationchange', handleResize);
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session));

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(avisoTimerRef.current);
    };
  }, [gameId]);

  const salvarJogo = async () => {
    const gerenciador = emuladorRef.current?.gameManager;
    if (!gerenciador) return mostrarAviso('O jogo ainda está carregando', true);

    try {
      await gravarEstado(gameId, gerenciador.getState());
      mostrarAviso('Progresso salvo neste aparelho');
    } catch (e) {
      console.error('Falha ao salvar o estado:', e);
      mostrarAviso('Não foi possível salvar', true);
    }
  };

  const carregarJogo = async () => {
    const gerenciador = emuladorRef.current?.gameManager;
    if (!gerenciador) return mostrarAviso('O jogo ainda está carregando', true);

    try {
      const estado = await lerEstado(gameId);
      if (!estado) return mostrarAviso('Nenhum progresso salvo aqui', true);

      gerenciador.loadState(estado);
      mostrarAviso('Progresso carregado');
    } catch (e) {
      console.error('Falha ao carregar o estado:', e);
      mostrarAviso('Não foi possível carregar', true);
    }
  };

  const reiniciarJogo = () => {
    const gerenciador = emuladorRef.current?.gameManager;
    if (!gerenciador) return mostrarAviso('O jogo ainda está carregando', true);

    gerenciador.restart();
    mostrarAviso('Jogo reiniciado');
  };

  const telaCheia = () => {
    const elem = document.getElementById('tela-do-jogo');
    if (elem) {
      const pedido =
        elem.requestFullscreen?.() ?? elem.webkitRequestFullscreen?.();
      // Depois do fullscreen, tenta deitar a tela sozinho (Android).
      // iOS/Safari não suportam o lock - ignorar sem quebrar.
      Promise.resolve(pedido)
        .then(() => screen.orientation?.lock?.('landscape'))
        .catch(() => {});
    }
  };

  // O emulador é encerrado no cleanup do componente Emulator, então dá para sair
  // pela navegação normal. Antes era preciso recarregar a página inteira porque
  // o áudio continuava tocando.
  const sairDoJogo = () => navigate('/');

  // No modo jogo os controles ficam compactos para sobrar altura ao emulador
  const estiloBotao = (extra) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    background: '#333',
    color: 'white',
    border: '1px solid #555',
    borderRadius: '5px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontSize: isGameFocus ? '0.7rem' : '0.8rem',
    padding: isGameFocus ? '5px 8px' : '8px 12px',
    ...extra,
  });
  const tamanhoIcone = isGameFocus ? 14 : 16;

  const relacionados = useMemo(
    () => outrosJogos.sort(() => 0.5 - Math.random()).slice(0, 2),
    [outrosJogos]
  );

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!arquivo) return alert('Selecione um print primeiro!');
    if (!session) return alert('Você precisa estar logado!');

    setUploading(true);
    try {
      const fileExt = arquivo.name.split('.').pop();
      const fileName = `${session.user.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('prints')
        .upload(fileName, arquivo);
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('prints').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('missoes').insert({
        user_id: session.user.id,
        game_id: gameId,
        game_nome: jogoAtual.nome,
        print_url: publicUrl,
        status: 'pendente',
      });

      if (dbError) throw dbError;

      alert('Missão enviada! 🚀 O GM analisará seu print.');
      setModalAberto(false);
      setArquivo(null);
    } catch (error) {
      alert('Erro ao enviar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    // Sem isto, o erro (ou o jogo anterior) sobrevive à navegação entre jogos
    setJogoAtual(null);
    setErroJogo(null);

    const fetchCurrentGame = async () => {
      const currentGameDb = gamesDb[gameId];

      if (currentGameDb) {
        setJogoAtual(currentGameDb);
        return;
      }

      const { data: currentGame, error: currentGameError } = await supabase
        .from('jogos')
        .select('*')
        .eq('id', gameId)
        .single();

      if (currentGameError || !currentGame) {
        console.error('Erro ao obter o jogo:', currentGameError);
        setErroJogo('Não encontramos esse jogo no acervo.');
        return;
      }

      setJogoAtual(currentGame);
    };

    const fetchOtherGames = async () => {
      const { data: otherGames, error: otherGamesError } = await supabase
        .from('jogos')
        .select('*')
        .neq('id', gameId)
        .limit(2);

      const gamesDbToArray = Object.values(gamesDb).filter(
        (jogo) => jogo.id !== gameId
      );

      setOutrosJogos(() => {
        if (otherGames && otherGames.length > 0 && !otherGamesError) {
          return [...otherGames, ...gamesDbToArray];
        }

        return gamesDbToArray;
      });
    };

    fetchCurrentGame();
    fetchOtherGames();
  }, [gameId]);

  return (
    <div
      className={isGameFocus ? 'game-shell--focus' : 'game-shell'}
      style={{
        display: 'flex',
        background: '#121212',
        color: 'white',
        fontFamily: '"Inter", sans-serif',
        justifyContent: 'center',
        ...(isGameFocus
          ? {
              // Modo jogo: sem rolagem nem quebra de linha (altura vem do CSS)
              flexWrap: 'nowrap',
              flexDirection: 'column',
              overflow: 'hidden',
              // Deitado o notch fica na lateral
              paddingLeft: 'env(safe-area-inset-left)',
              paddingRight: 'env(safe-area-inset-right)',
            }
          : { flexWrap: 'wrap' }),
      }}
    >
      {/* Escondido por CSS, nunca desmontado: o iframe do GPT não sobrevive a
          uma remontagem (googletag.display só roda uma vez por slot) */}
      <aside
        style={{
          width: isMobile ? '100%' : '300px',
          background: '#1e1e1e',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRight: isMobile ? 'none' : '1px solid #333',
          borderBottom: isMobile ? '1px solid #333' : 'none',
          order: isMobile ? 3 : 1,
          ...(isGameFocus ? { display: 'none' } : {}),
        }}
      >
        <h4 style={{ color: '#555', marginBottom: '10px' }}>Publicidade</h4>
        <AnuncioGPT adId="div-gpt-ad-1775680124469-0" />
      </aside>

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          order: 2,
          ...(isGameFocus
            ? { minWidth: 0, minHeight: 0, padding: 0 }
            : { minWidth: '320px', maxWidth: '1000px', padding: '20px' }),
        }}
      >
        {jogoAtual ? (
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              ...(isGameFocus ? { flex: 1, minHeight: 0 } : {}),
            }}
          >
            <div
              id="tela-do-jogo"
              style={{
                background: 'black',
                boxShadow: '0 0 50px rgba(0,0,0,0.8)',
                overflow: 'hidden',
                aspectRatio: '4/3',
                ...(isGameFocus
                  ? {
                      // Deitado quem manda é a altura: a largura sai do aspect-ratio
                      flex: '1 1 0',
                      minHeight: 0,
                      width: 'auto',
                      maxWidth: '100%',
                      borderRadius: 0,
                      border: 'none',
                    }
                  : {
                      width: '100%',
                      borderRadius: '10px 10px 0 0',
                      border: '2px solid #333',
                      borderBottom: 'none',
                    }),
              }}
            >
              <Emulator
                gameUrl={jogoAtual.rom_url}
                core={jogoAtual.core}
                onPronto={(emulador) => {
                  emuladorRef.current = emulador;
                }}
              />
            </div>

            <div
              style={{
                width: '100%',
                background: '#252525',
                borderTop: '1px solid #444',
                display: 'flex',
                justifyContent: 'center',
                ...(isGameFocus
                  ? {
                      flexShrink: 0,
                      flexWrap: 'nowrap',
                      overflowX: 'auto',
                      padding: '4px',
                      gap: '6px',
                      paddingBottom: 'calc(4px + env(safe-area-inset-bottom))',
                    }
                  : {
                      padding: '10px',
                      gap: '10px',
                      flexWrap: 'wrap',
                      borderRadius: '0 0 10px 10px',
                      border: '2px solid #333',
                      marginBottom: '20px',
                    }),
              }}
            >
              <button
                onClick={sairDoJogo}
                style={estiloBotao({
                  background: '#7f1d1d',
                  border: '1px solid #991b1b',
                  fontWeight: 'bold',
                })}
              >
                <Home size={tamanhoIcone} /> Sair
              </button>
              <div
                style={{ width: '1px', background: '#444', margin: '0 5px' }}
              ></div>
              <button onClick={salvarJogo} style={estiloBotao()}>
                <Download size={tamanhoIcone} /> Salvar
              </button>
              <button onClick={carregarJogo} style={estiloBotao()}>
                <Upload size={tamanhoIcone} /> Carregar
              </button>
              <button onClick={reiniciarJogo} style={estiloBotao()}>
                <RotateCcw size={tamanhoIcone} /> Reiniciar
              </button>
              <button
                onClick={telaCheia}
                style={estiloBotao({
                  background: '#fbbf24',
                  color: '#000',
                  border: 'none',
                  fontWeight: 'bold',
                })}
              >
                <Maximize size={tamanhoIcone} /> Tela Cheia
              </button>
            </div>

            {aviso && (
              <div
                role="status"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  padding: '6px 10px',
                  color: aviso.erro ? '#ff9d9d' : '#9de8b6',
                  background: aviso.erro ? '#3a1c1e' : '#16301f',
                  borderBottom: `1px solid ${aviso.erro ? '#7f1d1d' : '#1c6440'}`,
                  ...(isGameFocus ? { flexShrink: 0 } : { marginTop: '-20px', marginBottom: '20px' }),
                }}
              >
                {aviso.texto}
              </div>
            )}

            {!isGameFocus && (
              <>
                <div
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '20px',
                    background: '#1e1e1e',
                    borderRadius: '10px',
                    border: '1px solid #333',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '20px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>
                        {jogoAtual.nome}
                      </h1>
                      <div
                        style={{
                          display: 'flex',
                          gap: '15px',
                          color: '#888',
                          marginBottom: '15px',
                          fontSize: '0.9rem',
                        }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <Calendar size={14} /> {jogoAtual.ano}
                        </span>
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <Gamepad size={14} /> {jogoAtual.fabricante}
                        </span>
                      </div>
                      <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                        {jogoAtual.descricao}
                      </p>
                    </div>

                    <div
                      style={{
                        background: '#252525',
                        padding: '20px',
                        borderRadius: '10px',
                        border: '1px solid #333',
                        width: isMobile ? '100%' : '300px',
                      }}
                    >
                      <h3
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '10px',
                          color: '#fbbf24',
                        }}
                      >
                        <Trophy size={20} /> Missão de Jogo
                      </h3>
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: '#aaa',
                          marginBottom: '15px',
                        }}
                      >
                        Tire um print da sua maior pontuação ou do final do jogo
                        e nos envie!
                      </p>
                      <button
                        onClick={() =>
                          session
                            ? setModalAberto(true)
                            : mostrarAviso(
                                'Entre na sua conta para enviar o print',
                                true
                              )
                        }
                        style={{
                          width: '100%',
                          background: '#fbbf24',
                          color: '#000',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '5px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                        }}
                      >
                        Enviar Print
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    width: '100%',
                    marginTop: '30px',
                    textAlign: 'left',
                  }}
                >
                  <h3
                    style={{
                      marginBottom: '20px',
                      color: '#888',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <ArrowRight size={20} /> Jogos Relacionados
                  </h3>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fill, minmax(150px, 1fr))',
                      gap: '20px',
                    }}
                  >
                    {relacionados.map((jogo) => (
                      <Link
                        key={jogo.id}
                        to={`/jogar/${jogo.id}`}
                        style={{
                          textDecoration: 'none',
                          color: 'white',
                          background: '#1e1e1e',
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid #333',
                          transition: '0.3s',
                        }}
                      >
                        <img
                          src={jogo.capa_url}
                          alt={jogo.nome}
                          style={{
                            width: '100%',
                            borderRadius: '5px',
                            marginBottom: '10px',
                          }}
                        />
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            display: 'block',
                          }}
                        >
                          {jogo.nome}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : erroJogo ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Gamepad size={40} style={{ color: '#ff9d9d', marginBottom: '10px' }} />
            <p style={{ marginBottom: '20px' }}>{erroJogo}</p>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#fbbf24',
                color: '#000',
                padding: '10px 20px',
                borderRadius: '6px',
                fontWeight: 'bold',
                textDecoration: 'none',
              }}
            >
              <Home size={16} /> Voltar para os jogos
            </Link>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Loader2
              size={40}
              className="animate-spin"
              style={{ color: '#fbbf24', marginBottom: '10px' }}
            />
            <p>Carregando jogo...</p>
          </div>
        )}
      </main>

      {/* Idem: escondido, nunca desmontado */}
      <aside
        style={{
          width: isMobile ? '100%' : '300px',
          background: '#1e1e1e',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderLeft: isMobile ? 'none' : '1px solid #333',
          borderTop: isMobile ? '1px solid #333' : 'none',
          order: 4,
          ...(isGameFocus ? { display: 'none' } : {}),
        }}
      >
        <h4 style={{ color: '#555', marginBottom: '10px' }}>Publicidade</h4>
        <AnuncioGPT adId="div-gpt-ad-1775680168607-0" />
      </aside>

      {modalAberto && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#1e1e1e',
              padding: '30px',
              borderRadius: '15px',
              maxWidth: '400px',
              width: '100%',
              border: '1px solid #333',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setModalAberto(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                color: '#555',
                cursor: 'pointer',
              }}
            >
              <X size={24} />
            </button>
            <h2
              style={{
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Trophy style={{ color: '#fbbf24' }} /> Enviar Missão
            </h2>
            <form onSubmit={handleUpload}>
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '10px',
                    color: '#888',
                    fontSize: '0.9rem',
                  }}
                >
                  Selecione o print da tela:
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setArquivo(e.target.files[0])}
                  style={{ width: '100%', color: '#888' }}
                />
              </div>
              <button
                type="submit"
                disabled={uploading}
                style={{
                  width: '100%',
                  background: uploading ? '#444' : '#fbbf24',
                  color: '#000',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '5px',
                  fontWeight: 'bold',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                }}
              >
                {uploading ? (
                  <Loader2
                    className="animate-spin"
                    style={{ margin: '0 auto' }}
                  />
                ) : (
                  'Confirmar Envio'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameRoom;
