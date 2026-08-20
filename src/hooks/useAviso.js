import { useCallback, useEffect, useRef, useState } from 'react';

// Quanto tempo um aviso de sucesso fica na tela.
const DURACAO = 3200;

// Feedback de ação, no lugar do alert() do navegador.
//
// O alert() era usado em 19 pontos e tem três defeitos que não dá para
// contornar: trava a página inteira até alguém clicar em OK, não é estilizável,
// e no celular aparece como caixa do sistema com o endereço do site, que parece
// golpe. Um aviso na própria tela informa sem interromper.
export const useAviso = () => {
  const [aviso, setAviso] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // `fixo` é para a mensagem que precisa ser lida com calma, como o aviso de
  // confirmar o e-mail no cadastro. Erro é fixo por padrão: quem precisa ler
  // uma falha muitas vezes precisa de tempo, e às vezes precisa copiar o texto.
  const mostrarAviso = useCallback((texto, { erro = false, fixo = erro } = {}) => {
    clearTimeout(timerRef.current);
    setAviso({ texto, erro });

    if (!fixo) {
      timerRef.current = setTimeout(() => setAviso(null), DURACAO);
    }
  }, []);

  const limparAviso = useCallback(() => {
    clearTimeout(timerRef.current);
    setAviso(null);
  }, []);

  return { aviso, mostrarAviso, limparAviso };
};
