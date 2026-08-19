import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// Sessão do jogador mais os dados de perfil que o cabeçalho mostra.
// É a única assinatura de onAuthStateChange do projeto.
export const useSessao = () => {
  const [session, setSession] = useState(null);
  const [pontos, setPontos] = useState(0);
  const [nome, setNome] = useState('');

  useEffect(() => {
    const buscarPerfil = async (userId) => {
      const { data } = await supabase
        .from('profiles')
        .select('pontos, nome')
        .eq('id', userId)
        .single();

      if (data) {
        setPontos(data.pontos ?? 0);
        setNome(data.nome ?? '');
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, sessao) => aplicar(sessao));

    return () => subscription.unsubscribe();
  }, []);

  const sair = () => supabase.auth.signOut();

  return { session, pontos, nome, sair };
};
