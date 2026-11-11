/* 10-wydanie-010 (recenzja AD, 10.11.2026): scena 99-zakup musi dać zrzut ekranu ofert z trzema planami i BEZ panelu atrapy sklepu („Test store: expire access”).
 * Maestro 2.12.1 liczy widoczność względem EKRANU urządzenia (element jest w hierarchii, gdy ≥ 10% jego pola leży w ekranie; audit/M1-2026-11-10-finalny/zrzuty-ramki/dowody/AD-maestro-widocznosc.txt),
 * a przewijaną treść arkusza przycina ScrollView nad paskiem przycisków (src/ekrany/Arkusz.tsx:111-115). Panel pod paskiem jest więc „widoczny” dla Maestro, ale nie ma go na zrzucie.
 * Symulatora iOS tu nie ma, więc test jest MODELEM geometrii (współrzędne w punktach; układ ekranu ofert z src/ekrany/Oferty.tsx: plany, zdanie „Without Pro”, linki, panel na końcu treści),
 * który wykonuje kroki sceny z pliku: `scrollUntilVisible` (centerElement), `swipe`, `assertVisible`/`assertNotVisible`, `repeat … while … times` oraz selektor `above` (Filters.kt: it.bounds.y < other.bounds.y).
 * Założenia modelu (nazwane, do potwierdzenia pierwszym przebiegiem C1): wysokości planów, zdania i paska przycisków w podanych zakresach; przesunięcie treści przy przeciągnięciu = współczynnik 0,6–1,4 drogi palca.
 * Prawda terenowa modelu: „w kadrze” = część elementu leży w widoku przewijanym (między nagłówkiem a paskiem przycisków). */
import * as fs from 'fs';
import * as path from 'path';
import { YAML } from '../jakosc/maestro-runner';

const KORZEN = path.join(__dirname, '..', '..');
const SCENA = path.join(KORZEN, 'e2e/zrzuty-sklepu/99-zakup.yaml');

type El = { id: string; text: string; top: number; h: number };
type Geo = { ekran: number; gora: number; pasek: number; planH: number; start: number; bezH: number; przesuw: number };
type Sel = { id?: string; text?: string; above?: Sel };
type Krok = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Elementy przewijanej treści (współrzędne od początku treści) i przycisk „Kup” (stały, na górze paska). */
function tresc(g: Geo) {
  const plan = (i: number, id: string, text: string): El => ({ id, text, top: g.start + i * (g.planH + 8), h: g.planH });
  const dozywotni = plan(2, 'oferty-plan-dozywotni', 'Lifetime · $14.99 once');
  const bez: El = { id: 'oferty-bez', text: 'Without Pro: 3 crafting days every month, and all your projects and data, always.', top: dozywotni.top + dozywotni.h + 16, h: g.bezH };
  const linki = bez.top + bez.h + 16 + 44; // wiersz linków (polityka, warunki) między zdaniem a panelem
  const panel: El = { id: 'e2e-sklep-wygas', text: 'Test store: expire access', top: linki + 16, h: 50 };
  return { elementy: [plan(0, 'oferty-plan-miesieczny', 'Monthly · $0.99 / month'), plan(1, 'oferty-plan-roczny', 'Yearly · $6.99 / year'), dozywotni, bez, panel], wysokosc: panel.top + panel.h + 16 };
}

