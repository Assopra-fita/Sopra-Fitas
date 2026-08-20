import React, { useState, useEffect } from 'react';
import { listarDesafios, criarDesafio, removerDesafio } from '../services/desafios';
import { Target, PlusCircle, Trash2 } from 'lucide-react';
import { useTituloDaPagina } from '../hooks/useTituloDaPagina';
import { useAviso } from '../hooks/useAviso';
import {
  Aviso,
  Botao,
  CabecalhoPagina,
  Campo,
  Card,
  CascaDePagina,
  LinkVoltar,
} from '../components/ui';

const AdminDesafios = () => {
  useTituloDaPagina('Lançar desafios');

  const { aviso, mostrarAviso, limparAviso } = useAviso();

  const [titulo, setTitulo] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [recompensa, setRecompensa] = useState('');
  const [desafios, setDesafios] = useState([]);

  const consultarDesafios = async () => {
    try {
      return await listarDesafios();
    } catch (e) {
      console.error('Erro ao buscar desafios:', e);
      return null;
    }
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
    // `trim`: um campo com só espaços passa no `required` do navegador e
    // gravaria um desafio de título em branco no topo da Home.
    if (!titulo.trim() || !objetivo.trim() || !recompensa)
      return mostrarAviso('Preencha todos os campos.', { erro: true });

    try {
      await criarDesafio({
        titulo: titulo.trim(),
        objetivo: objetivo.trim(),
        recompensa: parseInt(recompensa, 10),
      });
    } catch (e) {
      return mostrarAviso('Erro ao lançar: ' + e.message, { erro: true });
    }

    mostrarAviso('Desafio publicado no topo da Home.');
    setTitulo('');
    setObjetivo('');
    setRecompensa('');
    buscarDesafios();
  };

  const remover = async (id) => {
    if (!window.confirm('Remover este desafio da Home definitivamente?')) return;

    try {
      await removerDesafio(id);
      buscarDesafios();
    } catch (e) {
      mostrarAviso('Erro ao remover: ' + e.message, { erro: true });
    }
  };

  return (
    <CascaDePagina largura="largo">
      <LinkVoltar para="/admin-dashboard">Voltar ao painel do GM</LinkVoltar>

      <CabecalhoPagina
        icone={<Target size={32} aria-hidden="true" />}
        titulo="Lançar desafios do mês"
        subtitulo="Aparecem no topo da Home para todos os jogadores"
      />

      <Aviso aviso={aviso} aoFechar={limparAviso} />

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
