import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Gamepad2,
  Users,
  CheckSquare,
  Trophy,
  ArrowLeft,
  LayoutDashboard,
  UserPlus,
  Target,
  Settings, // Adicionado para o ícone de gerenciar
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ jogos: 0, usuarios: 0, missoes: 0 });

  useEffect(() => {
    checkAdmin();
    getStats();
  }, []);

  const checkAdmin = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      navigate('/');
    }
    setLoading(false);
  };

  const getStats = async () => {
    const { count: j } = await supabase
      .from('jogos')
      .select('*', { count: 'exact', head: true });
    const { count: u } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    const { count: m } = await supabase
      .from('missoes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente');

    setStats({ jogos: j || 0, usuarios: u || 0, missoes: m || 0 });
  };

  if (loading)
    return (
      <div
        style={{
          color: 'white',
          textAlign: 'center',
          marginTop: '50px',
          fontFamily: 'Inter',
        }}
      >
        Verificando credenciais de GM...
      </div>
    );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f0f',
        color: 'white',
        padding: '40px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* BOTÃO VOLTAR */}
        <Link
          to="/perfil"
          style={{
            color: '#888',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '30px',
            transition: '0.3s',
          }}
        >
          <ArrowLeft size={18} /> Voltar para o Perfil
        </Link>

        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
            borderBottom: '1px solid #222',
            paddingBottom: '20px',
          }}
        >
          <div>
            <h1
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                color: '#fca311',
                margin: 0,
                fontSize: '2.2rem',
              }}
            >
              <Shield size={40} /> PAINEL DO GM
            </h1>
            <p style={{ color: '#666', marginTop: '5px' }}>
              Gerenciamento total do Sopra Fitas
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#fca311', fontWeight: 'bold' }}>
              Status do Systema
            </div>
            <div style={{ color: '#00ff88', fontSize: '0.8rem' }}>
              ● Online e Seguro
            </div>
          </div>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            marginBottom: '40px',
          }}
        >
          <div style={cardStatStyle}>
            <h2 style={{ fontSize: '2.5rem', margin: 0, color: '#fca311' }}>
              {stats.jogos}
            </h2>
            <p style={{ margin: 0, color: '#888' }}>Fitas no Estoque</p>
          </div>
          <div style={cardStatStyle}>
            <h2 style={{ fontSize: '2.5rem', margin: 0, color: '#00d4ff' }}>
              {stats.usuarios}
            </h2>
            <p style={{ margin: 0, color: '#888' }}>Players Ativos</p>
          </div>
          <div style={cardStatStyle}>
            <h2 style={{ fontSize: '2.5rem', margin: 0, color: '#ff4444' }}>
              {stats.missoes}
            </h2>
            <p style={{ margin: 0, color: '#888' }}>Missões Pendentes</p>
          </div>
        </div>

        <h2
          style={{
            fontSize: '1.2rem',
            color: '#888',
            marginBottom: '20px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Ferramentas de Gestão
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          {/* UPAR JOGOS */}
          <MenuButton
            to="/painel-admin-jogos"
            icon={<Gamepad2 size={32} />}
            title="Upar Novo Jogo"
            desc="Enviar novas ROMS, capas e configurar cores de emulação."
            color="#fca311"
          />

          {/* EDITAR JOGOS (O QUE CRIAMOS AGORA) */}
          <MenuButton
            to="/admin-gerenciar-jogos"
            icon={<Settings size={32} />}
            title="Gerenciar Acervo"
            desc="Editar nomes, consoles ou excluir jogos da biblioteca."
            color="#3498db"
          />
          
          <MenuButton
            to="/admin-desafios"
            icon={<Target size={32} />}
            title="Lançar Desafios"
            desc="Criar as missões especiais que aparecem no topo da Home."
            color="#7209b7"
          />

          <MenuButton
            to="/admin-missoes"
            icon={<CheckSquare size={32} />}
            title="Validar Missões"
            desc="Revisar prints de tela e distribuir pontos para os players."
            color="#00ff88"
          />

          <MenuButton
            to="/ranking"
            icon={<Trophy size={32} />}
            title="Ranking Global"
            desc="Visualizar a tabela de classificação dos jogadores."
            color="#00d4ff"
          />
          
          <MenuButton
            to="/admin-usuarios"
            icon={<Users size={32} />}
            title="Controle de Usuários"
            desc="Ver lista de e-mails, nicknames e gerenciar permissões."
            color="#a855f7"
          />
        </div>
      </div>
    </div>
  );
};

const cardStatStyle = {
  background: '#1a1a1a',
  padding: '30px',
  borderRadius: '16px',
  border: '1px solid #252525',
  textAlign: 'center',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
};

const MenuButton = ({ to, icon, title, desc, color }) => (
  <Link to={to} style={{ textDecoration: 'none' }}>
    <div
      style={{
        background: '#1a1a1a',
        padding: '30px',
        borderRadius: '16px',
        border: '1px solid #252525',
        transition: '0.3s ease',
        cursor: 'pointer',
        height: '100%',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = 'translateY(-5px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#252525';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ color: color, marginBottom: '20px' }}>{icon}</div>
      <h3 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '1.3rem' }}>
        {title}
      </h3>
      <p
        style={{
          color: '#666',
          fontSize: '0.9rem',
          lineHeight: '1.5',
          margin: 0,
        }}
      >
        {desc}
      </p>
    </div>
  </Link>
);

export default AdminDashboard;