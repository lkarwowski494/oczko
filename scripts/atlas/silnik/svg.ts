// Zapis rysunku do SVG (strona statyczna, podgląd PNG) i strażnik liter (P-192). W aplikacji ten sam model rysuje react-native-svg (ADR-0024).
// SVG nie zawiera tekstu: tylko <svg>, <rect>, <g>, <path>; klasy ról (a-t, a-o, a-z, a-n) pozwalają stronie podmienić kolory motywu ciemnego.
import { odleglosc, probkuj, z2, type Bez, type P } from './geometria.ts';
import type { Rysunek } from './typy.ts';

/** Role kolorów rysunku; wartości wyłącznie z tokenów 04 (docs/design/tokeny.json, system Dzianina: kolory.<motyw>.rysunek*, M3-S3-02). */
export interface Paleta {
  tlo: string; // rysunekTlo
  nitka: string; // rysunekNitka
  wyroznienie: string; // rysunekWyroznienie (zakreślacz)
  drut: string; // rysunekDrut: drut, strzałka (narzędzie i ruch odróżnione od nitki)
}

/** Paleta z tokenów Dzianiny: kolory.<motyw>.{rysunekTlo, rysunekNitka, rysunekWyroznienie, rysunekDrut} (wyróżnienie to zakreślacz pod nitką). */
export function paletaZTokenow(tokeny: { kolory: Record<string, Record<string, string>> }, motyw: 'jasny' | 'ciemny'): Paleta {
  const k = tokeny.kolory[motyw];
  return { tlo: k.rysunekTlo, nitka: k.rysunekNitka, wyroznienie: k.rysunekWyroznienie, drut: k.rysunekDrut };
}

/** Glify cyfr własne (P-192 (4)): łamane na siatce 2 × 4, bez fontu i bez <text>. */
export const GLIFY_CYFR: Record<string, [number, number][][]> = {
  '0': [[[0, 0], [2, 0], [2, 4], [0, 4], [0, 0]]],
  '1': [[[0.5, 1], [1, 0], [1, 4]], [[0.4, 4], [1.6, 4]]],
  '2': [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 4], [2, 4]]],
  '3': [[[0, 0], [2, 0], [2, 4], [0, 4]], [[0.6, 2], [2, 2]]],
  '4': [[[0, 0], [0, 2], [2, 2]], [[2, 0], [2, 4]]],
  '5': [[[2, 0], [0, 0], [0, 2], [2, 2], [2, 4], [0, 4]]],
  '6': [[[2, 0], [0, 0], [0, 4], [2, 4], [2, 2], [0, 2]]],
  '7': [[[0, 0], [2, 0], [1, 4]]],
  '8': [[[0, 0], [2, 0], [2, 4], [0, 4], [0, 0]], [[0, 2], [2, 2]]],
  '9': [[[2, 2], [0, 2], [0, 0], [2, 0], [2, 4], [0, 4]]],
};

