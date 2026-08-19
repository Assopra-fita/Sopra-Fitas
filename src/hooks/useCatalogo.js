import { useEffect, useState } from 'react';
import { listarParaVitrine } from '../services/jogos';
import { games } from '../constants/games';

// Junta o catálogo do banco com o estático, sem repetir id. Antes era uma
// concatenação crua, e um id cadastrado nas duas fontes aparecia duas vezes na
// vitrine — o "Super Mario World" duplicado saía daí.
const juntar = (doBanco) => {
  const porId = new Map();
  for (const jogo of [...doBanco, ...games]) {
    if (!porId.has(jogo.id)) porId.set(jogo.id, jogo);
  }
  return [...porId.values()];
};

export const useCatalogo = () => {
  const [jogos, setJogos] = useState(games);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    const buscar = async () => {
      try {
        const doBanco = await listarParaVitrine();
        if (ativo && doBanco?.length) setJogos(juntar(doBanco));
      } catch (e) {
        console.error('Erro ao buscar jogos:', e);
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    buscar();
    return () => {
      ativo = false;
    };
  }, []);

  return { jogos, carregando };
};
