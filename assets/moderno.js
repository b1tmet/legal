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
