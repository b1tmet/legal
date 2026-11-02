/* moderno.js — barra superior compacta (app bar) al hacer scroll.
   Copia el logo, el título, las pestañas y el selector de idioma de la cabecera
   en una barra fija que aparece cuando el título sale de pantalla.
   Se carga después de lang.js. Sin dependencias. */
(function () {
  var hero = document.querySelector('.hero');
  if (!hero || document.querySelector('.appbar')) return;

  var brand = hero.querySelector('.brand');
  var title = hero.querySelector('.title');
  var nav = hero.querySelector('.subnav');
  var langsel = hero.querySelector('.langsel');
  var origSel = document.getElementById('langsel');

  var ab = document.createElement('div');
  ab.className = 'appbar';
  ab.setAttribute('aria-hidden', 'true');
  ab.inert = true;
  var inner = document.createElement('div');
  inner.className = 'ab-in';
  ab.appendChild(inner);

  if (brand) inner.appendChild(brand.cloneNode(true));

  // Título: solo los h1 (uno por idioma; el CSS de idiomas muestra el activo)
  var tWrap = document.createElement('div');
  tWrap.className = 'ab-title';
  if (title) {
    title.querySelectorAll('h1[lang]').forEach(function (h) {
      var s = document.createElement('span');
      s.setAttribute('lang', h.getAttribute('lang'));
      s.textContent = h.textContent;
      tWrap.appendChild(s);
    });
  }
  inner.appendChild(tWrap);

  if (nav) {
    var n = nav.cloneNode(true);
    n.classList.add('ab-nav');
    n.removeAttribute('aria-label');
    inner.appendChild(n);
  }

  // Selector de idioma: copia sincronizada con el original (lang.js escucha el original)
  if (langsel && origSel) {
    var ls = langsel.cloneNode(true);
    var s2 = ls.querySelector('select');
    s2.removeAttribute('id');
    s2.value = origSel.value;
    s2.addEventListener('change', function () {
      origSel.value = s2.value;
      origSel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    origSel.addEventListener('change', function () { s2.value = origSel.value; });
    inner.appendChild(ls);
  }

  document.body.appendChild(ab);

  // Altura de la barra en --appbar-h: la usan el índice de api-docs y los saltos a anclas
  function setH() {
    document.documentElement.style.setProperty('--appbar-h', ab.offsetHeight + 'px');
  }
  setH();
  window.addEventListener('resize', setH);

  function show(on) {
    ab.classList.toggle('on', on);
    ab.inert = !on;
    if (on) ab.removeAttribute('aria-hidden'); else ab.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.toggle('ab-on', on);
  }

  // Aparece cuando el título (o la fila del logo) ha pasado por debajo de la barra
  var target = title || hero.querySelector('.bar') || hero;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      var e = es[0];
      show(!e.isIntersecting && e.boundingClientRect.top < 0);
    }, { rootMargin: '-' + Math.max(ab.offsetHeight, 1) + 'px 0px 0px 0px' }).observe(target);
  } else {
    window.addEventListener('scroll', function () {
      show(target.getBoundingClientRect().bottom < ab.offsetHeight);
    }, { passive: true });
  }
})();

/* Fondo animado de la cabecera: partículas que siguen un campo de viento
   (alisios del este y un ciclón que gira en sentido antihorario).
   Es decorativo: no son datos reales. Se pausa fuera de pantalla, con la
   pestaña oculta y si el sistema pide movimiento reducido. */
