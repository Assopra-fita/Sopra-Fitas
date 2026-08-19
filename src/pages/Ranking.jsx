import React, { useEffect, useState } from 'react';
import { obterUsuario } from '../services/sessao';
import { listarRanking, obterPapel } from '../services/perfis';
import { Trophy, Crown, Medal, Loader2 } from 'lucide-react';
import { useTituloDaPagina } from '../hooks/useTituloDaPagina';
import { CascaDePagina, LinkVoltar } from '../components/ui';

// Coroa para o 1º, medalha para 2º e 3º, número para o resto.
const iconeDaPosicao = (index) => {
  if (index === 0)
    return <Crown size={24} color="var(--primaria)" fill="var(--primaria)" />;
  if (index === 1) return <Medal size={24} color="var(--medalha-prata)" />;
  if (index === 2) return <Medal size={24} color="var(--medalha-bronze)" />;

  return <span className="ranking__numero">#{index + 1}</span>;
};

const Ranking = () => {
  useTituloDaPagina('Ranking');

  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [ehAdmin, setEhAdmin] = useState(false);

  useEffect(() => {
    let ativo = true;

    // Só decide para onde o link "voltar" aponta. Falhar aqui não é motivo
    // para estragar a tela: o visitante volta para a Home, que é o padrão.
    const verificarPapel = async () => {
      try {
        const usuario = await obterUsuario();
        if (!usuario) return;

        const papel = await obterPapel(usuario.id);
        if (ativo && papel === 'admin') setEhAdmin(true);
      } catch (e) {
        console.error('Erro ao verificar o papel:', e);
      }
    };

    const buscarRanking = async () => {
      try {
        const lista = await listarRanking(50);
        if (!ativo) return;
        setUsuarios(lista);
        setErro(false);
      } catch (e) {
        console.error('Erro ao buscar o ranking:', e);
        if (ativo) setErro(true);
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    verificarPapel();
    buscarRanking();

    return () => {
      ativo = false;
    };
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
