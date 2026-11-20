/* ShinyText — portage vanilla du composant React (motion/react).
   Même principe : un dégradé clippé sur le texte, dont la position avance
   image par image. Aucune dépendance, aucun nœud en plus.

   ShinyText(el | sélecteur, { text, disabled, speed, className, color,
     shineColor, spread, yoyo, pauseOnHover, direction, delay })

   Déclaration automatique :
     <em data-shiny data-speed="3" data-delay=".2" data-spread="120">…</em>
   (`delay` décale le départ une seule fois, comme `animation-delay` ;
   `data-shine`, `data-color`, `data-yoyo`, `data-pause`, `data-direction`).

   Les couleurs par défaut viennent du CSS : --sh-color (couleur du texte)
   et --sh-shine (le reflet). */
(function (global, doc) {
  'use strict';

  var REDUCED = false;
  try { REDUCED = global.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var DEFAULTS = {
    text: null, disabled: false, speed: 2, className: '', color: null,
    shineColor: null, spread: 120, yoyo: false, pauseOnHover: false,
    direction: 'left', delay: 0
  };

  var insts = [], loop = null, observer = null;

  /* Progression 0 → 100 ; 100 → 0 en aller-retour si yoyo. */
  function progressAt(it) {
    var dur = it.speed * 1000;
    if (it.elapsed < 0) return it.dir === 1 ? 0 : 100;
    var p;
    if (it.yoyo) {
      var full = dur * 2, ct = it.elapsed % full;
      p = ct < dur ? (ct / dur) * 100 : 100 - ((ct - dur) / dur) * 100;
    } else {
      p = ((it.elapsed % dur) / dur) * 100;
    }
    return it.dir === 1 ? p : 100 - p;
  }

  /* p = 0 → reflet hors cadre à droite, p = 100 → hors cadre à gauche. */
  function paint(it) {
    it.el.style.backgroundPosition = (150 - progressAt(it) * 2).toFixed(2) + '% center';
  }

  function tick(time) {
    var hidden = doc.hidden, alive = false;
    for (var i = 0; i < insts.length; i++) {
      var it = insts[i];
      if (it.dead) continue;
      if (it.disabled || it.paused || hidden || !it.visible) { it.last = null; continue; }
      alive = true;
      if (it.last === null) { it.last = time; continue; }
      var dt = time - it.last;
      it.last = time;
      if (dt > 0) { it.elapsed += dt > 250 ? 250 : dt; paint(it); }
    }
    /* Plus rien à animer : la boucle s'arrête, l'observateur la relance. */
    loop = alive ? global.requestAnimationFrame(tick) : null;
  }

  function start() {
    if (loop || REDUCED) return;
    loop = global.requestAnimationFrame(tick);
  }

  function watch(it) {
    if (!global.IntersectionObserver) return;
    if (!observer) {
      observer = new global.IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var inst = entries[i].target.__shiny;
          if (!inst) continue;
          inst.visible = entries[i].isIntersecting;
          inst.last = null;
          if (inst.visible) start();
        }
      }, { rootMargin: '120px' });
    }
    try { observer.observe(it.el); } catch (e) {}
  }

  doc.addEventListener('visibilitychange', function () {
    for (var i = 0; i < insts.length; i++) insts[i].last = null;
    if (!doc.hidden) start();
  });

  function ShinyText(target, props) {
    var el = typeof target === 'string' ? doc.querySelector(target) : target;
    if (!el) return null;
    if (el.__shiny && !el.__shiny.dead) return el.__shiny;

    var o = {}, k;
    for (k in DEFAULTS) o[k] = DEFAULTS[k];
    if (props) for (k in props) if (props[k] !== undefined) o[k] = props[k];

    if (o.text != null) el.textContent = o.text;
    if (o.className) {
      var extra = String(o.className).split(/\s+/);
      for (var i = 0; i < extra.length; i++) if (extra[i]) el.classList.add(extra[i]);
    }
    el.classList.add('shiny');
    el.style.setProperty('--sh-spread', (parseFloat(o.spread) || 120) + 'deg');
    if (o.color) el.style.setProperty('--sh-color', o.color);
    if (o.shineColor) el.style.setProperty('--sh-shine', o.shineColor);

    var it = {
      el: el,
      speed: Math.max(0.2, parseFloat(o.speed) || 2),
      dir: o.direction === 'right' ? -1 : 1,
      yoyo: !!o.yoyo,
      disabled: REDUCED || !!o.disabled,
      paused: false,
      visible: true,
      /* départ différé une seule fois, comme animation-delay */
      elapsed: -Math.max(0, parseFloat(o.delay) || 0) * 1000,
      last: null,
      dead: false
    };

    if (o.pauseOnHover) {
      el.addEventListener('pointerenter', function () { it.paused = true; it.last = null; });
      el.addEventListener('pointerleave', function () { it.paused = false; it.last = null; start(); });
    }

    el.__shiny = it;
    insts.push(it);
    paint(it);
    watch(it);
    start();

    it.destroy = function () {
      it.dead = true;
      if (observer) { try { observer.unobserve(el); } catch (e) {} }
      el.style.backgroundPosition = '';
      var j = insts.indexOf(it);
      if (j >= 0) insts.splice(j, 1);
    };
    return it;
  }

  /* --- Déclaration automatique via data-* ------------------------------- */
  function num(el, name, fallback) {
    var v = parseFloat(el.getAttribute('data-' + name));
    return isNaN(v) ? fallback : v;
  }
  function flag(el, name) { return el.getAttribute('data-' + name) !== null; }

  function auto() {
    var els = doc.querySelectorAll('[data-shiny]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      ShinyText(el, {
        text: el.getAttribute('data-text'),
        speed: num(el, 'speed', 2),
        delay: num(el, 'delay', 0),
        spread: num(el, 'spread', 120),
        color: el.getAttribute('data-color'),
        shineColor: el.getAttribute('data-shine'),
        direction: el.getAttribute('data-direction') === 'right' ? 'right' : 'left',
        yoyo: flag(el, 'yoyo'),
        pauseOnHover: flag(el, 'pause'),
        disabled: flag(el, 'disabled')
      });
    }
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', auto);
  else auto();

  global.ShinyText = ShinyText;
})(window, document);
