import React from 'react';
import { Trophy, X } from 'lucide-react';
import { Botao, Campo } from '../ui';

// Caixa de envio do print da missão.
const ModalDeMissao = ({ enviando, aoEscolherArquivo, aoEnviar, aoFechar }) => (
  <div className="modal">
    <div
      className="modal__caixa"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-missao"
    >
      <button
        type="button"
        className="modal__fechar"
        onClick={aoFechar}
        aria-label="Fechar"
      >
        <X size={24} aria-hidden="true" />
      </button>

      <h2 className="modal__titulo" id="titulo-missao">
        <Trophy size={22} aria-hidden="true" /> Enviar missão
      </h2>

      <form onSubmit={aoEnviar} className="modal__formulario">
        <Campo
          tipo="file"
          accept="image/*"
          rotulo="Print da tela"
          ajuda="Use o print nativo do aparelho, não foto da tela"
          onChange={aoEscolherArquivo}
        />

        <Botao type="submit" cheio disabled={enviando}>
          {enviando ? 'Enviando...' : 'Confirmar envio'}
        </Botao>
      </form>
    </div>
  </div>
);

export default ModalDeMissao;
