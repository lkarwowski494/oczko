// M3 p2 — test równoważności (polecenie p2 pkt 3; STOP 3 M3 „flagi danych: żadna (p2: test równoważności +1 karty i licznika)”; ZM-18, ER-68 BR-LIC-001/S2):
// „+1” karty „Dziś” i „+1” ekranu licznika to jedno zdarzenie — ten sam przypadek użycia `dodajRzad`, więc ten sam stan bazy, ta sama haptyka, ten sam
// strażnik serii (F-47, RD-17), ten sam arkusz limitu dni (05-br-zak-006 / BR-ZAK-006) i blokada (F-03); KP-10: zakup nigdy w trakcie liczenia.
// Dwie kompozycje na dwóch prawdziwych bazach (node:sqlite) z tym samym zegarem; atrapy tylko na granicy platformy (haptyka, Live Activity, zegarek, sklep).
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, Sklep, Zegarek } from '../../src/domena/porty';
import { Aplikacja, EkranLicznika, type UslugiAplikacji } from '../../src/ekrany/Aplikacja';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika } from '../../src/kompozycja/licznik';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaCyklu, atrapaHaptyki, atrapaSystemu, stanLicznika, tEn } from './pomoc';

const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined };
const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };
const atrapaSklepu = () => ({ produkty: jest.fn(async () => []), kup: jest.fn(), przywroc: jest.fn(), transakcje: jest.fn(async () => []), obserwuj: jest.fn(() => () => {}) }) as unknown as jest.Mocked<Sklep>;
type Ekran = 'dzis' | 'licznik';
const ID = { dzis: { plus: 'dzis-plus', wartosc: 'dzis-wartosc' }, licznik: { plus: 'licznik-plus', wartosc: 'licznik-wartosc' } } as const;
const ustabilizuj = () => act(async () => { await new Promise((r) => setTimeout(r, 40)); });

/** Ekran na prawdziwej bazie: licznik l1 z `n` rzędami, otwarty jak po „Kontynuuj ›”. */
async function naBazie(ekran: Ekran, n: number) {
  const s = await przygotuj();
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', n)]);
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true }, { wibracje: () => true });
  expect((await k.przygotuj()).ok).toBe(true);
  await k.otworz('l1');
  const haptyka = atrapaHaptyki();
  const sklep = atrapaSklepu();
  const naOferty = jest.fn();
  const dzialania = { ...k.dzialania, naOferty };
  const r = render(ekran === 'dzis'
    ? <Aplikacja porty={{ sklep, ekranAktywny: { wlacz: jest.fn(), wylacz: jest.fn() }, haptyka }} uslugi={k.uslugi} dzialania={dzialania} cykl={atrapaCyklu().cykl} system={atrapaSystemu()} oglos={jest.fn()} t={i.t} />
    : <EkranLicznika porty={{ haptyka }} uslugi={k.uslugi} dzialania={dzialania} oglos={jest.fn()} t={i.t} />);
  await screen.findByTestId(ID[ekran].plus);
  let obecna = n;
  const stuknij = async (razy: number) => {
    for (let x = 0; x < razy; x++) {
      fireEvent.press(screen.getByTestId(ID[ekran].plus));
      obecna += 1;
      await waitFor(() => expect(screen.getByTestId(ID[ekran].wartosc)).toHaveTextContent(String(obecna)), { timeout: 5000 });
      await ustabilizuj();
    }
  };
  /** Stan bazy bez identyfikatorów i czasu: wartość licznika i zdarzenia (rodzaj, źródło, cofnięcia) w kolejności zapisu. */
  const baza = async () => ({
    licznik: await s.baza.all('SELECT wartosc FROM licznik WHERE id = ?', ['l1']),
    zdarzenia: await s.baza.all("SELECT rodzaj, zrodlo, cofa IS NOT NULL AS cofa FROM zdarzenie WHERE licznik_id = 'l1' ORDER BY rowid"),
    projekty: await s.baza.all('SELECT count(*) AS n FROM projekt'),
  });
  return { r, k, haptyka, sklep, naOferty, stuknij, baza };
}

let t: Awaited<ReturnType<typeof tEn>>;
beforeAll(async () => { t = await tEn(); });

