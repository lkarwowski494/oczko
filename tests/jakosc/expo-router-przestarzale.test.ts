// M1-audytor-generalny-122 (źródło 08-programista-517; zasada programisty 12: API z dokumentacji wersji z package.json): import
// z `expo-router/react-navigation` tylko dla eksportów bez oznaczenia `@deprecated` w typach zainstalowanego expo-router (SDK 57 oznacza
// m.in. `useNavigation`, `useIsFocused`, `useRoute` — „Import … from `expo-router` instead. Will be removed in a future SDK.”).
// Lint obejmuje tylko `src/dane`, a typecheck oznaczeń nie zgłasza, więc kontrola jest testem źródła.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const KORZEN = join(__dirname, '../..');
function pliki(katalog: string): string[] {
  const w: string[] = [];
  for (const n of readdirSync(join(KORZEN, katalog))) {
    const p = join(KORZEN, katalog, n);
    if (statSync(p).isDirectory()) w.push(...pliki(relative(KORZEN, p)));
    else if (/\.tsx?$/.test(n)) w.push(relative(KORZEN, p));
  }
  return w;
}

/** Nazwy eksportów oznaczonych `@deprecated` w module `expo-router/react-navigation` (index → native, elements → core). */
function przestarzale(): Set<string> {
  const baza = join(KORZEN, 'node_modules/expo-router/build/react-navigation');
  const w = new Set<string>();
  for (const m of ['native', 'elements', 'core']) {
    const zrodlo = readFileSync(join(baza, m, 'index.d.ts'), 'utf8');
    for (const [, nazwy] of zrodlo.matchAll(/@deprecated(?:(?!\*\/)[\s\S])*\*\/\s*export (?:type )?\{([^}]+)\}/g)) {
      for (const n of nazwy.split(',')) w.add(n.trim().split(/\s+as\s+/).pop() ?? '');
    }
  }
  return w;
}

/** `plik: nazwa` dla każdego importu z `expo-router/react-navigation` w `src` i `app`. */
function importy(): string[] {
  const w: string[] = [];
  for (const p of [...pliki('src'), ...pliki('app')]) {
    const zrodlo = readFileSync(join(KORZEN, p), 'utf8');
    for (const [, nazwy] of zrodlo.matchAll(/import (?:type )?\{([^}]+)\} from 'expo-router\/react-navigation'/g)) {
      for (const n of nazwy.split(',')) w.push(`${p}: ${n.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]}`);
    }
  }
  return w.sort();
}

test('kontrola widzi oznaczenia w typach expo-router (useNavigation przestarzały, usePreventRemove nie)', () => {
  const p = przestarzale();
  expect(p.has('useNavigation')).toBe(true);
  expect(p.has('usePreventRemove')).toBe(false);
});

test('src i app nie importują z expo-router/react-navigation eksportów oznaczonych @deprecated', () => {
  const p = przestarzale();
  expect(importy().filter((i) => p.has(i.split(': ')[1]))).toEqual([]);
});
