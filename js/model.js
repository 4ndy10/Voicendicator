/* ================================================================
   MÓDULO: model.js — Integración con TensorFlow.js / Teachable Machine
   
   Este módulo carga y usa el modelo de clasificación vocal entrenado
   en Teachable Machine (Speech Project).
   
   MODELO: https://teachablemachine.withgoogle.com/models/H5xiHUPI3/
   
   CLASES DEL MODELO (9 labels en metadata.json):
     [0] Ruido de fondo
     [1] Voz Femenina Aguda
     [2] Voz Femenina Aguda - PRUEBA
     [3] Voz Femenina Grave
     [4] Voz Femenina Grave - PRUEBA
     [5] Voz Masculina Aguda
     [6] Voz Masculina Aguda - PRUEBA
     [7] Voz Masculina Grave
     [8] Voz Masculina Grave - PRUEBA
   
   MAPEO A CATEGORÍAS (combinando variantes PRUEBA):
     mg = scores[7] + scores[8]  → Masculino Grave
     ma = scores[5] + scores[6]  → Masculino Agudo
     fg = scores[3] + scores[4]  → Femenino Grave
     fa = scores[1] + scores[2]  → Femenino Agudo
   
   LÓGICA:
     El modelo clasifica el tono directamente. JavaScript solo:
     1. Lee las probabilidades del modelo
     2. Identifica la clase ganadora (la de mayor score)
     3. Pasa los datos a updateToneUI() para la lógica visual
   
   DEPENDENCIAS CDN (ya cargadas en index.html):
   - @tensorflow/tfjs@1.3.1
   - @tensorflow-models/speech-commands@0.4.0
   
   DEPENDENCIAS INTERNAS: config.js, meters.js
   ================================================================ */

