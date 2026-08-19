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
import { CATEGORIAS, normalizarConsole } from '../constants/consoles';
import { paraComparar } from '../lib/texto';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useFavoritos } from '../hooks/useFavoritos';
import { useSessao } from '../hooks/useSessao';
import { useCatalogo } from '../hooks/useCatalogo';
import AnuncioGPT from '../components/AnuncioGPT';
import CabecalhoHome from '../components/home/CabecalhoHome';
import CardDesafios from '../components/home/CardDesafios';
import CardTop5 from '../components/home/CardTop5';
import CardDeJogo from '../components/home/CardDeJogo';
import Paginacao from '../components/home/Paginacao';

const Home = () => {
  const navigate = useNavigate();

  const { isMobile, isTablet } = useBreakpoint();
  const { favoritos, alternar: toggleFavorito } = useFavoritos();
  const { session, pontos, nome: nomeUsuario, sair } = useSessao();
  const { jogos, carregando: loadingGames } = useCatalogo();

  const [ranking, setRanking] = useState([]);
  const [missoes, setMissoes] = useState([]);
  const [loadingRanking, setLoadingRanking] = useState(true);
  const [loadingMissoes, setLoadingMissoes] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroConsole, setFiltroConsole] = useState('Todos');
  const [paginaAtual, setPaginaAtual] = useState(1);

  useEffect(() => {
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
  }, []);

  const jogosPorPagina = 12;

  // Mudar busca ou categoria volta para a primeira página. Feito aqui, junto da
  // ação, em vez de num efeito que reage à mudança — o efeito causava um render
  // extra em cascata.
  const mudarBusca = (valor) => {
    setBusca(valor);
    setPaginaAtual(1);
  };

  const mudarFiltro = (categoria) => {
    setFiltroConsole(categoria);
    setPaginaAtual(1);
  };

  const handleLogout = async () => {
    await sair();
    alert('Você saiu da conta! Até mais 👋');
  };

  const jogarAleatorio = () => {
    if (jogos.length === 0) return;
    const indiceAleatorio = Math.floor(Math.random() * jogos.length);
    const jogoSorteado = jogos[indiceAleatorio];
    navigate(`/jogar/${jogoSorteado.id}`);
  };

  const categorias = CATEGORIAS;

  // Set em vez de array: o card consultava favoritos.includes duas vezes,
  // dentro do map — busca linear por item renderizado.
  const favoritosSet = new Set(favoritos);

  const termoBusca = paraComparar(busca);

  const jogosFiltrados = jogos.filter((jogo) => {
    // Compara sem acento: "pokemon" precisa encontrar "Pokémon"
    const bateBusca = paraComparar(jogo.nome).includes(termoBusca);

    let bateCategoria = true;
    if (filtroConsole === '❤️ Favoritos') {
      bateCategoria = favoritosSet.has(jogo.id);
    } else if (filtroConsole !== 'Todos') {
      // O console vem do banco como texto livre; normalizar antes de comparar
      bateCategoria = normalizarConsole(jogo.console) === filtroConsole;
    }

    return bateBusca && bateCategoria;
  });

  const totalPaginas = Math.ceil(jogosFiltrados.length / jogosPorPagina);

  // Desfavoritar o último item de uma página faz essa página deixar de existir.
  // Limitar aqui, no render, evita a tela vazia sem resetar a navegação a cada
  // coração clicado — que era o efeito colateral de observar `favoritos`.
  const paginaValida = Math.min(paginaAtual, Math.max(1, totalPaginas));

  const jogosExibidos = jogosFiltrados.slice(
    (paginaValida - 1) * jogosPorPagina,
    paginaValida * jogosPorPagina
  );

  const mudarPagina = (pagina) => {
    setPaginaAtual(pagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <CabecalhoHome
        session={session}
        pontos={pontos}
        nomeUsuario={nomeUsuario}
        aoSair={handleLogout}
        isMobile={isMobile}
      />

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

            <CardDesafios missoes={missoes} carregando={loadingMissoes} />
          </div>

          <div
            style={{
              textAlign: 'center',
              order: 1,
              minWidth: 0,
            }}
          >
            <img
              src="/logo.webp"
              alt="Sopra Fitas"
              width="700"
              height="374"
              fetchPriority="high"
              decoding="async"
              style={{
                maxWidth: isMobile ? '220px' : '350px',
                width: '100%',
                height: 'auto',
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
                  onChange={(e) => mudarBusca(e.target.value)}
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
                aria-label="Jogar um jogo aleatório"
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
                  onClick={() => mudarFiltro(cat)}
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

            <CardTop5 ranking={ranking} carregando={loadingRanking} />
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
              <CardDeJogo
                key={jogo.id}
                jogo={jogo}
                favorito={favoritosSet.has(jogo.id)}
                aoAlternarFavorito={toggleFavorito}
                isMobile={isMobile}
              />
            ))
          ) : (
            <span style={{ color: '#666' }}>Nenhum jogo encontrado.</span>
          )}
        </div>

        {!loadingGames && (
          <Paginacao
            paginaAtual={paginaValida}
            totalPaginas={totalPaginas}
            aoMudar={mudarPagina}
            isMobile={isMobile}
          />
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
