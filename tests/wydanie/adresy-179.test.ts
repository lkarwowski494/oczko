// PU-179 (katalog przypadków użycia, „Strony z linków”): linki z aplikacji prowadzą do właściwych stron — polityka i pomoc na apps4brew.com/oczko/, warunki = standardowa
// umowa Apple (EULA), nigdy github.io. Otwarcie adresu z Ustawień: tests/ekrany/ustawienia.test.tsx („Privacy Policy”, „Help”); dostępność stron pod tymi adresami:
// `.github/workflows/sprawdz-adresy.yml` (PU-180). Poziom: jednostkowy (stałe adresów w kodzie i baza z docs/wydanie/adres-strony.json).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ADRESY } from '../../src/kompozycja/adresy';

const strona = JSON.parse(readFileSync(join(__dirname, '../../docs/wydanie/adres-strony.json'), 'utf8')) as { baza: string; polityka: string; wsparcie: string };

test('PU-179: polityka prywatności i pomoc — dokładne adresy apps4brew.com/oczko/, zgodne z docs/wydanie/adres-strony.json', () => {
  expect(ADRESY.polityka).toBe('https://apps4brew.com/oczko/privacy.html');
  expect(ADRESY.wsparcie).toBe('https://apps4brew.com/oczko/support.html');
  expect(ADRESY.polityka).toBe(strona.baza + strona.polityka);
  expect(ADRESY.wsparcie).toBe(strona.baza + strona.wsparcie);
});

test('PU-179: warunki użytkowania to standardowa umowa Apple (EULA), a żaden adres w aplikacji nie wskazuje na github.io', () => {
  expect(ADRESY.warunki).toBe('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
  for (const adres of Object.values(ADRESY)) expect(adres).not.toMatch(/github\.io/i);
});
