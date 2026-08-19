import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { Coins, Trophy, Shield } from 'lucide-react';
import { Botao, Campo, Card, CascaDePagina, LinkVoltar } from '../components/ui';

const Perfil = () => {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [nome, setNome] = useState('');
  const [pontos, setPontos] = useState(0);
  const [papel, setPapel] = useState('user');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const buscarPerfil = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('nome, pontos, role')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setNome(data.nome || '');
        setPontos(data.pontos ?? 0);
        setPapel(data.role || 'user');
      }
      setCarregando(false);
    };

    buscarPerfil();
  }, [navigate]);

  const salvarNome = async () => {
    setSalvando(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const { error } = await supabase
        .from('profiles')
        .update({ nome })
        .eq('id', session.user.id);

      if (error) throw error;
      alert('Nickname atualizado com sucesso!');
    } catch (e) {
      console.error('Erro ao atualizar:', e);
      alert('Erro ao atualizar o nome. Verifique se o banco permite a alteração.');
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) return <p className="estado-carregando">Carregando...</p>;

  return (
    <CascaDePagina largura="estreito">
      <LinkVoltar para="/">Voltar para a Home</LinkVoltar>

      <Card centralizado>
        <div className="perfil__avatar" aria-hidden="true">
          {nome ? nome[0].toUpperCase() : 'P'}
        </div>

        <h1 className="perfil__nome">{nome || 'Player'}</h1>
        <p className="perfil__papel">
          {papel === 'admin' ? '👑 Administrador' : '🎮 Jogador do Sopra Fitas'}
        </p>

        <div className="perfil__numeros">
          <div className="perfil__numero">
            <Coins color="var(--primaria)" aria-hidden="true" />
            <div className="perfil__numero-valor">{pontos}</div>
            <small>Pontos</small>
          </div>

          <Link className="perfil__numero" to="/ranking">
            <Trophy color="#00d4ff" aria-hidden="true" />
            <div className="perfil__numero-valor">Ver</div>
            <small>Ranking</small>
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
