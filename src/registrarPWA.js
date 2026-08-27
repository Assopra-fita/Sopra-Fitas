// Registra o service worker que torna o site instalável.
//
// Só em produção: em desenvolvimento o service worker guardaria a casca e
// competiria com o recarregamento a quente do Vite, servindo tela velha
// enquanto se mexe no código.
export const registrarPWA = () => {
  if (!import.meta.env.PROD) return;
  if (!('serviceWorker' in navigator)) return;

  // Depois do load: o registro não pode disputar banda com a primeira pintura.
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((e) => console.warn('Service worker não registrou:', e));
  });
};
