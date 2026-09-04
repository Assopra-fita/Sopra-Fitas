import { useEffect, useState } from 'react';
import { obterJogo } from '../services/jogos';

// Resolve qual jogo abrir a partir do id da URL.
//
// Havia aqui um caminho sem rede: 24 jogos moravam em `constants/games.js` e
// `acharJogo` respondia na hora, sem consultar o banco. Esses 24 foram para a
// tabela `jogos` (ver docs/CATALOGO-DE-JOGOS.md) e o caminho saiu junto.
//
// O CUSTO ESTÁ MEDIDO, no site no ar, em 4G com 150 ms de latência: o título da
// sala aparecia em 1204 ms pelo acervo do código e passa a aparecer em 1513 ms
// pelo banco — mediana de três medições. São 310 ms, contra os vários segundos
// que o emulador leva para baixar o core e a ROM logo em seguida.
//
// O que se ganhou em troca: esses 24 jogos eram invisíveis para o painel do GM.
// A vitrine já lia a versão do banco e a sala lia a do código, então corrigir
// uma capa ou tirar um deles do ar pelo painel não tinha efeito nenhum aqui.
export const useJogo = (gameId) => {
  const [jogo, setJogo] = useState(null);
  const [erro, setErro] = useState(null);
  const [idAnterior, setIdAnterior] = useState(gameId);

  // Zerar durante o render, e não dentro do efeito: sem isto o jogo anterior
  // (ou o erro anterior) sobrevive à navegação entre jogos e aparece por um
  // instante no lugar do novo. Feito aqui, o React descarta o render em curso
  // e recomeça com o estado limpo, sem chegar a pintar a tela errada.
  if (idAnterior !== gameId) {
    setIdAnterior(gameId);
    setJogo(null);
    setErro(null);
  }

  useEffect(() => {
    let ativo = true;

    const buscar = async () => {
      try {
        const encontrado = await obterJogo(gameId);
        if (!ativo) return;

        if (encontrado) setJogo(encontrado);
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
  }, [gameId]);

  return { jogo, erro };
};
