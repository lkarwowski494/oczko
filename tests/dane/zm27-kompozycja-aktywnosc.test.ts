// PU-357 (ex PU-357). ZM-27 (KO-234, ADR-0037, P-1099) w kompozycji licznika (ryzyko R5, TQ1): decyzja o Live Activity na stanie natywnym portu
// `liveActivity.aktywna()` (nie flaga w pamięci procesu), kolejność scalenie dziennika → decyzja, start tylko przy liczeniu, koniec po
// `LIVE_KONIEC_PO_MS` bez zmian i z menu. Czysta funkcja `decyzjaAktywnosci` ma wektory AK-01…AK-11 (tests/domena/zm27-aktywnosc.test.ts);
// tu sprawdzamy połączenie: kompozycja → odswiezEkranBlokady → port (atrapa ze stanem). Zegar wstrzyknięty (T0 = zegar środowiska testowego).
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, StanEkranuBlokady, Zegarek, ZdarzenieWejsciowe } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { LIVE_KONIEC_PO_MS } from '../../src/konfiguracja';
import { kompozycjaLicznika, type Jezyk } from '../../src/kompozycja/licznik';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { GODZ, MIN, T0, przygotuj, wykonaj } from './pomocnicze/srodowisko';

const poKolejce = () => new Promise((r) => setTimeout(r, 40)); // odświeżenie ekranu blokady idzie po wyniku (void)

/** Atrapa portu ze stanem natywnym: `start` ustawia aktywność, `zakoncz` ją kończy; `koniecSystemowy()` = system zakończył (8 h). Zapisuje też staleDate. */
function atrapaAktywnosci(poczatkowo: boolean) {
  const wywolania: string[] = [];
  let aktywna = poczatkowo;
  const stale: Array<number | null | undefined> = [];
  const liveActivity: LiveActivity = {
    start: async (x: StanEkranuBlokady, sd) => { aktywna = true; stale.push(sd); wywolania.push(`start:${x.wartosc}`); return { ok: true, wartosc: undefined }; },
    aktualizuj: async (x, sd) => { stale.push(sd); wywolania.push(`aktualizuj:${x.wartosc}`); },
    zakoncz: async () => { aktywna = false; wywolania.push('zakoncz'); },
    aktywna: () => aktywna,
  };
  const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };
  return { liveActivity, zegarek, wywolania, stale, koniecSystemowy: () => { aktywna = false; } };
}
const aktywnosc = (w: string[]) => w.filter((x) => !x.startsWith('zegarek'));

/** Licznik l1 z 3 plusami; ostatnia zmiana = `ostatniaMs` (zdarzenia co minutę od `ostatniaMs − 2 min`); zegar środowiska = T0. */
async function srodowisko(poczatkowo: boolean, ostatniaMs: number) {
  const s = await przygotuj();
  s.pro.wartosc = true; // limit dni poza tym testem
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3, { t: ostatniaMs - 2 * MIN })]);
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const j: Jezyk = { t: i.t, jezyk: i.jezyk, zegar24h: () => true };
  const a = atrapaAktywnosci(poczatkowo);
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity: a.liveActivity, zegarek: a.zegarek }, j);
  await k.przygotuj();
  await k.otworz('l1');
  return { s, k, a };
}
const liniaZEkranuBlokady = (glowa: string, czasMs: number): ZdarzenieWejsciowe => ({
  id: 'zb1', licznikId: 'l1', rodzaj: 'plus', rodzice: [glowa], czasMs, strefa: 'Europe/Warsaw', dzien: '2026-10-22', zrodlo: 'ekran_blokady', urzadzenie: 'iphone-test',
} as ZdarzenieWejsciowe);

