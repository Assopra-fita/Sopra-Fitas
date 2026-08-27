import React from 'react';
import { Calendar, Gamepad, Trophy } from 'lucide-react';
import { Botao } from '../ui';

// Ficha técnica do jogo, com o cartão de missão ao lado.
const FichaDoJogo = ({ jogo, aoEnviarPrint }) => (
  <div className="painel-jogo">
    <div className="painel-jogo__texto">
      <h1 className="painel-jogo__titulo">{jogo.nome}</h1>

      <p className="painel-jogo__ficha">
        <span>
          <Calendar size={14} aria-hidden="true" /> {jogo.ano}
        </span>
        <span>
          <Gamepad size={14} aria-hidden="true" /> {jogo.fabricante}
        </span>
      </p>

      <p className="painel-jogo__descricao">{jogo.descricao}</p>
    </div>

    <div className="painel-missao">
      <h2 className="painel-missao__titulo">
        <Trophy size={20} aria-hidden="true" /> Missão de jogo
      </h2>
      <p className="painel-missao__texto">
        Tire um print da sua maior pontuação ou do final do jogo e nos envie!
      </p>
      <Botao cheio onClick={aoEnviarPrint}>
        Enviar print
      </Botao>
    </div>
  </div>
);

export default FichaDoJogo;
