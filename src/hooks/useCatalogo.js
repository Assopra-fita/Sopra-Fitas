import { useEffect, useState } from 'react';
import { listarParaVitrine } from '../services/jogos';

// O catálogo da vitrine, que vem inteiro do Supabase.
//
// Havia uma segunda fonte, `constants/games.js`, com 24 jogos escritos no
// código e as ROMs dentro do repositório. Os dois acervos eram juntados aqui,
// deduplicando por id. Os 24 foram para a tabela `jogos` — ver
// docs/CATALOGO-DE-JOGOS.md — e a fonte passou a ser uma só.
//
// Não existe mais estado inicial com jogos: a Home mostra "Carregando..."
// enquanto `carregando` for verdadeiro (Home.jsx), então os 24 do estado
// inicial nunca chegavam a aparecer na tela. Medido: a Home ia de 0 para 12
// cards, sem passo intermediário. O que se perdeu de fato é a rede de
// segurança de o banco cair — antes sobravam 24 jogos, agora a vitrine fica
// vazia. É o mesmo que já acontecia para os outros 133.
export const useCatalogo = () => {
  const [jogos, setJogos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    const buscar = async () => {
      try {
        const doBanco = await listarParaVitrine();
        if (ativo && doBanco?.length) setJogos(doBanco);
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
