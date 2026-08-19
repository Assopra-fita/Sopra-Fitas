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
