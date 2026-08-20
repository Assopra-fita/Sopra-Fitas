import React, { useEffect, useState } from 'react';
import {
  listarJogadores,
  atualizarPontos,
  definirPapel,
} from '../services/perfis';
import { Users, Shield, ShieldOff, Save } from 'lucide-react';
import { useTituloDaPagina } from '../hooks/useTituloDaPagina';
import { useAviso } from '../hooks/useAviso';
import {
  Aviso,
  Botao,
  CabecalhoPagina,
  Campo,
  Carregando,
  CascaDePagina,
  LinkVoltar,
  Tabela,
} from '../components/ui';

const AdminUsuarios = () => {
  useTituloDaPagina('Gestão de jogadores');

  const { aviso, mostrarAviso, limparAviso } = useAviso();

  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [editandoPontos, setEditandoPontos] = useState({});

  const consultarUsuarios = async () => {
    try {
      return await listarJogadores();
    } catch (e) {
      console.error('Erro ao buscar os jogadores:', e);
      return null;
    }
  };

  const aplicarUsuarios = (lista) => {
    setUsuarios(lista);
    setEditandoPontos(
      Object.fromEntries(lista.map((u) => [u.id, u.pontos ?? 0]))
    );
  };

  // A guarda `ativo` existe porque a resposta pode chegar depois de sair da
  // tela, e aí o estado seria escrito num componente já desmontado.
  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      const lista = await consultarUsuarios();
      if (!ativo) return;

      if (lista) aplicarUsuarios(lista);
      setCarregando(false);
    };

    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  const recarregar = async () => {
    const lista = await consultarUsuarios();
    if (lista) aplicarUsuarios(lista);
  };

  const nomeDe = (id) =>
    usuarios.find((u) => u.id === id)?.nome || 'jogador sem nome';

  const salvarPontos = async (id) => {
    const novosPontos = parseInt(editandoPontos[id], 10);
    if (Number.isNaN(novosPontos))
      return mostrarAviso('Informe um número de pontos.', { erro: true });

    try {
      await atualizarPontos(id, novosPontos);
      mostrarAviso(`Pontuação de ${nomeDe(id)} atualizada.`);
      recarregar();
    } catch (e) {
      mostrarAviso('Erro ao salvar os pontos: ' + e.message, { erro: true });
    }
  };

  const alternarPapel = async (id, papelAtual) => {
    try {
      await definirPapel(id, papelAtual === 'admin' ? 'user' : 'admin');
      recarregar();
    } catch (e) {
      mostrarAviso('Erro ao mudar o cargo: ' + e.message, { erro: true });
    }
  };

  const colunas = [
    {
      cabecalho: 'Jogador',
      render: (u) => (
        <>
          <p className="usuarios__nome">{u.nome || 'Sem nome'}</p>
          <p className="usuarios__email">{u.email}</p>
        </>
      ),
    },
    {
      cabecalho: 'Pontos',
      render: (u) => <span className="usuarios__pontos">{u.pontos}</span>,
    },
    {
      cabecalho: 'Editar pontos',
      render: (u) => (
        <div className="usuarios__editar">
          <Campo
            type="number"
            compacto
            className="usuarios__campo-pontos"
            aria-label={`Pontos de ${u.nome || 'jogador sem nome'}`}
            value={editandoPontos[u.id] ?? 0}
            onChange={(e) =>
              setEditandoPontos((atual) => ({
                ...atual,
                [u.id]: e.target.value,
              }))
            }
          />
          <Botao
            variante="sucesso"
            className="btn--icone"
            onClick={() => salvarPontos(u.id)}
            aria-label={`Salvar os pontos de ${u.nome || 'jogador sem nome'}`}
          >
            <Save size={16} aria-hidden="true" />
          </Botao>
        </div>
      ),
    },
    {
      cabecalho: 'Cargo',
      render: (u) => (
        <span
          className={`usuarios__papel${u.role === 'admin' ? ' usuarios__papel--admin' : ''}`}
        >
          {u.role}
        </span>
      ),
    },
    {
      cabecalho: 'Ações',
      render: (u) => (
        <Botao
          variante="secundaria"
          className="btn--icone"
          onClick={() => alternarPapel(u.id, u.role)}
          aria-label={
            u.role === 'admin'
              ? `Rebaixar ${u.nome || 'jogador sem nome'} para jogador comum`
              : `Promover ${u.nome || 'jogador sem nome'} a administrador`
          }
        >
          {u.role === 'admin' ? (
            <ShieldOff size={20} aria-hidden="true" />
          ) : (
            <Shield size={20} aria-hidden="true" />
          )}
        </Botao>
      ),
    },
  ];

  return (
    <CascaDePagina largura="total">
      <LinkVoltar para="/admin-dashboard">Voltar ao painel do GM</LinkVoltar>

      <CabecalhoPagina
        icone={<Users size={32} aria-hidden="true" />}
        titulo="Gestão de jogadores e pontos"
        subtitulo={`${usuarios.length} jogadores cadastrados`}
      />

      <Aviso aviso={aviso} aoFechar={limparAviso} />

      {carregando ? (
        <Carregando>Carregando jogadores...</Carregando>
      ) : (
        <Tabela colunas={colunas} dados={usuarios} chave={(u) => u.id} />
      )}
    </CascaDePagina>
  );
};

export default AdminUsuarios;
