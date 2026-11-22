// strona-wzoru.js — rysuje przykładową stronę wzoru (dokument użytkownika, zawsze biały; tokeny kolor.wzor) w <svg class="strona">.
// Atrybuty: data-znacznik="<rząd schematu>" (pas znacznika), data-kier="up|down", data-zakr="1" (zakreślenie rozmiaru M), data-pioro="1" (odręczna notatka),
// data-notatka="<tekst>" (notatka rzędu przy znaczniku), data-krawedz="1" (znacznik na krawędzi strony). Dane: [PRZYKŁAD].
(function () {
  const ns = 'http://www.w3.org/2000/svg';
  const el = (n, a, t) => { const e = document.createElementNS(ns, n); for (const k in a) e.setAttribute(k, a[k]); if (t) e.textContent = t; return e; };
  const kol = 20, rzedy = 16, x0 = 70, y0 = 430, k = 24; // schemat: rząd 1 na dole
  window.stronaWzoru = function (svg) {
    svg.setAttribute('viewBox', '0 0 600 820');
    svg.setAttribute('role', 'img');
    const g = el('g', { fill: '#26282C', 'font-family': 'Source Sans 3, sans-serif' });
    g.append(el('text', { x: 40, y: 64, 'font-size': 30, 'font-weight': 700 }, 'Harbor Sweater'));
    g.append(el('text', { x: 40, y: 94, 'font-size': 15, fill: '#5E626A' }, 'Sleeves · page 3 of 6'));
    [128, 150, 172].forEach((y, i) => g.append(el('rect', { x: 40, y, width: [520, 480, 300][i], height: 9, rx: 3, fill: '#C9CBD0' })));
    // wartości rozmiaru M w <tspan class="m"> — zakreślenie liczy ich prostokąty (getBBox), nie zgaduje położenia
    const linia = (y, czesci) => { const tx = el('text', { x: 40, y, 'font-size': 17 }); czesci.forEach((c, i) => tx.append(i % 2 ? el('tspan', { class: 'm' }, c) : document.createTextNode(c))); g.append(tx); };
    linia(222, ['Sizes: S (', 'M', ', L, XL)']);
    linia(250, ['Cast on 48 (', '52', ', 56, 60) sts.']);
    linia(278, ['Work chart A, then dec every 6 (', '6', ', 4, 4) rows.']);
    [306, 328, 350, 372].forEach((y, i) => g.append(el('rect', { x: 40, y, width: [500, 520, 440, 360][i], height: 9, rx: 3, fill: '#C9CBD0' })));
    g.append(el('text', { x: 40, y: 410, 'font-size': 15, 'font-weight': 700 }, 'Chart A'));
    for (let r = 0; r < rzedy; r++) for (let c = 0; c < kol; c++) {
      const x = x0 + c * k, y = y0 + (rzedy - 1 - r) * k;
      g.append(el('rect', { x, y, width: k, height: k, fill: 'none', stroke: '#9A9DA3', 'stroke-width': 1 }));
      const m = (r * 7 + c * 3) % 11;
      if ((r % 4 === 1 && c % 4 === 2) || (r % 4 === 3 && c % 4 === 0)) g.append(el('circle', { cx: x + k / 2, cy: y + k / 2, r: 5, fill: 'none', stroke: '#26282C', 'stroke-width': 2 }));
      else if (m === 4 && r % 2 === 0) g.append(el('path', { d: `M${x + 5} ${y + k - 5} L${x + k - 5} ${y + 5}`, stroke: '#26282C', 'stroke-width': 2 }));
    }
    for (let r = 0; r < rzedy; r++) g.append(el('text', { x: x0 + kol * k + 8, y: y0 + (rzedy - 1 - r) * k + 17, 'font-size': 13, fill: '#5E626A' }, String(r + 1)));
    svg.append(g);
    if (svg.dataset.zakr) {
      // zakreślenie rozmiaru M: pas zakreślacza z mnożeniem; liczone po załadowaniu kroju (inaczej getBBox mierzy krój zastępczy)
      const z = el('g', { style: 'mix-blend-mode:multiply' });
      svg.append(z);
      const rysuj = () => { z.replaceChildren(); svg.querySelectorAll('tspan.m').forEach((s) => { const b = s.getBBox(); z.append(el('rect', { x: b.x - 3, y: b.y + 1, width: b.width + 6, height: b.height - 1, rx: 3, fill: svg.dataset.zakrKolor || '#F6E04A', opacity: .85 })); }); };
      rysuj(); document.fonts.ready.then(rysuj);
    }
    if (svg.dataset.pioro) {
      svg.append(el('path', { d: 'M420 214 q 20 -14 40 0 t 40 0 M430 236 l 60 -4', stroke: '#2B5FA8', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }));
      svg.append(el('text', { x: 418, y: 200, 'font-size': 18, fill: '#2B5FA8', 'font-family': 'cursive' }, 'my size'));
    }
    const zn = +svg.dataset.znacznik;
    if (zn) {
      const kraw = !!svg.dataset.krawedz;
      const y = kraw ? y0 : y0 + (rzedy - zn) * k;
      const m = el('g', {});
      m.append(el('rect', { x: 30, y, width: 560, height: k, fill: '#26282C', 'fill-opacity': .08 }));
      m.append(el('line', { x1: 30, x2: 590, y1: y, y2: y, stroke: '#26282C', 'stroke-width': 3, 'stroke-dasharray': kraw ? '10 6' : '' }));
      m.append(el('line', { x1: 30, x2: 590, y1: y + k, y2: y + k, stroke: '#26282C', 'stroke-width': 3 }));
      const etyk = svg.dataset.etykieta || `Row ${zn} ${svg.dataset.kier === 'down' ? '↓' : '↑'}`;
      const w = 12 + etyk.length * 9;
      m.append(el('rect', { x: 586 - w, y: y - 26, width: w, height: 26, rx: 5, fill: '#26282C' }));
      m.append(el('text', { x: 586 - w + 8, y: y - 8, 'font-size': 16, 'font-weight': 700, fill: '#FCFCFA', 'font-family': 'Libre Franklin, sans-serif' }, etyk));
      if (svg.dataset.notatka) {
        m.append(el('rect', { x: 30, y: y + k + 6, width: 300, height: 30, rx: 6, fill: '#26282C' }));
        m.append(el('text', { x: 40, y: y + k + 26, 'font-size': 15, fill: '#FCFCFA' }, '✎ ' + svg.dataset.notatka));
      }
      svg.append(m);
    }
  };
  document.querySelectorAll('svg.strona').forEach((s) => window.stronaWzoru(s));
})();
