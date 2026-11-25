/* ZR8b (rola 10 fix, KO-202, P-1038): znacznik rzędu „Rząd 21 ↓” w kadrze 04 leżał na tekście wiersza 21 wzoru sklepu (ZR8 zamaskował to kontrolą kadrów, nie usunął przyczyny).
 * Przyczyna: położenie domyślne znacznika to środek strony (app/wzor.tsx: gornaKrawedzRzedu(0.5, 0.02) → pas 15,84 pkt PDF wokół 396 pkt od góry strony 792 pkt),
 * a wiersz 21 fikstury (src/kompozycja/e2e/wzor-sklepu.ts) miał linię bazową 390 pkt — dolna krawędź pasa przecinała jego tekst; przerwa między wierszami 20 i 21 (40 pkt rozstawu) jest za wąska na pas.
 * Test czyta GEOMETRIĘ z kodu produkcyjnego (stała 0,02 z app/wzor.tsx, gornaKrawedzRzedu z src/domena) i z PDF-a wygenerowanego przez fiksturę (strumień treści: linie bazowe i rozmiary czcionek),
 * więc na fiksturze sprzed zmiany jest CZERWONY (dowód: docs/jakosc/zr8b-dowod-czerwony.txt), a po zmianie zielony.
 * Granice tekstu: Helvetica AFM — wzniesienie 0,718 em, litery z ogonkiem/kreską do ok. 0,929 em, zejście −0,207 em; stałe ostrożne 0,93 i 0,23 em.
 * Skala PDF → UIKit (zmierzona z odstępu wierszy na kadrach 04 w tests/wydanie/dane/zakreslenie-zr7): iPhone 6.9″ ≈ 0,710 pkt UIKit na pkt PDF, iPad 13″ ≈ 1,761; używana skala dolna z zaokrągleniem w dół (ostrożnie).
 * Zakładka z etykietą „Rząd 21 ↓” wisi POD pasem (WidokWzoru.swift): jej wysokość to oszacowanie z kadrów (≈ 17 pkt PDF na iPhonie, ≈ 15 na iPadzie) [DO USTALENIA na pełnej rozdzielczości];
 * test przyjmuje ostrożnie 17 pkt PDF na obu urządzeniach i żąda tylko, by zakładka nie sięgała tekstu (margines > 0).
 * Dowód „tylko e2e” (P-238): wzor-sklepu.ts importuje wyłącznie panele.tsx; panele.tsx ładuje się wyłącznie przez `require` w gałęzi `process.env.EXPO_PUBLIC_E2E === '1'` w src/platforma/tryb-e2e.ts. */
import * as fs from 'fs';
import * as path from 'path';
import { pdfWzoruSklepu, type KluczWzoru } from '../../src/kompozycja/e2e/wzor-sklepu';

const korzen = path.join(__dirname, '..', '..');
const czytaj = (p: string) => fs.readFileSync(path.join(korzen, p), 'utf8');

const MARGINES_MIN_UIKIT = 4; // zadanie ZR8b: ≥ 4 pkt od linii znacznika do tekstu po obu stronach
const WZNIESIENIE = 0.93; const ZEJSCIE = 0.23; // em, ostrożnie (patrz nagłówek)
const ZAKLADKA_PDF = 17; // pkt PDF pod dolną krawędzią pasa (ostrożnie dla obu urządzeń)
const UKLADY = { 'iPhone 6.9″': 0.71, 'iPad 13″': 1.761 } as const; // pkt UIKit na pkt PDF

// Wzór z src/domena/znacznik-wzoru.ts (gornaKrawedzRzedu): kontrola tabeli 08 (docs/jakosc/narzedzia/tabela-08.mjs) nie pozwala testom z tests/wydanie importować src/domena,
// więc wzór jest tu powtórzony, a test „wzór zgodny z kodem produkcyjnym” pilnuje, że kod się nie rozjechał.
const gornaKrawedzRzedu = (yDotyku: number, wysokoscRzedu: number): number => Math.min(Math.max(yDotyku - wysokoscRzedu / 2, 0), 1 - wysokoscRzedu);

const wysokoscRzeduDomyslna = (): number => {
  const m = /const WYSOKOSC_RZEDU_DOMYSLNA = ([0-9.]+);/.exec(czytaj('app/wzor.tsx'));
  expect(m).not.toBeNull();
  return Number(m![1]);
};

