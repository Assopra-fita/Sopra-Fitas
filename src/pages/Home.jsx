import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { listarRanking } from '../services/perfis';
import { listarDesafios } from '../services/desafios';
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
import { Aviso } from '../components/ui';
import Paginacao from '../components/home/Paginacao';
import { useTituloDaPagina } from '../hooks/useTituloDaPagina';
import { useAviso } from '../hooks/useAviso';

// Quanto o campo espera parar de digitar antes de escrever na URL.
const ATRASO_DA_BUSCA = 250;

const Home = () => {
  useTituloDaPagina();

  const { aviso, mostrarAviso, limparAviso } = useAviso();

  const navigate = useNavigate();

  // isMobile continua vindo do JavaScript porque decide CONTEÚDO, não
  // aparência: quantos números a paginação mostra. O resto do layout é CSS.
  const { isMobile } = useBreakpoint();
  const { favoritos, alternar: toggleFavorito } = useFavoritos();
  const { session, pontos, nome: nomeUsuario, sair } = useSessao();
  const { jogos, carregando: loadingGames } = useCatalogo();

  const [ranking, setRanking] = useState([]);
  const [missoes, setMissoes] = useState([]);
  const [loadingRanking, setLoadingRanking] = useState(true);
  const [loadingMissoes, setLoadingMissoes] = useState(true);
  // Busca, filtro e página vivem na URL, não em estado local. Sem isso, voltar
  // de um jogo devolvia o jogador para a página 1 sem filtro, e não havia como
  // mandar para alguém o link de uma busca.
  //
  // O padrão de cada um fica FORA da URL, para o endereço da Home continuar
  // sendo apenas "/".
  const [parametros, setParametros] = useSearchParams();
  const busca = parametros.get('busca') ?? '';
  const filtroConsole = parametros.get('console') ?? 'Todos';
  const paginaAtual = Number(parametros.get('pagina')) || 1;

  const atualizarParametros = (mudancas, { substituir = false } = {}) => {
    setParametros(
      (atuais) => {
        const novos = new URLSearchParams(atuais);
        for (const [chave, valor] of Object.entries(mudancas)) {
          if (valor === null) novos.delete(chave);
          else novos.set(chave, valor);
        }
        return novos;
      },
      { replace: substituir }
    );
  };

  useEffect(() => {
    let ativo = true;

    const buscarRanking = async () => {
      try {
        const top = await listarRanking(5);
        if (ativo && top) setRanking(top);
      } catch (e) {
        console.error('Erro ao buscar o ranking:', e);
      } finally {
        if (ativo) setLoadingRanking(false);
      }
    };

    const buscarDesafios = async () => {
      try {
        const lista = await listarDesafios();
        if (ativo && lista) setMissoes(lista);
      } catch (e) {
        console.error('Erro ao buscar os desafios:', e);
      } finally {
        if (ativo) setLoadingMissoes(false);
      }
    };

    buscarRanking();
    buscarDesafios();

    return () => {
      ativo = false;
    };
  }, []);

  const jogosPorPagina = 12;

  // Mudar busca ou categoria volta para a primeira página. Feito aqui, junto da
  // ação, em vez de num efeito que reage à mudança — o efeito causava um render
  // extra em cascata.
  //
  // O campo tem estado próprio e a URL recebe o valor com atraso.
  //
  // Sem isso o campo perde letra: ele é controlado pela URL, a atualização da
  // URL não é síncrona com a digitação, e um render com o valor anterior
  // reescreve o que já estava no campo. Digitando "mario" depressa, o que
  // chegava era "mo" — medido.
  //
  // O atraso também evita encher o histórico: digitar substitui a entrada em
  // vez de empilhar uma por tecla.
  const [buscaDigitada, setBuscaDigitada] = useState(busca);
  const buscaEnviadaRef = useRef(busca);
  const timerBuscaRef = useRef(null);

  const mudarBusca = (valor) => {
    setBuscaDigitada(valor);
    clearTimeout(timerBuscaRef.current);

    timerBuscaRef.current = setTimeout(() => {
      buscaEnviadaRef.current = valor;
      atualizarParametros(
        { busca: valor || null, pagina: null },
        { substituir: true }
      );
    }, ATRASO_DA_BUSCA);
  };

  // Voltar e avançar mudam a URL por fora do campo; aí o campo acompanha.
  useEffect(() => {
    if (busca !== buscaEnviadaRef.current) {
      buscaEnviadaRef.current = busca;
      setBuscaDigitada(busca);
    }
  }, [busca]);

  useEffect(() => () => clearTimeout(timerBuscaRef.current), []);

  const mudarFiltro = (categoria) => {
    atualizarParametros({
      console: categoria === 'Todos' ? null : categoria,
      pagina: null,
    });
  };

  const sairDaConta = async () => {
    try {
      await sair();
      mostrarAviso('Você saiu da conta. Até mais!');
    } catch (e) {
      mostrarAviso('Não foi possível sair: ' + e.message, { erro: true });
    }
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
    atualizarParametros({ pagina: pagina === 1 ? null : String(pagina) });
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
        aoSair={sairDaConta}
      />

      <main className="home__conteudo">
        <Aviso aviso={aviso} aoFechar={limparAviso} className="home__aviso" />

        <section className="home__secao">
          <div className="home__coluna home__coluna--esquerda">
            <AnuncioGPT adId="div-gpt-ad-1775680124469-0" />

            <CardDesafios missoes={missoes} carregando={loadingMissoes} />
          </div>

          <div className="home__coluna home__coluna--centro">
            {/* A Home não tinha nenhum <h1>. Envolver a logo resolve sem
                mudar nada na tela: o texto alternativo da imagem vira o
                título de primeiro nível da página. */}
            <h1 className="home__titulo">
              <img
                src="/logo.webp"
                alt="Sopra Fitas"
                width="700"
                height="374"
                fetchPriority="high"
                decoding="async"
                className="home__logo"
              />
            </h1>

            <div className="home__busca">
              <div className="home__busca-campo">
                <Search className="home__busca-icone" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Busque por jogo..."
                  value={buscaDigitada}
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

          </div>

          <div className="home__coluna home__coluna--direita">
            <AnuncioGPT adId="div-gpt-ad-1775680168607-0" />

            <CardTop5 ranking={ranking} carregando={loadingRanking} />
          </div>

          {/* Renderizada uma vez só. Onde ela aparece é decisão de layout e
              está no CSS: sob a coluna do meio no desktop, por último em
              coluna única. Antes eram duas árvores e um ternário de
              JavaScript escolhendo qual montar. */}
          <div className="home__grade-area">{gradeDeJogos}</div>
        </section>
      </main>

      <footer className="home__rodape">
        <p>&copy; 2026 Winup Network - {jogos.length} jogos disponíveis.</p>
      </footer>
    </div>
  );
};

export default Home;
