import React, { useEffect, useState } from 'react';
import { listarAcervo, atualizarJogo, removerJogo } from '../services/jogos';
import { Edit, Trash2, X, Check, Library } from 'lucide-react';
import { useTituloDaPagina } from '../hooks/useTituloDaPagina';
import { useAviso } from '../hooks/useAviso';
import { paraComparar } from '../lib/texto';
import {
  Aviso,
  Botao,
  CabecalhoPagina,
  Campo,
  Carregando,
  CascaDePagina,
  EstadoVazio,
  LinkVoltar,
  Tabela,
} from '../components/ui';

const AdminGerenciarJogos = () => {
  useTituloDaPagina('Gerenciar acervo');

  const { aviso, mostrarAviso, limparAviso } = useAviso();

  const [jogos, setJogos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [dadosEditados, setDadosEditados] = useState({});

  const consultarJogos = async () => {
    try {
      return await listarAcervo();
    } catch (e) {
      console.error('Erro ao buscar jogos:', e);
      return null;
    }
  };

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      const lista = await consultarJogos();
      if (!ativo) return;

      if (lista) setJogos(lista);
      setCarregando(false);
    };

    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  const recarregar = async () => {
    const lista = await consultarJogos();
    if (lista) setJogos(lista);
  };

  const iniciarEdicao = (jogo) => {
    setEditandoId(jogo.id);
    setDadosEditados({ ...jogo });
  };

  const salvarEdicao = async (id) => {
    try {
      await atualizarJogo(id, dadosEditados);
      setEditandoId(null);
      recarregar();
      mostrarAviso(`"${dadosEditados.nome}" foi atualizado.`);
    } catch (e) {
      mostrarAviso('Erro ao atualizar: ' + e.message, { erro: true });
    }
  };

  const deletarJogo = async (jogo) => {
    if (!window.confirm(`Tem certeza que deseja deletar o jogo "${jogo.nome}"?`))
      return;

    try {
      const { arquivosRemovidos, quantos } = await removerJogo(jogo);
      recarregar();

      // Três desfechos diferentes, e nenhum deles é "removido" seco: apagar a
      // linha e deixar 8 MB de ROM para trás no Storage foi como se juntaram
      // as 10 ROMs e as 11 capas órfãs que já estão lá.
      mostrarAviso(
        !arquivosRemovidos
          ? `"${jogo.nome}" saiu do acervo, mas a capa e a ROM continuam no Storage.`
          : quantos === 0
            ? `"${jogo.nome}" saiu do acervo. Ele não tinha arquivo no Storage.`
            : `"${jogo.nome}" saiu do acervo, junto com a capa e a ROM.`,
        { erro: !arquivosRemovidos }
      );
    } catch (e) {
      mostrarAviso('Erro ao deletar: ' + e.message, { erro: true });
    }
  };

  // Içado para fora do predicado: sem isso a normalização roda uma vez por
  // jogo a cada tecla digitada.
  const alvo = paraComparar(busca);
  const jogosFiltrados = jogos.filter(
    (j) =>
      paraComparar(j.nome ?? '').includes(alvo) ||
      paraComparar(j.console ?? '').includes(alvo)
  );

  const campoDaLinha = (jogo, coluna, rotulo) =>
    editandoId === jogo.id ? (
      <Campo
        compacto
        aria-label={`${rotulo} de ${jogo.nome}`}
        value={dadosEditados[coluna] ?? ''}
        onChange={(e) =>
          setDadosEditados((atual) => ({ ...atual, [coluna]: e.target.value }))
        }
      />
    ) : (
      jogo[coluna]
    );

  const colunas = [
    {
      cabecalho: 'Capa',
      render: (j) => (
        <img
          className="acervo__capa"
          src={j.capa_url}
          alt=""
          width="40"
          height="40"
          loading="lazy"
        />
      ),
    },
    {
      cabecalho: 'Nome',
      render: (j) => campoDaLinha(j, 'nome', 'Nome'),
    },
    {
      cabecalho: 'Console',
      render: (j) => campoDaLinha(j, 'console', 'Console'),
    },
    {
      cabecalho: 'ID',
      classe: 'acervo__secundaria',
      render: (j) => <code className="acervo__id">{j.id}</code>,
    },
    {
      cabecalho: 'Ano',
      classe: 'acervo__secundaria',
      render: (j) => campoDaLinha(j, 'ano', 'Ano'),
    },
    {
      cabecalho: 'Fabricante',
      classe: 'acervo__secundaria',
      render: (j) => campoDaLinha(j, 'fabricante', 'Fabricante'),
    },
    {
      cabecalho: 'Ações',
      render: (j) =>
        editandoId === j.id ? (
          <div className="acervo__acoes">
            <Botao
              variante="sucesso"
              className="btn--icone"
              onClick={() => salvarEdicao(j.id)}
              aria-label={`Salvar as alterações de ${j.nome}`}
            >
              <Check size={18} aria-hidden="true" />
            </Botao>
            <Botao
              variante="secundaria"
              className="btn--icone"
              onClick={() => setEditandoId(null)}
              aria-label={`Cancelar a edição de ${j.nome}`}
            >
              <X size={18} aria-hidden="true" />
            </Botao>
          </div>
        ) : (
          <div className="acervo__acoes">
            <Botao
              variante="secundaria"
              className="btn--icone"
              onClick={() => iniciarEdicao(j)}
              aria-label={`Editar ${j.nome}`}
            >
              <Edit size={18} aria-hidden="true" />
            </Botao>
            <Botao
              variante="perigo"
              className="btn--icone"
              onClick={() => deletarJogo(j)}
              aria-label={`Deletar ${j.nome}`}
            >
              <Trash2 size={18} aria-hidden="true" />
            </Botao>
          </div>
        ),
    },
  ];

  return (
    <CascaDePagina largura="total">
      <LinkVoltar para="/admin-dashboard">Voltar ao painel do GM</LinkVoltar>

      <CabecalhoPagina
        icone={<Library size={32} aria-hidden="true" />}
        titulo="Gerenciar acervo de jogos"
        subtitulo={`${jogos.length} jogos cadastrados pelo painel`}
        acao={<Botao para="/painel-admin-jogos">Adicionar novo</Botao>}
      />

      <Aviso aviso={aviso} aoFechar={limparAviso} />

      <Campo
        tipo="search"
        rotulo="Buscar no acervo"
        placeholder="Por nome ou console"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {carregando ? (
        <Carregando>Carregando o acervo...</Carregando>
      ) : (
        <Tabela
          className="acervo"
          colunas={colunas}
          dados={jogosFiltrados}
          chave={(j) => j.id}
          vazio={
            <EstadoVazio>
              {busca
                ? `Nenhum jogo encontrado para "${busca}".`
                : 'Nenhum jogo cadastrado pelo painel.'}
            </EstadoVazio>
          }
        />
      )}
    </CascaDePagina>
  );
};

export default AdminGerenciarJogos;
