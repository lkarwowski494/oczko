// Stan ekranu blokady i zegarka z bazy po COMMIT (ADR-0008 (7), ADR-0009; test roli 08, partia 3 D4): odswiezEkranBlokady czyta licznik,
// dni limitu miesiąca, ostatnie +1, otwartą sesję i przypomnienia w kolejce (po zapisach zleconych wcześniej), składa stanEkranuBlokady
// i wysyła ten sam ładunek do Live Activity i zegarka. Licznik usunięty albo nieistniejący → Live Activity kończona, zegarek bez wysyłki.
import type { LiveActivity, StanEkranuBlokady, Zegarek } from '../../src/domena/porty';
import { dodajRzad } from '../../src/przypadki-uzycia/licznik';
import { odswiezEkranBlokady } from '../../src/przypadki-uzycia/ekran-blokady';
import { WERSJA_STANU } from '../../src/konfiguracja';
import { czesc, dzienLimitu, licznik, projekt, przypomnienie, sesja } from './pomocnicze/dane-wejsciowe';
import { MIN, T0, przygotuj, wykonaj } from './pomocnicze/srodowisko';

function cele() {
  const wyslane: { la: StanEkranuBlokady[]; zegarek: StanEkranuBlokady[]; zakonczono: number } = { la: [], zegarek: [], zakonczono: 0 };
  const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async (s) => { wyslane.la.push(s); }, zakoncz: async () => { wyslane.zakonczono++; } };
  const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async (s) => { wyslane.zegarek.push(s); }, odbieraj: () => () => undefined };
  return { wyslane, liveActivity, zegarek };
}

test('ADR-0008 (7): po +1 stan z bazy (wartość, głowa, dni miesiąca, ostatnie +1, sesja trwa = start + przerwy, przypomnienia) do LA i zegarka', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3, { t: T0 - 3 * 24 * 60 * MIN }), przypomnienie('r1', 'l1'),
    dzienLimitu('2026-09-30'), dzienLimitu('2026-10-01'), sesja('s1', 'p1', T0 - 30 * MIN)]);
  await s.baza.run('UPDATE sesja SET przerwy_ms = ? WHERE id = ?', [5 * MIN, 's1']);
  const c = cele();
  const z = { ...s.z, ...c };
  const zapis = dodajRzad(z, { licznikId: 'l1' }); // zlecony przed odświeżeniem: kolejka gwarantuje, że stan go widzi
  const w = await odswiezEkranBlokady(z, { licznikId: 'l1', nazwa: 'Sweter', dostep: { pro: false, wygasa: null } });
  expect((await zapis).ok).toBe(true);
  const oczekiwany: StanEkranuBlokady = {
    wersja: WERSJA_STANU, licznikId: 'l1', nazwa: 'Sweter', wartosc: 4, znaczenie: 'skonczone', glowa: expect.any(String) as unknown as string,
    ostatniPlusMs: T0, dzien: '2026-10-22', dzienDozwolony: true, sesjaStartMs: T0 - 25 * MIN, pro: false, proWaznoscDo: null,
    dniWMiesiacu: [{ dzien: '2026-10-01', pro: false }, { dzien: '2026-10-22', pro: false }],
    przypomnienia: [{ od: 6, co: 6, razy: 5, tekst: 'ujmowanie' }],
    zablokowany: false, // wersja 3 (N1, P-135 Q7a)
  };
  expect(w).toEqual({ ok: true, wartosc: oczekiwany });
  expect(c.wyslane).toEqual({ la: [oczekiwany], zegarek: [oczekiwany], zakonczono: 0 });
});

test('dostęp z wywołującego (Pro do daty), sesja wstrzymana → sesjaStartMs null, limit wyczerpany → dzienDozwolony false', async () => {
  const s = await przygotuj();
  const dni = Array.from({ length: 10 }, (_, i) => dzienLimitu(`2026-10-${String(i + 1).padStart(2, '0')}`, `zd${i}`));
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 1, { t: T0 - 3 * 24 * 60 * MIN }), sesja('s1', 'p1', T0 - 2 * MIN), ...dni]);
  await s.baza.run("UPDATE sesja SET stan = 'wstrzymana', wstrzymano_ms = ? WHERE id = 's1'", [T0 - MIN]);
  const c = cele();
  const w = await odswiezEkranBlokady({ ...s.z, ...c }, { licznikId: 'l1', nazwa: 'Sweter', dostep: { pro: false, wygasa: null } });
  expect(w).toMatchObject({ ok: true, wartosc: { sesjaStartMs: null, dzienDozwolony: false, pro: false } });
  const p = await odswiezEkranBlokady({ ...s.z, ...c }, { licznikId: 'l1', nazwa: 'Sweter', dostep: { pro: true, wygasa: T0 + 1000 } });
  expect(p).toMatchObject({ ok: true, wartosc: { dzienDozwolony: true, pro: true, proWaznoscDo: T0 + 1000 } });
});

test('licznik w koszu albo nieistniejący → Live Activity zakończona, zegarek bez wysyłki, wynik bledne_dane', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter', T0, { usunieto: T0 }), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 2)]);
  const c = cele();
  const z = { ...s.z, ...c };
  expect(await odswiezEkranBlokady(z, { licznikId: 'l1', nazwa: 'Sweter', dostep: { pro: false, wygasa: null } })).toEqual({ ok: false, powod: 'bledne_dane' });
  expect(await odswiezEkranBlokady(z, { licznikId: 'brak', nazwa: 'x', dostep: { pro: false, wygasa: null } })).toEqual({ ok: false, powod: 'bledne_dane' });
  expect(c.wyslane).toEqual({ la: [], zegarek: [], zakonczono: 2 });
  expect(await s.baza.all('SELECT kod FROM blad')).toEqual([]); // zwykły stan, nie wpis diagnostyki
});
