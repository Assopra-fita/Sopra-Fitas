// Endereço e chave pública do projeto no Supabase.
//
// Ficam aqui porque três lugares precisam deles: o cliente do site e os dois
// scripts de build, que consultam o catálogo para gerar as páginas e o sitemap.
// Estavam escritos à mão nos três, e um deles apontando para outro projeto
// passaria despercebido.
//
// A chave é pública por definição: ela viaja no bundle que qualquer visitante
// baixa. Quem protege os dados são as policies de RLS no Supabase, não o
// sigilo desta linha.
export const SUPABASE_URL = 'https://maataycmixcmozjhezfe.supabase.co';
export const SUPABASE_CHAVE = 'sb_publishable_0Z-FCcQBbse1uADgFcgzNQ_6JJ66eeY';

export const CABECALHOS_SUPABASE = {
  apikey: SUPABASE_CHAVE,
  Authorization: `Bearer ${SUPABASE_CHAVE}`,
};
