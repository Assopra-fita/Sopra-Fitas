import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  Shield,
  Gamepad2,
  Users,
  CheckSquare,
  Trophy,
  Target,
  Settings,
} from 'lucide-react';
import {
  CabecalhoPagina,
  Carregando,
  CascaDePagina,
  LinkVoltar,
} from '../components/ui';

const ATALHOS = [
  {
    para: '/painel-admin-jogos',
    icone: <Gamepad2 size={32} />,
    titulo: 'Upar novo jogo',
    texto: 'Enviar novas ROMs, capas e configurar o emulador.',
    variante: 'upar',
  },
  {
    para: '/admin-gerenciar-jogos',
    icone: <Settings size={32} />,
    titulo: 'Gerenciar acervo',
    texto: 'Editar nomes, consoles ou excluir jogos da biblioteca.',
    variante: 'acervo',
  },
  {
    para: '/admin-desafios',
    icone: <Target size={32} />,
    titulo: 'Lançar desafios',
    texto: 'Criar as missões especiais que aparecem no topo da Home.',
    variante: 'desafios',
  },
  {
    para: '/admin-missoes',
    icone: <CheckSquare size={32} />,
    titulo: 'Validar missões',
    texto: 'Revisar prints e distribuir pontos para os jogadores.',
    variante: 'missoes',
  },
  {
    para: '/ranking',
    icone: <Trophy size={32} />,
    titulo: 'Ranking global',
    texto: 'Visualizar a classificação dos jogadores.',
    variante: 'ranking',
  },
  {
    para: '/admin-usuarios',
    icone: <Users size={32} />,
    titulo: 'Controle de usuários',
    texto: 'Ver apelidos, ajustar pontos e gerenciar permissões.',
    variante: 'usuarios',
  },
];

const Atalho = ({ para, icone, titulo, texto, variante }) => (
  <Link to={para} className={`painel__atalho painel__atalho--${variante}`}>
    <div className="painel__atalho-icone">{icone}</div>
    <h3 className="painel__atalho-titulo">{titulo}</h3>
    <p className="painel__atalho-texto">{texto}</p>
  </Link>
);

const AdminDashboard = () => {
  const [carregando, setCarregando] = useState(true);
  const [numeros, setNumeros] = useState({ jogos: 0, usuarios: 0, missoes: 0 });

  useEffect(() => {
    const buscarNumeros = async () => {
      const contar = (tabela, filtro) => {
        let consulta = supabase
          .from(tabela)
          .select('*', { count: 'exact', head: true });
        if (filtro) consulta = consulta.eq(filtro.coluna, filtro.valor);
        return consulta;
      };

      // As três consultas são independentes: em série somavam três idas ao
      // servidor, em paralelo a espera é a da mais lenta.
      const [jogos, usuarios, missoes] = await Promise.all([
        contar('jogos'),
        contar('profiles'),
        contar('missoes', { coluna: 'status', valor: 'pendente' }),
      ]);

      setNumeros({
        jogos: jogos.count || 0,
        usuarios: usuarios.count || 0,
        missoes: missoes.count || 0,
      });
      setCarregando(false);
    };

    buscarNumeros();
  }, []);

  return (
    <CascaDePagina largura="largo">
      <LinkVoltar para="/perfil">Voltar para o perfil</LinkVoltar>

      <CabecalhoPagina
        icone={<Shield size={32} aria-hidden="true" />}
        titulo="Painel do GM"
        subtitulo="Gerenciamento do Sopra Fitas"
      />

      {carregando ? (
        <Carregando>Carregando os números...</Carregando>
      ) : (
        <div className="painel__numeros">
          <div className="painel__numero painel__numero--acervo">
            <p className="painel__numero-valor">{numeros.jogos}</p>
            <p className="painel__numero-rotulo">Fitas no acervo</p>
          </div>
          <div className="painel__numero painel__numero--jogadores">
            <p className="painel__numero-valor">{numeros.usuarios}</p>
            <p className="painel__numero-rotulo">Jogadores cadastrados</p>
          </div>
          <div className="painel__numero painel__numero--missoes">
            <p className="painel__numero-valor">{numeros.missoes}</p>
            <p className="painel__numero-rotulo">Missões pendentes</p>
          </div>
        </div>
      )}

      <h2 className="painel__secao">Ferramentas de gestão</h2>

      <div className="grade-cartoes">
        {ATALHOS.map((atalho) => (
          <Atalho key={atalho.para} {...atalho} />
        ))}
      </div>
    </CascaDePagina>
  );
};

export default AdminDashboard;
