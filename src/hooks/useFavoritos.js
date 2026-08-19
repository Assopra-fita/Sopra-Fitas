import { useCallback, useEffect, useState } from 'react';

const CHAVE = 'sopra-fitas-favs';

const ler = () => {
  try {
    const salvos = localStorage.getItem(CHAVE);
    const lista = salvos ? JSON.parse(salvos) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    // Um valor inválido na chave derrubava a aplicação inteira no primeiro
    // render, porque o JSON.parse ficava sem tratamento no inicializador.
    return [];
  }
};

// Favoritos vivem no navegador, não na conta: são por aparelho.
export const useFavoritos = () => {
  const [favoritos, setFavoritos] = useState(ler);

  useEffect(() => {
    localStorage.setItem(CHAVE, JSON.stringify(favoritos));
  }, [favoritos]);

  const alternar = useCallback((id) => {
    setFavoritos((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]
    );
  }, []);

  return { favoritos, alternar };
};