(function () {
  var hero = document.querySelector('.hero');
  if (!hero || !window.requestAnimationFrame) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var cv = document.createElement('canvas');
  cv.className = 'wind';
  cv.setAttribute('aria-hidden', 'true');
  hero.insertBefore(cv, hero.firstChild);
  var ctx = cv.getContext('2d');
  if (!ctx) return;

  var W = 0, H = 0, dpr = 1, P = [], N = 0, visible = true, raf = 0, t = 0;

  function size() {
    var r = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    N = Math.round(Math.min(900, W * H / 900));       // densidad según el área
    P = [];
    for (var i = 0; i < N; i++) P.push(spawn({}, true));
  }

  function spawn(p, anywhere) {
    p.x = anywhere ? Math.random() * W : W + Math.random() * 40;   // los alisios entran por el este
    p.y = Math.random() * H;
    p.age = 0;
    p.life = 80 + Math.random() * 160;
    return p;
  }

  // Campo de viento en px/fotograma
  function wind(x, y) {
    var s = Math.min(W, 1200) / 1200 + .4;
    var cx = W * (.74 + .04 * Math.sin(t * .0007)), cy = H * (.42 + .08 * Math.cos(t * .0009));
    var R = Math.min(W, H) * .22 + 30;
    var dx = x - cx, dy = y - cy, r = Math.sqrt(dx * dx + dy * dy) + .001;
    var vt = 3.2 * s * (r < R ? r / R : Math.pow(R / r, .8));    // vórtice de Rankine
    var inflow = .35 * vt;
    var u = (dy / r) * vt - (dx / r) * inflow;                    // giro antihorario + convergencia
    var v = (-dx / r) * vt - (dy / r) * inflow;
    u += -1.1 * s + .35 * Math.sin(y / 70 + t * .01);             // alisios con ondulación
    v += .25 * Math.sin(x / 90 - t * .008);
    return [u, v];
  }

  function frame() {
    t++;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,.08)';                // estela que se desvanece
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 1.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (var i = 0; i < N; i++) {
      var p = P[i], w = wind(p.x, p.y);
      var nx = p.x + w[0], ny = p.y + w[1];
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nx, ny);
      p.x = nx; p.y = ny; p.age++;
      if (p.age > p.life || nx < -10 || ny < -10 || ny > H + 10 || nx > W + 60) spawn(p, Math.random() < .7);
    }
    ctx.strokeStyle = 'rgba(190,205,255,.22)';
    ctx.stroke();
    raf = visible && !document.hidden ? requestAnimationFrame(frame) : 0;
  }

  function start() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); }

  size();
  cv.classList.add('on');
  start();

  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 150); });
  document.addEventListener('visibilitychange', start);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; start(); }).observe(hero);
  }
})();

/* Botón «Copiar» en los bloques de código. window.b1tCopy(raíz) lo añade también
   a bloques creados después (p. ej. el ejemplo del mapa en api.html). */
(function () {
  var L = {
    es: ['Copiar', 'Copiado'], en: ['Copy', 'Copied'], pt: ['Copiar', 'Copiado'],
    fr: ['Copier', 'Copié'], it: ['Copia', 'Copiato'], nl: ['Kopiëren', 'Gekopieerd']
  };
  function txt(i) { var l = document.documentElement.getAttribute('data-lang'); return (L[l] || L.en)[i]; }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, ko) {               // file:// o http sin TLS
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? ok() : ko(); } catch (e) { ko(e); }
      document.body.removeChild(ta);
    });
  }
  function add(root) {
    (root || document).querySelectorAll('pre.code').forEach(function (pre) {
      if (pre.querySelector('.copy')) return;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'copy'; b.textContent = txt(0);
      b.addEventListener('click', function () {
        var code = pre.querySelector('code') || pre;
        copy(code.textContent).then(function () {
          b.textContent = txt(1); b.classList.add('done');
          setTimeout(function () { b.textContent = txt(0); b.classList.remove('done'); }, 1600);
        }, function () {});
      });
      pre.appendChild(b);
    });
  }
  window.b1tCopy = add;
  add(document);
  // Al cambiar de idioma se actualiza el texto de los botones
  new MutationObserver(function () {
    document.querySelectorAll('pre.code .copy:not(.done)').forEach(function (b) { b.textContent = txt(0); });
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });
})();
