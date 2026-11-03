// Poprawki 04, D3 (04-studio-projektowe-013, P-328, P-330 5a; design-spec „012 · Delete all data”): okno „Delete all data” ma treść zatwierdzoną po P-328:
// `ustawienia.usun_pytanie` (bez „can’t be undone”, „this device”), akapit `ustawienia.usun_kopia`, akapit `ustawienia.usun_pro`. Test na prawdziwym słowniku i prawdziwej
// ścieżce wyboru języka: stare tłumaczenia (34 języki: „na tym iPhonie… Tego nie można cofnąć”) nie mogą pokazać nieprawdziwego zdania, gdy przed usunięciem powstaje kopia.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ArkuszUsunWszystko } from '../../src/ekrany/UsunWszystko';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import type { Tlumacz } from '../../src/ekrany/wspolne';

const tJezyk = async (systemowy: string): Promise<Tlumacz> =>
  (await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => [systemowy], zasoby: ZASOBY })).t;
const arkusz = (t: Tlumacz) => render(<ArkuszUsunWszystko t={t} icloudWlaczona={false} blad={false} naUsun={jest.fn()} naZamknij={jest.fn()} />);
// M1-audytor-generalny-130 (P-427 a): pytanie mówi też, że kopie bezpieczeństwa zostają na urządzeniu i znikają po 30 dniach (kontrakt: usun-wszystko-co-zostaje.test.tsx).
const PYTANIE = 'This removes all projects, counters, history, patterns and photos from Oczko. Copies Oczko saved for safety stay on this device, and Oczko deletes them within 30 days, when you open it.'; // M1-143 (DEC-36 a): „within 30 days, when you open it”
const KOPIA = 'Oczko first saves a copy in the Files app, in Oczko › Backup. Importing that file brings everything back.';

test('en: pytanie P-328/P-330 + akapit o kopii w Plikach; bez starej treści', async () => {
  arkusz(await tJezyk('en-US'));
  expect(screen.getByText(PYTANIE)).toBeTruthy();
  expect(screen.getByText(KOPIA)).toBeTruthy();
  expect(screen.queryByText(/on this iPhone/)).toBeNull();
  expect(screen.queryByText(/can’t be undone/)).toBeNull();
});
test.each(['de-DE', 'pl-PL', 'fr-FR', 'ja-JP'])('%s: pytanie nie niesie starego tłumaczenia („iPhone”, „nie można cofnąć”) — do fali przekładu tekst z en', async (jezyk) => {
  arkusz(await tJezyk(jezyk));
  expect(screen.getByText(PYTANIE)).toBeTruthy();
  expect(screen.getByText(KOPIA)).toBeTruthy();
});
