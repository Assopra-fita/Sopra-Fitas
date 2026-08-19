import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, ArrowLeft } from 'lucide-react';

// Antes desta tela, qualquer URL errada renderizava uma página em branco:
// não havia rota curinga no App.jsx.
const NaoEncontrada = () => (
  <div
    style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #121212, #1a1a2e)',
      color: 'white',
      fontFamily: '"Inter", sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '40px 20px',
      gap: '20px',
    }}
  >
    <Gamepad2 size={64} color="#fca311" />

    <h1 style={{ fontSize: '2rem', margin: 0 }}>Essa fita não está na prateleira</h1>

    <p style={{ color: '#aaa', maxWidth: '420px', margin: 0, lineHeight: 1.6 }}>
      A página que você tentou abrir não existe. Pode ter sido um link antigo ou
      um endereço digitado errado.
    </p>

    <Link
      to="/"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        background: '#fca311',
        color: '#1a1a2e',
        padding: '12px 24px',
        borderRadius: '8px',
        fontWeight: 'bold',
        textDecoration: 'none',
        marginTop: '10px',
      }}
    >
      <ArrowLeft size={18} /> Voltar para os jogos
    </Link>
  </div>
);

export default NaoEncontrada;