/** Numer kroku: kółko i cyfry z glifów, lewy górny róg (x, y), wysokość cyfry h. */
export function numerKroku(n: number, x: number, y: number, h: number, paleta: Paleta): string {
  const cyfry = String(n).split('');
  const s = h / 4, szer = cyfry.length * 3 * s - s;
  const r = Math.max(szer, h) / 2 + 2.2;
  const cx = x + r, cy = y + r;
  const linie = cyfry.flatMap((c, i) => GLIFY_CYFR[c].map((l) => l.map(([gx, gy], j) => `${j ? 'L' : 'M'}${z2(cx - szer / 2 + i * 3 * s + gx * s)} ${z2(cy - h / 2 + gy * s)}`).join('')));
  return `<circle class="a-k" cx="${z2(cx)}" cy="${z2(cy)}" r="${z2(r)}" fill="${paleta.tlo}" stroke="${paleta.nitka}" stroke-width="1"/>` +
    `<path class="a-k" d="${linie.join('')}" stroke="${paleta.nitka}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/** Grot (trójkąt) na końcu odcinka a→b. */
function grot(a: P, b: P, dl: number, szer: number): string {
  const d = odleglosc(a, b) || 1, ux = (b.x - a.x) / d, uy = (b.y - a.y) / d;
  const p = [b, { x: b.x - ux * dl - uy * szer, y: b.y - uy * dl + ux * szer }, { x: b.x - ux * dl + uy * szer, y: b.y - uy * dl - ux * szer }];
  return p.map((q) => `${z2(q.x)},${z2(q.y)}`).join(' ');
}

export const KRESKA = { nitka: 2.6, obwodka: 4.6, wyroznienie: 7.5, promienObwodki: 4.5, promienMin: 3.0, drut: 3.6, strzalka: 1.3 } as const;

/** Odległość punktu od odcinka. */
export function odlegloscOdOdcinka(p: P, a: P, b: P): number {
  const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy;
  const t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}
export const kryje = (lamana: P[], p: P): boolean => lamana.some((q, i) => i > 0 && odlegloscOdOdcinka(p, lamana[i - 1], q) < KRESKA.obwodka / 2);

/** Łatki przeplotu: dla każdego skrzyżowania odcinek części „nad” w promieniu skrzyżowania, rysowany po warstwie bazowej
 *  (obwódka w kolorze tła + kreska). Kolejność łatek: łatka skrzyżowania X po każdej łatce innej części, która zasłania punkt X
 *  (sortowanie topologiczne; przy remisie kolejność skrzyżowań). Cykl = skrzyżowania za blisko siebie → `cykl` niepusty. */
export function latki(rys: Rysunek): { lista: { czesc: string; punkt: P; lamana: P[] }[]; cykl: string[] } {
  const czesc = new Map(rys.czesci.map((c) => [c.id, c]));
  const lam = new Map<string, P[]>();
  const surowe: { czesc: string; punkt: P; lamana: P[] }[] = [];
  for (const s of rys.skrzyzowania) {
    const c = czesc.get(s.nad);
    if (!c) continue;
    if (!lam.has(c.id)) lam.set(c.id, probkuj(c.segmenty, 32));
    // promień łatki: połowa odstępu do najbliższego innego skrzyżowania, w granicach [promienMin, promienObwodki]
    const najblizej = Math.min(Infinity, ...rys.skrzyzowania.filter((x) => x !== s).map((x) => odleglosc(x.punkt, s.punkt)));
    const r = Math.max(KRESKA.promienMin, Math.min(KRESKA.promienObwodki, najblizej / 2));
    const l = lam.get(c.id)!.filter((q) => odleglosc(q, s.punkt) <= r);
    if (l.length > 1) surowe.push({ czesc: c.id, punkt: s.punkt, lamana: l });
  }
  const n = surowe.length, po: number[][] = surowe.map(() => []), wej = surowe.map(() => 0);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (i === j || surowe[i].czesc === surowe[j].czesc) continue;
    if (kryje(surowe[j].lamana, surowe[i].punkt)) { po[j].push(i); wej[i]++; } // j zasłania punkt i → i po j
  }
  const lista: typeof surowe = [], gotowe = surowe.map((_, i) => i).filter((i) => wej[i] === 0);
  while (gotowe.length) {
    gotowe.sort((a, b) => a - b);
    const i = gotowe.shift()!;
    lista.push(surowe[i]);
    for (const k of po[i]) if (--wej[k] === 0) gotowe.push(k);
  }
  const cykl = surowe.filter((_, i) => wej[i] > 0).map((l) => `${l.czesc}@(${l.punkt.x.toFixed(1)}, ${l.punkt.y.toFixed(1)})`);
  return { lista, cykl };
}

const dLamanej = (l: P[]): string => `M${z2(l[0].x)} ${z2(l[0].y)}` + l.slice(1).map((q) => `L${z2(q.x)} ${z2(q.y)}`).join('');

const d = (segmenty: Bez[]): string =>
  `M${z2(segmenty[0][0].x)} ${z2(segmenty[0][0].y)}` +
  segmenty.map((b) => `C${z2(b[1].x)} ${z2(b[1].y)} ${z2(b[2].x)} ${z2(b[2].y)} ${z2(b[3].x)} ${z2(b[3].y)}`).join('');

/** SVG rysunku: wyróżnienie pod spodem, warstwa bazowa (wszystkie części), łatki przeplotu (obwódka w kolorze tła + kreska części „nad”), strzałka, numer kroku. */
export function doSvg(rys: Rysunek, paleta: Paleta): string {
  const czesc = new Map(rys.czesci.map((c) => [c.id, c]));
  const wyr = new Set(rys.wyroznione);
  // wyróżnienie (zakreślacz) pod całym rysunkiem: nie przykrywa nitki żadnej części, także własnej pętli
  const el: string[] = rys.czesci
    .filter((c) => wyr.has(c.petla) && !c.rodzaj.startsWith('platyna'))
    .map((c) => `<path class="a-z" d="${d(c.segmenty)}" stroke="${paleta.wyroznienie}" stroke-width="${KRESKA.wyroznienie}" stroke-linecap="round"/>`);
  const kreska = (id: string, dd: string, obwodka = false): string[] => {
    const c = czesc.get(id)!;
    const o = obwodka ? [`<path class="a-o" d="${dd}" stroke="${paleta.tlo}" stroke-width="${c.rodzaj === 'drut' ? KRESKA.drut + 2 : KRESKA.obwodka}"/>`] : [];
    if (c.rodzaj === 'drut') return [...o, `<path class="a-d" d="${dd}" stroke="${paleta.drut}" stroke-width="${KRESKA.drut}" stroke-linecap="round"/>`];
    return [...o, `<path class="a-n" d="${dd}" stroke="${paleta.nitka}" stroke-width="${KRESKA.nitka}" stroke-linecap="round"/>`];
  };
  for (const id of rys.kolejnosc) {
    const c = czesc.get(id)!;
    if (c.rodzaj === 'drut') {
      const [ogon, , , gr] = c.segmenty[0];
      const dl = odleglosc(ogon, gr), ux = (gr.x - ogon.x) / dl, uy = (gr.y - ogon.y) / dl, g = 6;
      el.push(...kreska(id, `M${z2(ogon.x)} ${z2(ogon.y)}L${z2(gr.x - ux * g)} ${z2(gr.y - uy * g)}`));
      el.push(`<polygon class="a-d" points="${grot(ogon, gr, g, KRESKA.drut / 2)}" fill="${paleta.drut}"/>`);
      continue;
    }
    el.push(...kreska(id, d(c.segmenty)));
  }
  for (const l of latki(rys).lista) el.push(...kreska(l.czesc, dLamanej(l.lamana), true));
  if (rys.strzalka) {
    const { od, do: doo } = rys.strzalka;
    const dl = odleglosc(od, doo) || 1, nx = -(doo.y - od.y) / dl, ny = (doo.x - od.x) / dl, b = dl * 0.3;
    const k1 = { x: od.x + (doo.x - od.x) / 3 + nx * b, y: od.y + (doo.y - od.y) / 3 + ny * b }, k2 = { x: od.x + (2 * (doo.x - od.x)) / 3 + nx * b, y: od.y + (2 * (doo.y - od.y)) / 3 + ny * b };
    el.push(`<path class="a-s" d="M${z2(od.x)} ${z2(od.y)}C${z2(k1.x)} ${z2(k1.y)} ${z2(k2.x)} ${z2(k2.y)} ${z2(doo.x)} ${z2(doo.y)}" stroke="${paleta.drut}" stroke-width="${KRESKA.strzalka}" stroke-linecap="round"/>`);
    el.push(`<polygon class="a-s" points="${grot(k2, doo, 4, 2)}" fill="${paleta.drut}"/>`);
  }
  if (rys.numer !== null) el.push(numerKroku(rys.numer, 1.5, 1.5, 6, paleta));
  const w = z2(rys.szer), h = z2(rys.wys);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
    `<rect class="a-t" width="${w}" height="${h}" fill="${paleta.tlo}"/>` +
    `<g fill="none" stroke-linecap="butt" stroke-linejoin="round">${el.join('')}</g></svg>`
  );
}

// ---------- strażnik liter (P-192 (3)) ----------
// Biała lista: element, atrybut i postać wartości. Każdy tekst między znacznikami, <text>, <title>, <desc>, aria-label itp. oblewa.
const ELEMENTY = new Set(['svg', 'rect', 'g', 'path', 'circle', 'line', 'polyline', 'polygon']);
const ATRYBUTY: Record<string, RegExp> = {
  xmlns: /^http:\/\/www\.w3\.org\/2000\/svg$/,
  viewBox: /^[-\d. ]+$/,
  width: /^[\d.]+$/,
  height: /^[\d.]+$/,
  x: /^[-\d.]+$/, y: /^[-\d.]+$/, cx: /^[-\d.]+$/, cy: /^[-\d.]+$/, r: /^[\d.]+$/,
  x1: /^[-\d.]+$/, y1: /^[-\d.]+$/, x2: /^[-\d.]+$/, y2: /^[-\d.]+$/,
  points: /^[-\d., ]+$/,
  d: /^[MCLZmclz\d.\s,-]+$/, // tylko polecenia ścieżki M, C, L, Z (bez łuków A: zastrzeżenie dekodera iOS, rejestr E0)
  fill: /^(#[0-9A-Fa-f]{6}|none)$/,
  stroke: /^(#[0-9A-Fa-f]{6}|none)$/,
  'stroke-width': /^[\d.]+$/,
  'stroke-linecap': /^(butt|round)$/,
  'stroke-linejoin': /^(round|miter)$/,
  class: /^a-[toznsdk]$/, // role kolorów (tło, obwódka, zakreślacz, nitka, strzałka, drut, numer kroku), nie słowa
};

/** Lista naruszeń P-192 w SVG; pusta = bez liter i tekstu. */
export function straznikLiter(svg: string): string[] {
  const bledy: string[] = [];
  const bezZnacznikow = svg.replace(/<[^>]*>/g, '');
  if (bezZnacznikow.trim()) bledy.push(`tekst poza znacznikami: ${JSON.stringify(bezZnacznikow.trim().slice(0, 40))}`);
  for (const m of svg.matchAll(/<\/?\s*([A-Za-z][\w:-]*)([^>]*)>/g)) {
    const nazwa = m[1];
    if (!ELEMENTY.has(nazwa)) {
      bledy.push(`element spoza listy: <${nazwa}>`);
      continue;
    }
    const reszta = m[2].replace(/\/\s*$/, '');
    const atr = [...reszta.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)];
    const zostalo = reszta.replace(/([\w:-]+)\s*=\s*"([^"]*)"/g, '').trim();
    if (zostalo) bledy.push(`nieczytelny fragment w <${nazwa}>: ${zostalo.slice(0, 30)}`);
    for (const [, k, v] of atr) {
      const wz = ATRYBUTY[k];
      if (!wz) bledy.push(`atrybut spoza listy: ${k} w <${nazwa}>`);
      else if (!wz.test(v)) bledy.push(`wartość atrybutu ${k} poza wzorcem: ${JSON.stringify(v.slice(0, 30))}`);
    }
  }
  return bledy;
}