(function () {
  'use strict';

  /* Referencia corta al namespace */
  var V = window.Voicendicator;
  var state = V.state;

  /* ══════════════════════════════════════════════════════════════
     loadModel() — Cargar el modelo de Teachable Machine
     
     Usa speechCommands.create() con tipo BROWSER_FFT para crear
     un reconocedor de audio basado en transformada de Fourier.
     
     El modelo necesita dos archivos:
     - model.json: arquitectura de la red + referencia a los pesos
     - metadata.json: nombres de las clases (labels)
     
     Los pesos (weights.bin) se descargan automáticamente ya que
     model.json los referencia internamente.
     ══════════════════════════════════════════════════════════════ */

  async function loadModel() {
    var modelURL = V.MODEL_URL + 'model.json';
    var metadataURL = V.MODEL_URL + 'metadata.json';

    /* Crear el reconocedor de speech-commands.
       'BROWSER_FFT' indica que el audio se procesará en el navegador
       usando la FFT (Fast Fourier Transform) para extraer features.
       El segundo parámetro (vocabulary) es undefined para modelos custom. */
    state.recognizer = speechCommands.create(
      'BROWSER_FFT',
      undefined,
      modelURL,
      metadataURL
    );

    /* Descargar y cargar el modelo en memoria.
       Esto puede tardar unos segundos dependiendo del tamaño
       del modelo y la velocidad de conexión. */
    await state.recognizer.ensureModelLoaded();

    console.log('✅ Modelo de Teachable Machine cargado correctamente.');
    console.log('Clases del modelo:', state.recognizer.wordLabels());
  }

  /* ══════════════════════════════════════════════════════════════
     startModelListening() — Iniciar inferencia en tiempo real
     
     recognizer.listen() captura audio continuamente y ejecuta
     inferencia del modelo en cada ventana de audio.
     
     LÓGICA DE CLASIFICACIÓN:
     El modelo tiene 9 clases (incluyendo variantes "PRUEBA").
     Se combinan las variantes PRUEBA con su clase principal
     para obtener 4 categorías finales (mg, ma, fg, fa).
     
     Luego se identifica la CLASE GANADORA — la que el modelo
     considera más probable. JavaScript NO inventa el tono;
     lee directamente lo que el modelo clasificó.
     
     Finalmente se calcula si hay EMPATE entre masculina total
     y femenina total para activar el banner verde de voz neutra.
     
     PARÁMETROS DE CONFIGURACIÓN:
     - includeSpectrogram: false → no necesitamos el espectrograma raw
     - probabilityThreshold: 0.0 → siempre reportar para ver % en vivo
     - invokeCallbackOnNoiseAndUnknown: true → reportar ruido/silencio
     - overlapFactor: 0.50 → superposición de ventanas (50%)
     ══════════════════════════════════════════════════════════════ */

  function startModelListening() {
    if (!state.recognizer) {
      console.error('❌ El modelo no está cargado. Llama a loadModel() primero.');
      return;
    }

    state.recognizer.listen(
      function (result) {
        /* result.scores es un Float32Array con la probabilidad
           de cada clase (0.0 a 1.0). El orden corresponde
           al orden de las clases en metadata.json. */
        var scores = result.scores;
        var labels = state.recognizer.wordLabels();

        /* ── Paso 1: Combinar variantes PRUEBA con clase principal ──
           Cada categoría vocal tiene una versión normal y una PRUEBA.
           Sumamos ambas para obtener un score más estable.
           
           Índices del modelo:
           [0] Ruido de fondo
           [1] Voz Femenina Aguda       [2] Voz Femenina Aguda - PRUEBA
           [3] Voz Femenina Grave       [4] Voz Femenina Grave - PRUEBA
           [5] Voz Masculina Aguda      [6] Voz Masculina Aguda - PRUEBA
           [7] Voz Masculina Grave      [8] Voz Masculina Grave - PRUEBA */

        var rawMg = (scores[7] || 0) + (scores[8] || 0);
        var rawMa = (scores[5] || 0) + (scores[6] || 0);
        var rawFg = (scores[3] || 0) + (scores[4] || 0);
        var rawFa = (scores[1] || 0) + (scores[2] || 0);

        /* ── Paso 2: Normalizar para que sumen ~100% ──
           Excluimos "Ruido de fondo" de la normalización.
           Si el total vocal es cercano a 0, dejamos todo en 0. */
        var totalVocal = rawMg + rawMa + rawFg + rawFa;

        var probs;
        if (totalVocal > 0.01) {
          probs = {
            mg: Math.round((rawMg / totalVocal) * 100),
            ma: Math.round((rawMa / totalVocal) * 100),
            fg: Math.round((rawFg / totalVocal) * 100),
            fa: Math.round((rawFa / totalVocal) * 100)
          };
        } else {
          /* Si casi todo es ruido de fondo, mostrar 0% en todo */
          probs = { mg: 0, ma: 0, fg: 0, fa: 0 };
        }

        /* ── Paso 3: Identificar la clase ganadora ──
           La clase con mayor probabilidad es el resultado del modelo.
           JavaScript NO calcula el tono — el modelo ya lo hizo. */
        var categories = [
          { key: 'mg', label: 'Voz Masculina Grave',  pct: probs.mg },
          { key: 'ma', label: 'Voz Masculina Aguda',  pct: probs.ma },
          { key: 'fg', label: 'Voz Femenina Grave',   pct: probs.fg },
          { key: 'fa', label: 'Voz Femenina Aguda',   pct: probs.fa }
        ];

        var winner = categories[0];
        for (var i = 1; i < categories.length; i++) {
          if (categories[i].pct > winner.pct) {
            winner = categories[i];
          }
        }

        /* ── Paso 4: Detectar empate → Voz Neutra (Género Indeterminado) ──
           Si la diferencia entre masculina total y femenina total
           es menor a 10%, el modelo no logra identificar el género.
           En este caso activamos el banner verde de voz neutra.
           
           mascTotal = Masculino Grave + Masculino Agudo
           femTotal  = Femenino Grave  + Femenino Agudo */
        var mascTotal = probs.mg + probs.ma;
        var femTotal = probs.fg + probs.fa;
        var isNeutral = Math.abs(mascTotal - femTotal) < 10;

        /* ── Paso 5: Enviar resultado a la UI ──
           updateToneUI se encarga de:
           - Actualizar las barras de probabilidad
           - Cambiar el color del banner y del fondo
           - Mostrar el texto del tono detectado
           - Actualizar el indicador de ruido de fondo */
        var noisePct = Math.round((scores[0] || 0) * 100);
        V.fn.updateToneUI(winner, probs, isNeutral, noisePct);

        /* Log de depuración — categorías combinadas */
        console.log(
          'MG:' + probs.mg + '% MA:' + probs.ma + '% ' +
          'FG:' + probs.fg + '% FA:' + probs.fa + '% → ' +
          (isNeutral ? 'NEUTRA' : winner.label)
        );
      },
      {
        includeSpectrogram: false,
        probabilityThreshold: 0.0,
        invokeCallbackOnNoiseAndUnknown: true,
        overlapFactor: 0.50
      }
    );

    console.log('🎙️ Modelo escuchando — clasificación en tiempo real activa.');
  }

  /* ══════════════════════════════════════════════════════════════
     stopModelListening() — Detener inferencia del modelo
     
     Detiene la escucha continua del modelo para liberar recursos.
     Se invoca desde stopRecording() en recorder.js.
     ══════════════════════════════════════════════════════════════ */

  function stopModelListening() {
    if (state.recognizer && state.recognizer.isListening()) {
      state.recognizer.stopListening();
      console.log('⏹️ Modelo dejó de escuchar.');
    }
  }

  /* ── Registrar funciones en el namespace global ── */
  V.fn.loadModel = loadModel;
  V.fn.startModelListening = startModelListening;
  V.fn.stopModelListening = stopModelListening;

  console.log('✅ [model] Módulo TF.js activado — listo para cargar modelo.');

})();
