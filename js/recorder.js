/* ================================================================
   MÓDULO: recorder.js — Control del Micrófono y Loop de Análisis
   
   Gestiona todo el ciclo de vida de la captura de audio:
   
   1. INICIAR (startRecording):
      - Solicitar permiso del micrófono via getUserMedia
      - Crear AudioContext y AnalyserNode (Web Audio API)
      - Conectar el micrófono al analyser
      - Iniciar la visualización de waveform
      - Iniciar el loop de análisis de pitch (F₀)
      - (Futuro) Cargar e iniciar el modelo de TF.js
   
   2. DETENER (stopRecording):
      - Cancelar animación del waveform
      - Detener el loop de análisis
      - (Futuro) Detener la escucha del modelo
      - Desconectar el micrófono
      - Cerrar el AudioContext
      - Liberar el stream del micrófono
   
   3. LOOP DE ANÁLISIS (startAnalysisLoop / stopAnalysisLoop):
      - Ejecuta detectPitch() cada 100ms (~10fps)
      - Alimenta el gráfico de espectro con datos F₀
      - Calcula el promedio acumulado (running average)
   
   DEPENDENCIAS: config.js, dom.js, canvas.js, waveform.js,
                 pitch.js, spectrum.js, ui.js, model.js
   ================================================================ */

