/* ================================================================
   MÓDULO: spectrum.js — Gráfico de Espectro de Frecuencias
   
   Renderiza el gráfico de línea que muestra la evolución de la
   frecuencia fundamental (F₀) en el tiempo.
   
   COMPONENTES VISUALES:
   - Cuadrícula de fondo con líneas horizontales cada 50 Hz
   - Etiquetas de Hz en el eje Y (100, 150, 200, ..., 400 Hz)
   - Línea verde sólida: F₀ actual en tiempo real
   - Línea azul punteada: promedio acumulado de F₀
   - Punto verde luminoso: último valor F₀ detectado
   
   RANGO VISIBLE: 50 Hz (abajo) — 500 Hz (arriba)
   Este rango cubre voces masculinas graves (~80 Hz) hasta
   voces femeninas agudas (~400 Hz).
   
   DEPENDENCIAS: config.js, dom.js, canvas.js
   ================================================================ */

(function () {
  'use strict';

  /* Referencias cortas al namespace */
  var V = window.Voicendicator;
  var state = V.state;
  var dom = V.dom;

  /* ══════════════════════════════════════════════════════════════
     drawSpectrumGrid() — Cuadrícula de fondo del gráfico
     
     Dibuja líneas horizontales y etiquetas de Hz sobre el canvas
     de espectro. Se invoca:
     - Al inicializar los canvas (initCanvases)
     - Antes de cada redibujado de la línea de espectro
     
     La cuadrícula ayuda al usuario a estimar visualmente
     en qué rango de frecuencia se encuentra su voz.
     ══════════════════════════════════════════════════════════════ */
  function drawSpectrumGrid() {
    if (!state.sCtx) return;

    var w = dom.spectrumCanvas.width / window.devicePixelRatio;
    var h = dom.spectrumCanvas.height / window.devicePixelRatio;
    var sCtx = state.sCtx;

    /* Limpiar todo el canvas */
    sCtx.clearRect(0, 0, w, h);

    /* Fondo crema claro para el área del gráfico */
    sCtx.fillStyle = '#F5EFE4';
    sCtx.fillRect(0, 0, w, h);

    /* ── Líneas horizontales de la cuadrícula ──
       Cada línea representa un nivel de frecuencia en Hz.
       El color es azul con muy baja opacidad (8%) para no
       interferir con las líneas de datos. */
    sCtx.strokeStyle = 'rgba(9, 36, 156, 0.08)';
    sCtx.lineWidth = 1;

    /* Niveles de Hz para las líneas horizontales */
    var hzLevels = [100, 150, 200, 250, 300, 350, 400];
    var maxHz = 500; // Límite superior del eje Y
    var minHz = 50;  // Límite inferior del eje Y

    hzLevels.forEach(function (hz) {
      /* Convertir Hz a coordenada Y del canvas.
         Fórmula: Y = altura - ((hz - min) / (max - min)) * altura
         El eje Y está invertido (0 arriba, h abajo) así que
         restamos de h para que frecuencias altas estén arriba. */
      var y = h - ((hz - minHz) / (maxHz - minHz)) * h;

      /* Dibujar la línea horizontal */
      sCtx.beginPath();
      sCtx.moveTo(40, y);  // Empieza en x=40 para dejar espacio a labels
      sCtx.lineTo(w, y);
      sCtx.stroke();

      /* Etiqueta de Hz al lado izquierdo de la línea */
      sCtx.fillStyle = 'rgba(9, 36, 156, 0.4)';
      sCtx.font = '10px Montserrat, sans-serif';
      sCtx.textAlign = 'right';
      sCtx.fillText(hz + ' Hz', 36, y + 3); // +3px para centrar verticalmente
    });
  }

  /* ══════════════════════════════════════════════════════════════
     drawSpectrumLine() — Líneas de datos F₀ y promedio
     
     Dibuja tres capas de información sobre la cuadrícula:
     
     1. Línea azul punteada: promedio acumulado de F₀
        Muestra la tendencia general de la voz del usuario.
        setLineDash([4, 4]) crea el patrón de guiones.
     
     2. Línea verde sólida: F₀ en tiempo real
        Conecta todos los puntos de datos recientes.
        Tiene efecto glow (shadowBlur) para destacar.
     
     3. Punto verde luminoso: último valor detectado
        Un círculo sólido + halo semitransparente en la posición
        más reciente del gráfico.
     
     Se invoca cada vez que se detecta un nuevo valor F₀ válido
     (desde el analysis loop en recorder.js).
     ══════════════════════════════════════════════════════════════ */
  function drawSpectrumLine() {
    if (!state.sCtx) return;

    var w = dom.spectrumCanvas.width / window.devicePixelRatio;
    var h = dom.spectrumCanvas.height / window.devicePixelRatio;
    var maxHz = 500;
    var minHz = 50;
    var sCtx = state.sCtx;

    /* Redibujar la cuadrícula de fondo (limpia el canvas) */
    drawSpectrumGrid();

    /* Se necesitan al menos 2 puntos para trazar una línea */
    if (state.spectrumData.length < 2) return;

    /* Calcular el ancho de cada paso en X.
       Se resta 44px del ancho total para el margen izquierdo de labels. */
    var stepX = (w - 44) / V.MAX_SPECTRUM_POINTS;

    /* ── Capa 1: Línea de promedio (azul, punteada) ──
       Muestra la tendencia general de la frecuencia vocal.
       Es útil para que el usuario vea su F₀ promedio. */
    if (state.spectrumAvgData.length >= 2) {
      sCtx.setLineDash([4, 4]); // Patrón de guiones: 4px línea, 4px espacio
      sCtx.strokeStyle = 'rgba(9, 36, 156, 0.5)';
      sCtx.lineWidth = 1.5;
      sCtx.beginPath();

      for (var a = 0; a < state.spectrumAvgData.length; a++) {
        var ax = 44 + a * stepX;
        var ay = h - ((state.spectrumAvgData[a] - minHz) / (maxHz - minHz)) * h;
        if (a === 0) sCtx.moveTo(ax, ay);
        else sCtx.lineTo(ax, ay);
      }

      sCtx.stroke();
      sCtx.setLineDash([]); // Restaurar línea sólida
    }

    /* ── Capa 2: Línea F₀ actual (verde, sólida con glow) ──
       Muestra el valor instantáneo de la frecuencia fundamental.
       El glow (shadowBlur) crea un efecto de señal energizada. */
    sCtx.shadowColor = '#1b7d18';
    sCtx.shadowBlur = 6;
    sCtx.strokeStyle = '#1b7d18';
    sCtx.lineWidth = 2;
    sCtx.beginPath();

    for (var i = 0; i < state.spectrumData.length; i++) {
      var sx = 44 + i * stepX;
      var sy = h - ((state.spectrumData[i] - minHz) / (maxHz - minHz)) * h;
      if (i === 0) sCtx.moveTo(sx, sy);
      else sCtx.lineTo(sx, sy);
    }

    sCtx.stroke();
    sCtx.shadowBlur = 0;

    /* ── Capa 3: Punto actual (último valor detectado) ──
       Círculo verde sólido (5px radio) + halo semitransparente (10px).
       Indica la posición actual en el gráfico. */
    if (state.spectrumData.length > 0) {
      var lastIdx = state.spectrumData.length - 1;
      var cx = 44 + lastIdx * stepX;
      var cy = h - ((state.spectrumData[lastIdx] - minHz) / (maxHz - minHz)) * h;

      /* Punto sólido */
      sCtx.beginPath();
      sCtx.arc(cx, cy, 5, 0, Math.PI * 2);
      sCtx.fillStyle = '#1b7d18';
      sCtx.fill();

      /* Halo luminoso alrededor del punto */
      sCtx.beginPath();
      sCtx.arc(cx, cy, 10, 0, Math.PI * 2);
      sCtx.fillStyle = 'rgba(27, 125, 24, 0.2)';
      sCtx.fill();
    }
  }

  /* ── Registrar funciones en el namespace global ── */
  V.fn.drawSpectrumGrid = drawSpectrumGrid;
  V.fn.drawSpectrumLine = drawSpectrumLine;

  console.log('✅ [spectrum] Módulo de gráfico de espectro registrado.');

})();
