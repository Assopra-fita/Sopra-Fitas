import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Trophy, Crown, Medal, Loader2 } from 'lucide-react';
import { useTituloDaPagina } from '../hooks/useTituloDaPagina';
import { CascaDePagina, LinkVoltar } from '../components/ui';

// Coroa para o 1º, medalha para 2º e 3º, número para o resto.
const iconeDaPosicao = (index) => {
  if (index === 0)
    return <Crown size={24} color="var(--primaria)" fill="var(--primaria)" />;
  if (index === 1) return <Medal size={24} color="#C0C0C0" />;
  if (index === 2) return <Medal size={24} color="#CD7F32" />;

  return <span className="ranking__numero">#{index + 1}</span>;
};

const Ranking = () => {
  useTituloDaPagina('Ranking');

  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [ehAdmin, setEhAdmin] = useState(false);

  useEffect(() => {
    const verificarPapel = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (data?.role === 'admin') setEhAdmin(true);
    };

    const buscarRanking = async () => {
      // Não pedir 'email': a coluna trafegava para o navegador de qualquer
      // visitante e o ranking não precisa dela.
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, pontos')
        .order('pontos', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erro ao buscar ranking:', error);
        setErro(true);
      } else {
        setErro(false);
        setUsuarios(data);
      }

      setCarregando(false);
    };

    verificarPapel();
    buscarRanking();
  }, []);

  return (
    <CascaDePagina largura="medio">
      <LinkVoltar para={ehAdmin ? '/admin-dashboard' : '/'}>
        {ehAdmin ? 'Voltar ao painel do GM' : 'Voltar para a Home'}
      </LinkVoltar>

      <header className="ranking__cabecalho">
        <Trophy
          size={60}
          color="var(--primaria)"
          className="ranking__trofeu"
          aria-hidden="true"
        />
        <h1 className="ranking__titulo">Ranking global</h1>
        <p className="ranking__subtitulo">
          Os maiores sopradores de fita da história
        </p>
      </header>

      <div className="ranking__tabela">
        <div className="ranking__linha ranking__linha--cabecalho">
          <div>Posição</div>
          <div>Jogador</div>
          <div className="ranking__coluna-direita">Pontos</div>
        </div>

        {carregando && (
          <p className="estado-carregando">
            <Loader2 className="animate-spin" size={30} aria-hidden="true" />
            <br />
            Carregando a elite...
          </p>
        )}

        {!carregando &&
          usuarios.map((usuario, posicao) => (
            <div
              key={usuario.id}
              className={`ranking__linha${posicao === 0 ? ' ranking__linha--lider' : ''}`}
            >
              <div className="ranking__posicao">{iconeDaPosicao(posicao)}</div>

              <span
                className={`ranking__jogador${posicao === 0 ? ' ranking__jogador--lider' : ''}`}
              >
                {usuario.nome || 'Player sem nome'}
              </span>

              <div className="ranking__pontos">
                {usuario.pontos}{' '}
                <span className="ranking__unidade">XP</span>
              </div>
            </div>
          ))}

        {erro && !carregando && (
          <p className="estado-erro">
            Não foi possível carregar o ranking. Tente de novo daqui a pouco.
          </p>
        )}

        {!erro && !carregando && usuarios.length === 0 && (
          <p className="estado-vazio">Ninguém pontuou ainda. Seja o primeiro!</p>
        )}
      </div>
    </CascaDePagina>
  );
};

export default Ranking;
