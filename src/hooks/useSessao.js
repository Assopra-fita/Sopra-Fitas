import { useEffect, useState } from 'react';
import { assinarSessao, sair as encerrarSessao } from '../services/sessao';
import { obterResumo, atualizarNome } from '../services/perfis';

// Sessão do jogador mais os dados de perfil que o cabeçalho mostra.
// É a única assinatura de onAuthStateChange do projeto.
export const useSessao = () => {
  const [session, setSession] = useState(null);
  const [pontos, setPontos] = useState(0);
  const [nome, setNome] = useState('');

  useEffect(() => {
    const buscarPerfil = async (usuario) => {
      try {
        const perfil = await obterResumo(usuario.id);
        if (!perfil) return;

        // O apelido escolhido no cadastro fica em `user_metadata` até alguém
        // copiá-lo para `profiles`. Quem cria a linha do perfil é uma trigger
        // que mora no banco e não neste repositório — enquanto ela não copiar,
        // quem copia é isto, no primeiro carregamento com sessão. Uma escrita
        // só: da segunda vez em diante `perfil.nome` já vem preenchido.
        const doCadastro = usuario.user_metadata?.nome;
        const nomeAtual = perfil.nome || '';

        setPontos(perfil.pontos ?? 0);
        setNome(nomeAtual || doCadastro || '');

        if (!nomeAtual && doCadastro) {
          await atualizarNome(usuario.id, doCadastro);
        }
      } catch (e) {
        console.error('Erro ao buscar o perfil:', e);
      }
    };

    const aplicar = (sessao) => {
      setSession(sessao);
      if (sessao) {
        buscarPerfil(sessao.user);
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
