// Łatka kluczy 04 partii 8 (P-326, P-330) dla grupy 8a: oferty (002), wynik „Replace” (003), preferencje (004), usunięcie danych (012), „Data and sync” (015), Pro (031).
// Wyrocznia: docs/design/fix10-2026-11-01/klucze.json. Inne grupy (8b, 8c) nakładają swoje klucze z kodem.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const KORZEN = join(__dirname, '../..');
const czytaj = (p: string): unknown => JSON.parse(readFileSync(join(KORZEN, p), 'utf8'));
const LATKA = czytaj('docs/design/fix10-2026-11-01/klucze.json') as { en: Record<string, string>; kontekst: Record<string, string>; zastapEn: Record<string, string | { z: string; na: string }> };
const EN = czytaj('src/i18n/slowniki/en.json') as Record<string, Record<string, string>>;
const KONTEKST = czytaj('src/i18n/slowniki/en.kontekst.json') as Record<string, Record<string, string>>;
// M1-audytor-generalny-130 (P-427 a): nowa treść `ustawienia.usun_pytanie` (co zostaje i jak długo) zastępuje wartość z tej łatki; jej kontrakt: tests/ekrany/usun-wszystko-co-zostaje.test.tsx.
const ZASTAPIONE_PO_LATCE = ['ustawienia.usun_pytanie'];
const MOJE = (k: string) => !ZASTAPIONE_PO_LATCE.includes(k) && (k.startsWith('oferty.') || k.startsWith('dane.zastapiono') || k.startsWith('import.nie_rozpoznano') || k.startsWith('ustawienia.usun_') ||
  ['ustawienia.ekran_nie_gasnie', 'ustawienia.ekran_nie_gasnie_opis', 'ustawienia.miary_auto', 'ustawienia.miary_metric', 'ustawienia.miary_metric_opis', 'ustawienia.miary_imperial',
    'ustawienia.miary_imperial_opis', 'ustawienia.miary_opis', 'stan_danych.kopie_opis', 'ustawienia.pro_wlaczone'].includes(k));
const wartosc = (s: Record<string, Record<string, string>>, klucz: string) => { const [sekcja, nazwa] = klucz.split('.'); return s[sekcja]?.[nazwa]; };

test('każda wartość en grupy 8a z łatki fix10 jest w en.json bez zmian', () => {
  const klucze = Object.entries(LATKA.en).filter(([k]) => MOJE(k));
  expect(klucze.length).toBe(23);
  for (const [k, v] of klucze) expect([k, wartosc(EN, k)]).toEqual([k, v]);
});
test('każdy wpis kontekstu grupy 8a jest w en.kontekst.json bez zmian', () => {
  const klucze = Object.entries(LATKA.kontekst).filter(([k]) => MOJE(k));
  expect(klucze.length).toBe(23);
  for (const [k, v] of klucze) expect([k, wartosc(KONTEKST, k)]).toEqual([k, v]);
});
test('zastąpienia: „this iPhone” → „this device” w usunięciu danych i w kluczach iCloud (zastapEn, wariant „na”)', () => {
  const klucze = Object.entries(LATKA.zastapEn).filter(([k]) => k.startsWith('icloud.'));
  expect(klucze.length).toBe(6);
  for (const [k, v] of klucze) expect([k, wartosc(EN, k)]).toEqual([k, typeof v === 'string' ? v : v.na]);
});
