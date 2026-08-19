import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GameRoom from './pages/GameRoom';
import Login from './pages/Login';
import Perfil from './pages/Perfil';
import Ranking from './pages/Ranking';
import Loja from './pages/Loja'; 

// Importações da Área Administrativa (GM)
import AdminDashboard from './pages/AdminDashboard';
import AdminMissoes from './pages/AdminMissoes';
import AdminJogos from './pages/AdminJogos'; // Tela de ADICIONAR
import AdminGerenciarJogos from './pages/AdminGerenciarJogos'; // Tela de EDITAR/LISTAR
import AdminUsuarios from './pages/AdminUsuarios';
import AdminDesafios from './pages/AdminDesafios';
import AdminLoja from './pages/AdminLoja';
import NaoEncontrada from './pages/NaoEncontrada';

function App() {
  return (
    <Router>
      <Routes>
        {/* ==============================
            ROTAS PÚBLICAS E DO JOGADOR
           ============================== */}

        <Route path="/" element={<Home />} />
        <Route path="/jogar/:gameId" element={<GameRoom />} />
        <Route path="/login" element={<Login />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/loja" element={<Loja />} /> 

        {/* ==============================
            ROTAS EXCLUSIVAS DO ADMIN (GM)
           ============================== */}

        {/* Painel Central do Administrador */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* Lançar Desafios Globais (Novas missões do topo) */}
        <Route path="/admin-desafios" element={<AdminDesafios />} />

        {/* Validação de Missões (Prints enviados pelos players) */}
        <Route path="/admin-missoes" element={<AdminMissoes />} />

        {/* Painel para Upar novos Jogos */}
        <Route path="/painel-admin-jogos" element={<AdminJogos />} />

        {/* NOVO: Painel para Listar, Editar e Deletar Jogos Existentes */}
        <Route path="/admin-gerenciar-jogos" element={<AdminGerenciarJogos />} />

        {/* Controle de Usuários */}
        <Route path="/admin-usuarios" element={<AdminUsuarios />} />

        {/* Gerenciar Itens da Loja */}
        <Route path="/admin-loja" element={<AdminLoja />} />

        {/* Qualquer endereço fora da lista acima. Sem isto, URL errada
            renderizava uma página completamente em branco. */}
        <Route path="*" element={<NaoEncontrada />} />
      </Routes>
    </Router>
  );
}

export default App;