class Ekran {
  offset = 0;
  readonly t; readonly dolWidoku: number; readonly kup: El;
  constructor(readonly g: Geo) {
    this.t = tresc(g);
    this.dolWidoku = g.ekran - g.pasek;
    this.kup = { id: 'oferty-kup', text: 'Get Yearly', top: this.dolWidoku + 16, h: 44 };
  }
  maxOffset() { return Math.max(0, this.t.wysokosc - (this.dolWidoku - this.g.gora)); }
  ekranowo(e: El) { return e === this.kup ? e.top : this.g.gora + e.top - this.offset; }
  /** Maestro: węzeł zostaje w hierarchii, gdy ≥ 10% jego pola leży w EKRANIE urządzenia. */
  wHierarchii(e: El) { const gora = this.ekranowo(e); return Math.min(gora + e.h, this.g.ekran) - Math.max(gora, 0) >= 0.1 * e.h; }
  /** Prawda terenowa: część elementu w widoku przewijanym (nad paskiem przycisków) = jest na zrzucie. */
  wKadrze(e: El) { const gora = this.ekranowo(e); return Math.min(gora + e.h, this.dolWidoku) - Math.max(gora, this.g.gora) > 0; }
  caloscWKadrze(e: El) { const gora = this.ekranowo(e); return gora >= this.g.gora && gora + e.h <= this.dolWidoku; }
  wszystkie() { return [...this.t.elementy, this.kup]; }
  znajdz(s: Sel | string): El[] {
    const sel: Sel = typeof s === 'string' ? { text: s } : s;
    let hit = this.wszystkie().filter((e) => this.wHierarchii(e) && (sel.id == null || e.id === sel.id) && (sel.text == null || new RegExp(`^${sel.text}$`, 'is').test(e.text)));
    if (sel.above) { const ref = this.znajdz(sel.above)[0]; hit = ref ? hit.filter((e) => this.ekranowo(e) < this.ekranowo(ref)) : []; }
    return hit;
  }
  swipe(od: string, doo: string) {
    const y = (s: string) => Number(s.split(',')[1].replace('%', '')) / 100;
    this.offset = Math.min(this.maxOffset(), Math.max(0, this.offset - (y(doo) - y(od)) * this.g.ekran * this.g.przesuw)); // palec w dół = treść w dół = mniejszy offset
  }
  wykonaj(kroki: Krok[]) {
    for (const k of kroki) {
      const [nazwa, arg] = Object.entries(k)[0] as [string, any]; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (nazwa === 'scrollUntilVisible') {
        const e = this.znajdz(arg.element)[0] ?? this.t.elementy.find((x) => x.id === arg.element.id);
        if (e && arg.centerElement) this.offset = Math.min(this.maxOffset(), Math.max(0, e.top + e.h / 2 - (this.dolWidoku - this.g.gora) / 2));
      } else if (nazwa === 'swipe') this.swipe(arg.start, arg.end);
      else if (nazwa === 'assertVisible') { if (!this.znajdz(arg).length) throw new Error(`assertVisible: brak ${JSON.stringify(arg)}`); }
      else if (nazwa === 'assertNotVisible') { if (this.znajdz(arg).length) throw new Error(`assertNotVisible: jest ${JSON.stringify(arg)}`); }
      else if (nazwa === 'repeat') { for (let i = 0; i < Number(arg.times ?? Infinity) && (arg.while == null || (arg.while.visible ? this.znajdz(arg.while.visible).length > 0 : this.znajdz(arg.while.notVisible).length === 0)); i++) this.wykonaj(arg.commands); }
      // runFlow, tapOn: nawigacja do ekranu ofert (poza modelem geometrii)
    }
  }
}

/** Kroki od otwarcia ekranu ofert (`assertVisible: oferty-ekran`) — wcześniejsza nawigacja jest poza modelem geometrii. */
const kroki = (tekst: string): Krok[] => {
  const wszystkie: Krok[] = YAML.parse(tekst.split(/^---$/m).slice(1).join('---'));
  const i = wszystkie.findIndex((k) => k.assertVisible?.id === 'oferty-ekran');
  return wszystkie.slice(i + 1);
};
const SCENA_NOWA = kroki(fs.readFileSync(SCENA, 'utf8'));
// Wersja 001 (commit 8254520), zamrożona: stałe przesunięcie o 10% i zwykłe assertNotVisible (liczone względem ekranu).
const SCENA_001 = kroki(`---
- scrollUntilVisible: { element: { id: "oferty-plan-roczny" }, direction: DOWN, timeout: 30000, centerElement: true }
- swipe: { start: "50%,45%", end: "50%,55%", duration: 800 }
- assertVisible: { id: "oferty-plan-miesieczny", text: "Monthly · .+ / month.*" }
- assertVisible: { id: "oferty-plan-roczny", text: "Yearly · .+ / year.*" }
- assertVisible: { id: "oferty-plan-dozywotni", text: "Lifetime · .+ once.*" }
- assertVisible: { id: "oferty-kup" }
- assertNotVisible: { id: "e2e-sklep-wygas" }
`);

