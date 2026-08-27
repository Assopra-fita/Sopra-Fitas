import React from 'react';
import { Home, Download, Upload, RotateCcw, Maximize } from 'lucide-react';

// A barra abaixo da tela do jogo. O tamanho do ícone e a compactação no
// celular deitado são decisão de CSS, em src/styles/jogo.css.
const BarraDeControles = ({ aoSair, aoSalvar, aoCarregar, aoReiniciar, aoTelaCheia }) => (
  <div className="barra-jogo">
    <button
      type="button"
      className="barra-jogo__botao barra-jogo__botao--sair"
      onClick={aoSair}
    >
      <Home aria-hidden="true" /> Sair
    </button>

    <span className="barra-jogo__divisor" aria-hidden="true" />

    <button type="button" className="barra-jogo__botao" onClick={aoSalvar}>
      <Download aria-hidden="true" /> Salvar
    </button>
    <button type="button" className="barra-jogo__botao" onClick={aoCarregar}>
      <Upload aria-hidden="true" /> Carregar
    </button>
    <button type="button" className="barra-jogo__botao" onClick={aoReiniciar}>
      <RotateCcw aria-hidden="true" /> Reiniciar
    </button>
    <button
      type="button"
      className="barra-jogo__botao barra-jogo__botao--tela-cheia"
      onClick={aoTelaCheia}
    >
      <Maximize aria-hidden="true" /> Tela cheia
    </button>
  </div>
);

export default BarraDeControles;
