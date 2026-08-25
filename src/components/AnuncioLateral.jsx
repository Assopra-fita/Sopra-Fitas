import React, { useEffect, useRef } from "react";

const montarQuadro = ({ adKey, width, height, cacheBuster }) => `
  <!DOCTYPE html>
  <html style="margin:0;padding:0;overflow:hidden;">
    <body style="margin:0;padding:0;display:flex;justify-content:center;align-items:center;background:#252525;">
      <script>
        atOptions = {
          'key' : '${adKey}',
          'format' : 'iframe',
          'height' : ${height},
          'width' : ${width},
          'params' : {}
        };
      </script>
      <script src="https://www.highperformanceformat.com/${adKey}/invoke.js?t=${cacheBuster}"></script>
    </body>
  </html>
`;

// Componente órfão: ninguém o importa hoje. Ele fica no repositório porque os
// arquivos de anúncio estão congelados por decisão de quem cuida da
// monetização — a mudança aqui é só de lint, o anúncio é o mesmo.
const AnuncioLateral = ({ adKey, width, height }) => {
  const quadroRef = useRef(null);

  // O srcdoc é escrito no efeito, e não pelo JSX, por causa do carimbo de
  // tempo: `Date.now()` é impuro, e chamá-lo durante o render dá um documento
  // diferente a cada renderização — o iframe remonta e o anúncio recarrega
  // sozinho. Escrever num nó do DOM é exatamente o que um efeito faz.
  useEffect(() => {
    const quadro = quadroRef.current;
    if (!quadro) return;

    quadro.srcdoc = montarQuadro({
      adKey,
      width,
      height,
      cacheBuster: Date.now(),
    });
  }, [adKey, width, height]);

  return (
    <div
      style={{
        margin: "10px 0",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: height,
        width: "100%",
      }}
    >
      <iframe
        ref={quadroRef}
        title="Publicidade"
        width={width}
        height={height}
        scrolling="no"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        style={{
          border: "none",
          overflow: "hidden",
          borderRadius: "8px",
          background: "#252525",
          maxWidth: "100%",
        }}
      />
    </div>
  );
};

export default AnuncioLateral;