describe('ZM-27 kompozycja: start tylko przy liczeniu (ADR-0037 (1), AK-06)', () => {
  test('ZM-27 PU-357: otwarcie licznika, start aplikacji i scalenie dziennika bez liczenia — brak `start` (odświeżenie nie wskrzesza aktywności)', async () => {
    const { k, a } = await srodowisko(false, T0 - 5 * MIN);
    await k.uslugi.start();
    await k.uslugi.scalDziennik();
    await k.poZmianie();
    await poKolejce();
    expect(aktywnosc(a.wywolania)).toEqual([]);
  });

  test('ZM-27 PU-357: +1 bez aktywności → `start` ze staleDate = ostatnia zmiana + LIVE_KONIEC_PO_MS (AK-07…AK-09, SD-01)', async () => {
    const { k, a } = await srodowisko(false, T0 - 5 * MIN);
    await k.uslugi.dodajRzad();
    await poKolejce();
    expect(aktywnosc(a.wywolania)).toEqual(['start:4']);
    expect(a.stale).toEqual([T0 + LIVE_KONIEC_PO_MS]); // ostatnie zdarzenie = ten +1 o czasie zegara (T0)
  });

  test('ZM-27 PU-357: port zwraca `aktywna = false` po końcu systemowym (8 h) → następny +1 uruchamia od nowa (flaga w pamięci procesu tego by nie zrobiła)', async () => {
    const { k, a } = await srodowisko(true, T0 - 5 * MIN);
    await k.uslugi.dodajRzad();
    await poKolejce();
    a.koniecSystemowy();
    await k.uslugi.dodajRzad();
    await poKolejce();
    expect(aktywnosc(a.wywolania)).toEqual(['aktualizuj:4', 'start:5']);
  });
});

describe('ZM-27 kompozycja: koniec po czasie bez liczenia i kolejność scalenie → decyzja (ADR-0037 (3), (6), AK-04, AK-05, AK-10)', () => {
  test('ZM-27 PU-357: aktywna, ostatnia zmiana sprzed ≥ LIVE_KONIEC_PO_MS → odświeżenie (powrót do aplikacji) kończy aktywność', async () => {
    const { k, a } = await srodowisko(true, T0 - LIVE_KONIEC_PO_MS - MIN);
    await k.uslugi.scalDziennik();
    await poKolejce();
    expect(aktywnosc(a.wywolania)).toEqual(['zakoncz']);
  });

  test('ZM-27 PU-357: tuż przed progiem (LIVE_KONIEC_PO_MS − 1 min) → aktualizacja, nie koniec', async () => {
    const { k, a } = await srodowisko(true, T0 - LIVE_KONIEC_PO_MS + MIN);
    await k.uslugi.scalDziennik();
    await poKolejce();
    expect(aktywnosc(a.wywolania)).toEqual(['aktualizuj:3']);
  });

  test('ZM-27 PU-357: kolejność — stuknięcie z ekranu blokady sprzed minuty scalone najpierw przesuwa „ostatnią zmianę”, więc aktywność trwa (nie kończy się z nieaktualnego stanu)', async () => {
    const { s, k, a } = await srodowisko(true, T0 - LIVE_KONIEC_PO_MS - 30 * MIN);
    s.dziennik.linie.push(liniaZEkranuBlokady('l1-z3', T0 - MIN));
    await k.uslugi.scalDziennik();
    await poKolejce();
    expect(aktywnosc(a.wywolania)).toEqual(['aktualizuj:4']);
  });

  test('ZM-27 PU-357: licznik bez zdarzeń i aktywna → koniec (AK-05)', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 0)]);
    const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
    const a = atrapaAktywnosci(true);
    const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity: a.liveActivity, zegarek: a.zegarek }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true });
    await k.przygotuj();
    await k.otworz('l1');
    await k.uslugi.scalDziennik();
    await poKolejce();
    expect(aktywnosc(a.wywolania)).toEqual(['zakoncz']);
  });
});

describe('ZM-27 (b) kompozycja: zdjęcie z menu (ADR-0037 (5), AK-07, AK-08)', () => {
  test('ZM-27 PU-355: `ekranBlokady.aktywna()` czyta stan portu; `zdejmij` kończy aktywną; bez aktywności nic; następny +1 uruchamia od nowa', async () => {
    const { k, a } = await srodowisko(true, T0 - 5 * MIN);
    expect(k.ekranBlokady.aktywna()).toBe(true);
    await k.ekranBlokady.zdejmij();
    expect(k.ekranBlokady.aktywna()).toBe(false);
    await k.ekranBlokady.zdejmij(); // druga próba: nic do zakończenia
    await k.uslugi.dodajRzad();
    await poKolejce();
    expect(aktywnosc(a.wywolania)).toEqual(['zakoncz', 'start:4']);
  });
});

test('ZM-27: GODZ jest używane jako jednostka progu (kontrola stałej konfiguracji: 2 h)', () => {
  expect(LIVE_KONIEC_PO_MS).toBe(2 * GODZ);
});
