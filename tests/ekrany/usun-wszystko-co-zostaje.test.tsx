// M1-audytor-generalny-130 (P-426, P-427 wariant a; ADR-0020 (6), ADR-0028, ADR-0032): „Delete all data” zostawia na urządzeniu kopie bezpieczeństwa —
// `oczko-przed-usunieciem-…` (i wcześniejsze `oczko-przed-importem-…`) w Plikach, Oczko › Backup, oraz wewnętrzne kopie `.db` w `kopie/` — i sprząta je po
// 30 dniach (KOPIA_PRZED_IMPORTEM_DNI, KOPIE_RATUNKOWE_DNI). Kontrakt tekstu: `ustawienia.usun_pytanie` mówi, co zostaje i jak długo, zamiast obiecywać,
// że zdjęcia znikają „from this device”. Zachowanie usuwania bez zmian (sonda S3).
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ArkuszUsunWszystko } from '../../src/ekrany/UsunWszystko';
import { KOPIA_PRZED_IMPORTEM_DNI, KOPIE_RATUNKOWE_DNI } from '../../src/konfiguracja';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';

const EN = JSON.parse(readFileSync(join(__dirname, '../../src/i18n/slowniki/en.json'), 'utf8')) as { ustawienia: Record<string, string> };
const PYTANIE = EN.ustawienia.usun_pytanie ?? '';

test('obie pule kopii sprząta ta sama liczba dni (tekst podaje jedną)', () => {
  expect(KOPIE_RATUNKOWE_DNI).toBe(KOPIA_PRZED_IMPORTEM_DNI);
});
test('usun_pytanie: mówi, że kopie zostają na urządzeniu, i ile dni (liczba z konfiguracji)', () => {
  expect(PYTANIE).toMatch(/\bcop(y|ies)\b/i);
  expect(PYTANIE).toMatch(/\bstays?\b/);
  expect(PYTANIE).toContain(`${KOPIE_RATUNKOWE_DNI} days`);
});
test('usun_pytanie: nie obiecuje usunięcia z urządzenia (kopie ze zdjęciami tam zostają) i nie nazywa modelu', () => {
  expect(PYTANIE).not.toMatch(/from this (device|iPhone|iPad)/);
  expect(PYTANIE).not.toMatch(/iPhone|iPad/);
});
test('arkusz en: pierwszy akapit to zdanie o tym, co zostaje; akapit o kopii w Plikach bez zmian', async () => {
  const { t } = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  render(<ArkuszUsunWszystko t={t} icloudWlaczona={false} blad={false} naUsun={jest.fn()} naZamknij={jest.fn()} />);
  expect(screen.getByText(PYTANIE)).toBeTruthy();
  expect(screen.getByText(new RegExp(`${KOPIE_RATUNKOWE_DNI} days`))).toBeTruthy();
});
