// Prueba de carga B1TMET — dibujos de la página
(function () {
  const NF = (d) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: d, minimumFractionDigits: d });
  const num = (v) => (v === '' || v == null ? NaN : Number(v));
  const fmtMs = (v) => {
    v = num(v);
    if (!isFinite(v)) return '—';
    if (v >= 10000) return NF(0).format(v / 1000) + ' s';
    if (v >= 1000) return NF(1).format(v / 1000) + ' s';
    return NF(0).format(v) + ' ms';
  };
  const FMT = {
    ms: fmtMs,
    int: (v) => (isFinite(num(v)) ? new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' }).format(num(v)) : '—'),
    dec1: (v) => (isFinite(num(v)) ? NF(1).format(num(v)) : '—'),
    dec2: (v) => (isFinite(num(v)) ? NF(2).format(num(v)) : '—'),
    pct0: (v) => (isFinite(num(v)) ? NF(0).format(num(v)) + ' %' : '—'),
    pct1: (v) => (isFinite(num(v)) ? NF(1).format(num(v)) + ' %' : '—'),
    pct2: (v) => (isFinite(num(v)) ? NF(2).format(num(v)) + ' %' : '—'),
    dec1ms: (v) => (isFinite(num(v)) ? NF(1).format(num(v)) + ' ms' : '—'),
    mb: (v) => (isFinite(num(v)) ? NF(0).format(num(v)) + ' MB' : '—'),
    dec1mb: (v) => (isFinite(num(v)) ? NF(1).format(num(v)) + ' MB' : '—'),
  };
  const C = () => dash.colors;
  const state = { grupo: '', rec: 'cpu_pct' };

  // Colores de las leyendas (solo estilo)
  dash.onData(() => {
    document.querySelectorAll('.lt .legend .sw0').forEach((e) => e.style.setProperty('--c', C()[0]));
    document.querySelectorAll('.lt .legend .sw1').forEach((e) => e.style.setProperty('--c', C()[1]));
    document.querySelectorAll('.lt .legend .sw2').forEach((e) => e.style.setProperty('--c', C()[2]));
  });

  // Controles fijos
  document.querySelectorAll('.lt-grupo').forEach((s) => s.addEventListener('change', () => {
    state.grupo = s.value; dash.draw('endpoints'); dash.draw('tabla-endpoints');
  }));
  document.querySelectorAll('.lt-rec').forEach((s) => s.addEventListener('change', () => {
    state.rec = s.value; dash.draw('recursos');
  }));

  const rowsOf = (id) => { const d = dash.data(id); return d.status === 'ok' ? d.data : null; };
  const whereMatch = (row, where) => where.split('&').every((p) => {
    const [k, v] = p.split('=').map(decodeURIComponent);
    return String(row[k]) === v;
  });
  const clear = (el) => { el.replaceChildren(); };
  const done = (el) => el.classList.remove('dash-skeleton');

  // ---------- valores sueltos en el texto
  dash.draw('val', (el) => {
    const rows = rowsOf(el.dataset.source);
    if (!rows) { el.textContent = '—'; return; }
    const r = rows.find((x) => whereMatch(x, el.dataset.where || ''));
    el.textContent = r ? (FMT[el.dataset.fmt] || String)(r[el.dataset.field]) : '—';
  });

  // ---------- mejora (calc): cuántas veces mejor que cada entorno de la prueba anterior
  dash.calc('mejora', {
    inputs: ['comparacion'],
    title: 'Veces mejor que antes',
    description: 'Tiempos: valor de antes entre el de ahora. Peticiones/s: ahora entre antes. Fallos: sin cociente.',
    fn: (comparacion) => comparacion.map((r) => {
      const b = Number(r.ahora);
      const f = (a) => (r.unidad === 'ms' ? Math.round((a / b) * 10) / 10 : r.unidad === 'pet/s' ? Math.round((b / a) * 10) / 10 : null);
      return { id: r.id, veces_2cpu: f(Number(r.antes_2cpu)), veces_sin_limites: f(Number(r.antes_sin_limites)) };
    }),
  });

  // ---------- utilidades de gráficos
  function svgFor(el, h) {
    clear(el); done(el);
    const w = Math.max(280, el.clientWidth);
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${w} ${h}`).attr('height', h);
    const tip = d3.select(el).append('div').attr('class', 'tip').style('display', 'none');
    return { svg, tip, w, h };
  }
  function showTip(tip, el, x, y, head, lines) {
    tip.style('display', null); tip.node().replaceChildren();
    tip.append('div').attr('class', 'h').text(head);
    lines.forEach((l) => {
      const d = tip.append('div');
      if (l.c) d.append('span').attr('class', 'sw').style('background', l.c);
      d.append('span').text(l.t);
    });
    const tw = tip.node().offsetWidth, cw = el.clientWidth;
    tip.style('left', Math.min(Math.max(0, x + 12), cw - tw - 4) + 'px').style('top', Math.max(0, y - 10) + 'px');
  }
  const hideTip = (tip) => tip.style('display', 'none');
  function axisStyle(g) {
    g.attr('font-size', null).attr('font-family', null);
    g.selectAll('.domain').style('stroke', 'var(--cds-chart-axis)');
    g.selectAll('.tick line').style('stroke', 'var(--cds-chart-grid)');
  }
  function placeholder(el, d) {
    clear(el);
    if (d && (d.status === 'error' || d.status === 'connect' || d.status === 'declined')) {
      done(el);
      const p = document.createElement('div');
      p.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:8px;min-height:inherit;color:var(--color-fg-muted);font-size:var(--cds-font-size-caption)';
      const dot = document.createElement('span'); dot.style.cssText = 'width:.375rem;height:.375rem;border-radius:50%;background:var(--color-bad)';
      p.append(dot, document.createTextNode('Failed to load'));
      el.append(p);
    } else { el.classList.add('dash-skeleton'); }
  }
  const msTick = (v) => (v >= 1000 ? NF(0).format(v / 1000) + ' s' : NF(0).format(v) + ' ms');

  // ---------- antes y ahora
  dash.draw('compara', (el) => {
    const d = dash.data('comparacion');
    if (d.status !== 'ok') return placeholder(el, d);
    const rows = d.data.filter((r) => r.unidad === 'ms');
    const rowH = 62, m = { t: 10, r: 16, b: 30, l: 8 };
    const { svg, tip, w } = svgFor(el, m.t + rows.length * rowH + m.b);
    const x = d3.scaleLog([100, 150000], [m.l, w - m.r]);
    const ax = svg.append('g').attr('transform', `translate(0,${m.t + rows.length * rowH})`)
      .call(d3.axisBottom(x).tickValues([100, 300, 1000, 3000, 10000, 30000, 100000]).tickFormat(msTick).tickSize(-(rows.length * rowH)));
    axisStyle(ax);
    const cols = [['antes_2cpu', 'var(--cds-chart-muted)', 'Antes, 2 CPU'], ['antes_sin_limites', 'var(--cds-chart-reference)', 'Antes, sin límites'], ['ahora', 'var(--color-ok)', 'Ahora']];
    rows.forEach((r, i) => {
      const y0 = m.t + i * rowH, cy = y0 + 38;
      const g = svg.append('g');
      g.append('text').attr('class', 'lab').attr('x', m.l).attr('y', y0 + 16).text(r.indicador);
      const vals = cols.map((c) => Number(r[c[0]]));
      g.append('line').attr('x1', x(d3.min(vals))).attr('x2', x(d3.max(vals))).attr('y1', cy).attr('y2', cy)
        .style('stroke', 'var(--cds-chart-grid)').attr('stroke-width', 4).attr('stroke-linecap', 'round');
      cols.forEach((c, j) => g.append('circle').attr('cx', x(vals[j])).attr('cy', cy).attr('r', j === 2 ? 7 : 5.5).style('fill', c[1]));
      g.append('rect').attr('x', 0).attr('y', y0).attr('width', w).attr('height', rowH).attr('fill', 'transparent')
        .on('mousemove', (ev) => { const [px, py] = d3.pointer(ev, el); showTip(tip, el, px, py, r.indicador, cols.map((c, j) => ({ c: c[1], t: `${c[2]}: ${fmtMs(vals[j])}` }))); })
        .on('mouseleave', () => hideTip(tip));
    });
  });

  const unitFmt = (u, v) => (u === 'ms' ? fmtMs(v) : u === '%' ? FMT.pct1(v) : FMT.dec1(v) + ' pet/s');
  // pares antes → ahora de la portada
  dash.draw('par', (el) => {
    const d = dash.data('comparacion'), m = dash.data('mejora');
    const r = d.status === 'ok' ? d.data.find((x) => whereMatch(x, el.dataset.where || '')) : null;
    if (!r) return;
    const v = m.status === 'ok' ? m.data.find((x) => x.id === r.id) : null;
    const set = (sel, t) => { const n = el.querySelector(sel); if (n) n.textContent = t; };
    set('.p-antes', unitFmt(r.unidad, r.antes_2cpu));
    set('.p-ahora', unitFmt(r.unidad, r.ahora));
    set('.p-sl', unitFmt(r.unidad, r.antes_sin_limites));
    set('.p-x', v && v.veces_2cpu != null ? `${NF(0).format(v.veces_2cpu)} veces más rápido` : (Number(r.ahora) === 0 ? 'Sin fallos' : ''));
  });

  // tablas de los experimentos (100 y 500 usuarios)
  dash.draw('tabla-exp', (el) => {
    const d = dash.data('comparacion'), m = dash.data('mejora');
    clear(el);
    if (d.status !== 'ok') return;
    const mej = m.status === 'ok' ? m.data : [];
    const vx = (n) => (n != null ? '×' + NF(0).format(n) : '');
    d.data.filter((r) => r.id.endsWith('_' + el.dataset.exp)).forEach((r) => {
      const tr = document.createElement('tr'); tr.dataset.key = r.id;
      const v = mej.find((x) => x.id === r.id) || {};
      const cells = [r.indicador, unitFmt(r.unidad, r.antes_2cpu), unitFmt(r.unidad, r.antes_sin_limites), unitFmt(r.unidad, r.ahora),
        r.unidad === '%' ? (Number(r.ahora) === 0 ? 'sin fallos' : '') : vx(v.veces_2cpu)];
      cells.forEach((t, i) => { const td = document.createElement('td'); td.textContent = t; if (i === 3) td.className = 'now'; if (i === 4) td.className = 'gain'; tr.append(td); });
      el.append(tr);
    });
  });

  // qué cambiamos → qué arregló
  dash.draw('tabla-cambios', (el) => {
    const d = dash.data('cambios');
    clear(el);
    if (d.status !== 'ok') return;
    const fmt = (u, v) => (v === '' || v == null ? '—' : u === 'MB' ? NF(2).format(num(v)) + ' MB' : unitFmt(u, v));
    let prev = null;
    d.data.forEach((r) => {
      const tr = document.createElement('tr'); tr.dataset.key = r.orden;
      const same = r.cambio === prev; prev = r.cambio;
      const c0 = document.createElement('td'); c0.textContent = same ? '' : r.cambio; c0.className = 'chg';
      const c1 = document.createElement('td'); c1.textContent = r.efecto; c1.className = 'eff';
      const c2 = document.createElement('td'); c2.textContent = r.indicador; c2.className = 'ind';
      const c3 = document.createElement('td'); c3.textContent = fmt(r.unidad, r.antes);
      const c4 = document.createElement('td'); c4.textContent = fmt(r.unidad, r.ahora); c4.className = 'now';
      tr.append(c0, c1, c2, c3, c4);
      if (same) tr.classList.add('cont');
      el.append(tr);
    });
  });

  // ---------- rampa
  dash.draw('rampa', (el) => {
    const d = dash.data('rampa');
    if (d.status !== 'ok') return placeholder(el, d);
    const rows = d.data.map((r) => ({ t: +r.minuto, u: +r.usuarios, rps: +r.peticiones_s, p50: +r.p50_ms, p95: +r.p95_ms, e: +r.errores_pct }));
    const m = { t: 14, r: 52, b: 34, l: 56 };
    const { svg, tip, w, h } = svgFor(el, 420);
    const x = d3.scaleLinear([0, d3.max(rows, (r) => r.t)], [m.l, w - m.r]);
    const y = d3.scaleLinear([0, d3.max(rows, (r) => r.p95) * 1.08], [h - m.b, m.t]).nice();
    const yu = d3.scaleLinear([0, 550], [h - m.b, m.t]);
    axisStyle(svg.append('g').attr('transform', `translate(0,${h - m.b})`).call(d3.axisBottom(x).ticks(Math.max(3, Math.floor(w / 90))).tickFormat((v) => v + ' min')));
    axisStyle(svg.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6).tickFormat(msTick).tickSize(-(w - m.l - m.r))));
    axisStyle(svg.append('g').attr('transform', `translate(${w - m.r},0)`).call(d3.axisRight(yu).tickValues([0, 100, 200, 300, 400, 500]).tickSize(0)));
    svg.append('path').datum(rows).attr('d', d3.area().x((r) => x(r.t)).y0(yu(0)).y1((r) => yu(r.u)).curve(d3.curveStepAfter))
      .style('fill', 'var(--cds-chart-muted)').attr('opacity', 0.28);
    [['p50', 0], ['p95', 1]].forEach(([k, i]) => svg.append('path').datum(rows)
      .attr('d', d3.line().x((r) => x(r.t)).y((r) => y(r[k]))).attr('fill', 'none').style('stroke', C()[i])
      .attr('stroke-width', 2).attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round'));
    const dot = svg.append('circle').attr('r', 4).style('fill', C()[1]).style('display', 'none');
    svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', w - m.l - m.r).attr('height', h - m.t - m.b).attr('fill', 'transparent')
      .on('mousemove', (ev) => {
        const [px] = d3.pointer(ev); const t = x.invert(px);
        const r = rows[d3.minIndex(rows, (q) => Math.abs(q.t - t))];
        dot.style('display', null).attr('cx', x(r.t)).attr('cy', y(r.p95));
        const [ex, ey] = d3.pointer(ev, el);
        showTip(tip, el, ex, ey, `Minuto ${NF(1).format(r.t)}`, [
          { t: `Usuarios: ${FMT.int(r.u)}` }, { t: `Peticiones/s: ${FMT.dec1(r.rps)}` },
          { c: C()[0], t: `Mediana: ${fmtMs(r.p50)}` }, { c: C()[1], t: `p95: ${fmtMs(r.p95)}` }, { t: `Fallos: ${FMT.pct2(r.e)}` }]);
      })
      .on('mouseleave', () => { hideTip(tip); dot.style('display', 'none'); });
  });

  // ---------- tablas genéricas
  function fillTable(el, id, cols, keyOf, filter) {
    const d = dash.data(id); clear(el);
    if (d.status !== 'ok') return;
    d.data.filter(filter || (() => true)).forEach((r) => {
      const tr = document.createElement('tr'); tr.dataset.key = keyOf(r);
      cols.forEach(([f, fm]) => { const td = document.createElement('td'); td.textContent = fm ? fm(r[f]) : r[f]; tr.append(td); });
      el.append(tr);
    });
  }
  const enc = (...p) => p.map((x) => encodeURIComponent(x)).join(',');
  dash.draw('tabla-escalones', (el) => fillTable(el, 'escalones',
    [['usuarios', FMT.int], ['peticiones_s', FMT.dec1], ['p50_ms', fmtMs], ['p95_ms', fmtMs], ['p99_ms', fmtMs], ['check_domain_p95_ms', fmtMs], ['errores_pct', FMT.pct2]], (r) => r.usuarios));
  dash.draw('tabla-endpoints', (el) => fillTable(el, 'endpoints_mezcla',
    [['nombre'], ['grupo'], ['peticiones', FMT.int], ['p50_ms', fmtMs], ['p95_ms', fmtMs], ['p99_ms', fmtMs], ['max_ms', fmtMs], ['fallos_pct', FMT.pct2]],
    (r) => r.endpoint, (r) => !state.grupo || r.grupo === state.grupo));
  dash.draw('tabla-api', (el) => fillTable(el, 'api_planes',
    [['plan'], ['tipo'], ['peticiones', FMT.int], ['p50_ms', fmtMs], ['p95_ms', fmtMs], ['fallos_pct', FMT.pct2]], (r) => enc(r.plan, r.tipo)));
  dash.draw('tabla-errores', (el) => fillTable(el, 'errores',
    [['ejecucion'], ['endpoint'], ['estado', (v) => (String(v) === '0' ? '0 (conexión)' : v)], ['peticiones', FMT.int]], (r) => enc(r.ejecucion, r.endpoint, r.estado)));

  // ---------- endpoints (rango mediana→p95, punto p99)
  dash.draw('endpoints', (el) => {
    const d = dash.data('endpoints_mezcla');
    if (d.status !== 'ok') return placeholder(el, d);
    const rows = d.data.filter((r) => !state.grupo || r.grupo === state.grupo)
      .map((r) => ({ ...r, a: +r.p50_ms, b: +r.p95_ms, c: +r.p99_ms })).sort((p, q) => q.b - p.b);
    const rowH = 24, m = { t: 6, r: 16, b: 30 };
    const { svg, tip, w } = svgFor(el, m.t + rows.length * rowH + m.b);
    const meas = svg.append('g');
    let lw = 0;
    rows.forEach((r) => { const t = meas.append('text').text(r.nombre); lw = Math.max(lw, t.node().getComputedTextLength()); });
    meas.remove();
    const l = Math.min(lw + 12, w * 0.45);
    const x = d3.scaleLog([100, Math.max(10000, d3.max(rows, (r) => r.c) * 1.3)], [l, w - m.r]);
    const y = d3.scaleBand(rows.map((r) => r.endpoint), [m.t, m.t + rows.length * rowH]).padding(0.35);
    axisStyle(svg.append('g').attr('transform', `translate(0,${m.t + rows.length * rowH})`)
      .call(d3.axisBottom(x).tickValues([100, 300, 1000, 3000, 10000, 30000]).tickFormat(msTick).tickSize(-(rows.length * rowH))));
    rows.forEach((r) => {
      const g = svg.append('g'), yy = y(r.endpoint);
      g.append('text').attr('class', 'lab').attr('x', l - 8).attr('y', yy + y.bandwidth() / 2).attr('dy', '0.35em').attr('text-anchor', 'end').text(r.nombre);
      g.append('rect').attr('x', x(r.a)).attr('width', Math.max(3, x(r.b) - x(r.a))).attr('y', yy).attr('height', y.bandwidth()).attr('rx', 3).style('fill', C()[0]);
      g.append('circle').attr('cx', x(r.c)).attr('cy', yy + y.bandwidth() / 2).attr('r', 3.5).style('fill', C()[1]);
      g.append('rect').attr('x', 0).attr('y', yy - 4).attr('width', w).attr('height', rowH).attr('fill', 'transparent')
        .on('mousemove', (ev) => { const [px, py] = d3.pointer(ev, el); showTip(tip, el, px, py, r.nombre, [
          { t: `${r.grupo} · ${FMT.int(r.peticiones)} peticiones` }, { c: C()[0], t: `Mediana: ${fmtMs(r.a)} · p95: ${fmtMs(r.b)}` },
          { c: C()[1], t: `p99: ${fmtMs(r.c)}` }, { t: `Fallos: ${FMT.pct2(r.fallos_pct)}` }]); })
        .on('mouseleave', () => hideTip(tip));
    });
  });

  // ---------- serie de la mezcla (p95 por minuto) y peticiones/s
  function lineChart(el, rows, keys, opts) {
    const m = { t: 12, r: 16, b: 32, l: 56 };
    const { svg, tip, w, h } = svgFor(el, opts.h || 300);
    const x = d3.scaleLinear(d3.extent(rows, (r) => r.x), [m.l, w - m.r]);
    const ymax = d3.max(rows, (r) => d3.max(keys, (k) => r[k[0]]));
    const y = d3.scaleLinear([opts.ymin || 0, ymax * 1.1], [h - m.b, m.t]).nice();
    axisStyle(svg.append('g').attr('transform', `translate(0,${h - m.b})`).call(d3.axisBottom(x).ticks(Math.max(3, Math.floor(w / 90))).tickFormat((v) => NF(0).format(v) + ' min')));
    axisStyle(svg.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(opts.yfmt).tickSize(-(w - m.l - m.r))));
    keys.forEach(([k, , ci]) => svg.append('path').datum(rows.filter((r) => isFinite(r[k])))
      .attr('d', d3.line().x((r) => x(r.x)).y((r) => y(r[k]))).attr('fill', 'none').style('stroke', C()[ci])
      .attr('stroke-width', 2).attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round'));
    const rule = svg.append('line').attr('y1', m.t).attr('y2', h - m.b).style('stroke', 'var(--cds-chart-reference)').style('display', 'none');
    svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', w - m.l - m.r).attr('height', h - m.t - m.b).attr('fill', 'transparent')
      .on('mousemove', (ev) => {
        const [px] = d3.pointer(ev); const t = x.invert(px);
        const xs = [...new Set(rows.map((r) => r.x))];
        const xv = xs[d3.minIndex(xs, (q) => Math.abs(q - t))];
        rule.style('display', null).attr('x1', x(xv)).attr('x2', x(xv));
        const [ex, ey] = d3.pointer(ev, el);
        showTip(tip, el, ex, ey, opts.head(xv), keys.map(([k, name, ci]) => {
          const r = rows.find((q) => q.x === xv && isFinite(q[k]));
          return { c: keys.length > 1 ? C()[ci] : null, t: `${name}: ${r ? opts.vfmt(r[k]) : '—'}` };
        }));
      })
      .on('mouseleave', () => { hideTip(tip); rule.style('display', 'none'); });
  }
  dash.draw('serie', (el) => {
    const d = dash.data('serie_run1');
    if (d.status !== 'ok') return placeholder(el, d);
    const rows = d.data.map((r) => ({ x: +r.minuto, a: num(r.p95_pronostico_ms), b: num(r.p95_video_ms), c: num(r.p95_api_sin_cache_ms) }));
    lineChart(el, rows, [['a', 'Pronóstico de la app', 0], ['b', 'Descarga de vídeo', 1], ['c', 'API sin caché', 2]],
      { yfmt: msTick, vfmt: fmtMs, head: (v) => `Minuto ${v}` });
  });
  dash.draw('rps', (el) => {
    const d = dash.data('serie_run1');
    if (d.status !== 'ok') return placeholder(el, d);
    const rows = d.data.map((r) => ({ x: +r.minuto, v: +r.peticiones_s, u: +r.usuarios_app }));
    const m = { t: 12, r: 16, b: 32, l: 44 };
    const { svg, tip, w, h } = svgFor(el, 300);
    const x = d3.scaleBand(rows.map((r) => r.x), [m.l, w - m.r]).padding(0.25);
    const y = d3.scaleLinear([0, d3.max(rows, (r) => r.v) * 1.1], [h - m.b, m.t]).nice();
    axisStyle(svg.append('g').attr('transform', `translate(0,${h - m.b})`).call(d3.axisBottom(x).tickValues(rows.map((r) => r.x).filter((v) => v % 5 === 0)).tickFormat((v) => v + ' min')));
    axisStyle(svg.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickSize(-(w - m.l - m.r))));
    svg.selectAll('rect.b').data(rows).join('rect').attr('class', 'b').attr('x', (r) => x(r.x)).attr('width', x.bandwidth())
      .attr('y', (r) => y(r.v)).attr('height', (r) => y(0) - y(r.v)).attr('rx', 2).style('fill', C()[0])
      .on('mousemove', (ev, r) => { const [px, py] = d3.pointer(ev, el); showTip(tip, el, px, py, `Minuto ${r.x}`, [{ t: `${FMT.dec1(r.v)} pet/s` }, { t: `${FMT.int(r.u)} usuarios de la app` }]); })
      .on('mouseleave', () => hideTip(tip));
  });

  // ---------- API por plan
  dash.draw('api', (el) => {
    const d = dash.data('api_planes');
    if (d.status !== 'ok') return placeholder(el, d);
    const plans = [...new Set(d.data.map((r) => r.plan))];
    const m = { t: 8, r: 16, b: 30, l: 64 };
    const { svg, tip, w, h } = svgFor(el, 230);
    const y = d3.scaleBand(plans, [m.t, h - m.b]).padding(0.25);
    const ys = d3.scaleBand(['Con caché', 'Sin caché'], [0, y.bandwidth()]).padding(0.1);
    const x = d3.scaleLinear([0, d3.max(d.data, (r) => +r.p95_ms) * 1.15], [m.l, w - m.r]).nice();
    axisStyle(svg.append('g').attr('transform', `translate(0,${h - m.b})`).call(d3.axisBottom(x).ticks(5).tickFormat(msTick).tickSize(-(h - m.t - m.b))));
    plans.forEach((p) => svg.append('text').attr('class', 'lab').attr('x', m.l - 8).attr('y', y(p) + y.bandwidth() / 2).attr('dy', '.35em').attr('text-anchor', 'end').text(p));
    svg.selectAll('rect.b').data(d.data).join('rect').attr('class', 'b').attr('x', m.l).attr('y', (r) => y(r.plan) + ys(r.tipo))
      .attr('height', ys.bandwidth()).attr('width', (r) => x(+r.p95_ms) - m.l).attr('rx', 3).style('fill', (r) => (r.tipo === 'Con caché' ? C()[0] : C()[1]))
      .on('mousemove', (ev, r) => { const [px, py] = d3.pointer(ev, el); showTip(tip, el, px, py, `${r.plan} · ${r.tipo}`, [{ t: `Mediana: ${fmtMs(r.p50_ms)}` }, { t: `p95: ${fmtMs(r.p95_ms)}` }, { t: `${FMT.int(r.peticiones)} peticiones · fallos ${FMT.pct2(r.fallos_pct)}` }]); })
      .on('mouseleave', () => hideTip(tip));
  });

  // ---------- recursos del VPS
  dash.draw('recursos', (el) => {
    const d = dash.data('recursos');
    if (d.status !== 'ok') return placeholder(el, d);
    const k = state.rec;
    const names = { cpu_pct: 'CPU total', svc_cpu_pct: 'CPU del servicio', mem_avail_mb: 'Memoria disponible', eld_p99_ms: 'Bucle de eventos p99', health_ms: '/api/health' };
    const vf = k === 'mem_avail_mb' ? FMT.mb : k.endsWith('_ms') ? FMT.dec1ms : FMT.pct1;
    const rows = d.data.map((r) => ({ run: r.ejecucion, x: +r.minuto, v: num(r[k]) })).filter((r) => r.x >= 0 && r.x <= 28 && isFinite(r.v));
    const m = { t: 12, r: 16, b: 32, l: 60 };
    const { svg, tip, w, h } = svgFor(el, 300);
    const x = d3.scaleLinear([0, 28], [m.l, w - m.r]);
    const y = d3.scaleLinear([0, d3.max(rows, (r) => r.v) * 1.08], [h - m.b, m.t]).nice();
    axisStyle(svg.append('g').attr('transform', `translate(0,${h - m.b})`).call(d3.axisBottom(x).ticks(Math.max(3, Math.floor(w / 90))).tickFormat((v) => v + ' min')));
    axisStyle(svg.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat((v) => vf(v)).tickSize(-(w - m.l - m.r))));
    const runs = ['Mezcla', 'Rampa'];
    runs.forEach((run, i) => svg.append('path').datum(rows.filter((r) => r.run === run))
      .attr('d', d3.line().x((r) => x(r.x)).y((r) => y(r.v))).attr('fill', 'none').style('stroke', C()[i])
      .attr('stroke-width', 1.5).attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round').attr('opacity', 0.9));
    svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', w - m.l - m.r).attr('height', h - m.t - m.b).attr('fill', 'transparent')
      .on('mousemove', (ev) => {
        const [px] = d3.pointer(ev); const t = x.invert(px);
        const [ex, ey] = d3.pointer(ev, el);
        showTip(tip, el, ex, ey, `${names[k]} · minuto ${NF(1).format(t)}`, runs.map((run, i) => {
          const rr = rows.filter((r) => r.run === run); const r = rr[d3.minIndex(rr, (q) => Math.abs(q.x - t))];
          return { c: C()[i], t: `${run === 'Mezcla' ? 'Uso realista' : 'Rampa'}: ${r ? vf(r.v) : '—'}` };
        }));
      })
      .on('mouseleave', () => hideTip(tip));
  });

  // ---------- sonda Cuba vs Panamá
  dash.draw('sonda', (el) => {
    const d = dash.data('sonda');
    if (d.status !== 'ok') return placeholder(el, d);
    const rows = d.data.map((r) => ({ ...r, p: num(r.panama_p50_ms), c: num(r.cuba_p50_ms) }));
    const rowH = 30, m = { t: 6, r: 16, b: 30 };
    const { svg, tip, w } = svgFor(el, m.t + rows.length * rowH + m.b);
    const meas = svg.append('g'); let lw = 0;
    rows.forEach((r) => { const t = meas.append('text').text(r.nombre); lw = Math.max(lw, t.node().getComputedTextLength()); });
    meas.remove();
    const l = Math.min(lw + 12, w * 0.45);
    const x = d3.scaleLog([100, 10000], [l, w - m.r]);
    axisStyle(svg.append('g').attr('transform', `translate(0,${m.t + rows.length * rowH})`).call(d3.axisBottom(x).tickValues([100, 300, 1000, 3000, 10000]).tickFormat(msTick).tickSize(-(rows.length * rowH))));
    rows.forEach((r, i) => {
      const cy = m.t + i * rowH + rowH / 2, g = svg.append('g');
      g.append('text').attr('class', 'lab').attr('x', l - 8).attr('y', cy).attr('dy', '.35em').attr('text-anchor', 'end').text(r.nombre);
      if (isFinite(r.p)) g.append('line').attr('x1', x(r.p)).attr('x2', x(r.c)).attr('y1', cy).attr('y2', cy).style('stroke', 'var(--cds-chart-grid)').attr('stroke-width', 4).attr('stroke-linecap', 'round');
      if (isFinite(r.p)) g.append('circle').attr('cx', x(r.p)).attr('cy', cy).attr('r', 5).style('fill', C()[0]);
      g.append('circle').attr('cx', x(r.c)).attr('cy', cy).attr('r', 5).style('fill', C()[1]);
      g.append('rect').attr('x', 0).attr('y', cy - rowH / 2).attr('width', w).attr('height', rowH).attr('fill', 'transparent')
        .on('mousemove', (ev) => { const [px, py] = d3.pointer(ev, el); showTip(tip, el, px, py, r.nombre, [
          { c: C()[0], t: `Panamá: mediana ${fmtMs(r.p)} · p95 ${fmtMs(r.panama_p95_ms)}` }, { c: C()[1], t: `Cuba: mediana ${fmtMs(r.c)} · p95 ${fmtMs(r.cuba_p95_ms)}` }]); })
        .on('mouseleave', () => hideTip(tip));
    });
  });

  // ---------- vídeos antes/ahora
  dash.draw('videos', (el) => {
    const d = dash.data('videos');
    if (d.status !== 'ok') return placeholder(el, d);
    const rows = d.data.map((r) => ({ ...r, a: +r.antes_mb, b: +r.ahora_mb }));
    const m = { t: 8, r: 16, b: 30 };
    const { svg, tip, w, h } = svgFor(el, 230);
    const meas = svg.append('g'); let lw = 0;
    rows.forEach((r) => { const t = meas.append('text').text(r.nombre); lw = Math.max(lw, t.node().getComputedTextLength()); });
    meas.remove();
    const l = Math.min(lw + 12, w * 0.45);
    const y = d3.scaleBand(rows.map((r) => r.video), [m.t, h - m.b]).padding(0.25);
    const ys = d3.scaleBand(['a', 'b'], [0, y.bandwidth()]).padding(0.1);
    const x = d3.scaleLinear([0, d3.max(rows, (r) => r.a) * 1.1], [l, w - m.r]).nice();
    axisStyle(svg.append('g').attr('transform', `translate(0,${h - m.b})`).call(d3.axisBottom(x).ticks(5).tickFormat((v) => NF(1).format(v) + ' MB').tickSize(-(h - m.t - m.b))));
    rows.forEach((r) => {
      const g = svg.append('g'), yy = y(r.video);
      g.append('text').attr('class', 'lab').attr('x', l - 8).attr('y', yy + y.bandwidth() / 2).attr('dy', '.35em').attr('text-anchor', 'end').text(r.nombre);
      g.append('rect').attr('x', l).attr('y', yy + ys('a')).attr('height', ys.bandwidth()).attr('width', x(r.a) - l).attr('rx', 3).style('fill', 'var(--cds-chart-muted)');
      g.append('rect').attr('x', l).attr('y', yy + ys('b')).attr('height', ys.bandwidth()).attr('width', x(r.b) - l).attr('rx', 3).style('fill', C()[0]);
      g.append('rect').attr('x', 0).attr('y', yy).attr('width', w).attr('height', y.bandwidth()).attr('fill', 'transparent')
        .on('mousemove', (ev) => { const [px, py] = d3.pointer(ev, el); showTip(tip, el, px, py, r.nombre, [
          { t: `Original: ${FMT.dec1mb(r.a)}` }, { c: C()[0], t: `Ahora: ${FMT.dec1mb(r.b)} (−${NF(0).format((1 - r.b / r.a) * 100)} %)` }]); })
        .on('mouseleave', () => hideTip(tip));
    });
  });
})();
