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




  // No desktop a grade fica na coluna do meio, entre os Desafios e o Top 5.
  // São 4 colunas fixas para os 12 jogos da página fecharem 3 linhas cheias,
  // sem sobrar órfãos na última. Em telas menores ela continua embaixo, para
  // não deslocar os blocos de anúncio das laterais.
  const gradeDeJogos = (
    <>
      <div className="home__grade">
        {loadingGames ? (
          <p className="estado-carregando">Carregando...</p>
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
          <p className="estado-vazio">Nenhum jogo encontrado.</p>
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
    </>
  );

  return (
    <div className="home">
      <CabecalhoHome
        session={session}
        pontos={pontos}
        nomeUsuario={nomeUsuario}
        aoSair={handleLogout}
      />

      <main className="home__conteudo">
        <section className="home__secao">
          <div className="home__coluna home__coluna--esquerda">
            <AnuncioGPT adId="div-gpt-ad-1775680124469-0" />

            <CardDesafios missoes={missoes} carregando={loadingMissoes} />
          </div>

          <div className="home__coluna home__coluna--centro">
            <img
              src="/logo.webp"
              alt="Sopra Fitas"
              width="700"
              height="374"
              fetchPriority="high"
              decoding="async"
              className="home__logo"
            />

            <div className="home__busca">
              <div className="home__busca-campo">
                <Search className="home__busca-icone" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Busque por jogo..."
                  value={busca}
                  onChange={(e) => mudarBusca(e.target.value)}
                  className="home__busca-entrada"
                  aria-label="Buscar jogo pelo nome"
                />
              </div>

              <button
                onClick={jogarAleatorio}
                aria-label="Jogar um jogo aleatório"
                className="home__sorteio"
              >
                <Dices size={24} aria-hidden="true" />
              </button>
            </div>

            <div className="home__filtros">
              {categorias.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => mudarFiltro(cat)}
                  className="home__filtro"
                  aria-pressed={filtroConsole === cat}
                >
                  {cat}
                </button>
              ))}
            </div>

            {!isTablet && (
              <div className="home__grade-desktop">{gradeDeJogos}</div>
            )}
          </div>

          <div className="home__coluna home__coluna--direita">
            <AnuncioGPT adId="div-gpt-ad-1775680168607-0" />

            <CardTop5 ranking={ranking} carregando={loadingRanking} />
          </div>
        </section>

        {isTablet && gradeDeJogos}
      </main>

      <footer className="home__rodape">
        <p>&copy; 2026 Winup Network - {jogos.length} jogos disponíveis.</p>
      </footer>
    </div>
  );
};

export default Home;
