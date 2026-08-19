import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Crown, Medal, Loader2 } from 'lucide-react';

const Ranking = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (data?.role === 'admin') setIsAdmin(true);
      }
    };

    const fetchRanking = async () => {
      // Não pedir 'email': a coluna trafegava para o navegador de qualquer
      // visitante e o ranking não precisa dela.
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, pontos')
        .order('pontos', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erro ao buscar ranking:', error);
        setErro(true);
      } else {
        setErro(false);
        setUsuarios(data);
      }

      setLoading(false);
    };

    checkUserRole();
    fetchRanking();
  }, []);

  const getIcone = (index) => {
    if (index === 0) return <Crown size={24} color="#fca311" fill="#fca311" />;
    if (index === 1) return <Medal size={24} color="#C0C0C0" />;
    if (index === 2) return <Medal size={24} color="#CD7F32" />;
    return (
      <span
        style={{
          fontWeight: 'bold',
          color: '#666',
          width: '24px',
          textAlign: 'center',
        }}
      >
        #{index + 1}
      </span>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #121212, #1a1a2e)',
        fontFamily: '"Inter", sans-serif',
        padding: '40px 20px',
        color: 'white',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* NAVEGAÇÃO DINÂMICA: Volta para o Painel se for Admin, senão volta para Home */}
        <Link
          to={isAdmin ? '/admin-dashboard' : '/'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#aaa',
            textDecoration: 'none',
            marginBottom: '30px',
            fontSize: '0.9rem',
          }}
        >
          <ArrowLeft size={18} />{' '}
          {isAdmin ? 'Voltar ao Painel do GM' : 'Voltar para a Home'}
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <Trophy
            size={60}
            color="#fca311"
            style={{
              marginBottom: '15px',
              filter: 'drop-shadow(0 0 15px rgba(252, 163, 17, 0.4))',
            }}
          />
          <h1
            style={{
              fontSize: '2.5rem',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '3px',
              fontWeight: '900',
            }}
          >
            Ranking Global
          </h1>
          <p style={{ color: '#aaa', marginTop: '10px' }}>
            Os maiores sopradores de fita da história
          </p>
        </div>

        <div
          style={{
            background: '#1e1e1e',
            borderRadius: '20px',
            border: '1px solid #333',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          }}
        >
          {/* Cabeçalho */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '0.8fr 3fr 1fr',
              padding: '18px 25px',
              background: '#252525',
              borderBottom: '1px solid #333',
              fontWeight: 'bold',
              color: '#666',
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              letterSpacing: '1px',
            }}
          >
            <div>Posição</div>
            <div>Jogador</div>
            <div style={{ textAlign: 'right' }}>Pontos</div>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <Loader2
                className="animate-spin"
                size={30}
                color="#fca311"
                style={{ margin: '0 auto mb-10' }}
              />
              <p style={{ color: '#666', marginTop: '10px' }}>
                Carregando elite...
              </p>
            </div>
          ) : (
            usuarios.map((user, index) => (
              <div
                key={user.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '0.8fr 3fr 1fr',
                  padding: '20px 25px',
                  borderBottom: '1px solid #2a2a2a',
                  alignItems: 'center',
                  background:
                    index === 0
                      ? 'linear-gradient(90deg, rgba(252, 163, 17, 0.08), transparent)'
                      : 'transparent',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {getIcone(index)}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      color: index === 0 ? '#fca311' : '#fff',
                    }}
                  >
                    {user.nome || 'Player Sem Nome'}
                  </span>
                </div>

                <div
                  style={{
                    textAlign: 'right',
                    fontWeight: '800',
                    fontSize: '1.2rem',
                    color: '#fca311',
                  }}
                >
                  {user.pontos}{' '}
                  <span style={{ fontSize: '0.7rem', color: '#666' }}>XP</span>
                </div>
              </div>
            ))
          )}

          {erro && !loading && (
            <div
              style={{ padding: '50px', textAlign: 'center', color: '#ff9d9d' }}
            >
              <p>Não foi possível carregar o ranking. Tente de novo daqui a pouco.</p>
            </div>
          )}

          {!erro && usuarios.length === 0 && !loading && (
            <div
              style={{ padding: '50px', textAlign: 'center', color: '#666' }}
            >
              <p>Ninguém pontuou ainda. Seja o primeiro!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Ranking;
