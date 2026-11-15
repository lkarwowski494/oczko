// BY-001 (04-studio-projektowe-001, P1; zgłoszenie właściciela WL-1171-01): każda gałąź renderowania każdej trasy z `app/` ma widoczne wyjście (Wstecz / Anuluj /
// Zamknij / Nie teraz / Gotowe). Stos ma `headerShown: false`, więc wyjście rysuje ekran; gałąź bez niego (menu źródeł wzoru w buildzie 1171) zostawia użytkownika
// bez drogi powrotu poza gestem od krawędzi. Test pada na każdej nowej trasie albo nowej gałęzi trasy bez wyjścia (zasada wspólna 21: kontrolę wymusza test).
// Metoda i ograniczenia: tests/narzedzia/wyjscia-tras.ts (analiza statyczna AST; nie sprawdza wyglądu ani położenia przycisku — to zrzuty i scenariusze E2E).
import * as fs from 'node:fs';
import * as path from 'node:path';
import { galezieBezWyjscia, plikiTras } from '../narzedzia/wyjscia-tras';

const KORZEN = path.resolve(__dirname, '../..');
const wzgl = (p: string): string => path.relative(KORZEN, p).split(path.sep).join('/');

/** Wyjątki z powodem (zasada 7: nazwane i zapisane). Korzenie zakładek nie mają „wstecz” (design-spec „wstecz”, `docs/design/dzianina/design-spec.md:136`). */
const WYJATKI: Record<string, string> = {
  'app/_layout.tsx': 'układ stosu i dostawca aplikacji, nie ekran',
  'app/(zakladki)/_layout.tsx': 'układ zakładek, nie ekran',
  'app/(zakladki)/index.tsx': 'korzeń zakładki „Dziś”',
  'app/(zakladki)/projekty.tsx': 'korzeń zakładki „Projekty”',
  'app/(zakladki)/narzedzia.tsx': 'korzeń zakładki „Narzędzia”',
  'app/(zakladki)/dni.tsx': 'korzeń zakładki „Historia”',
  'app/+native-intent.tsx': 'przekierowanie adresów, bez interfejsu',
};

const TRASY = plikiTras(KORZEN);

test('wyjątki wskazują istniejące pliki (martwy wpis nie ukrywa nowej trasy)', () => {
  const istnieja = new Set(TRASY.map(wzgl));
  expect(Object.keys(WYJATKI).filter((p) => !istnieja.has(p))).toEqual([]);
});

test('każda trasa z `app/` poza wyjątkami da się przeanalizować (domyślna funkcja, co najmniej jedna gałąź z JSX)', () => {
  const nieprzeanalizowane = TRASY.filter((p) => !(wzgl(p) in WYJATKI) && galezieBezWyjscia(p, fs.readFileSync(p, 'utf8')) === null).map(wzgl);
  expect(nieprzeanalizowane).toEqual([]);
});

test('BY-001: każda gałąź renderowania każdej trasy ma widoczne wyjście', () => {
  const braki = TRASY.filter((p) => !(wzgl(p) in WYJATKI)).flatMap((p) => galezieBezWyjscia(p, fs.readFileSync(p, 'utf8')) ?? []).map((b) => ({ ...b, plik: wzgl(b.plik) }));
  expect(braki).toEqual([]);
});

// Analizator musi wykrywać brak wyjścia (inaczej zielony wynik niczego nie dowodzi). Źródła podstawione w pamięci; pliki zewnętrzne: tylko to, co poda `odczyt`.
const PLIK = '/s/app/probna.tsx';
const odczytZ = (pliki: Record<string, string>) => (s: string): string | null => pliki[s] ?? null;

