import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Loader2 } from 'lucide-react';

// Guarda única das telas administrativas.
//
// ATENÇÃO, E ISSO É IMPORTANTE: esta verificação é COSMÉTICA. Ela esconde a
// tela, não protege o dado. O código do site é público e qualquer pessoa pode
// contorná-la. A proteção que vale de verdade são as policies de RLS no
// Supabase — sem elas, esconder o botão não impede ninguém de chamar a API.
//
// Antes desta guarda, seis das sete rotas administrativas abriam para qualquer
// visitante sem nenhuma verificação.
const RotaAdmin = ({ children }) => {
  const [situacao, setSituacao] = useState('verificando');

  useEffect(() => {
    let ativo = true;

    const verificar = async () => {
      // Atalho só de desenvolvimento, para abrir o painel sem conta de admin
      // enquanto se mexe no layout. O Vite troca import.meta.env.DEV por
      // `false` na build de produção e este bloco some do arquivo publicado.
      if (import.meta.env.DEV) {
        console.warn('[dev] Guarda do painel ignorada — vale só rodando local.');
        if (ativo) setSituacao('liberado');
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (ativo) setSituacao('sem-sessao');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (ativo) setSituacao(data?.role === 'admin' ? 'liberado' : 'sem-permissao');
    };

    verificar();
    return () => {
      ativo = false;
    };
  }, []);

  if (situacao === 'verificando') {
    return (
      <p className="estado-carregando">
        <Loader2 className="animate-spin" size={30} aria-hidden="true" />
        <br />
        Verificando permissão...
      </p>
    );
  }

  if (situacao === 'sem-sessao') return <Navigate to="/login" replace />;
  if (situacao === 'sem-permissao') return <Navigate to="/" replace />;

  return children;
};

export default RotaAdmin;
