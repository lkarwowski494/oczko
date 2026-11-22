// Geometria płaska atlasu (ADR-0022): punkty, krzywe Béziera 3. stopnia z łańcucha Catmulla-Roma, próbkowanie i przecięcia łamanych.
// Czysty TS bez zależności; ten sam kod liczy rysunek w aplikacji (react-native-svg, ADR-0024) i w generatorze strony.

export type P = { x: number; y: number };
/** Krzywa Béziera 3. stopnia: początek, dwa punkty kontrolne, koniec. */
export type Bez = [P, P, P, P];

const EPS = 1e-9;

/** Krzywe Béziera przechodzące przez punkty (Catmull-Rom jednostajny, napięcie 1/2); ciągłość położenia i stycznej w każdym węźle. */
export function catmullRom(pts: P[]): Bez[] {
  const out: Bez[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? pts[i + 1];
    out.push([
      p1,
      { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
      { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
      p2,
    ]);
  }
  return out;
}

export function punktBeziera(b: Bez, t: number): P {
  const u = 1 - t;
  const a = u * u * u, c = 3 * u * u * t, d = 3 * u * t * t, e = t * t * t;
  return { x: a * b[0].x + c * b[1].x + d * b[2].x + e * b[3].x, y: a * b[0].y + c * b[1].y + d * b[2].y + e * b[3].y };
}

/** Łamana przybliżająca ciąg krzywych (n odcinków na krzywą), bez powtórzonych węzłów. */
export function probkuj(segmenty: Bez[], n = 24): P[] {
  const out: P[] = [];
  segmenty.forEach((b, i) => {
    for (let k = i === 0 ? 0 : 1; k <= n; k++) out.push(punktBeziera(b, k / n));
  });
  return out;
}

/** Przecięcie właściwe dwóch odcinków (bez stykania końcami); null, gdy brak. */
export function przeciecieOdcinkow(a1: P, a2: P, b1: P, b2: P): P | null {
  const r = { x: a2.x - a1.x, y: a2.y - a1.y };
  const s = { x: b2.x - b1.x, y: b2.y - b1.y };
  const den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < EPS) return null;
  const qp = { x: b1.x - a1.x, y: b1.y - a1.y };
  const t = (qp.x * s.y - qp.y * s.x) / den;
  const u = (qp.x * r.y - qp.y * r.x) / den;
  if (t <= EPS || t > 1 - EPS || u <= EPS || u > 1 - EPS) return null;
  return { x: a1.x + t * r.x, y: a1.y + t * r.y };
}

export const odleglosc = (a: P, b: P): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Punkty przecięcia dwóch łamanych; pomija przecięcia bliżej niż `pomin` od podanych punktów (wspólne końce sąsiednich części). */
export function przeciecia(A: P[], B: P[], pomin: P[] = [], promien = 0.05): P[] {
  const out: P[] = [];
  for (let i = 0; i < A.length - 1; i++) {
    for (let j = 0; j < B.length - 1; j++) {
      const x = przeciecieOdcinkow(A[i], A[i + 1], B[j], B[j + 1]);
      if (!x) continue;
      if (pomin.some((p) => odleglosc(p, x) < promien)) continue;
      if (out.some((p) => odleglosc(p, x) < promien)) continue;
      out.push(x);
    }
  }
  return out;
}

/** Zaokrąglenie do 2 miejsc: determinizm zapisu (ten sam JSON → te same bajty SVG). */
export const z2 = (v: number): number => Math.round(v * 100) / 100 + 0;
