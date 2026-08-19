import React from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, Coins } from 'lucide-react';

const CabecalhoHome = ({ session, pontos, nomeUsuario, aoSair, isMobile }) => (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: isMobile ? '12px 16px' : '15px 30px',
        background: 'rgba(18, 18, 18, 0.95)',
        borderBottom: '1px solid #333',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          justifyContent: isMobile ? 'center' : 'flex-end',
          width: isMobile ? '100%' : 'auto',
        }}
      >
        {session ? (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#000',
                padding: '6px 15px',
                borderRadius: '20px',
                border: '1px solid #fca311',
              }}
            >
              <Coins size={16} color="#fca311" />
              <span
                style={{
                  color: '#fca311',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                }}
              >
                {pontos}
              </span>
            </div>

            <Link to="/perfil">
              <button
                style={{
                  background: '#252525',
                  color: '#fff',
                  border: '1px solid #666',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <User size={16} /> {nomeUsuario || 'Meu Perfil'}
              </button>
            </Link>

            <button
              onClick={aoSair}
              style={{
                background: '#333',
                color: '#ff4d4d',
                border: '1px solid #444',
                padding: '8px',
                borderRadius: '50%',
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <Link to="/login">
            <button
              style={{
                background: 'linear-gradient(45deg, #fca311, #ffc300)',
                color: '#1a1a2e',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <User size={16} /> ENTRAR
            </button>
          </Link>
        )}
      </div>
    </div>
);

export default CabecalhoHome;
