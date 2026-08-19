import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  User,
  Gamepad2,
  Shield,
  Coins,
  Loader2,
} from 'lucide-react';

const AdminMissoes = () => {
  const [missoes, setMissoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pontosInput, setPontosInput] = useState({});

  useEffect(() => {
    fetchMissoesPendentes();
  }, []);

  const fetchMissoesPendentes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('missoes')
      .select(`*, profiles (nome, email)`)
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMissoes(data);
      const iniciais = {};
      data.forEach((m) => (iniciais[m.id] = 500));
      setPontosInput(iniciais);
    }
    setLoading(false);
  };

  const handlePontosChange = (id, valor) => {
    setPontosInput((prev) => ({ ...prev, [id]: valor }));
  };

  const aprovarMissao = async (missao) => {
    const pontosParaDar = parseInt(pontosInput[missao.id]) || 0;

    if (pontosParaDar <= 0) return alert('Valor inválido!');
    if (
      !window.confirm(
        `Confirmar depósito de ${pontosParaDar} pontos para ${missao.profiles?.nome}?`
      )
    )
      return;

    try {
      const { error } = await supabase.rpc('aprovar_missao_gm', {
        id_missao: missao.id,
        id_jogador: missao.user_id,
        qtd_pontos: pontosParaDar,
      });

      if (error) throw error;

      alert('✅ PONTOS DEPOSITADOS COM SUCESSO!');
      fetchMissoesPendentes();
    } catch (error) {
      alert('Erro no Banco: ' + error.message);
    }
  };

  const rejeitarMissao = async (id) => {
    if (!window.confirm('Tem certeza que deseja rejeitar este print?')) return;
    await supabase.from('missoes').update({ status: 'rejeitado' }).eq('id', id);
    fetchMissoesPendentes();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#121212',
        color: 'white',
        padding: '40px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* ROTA CORRIGIDA PARA O DASHBOARD */}
        <Link
          to="/admin-dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#aaa',
            textDecoration: 'none',
            marginBottom: '20px',
            fontSize: '0.9rem',
          }}
        >
          <ArrowLeft size={18} /> Voltar ao Painel do GM
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '30px',
          }}
        >
          <Shield color="#fca311" size={32} />
          <h2 style={{ margin: 0, color: '#fca311' }}>
            Validação de Missões (GM)
          </h2>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <Loader2 className="animate-spin" size={40} color="#fca311" />
            <p style={{ color: '#aaa' }}>Buscando prints pendentes...</p>
          </div>
        ) : missoes.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              background: '#1e1e1e',
              padding: '40px',
              borderRadius: '15px',
              border: '1px solid #333',
            }}
          >
            <CheckCircle
              size={50}
              color="#00ff88"
              style={{ marginBottom: '15px' }}
            />
            <p style={{ fontSize: '1.2rem' }}>
              Tudo limpo! Nenhum print pendente.
            </p>
          </div>
        ) : (
          missoes.map((m) => (
            <div
              key={m.id}
              style={{
                background: '#1e1e1e',
                padding: '20px',
                borderRadius: '15px',
                marginBottom: '25px',
                border: '1px solid #333',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <User size={18} color="#aaa" />
                  <span style={{ fontWeight: 'bold' }}>
                    {m.profiles?.nome || 'Jogador Desconhecido'}
                  </span>
                </div>
                <div
                  style={{
                    background: '#252525',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    color: '#fca311',
                    border: '1px solid #444',
                  }}
                >
                  {m.game_nome}
                </div>
              </div>

              <div
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '2px solid #333',
                }}
              >
                <img
                  src={m.print_url}
                  style={{ width: '100%', display: 'block' }}
                  alt="prova da missão"
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '15px',
                  alignItems: 'center',
                  marginBottom: '20px',
                  background: '#161616',
                  padding: '15px',
                  borderRadius: '10px',
                }}
              >
                <Coins size={22} color="#fca311" />
                <span style={{ fontWeight: '500' }}>Recompensa:</span>
                <input
                  type="number"
                  value={pontosInput[m.id]}
                  onChange={(e) => handlePontosChange(m.id, e.target.value)}
                  style={{
                    width: '100px',
                    background: '#252525',
                    color: '#fff',
                    border: '1px solid #444',
                    padding: '8px',
                    borderRadius: '6px',
                  }}
                />
                <span style={{ color: '#aaa', fontSize: '0.9rem' }}>
                  pontos
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.5fr',
                  gap: '15px',
                }}
              >
                <button
                  onClick={() => rejeitarMissao(m.id)}
                  style={{
                    padding: '12px',
                    background: 'transparent',
                    color: '#ff4444',
                    border: '1px solid #ff4444',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  REJEITAR PRINT
                </button>
                <button
                  onClick={() => aprovarMissao(m)}
                  style={{
                    padding: '12px',
                    background: '#00ff88',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  APROVAR E DEPOSITAR
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminMissoes;
