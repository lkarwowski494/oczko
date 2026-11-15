// BY-001 (04-studio-projektowe-001, P1): analizator statyczny „każda gałąź renderowania każdej trasy ma widoczne wyjście”.
// Stos expo-router ma `headerShown: false` (app/_layout.tsx), więc pasek i przycisk wyjścia rysuje sam ekran; gałąź, która go nie rysuje, zostawia użytkownika
// bez widocznej drogi powrotu (gest od krawędzi nie wystarcza: Trening docs/22:454, design-spec „wstecz” 006). Test trwały: tests/jakosc/wyjscia-tras.test.ts.
//
// Metoda: dla domyślnie eksportowanej funkcji trasy bierzemy każdy `return` (poza funkcjami zagnieżdżonymi) i zbieramy komponenty z jego JSX.
// Gałąź ma wyjście, gdy któryś z tych komponentów — w swojej funkcji albo, rekurencyjnie, w komponentach, które ta funkcja renderuje — ma znacznik wyjścia:
// element `Wstecz` albo klucz `wspolne.(anuluj|zamknij|nie_teraz|gotowe|wstecz)`. Wyjątek: `StanWczytywania` liczy się dopiero z propsem `wyjscie`
// (bez niego ma wyjście tylko w kodzie, a nie na ekranie błędu).
import * as ts from 'typescript';
import * as fs from 'node:fs';
import * as path from 'node:path';

export type BrakWyjscia = { plik: string; galaz: number; fragment: string };

const ZNACZNIK_WYJSCIA = /\bwspolne\.(anuluj|zamknij|nie_teraz|gotowe|wstecz)\b/;
const GLEBOKOSC = 5;

type Plik = { sciezka: string; zrodlo: string; sf: ts.SourceFile };
type Zrodla = (sciezka: string) => string | null;

const zDysku: Zrodla = (sciezka) => (fs.existsSync(sciezka) && fs.statSync(sciezka).isFile() ? fs.readFileSync(sciezka, 'utf8') : null);

function parsuj(sciezka: string, zrodlo: string): Plik {
  return { sciezka, zrodlo, sf: ts.createSourceFile(sciezka, zrodlo, ts.ScriptTarget.Latest, true, sciezka.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS) };
}

/** Rozwiązuje import względny do pliku `.tsx`/`.ts`/`index` (pakiety zewnętrzne: null). */
function rozwiaz(od: string, spec: string, odczyt: Zrodla): string | null {
  if (!spec.startsWith('.')) return null;
  const baza = path.resolve(path.dirname(od), spec);
  for (const kandydat of [`${baza}.tsx`, `${baza}.ts`, path.join(baza, 'index.tsx'), path.join(baza, 'index.ts')]) if (odczyt(kandydat) !== null) return kandydat;
  return null;
}

function importy(p: Plik): Map<string, string> {
  const m = new Map<string, string>();
  p.sf.forEachChild((n) => {
    if (!ts.isImportDeclaration(n) || !ts.isStringLiteral(n.moduleSpecifier)) return;
    const spec = n.moduleSpecifier.text;
    const b = n.importClause?.namedBindings;
    if (n.importClause?.name) m.set(n.importClause.name.text, spec);
    if (b && ts.isNamedImports(b)) for (const e of b.elements) m.set(e.name.text, spec);
  });
  return m;
}

/** Funkcja (deklaracja albo `const X = (…) =>`) o danej nazwie na najwyższym poziomie pliku. */
function funkcja(p: Plik, nazwa: string): ts.Node | null {
  let znaleziona: ts.Node | null = null;
  p.sf.forEachChild((n) => {
    if (ts.isFunctionDeclaration(n) && n.name?.text === nazwa) znaleziona = n;
    if (ts.isVariableStatement(n)) for (const d of n.declarationList.declarations) if (ts.isIdentifier(d.name) && d.name.text === nazwa && d.initializer) znaleziona = d.initializer;
  });
  return znaleziona;
}

function znaczniki(wezel: ts.Node): { nazwa: string; maWyjscie: boolean }[] {
  const wynik: { nazwa: string; maWyjscie: boolean }[] = [];
  const odwiedz = (n: ts.Node): void => {
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const nazwa = n.tagName.getText();
      if (/^[A-Z]\w*$/.test(nazwa)) wynik.push({ nazwa, maWyjscie: n.attributes.properties.some((a) => ts.isJsxAttribute(a) && a.name.getText() === 'wyjscie') });
    }
    ts.forEachChild(n, odwiedz);
  };
  odwiedz(wezel);
  return wynik;
}

