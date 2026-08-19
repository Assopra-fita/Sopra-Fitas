import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  Search,
  Heart,
  Dices,
  User,
  LogOut,
  Coins,
  Crown,
  Medal,
  Target,
  Star,
} from 'lucide-react';
import { games } from '../constants/games';
import { CATEGORIAS, normalizarConsole } from '../constants/consoles';
import AnuncioGPT from '../components/AnuncioGPT';

const Home = () => {
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [pontos, setPontos] = useState(0);
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [ranking, setRanking] = useState([]);
  const [missoes, setMissoes] = useState([]);
  const [loadingRanking, setLoadingRanking] = useState(true);
  const [loadingMissoes, setLoadingMissoes] = useState(true);
  const [loadingGames, setLoadingGames] = useState(true);
  const [jogos, setJogos] = useState(games);
  const [busca, setBusca] = useState('');
  const [filtroConsole, setFiltroConsole] = useState('Todos');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  const [favoritos, setFavoritos] = useState(() => {
    const salvos = localStorage.getItem('sopra-fitas-favs');
    return salvos ? JSON.parse(salvos) : [];
  });

  const isMobile = screenWidth <= 768;
  const isTablet = screenWidth <= 1100;

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('sopra-fitas-favs', JSON.stringify(favoritos));
  }, [favoritos]);

  useEffect(() => {
    const fetchJogos = async () => {
      try {
        const { data, error } = await supabase.from('jogos').select('*');
        if (error) throw error;

        if (data && data.length > 0) {
          setJogos([...data, ...games]);
        }
      } catch (error) {
        console.error('Erro ao buscar jogos:', error);
      } finally {
        setLoadingGames(false);
      }
    };

    fetchJogos();
  }, []);

  useEffect(() => {
    const fetchDados = async (userId) => {
      const { data: perfil } = await supabase
        .from('profiles')
        .select('pontos, nome')
        .eq('id', userId)
        .single();

      if (perfil) {
        setPontos(perfil.pontos);
        setNomeUsuario(perfil.nome);
      }
    };

    const fetchRanking = async () => {
      setLoadingRanking(true);
      const { data } = await supabase
        .from('profiles')
        .select('nome, pontos')
        .order('pontos', { ascending: false })
        .limit(5);

      if (data) setRanking(data);
      setLoadingRanking(false);
    };

    const fetchMissoes = async () => {
      setLoadingMissoes(true);
      const { data } = await supabase
        .from('missoes_globais')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setMissoes(data);
      setLoadingMissoes(false);
    };

    fetchRanking();
    fetchMissoes();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchDados(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchDados(session.user.id);
      } else {
        setPontos(0);
        setNomeUsuario('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const jogosPorPagina = 12;

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, filtroConsole]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    alert('Você saiu da conta! Até mais 👋');
  };

  const toggleFavorito = (id) => {
    setFavoritos((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  const jogarAleatorio = () => {
    if (jogos.length === 0) return;
    const indiceAleatorio = Math.floor(Math.random() * jogos.length);
    const jogoSorteado = jogos[indiceAleatorio];
    navigate(`/jogar/${jogoSorteado.id}`);
  };

  const categorias = CATEGORIAS;

  const termoBusca = busca.toLowerCase();

  const jogosFiltrados = jogos.filter((jogo) => {
    const nomeJogo = jogo.nome || '';
    const bateBusca = nomeJogo.toLowerCase().includes(termoBusca);

    let bateCategoria = true;
    if (filtroConsole === '❤️ Favoritos') {
      bateCategoria = favoritos.includes(jogo.id);
    } else if (filtroConsole !== 'Todos') {
      // O console vem do banco como texto livre; normalizar antes de comparar
      bateCategoria = normalizarConsole(jogo.console) === filtroConsole;
    }

    return bateBusca && bateCategoria;
  });

  const totalPaginas = Math.ceil(jogosFiltrados.length / jogosPorPagina);
  const jogosExibidos = jogosFiltrados.slice(
    (paginaAtual - 1) * jogosPorPagina,
    paginaAtual * jogosPorPagina
  );

  const mudarPagina = (pagina) => {
    setPaginaAtual(pagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const gerarNumerosPagina = () => {
    const paginas = [];
    const maxBotoes = isMobile ? 5 : 7;

    if (totalPaginas <= maxBotoes) {
      for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
    } else {
      paginas.push(1);
      let inicio = Math.max(2, paginaAtual - 1);
      let fim = Math.min(totalPaginas - 1, paginaAtual + 1);

      if (paginaAtual <= 3) {
        fim = Math.min(maxBotoes - 2, totalPaginas - 1);
      } else if (paginaAtual >= totalPaginas - 2) {
        inicio = Math.max(2, totalPaginas - (maxBotoes - 3));
      }

      if (inicio > 2) paginas.push('...');
      for (let i = inicio; i <= fim; i++) paginas.push(i);
      if (fim < totalPaginas - 1) paginas.push('...');
      paginas.push(totalPaginas);
    }

    return paginas;
  };

  const getIconeRank = (index) => {
    if (index === 0) return <Crown size={14} color="#fca311" fill="#fca311" />;
    if (index === 1) return <Medal size={14} color="#C0C0C0" />;
    if (index === 2) return <Medal size={14} color="#CD7F32" />;

    return (
      <span style={{ color: '#666', fontSize: '0.7rem', fontWeight: 'bold' }}>
        #{index + 1}
      </span>
    );
  };

  const cardLateralStyle = {
    background: 'rgba(20, 20, 20, 0.92)',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '15px',
    textAlign: 'left',
    boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #121212, #1a1a2e)',
        fontFamily: '"Inter", sans-serif',
        color: 'white',
        overflowX: 'hidden',
      }}
    >
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: isMobile ? '12px 16px' : '15px 30px',
          background: 'rgba(18, 18, 18, 0.95)',
          borderBottom: '1px solid #333',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }} />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            justifyContent: isMobile ? 'center' : 'flex-end',
            width: isMobile ? '100%' : 'auto',
          }}
        >
          {session ? (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#000',
                  padding: '6px 15px',
                  borderRadius: '20px',
                  border: '1px solid #fca311',
                }}
              >
                <Coins size={16} color="#fca311" />
                <span
                  style={{
                    color: '#fca311',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                  }}
                >
                  {pontos}
                </span>
              </div>

              <Link to="/perfil">
                <button
                  style={{
                    background: '#252525',
                    color: '#fff',
                    border: '1px solid #666',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <User size={16} /> {nomeUsuario || 'Meu Perfil'}
                </button>
              </Link>

              <button
                onClick={handleLogout}
                style={{
                  background: '#333',
                  color: '#ff4d4d',
                  border: '1px solid #444',
                  padding: '8px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                }}
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link to="/login">
              <button
                style={{
                  background: 'linear-gradient(45deg, #fca311, #ffc300)',
                  color: '#1a1a2e',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <User size={16} /> ENTRAR
              </button>
            </Link>
          )}
        </div>
      </div>

      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: isMobile ? '120px 14px 40px' : '100px 20px 40px',
          width: '100%',
          flex: 1,
          boxSizing: 'border-box',
        }}
      >
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: isTablet
              ? '1fr'
              : '260px minmax(0, 1fr) 240px',
            gap: '20px',
            alignItems: 'start',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              order: isTablet ? 2 : 1,
            }}
          >
            <AnuncioGPT adId="div-gpt-ad-1775680124469-0" />

            <div
              style={{
                ...cardLateralStyle,
                border: '1px solid #b77a09',
                boxShadow: '0 4px 15px rgba(224, 168, 16, 0.18)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderBottom: '1px solid #333',
                  paddingBottom: '5px',
                  marginBottom: '10px',
                }}
              >
                <Target size={18} color="#ad630f" />
                <span
                  style={{
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                  }}
                >
                  DESAFIOS DO MÊS
                </span>
              </div>

              {/* Rolagem própria: sem o teto, cada desafio novo alonga esta
                  coluna e aumenta o vão embaixo dos filtros, já que a grade de
                  jogos só começa depois da coluna mais alta da section */}
              <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                {loadingMissoes ? (
                  <span style={{ color: '#666', fontSize: '0.8rem' }}>
                    Buscando missões...
                  </span>
                ) : missoes.length === 0 ? (
                  <span style={{ color: '#555', fontSize: '0.75rem' }}>
                    Nenhum desafio no momento.
                  </span>
                ) : (
                  missoes.map((missao, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        padding: '8px',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        borderLeft: '3px solid #b78009',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          color: '#7209b7',
                          marginBottom: '2px',
                        }}
                      >
                        {missao.titulo}
                      </div>

                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: '#aaa',
                          lineHeight: '1.2',
                        }}
                      >
                        {missao.objetivo}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '4px',
                        }}
                      >
                        <Star size={10} color="#fca311" fill="#fca311" />
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: '#fca311',
                            fontWeight: 'bold',
                          }}
                        >
                          +{missao.recompensa} pts
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              textAlign: 'center',
              order: 1,
              minWidth: 0,
            }}
          >
            <img
              src="/logo.jpg"
              alt="Logo"
              style={{
                maxWidth: isMobile ? '220px' : '350px',
                width: '100%',
                marginBottom: '20px',
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                maxWidth: '600px',
                margin: '0 auto 20px',
                flexDirection: isMobile ? 'column' : 'row',
              }}
            >
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  color="#666"
                  style={{ position: 'absolute', left: '15px', top: '12px' }}
                />
                <input
                  type="text"
                  placeholder="Busque por jogo..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 45px',
                    borderRadius: '30px',
                    border: '1px solid #333',
                    background: '#1e1e1e',
                    color: 'white',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                onClick={jogarAleatorio}
                style={{
                  background: 'linear-gradient(45deg, #ff00cc, #333399)',
                  border: 'none',
                  borderRadius: isMobile ? '14px' : '50%',
                  width: isMobile ? '100%' : '50px',
                  height: '50px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Dices color="white" size={24} />
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFiltroConsole(cat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    background: filtroConsole === cat ? '#fca311' : '#242424',
                    color: filtroConsole === cat ? '#1a1a2e' : '#aaa',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              order: isTablet ? 3 : 3,
            }}
          >
            <AnuncioGPT adId="div-gpt-ad-1775680168607-0" />

            <div
              style={{
                ...cardLateralStyle,
                background: 'rgba(30, 30, 30, 0.9)',
                boxShadow: '0 4px 15px rgba(168, 99, 9, 0.25)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #333',
                  paddingBottom: '5px',
                  marginBottom: '8px',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    color: '#fca311',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                  }}
                >
                  TOP 5
                </span>
                <Link
                  to="/ranking"
                  style={{
                    fontSize: '0.7rem',
                    color: '#888',
                    textDecoration: 'none',
                  }}
                >
                  Ver tudo
                </Link>
              </div>

              {loadingRanking ? (
                <span style={{ color: '#666', fontSize: '0.8rem' }}>
                  Carregando...
                </span>
              ) : (
                ranking.map((user, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      padding: '6px 0',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        minWidth: 0,
                      }}
                    >
                      {getIconeRank(idx)}
                      <span
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {user.nome || '---'}
                      </span>
                    </div>
                    <span style={{ color: '#fca311', fontWeight: 'bold' }}>
                      {user.pontos}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? 'repeat(2, minmax(0, 1fr))'
              : 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: isMobile ? '14px' : '20px',
          }}
        >
          {loadingGames ? (
            <span style={{ color: '#666' }}>Carregando...</span>
          ) : jogosExibidos.length > 0 ? (
            jogosExibidos.map((jogo) => (
              <div
                key={jogo.id}
                style={{
                  background: '#242038',
                  borderRadius: '12px',
                  padding: isMobile ? '10px' : '12px',
                  textAlign: 'center',
                  border: '1px solid #333',
                  position: 'relative',
                  minWidth: 0,
                }}
              >
                <button
                  onClick={() => toggleFavorito(jogo.id)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    zIndex: 10,
                    padding: '5px',
                  }}
                >
                  <Heart
                    size={18}
                    color={favoritos.includes(jogo.id) ? '#ff4d4d' : 'white'}
                    fill={favoritos.includes(jogo.id) ? '#ff4d4d' : 'none'}
                  />
                </button>

                <div
                  style={{
                    height: isMobile ? '130px' : '160px',
                    marginBottom: '10px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#000',
                  }}
                >
                  <img
                    src={jogo.capa_url}
                    alt={jogo.nome}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>

                <h3
                  style={{
                    fontSize: isMobile ? '0.78rem' : '0.85rem',
                    color: '#fff',
                    marginBottom: '5px',
                    height: isMobile ? '32px' : '35px',
                    overflow: 'hidden',
                  }}
                >
                  {jogo.nome}
                </h3>

                <span
                  style={{
                    fontSize: '0.7rem',
                    color: '#aaa',
                    display: 'block',
                    marginBottom: '10px',
                  }}
                >
                  {jogo.console}
                </span>

                <Link to={`/jogar/${jogo.id}`}>
                  <button
                    style={{
                      background: '#fca311',
                      color: '#1a1a2e',
                      border: 'none',
                      padding: '8px 0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      width: '100%',
                      fontWeight: 'bold',
                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                    }}
                  >
                    JOGAR
                  </button>
                </Link>
              </div>
            ))
          ) : (
            <span style={{ color: '#666' }}>Nenhum jogo encontrado.</span>
          )}
        </div>

        {!loadingGames && totalPaginas > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px',
              marginTop: '30px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => mudarPagina(paginaAtual - 1)}
              disabled={paginaAtual === 1}
              style={{
                background: paginaAtual === 1 ? '#1a1a1a' : '#242424',
                color: paginaAtual === 1 ? '#444' : '#fff',
                border: '1px solid #333',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: paginaAtual === 1 ? 'default' : 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem',
              }}
            >
              &lt;
            </button>

            {gerarNumerosPagina().map((item, idx) =>
              item === '...' ? (
                <span
                  key={`dots-${idx}`}
                  style={{ color: '#666', padding: '0 4px' }}
                >
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => mudarPagina(item)}
                  style={{
                    background: paginaAtual === item ? '#fca311' : '#242424',
                    color: paginaAtual === item ? '#1a1a2e' : '#aaa',
                    border: paginaAtual === item ? 'none' : '1px solid #333',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    minWidth: '38px',
                  }}
                >
                  {item}
                </button>
              )
            )}

            <button
              onClick={() => mudarPagina(paginaAtual + 1)}
              disabled={paginaAtual === totalPaginas}
              style={{
                background:
                  paginaAtual === totalPaginas ? '#1a1a1a' : '#242424',
                color: paginaAtual === totalPaginas ? '#444' : '#fff',
                border: '1px solid #333',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: paginaAtual === totalPaginas ? 'default' : 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem',
              }}
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      <footer
        style={{
          textAlign: 'center',
          padding: '20px',
          borderTop: '1px solid #333',
          color: '#666',
          fontSize: isMobile ? '0.8rem' : '1rem',
        }}
      >
        <p>&copy; 2026 Winup Network - {jogos.length} jogos disponíveis.</p>
      </footer>
    </div>
  );
};

export default Home;
