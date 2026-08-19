import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
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

    // A capa já foi enviada no campo da ROM 29 vezes; sem esta checagem o
    // emulador recebe um PNG e o jogo abre em tela preta.
    if (!capaFile?.type.startsWith('image/')) {
      setAviso({ erro: true, texto: 'A capa precisa ser uma imagem.' });
      return;
    }

    const extRom = romFile?.name.split('.').pop()?.toLowerCase() ?? '';
    if (!definicao.extensoes.includes(extRom)) {
      setAviso({
        erro: true,
        texto: `ROM de ${definicao.rotulo} precisa ser ${definicao.extensoes
          .map((x) => '.' + x)
          .join(', ')} — o arquivo enviado é .${extRom}`,
      });
      return;
    }

    setEnviando(true);
    setAviso({ erro: false, texto: 'Enviando arquivos...' });

    try {
      const capaExt = capaFile.name.split('.').pop();
      const capaPath = `${id}-capa.${capaExt}`;
      const { error: capaError } = await supabase.storage
        .from('capas')
        .upload(capaPath, capaFile, { upsert: true });

      if (capaError) throw capaError;
      const capaUrl = supabase.storage.from('capas').getPublicUrl(capaPath)
        .data.publicUrl;

      const romExt = romFile.name.split('.').pop();
      const romPath = `${id}.${romExt}`;
      const { error: romError } = await supabase.storage
        .from('roms')
        .upload(romPath, romFile, { upsert: true });

      if (romError) throw romError;
      const romUrl = supabase.storage.from('roms').getPublicUrl(romPath)
        .data.publicUrl;

      const { error: dbError } = await supabase.from('jogos').insert([
        {
          id,
          nome,
          console: consoleNome,
          core,
          ano,
          fabricante,
          descricao,
          capa_url: capaUrl,
          rom_url: romUrl,
        },
      ]);

      if (dbError) throw dbError;

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
    } catch (error) {
      console.error(error);
      setAviso({ erro: true, texto: 'Erro: ' + error.message });
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
