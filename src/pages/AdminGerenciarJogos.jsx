import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Edit, Trash2, Search, X, Check, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminGerenciarJogos = () => {
    const [jogos, setJogos] = useState([]);
    const [busca, setBusca] = useState('');
    const [editandoId, setEditandoId] = useState(null);
    const [dadosEditados, setDadosEditados] = useState({});

    useEffect(() => {
        fetchJogos();
    }, []);

    const fetchJogos = async () => {
        const { data, error } = await supabase.from('jogos').select('*').order('nome', { ascending: true });
        if (error) console.error('Erro ao buscar jogos:', error);
        else setJogos(data);
    };

    const iniciarEdicao = (jogo) => {
        setEditandoId(jogo.id);
        setDadosEditados({ ...jogo });
    };

    const salvarEdicao = async (id) => {
        const { error } = await supabase
            .from('jogos')
            .update(dadosEditados)
            .eq('id', id);

        if (error) {
            alert("Erro ao atualizar: " + error.message);
        } else {
            setEditandoId(null);
            fetchJogos();
        }
    };

    const deletarJogo = async (id, nome) => {
        if (window.confirm(`Tem certeza que deseja deletar o jogo "${nome}"?`)) {
            const { error } = await supabase.from('jogos').delete().eq('id', id);
            if (error) alert("Erro ao deletar");
            else fetchJogos();
        }
    };

    const jogosFiltrados = jogos.filter(j => 
        j.nome.toLowerCase().includes(busca.toLowerCase()) || 
        j.console.toLowerCase().includes(busca.toLowerCase())
    );

    return (
        <div style={containerStyle}>
            {/* BOTÃO VOLTAR */}
            <Link
                to="/admin-dashboard"
                style={btnVoltarStyle}
            >
                <ArrowLeft size={18} /> Voltar para o Painel do GM
            </Link>

            <div style={headerStyle}>
                <h2 style={{ margin: 0, color: '#fca311' }}>Gerenciar Acervo de Jogos</h2>
                <Link to="/painel-admin-jogos" style={btnNovoStyle}>+ Adicionar Novo</Link>
            </div>

            <div style={buscaContainer}>
                <Search size={20} color="#888" />
                <input 
                    style={inputBusca} 
                    placeholder="Buscar por nome ou console..." 
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                />
            </div>

            <div style={tableWrapper}>
                <table style={tableStyle}>
                    <thead>
                        <tr style={theadStyle}>
                            <th style={thStyle}>Capa</th>
                            <th style={thStyle}>ID</th>
                            <th style={thStyle}>Nome</th>
                            <th style={thStyle}>Console</th>
                            <th style={thStyle}>Ano</th>
                            <th style={thStyle}>Fabricante</th>
                            <th style={thStyle}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jogosFiltrados.map(jogo => (
                            <tr key={jogo.id} style={trStyle}>
                                <td style={tdStyle}><img src={jogo.capa_url} width="40" style={{borderRadius: '4px'}} alt="capa" /></td>
                                <td style={tdStyle}>{jogo.id}</td>
                                <td style={tdStyle}>
                                    {editandoId === jogo.id ? 
                                        <input style={inputEdit} value={dadosEditados.nome} onChange={e => setDadosEditados({...dadosEditados, nome: e.target.value})} /> 
                                        : jogo.nome}
                                </td>
                                <td style={tdStyle}>
                                    {editandoId === jogo.id ? 
                                        <input style={inputEdit} value={dadosEditados.console} onChange={e => setDadosEditados({...dadosEditados, console: e.target.value})} /> 
                                        : jogo.console}
                                </td>
                                <td style={tdStyle}>
                                    {editandoId === jogo.id ? 
                                        <input style={inputEdit} value={dadosEditados.ano} onChange={e => setDadosEditados({...dadosEditados, ano: e.target.value})} /> 
                                        : jogo.ano}
                                </td>
                                <td style={tdStyle}>
                                    {editandoId === jogo.id ? 
                                        <input style={inputEdit} value={dadosEditados.fabricante} onChange={e => setDadosEditados({...dadosEditados, fabricante: e.target.value})} /> 
                                        : jogo.fabricante}
                                </td>
                                <td style={tdStyle}>
                                    {editandoId === jogo.id ? (
                                        <div style={actionBtns}>
                                            <button onClick={() => salvarEdicao(jogo.id)} style={btnSave} title="Salvar"><Check size={18}/></button>
                                            <button onClick={() => setEditandoId(null)} style={btnCancel} title="Cancelar"><X size={18}/></button>
                                        </div>
                                    ) : (
                                        <div style={actionBtns}>
                                            <button onClick={() => iniciarEdicao(jogo)} style={btnEdit} title="Editar"><Edit size={18}/></button>
                                            <button onClick={() => deletarJogo(jogo.id, jogo.nome)} style={btnTrash} title="Deletar"><Trash2 size={18}/></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- ESTILOS ---
const containerStyle = { padding: '40px', color: 'white', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' };

const btnVoltarStyle = { 
    color: '#888', 
    textDecoration: 'none', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    marginBottom: '30px', 
    fontSize: '0.9rem',
    width: 'fit-content'
};

const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const btnNovoStyle = { background: '#fca311', color: 'black', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' };
const buscaContainer = { display: 'flex', alignItems: 'center', background: '#1a1a1a', padding: '12px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #333' };
const inputBusca = { background: 'transparent', border: 'none', color: 'white', marginLeft: '10px', width: '100%', fontSize: '1rem' };
const tableWrapper = { overflowX: 'auto', background: '#1a1a1a', borderRadius: '16px', border: '1px solid #222' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const theadStyle = { borderBottom: '2px solid #333', background: '#222' };
const thStyle = { padding: '15px', color: '#888', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' };
const trStyle = { borderBottom: '1px solid #222', transition: '0.2s' };
const tdStyle = { padding: '15px', fontSize: '0.9rem' };
const inputEdit = { background: '#222', color: 'white', border: '1px solid #fca311', padding: '8px', borderRadius: '6px', width: '100%' };
const actionBtns = { display: 'flex', gap: '8px' };
const btnEdit = { background: '#3498db22', border: '1px solid #3498db', color: '#3498db', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' };
const btnTrash = { background: '#e74c3c22', border: '1px solid #e74c3c', color: '#e74c3c', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' };
const btnSave = { background: '#2ecc7122', border: '1px solid #2ecc71', color: '#2ecc71', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' };
const btnCancel = { background: '#5552', border: '1px solid #555', color: '#888', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' };

export default AdminGerenciarJogos;