/** Pas domyślnego znacznika (naZaznaczRzad: gornaKrawedzRzedu(0.5, wysokość)) w pkt PDF od góry strony. */
const pasZnacznika = (wysokoscStrony: number): { gora: number; dol: number } => {
  const w = wysokoscRzeduDomyslna();
  const gora = gornaKrawedzRzedu(0.5, w) * wysokoscStrony;
  return { gora, dol: gora + w * wysokoscStrony };
};

type Napis = { tekst: string; bazaOdGory: number; zakres: { gora: number; dol: number } };
/** Napisy strony z strumienia treści PDF: „BT /F? <rozmiar> Tf <x> <y> Td (<tekst>) Tj ET”. */
const napisyStrony = (klucz: KluczWzoru): { wysokosc: number; napisy: Napis[] } => {
  const pdf = pdfWzoruSklepu(klucz);
  const box = /\/MediaBox \[0 0 (\d+) (\d+)\]/.exec(pdf);
  expect(box).not.toBeNull();
  const wysokosc = Number(box![2]);
  const napisy: Napis[] = [];
  for (const m of pdf.matchAll(/BT \/F\d (\d+) Tf (\d+) (-?\d+) Td \((.*)\) Tj ET/g)) {
    const rozmiar = Number(m[1]); const y = Number(m[3]);
    const baza = wysokosc - y;
    napisy.push({ tekst: m[4], bazaOdGory: baza, zakres: { gora: baza - WZNIESIENIE * rozmiar, dol: baza + ZEJSCIE * rozmiar } });
  }
  expect(napisy.length).toBe(13); // tytuł + 12 wierszy
  return { wysokosc, napisy };
};

/** Odległość między przedziałami (ujemna = nakładają się). */
const odstep = (a: { gora: number; dol: number }, b: { gora: number; dol: number }): number => Math.max(b.gora - a.dol, a.gora - b.dol);

describe.each(['en', 'pl'] as const)('ZR8b (P-1038): pas domyślnego znacznika rzędu w przerwie między wierszami wzoru sklepu — %s', (klucz) => {
  const { wysokosc, napisy } = napisyStrony(klucz);
  const pas = pasZnacznika(wysokosc);
  const wiersz = (nr: number): Napis[] => napisy.filter((n) => new RegExp(`^(Row|Rzad) ${nr}:`).test(n.tekst.replace(/\\\d{3}/g, 'a')));
  const numerowane = wiersz(21);

  test('wiersz 21 istnieje dokładnie raz', () => { expect(numerowane.length).toBe(1); });

  test('żaden napis strony (tytuł ani wiersz) nie dotyka pasa znacznika: margines w pkt PDF > 0 i ≥ 4 pkt UIKit na każdym urządzeniu', () => {
    const odstepy = napisy.map((n) => ({ tekst: n.tekst.slice(0, 14), odstep: odstep(pas, n.zakres) }));
    const min = Math.min(...odstepy.map((o) => o.odstep));
    const najblizszy = odstepy.find((o) => o.odstep === min)!;
    expect([najblizszy.tekst, min > 0]).toEqual([najblizszy.tekst, true]);
    for (const [uklad, skala] of Object.entries(UKLADY)) {
      expect([uklad, najblizszy.tekst, min * skala >= MARGINES_MIN_UIKIT]).toEqual([uklad, najblizszy.tekst, true]);
    }
  });

  test('pas leży w pustym pasie: nad nim i pod nim jest tekst (wiersze 20 i 21), a margines z każdej strony ≥ 4 pkt UIKit', () => {
    const nad = napisy.filter((n) => n.zakres.dol <= pas.gora);
    const pod = napisy.filter((n) => n.zakres.gora >= pas.dol);
    expect(nad.length + pod.length).toBe(napisy.length); // nic nie przecina pasa
    const odNad = pas.gora - Math.max(...nad.map((n) => n.zakres.dol));
    const odPod = Math.min(...pod.map((n) => n.zakres.gora)) - pas.dol;
    for (const [uklad, skala] of Object.entries(UKLADY)) {
      expect([uklad, 'nad', odNad * skala >= MARGINES_MIN_UIKIT]).toEqual([uklad, 'nad', true]);
      expect([uklad, 'pod', odPod * skala >= MARGINES_MIN_UIKIT]).toEqual([uklad, 'pod', true]);
    }
  });

  test('zakładka z etykietą „Rząd 21 ↓” (wisi pod pasem, oszacowanie 17 pkt PDF) nie sięga tekstu wiersza 21', () => {
    const wiersz21 = numerowane[0];
    expect(wiersz21.zakres.gora - (pas.dol + ZAKLADKA_PDF)).toBeGreaterThan(0);
  });

  test('wiersze 9 i 13 (zakreślenia w scenach 00 i 04) stoją tam, gdzie przed ZR8b: linia bazowa od dołu strony 670 − 40·i (i = 3 i 5), a kolejność wierszy jest malejąca', () => {
    expect(wiersz(9).map((n) => wysokosc - n.bazaOdGory)).toEqual([670 - 40 * 3]);
    expect(wiersz(13).map((n) => wysokosc - n.bazaOdGory)).toEqual([670 - 40 * 5]);
    for (let i = 1; i < napisy.length; i++) expect(napisy[i].bazaOdGory).toBeGreaterThan(napisy[i - 1].bazaOdGory);
  });
});

