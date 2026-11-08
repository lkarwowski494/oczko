// E2-136-A1 (raport 07 E2 #136, scenariusz 04, krok 13): „−1 przy braku projektu, potem pierwsze +1” przez prawdziwy ekran licznika (EkranLicznika + Licznik, M3 p2)
// i prawdziwą kompozycję na prawdziwej bazie (node:sqlite); atrapy tylko na granicy platformy (Live Activity, zegarek, haptyka; sklep i cykl życia ma korzeń „Dziś”, M3 p2).
// Pytanie 07: czy w E2E licznik 0 po „−1” i potem bez zmian po „+1” (14 s, asercja „1” niewidoczna) to błąd aplikacji, czy maszyna.
// Ścieżki: src/kompozycja/licznik.ts `naMinus` (bez projektu: zostaje 0, bez zapisu) i `plusZEkranu` (pierwsze +1 tworzy projekt roboczy, potem zwykłe +1);
// okno strażnika serii 6 s z argumentu E2E `oczkoE2eOknoStraznika` (P-358) to zależność `straznikOknoS`.
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, Zegarek } from '../../src/domena/porty';
import { EkranLicznika } from '../../src/ekrany/Aplikacja';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika, type KompozycjaLicznika } from '../../src/kompozycja/licznik';
import { przygotuj } from '../dane/pomocnicze/srodowisko';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaHaptyki } from './pomoc';

const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined };
const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };

async function start(straznikOknoS?: number) {
  const s = await przygotuj();
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const t: Tlumacz = i.t;
  const k = kompozycjaLicznika({ ...s.z, ...(straznikOknoS === undefined ? {} : { straznikOknoS }), migruj: (b) => migruj(b), liveActivity, zegarek }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true });
  expect((await k.przygotuj()).ok).toBe(true); // świeża instalacja: brak projektu
  return { s, k, t };
}
/** Ekran jak w app/licznik.tsx (M3 p2; dawniej Aplikacja na „/”): usługi i działania z kompozycji; ekran montowany od nowa po zmianie wersji (key). */
function ekran(k: KompozycjaLicznika, t: Tlumacz, wersja = 0) {
  return <EkranLicznika key={wersja} porty={{ haptyka: atrapaHaptyki() }} uslugi={k.uslugi} dzialania={k.dzialania} oglos={jest.fn()} t={t} />;
}
const liczba = () => screen.getByTestId('licznik-wartosc').props.accessibilityLabel as string;
const czekajNa = (n: string) => waitFor(() => expect(liczba()).toBe(n));
const stukPlus = async (n: string) => { fireEvent.press(await screen.findByTestId('licznik-plus')); await czekajNa(n); };
async function projektyWBazie(s: Awaited<ReturnType<typeof start>>['s']): Promise<number> {
  const [p] = await s.baza.all<{ n: number }>('SELECT count(*) AS n FROM projekt WHERE usunieto_ms IS NULL');
  return p?.n ?? -1;
}

test('E2-136-A1: −1 bez projektu (od 0), potem +1 → licznik 1; −1 nie zapisuje nic, +1 tworzy jeden projekt roboczy', async () => {
  const { s, k, t } = await start();
  render(ekran(k, t));
  await czekajNa('0');
  fireEvent.press(await screen.findByTestId('licznik-minus'));
  await czekajNa('0');
  expect(await projektyWBazie(s)).toBe(0); // „−1” przy braku projektu: bez zapisu (BR-LIC-002/S3)
  await stukPlus('1');
  expect(await projektyWBazie(s)).toBe(1);
  expect((await k.widok())?.wartosc).toBe(1);
});

test('E2-136-A1 (okno strażnika 6 s, oczkoE2eOknoStraznika): −1, odstęp dłuższy niż okno na zegarze, +1 → 1', async () => {
  const { s, k, t } = await start(6);
  render(ekran(k, t));
  await czekajNa('0');
  fireEvent.press(await screen.findByTestId('licznik-minus'));
  await czekajNa('0');
  s.zegar.przesun(7_000);
  await stukPlus('1');
  expect(await projektyWBazie(s)).toBe(1);
});

test('E2-136-A1 (okno 6 s, scenariusz 04 do kroku „+1,+1,−1”): −1, +1, +1, −1 → 1, bez banera serii', async () => {
  const { s, k, t } = await start(6);
  render(ekran(k, t));
  await czekajNa('0');
  fireEvent.press(await screen.findByTestId('licznik-minus'));
  await czekajNa('0');
  await stukPlus('1');
  s.zegar.przesun(1_500);
  await stukPlus('2');
  s.zegar.przesun(1_500);
  fireEvent.press(await screen.findByTestId('licznik-minus'));
  await czekajNa('1');
  expect(screen.queryByTestId('baner-serii')).toBeNull();
  expect((await k.widok())?.wartosc).toBe(1);
});

test('E2-136-A1 (bez odstępu): −1 i od razu +1 w tym samym tyknięciu → 1', async () => {
  const { k, t } = await start(6);
  render(ekran(k, t));
  await czekajNa('0');
  const minus = await screen.findByTestId('licznik-minus');
  const plus = await screen.findByTestId('licznik-plus');
  fireEvent.press(minus);
  fireEvent.press(plus);
  await czekajNa('1');
  await waitFor(async () => expect((await k.widok())?.wartosc).toBe(1));
});

test('E2-136-A1 (ekran od nowa po +1, jak key=wersja w app/index.tsx): −1, +1, przemontowanie → nadal 1', async () => {
  const { k, t } = await start(6);
  const { unmount } = render(ekran(k, t, k.wersja()));
  await czekajNa('0');
  fireEvent.press(await screen.findByTestId('licznik-minus'));
  await stukPlus('1');
  await k.poZmianie(); // naPartie / poZegarku podnoszą wersję
  unmount(); // key={wersja} w app/index.tsx: ekran od nowa, `uslugi.start` czyta stan z bazy
  render(ekran(k, t, k.wersja()));
  await czekajNa('1');
});
