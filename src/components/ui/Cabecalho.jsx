import React from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, Coins, Trophy } from 'lucide-react';
import Botao from './Botao';
import { MARCA } from '../../lib/seo';

const Cabecalho = ({ session, pontos, nomeUsuario, aoSair }) => (
  <header className="topo">
    {/* Este lado era uma div vazia de 0x0: a barra ficava com o botão de
        entrar solto na ponta direita e nada do outro lado. */}
    <nav className="topo__marca" aria-label="Navegação principal">
      <Link to="/" className="topo__logo" aria-label={`${MARCA}, ir para o início`}>
        {/* Arquivo de 160px e não o de 700: aqui a marca é desenhada com 40px
            de altura (28 no celular), ou seja 75x40 de tela, e o arquivo
            grande custava 24,5 KB em TODA página do site. Este custa 5,8 KB.

            O srcset existe porque 160px empata na conta e não sobra nada: a
            160 de origem para 75x40 desenhados, um aparelho a dpr 3 precisa de
            226x120 e amplia 1,41x — medido, com o texto miúdo "GASTE O FÔLEGO
            SÓ PRA RIR" saindo visivelmente mole. E não é caso raro: celular a
            dpr 3 DEITADO passa de 768px de largura e cai na regra de 40px, que
            num site de emulador é o jeito normal de jogar.

            O /logo-440.webp já existe para a marca grande da Home, então só
            aparelho de dpr 3 para cima paga por ele. */}
        <img
          src="/logo-160.webp"
          srcSet="/logo-160.webp 160w, /logo-440.webp 440w"
          sizes="(max-width: 768px) 53px, 76px"
          alt=""
          width="160"
          height="85"
        />
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

          <Botao
            variante="secundaria"
            compacto
            para="/perfil"
            className="topo__perfil"
          >
            <User size={16} aria-hidden="true" />
            <span className="topo__apelido">
              {nomeUsuario || 'Meu perfil'}
            </span>
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

export default Cabecalho;
