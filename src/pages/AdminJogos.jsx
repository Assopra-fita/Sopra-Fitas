import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  Gamepad2,
  Upload,
  PlusCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CONSOLES, acharConsole, aceitarRom } from '../constants/consoles';

const AdminJogos = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // Estados do Formulário
  const [id, setId] = useState('');
  const [nome, setNome] = useState('');
  // O console é escolhido numa lista fechada e o core sai dele. Antes os dois
  // eram livres e divergiam: 55 jogos ficaram gravados como 'Super Nintendo',
  // valor que nenhum filtro da Home reconhecia.
  const [consoleNome, setConsoleNome] = useState(CONSOLES[0].valor);
  const core = acharConsole(consoleNome)?.core ?? '';
  const [ano, setAno] = useState('');
  const [fabricante, setFabricante] = useState('');
  const [descricao, setDescricao] = useState('');

  // Estados dos Arquivos
  const [capaFile, setCapaFile] = useState(null);
  const [romFile, setRomFile] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();

    const definicao = acharConsole(consoleNome);
    if (!definicao) {
      setStatus('❌ Escolha um console da lista.');
      return;
    }

    // A capa já foi enviada no campo da ROM 29 vezes; sem esta checagem o
    // emulador recebe um PNG e o jogo abre em tela preta.
    if (!capaFile?.type.startsWith('image/')) {
      setStatus('❌ A capa precisa ser uma imagem.');
      return;
    }

    const extRom = romFile?.name.split('.').pop()?.toLowerCase() ?? '';
    if (!definicao.extensoes.includes(extRom)) {
      setStatus(
        `❌ ROM de ${definicao.rotulo} precisa ser ${definicao.extensoes
          .map((x) => '.' + x)
          .join(', ')} — o arquivo enviado é .${extRom}`
      );
      return;
    }

    setLoading(true);
    setStatus('Enviando arquivos...');

    try {
      // 1. Upload da Capa
      const capaExt = capaFile.name.split('.').pop();
      const capaPath = `${id}-capa.${capaExt}`;
      const { error: capaError } = await supabase.storage
        .from('capas')
        .upload(capaPath, capaFile, { upsert: true });

      if (capaError) throw capaError;
      const capaUrl = supabase.storage.from('capas').getPublicUrl(capaPath)
        .data.publicUrl;

      // 2. Upload da ROM
      const romExt = romFile.name.split('.').pop();
      const romPath = `${id}.${romExt}`;
      const { error: romError } = await supabase.storage
        .from('roms')
        .upload(romPath, romFile, { upsert: true });

      if (romError) throw romError;
      const romUrl = supabase.storage.from('roms').getPublicUrl(romPath)
        .data.publicUrl;

      // 3. Salvar no Banco de Dados
      const { error: dbError } = await supabase.from('jogos').insert([
        {
          id,
          nome,
          console: consoleNome, // Enviando para a coluna 'console'
          core,
          ano,
          fabricante,
          descricao,
          capa_url: capaUrl,
          rom_url: romUrl,
        },
      ]);

      if (dbError) throw dbError;

      setStatus('✅ Jogo cadastrado com sucesso!');
      // Resetar campos
      setId('');
      setNome('');
      setConsoleNome(CONSOLES[0].valor);
      setAno('');
      setFabricante('');
      setDescricao('');
      setCapaFile(null);
      setRomFile(null);
      e.target.reset();
    } catch (error) {
      console.error(error);
      setStatus('❌ Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
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
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
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
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.color = '#fca311')}
          onMouseLeave={(e) => (e.target.style.color = '#aaa')}
        >
          <ArrowLeft size={18} />
          Voltar ao Painel do GM
        </Link>

        <div
          style={{
            background: '#1e1e1e',
            padding: '30px',
            borderRadius: '15px',
            border: '1px solid #333',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <PlusCircle color="#fca311" size={30} />
            <h2 style={{ margin: 0 }}>Adicionar Novo Jogo</h2>
          </div>

          <form
            onSubmit={handleUpload}
            style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
          >
            <input
              placeholder="ID Único (ex: atari-pacman)"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              placeholder="Nome do Jogo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              style={inputStyle}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.8rem', color: '#fca311', marginLeft: '5px' }}>Console</label>
              <select
                value={consoleNome}
                onChange={(e) => setConsoleNome(e.target.value)}
                required
                style={inputStyle}
              >
                {CONSOLES.map((c) => (
                  <option key={c.valor} value={c.valor}>
                    {c.rotulo}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: '5px' }}>
                Emulador: <strong>{core}</strong> · ROM aceita:{' '}
                {aceitarRom(consoleNome).replaceAll(',', ', ')}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: '#aaa', marginLeft: '5px' }}>Ano</label>
                <input
                  placeholder="Ano"
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <input
              placeholder="Fabricante (ex: Atari, Konami, Sega)"
              value={fabricante}
              onChange={(e) => setFabricante(e.target.value)}
              style={inputStyle}
            />
            <textarea
              placeholder="Descrição curta"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              style={{ ...inputStyle, height: '80px', resize: 'none' }}
            />

            <div style={uploadBoxStyle}>
              <p style={labelFileStyle}>Capa do Jogo:</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCapaFile(e.target.files[0])}
                required
              />
            </div>

            <div style={uploadBoxStyle}>
              <p style={labelFileStyle}>Arquivo da ROM:</p>
              <input
                type="file"
                accept={aceitarRom(consoleNome)}
                onChange={(e) => setRomFile(e.target.files[0])}
                required
              />
            </div>

            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                'SUBIR JOGO PARA O SITE'
              )}
            </button>
          </form>

          {status && (
            <p
              style={{
                marginTop: '20px',
                textAlign: 'center',
                color: status.includes('❌') ? '#ff4444' : '#00ff88',
              }}
            >
              {status}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Estilos auxiliares para manter o código limpo
const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #333',
  background: '#252525',
  color: 'white',
};

const uploadBoxStyle = {
  border: '1px dashed #444',
  padding: '15px',
  borderRadius: '10px',
};

const labelFileStyle = {
  margin: '0 0 10px 0',
  fontSize: '0.9rem',
  color: '#aaa',
};

const btnStyle = {
  background: '#fca311',
  color: '#1a1a2e',
  padding: '15px',
  borderRadius: '10px',
  border: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

export default AdminJogos;