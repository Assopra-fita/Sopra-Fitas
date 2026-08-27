// Envio de arquivo para o Storage do Supabase.
//
// Existiam três blocos de upload copiados pelo projeto — capa, ROM e print —
// e nenhum validava tipo nem tamanho. Foi por aí que entraram 29 jogos com a
// imagem da capa gravada no campo da ROM: o emulador recebe um PNG e abre em
// tela preta, sem erro nenhum no console.
import { supabase } from './consulta';

// Teto por arquivo. A maior ROM do acervo tem 8 MB; 64 MB cobre até cartucho
// de Nintendo 64 com folga e ainda barra upload acidental de vídeo.
const TETO_ROM = 64 * 1024 * 1024;
const TETO_IMAGEM = 5 * 1024 * 1024;

const megabytes = (bytes) => (bytes / 1024 / 1024).toFixed(1).replace('.', ',');

export const extensaoDe = (arquivo) =>
  arquivo?.name.split('.').pop()?.toLowerCase() ?? '';

// Erro de validação, para a tela distinguir "arquivo errado" de "falhou a
// rede" e escolher a mensagem certa.
export class ArquivoInvalido extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = 'ArquivoInvalido';
  }
}

export const validarImagem = (arquivo, rotulo = 'A imagem') => {
  if (!arquivo) throw new ArquivoInvalido(`${rotulo} não foi escolhida.`);
  if (!arquivo.type.startsWith('image/'))
    throw new ArquivoInvalido(`${rotulo} precisa ser um arquivo de imagem.`);
  if (arquivo.size > TETO_IMAGEM)
    throw new ArquivoInvalido(
      `${rotulo} tem ${megabytes(arquivo.size)} MB e o limite é ${megabytes(TETO_IMAGEM)} MB.`
    );
};

export const validarRom = (arquivo, extensoesAceitas, rotuloConsole) => {
  if (!arquivo) throw new ArquivoInvalido('A ROM não foi escolhida.');

  const extensao = extensaoDe(arquivo);
  if (!extensoesAceitas.includes(extensao)) {
    const lista = extensoesAceitas.map((e) => '.' + e).join(', ');
    throw new ArquivoInvalido(
      `ROM de ${rotuloConsole} precisa ser ${lista} — o arquivo enviado é .${extensao}`
    );
  }

  if (arquivo.size > TETO_ROM)
    throw new ArquivoInvalido(
      `A ROM tem ${megabytes(arquivo.size)} MB e o limite é ${megabytes(TETO_ROM)} MB.`
    );
};

// Envia e devolve a URL pública. `substituir` liga o upsert: recadastrar o
// mesmo id sobrescreve o arquivo anterior sem aviso, e é assim de propósito
// para a capa e a ROM, que são endereçadas pelo id do jogo.
export const enviarArquivo = async ({ balde, caminho, arquivo, substituir = false }) => {
  const { error } = await supabase.storage
    .from(balde)
    .upload(caminho, arquivo, { upsert: substituir });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(balde).getPublicUrl(caminho);

  return publicUrl;
};

// Nome de arquivo que não conta nada sobre quem enviou.
//
// O print ia para o bucket como `{user_id}_{timestamp}`, e o bucket responde à
// listagem com a chave anônima: bastava listar para amarrar cada print a uma
// conta, e `profiles` devolvia o nome de quem era. A associação passa a existir
// só na coluna `user_id` da tabela `missoes` — quem a fecha para o público é a
// policy de RLS dessa tabela, que ainda está na lista de conferir no painel.
export const nomeAleatorio = (extensao) => {
  // `randomUUID` existe desde 2021 mas exige contexto seguro; o
  // `getRandomValues` cobre o resto sem trazer dependência nenhuma.
  const id =
    crypto.randomUUID?.() ??
    Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
      b.toString(16).padStart(2, '0')
    ).join('');

  return extensao ? `${id}.${extensao}` : id;
};

// Caminho do arquivo dentro do balde, a partir da URL pública gravada na linha.
// O Storage sempre publica em `.../object/public/{balde}/{caminho}`; devolve
// null para qualquer endereço fora desse formato, que é o caso do jogo
// cadastrado com a capa apontando para fora do projeto.
const PREFIXO_PUBLICO = '/storage/v1/object/public/';

export const caminhoNoBalde = (url, balde) => {
  if (typeof url !== 'string') return null;

  const marca = `${PREFIXO_PUBLICO}${balde}/`;
  const corte = url.indexOf(marca);
  if (corte === -1) return null;

  const caminho = url.slice(corte + marca.length).split('?')[0];
  return caminho ? decodeURIComponent(caminho) : null;
};

// Apaga arquivos de um balde. Lista vazia não é erro nem ida à rede: quem
// chama não deveria precisar conferir antes.
export const removerArquivos = async (balde, caminhos) => {
  const alvos = caminhos.filter(Boolean);
  if (!alvos.length) return;

  const { error } = await supabase.storage.from(balde).remove(alvos);
  if (error) throw error;
};
