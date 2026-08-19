import React, { useEffect, useState } from 'react';
import {
  listarPendentes,
  aprovarMissao,
  rejeitarMissao,
} from '../services/missoes';
import { CheckCircle, User, Shield, Coins } from 'lucide-react';
import { useTituloDaPagina } from '../hooks/useTituloDaPagina';
import {
  Botao,
  CabecalhoPagina,
  Campo,
  Card,
  Carregando,
  CascaDePagina,
  EstadoVazio,
  LinkVoltar,
} from '../components/ui';

// O GM confirma ou altera este valor antes de depositar.
const RECOMPENSA_PADRAO = 500;

const AdminMissoes = () => {
  useTituloDaPagina('Validar missões');

  const [missoes, setMissoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [pontos, setPontos] = useState({});

  const consultarPendentes = async () => {
    try {
      return await listarPendentes();
    } catch (e) {
      console.error('Erro ao buscar as missões pendentes:', e);
      return null;
    }
  };

  const aplicar = (lista) => {
    setMissoes(lista);
    setPontos(Object.fromEntries(lista.map((m) => [m.id, RECOMPENSA_PADRAO])));
  };

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      const lista = await consultarPendentes();
      if (!ativo) return;

      if (lista) aplicar(lista);
      setCarregando(false);
    };

    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  const recarregar = async () => {
    setCarregando(true);
    const lista = await consultarPendentes();
    if (lista) aplicar(lista);
    setCarregando(false);
  };

  const aprovar = async (missao) => {
    const valor = parseInt(pontos[missao.id], 10);
    if (!Number.isFinite(valor) || valor <= 0)
      return alert('Informe um valor de pontos maior que zero.');

    const jogador = missao.profiles?.nome || 'este jogador';
    if (!window.confirm(`Confirmar depósito de ${valor} pontos para ${jogador}?`))
      return;

    try {
      await aprovarMissao({
        idMissao: missao.id,
        idJogador: missao.user_id,
        pontos: valor,
      });
    } catch (e) {
      return alert('Erro no banco: ' + e.message);
    }

    alert('Pontos depositados.');
    recarregar();
  };

  const rejeitar = async (id) => {
    if (!window.confirm('Tem certeza que deseja rejeitar este print?')) return;

    try {
      await rejeitarMissao(id);
      recarregar();
    } catch (e) {
      alert('Erro ao rejeitar: ' + e.message);
    }
  };

  return (
    <CascaDePagina largura="medio">
      <LinkVoltar para="/admin-dashboard">Voltar ao painel do GM</LinkVoltar>

      <CabecalhoPagina
        icone={<Shield size={32} aria-hidden="true" />}
        titulo="Validação de missões"
        subtitulo="Prints enviados pelos jogadores, à espera de conferência"
      />

      {carregando ? (
        <Carregando>Buscando prints pendentes...</Carregando>
      ) : missoes.length === 0 ? (
        <EstadoVazio icone={<CheckCircle size={50} aria-hidden="true" />}>
          Tudo limpo! Nenhum print pendente.
        </EstadoVazio>
      ) : (
        missoes.map((missao) => (
          <Card key={missao.id}>
            <div className="missao__topo">
              <p className="missao__jogador">
                <User size={18} aria-hidden="true" />
                {missao.profiles?.nome || 'Jogador desconhecido'}
              </p>
              <span className="missao__jogo">{missao.game_nome}</span>
            </div>

            <div className="missao__print">
              <img
                src={missao.print_url}
                alt={`Print enviado por ${missao.profiles?.nome || 'jogador desconhecido'} em ${missao.game_nome}`}
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="missao__recompensa">
              <Coins size={22} aria-hidden="true" />

              <Campo
                type="number"
                min="1"
                compacto
                rotulo="Recompensa em pontos"
                className="missao__campo"
                value={pontos[missao.id] ?? RECOMPENSA_PADRAO}
                onChange={(e) =>
                  setPontos((atual) => ({ ...atual, [missao.id]: e.target.value }))
                }
              />
            </div>

            <div className="missao__acoes">
              <Botao variante="perigo" onClick={() => rejeitar(missao.id)}>
                Rejeitar print
              </Botao>
              <Botao onClick={() => aprovar(missao)}>Aprovar e depositar</Botao>
            </div>
          </Card>
        ))
      )}
    </CascaDePagina>
  );
};

export default AdminMissoes;