const geometrie: Geo[] = [];
for (const gora of [56, 100]) for (const pasek of [128, 144, 160]) for (const planH of [84, 100, 116]) for (const bezH of [40, 60, 80]) for (const start of [420, 520, 620]) for (const przesuw of [0.6, 1, 1.4]) geometrie.push({ ekran: 956, gora, pasek, planH, start, bezH, przesuw });
const REFERENCYJNA: Geo = { ekran: 956, gora: 56, pasek: 128, planH: 100, start: 520, bezH: 60, przesuw: 1 };

function przebieg(scena: Krok[], g: Geo) {
  const e = new Ekran(g);
  try { e.wykonaj(scena); return { zielona: true as const, e }; } catch (blad) { return { zielona: false as const, e, blad: (blad as Error).message }; }
}

describe('model geometrii: scena 99-zakup (10-wydanie-010)', () => {
  test('wersja 001 (stałe przesunięcie 10%, assertNotVisible liczone względem ekranu): przy geometrii referencyjnej czerwona na panelu, choć panelu nie ma w kadrze (fałszywa czerwień)', () => {
    const r = przebieg(SCENA_001, REFERENCYJNA);
    expect(r.zielona).toBe(false);
    expect(r.blad).toMatch(/assertNotVisible.*e2e-sklep-wygas/);
    const panel = r.e.t.elementy.find((x) => x.id === 'e2e-sklep-wygas')!;
    expect(r.e.wKadrze(panel)).toBe(false); // zrzut byłby poprawny, a scena czerwona: brak zrzutu zakupu
    expect(r.e.wHierarchii(panel)).toBe(true); // Maestro widzi panel pod paskiem przycisków
  });

  test('wersja 001 jest czerwona w większości geometrii (mechanizm 010 jest regułą, nie wyjątkiem)', () => {
    const czerwone = geometrie.filter((g) => !przebieg(SCENA_001, g).zielona).length;
    expect(czerwone / geometrie.length).toBeGreaterThan(0.5);
  });

  test('nowa scena przy geometrii referencyjnej: zielona, panelu nie ma w kadrze, trzy plany całe w kadrze (zdanie „Without Pro” nad „Kup” jest tylko zastępnikiem: jego górna krawędź jest nad paskiem, więc plan dożywotni nad nim jest cały)', () => {
    const r = przebieg(SCENA_NOWA, REFERENCYJNA);
    expect(r.zielona).toBe(true);
    const el = (id: string) => r.e.t.elementy.find((x) => x.id === id)!;
    expect(r.e.wKadrze(el('e2e-sklep-wygas'))).toBe(false);
    for (const id of ['oferty-plan-miesieczny', 'oferty-plan-roczny', 'oferty-plan-dozywotni']) expect(r.e.caloscWKadrze(el(id))).toBe(true);
  });

  test('nowa scena w całym zakresie geometrii: zielona ⇒ zrzut poprawny (brak fałszywej zieleni), a zielona w co najmniej 90% geometrii (zapas na niepewność układu)', () => {
    let zielone = 0; const falszywe: string[] = [];
    for (const g of geometrie) {
      const r = przebieg(SCENA_NOWA, g);
      if (!r.zielona) continue;
      zielone++;
      const el = (id: string) => r.e.t.elementy.find((x) => x.id === id)!;
      const ok = !r.e.wKadrze(el('e2e-sklep-wygas')) && ['oferty-plan-miesieczny', 'oferty-plan-roczny', 'oferty-plan-dozywotni'].every((id) => r.e.caloscWKadrze(el(id)));
      if (!ok) falszywe.push(JSON.stringify(g));
    }
    expect(falszywe).toEqual([]);
    expect(zielone / geometrie.length).toBeGreaterThanOrEqual(0.9);
  });

  test('scena bez pętli (sam assertNotVisible z `above`) nie wystarcza: w tym modelu daje fałszywą zieleń albo czerwień tam, gdzie pętla przechodzi (pętla jest potrzebna)', () => {
    const bezPetli = SCENA_NOWA.filter((k) => !('repeat' in k) && !('swipe' in k));
    const zielone = geometrie.filter((g) => przebieg(bezPetli, g).zielona).length;
    const zielonePetla = geometrie.filter((g) => przebieg(SCENA_NOWA, g).zielona).length;
    expect(zielone).toBeLessThan(zielonePetla);
  });
});
