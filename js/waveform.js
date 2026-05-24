/* ================================================================
   MÓDULO: waveform.js — Visualización de Forma de Onda
   
   Dibuja la representación visual de la señal de audio capturada
   por el micrófono en el canvas del media area.
   
   Usa la Web Audio API (AnalyserNode.getByteTimeDomainData) para
   obtener los datos de la señal de audio en el dominio del tiempo
   y los renderiza como una línea verde ondulante.
   
   CARACTERÍSTICAS VISUALES:
   - Línea principal verde (#1b7d18) con glow (shadowBlur)
   - Línea secundaria azul fantasma (efecto de profundidad)
   - Animación continua via requestAnimationFrame
   
   DEPENDENCIAS: config.js, dom.js, canvas.js
   ================================================================ */

(function () {
  'use strict';

  /* Referencias cortas al namespace */
  var V = window.Voicendicator;
  var state = V.state;
  var dom = V.dom;

  /* ══════════════════════════════════════════════════════════════
     drawWaveform() — Bucle de renderizado de la forma de onda
     
     Se ejecuta continuamente via requestAnimationFrame mientras
     el micrófono está activo. En cada frame:
     
     1. Obtiene datos del dominio temporal del AnalyserNode
        (array de bytes 0-255, donde 128 = silencio)
     2. Limpia el canvas anterior
     3. Dibuja la línea verde principal con efecto glow
     4. Dibuja una línea azul secundaria desplazada 3px abajo
        (efecto de "sombra" o línea fantasma para profundidad)
     5. Solicita el siguiente frame de animación
     
     La función se auto-invoca recursivamente hasta que
     waveformAnimId sea cancelado (en stopRecording).
     ══════════════════════════════════════════════════════════════ */
  function drawWaveform() {
    /* Salir si no hay analyser o contexto canvas disponible */
    if (!state.analyser || !state.wCtx) return;

    /* ── Paso 1: Obtener datos de audio ──
       getByteTimeDomainData llena un array con valores 0-255.
       128 = silencio (línea plana en el centro).
       Valores > 128 = fase positiva de la onda.
       Valores < 128 = fase negativa de la onda. */
    var bufferLength = state.analyser.fftSize;
    var dataArray = new Uint8Array(bufferLength);
    state.analyser.getByteTimeDomainData(dataArray);

    /* Calcular dimensiones CSS del canvas (sin devicePixelRatio) */
    var w = dom.waveformCanvas.width / window.devicePixelRatio;
    var h = dom.waveformCanvas.height / window.devicePixelRatio;
    var wCtx = state.wCtx;

    /* ── Paso 2: Limpiar el canvas ── */
    wCtx.clearRect(0, 0, w, h);

    /* ── Paso 3: Línea principal verde con glow ──
       shadowColor + shadowBlur crean un efecto de resplandor
       alrededor de la línea, simulando una señal eléctrica. */
    wCtx.shadowColor = '#1b7d18';
    wCtx.shadowBlur = 12;
    wCtx.lineWidth = 2.5;
    wCtx.strokeStyle = '#1b7d18';
    wCtx.beginPath();

    /* Ancho de cada segmento de la línea.
       Se distribuyen bufferLength puntos uniformemente en el ancho. */
    var sliceWidth = w / bufferLength;
    var x = 0;

    /* Recorrer cada muestra del buffer de audio */
    for (var i = 0; i < bufferLength; i++) {
      /* Normalizar el valor de 0-255 a 0-2 (donde 1.0 = centro) */
      var v = dataArray[i] / 128.0;
      /* Convertir a coordenada Y del canvas (0 = arriba, h = abajo) */
      var y = (v * h) / 2;
      if (i === 0) {
        wCtx.moveTo(x, y);
      } else {
        wCtx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    /* Terminar la línea en el borde derecho a la altura central */
    wCtx.lineTo(w, h / 2);
    wCtx.stroke();

    /* ── Paso 4: Línea secundaria azul fantasma ──
       Una línea más delgada, azul semitransparente, desplazada
       3px hacia abajo. Crea efecto de eco/profundidad visual. */
    wCtx.shadowColor = '#09249c';
    wCtx.shadowBlur = 8;
    wCtx.lineWidth = 1;
    wCtx.strokeStyle = 'rgba(9, 36, 156, 0.3)';
    wCtx.beginPath();
    x = 0;
    for (var j = 0; j < bufferLength; j++) {
      var v2 = dataArray[j] / 128.0;
      var y2 = (v2 * h) / 2 + 3; /* +3px desplazamiento vertical */
      if (j === 0) {
        wCtx.moveTo(x, y2);
      } else {
        wCtx.lineTo(x, y2);
      }
      x += sliceWidth;
    }
    wCtx.lineTo(w, h / 2);
    wCtx.stroke();

    /* Limpiar el glow para no afectar futuros dibujos */
    wCtx.shadowBlur = 0;

    /* ── Paso 5: Solicitar siguiente frame ──
       requestAnimationFrame sincroniza con el refresco de pantalla
       (~60fps). El ID se guarda para poder cancelar con
       cancelAnimationFrame en stopRecording. */
    state.waveformAnimId = requestAnimationFrame(drawWaveform);
  }

  /* ── Registrar la función en el namespace global ── */
  V.fn.drawWaveform = drawWaveform;

  console.log('✅ [waveform] Módulo de visualización de onda registrado.');

})();
