import React, { useState } from 'react';
import { cadastrarJogo } from '../services/jogos';
import {
  validarImagem,
  validarRom,
  ArquivoInvalido,
} from '../services/armazenamento';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useTituloDaPagina } from '../hooks/useTituloDaPagina';
import { CONSOLES, acharConsole, aceitarRom } from '../constants/consoles';
import {
  Botao,
  CabecalhoPagina,
  Campo,
  Card,
  CascaDePagina,
  LinkVoltar,
} from '../components/ui';

const AdminJogos = () => {
  useTituloDaPagina('Cadastrar jogo');

  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const [id, setId] = useState('');
  const [nome, setNome] = useState('');
  // O console é escolhido numa lista fechada e o core sai dele. Antes os dois
  // eram livres e divergiam: 55 jogos ficaram gravados como 'Super Nintendo',
  // valor que nenhum filtro da Home reconhecia.
  const [consoleNome, setConsoleNome] = useState(CONSOLES[0].valor);
  const core = acharConsole(consoleNome)?.core ?? '';
  const [ano, setAno] = useState('');
  const [fabricante, setFabricante] = useState('');
  const [descricao, setDescricao] = useState('');

  const [capaFile, setCapaFile] = useState(null);
  const [romFile, setRomFile] = useState(null);

  const enviar = async (e) => {
    e.preventDefault();

    const definicao = acharConsole(consoleNome);
    if (!definicao) {
      setAviso({ erro: true, texto: 'Escolha um console da lista.' });
      return;
    }

    // Valida ANTES de subir: sem isto, a capa já foi enviada no campo da ROM
    // 29 vezes, e o emulador recebe um PNG onde esperava o jogo.
    try {
      validarImagem(capaFile, 'A capa');
      validarRom(romFile, definicao.extensoes, definicao.rotulo);
    } catch (erro) {
      if (erro instanceof ArquivoInvalido) {
        setAviso({ erro: true, texto: erro.message });
        return;
      }
      throw erro;
    }

    setEnviando(true);
    setAviso({ erro: false, texto: 'Enviando arquivos...' });

    try {
      await cadastrarJogo({
        id,
        capa: capaFile,
        rom: romFile,
        dados: { nome, console: consoleNome, core, ano, fabricante, descricao },
      });

      setAviso({ erro: false, texto: 'Jogo cadastrado com sucesso.' });
      setId('');
      setNome('');
      setConsoleNome(CONSOLES[0].valor);
      setAno('');
      setFabricante('');
      setDescricao('');
      setCapaFile(null);
      setRomFile(null);
      e.target.reset();
    } catch (erro) {
      console.error(erro);
      setAviso({ erro: true, texto: 'Erro: ' + erro.message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <CascaDePagina largura="estreito">
      <LinkVoltar para="/admin-dashboard">Voltar ao painel do GM</LinkVoltar>

      <CabecalhoPagina
        icone={<PlusCircle size={32} aria-hidden="true" />}
        titulo="Adicionar novo jogo"
        subtitulo="Os arquivos vão para o Storage do Supabase, não para o repositório"
      />

      <Card>
        <form onSubmit={enviar} className="admin__formulario">
          <Campo
            rotulo="Identificador único"
            ajuda="Vira o endereço do jogo, como /jogar/snes-super-mario-world"
            placeholder="snes-super-mario-world"
            value={id}
            onChange={(e) => setId(e.target.value)}
            autoComplete="off"
            required
          />

          <Campo
            rotulo="Nome do jogo"
            placeholder="Super Mario World"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="off"
            required
          />

          <Campo
            rotulo="Console"
            tipo="select"
            opcoes={CONSOLES.map((c) => ({ valor: c.valor, rotulo: c.rotulo }))}
            ajuda={`Emulador: ${core} · ROM aceita: ${aceitarRom(consoleNome).replaceAll(',', ', ')}`}
            value={consoleNome}
            onChange={(e) => setConsoleNome(e.target.value)}
            required
          />

          <Campo
            rotulo="Ano de lançamento"
            placeholder="1990"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            autoComplete="off"
          />

          <Campo
            rotulo="Fabricante"
            placeholder="Nintendo"
            value={fabricante}
            onChange={(e) => setFabricante(e.target.value)}
            autoComplete="off"
          />

          <Campo
            rotulo="Descrição curta"
            tipo="textarea"
            placeholder="Uma frase sobre o jogo."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />

          <Campo
            rotulo="Capa do jogo"
            tipo="file"
            accept="image/*"
            ajuda="Imagem que aparece no card da vitrine"
            onChange={(e) => setCapaFile(e.target.files[0])}
            required
          />

          <Campo
            rotulo="Arquivo da ROM"
            tipo="file"
            accept={aceitarRom(consoleNome)}
            ajuda="O jogo em si. Enviar a capa aqui abre o emulador em tela preta."
            onChange={(e) => setRomFile(e.target.files[0])}
            required
          />

          <Botao type="submit" cheio disabled={enviando}>
            {enviando ? (
              <>
                <Loader2 className="animate-spin" size={20} aria-hidden="true" />
                Enviando...
              </>
            ) : (
              'Subir jogo para o site'
            )}
          </Botao>
        </form>

        {aviso && (
          <p
            className={`jogos__aviso${aviso.erro ? ' jogos__aviso--erro' : ''}`}
            role={aviso.erro ? 'alert' : 'status'}
          >
            {aviso.texto}
          </p>
        )}
      </Card>
    </CascaDePagina>
  );
};

export default AdminJogos;
