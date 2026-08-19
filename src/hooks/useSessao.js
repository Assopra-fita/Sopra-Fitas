import { useEffect, useState } from 'react';
import { assinarSessao, sair as encerrarSessao } from '../services/sessao';
import { obterResumo } from '../services/perfis';

// Sessão do jogador mais os dados de perfil que o cabeçalho mostra.
// É a única assinatura de onAuthStateChange do projeto.
export const useSessao = () => {
  const [session, setSession] = useState(null);
  const [pontos, setPontos] = useState(0);
  const [nome, setNome] = useState('');

  useEffect(() => {
    const buscarPerfil = async (userId) => {
      try {
        const perfil = await obterResumo(userId);
        if (perfil) {
          setPontos(perfil.pontos ?? 0);
          setNome(perfil.nome ?? '');
        }
      } catch (e) {
        console.error('Erro ao buscar o perfil:', e);
      }
    };

    const aplicar = (sessao) => {
      setSession(sessao);
      if (sessao) {
        buscarPerfil(sessao.user.id);
      } else {
        setPontos(0);
        setNome('');
      }
    };

    // O onAuthStateChange dispara INITIAL_SESSION logo ao assinar, então ele
    // já cobre a leitura inicial: chamar getSession aqui duplicava a consulta
    // ao perfil no carregamento da página.
    return assinarSessao(aplicar);
  }, []);

  const sair = () => encerrarSessao();

  return { session, pontos, nome, sair };
};
