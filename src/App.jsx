import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GameRoom from './pages/GameRoom';
import Login from './pages/Login';
import Perfil from './pages/Perfil';
import Ranking from './pages/Ranking';
import NaoEncontrada from './pages/NaoEncontrada';

// A área do GM é carregada sob demanda: só um punhado de pessoas a usa, e sem
// isso ela viajava no mesmo arquivo que todo visitante anônimo baixa.
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminMissoes = lazy(() => import('./pages/AdminMissoes'));
const AdminJogos = lazy(() => import('./pages/AdminJogos'));
const AdminGerenciarJogos = lazy(() => import('./pages/AdminGerenciarJogos'));
const AdminUsuarios = lazy(() => import('./pages/AdminUsuarios'));
const AdminDesafios = lazy(() => import('./pages/AdminDesafios'));

const Carregando = () => (
  <div className="carregando-rota">
    Carregando painel...
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<Carregando />}>
        <Routes>
          {/* ==============================
              ROTAS PÚBLICAS E DO JOGADOR
             ============================== */}

          <Route path="/" element={<Home />} />
          <Route path="/jogar/:gameId" element={<GameRoom />} />
          <Route path="/login" element={<Login />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/ranking" element={<Ranking />} />

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

          {/* Listar, Editar e Deletar Jogos Existentes */}
          <Route
            path="/admin-gerenciar-jogos"
            element={<AdminGerenciarJogos />}
          />

          {/* Controle de Usuários */}
          <Route path="/admin-usuarios" element={<AdminUsuarios />} />

          {/* Qualquer endereço fora da lista acima. Sem isto, URL errada
              renderizava uma página completamente em branco. */}
          <Route path="*" element={<NaoEncontrada />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