describe('ZR8b (P-1038): wzór położenia pasa zgodny z kodem produkcyjnym', () => {
  test('src/domena/znacznik-wzoru.ts: gornaKrawedzRzedu = min(max(yDotyku − wysokoscRzedu / 2, 0), 1 − wysokoscRzedu), a app/wzor.tsx stawia znacznik na 0.5', () => {
    expect(czytaj('src/domena/znacznik-wzoru.ts')).toContain('export function gornaKrawedzRzedu(yDotyku: number, wysokoscRzedu: number): number {\n  return Math.min(Math.max(yDotyku - wysokoscRzedu / 2, 0), 1 - wysokoscRzedu);\n}');
    expect(czytaj('app/wzor.tsx')).toContain('y: gornaKrawedzRzedu(0.5, zn?.wysokosc ?? WYSOKOSC_RZEDU_DOMYSLNA)');
  });
});

describe('ZR8b (P-1038): moduł wzoru sklepu ładuje się tylko w trybie e2e i nie trafia do bundla wydania (P-238)', () => {
  const PLIKI = (kat: string): string[] => fs.readdirSync(path.join(korzen, kat), { recursive: true, withFileTypes: false } as never)
    .map((f) => path.join(kat, String(f))).filter((f) => /\.(ts|tsx|js|jsx|mjs)$/.test(f));
  const importujacy = (wzorzec: RegExp, katalogi: string[]): string[] => katalogi.flatMap(PLIKI).filter((f) => wzorzec.test(czytaj(f)));

  test('wzor-sklepu.ts importuje tylko panele.tsx (src/kompozycja/e2e/panele.tsx); żaden plik app/, src/, modules/ ani targets/ poza katalogiem e2e go nie ładuje', () => {
    const lista = importujacy(/['"][^'"\n]*wzor-sklepu['"]/, ['app', 'src', 'modules']);
    expect(lista.sort()).toEqual(['src/kompozycja/e2e/panele.tsx']);
  });

  test('panele.tsx ładuje tylko src/platforma/tryb-e2e.ts i tylko przez require w gałęzi process.env.EXPO_PUBLIC_E2E === \'1\' (Metro składa stałą, więc bez E2E moduł nie wchodzi do bundla)', () => {
    const lista = importujacy(/kompozycja\/e2e\/panele['"]|\.\/panele['"]/, ['app', 'src', 'modules']);
    // typ (`typeof import(...)`) jest wymazywany przy kompilacji; wartość tylko przez require w warunku
    expect(lista.sort()).toEqual(['src/platforma/tryb-e2e.ts']);
    const kod = czytaj('src/platforma/tryb-e2e.ts');
    expect(kod).toMatch(/process\.env\.EXPO_PUBLIC_E2E === '1' \? \(require\('\.\.\/kompozycja\/e2e\/panele'\) as PaneleE2e\) : null/);
    expect(kod).not.toMatch(/^import [^\n]*kompozycja\/e2e\/panele/m);
  });

  test('wzor-sklepu.ts nie ma importów (moduł czysty, bez t())', () => {
    expect(czytaj('src/kompozycja/e2e/wzor-sklepu.ts')).not.toMatch(/^import /m);
  });
});
