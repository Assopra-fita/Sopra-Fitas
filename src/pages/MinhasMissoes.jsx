import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Clock, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { obterSessao } from '../services/sessao';
import { listarMinhasMissoes } from '../services/missoes';
import { useTituloDaPagina } from '../hooks/useTituloDaPagina';
import {
  CabecalhoPagina,
  Card,
  Carregando,
  CascaDePagina,
  EstadoErro,
  EstadoVazio,
  LinkVoltar,
} from '../components/ui';

// Como cada situação se apresenta. O ícone e a cor vêm daqui e não do JSX, para
// a lista não virar três blocos condicionais dentro do map.
const SITUACOES = {
  pendente: {
    rotulo: 'Em análise',
    explicacao: 'O GM ainda não conferiu este print.',
    icone: Clock,
    classe: 'envio--pendente',
  },
  aprovada: {
    rotulo: 'Aprovada',
    explicacao: 'Os pontos já entraram no seu saldo.',
    icone: CheckCircle2,
    classe: 'envio--aprovada',
  },
  rejeitada: {
    rotulo: 'Recusada',
    explicacao: 'O print não valeu ponto. Dá para tentar de novo no jogo.',
    icone: XCircle,
    classe: 'envio--rejeitada',
  },
};

// A função que aprova a missão mora no banco, não neste repositório: o valor
// exato que ela grava em `status` não dá para ler daqui. Comparar pelo radical
// cobre 'aprovado' e 'aprovada' sem chutar qual dos dois é, e um valor que não
// case aparece como está em vez de sumir da tela.
const situacaoDe = (status) => {
  const texto = (status ?? '').toLowerCase();

  if (texto.startsWith('aprovad')) return SITUACOES.aprovada;
  if (texto.startsWith('rejeitad') || texto.startsWith('recusad'))
    return SITUACOES.rejeitada;
  if (texto.startsWith('pendente')) return SITUACOES.pendente;

  return {
    rotulo: status || 'Sem situação',
    explicacao: 'Situação não reconhecida por esta tela.',
    icone: HelpCircle,
    classe: '',
  };
};

const DATA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const MinhasMissoes = () => {
  useTituloDaPagina('Minhas missões');

  const navigate = useNavigate();
  const [missoes, setMissoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      try {
        const sessao = await obterSessao();

        if (!sessao) {
          navigate('/login');
          return;
        }

        const lista = await listarMinhasMissoes(sessao.user.id);
        if (ativo) setMissoes(lista ?? []);
      } catch (e) {
        console.error('Erro ao buscar as missões enviadas:', e);
        // Lista vazia e falha de rede são coisas diferentes: sem esta
        // distinção, quem está sem internet lê "você ainda não enviou nada" e
        // acredita que o envio se perdeu.
        if (ativo) setErro('Não foi possível carregar seus envios agora.');
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    carregar();
    return () => {
      ativo = false;
    };
  }, [navigate]);

  return (
    <CascaDePagina largura="medio">
      <LinkVoltar para="/perfil">Voltar para o perfil</LinkVoltar>

      <CabecalhoPagina
        icone={<Trophy size={32} aria-hidden="true" />}
        titulo="Minhas missões"
        subtitulo="Todo print que você mandou e o que o GM decidiu sobre ele"
      />

      {carregando ? (
        <Carregando>Buscando seus envios...</Carregando>
      ) : erro ? (
        <EstadoErro>{erro}</EstadoErro>
      ) : missoes.length === 0 ? (
        <EstadoVazio icone={<Trophy size={50} aria-hidden="true" />}>
          Você ainda não enviou nenhuma missão. Abra um jogo e use o botão
          "Enviar missão" para mandar o print da sua pontuação.
        </EstadoVazio>
      ) : (
        <ol className="envios">
          {missoes.map((missao) => {
            const situacao = situacaoDe(missao.status);
            const Icone = situacao.icone;

            return (
              <li key={missao.id}>
                <Card className={['envio', situacao.classe].filter(Boolean).join(' ')}>
                  <div className="envio__print">
                    <img
                      src={missao.print_url}
                      alt={`Print enviado em ${missao.game_nome}`}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <div className="envio__dados">
                    <h2 className="envio__jogo">
                      {/* O jogo pode ter saído do acervo depois do envio; o
                          link some, o registro do envio fica. */}
                      {missao.game_id ? (
                        <Link to={`/jogar/${missao.game_id}`}>
                          {missao.game_nome}
                        </Link>
                      ) : (
                        missao.game_nome
                      )}
                    </h2>

                    <p className="envio__situacao">
                      <Icone size={18} aria-hidden="true" />
                      {situacao.rotulo}
                    </p>

                    <p className="envio__explicacao">{situacao.explicacao}</p>

                    {missao.created_at && (
                      <time className="envio__data" dateTime={missao.created_at}>
                        Enviado em {DATA.format(new Date(missao.created_at))}
                      </time>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </CascaDePagina>
  );
};

export default MinhasMissoes;
