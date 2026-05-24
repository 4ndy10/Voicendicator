/* ================================================================
   MÓDULO: app.js — Punto de Entrada de la Aplicación
   
   Este es el ÚLTIMO módulo JavaScript que se carga.
   Su responsabilidad es:
   
   1. Conectar los event listeners de la interfaz a las funciones
      de los módulos correspondientes.
   2. Ejecutar la inicialización cuando la página carga.
   3. Manejar el redimensionamiento de la ventana.
   
   ORDEN DE CARGA DE MÓDULOS (definido en index.html):
   config → dom → canvas → waveform → pitch → spectrum →
   meters → ui → model → recorder → app (este archivo)
   
   DEPENDENCIAS: TODOS los módulos anteriores
   ================================================================ */

(function () {
  'use strict';

  /* Referencia corta al namespace */
  var V = window.Voicendicator;
  var dom = V.dom;

  /* ══════════════════════════════════════════════════════════════
     EVENT LISTENERS — Conexión de UI a lógica
     
     Cada botón se conecta a su función correspondiente en el
     módulo recorder.js a través del namespace global.
     ══════════════════════════════════════════════════════════════ */

  /* Botón "Iniciar Análisis" → startRecording
     Solicita permiso del micrófono e inicia todo el pipeline
     de captura, visualización y análisis de audio. */
  dom.btnStart.addEventListener('click', V.fn.startRecording);

  /* Botón "Detener" → stopRecording
     Libera el micrófono, detiene animaciones y análisis,
     actualiza la UI a estado inactivo. */
  dom.btnStop.addEventListener('click', V.fn.stopRecording);

  /* Botón "Reiniciar Modelo" → recargar página
     Limpia todas las variables y reinicia la app desde cero.
     Ubicado en la navbar superior derecha. */
  dom.btnReset.addEventListener('click', function () {
    window.location.reload();
  });

  /* ══════════════════════════════════════════════════════════════
     INICIALIZACIÓN — Configuración al cargar la página
     
     Cuando la página termina de cargar (incluidas imágenes y CSS):
     1. Inicializar los canvas con dimensiones correctas para HiDPI
     2. Dibujar la cuadrícula base del gráfico de espectro
     
     Se usa el evento 'load' (no 'DOMContentLoaded') para asegurar
     que los contenedores CSS ya tienen sus dimensiones finales.
     ══════════════════════════════════════════════════════════════ */
  window.addEventListener('load', function () {
    V.fn.initCanvases();
    V.fn.drawSpectrumGrid();
    console.log('✅ [app] Voicendicator inicializado correctamente.');
  });

  /* ══════════════════════════════════════════════════════════════
     REDIMENSIONAMIENTO — Adaptar canvas al cambio de tamaño
     
     Los canvas HTML5 no se redimensionan automáticamente con CSS.
     Cuando el usuario cambia el tamaño de la ventana, necesitamos:
     1. Reinicializar los canvas con las nuevas dimensiones
     2. Si hay datos de espectro, redibujar el gráfico
     
     Sin esto, los gráficos se verían distorsionados o cortados
     después de redimensionar la ventana.
     ══════════════════════════════════════════════════════════════ */
  window.addEventListener('resize', function () {
    V.fn.initCanvases();
    if (V.state.spectrumData.length > 0) {
      V.fn.drawSpectrumLine();
    }
  });

})();
