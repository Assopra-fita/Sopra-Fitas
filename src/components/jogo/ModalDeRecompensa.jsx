import React, { useState } from 'react';
import { Home, PlayCircle } from 'lucide-react';
import { Botao } from '../ui';

// Aparece quando o jogador fecha o anúncio antes do fim: o jogo fica pausado
// atrás dela até assistir. Sem esta caixa, o que sobraria na tela era um jogo
// congelado sem motivo aparente, que é indistinguível de site quebrado.
//
// Não tem botão de fechar de propósito. As duas saídas são explícitas —
// assistir, ou voltar para o acervo.
const ModalDeRecompensa = ({ aoAssistir, aoSair, segundos }) => {
  const [carregando, setCarregando] = useState(false);

  const assistir = () => {
    setCarregando(true);
    aoAssistir();
  };

  return (
    <div className="modal">
      <div
        className="modal__caixa"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="titulo-recompensa"
        aria-describedby="texto-recompensa"
      >
        <h2 className="modal__titulo" id="titulo-recompensa">
          <PlayCircle size={22} aria-hidden="true" /> Só mais um pouquinho
        </h2>

        <p className="modal__texto" id="texto-recompensa">
          O anúncio foi fechado cedo demais. Bastam{' '}
          <strong>{segundos} segundos</strong> assistindo para liberar o jogo —
          depois disso é só pular. É o anúncio que paga o servidor e mantém tudo
          aqui de graça.
        </p>

        <div className="modal__acoes">
          <Botao onClick={assistir} cheio disabled={carregando}>
            {carregando ? 'Carregando anúncio...' : 'Assistir anúncio'}
          </Botao>

          <Botao variante="secundaria" onClick={aoSair} cheio>
            <Home size={16} aria-hidden="true" /> Voltar para os jogos
          </Botao>
        </div>
      </div>
    </div>
  );
};

export default ModalDeRecompensa;
