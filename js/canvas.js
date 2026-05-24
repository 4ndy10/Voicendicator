/* ================================================================
   MÓDULO: canvas.js — Inicialización de Canvas HTML5
   
   Configura los dos elementos <canvas> usados para visualización:
   
   1. waveformCanvas — Forma de onda del micrófono en tiempo real
      (dentro del media area, fondo oscuro)
   
   2. spectrumCanvas — Gráfico de frecuencia F₀ vs tiempo
      (en la sección de resultados, fondo crema)
   
   Ambos canvas se configuran para pantallas de alta densidad
   (Retina, HiDPI) usando window.devicePixelRatio.
   
   DEPENDENCIAS: config.js, dom.js
   ================================================================ */

(function () {
  'use strict';

  /* Referencias cortas al namespace */
  var V = window.Voicendicator;
  var state = V.state;
  var dom = V.dom;

  /* ══════════════════════════════════════════════════════════════
     initCanvases() — Inicialización de ambos canvas
     
     PROBLEMA QUE RESUELVE:
     Los canvas HTML5 tienen dos tamaños:
     - Tamaño CSS (visual): lo que el usuario ve en pantalla
     - Tamaño de buffer (resolución): los píxeles reales del dibujo
     
     En pantallas Retina (devicePixelRatio = 2), si solo se usa
     el tamaño CSS, los gráficos se ven borrosos. La solución es:
     1. Multiplicar el tamaño del buffer por devicePixelRatio
     2. Aplicar scale() al contexto 2D para que las coordenadas
        de dibujo coincidan con el tamaño CSS
     
     RESULTADO: Gráficos nítidos en cualquier densidad de pantalla.
     
     También invoca drawSpectrumGrid() para dibujar la cuadrícula
     inicial del gráfico de espectro.
     ══════════════════════════════════════════════════════════════ */
  function initCanvases() {
    /* ── Canvas de forma de onda (waveform) ──
       Se obtiene el tamaño real del contenedor padre para que
       el canvas se adapte al layout CSS automáticamente. */
    var wRect = dom.waveformCanvas.parentElement.getBoundingClientRect();
    dom.waveformCanvas.width = wRect.width * window.devicePixelRatio;
    dom.waveformCanvas.height = wRect.height * window.devicePixelRatio;
    state.wCtx = dom.waveformCanvas.getContext('2d');
    state.wCtx.scale(window.devicePixelRatio, window.devicePixelRatio);

    /* ── Canvas de espectro de frecuencias ──
       Mismo proceso de escalado para alta resolución. */
    var sRect = dom.spectrumCanvas.parentElement.getBoundingClientRect();
    dom.spectrumCanvas.width = sRect.width * window.devicePixelRatio;
    dom.spectrumCanvas.height = sRect.height * window.devicePixelRatio;
    state.sCtx = dom.spectrumCanvas.getContext('2d');
    state.sCtx.scale(window.devicePixelRatio, window.devicePixelRatio);

    /* Dibujar la cuadrícula inicial del gráfico de espectro.
       Se invoca aquí porque drawSpectrumGrid necesita sCtx configurado. */
    if (V.fn.drawSpectrumGrid) {
      V.fn.drawSpectrumGrid();
    }
  }

  /* ── Registrar la función en el namespace global ── */
  V.fn.initCanvases = initCanvases;

  console.log('✅ [canvas] Módulo de canvas registrado.');

})();
