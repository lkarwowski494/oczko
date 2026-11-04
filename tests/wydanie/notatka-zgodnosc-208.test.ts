// M1-audytor-generalny-208 (10-wydanie-003, WYD-11; DEC-03 a, P-528; App Review Guidelines 2.3.1): notatka dla App Review opisuje build 1.0,
// nie funkcje spoza niego. Test idzie za konfiguracją: przy `ICLOUD_W_1_0 = false` plugin `icloud-tlo` usuwa tryb tła `remote-notification`
// (notatka go nie wymienia, ale zachowuje zdanie o ukrytym przełączniku iCloud); Live Activity ma tylko +1, dopóki `Aktywnosc.swift` nie ma
// przycisku `minus`; „Manage subscription” pojawia się dopiero przy aktywnej subskrypcji (`src/ekrany/Oferty.tsx`).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ICLOUD_W_1_0 } from '../../src/konfiguracja';

const czytaj = (p: string) => readFileSync(join(__dirname, '../..', p), 'utf8');
const notatka = czytaj('docs/wydanie/metadane/notatka-recenzja.txt');
const linie = notatka.split('\n');
const aktywnosc = czytaj('targets/widget/Aktywnosc.swift');
const oferty = czytaj('src/ekrany/Oferty.tsx');

test('208: notatka ≤ 4000 bajtów (limit ASC)', () => {
  expect(Buffer.byteLength(notatka)).toBeLessThanOrEqual(4000);
});

test('208: tryb tła remote-notification w notatce tylko, gdy build go ma (ICLOUD_W_1_0); zdanie o ukrytym przełączniku iCloud zostaje', () => {
  if (!ICLOUD_W_1_0) {
    expect(notatka).not.toMatch(/remote-notification/);
    expect(notatka).toMatch(/iCloud sync switch is hidden/);
  } else expect(notatka).toMatch(/remote-notification/);
});

test('208: Live Activity w notatce z −1 tylko, gdy widżet ma przycisk minus', () => {
  const wiersz = linie.find((l) => /Live Activity/.test(l)) ?? '';
  expect(wiersz).not.toBe('');
  if (!/OczkoStuknij\(rodzaj: "minus"\)/.test(aktywnosc)) expect(wiersz).not.toMatch(/[−-]1/);
});

test('208: „Manage subscription” opisany jako widoczny po wykupieniu, gdy ekran ofert pokazuje go tylko przy aktywnej subskrypcji', () => {
  expect(oferty).toMatch(/trwaSubskrypcja\(s\.aktywne\) && <Przycisk tekst=\{t\('oferty\.zarzadzaj'\)\}/);
  const wiersz = linie.find((l) => /Manage subscription/.test(l)) ?? '';
  expect(wiersz).toMatch(/after (subscribing|a subscription)/);
});
