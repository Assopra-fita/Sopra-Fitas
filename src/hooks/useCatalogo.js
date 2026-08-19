import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
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
        const { data, error } = await supabase
          .from('jogos')
          .select('id, nome, console, core, rom_url, capa_url');
        if (error) throw error;
        if (ativo && data?.length) setJogos(juntar(data));
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
