import React from 'react';
import { Gamepad2, ArrowLeft } from 'lucide-react';
import { useTituloDaPagina } from '../hooks/useTituloDaPagina';
import { Botao } from '../components/ui';

// Antes desta tela, qualquer URL errada renderizava uma página em branco:
// não havia rota curinga no App.jsx.
const NaoEncontrada = () => {
  useTituloDaPagina('Página não encontrada');

  return (
    <main className="nao-encontrada">
      <Gamepad2 size={64} color="var(--primaria)" aria-hidden="true" />

      <h1 className="nao-encontrada__titulo">
        Essa fita não está na prateleira
      </h1>

      <p className="nao-encontrada__texto">
        A página que você tentou abrir não existe. Pode ter sido um link antigo
        ou um endereço digitado errado.
      </p>

      <Botao para="/">
        <ArrowLeft size={18} aria-hidden="true" /> Voltar para os jogos
      </Botao>
    </main>
  );
};

export default NaoEncontrada;
