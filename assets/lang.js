(function () {
  var btns = document.querySelectorAll('.langs button');
  function mark() {
    var cur = document.documentElement.getAttribute('data-lang');
    btns.forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-set') === cur); });
  }
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      var l = b.getAttribute('data-set');
      document.documentElement.setAttribute('data-lang', l);
      document.documentElement.lang = l;
      try { localStorage.setItem('b1t-lang', l); } catch (e) {}
      mark();
    });
  });
  mark();
})();
