/* ================================================================
   MÓDULO: ui.js — Gestión de Estado Visual de la Interfaz
   
   Centraliza todos los cambios visuales que ocurren cuando el
   usuario inicia o detiene el análisis de voz.
   
   Cuando se inicia la grabación (active = true):
   - Media area se ilumina (borde verde brillante + glow)
   - Punto de estado se vuelve verde y parpadea
   - Texto cambia a "Analizando tu voz..."
   - Botón "Iniciar" se deshabilita
   - Botón "Detener" se habilita
   
   Cuando se detiene (active = false):
   - Todo regresa al estado visual inicial
   - Texto cambia a "Análisis detenido"
   - Fondo y banner de tono se restauran al estado crema
   
   DEPENDENCIAS: config.js, dom.js, meters.js (resetToneUI)
   ================================================================ */

(function () {
  'use strict';

  /* Referencias cortas al namespace */
  var V = window.Voicendicator;
  var dom = V.dom;

  /* ══════════════════════════════════════════════════════════════
     updateUI(active) — Alternar estado visual de la interfaz
     
     PARÁMETRO:
       active — boolean. true = grabando, false = detenido.
     
     Esta función NO maneja la lógica de audio ni del modelo.
     Solo se encarga de los cambios CSS y textuales de la UI.
     ══════════════════════════════════════════════════════════════ */
  function updateUI(active) {
    if (active) {
      /* ── ESTADO ACTIVO: Grabando ── */

      /* Media area: agregar clase que activa borde brillante,
         glow verde, canvas visible y anillo de pulso */
      dom.mediaArea.classList.add('media-area--active');

      /* Punto de estado: verde con parpadeo (blink animation) */
      dom.statusDot.classList.add('controls__status-dot--active');

      /* Texto de estado: verde, indica que está analizando */
      dom.statusText.classList.add('controls__status-text--active');
      dom.statusText.textContent = 'Analizando tu voz...';
      dom.statusText.style.color = ''; // Limpiar color inline (por si había error)

      /* Botones: deshabilitar "Iniciar", habilitar "Detener" */
      dom.btnStart.disabled = true;
      dom.btnStop.disabled = false;

    } else {
      /* ── ESTADO INACTIVO: Detenido ── */

      /* Media area: remover clase activa (regresa a estado base) */
      dom.mediaArea.classList.remove('media-area--active');

      /* Punto de estado: gris, sin parpadeo */
      dom.statusDot.classList.remove('controls__status-dot--active');

      /* Texto de estado: gris, indica que se detuvo */
      dom.statusText.classList.remove('controls__status-text--active');
      dom.statusText.textContent = 'Análisis detenido';
      dom.statusText.style.color = ''; // Limpiar color inline

      /* Botones: habilitar "Iniciar", deshabilitar "Detener" */
      dom.btnStart.disabled = false;
      dom.btnStop.disabled = true;

      /* ── Restaurar colores del tono al estado crema ──
         resetToneUI limpia el fondo del body, el banner de tono,
         las barras de probabilidad y la navbar al estado inicial. */
      V.fn.resetToneUI();
    }
  }

  /* ── Registrar la función en el namespace global ── */
  V.fn.updateUI = updateUI;

  console.log('✅ [ui] Módulo de estado visual registrado.');

})();