describe('„+1” karty „Dziś” ≡ „+1” licznika (ZM-18, ER-68 BR-LIC-001/S2)', () => {
  test('trzy szybkie +1: ten sam stan bazy, ta sama haptyka i ten sam baner strażnika serii (F-47, RD-17)', async () => {
    const wyniki: Record<Ekran, { baza: unknown; haptyka: unknown[]; baner: string }> = {} as never;
    for (const e of ['dzis', 'licznik'] as const) {
      const u = await naBazie(e, 0);
      await u.stuknij(3);
      await waitFor(() => expect(screen.getByTestId(ID[e].wartosc)).toHaveTextContent('3'));
      await waitFor(() => expect(screen.getByTestId('baner-serii')).toBeTruthy());
      wyniki[e] = { baza: await u.baza(), haptyka: u.haptyka.zagraj.mock.calls.map(([w]) => w), baner: String(screen.getByTestId('baner-serii').props.children) };
      u.r.unmount();
    }
    expect(wyniki.dzis.baza).toEqual(wyniki.licznik.baza);
    expect((wyniki.dzis.baza as { licznik: unknown }).licznik).toEqual([{ wartosc: 3 }]);
    expect(wyniki.dzis.haptyka).toEqual(wyniki.licznik.haptyka);
    expect(wyniki.dzis.haptyka).toEqual(['plus', 'plus', 'plus']);
    expect(wyniki.dzis.baner).toBe(wyniki.licznik.baner);
    expect(wyniki.dzis.baner).toMatch(/^Added 3 rows/);
  });

  test('cofnięcie serii z banera pod kartą = cofnięcie z licznika (ten sam stan bazy)', async () => {
    const bazy: unknown[] = [];
    for (const e of ['dzis', 'licznik'] as const) {
      const u = await naBazie(e, 0);
      await u.stuknij(3);
      await waitFor(() => expect(screen.getByTestId('baner-serii-cofnij')).toBeTruthy());
      fireEvent.press(screen.getByTestId('baner-serii-cofnij'));
      await waitFor(() => expect(screen.getByTestId(ID[e].wartosc)).toHaveTextContent('0'));
      await ustabilizuj();
      bazy.push(await u.baza());
      u.r.unmount();
    }
    expect(bazy[0]).toEqual(bazy[1]);
  });
});

/** Atrapa usług z wynikiem +1 z góry (limit, blokada) — ta sama dla obu ekranów; stan licznika z pomoc.ts. */
function zAtrapa(ekran: Ekran, wynik: Awaited<ReturnType<UslugiAplikacji['dodajRzad']>>, stan = stanLicznika({ skonczone: 41, dziergany: 42 })) {
  const haptyka = atrapaHaptyki();
  const sklep = atrapaSklepu();
  const naOferty = jest.fn();
  const uslugi: jest.Mocked<UslugiAplikacji> = { start: jest.fn(async () => ({ licznik: stan, ekranWlaczony: false })), dodajRzad: jest.fn(async () => wynik), scalDziennik: jest.fn(async () => {}), przyTle: jest.fn(async () => {}) };
  const r = render(ekran === 'dzis'
    ? <Aplikacja porty={{ sklep, ekranAktywny: { wlacz: jest.fn(), wylacz: jest.fn() }, haptyka }} uslugi={uslugi} dzialania={{ naOferty }} cykl={atrapaCyklu().cykl} system={atrapaSystemu()} oglos={jest.fn()} t={t} />
    : <EkranLicznika porty={{ haptyka }} uslugi={uslugi} dzialania={{ naOferty }} oglos={jest.fn()} t={t} />);
  return { r, haptyka, sklep, naOferty, uslugi };
}

describe('wynik +1 poza zwykłym rzędem: ta sama odpowiedź na obu ekranach', () => {
  test.each(['dzis', 'licznik'] as const)('05-br-zak-006 / BR-ZAK-006 (%s): +1 przy wyczerpanym limicie → arkusz „Row 42 wasn’t added”, bez zakupu i bez ekranu ofert (KP-10)', async (e) => {
    const u = zAtrapa(e, { ok: false, powod: 'limit' });
    fireEvent.press(await screen.findByTestId(ID[e].plus));
    expect(await screen.findByText(t('limit.nie_dodano', { n: 42 }))).toBeTruthy();
    expect(screen.getByRole('button', { name: t('limit.zobacz_pro') })).toBeTruthy();
    expect(u.sklep.kup).not.toHaveBeenCalled(); // KP-10: zakup nigdy w trakcie liczenia
    expect(u.naOferty).not.toHaveBeenCalled(); // oferta dopiero z przycisku arkusza
    expect(u.haptyka.zagraj).not.toHaveBeenCalled();
    u.r.unmount();
  });

  test.each(['dzis', 'licznik'] as const)('F-03 (%s): licznik zablokowany → bez zapisu, komunikat odblokowania i haptyka blokady', async (e) => {
    const u = zAtrapa(e, { ok: false, powod: 'zablokowany' }, stanLicznika({ skonczone: 41, dziergany: 42, zablokowany: true }));
    fireEvent.press(await screen.findByTestId(ID[e].plus));
    expect(await screen.findByText(t('licznik.zablokowany_stukniecie'))).toBeTruthy();
    expect(u.uslugi.dodajRzad).not.toHaveBeenCalled();
    expect(u.haptyka.zagraj.mock.calls.map(([w]) => w)).toEqual(['blokadaStukniecie']);
    u.r.unmount();
  });

  test.each(['dzis', 'licznik'] as const)('M1-004 (%s): nieudany zapis → komunikat błędu zapisu (blad-zapisu) i haptyka błędu', async (e) => {
    const u = zAtrapa(e, { ok: false, powod: 'zapis' });
    fireEvent.press(await screen.findByTestId(ID[e].plus));
    expect(await screen.findByTestId('blad-zapisu')).toBeTruthy();
    expect(u.haptyka.zagraj.mock.calls.map(([w]) => w)).toEqual(['bladZapisu']);
    u.r.unmount();
  });
});
