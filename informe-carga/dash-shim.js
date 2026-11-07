// Sustituto mínimo del entorno de Claude para servir el informe como página estática
// (GitHub Pages u otro hosting). Carga los CSV de ./data/ y expone el mismo objeto `dash`
// que usa app.js: data(), draw(), calc(), onData() y colors.
(function () {
  const DATASETS = ['kpis', 'comparacion', 'rampa', 'escalones', 'endpoints_mezcla', 'serie_run1',
    'recursos', 'api_planes', 'sonda', 'errores', 'videos'];
  const store = {};      // id -> {status, data}
  const drawers = {};    // nombre -> función(el)
  const calcs = {};      // nombre -> spec
  const dataCbs = [];
  let loaded = false;

  function runDraw(name) {
    const fn = drawers[name];
    if (!fn || !loaded) return;
    document.querySelectorAll(`[data-draw="${name}"]`).forEach((el) => {
      try { fn(el); } catch (e) { console.error(`Error dibujando "${name}"`, e); }
    });
  }
  function runCalc(name) {
    const spec = calcs[name];
    const ins = spec.inputs.map((id) => store[id]);
    if (ins.some((d) => !d || d.status !== 'ok')) { store[name] = { status: 'error', data: null }; return; }
    try { store[name] = { status: 'ok', data: spec.fn(...ins.map((d) => d.data)) }; }
    catch (e) { console.error(e); store[name] = { status: 'error', data: null }; }
  }

  window.dash = {
    colors: ['#2a6fb0', '#d97a3a', '#7a5cb8', '#3d9a8b', '#b0953a', '#c0473b'],
    data: (id) => store[id] || { status: 'loading', data: null },
    draw(name, fn) { if (fn) drawers[name] = fn; runDraw(name); },
    calc(name, spec) { calcs[name] = spec; if (loaded) runCalc(name); },
    onData(cb) { dataCbs.push(cb); if (loaded) cb(); },
  };

  Promise.all(DATASETS.map((id) => d3.csv(`data/${id}.csv`)
    .then((rows) => { store[id] = { status: 'ok', data: rows }; })
    .catch(() => { store[id] = { status: 'error', data: null }; })))
    .then(() => {
      loaded = true;
      Object.keys(calcs).forEach(runCalc);
      dataCbs.forEach((cb) => cb());
      Object.keys(drawers).forEach(runDraw);
    });

  // Redibujar los gráficos al cambiar el ancho de la ventana
  let lastW = window.innerWidth, t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      Object.keys(drawers).forEach(runDraw);
    }, 200);
  });
})();