test('analizator: gałąź z komponentem bez wyjścia jest zgłoszona, z `Wstecz` albo `wspolne.anuluj` nie', () => {
  const trasa = (gal: string): string => `import React from 'react';\nimport { Ekran } from '../src/Ekran';\nimport { Wstecz } from '../src/Pasek';\nexport default function T() {\n  if (!x) return <Bezpieczny>{${gal}}</Bezpieczny>;\n  return <Ekran />;\n}`;
  const bezWyjscia = { '/s/src/Ekran.tsx': 'export function Ekran() { return <ScrollView><Tekst /></ScrollView>; }' };
  const zWyjsciem = { '/s/src/Ekran.tsx': "export function Ekran() { return <ScrollView><Przycisk tekst={t('wspolne.anuluj')} /></ScrollView>; }" };
  expect(galezieBezWyjscia(PLIK, trasa('<Ekran />'), odczytZ(bezWyjscia))?.map((b) => b.galaz)).toEqual([1, 2]);
  expect(galezieBezWyjscia(PLIK, trasa('<Ekran />'), odczytZ(zWyjsciem))).toEqual([]);
  expect(galezieBezWyjscia(PLIK, trasa('<Wstecz onPress={() => undefined} />'), odczytZ(bezWyjscia))?.map((b) => b.galaz)).toEqual([2]);
});

test('analizator: wyjście znalezione w komponencie zagnieżdżonym (do 5 poziomów), `StanWczytywania` liczy się tylko z propsem `wyjscie`', () => {
  const pliki = {
    '/s/src/A.tsx': "import { B } from './B';\nexport function A() { return <View><B /></View>; }",
    '/s/src/B.tsx': "export function B() { return <Text>{t('wspolne.zamknij')}</Text>; }",
    '/s/src/StanWczytywania.tsx': 'export function StanWczytywania() { return <View />; }',
  };
  const zagniezdzone = "import { A } from '../src/A';\nexport default function T() { return <A />; }";
  expect(galezieBezWyjscia(PLIK, zagniezdzone, odczytZ(pliki))).toEqual([]);
  const stan = (props: string): string => `import { StanWczytywania } from '../src/StanWczytywania';\nexport default function T() { if (!a) return <StanWczytywania ${props} />; return <Wstecz />; }`;
  expect(galezieBezWyjscia(PLIK, stan(''), odczytZ(pliki))?.map((b) => b.galaz)).toEqual([1]);
  expect(galezieBezWyjscia(PLIK, stan("wyjscie={{ rodzaj: 'wstecz', naWyjdz: () => undefined }}"), odczytZ(pliki))).toEqual([]);
});

test('analizator: `return pusty(…)` (pomocnik z tego samego pliku) jest rozwijany do swojej gałęzi', () => {
  const zrodlo = "const pusty = () => <View />;\nexport default function T() { if (!a) return pusty(); return <Wstecz />; }";
  expect(galezieBezWyjscia(PLIK, zrodlo, odczytZ({}))?.map((b) => b.galaz)).toEqual([1]);
});

// Mutant z prawdziwych źródeł: ekran „Dodaj wzór” sprzed WL-1171-01 (bez `Wstecz` w `EkranZrodelWzoru`) musi być wykryty na trasie `app/wzor.tsx`.
test('BY-001: trasa `/wzor` sprzed poprawki WL-1171-01 (menu źródeł bez `Wstecz`) jest zgłoszona, obecna nie', () => {
  const wzor = path.join(KORZEN, 'app/wzor.tsx');
  const zrodla = path.join(KORZEN, 'src/ekrany/WzorZrodla.tsx');
  const zrodloWzoru = fs.readFileSync(wzor, 'utf8');
  expect(galezieBezWyjscia(wzor, zrodloWzoru)).toEqual([]);
  const bezWstecz = fs.readFileSync(zrodla, 'utf8').split('\n').filter((l) => !l.includes('<Wstecz')).join('\n');
  const odczyt = (s: string): string | null => (s === zrodla ? bezWstecz : fs.existsSync(s) && fs.statSync(s).isFile() ? fs.readFileSync(s, 'utf8') : null);
  const braki = galezieBezWyjscia(wzor, zrodloWzoru, odczyt);
  expect(braki?.length).toBe(1);
  expect(braki?.[0]?.fragment).toContain('EkranZrodelWzoru');
});
