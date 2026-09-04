import { useEffect, useState } from 'react';
import { listarOutros } from '../services/jogos';

// Quantos candidatos pedir ao banco antes de sortear.
const CANDIDATOS = 8;

// Sorteia sem mexer no array recebido. O `.sort()` ordena no próprio lugar, e
// um comparador aleatório não produz permutação uniforme. Medido em 200 mil
// rodadas: o primeiro da lista saía em 10,5% dos sorteios contra 3,2% do
// último, quando o justo seriam 4,3% para todos. Na prática eram sempre os
// mesmos jogos aparecendo.
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

// A lista de "jogos relacionados" da sala de jogo: candidatos do banco,
// sorteados sem viés.
//
// Somava aqui os jogos de `constants/games.js`, que já não existe: os 24 foram
// para a tabela `jogos` (ver docs/CATALOGO-DE-JOGOS.md). Com uma fonte só, a
// lista fica vazia se o banco não responder — antes o acervo do código a
// enchia sozinho.
//
// O sorteio acontece no efeito e não num `useMemo`: `useMemo` roda durante o
// render, e o React não garante quantas vezes. Sortear ali significaria uma
// lista diferente a cada render descartado.
export const useRelacionados = (gameId, quantos = 4) => {
  const [jogos, setJogos] = useState([]);

  useEffect(() => {
    let ativo = true;

    const buscar = async () => {
      let candidatos = [];

      try {
        candidatos = (await listarOutros(gameId, CANDIDATOS)) ?? [];
      } catch (e) {
        console.error('Erro ao buscar outros jogos:', e);
        // Sem o banco não há de onde tirar sugestão: a seção some da tela em
        // vez de mostrar lista pela metade.
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
