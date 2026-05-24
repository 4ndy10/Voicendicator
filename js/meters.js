/* ================================================================
   MÓDULO: meters.js — Lógica Visual de Resultado de Tono
   
   Este módulo se encarga EXCLUSIVAMENTE de la lógica visual:
   - Mapea la clase ganadora del modelo → color de fondo y banner
   - Actualiza las barras de probabilidad con los % del modelo
   - Calcula visualmente si hay empate → banner verde neutra
   
   IMPORTANTE: Este módulo NO clasifica la voz. El modelo de
   Teachable Machine ya determinó qué tipo de voz es. Este módulo
   solo decide cómo PINTARLO en pantalla.
   
   MAPEO DE COLORES:
     Masculino Grave  → Azul Oscuro   #0a1a4a
     Masculino Agudo  → Azul Clarito  #5b8dee
     Femenino Grave   → Morado Oscuro #3a0a5c
     Femenino Agudo   → Morado Claro  #b47ede
     Neutra (empate)  → Verde         #1b7d18
   
   DEPENDENCIAS: config.js, dom.js
   ================================================================ */

(function () {
  'use strict';

  /* Referencias cortas al namespace */
  var V = window.Voicendicator;
  var dom = V.dom;

  /* ══════════════════════════════════════════════════════════════
     MAPA DE COLORES — Clase del modelo → color visual
     
     Cada clave corresponde al key de la categoría (mg, ma, fg, fa).
     El modelo es quien decide cuál gana; aquí solo asignamos el color.
     ══════════════════════════════════════════════════════════════ */
  var TONE_COLORS = {
    mg: {
      bg: '#0a1a4a',         // Azul Oscuro — Masculino Grave
      text: '#ffffff',        // Texto blanco para contraste
      label: 'Voz Masculina Grave',
      icon: '🔵'
    },
    ma: {
      bg: '#5b8dee',         // Azul Clarito — Masculino Agudo
      text: '#0a1a4a',        // Texto azul oscuro para contraste
      label: 'Voz Masculina Aguda',
      icon: '💠'
    },
    fg: {
      bg: '#3a0a5c',         // Morado Oscuro — Femenino Grave
      text: '#ffffff',        // Texto blanco para contraste
      label: 'Voz Femenina Grave',
      icon: '🟣'
    },
    fa: {
      bg: '#b47ede',         // Morado Clarito — Femenino Agudo
      text: '#3a0a5c',        // Texto morado oscuro para contraste
      label: 'Voz Femenina Aguda',
      icon: '💜'
    }
  };

  /* Color para voz neutra (empate género indeterminado) */
  var NEUTRAL_COLOR = {
    bg: '#1b7d18',           // Verde original del proyecto
    text: '#ffffff',
    label: 'Voz Neutra (Género Indeterminado)',
    icon: '🟢'
  };

  /* ══════════════════════════════════════════════════════════════
     updateToneUI(winner, probs, isNeutral, noisePct)
     
     Función principal de actualización visual.
     
     PARÁMETROS:
       winner    — Objeto { key, label, pct } de la clase ganadora
       probs     — Objeto { mg, ma, fg, fa } con porcentajes (0-100)
       isNeutral — Boolean: true si hay empate de género
       noisePct  — Number (0-100): porcentaje de ruido de fondo
     
     ACCIONES:
       1. Actualizar las barras de probabilidad (width + texto)
       2. Actualizar el indicador de ruido de fondo
       3. Determinar el color a aplicar (según winner o neutral)
       4. Cambiar el fondo del body con transición CSS suave
       5. Cambiar el banner de tono (color, texto, ícono)
     ══════════════════════════════════════════════════════════════ */
  function updateToneUI(winner, probs, isNeutral, noisePct) {

    /* ── Paso 1: Actualizar cada barra de progreso ──
       Recorremos las claves (mg, ma, fg, fa) y actualizamos
       tanto la barra visual como el texto porcentual. */
    Object.keys(probs).forEach(function (key) {
      var pct = probs[key];

      /* Actualizar ancho de la barra de relleno (animado via CSS transition) */
      if (dom.bars[key]) {
        dom.bars[key].style.width = pct + '%';
      }

      /* Actualizar texto del valor porcentual */
      if (dom.vals[key]) {
        dom.vals[key].textContent = pct + '%';
      }
    });

    /* ── Paso 1b: Actualizar indicador de ruido de fondo ── */
    if (dom.noiseBar) {
      dom.noiseBar.style.width = (noisePct || 0) + '%';
    }
    if (dom.noiseVal) {
      dom.noiseVal.textContent = (noisePct || 0) + '%';
    }

    /* ── Paso 2: Determinar color a aplicar ──
       Si hay empate (isNeutral), usamos el verde.
       Si no, usamos el color de la clase ganadora del modelo. */
    var tone;
    if (isNeutral) {
      tone = NEUTRAL_COLOR;
    } else {
      tone = TONE_COLORS[winner.key] || NEUTRAL_COLOR;
    }

    /* ── Paso 3: Cambiar fondo del body ──
       La transición CSS (0.5s ease) definida en base.css
       hace que el cambio sea suave y fluido. */
    document.body.style.backgroundColor = tone.bg;

    /* ── Paso 4: Actualizar el banner de tono ──
       Cambiamos el fondo, texto y sombra del banner. */
    if (dom.toneBanner) {
      dom.toneBanner.style.backgroundColor = tone.bg;
      dom.toneBanner.style.color = tone.text;
      dom.toneBanner.style.borderColor = 'transparent';
      dom.toneBanner.style.boxShadow = '0 8px 32px ' + tone.bg + '40';
      dom.toneBanner.classList.add('tone-result__banner--active');
    }

    if (dom.toneLabel) {
      dom.toneLabel.textContent = tone.label;
      dom.toneLabel.style.color = tone.text;
    }

    if (dom.toneIcon) {
      dom.toneIcon.textContent = tone.icon;
    }

    var isDarkBg = (tone.bg === '#0a1a4a' || tone.bg === '#3a0a5c');

    /* Ajustar el color de la navbar en fondos oscuros */
    var navbar = document.getElementById('navbar');
    if (navbar) {
      if (isDarkBg) {
        navbar.style.backgroundColor = 'rgba(10, 26, 74, 0.85)';
        navbar.style.borderBottomColor = 'rgba(255,255,255,0.1)';
      } else if (tone.bg === '#1b7d18') {
        navbar.style.backgroundColor = 'rgba(27, 125, 24, 0.85)';
        navbar.style.borderBottomColor = 'rgba(255,255,255,0.15)';
      } else {
        navbar.style.backgroundColor = '';
        navbar.style.borderBottomColor = '';
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════
     resetToneUI() — Restaurar la UI al estado inicial
     
     Se invoca cuando se detiene el análisis para limpiar todos
     los cambios visuales y regresar al color crema por defecto.
     ══════════════════════════════════════════════════════════════ */
  function resetToneUI() {
    /* Restaurar fondo del body al color crema */
    document.body.style.backgroundColor = '';

    /* Restaurar banner de tono */
    if (dom.toneBanner) {
      dom.toneBanner.style.backgroundColor = '';
      dom.toneBanner.style.color = '';
      dom.toneBanner.style.borderColor = '';
      dom.toneBanner.style.boxShadow = '';
      dom.toneBanner.classList.remove('tone-result__banner--active');
    }

    if (dom.toneLabel) {
      dom.toneLabel.textContent = 'Esperando audio...';
      dom.toneLabel.style.color = '';
    }

    if (dom.toneIcon) {
      dom.toneIcon.textContent = '🎙️';
    }

    /* Restaurar barras a 0% */
    Object.keys(dom.bars).forEach(function (key) {
      if (dom.bars[key]) {
        dom.bars[key].style.width = '0%';
      }
      if (dom.vals[key]) {
        dom.vals[key].textContent = '0%';
      }
    });

    /* Restaurar indicador de ruido de fondo */
    if (dom.noiseBar) {
      dom.noiseBar.style.width = '0%';
    }
    if (dom.noiseVal) {
      dom.noiseVal.textContent = '0%';
    }

    /* Restaurar navbar */
    var navbar = document.getElementById('navbar');
    if (navbar) {
      navbar.style.backgroundColor = '';
      navbar.style.borderBottomColor = '';
    }
  }

  /* ── Registrar funciones en el namespace global ── */
  V.fn.updateToneUI = updateToneUI;
  V.fn.resetToneUI = resetToneUI;

  console.log('✅ [meters] Módulo de lógica visual de tono registrado.');

})();
