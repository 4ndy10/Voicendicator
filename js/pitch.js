/* ================================================================
   MÓDULO: pitch.js — Detección de Frecuencia Fundamental (F₀)
   
   Implementa la detección de pitch (tono) de la voz usando el
   algoritmo de AUTOCORRELACIÓN sobre la señal temporal del micrófono.
   
   ¿QUÉ ES F₀ (FRECUENCIA FUNDAMENTAL)?
   Es la frecuencia más baja de la vibración de las cuerdas vocales.
   Determina si una voz se percibe como grave (F₀ baja, ~80-150 Hz)
   o aguda (F₀ alta, ~200-400 Hz).
   
   ALGORITMO — AUTOCORRELACIÓN:
   La autocorrelación mide cuánto se parece una señal a una versión
   desplazada de sí misma. Para una señal periódica (como la voz),
   la correlación será máxima cuando el desplazamiento (período)
   coincida con el período fundamental de la señal.
   
   F₀ = sampleRate / período_con_máxima_correlación
   
   RANGO DE DETECCIÓN: 60 Hz — 500 Hz
   (cubre voces masculinas graves hasta voces femeninas agudas)
   
   DEPENDENCIAS: config.js (Voicendicator.state.analyser, audioCtx)
   ================================================================ */

(function () {
  'use strict';

  /* Referencia corta al namespace */
  var V = window.Voicendicator;
  var state = V.state;

  /* ══════════════════════════════════════════════════════════════
     detectPitch() → number | null
     
     Retorna la frecuencia fundamental estimada en Hz,
     o null si no se detecta un tono válido (silencio, ruido).
     
     PROCESO:
     1. Obtener datos de audio en punto flotante (-1.0 a 1.0)
     2. Calcular RMS (Root Mean Square) para verificar si hay señal
     3. Si RMS < 0.01, la señal es demasiado débil → return null
     4. Para cada posible período (entre minPeriod y maxPeriod):
        a. Calcular la correlación entre la señal y su versión desplazada
        b. Guardar el período con mejor correlación
     5. Si la mejor correlación > 0.8 (umbral de confianza), retornar
        la frecuencia: sampleRate / bestPeriod
     6. Si la correlación es baja, la señal no es periódica → null
     ══════════════════════════════════════════════════════════════ */
  function detectPitch() {
    /* Sin analyser no podemos detectar nada */
    if (!state.analyser) return null;

    /* ── Paso 1: Obtener datos de audio ──
       getFloatTimeDomainData retorna valores en punto flotante
       entre -1.0 y 1.0 (más preciso que la versión Byte). */
    var bufferLength = state.analyser.fftSize;
    var buffer = new Float32Array(bufferLength);
    state.analyser.getFloatTimeDomainData(buffer);

    /* ── Paso 2: Calcular RMS (Root Mean Square) ──
       RMS es una medida de la amplitud promedio de la señal.
       Fórmula: RMS = sqrt(Σ(x²) / N)
       Si es muy bajo, significa que hay silencio o ruido mínimo. */
    var rms = 0;
    for (var i = 0; i < bufferLength; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / bufferLength);

    /* ── Paso 3: Umbral de silencio ──
       0.01 es un umbral empírico. Señales por debajo de esto
       son típicamente ruido de fondo del micrófono. */
    if (rms < 0.01) return null;

    /* ── Paso 4: Autocorrelación ──
       
       Definiciones:
       - sampleRate: muestras por segundo del micrófono (típicamente 44100 o 48000)
       - minPeriod: el período más corto a buscar = sampleRate / 500 Hz
         (no buscamos frecuencias > 500 Hz, serían muy agudas para voz)
       - maxPeriod: el período más largo a buscar = sampleRate / 60 Hz
         (no buscamos frecuencias < 60 Hz, serían demasiado graves)
       
       Para cada posible período, calculamos cuánto se parece
       la señal original a la versión desplazada por ese período.
       Usamos la diferencia absoluta (menor diferencia = mayor correlación). */
    var sampleRate = state.audioCtx.sampleRate;
    var minPeriod = Math.floor(sampleRate / 500); // Máx 500 Hz
    var maxPeriod = Math.floor(sampleRate / 60);  // Mín 60 Hz
    var bestCorrelation = -1;
    var bestPeriod = -1;

    for (var period = minPeriod; period <= maxPeriod; period++) {
      var correlation = 0;

      /* Comparar cada muestra con la muestra desplazada por 'period' */
      for (var j = 0; j < bufferLength - period; j++) {
        correlation += Math.abs(buffer[j] - buffer[j + period]);
      }

      /* Normalizar: 1 = correlación perfecta, 0 = sin correlación.
         Invertimos la diferencia: menos diferencia = más correlación. */
      correlation = 1 - correlation / (bufferLength - period);

      /* Guardar el período con la correlación más alta */
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }

    /* ── Paso 5: Umbral de confianza ──
       Solo retornamos un resultado si la correlación es > 0.8.
       Correlaciones más bajas indican que la señal no es periódica
       (ruido, consonantes, respiración, etc.) */
    if (bestCorrelation > 0.8 && bestPeriod > 0) {
      /* F₀ = frecuencia de muestreo / período del ciclo fundamental */
      return sampleRate / bestPeriod;
    }

    /* Señal no periódica o correlación insuficiente */
    return null;
  }

  /* ── Registrar la función en el namespace global ── */
  V.fn.detectPitch = detectPitch;

  console.log('✅ [pitch] Módulo de detección de F₀ registrado.');

})();
