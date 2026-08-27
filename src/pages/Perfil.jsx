import React, { useState, useEffect } from 'react';
import { obterSessao } from '../services/sessao';
import { obterPerfil, atualizarNome } from '../services/perfis';
import { Link, useNavigate } from 'react-router-dom';
import { Coins, Trophy, Shield, ClipboardList } from 'lucide-react';
import { useTituloDaPagina } from '../hooks/useTituloDaPagina';
import { useAviso } from '../hooks/useAviso';
import { MARCA } from '../lib/seo';
import {
  Aviso,
  Botao,
  Campo,
  Card,
  CascaDePagina,
  LinkVoltar,
} from '../components/ui';

const Perfil = () => {
  useTituloDaPagina('Meu perfil');

  const { aviso, mostrarAviso, limparAviso } = useAviso();

  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [nome, setNome] = useState('');
  const [pontos, setPontos] = useState(0);
  const [papel, setPapel] = useState('user');
  const [salvando, setSalvando] = useState(false);
  // Guardado no carregamento: antes a tela consultava a sessão de novo a
  // cada clique em salvar, para chegar ao mesmo id.
  const [usuarioId, setUsuarioId] = useState(null);

  useEffect(() => {
    let ativo = true;

    const buscar = async () => {
      try {
        const sessao = await obterSessao();

        if (!sessao) {
          navigate('/login');
          return;
        }

        if (!ativo) return;
        setUsuarioId(sessao.user.id);

        const perfil = await obterPerfil(sessao.user.id);
        if (!ativo || !perfil) return;

        setNome(perfil.nome || '');
        setPontos(perfil.pontos ?? 0);
        setPapel(perfil.role || 'user');
      } catch (e) {
        console.error('Erro ao buscar o perfil:', e);
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    buscar();
    return () => {
      ativo = false;
    };
  }, [navigate]);

  const salvarNome = async () => {
    if (!usuarioId) return;

    setSalvando(true);
    try {
      await atualizarNome(usuarioId, nome);
      mostrarAviso('Nickname atualizado.');
    } catch (e) {
      console.error('Erro ao atualizar:', e);
      mostrarAviso(
        'Não foi possível atualizar o nome. Confira se o banco permite a alteração.',
        { erro: true }
      );
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) return <p className="estado-carregando">Carregando...</p>;

  return (
    <CascaDePagina largura="estreito">
      <LinkVoltar para="/">Voltar para a Home</LinkVoltar>

      <Aviso aviso={aviso} aoFechar={limparAviso} />

      <Card centralizado>
        <div className="perfil__avatar" aria-hidden="true">
          {nome ? nome[0].toUpperCase() : 'P'}
        </div>

        <h1 className="perfil__nome">{nome || 'Player'}</h1>
        <p className="perfil__papel">
          {papel === 'admin' ? '👑 Administrador' : `🎮 Jogador do ${MARCA}`}
        </p>

        <div className="perfil__numeros">
          <div className="perfil__numero">
            <Coins color="var(--primaria)" aria-hidden="true" />
            <div className="perfil__numero-valor">{pontos}</div>
            <small>Pontos</small>
          </div>

          <Link className="perfil__numero" to="/ranking">
            <Trophy color="var(--conquista)" aria-hidden="true" />
            <div className="perfil__numero-valor">Ver</div>
            <small>Ranking</small>
          </Link>

          {/* Até aqui o jogador mandava o print e nunca mais sabia o que
              aconteceu com ele: não havia tela nenhuma mostrando o status. */}
          <Link className="perfil__numero" to="/minhas-missoes">
            <ClipboardList color="var(--primaria)" aria-hidden="true" />
            <div className="perfil__numero-valor">Ver</div>
            <small>Missões</small>
          </Link>
        </div>

        {papel === 'admin' && (
          <Botao para="/admin-dashboard" cheio>
            <Shield size={20} aria-hidden="true" /> Acessar painel GM
          </Botao>
        )}

        <div className="perfil__formulario">
          <Campo
            rotulo="Seu apelido no ranking"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Como você quer ser chamado"
            autoComplete="nickname"
            maxLength={30}
          />

          <Botao
            variante="fantasma"
            cheio
            onClick={salvarNome}
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : 'Atualizar apelido'}
          </Botao>
        </div>
      </Card>
    </CascaDePagina>
  );
};

export default Perfil;