(function () {
  'use strict';

  /* Referencias cortas al namespace */
  var V = window.Voicendicator;
  var state = V.state;
  var dom = V.dom;

  /* ══════════════════════════════════════════════════════════════
     startRecording() — Iniciar captura de audio del micrófono
     
     FLUJO ASÍNCRONO:
     1. navigator.mediaDevices.getUserMedia({ audio: true })
        → Solicita permiso al usuario para acceder al micrófono.
        → Si acepta, retorna un MediaStream.
        → Si rechaza, capturamos el error y lo mostramos.
     
     2. AudioContext → AnalyserNode → MediaStreamSource
        AudioContext es el punto de entrada de la Web Audio API.
        AnalyserNode permite obtener datos de frecuencia y tiempo.
        MediaStreamSource conecta el micrófono al grafo de audio.
     
     3. Se inician todas las visualizaciones:
        - initCanvases() → preparar canvas para HiDPI
        - drawWaveform()  → iniciar animación de forma de onda
        - startAnalysisLoop() → iniciar loop de pitch detection
     4. Cargar e iniciar el modelo de TF.js:
        - loadModel() → cargar pesos del modelo desde Teachable Machine
        - startModelListening() → iniciar inferencia en tiempo real
     ══════════════════════════════════════════════════════════════ */
  async function startRecording() {
    try {
      /* ── Paso 1: Solicitar acceso al micrófono ──
         video: false → solo audio, no necesitamos cámara.
         Esto muestra el diálogo de permiso del navegador. */
      state.stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      /* ── Paso 2: Crear AudioContext y AnalyserNode ──
         webkitAudioContext es el fallback para Safari antiguo.
         
         fftSize: 2048 → tamaño de la ventana FFT.
         Determina la resolución de frecuencia. 2048 samples a 44100 Hz
         da una resolución de ~21.5 Hz, suficiente para voz.
         
         smoothingTimeConstant: 0.85 → suavizado temporal.
         Valor entre 0 (sin suavizado) y 1 (máximo suavizado).
         0.85 da un buen balance entre reactividad y estabilidad. */
      state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      state.analyser = state.audioCtx.createAnalyser();
      state.analyser.fftSize = 2048;
      state.analyser.smoothingTimeConstant = 0.85;

      /* ── Paso 3: Conectar micrófono al analyser ──
         createMediaStreamSource convierte el MediaStream en un nodo
         del grafo de Web Audio. Lo conectamos al analyser para
         poder leer datos de la señal. */
      state.microphone = state.audioCtx.createMediaStreamSource(state.stream);
      state.microphone.connect(state.analyser);

      /* ── Paso 4: Actualizar estado y UI ── */
      state.isRecording = true;
      V.fn.updateUI(true);

      /* ── Paso 5: Iniciar visualizaciones ── */
      V.fn.initCanvases();
      V.fn.drawWaveform();
      startAnalysisLoop();

      /* ── Paso 6: Cargar modelo de TF.js e iniciar inferencia ──
         Muestra estado de carga en la UI y arranca la clasificación
         en tiempo real una vez que el modelo está listo. */
      dom.statusText.textContent = 'Cargando modelo de IA...';
      await V.fn.loadModel();
      V.fn.startModelListening();
      dom.statusText.textContent = 'Analizando tu voz...';

    } catch (err) {
      /* ── Manejo de errores ──
         Causas comunes:
         - El usuario rechazó el permiso del micrófono
         - No hay micrófono conectado
         - El navegador no soporta getUserMedia (HTTP sin SSL) */
      console.error('Error accessing microphone:', err);
      dom.statusText.textContent = 'Error: Micrófono no disponible';
      dom.statusText.style.color = '#c0392b'; // Rojo para error
    }
  }

  /* ══════════════════════════════════════════════════════════════
     stopRecording() — Detener captura y liberar recursos
     
     Es CRÍTICO liberar todos los recursos para:
     - Evitar que el micrófono siga encendido (LED del hardware)
     - Liberar memoria del AudioContext
     - Detener animaciones que consumen CPU
     
     ORDEN DE LIMPIEZA (de más específico a más general):
     1. Detener modelo de TF.js (si está activo)
     2. Cancelar animación del waveform
     3. Detener loop de análisis
     4. Desconectar micrófono del grafo de audio
     5. Cerrar AudioContext
     6. Detener tracks del MediaStream (libera el micrófono)
     7. Actualizar UI a estado inactivo
     ══════════════════════════════════════════════════════════════ */
  function stopRecording() {
    state.isRecording = false;

    /* ── Detener inferencia del modelo de TF.js ── */
    V.fn.stopModelListening();

    /* ── Cancelar animación del waveform ──
       cancelAnimationFrame detiene el bucle recursivo de drawWaveform */
    if (state.waveformAnimId) {
      cancelAnimationFrame(state.waveformAnimId);
      state.waveformAnimId = null;
    }

    /* ── Detener loop de análisis de pitch ── */
    stopAnalysisLoop();

    /* ── Desconectar el micrófono del grafo de audio ── */
    if (state.microphone) {
      state.microphone.disconnect();
      state.microphone = null;
    }

    /* ── Cerrar el AudioContext ──
       Libera los recursos de audio del sistema operativo */
    if (state.audioCtx) {
      state.audioCtx.close();
      state.audioCtx = null;
    }

    /* ── Detener el stream del micrófono ──
       getTracks() retorna todos los tracks de audio.
       track.stop() libera el micrófono (apaga el LED del hardware). */
    if (state.stream) {
      state.stream.getTracks().forEach(function (track) {
        track.stop();
      });
      state.stream = null;
    }

    /* Limpiar referencia al analyser */
    state.analyser = null;

    /* Actualizar la interfaz a estado inactivo */
    V.fn.updateUI(false);
  }

  /* ══════════════════════════════════════════════════════════════
     startAnalysisLoop() — Loop de detección de F₀ y espectro
     
     Ejecuta detectPitch() cada 100ms (~10 actualizaciones/segundo).
     
     Para cada valor F₀ válido (entre 50 y 500 Hz):
     1. Actualiza el display de Hz en la UI
     2. Calcula el promedio acumulado (running average)
     3. Añade el dato al array del gráfico de espectro
     4. Si excede MAX_SPECTRUM_POINTS, elimina el más antiguo (FIFO)
     5. Redibuja el gráfico de espectro
     
     NOTA SOBRE LA CLASIFICACIÓN:
     Los medidores de clasificación (mg, ma, fg, fa) NO se actualizan
     aquí. Cuando el modelo de TF.js esté activo, las probabilidades
     vendrán del callback de recognizer.listen() → updateMeters(probs).
     Sin modelo, los medidores permanecen en 0%.
     ══════════════════════════════════════════════════════════════ */
  function startAnalysisLoop() {
    /* Promedio acumulado usando fórmula incremental:
       newAvg = oldAvg + (newValue - oldAvg) / count
       Esto evita tener que recalcular todo el array cada vez. */
    var runningAvg = 0;
    var avgCount = 0;

    state.analysisInterval = setInterval(function () {
      /* Intentar detectar la frecuencia fundamental */
      var hz = V.fn.detectPitch();

      /* Solo procesar si el valor es válido y está en rango de voz humana */
      if (hz !== null && hz > 50 && hz < 500) {
        var roundedHz = Math.round(hz);

        /* Actualizar el display de Hz en la UI */
        dom.hzValue.innerHTML = roundedHz + ' <span>Hz</span>';

        /* Actualizar promedio acumulado (running average)
           Fórmula de Welford: avg = avg + (x - avg) / n
           Más estable numéricamente que sum / count */
        avgCount++;
        runningAvg = runningAvg + (hz - runningAvg) / avgCount;

        /* Añadir datos al array del gráfico de espectro */
        state.spectrumData.push(roundedHz);
        state.spectrumAvgData.push(Math.round(runningAvg));

        /* Mantener el array en el límite máximo (FIFO) */
        if (state.spectrumData.length > V.MAX_SPECTRUM_POINTS) {
          state.spectrumData.shift();    // Eliminar el dato más antiguo
          state.spectrumAvgData.shift();
        }

        /* Redibujar el gráfico de espectro con los nuevos datos */
        V.fn.drawSpectrumLine();

        /* ══════════════════════════════════════════════════════
           AQUÍ SE INTEGRARÁ TENSORFLOW.JS — Clasificación
           Cuando el modelo esté activo, la clasificación viene
           del callback de recognizer.listen(), NO de este loop.
           Los medidores se actualizarán automáticamente.
           ══════════════════════════════════════════════════════ */
      }
    }, 100); // 100ms = ~10fps de análisis
  }

  /* ══════════════════════════════════════════════════════════════
     stopAnalysisLoop() — Detener el loop de análisis
     
     Limpia el setInterval para liberar CPU.
     Se invoca desde stopRecording().
     ══════════════════════════════════════════════════════════════ */
  function stopAnalysisLoop() {
    if (state.analysisInterval) {
      clearInterval(state.analysisInterval);
      state.analysisInterval = null;
    }
  }

  /* ── Registrar funciones en el namespace global ── */
  V.fn.startRecording = startRecording;
  V.fn.stopRecording = stopRecording;

  console.log('✅ [recorder] Módulo de grabación registrado.');

})();
