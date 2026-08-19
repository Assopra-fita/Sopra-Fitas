import React from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, Coins, Trophy } from 'lucide-react';
import { Botao } from '../ui';

const CabecalhoHome = ({ session, pontos, nomeUsuario, aoSair }) => (
  <header className="topo">
    {/* Este lado era uma div vazia de 0x0: a barra ficava com o botão de
        entrar solto na ponta direita e nada do outro lado. */}
    <nav className="topo__marca" aria-label="Navegação principal">
      <Link to="/" className="topo__logo" aria-label="Sopra Fitas, ir para o início">
        <img src="/logo.webp" alt="" width="700" height="374" />
      </Link>

      <Link to="/ranking" className="topo__link">
        <Trophy size={16} aria-hidden="true" /> <span>Ranking</span>
      </Link>
    </nav>

    <div className="topo__acoes">
      {session ? (
        <>
          <p className="topo__moedas">
            <Coins size={16} aria-hidden="true" />
            <span>{pontos}</span>
            <span className="visualmente-oculto">pontos</span>
          </p>

          <Botao variante="secundaria" compacto para="/perfil">
            <User size={16} aria-hidden="true" />
            {nomeUsuario || 'Meu perfil'}
          </Botao>

          <Botao
            variante="secundaria"
            compacto
            onClick={aoSair}
            aria-label="Sair da conta"
          >
            <LogOut size={16} aria-hidden="true" />
          </Botao>
        </>
      ) : (
        <Botao compacto para="/login">
          <User size={16} aria-hidden="true" /> Entrar
        </Botao>
      )}
    </div>
  </header>
);

export default CabecalhoHome;
