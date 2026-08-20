import { useEffect, useState } from 'react';
import { outrosJogos } from '../constants/games';
import { listarOutros } from '../services/jogos';

// Quantos candidatos pedir ao banco antes de sortear.
const CANDIDATOS = 8;

// Sorteia sem mexer no array recebido. O `.sort()` ordena no próprio lugar, e
// um comparador aleatório não produz permutação uniforme. Medido em 200 mil
// rodadas nos dois tamanhos que esta lista tem — 23 sem o banco e 31 com ele:
// o primeiro do acervo saía em 10,5% e 8,3% dos sorteios, contra 3,2% e 3,1%
// do último, quando o justo seriam 4,3% e 3,2% para todos. Na prática eram
// sempre os mesmos jogos aparecendo.
//
// Fisher-Yates parcial embaralha só os itens que vão ser usados.
const sortear = (lista, quantos) => {
  const copia = [...lista];
  const total = Math.min(quantos, copia.length);

  for (let i = 0; i < total; i++) {
    const j = i + Math.floor(Math.random() * (copia.length - i));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }

  return copia.slice(0, total);
};

// A lista de "jogos relacionados" da sala de jogo: candidatos do banco mais os
// do acervo do código, sorteados sem viés.
//
// O sorteio acontece no efeito e não num `useMemo`: `useMemo` roda durante o
// render, e o React não garante quantas vezes. Sortear ali significaria uma
// lista diferente a cada render descartado.
export const useRelacionados = (gameId, quantos = 4) => {
  const [jogos, setJogos] = useState([]);

  useEffect(() => {
    const doCatalogo = outrosJogos(gameId);
    let ativo = true;

    const buscar = async () => {
      let candidatos = doCatalogo;

      try {
        const doBanco = await listarOutros(gameId, CANDIDATOS);
        if (doBanco?.length) candidatos = [...doBanco, ...doCatalogo];
      } catch (e) {
        console.error('Erro ao buscar outros jogos:', e);
        // O acervo do código sozinho já enche a lista.
      }

      if (ativo) setJogos(sortear(candidatos, quantos));
    };

    buscar();
    return () => {
      ativo = false;
    };
  }, [gameId, quantos]);

  return jogos;
};
