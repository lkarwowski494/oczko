// M1-audytor-generalny-052 (09-lokalizacja-005), część agenta (P-459): glosariusz ma symbole jednostek (m, yd, g, oz, cm, mm, in) dla 35 języków
// ze źródła (CLDR przez ICU), kontrola `slownik.mjs` je egzekwuje, a symbol na przełączniku jednostki pola idzie ze słownika (`jednostka.*`), nie z literału.
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { render, screen } from '@testing-library/react-native';
import { FormularzWloczki } from '../../src/ekrany/Zapas';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from '../ekrany/pomoc';

const repo = join(__dirname, '../..');
const SCIEZKA = 'docs/lokalizacja/slownik-terminow.json';
const slownik = JSON.parse(readFileSync(join(repo, SCIEZKA), 'utf8')) as {
  jezyki: string[]; zrodla: Record<string, { szczebel: number }>;
  jednostki?: { zrodlo: string; symbole: string[]; jezyki: Record<string, Record<string, { symbol: string; przyklad: string; pelny_przyklad: string }>> };
};
const SYMBOLE = ['m', 'yd', 'g', 'oz', 'cm', 'mm', 'in'];

test('glosariusz: 35 języków × 7 jednostek, każda z symbolem i przykładem; źródło szczebla ≤ 3', () => {
  const g = slownik.jednostki;
  expect(g?.symbole).toEqual(SYMBOLE);
  expect(slownik.zrodla[g?.zrodlo ?? '']?.szczebel).toBeLessThanOrEqual(3);
  expect(Object.keys(g?.jezyki ?? {}).sort()).toEqual([...slownik.jezyki].sort());
  for (const j of slownik.jezyki) for (const s of SYMBOLE) {
    const w = g?.jezyki[j]?.[s];
    expect([j, s, !!w?.symbol?.trim(), !!w?.przyklad?.trim(), !!w?.pelny_przyklad?.trim()]).toEqual([j, s, true, true, true]);
  }
});

function bledyKontroli(zmien: string): string[] {
  const kod = `import { sprawdz } from './docs/lokalizacja/narzedzia/slownik.mjs'; import { readFileSync } from 'node:fs';
const s = JSON.parse(readFileSync('${SCIEZKA}', 'utf8')); ${zmien}; console.log(JSON.stringify(sprawdz(s, null).bledy));`;
  const w = spawnSync(process.execPath, ['--input-type=module', '-e', kod], { cwd: repo, encoding: 'utf8' });
  return JSON.parse(w.stdout.trim().split('\n').pop() ?? '[]') as string[];
}
test('kontrola slownik.mjs egzekwuje glosariusz jednostek (stan zielony, mutanty czerwone)', () => {
  expect(bledyKontroli('').filter((b) => b.startsWith('jednostki'))).toEqual([]);
  expect(bledyKontroli('delete s.jednostki.jezyki.ru.m')).toContain('jednostki: ru: brak symbolu m');
  expect(bledyKontroli('delete s.jednostki.jezyki.sv')).toContain('jednostki: sv: brak języka');
  expect(bledyKontroli('delete s.jednostki').some((b) => b.startsWith('jednostki: brak sekcji'))).toBe(true);
});

test('przełącznik jednostki: symbol ze słownika (`jednostka.yd`), etykieta VoiceOver z `jednostka.yd_nazwa`', async () => {
  const en = await tEn();
  const t = ((k: string, o?: Record<string, unknown>) => (k === 'jednostka.yd' ? `${String(o?.wartosc ?? '')} ярд.` : k === 'jednostka.m' ? `${String(o?.wartosc ?? '')} м` : en(k as never, o as never))) as Tlumacz;
  render(<FormularzWloczki t={t} jednostki="imperialne" poczatek={null} przelicz={() => null} bazowa={() => null} formatuj={String} naZapisz={jest.fn()} naAnuluj={jest.fn()} />);
  expect(screen.getAllByTestId('zapas-jednostka-yd')[0]).toHaveTextContent('ярд.');
  expect(screen.getAllByTestId('zapas-jednostka-m')[0]).toHaveTextContent('м');
  expect(screen.getAllByTestId('zapas-jednostka-yd')[0].props.accessibilityLabel).toBe('Yards');
});
