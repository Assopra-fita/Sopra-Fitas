import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GameRoom from './pages/GameRoom';
import Login from './pages/Login';
import NovaSenha from './pages/NovaSenha';
import { CAMINHO_NOVA_SENHA } from './services/sessao';
import Perfil from './pages/Perfil';
import MinhasMissoes from './pages/MinhasMissoes';
import Ranking from './pages/Ranking';
import NaoEncontrada from './pages/NaoEncontrada';
import RotaAdmin from './components/RotaAdmin';

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

          {/* Destino do link de recuperação de senha. O endereço precisa estar
              na lista de redirecionamentos do Auth, no painel do Supabase —
              fora dela o link cai na Home e esta tela nunca abre. */}
          <Route path={CAMINHO_NOVA_SENHA} element={<NovaSenha />} />

          <Route path="/perfil" element={<Perfil />} />
          <Route path="/minhas-missoes" element={<MinhasMissoes />} />
          <Route path="/ranking" element={<Ranking />} />

          {/* ==============================
              ROTAS EXCLUSIVAS DO ADMIN (GM)

              Todas passam pela mesma guarda. Antes, seis das sete abriam para
              qualquer visitante sem verificação nenhuma.

              A guarda esconde a tela, não protege o dado: quem garante isso
              são as policies de RLS no Supabase.
             ============================== */}

          <Route
            path="/admin-dashboard"
            element={
              <RotaAdmin>
                <AdminDashboard />
              </RotaAdmin>
            }
          />

          <Route
            path="/admin-desafios"
            element={
              <RotaAdmin>
                <AdminDesafios />
              </RotaAdmin>
            }
          />

          <Route
            path="/admin-missoes"
            element={
              <RotaAdmin>
                <AdminMissoes />
              </RotaAdmin>
            }
          />

          <Route
            path="/painel-admin-jogos"
            element={
              <RotaAdmin>
                <AdminJogos />
              </RotaAdmin>
            }
          />

          <Route
            path="/admin-gerenciar-jogos"
            element={
              <RotaAdmin>
                <AdminGerenciarJogos />
              </RotaAdmin>
            }
          />

          <Route
            path="/admin-usuarios"
            element={
              <RotaAdmin>
                <AdminUsuarios />
              </RotaAdmin>
            }
          />

          {/* Qualquer endereço fora da lista acima. Sem isto, URL errada
              renderizava uma página completamente em branco. */}
          <Route path="*" element={<NaoEncontrada />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
