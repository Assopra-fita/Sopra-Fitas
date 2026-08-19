import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Este link estava reimplementado 11 vezes, com 8 aparências diferentes e três
// tamanhos de ícone.
const LinkVoltar = ({ para = '/', children = 'Voltar' }) => (
  <Link to={para} className="link-voltar">
    <ArrowLeft size={18} aria-hidden="true" /> {children}
  </Link>
);

export default LinkVoltar;