function maWyjscie(wezel: ts.Node, p: Plik, odczyt: Zrodla, odwiedzone: Set<string>, glebokosc: number): boolean {
  if (ZNACZNIK_WYJSCIA.test(wezel.getText())) return true;
  if (glebokosc === 0) return false;
  const imp = importy(p);
  for (const z of znaczniki(wezel)) {
    if (z.nazwa === 'Wstecz') return true;
    if (z.nazwa === 'StanWczytywania') { if (z.maWyjscie) return true; continue; }
    const spec = imp.get(z.nazwa);
    const cel = spec === undefined ? p : (() => { const s = rozwiaz(p.sciezka, spec, odczyt); const zr = s === null ? null : odczyt(s); return s === null || zr === null ? null : parsuj(s, zr); })();
    if (cel === null) continue;
    const klucz = `${cel.sciezka}#${z.nazwa}`;
    if (odwiedzone.has(klucz)) continue;
    odwiedzone.add(klucz);
    const f = funkcja(cel, z.nazwa);
    if (f && maWyjscie(f, cel, odczyt, odwiedzone, glebokosc - 1)) return true;
  }
  return false;
}

/** Wyrażenia zwracane przez funkcję (bez funkcji zagnieżdżonych); `return pusty(…)` rozwija się do ciała pomocnika z tego samego pliku. */
function zwracane(f: ts.Node, p: Plik, rozwinieto = new Set<string>()): ts.Node[] {
  const wynik: ts.Node[] = [];
  const odwiedz = (n: ts.Node): void => {
    if (n !== f && ts.isFunctionLike(n)) return;
    if (ts.isReturnStatement(n) && n.expression) {
      let e: ts.Expression = n.expression;
      while (ts.isParenthesizedExpression(e)) e = e.expression;
      if (ts.isCallExpression(e) && ts.isIdentifier(e.expression) && !rozwinieto.has(e.expression.text)) {
        const pom = funkcja(p, e.expression.text);
        if (pom) { rozwinieto.add(e.expression.text); wynik.push(...zwracane(pom, p, rozwinieto)); return; }
      }
      wynik.push(e);
    }
    ts.forEachChild(n, odwiedz);
  };
  const cialo = ts.isFunctionLike(f) && 'body' in f && f.body ? (f.body as ts.Node) : f;
  if (ts.isFunctionLike(f) && ts.isArrowFunction(f) && !ts.isBlock(f.body)) wynik.push(f.body);
  else odwiedz(cialo);
  return wynik;
}

function domyslnaFunkcja(p: Plik): ts.Node | null {
  let f: ts.Node | null = null;
  p.sf.forEachChild((n) => {
    if (ts.isFunctionDeclaration(n) && n.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) f = n;
    if (ts.isExportAssignment(n) && !n.isExportEquals && ts.isIdentifier(n.expression)) f = funkcja(p, n.expression.text) ?? f;
  });
  return f;
}

/** Gałęzie trasy bez widocznego wyjścia; `null` = pliku nie da się przeanalizować (brak domyślnej funkcji albo żadnej gałęzi z JSX). */
export function galezieBezWyjscia(sciezka: string, zrodlo: string, odczyt: Zrodla = zDysku): BrakWyjscia[] | null {
  const p = parsuj(sciezka, zrodlo);
  const f = domyslnaFunkcja(p);
  if (!f) return null;
  const galezie = zwracane(f, p).filter((e) => znaczniki(e).length > 0);
  if (galezie.length === 0) return null;
  return galezie
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => !maWyjscie(e, p, odczyt, new Set(), GLEBOKOSC))
    .map(({ e, i }) => ({ plik: sciezka, galaz: i + 1, fragment: e.getText().replace(/\s+/g, ' ').slice(0, 120) }));
}

/** Pliki tras: `app/**\/*.tsx`. */
export function plikiTras(korzen: string): string[] {
  const wynik: string[] = [];
  const idz = (d: string): void => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const s = path.join(d, e.name);
      if (e.isDirectory()) idz(s); else if (s.endsWith('.tsx')) wynik.push(s);
    }
  };
  idz(path.join(korzen, 'app'));
  return wynik.sort();
}
