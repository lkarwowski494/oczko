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
const PYTANIE = 'This removes all projects, counters, history, patterns and photos from Oczko. Safety copies stay on this device. Oczko deletes them after 30 days, when you next open it, and some sooner if they take up a lot of space.'; // M1-160 (DEC-37 a): warunek otwarcia i wcześniejsze usuwanie (ADR-0033)
const KOPIA = 'Oczko first saves a copy in the Files app, in Oczko › Backup. Importing that file brings everything back.';

test('en: pytanie P-328/P-330 + akapit o kopii w Plikach; bez starej treści', async () => {
  arkusz(await tJezyk('en-US'));
  expect(screen.getByText(PYTANIE)).toBeTruthy();
  expect(screen.getByText(KOPIA)).toBeTruthy();
  expect(screen.queryByText(/on this iPhone/)).toBeNull();
  expect(screen.queryByText(/can’t be undone/)).toBeNull();
});
// pl: przekład napisany po zmianie sensu (P-328, P-469); bez „iPhone” i bez „nie można cofnąć”.
test('pl-PL: pytanie i akapit o kopii po polsku (P-469), bez starej treści', async () => {
  arkusz(await tJezyk('pl-PL'));
  expect(screen.getByText('To usuwa z Oczka wszystkie projekty, liczniki, historię, wzory i zdjęcia. Kopie bezpieczeństwa zostają na tym urządzeniu. Oczko usuwa je po 30 dniach, przy następnym otwarciu, a część wcześniej, jeśli zajmują dużo miejsca.')).toBeTruthy();
  expect(screen.getByText('Najpierw Oczko zapisuje kopię w aplikacji Pliki, w Oczko › Backup. Zaimportowanie tego pliku przywraca wszystko.')).toBeTruthy();
  expect(screen.queryByText(/iPhon/)).toBeNull();
  expect(screen.queryByText(/nie można cofnąć/i)).toBeNull();
});
test.each(['de-DE', 'fr-FR', 'ja-JP'])('%s: pytanie nie niesie starego tłumaczenia („iPhone”, „nie można cofnąć”) — do fali przekładu tekst z en', async (jezyk) => {
  arkusz(await tJezyk(jezyk));
  expect(screen.getByText(PYTANIE)).toBeTruthy();
  expect(screen.getByText(KOPIA)).toBeTruthy();
});
