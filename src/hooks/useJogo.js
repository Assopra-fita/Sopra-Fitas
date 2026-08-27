import { useEffect, useState } from 'react';
import { acharJogo } from '../constants/games';
import { obterJogo } from '../services/jogos';

// Resolve qual jogo abrir a partir do id da URL.
//
// A ordem importa e é oposta à da vitrine: aqui o acervo do código vem
// primeiro, e o banco só é consultado se o id não existir nele. Ver a seção
// das duas fontes em docs/CATALOGO-DE-JOGOS.md.
export const useJogo = (gameId) => {
  // O acervo do código responde na hora, sem rede. Ele é DERIVADO e não
  // estado: guardá-lo com setState num efeito custaria um render a mais e um
  // quadro mostrando "carregando" para um dado que já estava em memória.
  const doAcervo = acharJogo(gameId);

  const [doBanco, setDoBanco] = useState(null);
  const [erro, setErro] = useState(null);
  const [idAnterior, setIdAnterior] = useState(gameId);

  // Zerar durante o render, e não dentro do efeito: sem isto o jogo anterior
  // (ou o erro anterior) sobrevive à navegação entre jogos e aparece por um
  // instante no lugar do novo. Feito aqui, o React descarta o render em curso
  // e recomeça com o estado limpo, sem chegar a pintar a tela errada.
  if (idAnterior !== gameId) {
    setIdAnterior(gameId);
    setDoBanco(null);
    setErro(null);
  }

  useEffect(() => {
    if (doAcervo) return undefined;

    let ativo = true;

    const buscar = async () => {
      try {
        const encontrado = await obterJogo(gameId);
        if (!ativo) return;

        if (encontrado) setDoBanco(encontrado);
        else setErro('Não encontramos esse jogo no acervo.');
      } catch (e) {
        console.error('Erro ao obter o jogo:', e);
        if (ativo) setErro('Não encontramos esse jogo no acervo.');
      }
    };

    buscar();
    return () => {
      ativo = false;
    };
  }, [gameId, doAcervo]);

  return { jogo: doAcervo ?? doBanco, erro };
};
