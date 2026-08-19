import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Users, Shield, ShieldOff, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editandoPontos, setEditandoPontos] = useState({});

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('pontos', { ascending: false });

    if (!error) {
      setUsuarios(data);
      const pontosIniciais = {};
      data.forEach((u) => (pontosIniciais[u.id] = u.pontos));
      setEditandoPontos(pontosIniciais);
    }
    setLoading(false);
  };

  const atualizarPontos = async (id) => {
    const novosPontos = parseInt(editandoPontos[id]);
    const { error } = await supabase
      .from('profiles')
      .update({ pontos: novosPontos })
      .eq('id', id);

    if (!error) {
      alert('Pontuação atualizada!');
      fetchUsuarios();
    } else {
      alert('Erro: ' + error.message);
    }
  };

  const alternarRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', id);

    if (!error) fetchUsuarios();
  };

  if (loading)
    return (
      <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>
        Carregando players...
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
      <Link
        to="/admin-dashboard"
        style={{
          color: '#aaa',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
        }}
      >
        <ArrowLeft size={18} /> Voltar ao Painel GM
      </Link>

      <h1
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          color: '#a855f7',
          marginBottom: '30px',
        }}
      >
        <Users size={32} /> Gestão de Players & Pontos
      </h1>

      <div
        style={{
          background: '#1a1a1a',
          borderRadius: '15px',
          overflow: 'hidden',
          border: '1px solid #333',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
          }}
        >
          <thead style={{ background: '#252525', color: '#888' }}>
            <tr>
              <th style={thStyle}>Nickname</th>
              <th style={thStyle}>Pontos Atuais</th>
              <th style={thStyle}>Editar Pontos</th>
              <th style={thStyle}>Cargo</th>
              <th style={thStyle}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 'bold' }}>
                    {user.nome || 'Sem nome'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>
                    {user.email}
                  </div>
                </td>
                <td style={tdStyle}>
                  <span style={{ color: '#fca311', fontWeight: 'bold' }}>
                    {user.pontos}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center',
                    }}
                  >
                    <input
                      type="number"
                      value={editandoPontos[user.id] || 0}
                      onChange={(e) =>
                        setEditandoPontos({
                          ...editandoPontos,
                          [user.id]: e.target.value,
                        })
                      }
                      style={inputPontosStyle}
                    />
                    <button
                      onClick={() => atualizarPontos(user.id)}
                      style={btnSaveStyle}
                    >
                      <Save size={16} />
                    </button>
                  </div>
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      background: user.role === 'admin' ? '#fca31133' : '#4443',
                      color: user.role === 'admin' ? '#fca311' : '#aaa',
                    }}
                  >
                    {user.role}
                  </span>
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => alternarRole(user.id, user.role)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#a855f7',
                      cursor: 'pointer',
                    }}
                  >
                    {user.role === 'admin' ? (
                      <ShieldOff size={20} />
                    ) : (
                      <Shield size={20} />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const thStyle = {
  padding: '15px',
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: '1px',
};
const tdStyle = { padding: '15px' };
const inputPontosStyle = {
  width: '80px',
  background: '#252525',
  border: '1px solid #444',
  borderRadius: '6px',
  color: 'white',
  padding: '5px 8px',
};
const btnSaveStyle = {
  background: '#00ff8822',
  border: '1px solid #00ff88',
  color: '#00ff88',
  padding: '5px',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};

export default AdminUsuarios;
