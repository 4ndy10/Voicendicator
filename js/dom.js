/* ================================================================
   MÓDULO: dom.js — Referencias al DOM Centralizadas
   
   Todas las llamadas a document.getElementById() se hacen AQUÍ
   una sola vez y se almacenan en el namespace global.
   
   Esto evita:
   - Repetir selectores en múltiples archivos
   - Buscar elementos en el DOM múltiples veces (rendimiento)
   - Errores de typo en IDs que serían difíciles de rastrear
   
   DEPENDENCIAS: config.js (Voicendicator namespace)
   NOTA: Este archivo debe cargarse DESPUÉS de que el DOM esté
   definido (es decir, el <script> debe estar al final del <body>).
   ================================================================ */

(function () {
  'use strict';

  /* Referencia corta al namespace global */
  var V = window.Voicendicator;

  /* ══════════════════════════════════════════════════════════════
     REFERENCIAS DOM — Elementos principales de la interfaz
     
     Se almacenan en V.dom para acceso centralizado.
     Cada propiedad se nombra igual que el ID del elemento HTML
     para fácil correspondencia.
     ══════════════════════════════════════════════════════════════ */
  V.dom = {
    /* ── Botones de control ── */
    btnStart:   document.getElementById('btnStart'),     // Botón "Iniciar Análisis"
    btnStop:    document.getElementById('btnStop'),       // Botón "Detener"
    btnReset:   document.getElementById('btnReset'),      // Botón "Reiniciar Modelo" (navbar)

    /* ── Área de captura de audio/video ── */
    mediaArea:  document.getElementById('mediaArea'),     // Contenedor visual del micrófono

    /* ── Indicadores de estado ── */
    statusDot:  document.getElementById('statusDot'),     // Punto de estado (gris/verde)
    statusText: document.getElementById('statusText'),    // Texto de estado ("Listo" / "Analizando")

    /* ── Lectura de frecuencia ── */
    hzValue:    document.getElementById('hzValue'),       // Display del valor en Hz

    /* ── Panel de resultado de tono ── */
    toneBanner: document.getElementById('toneBanner'),    // Banner del tono detectado
    toneIcon:   document.getElementById('toneIcon'),      // Ícono del banner (emoji)
    toneLabel:  document.getElementById('toneLabel'),     // Texto del tono detectado

    /* ── Canvas para visualizaciones ── */
    waveformCanvas: document.getElementById('waveformCanvas'), // Canvas de la forma de onda
    spectrumCanvas: document.getElementById('spectrumCanvas')  // Canvas del gráfico de espectro
  };

  /* ══════════════════════════════════════════════════════════════
     BARRAS Y VALORES DE LOS TONE BARS
     
     Los tone bars muestran la probabilidad de cada categoría vocal
     según la clasificación directa del modelo de Teachable Machine.
     Se usa la convención de 2 letras:
       mg = Masculino Grave
       ma = Masculino Agudo
       fg = Femenino Grave
       fa = Femenino Agudo
     
     V.dom.bars → elementos de la barra de relleno (width dinámico)
     V.dom.vals → elementos de texto del porcentaje (textContent)
     ══════════════════════════════════════════════════════════════ */
  V.dom.bars = {
    mg: document.getElementById('bar-mg'),  // Barra de relleno — Masculino Grave
    ma: document.getElementById('bar-ma'),  // Barra de relleno — Masculino Agudo
    fg: document.getElementById('bar-fg'),  // Barra de relleno — Femenino Grave
    fa: document.getElementById('bar-fa')   // Barra de relleno — Femenino Agudo
  };

  V.dom.vals = {
    mg: document.getElementById('val-mg'),  // Valor porcentual — Masculino Grave
    ma: document.getElementById('val-ma'),  // Valor porcentual — Masculino Agudo
    fg: document.getElementById('val-fg'),  // Valor porcentual — Femenino Grave
    fa: document.getElementById('val-fa')   // Valor porcentual — Femenino Agudo
  };

  /* ── Ruido de fondo (clase [0] del modelo) ── */
  V.dom.noiseBar  = document.getElementById('bar-noise');  // Barra de relleno — Ruido de Fondo
  V.dom.noiseVal  = document.getElementById('val-noise');  // Valor porcentual — Ruido de Fondo

  console.log('✅ [dom] Referencias DOM almacenadas.');

})();
