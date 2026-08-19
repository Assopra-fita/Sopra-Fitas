import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Target, PlusCircle, Trash2 } from 'lucide-react';
import { useTituloDaPagina } from '../hooks/useTituloDaPagina';
import {
  Botao,
  CabecalhoPagina,
  Campo,
  Card,
  CascaDePagina,
  LinkVoltar,
} from '../components/ui';

const AdminDesafios = () => {
  useTituloDaPagina('Lançar desafios');

  const [titulo, setTitulo] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [recompensa, setRecompensa] = useState('');
  const [desafios, setDesafios] = useState([]);

  const consultarDesafios = async () => {
    const { data, error } = await supabase
      .from('missoes_globais')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Erro ao buscar desafios:', error.message);
    return error ? null : data;
  };

  // A guarda `ativo` existe porque a resposta pode chegar depois de sair da
  // tela, e aí o estado seria escrito num componente já desmontado.
  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      const lista = await consultarDesafios();
      if (ativo && lista) setDesafios(lista);
    };

    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  const buscarDesafios = async () => {
    const lista = await consultarDesafios();
    if (lista) setDesafios(lista);
  };

  const lancar = async (e) => {
    e.preventDefault();
    if (!titulo || !objetivo || !recompensa)
      return alert('Preencha todos os campos.');

    const { error } = await supabase.from('missoes_globais').insert([
      {
        titulo,
        objetivo,
        recompensa: parseInt(recompensa, 10),
        tipo: 'mensal',
      },
    ]);

    if (error) return alert('Erro ao lançar: ' + error.message);

    alert('Desafio publicado no topo da Home.');
    setTitulo('');
    setObjetivo('');
    setRecompensa('');
    buscarDesafios();
  };

  const remover = async (id) => {
    if (!window.confirm('Remover este desafio da Home definitivamente?')) return;

    const { error } = await supabase
      .from('missoes_globais')
      .delete()
      .eq('id', id);

    if (error) alert('Erro ao remover: ' + error.message);
    else buscarDesafios();
  };

  return (
    <CascaDePagina largura="largo">
      <LinkVoltar para="/admin-dashboard">Voltar ao painel do GM</LinkVoltar>

      <CabecalhoPagina
        icone={<Target size={32} aria-hidden="true" />}
        titulo="Lançar desafios do mês"
        subtitulo="Aparecem no topo da Home para todos os jogadores"
      />

      <div className="admin__duas-colunas">
        <Card>
          <h2 className="admin__subtitulo">Novo desafio</h2>

          <form onSubmit={lancar} className="admin__formulario">
            <Campo
              rotulo="Nome do desafio"
              placeholder="Ex: Mestre do Shoryuken"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />

            <Campo
              rotulo="O que o jogador precisa fazer"
              tipo="textarea"
              placeholder="Ex: termine Street Fighter II no difícil sem usar continue."
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              required
            />

            <Campo
              rotulo="Recompensa em pontos"
              type="number"
              min="1"
              placeholder="500"
              value={recompensa}
              onChange={(e) => setRecompensa(e.target.value)}
              required
            />

            <Botao type="submit" cheio>
              <PlusCircle size={20} aria-hidden="true" /> Publicar desafio
            </Botao>
          </form>
        </Card>

        <Card>
          <h2 className="admin__subtitulo">Desafios no ar</h2>

          {desafios.length === 0 ? (
            <p className="estado-vazio">Nenhum desafio ativo no momento.</p>
          ) : (
            desafios.map((desafio) => (
              <div className="admin__item" key={desafio.id}>
                <div>
                  <p className="admin__item-titulo">{desafio.titulo}</p>
                  <p className="admin__item-detalhe">
                    +{desafio.recompensa} pts
                  </p>
                </div>

                <Botao
                  variante="perigo"
                  compacto
                  onClick={() => remover(desafio.id)}
                  aria-label={`Remover o desafio ${desafio.titulo}`}
                >
                  <Trash2 size={18} aria-hidden="true" />
                </Botao>
              </div>
            ))
          )}
        </Card>
      </div>
    </CascaDePagina>
  );
};

export default AdminDesafios;
