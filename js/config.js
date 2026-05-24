/* ================================================================
   MÓDULO: config.js — Configuración Global y Constantes
   
   Este es el PRIMER módulo JavaScript que se carga.
   Establece el namespace global `Voicendicator` que todos los demás
   módulos utilizarán para compartir estado y funciones.
   
   RESPONSABILIDADES:
   - Crear el namespace global window.Voicendicator
   - Definir constantes de configuración
   - Inicializar el objeto de estado compartido (state)
   - Preparar la URL del modelo de Teachable Machine
   
   DEPENDENCIAS: Ninguna (debe cargarse primero)
   ================================================================ */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════
     NAMESPACE GLOBAL — window.Voicendicator
     
     Usamos un objeto global para compartir estado y funciones
     entre módulos SIN necesidad de un bundler (Webpack, Vite, etc).
     
     Cada módulo posterior accederá y extenderá este objeto:
       Voicendicator.dom    → referencias DOM
       Voicendicator.state  → estado de la aplicación
       Voicendicator.fn     → funciones públicas
     ══════════════════════════════════════════════════════════════ */
  window.Voicendicator = window.Voicendicator || {};

  /* ══════════════════════════════════════════════════════════════
     CONFIGURACIÓN DEL MODELO — AQUÍ SE INTEGRARÁ TENSORFLOW.JS
     
     Cambia esta URL cuando subas tu modelo exportado de
     Teachable Machine (Speech Project).
     
     OPCIONES:
     - Opción A: Modelo hospedado en TM (URL pública)
       MODEL_URL = 'https://teachablemachine.withgoogle.com/models/TU_MODEL_ID/'
     
     - Opción B: Modelo local (archivos en carpeta ./model/)
       MODEL_URL = './model/'
     
     Los archivos necesarios del modelo son:
       - model.json     → Arquitectura de la red neuronal
       - metadata.json  → Etiquetas de las clases
       - weights.bin    → Pesos entrenados del modelo
     ══════════════════════════════════════════════════════════════ */
  Voicendicator.MODEL_URL = 'https://teachablemachine.withgoogle.com/models/H5xiHUPI3/';

  /* ══════════════════════════════════════════════════════════════
     CONSTANTES DE LA APLICACIÓN
     
     MAX_SPECTRUM_POINTS: Número máximo de puntos de datos que se
     almacenan en el gráfico de espectro. Cuando se excede este
     límite, los puntos más antiguos se eliminan (FIFO).
     200 puntos a 10fps ≈ 20 segundos de datos visibles.
     ══════════════════════════════════════════════════════════════ */
  Voicendicator.MAX_SPECTRUM_POINTS = 200;

  /* ══════════════════════════════════════════════════════════════
     ESTADO COMPARTIDO DE LA APLICACIÓN
     
     Objeto mutable que almacena el estado en tiempo de ejecución.
     Los módulos leen y escriben directamente en este objeto.
     
     - isRecording    : ¿Está el micrófono grabando actualmente?
     - audioCtx       : Instancia de AudioContext (Web Audio API)
     - analyser       : Nodo AnalyserNode para procesar la señal
     - microphone     : Nodo MediaStreamSource del micrófono
     - stream         : MediaStream del micrófono (getUserMedia)
     - waveformAnimId : ID de requestAnimationFrame del waveform
     - analysisInterval: ID del setInterval del loop de análisis
     - spectrumData   : Array de valores F₀ para el gráfico (línea verde)
     - spectrumAvgData: Array de promedios F₀ para el gráfico (línea azul)
     - recognizer     : Instancia del reconocedor de TF.js (null hasta cargar modelo)
     - wCtx           : CanvasRenderingContext2D del waveform
     - sCtx           : CanvasRenderingContext2D del spectrum
     ══════════════════════════════════════════════════════════════ */
  Voicendicator.state = {
    isRecording: false,
    audioCtx: null,
    analyser: null,
    microphone: null,
    stream: null,
    waveformAnimId: null,
    analysisInterval: null,
    spectrumData: [],
    spectrumAvgData: [],
    recognizer: null,
    wCtx: null,
    sCtx: null
  };

  /* ══════════════════════════════════════════════════════════════
     CONTENEDOR DE FUNCIONES PÚBLICAS
     
     Los módulos registran sus funciones aquí para que otros
     módulos puedan invocarlas. Ejemplo:
       Voicendicator.fn.initCanvases()
       Voicendicator.fn.startRecording()
     ══════════════════════════════════════════════════════════════ */
  Voicendicator.fn = {};

  console.log('✅ [config] Namespace Voicendicator inicializado.');

})();
