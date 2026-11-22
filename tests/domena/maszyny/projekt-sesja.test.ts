// Maszyny stanów projektu (BR-PRJ-006, BR-DAN-008, P-026) i sesji stopera (BR-PRJ-013, P-072 (7a)) — poziom domena-Node.
// Wyrocznia: tabele przejść docs/architektura/moduly.md („Projekt (F-19, F-33)”, „Sesja stopera (F-21, F-51)”);
// parametry KOSZ_DNI i SESJA_MAKS_H z src/konfiguracja.ts. Przejście spoza tabeli → { ok: false, powod: 'niedozwolone_przejscie' }.
// Granice w trójkach (§3.5): kosz 30 dni − 1 ms / 30 / 31 dni (warunek „teraz − usunieto_ms ≥ KOSZ_DNI”), sesja 8 h − 1 ms / 8 h / 8 h + 1 ms.
import { przejdzProjekt, doSprzatniecia } from '../../../src/domena/maszyny/projekt';
import type { Projekt, ZdarzenieProjektu } from '../../../src/domena/maszyny/projekt';
import { rozpocznijSesje, przejdzSesje, czasSesjiMs } from '../../../src/domena/maszyny/sesja';
import type { Sesja, ZdarzenieSesji } from '../../../src/domena/maszyny/sesja';
import { KOSZ_DNI, SESJA_MAKS_H } from '../../../src/konfiguracja';
import { DOBA, GODZ, MIN } from '../../narzedzia/akceptacja';

const T0 = 1_800_000_000_000;
const TERAZ = T0 + 5 * DOBA;
const NIEDOZWOLONE = { ok: false, powod: 'niedozwolone_przejscie' };

test('BR-DAN-008 P-026 P-072 parametry maszyn: KOSZ_DNI = 30, SESJA_MAKS_H = 8 [ZIELONY-OK: parametry konfiguracji, nie zachowanie]', () => {
  expect({ KOSZ_DNI, SESJA_MAKS_H }).toEqual({ KOSZ_DNI: 30, SESJA_MAKS_H: 8 });
});

describe('BR-PRJ-006 BR-DAN-008 przejdzProjekt: przejścia z tabeli moduly.md', () => {
  const wToku: Projekt = { stan: 'w_toku', ukonczonoMs: null, usunietoMs: null };
  const ukonczony: Projekt = { stan: 'ukonczony', ukonczonoMs: T0, usunietoMs: null };
  const dozwolone: [string, Projekt, ZdarzenieProjektu, Projekt][] = [
    ['BR-PRJ-006 w_toku + ukoncz → ukonczony, ukonczono_ms = teraz', wToku, 'ukoncz', { stan: 'ukonczony', ukonczonoMs: TERAZ, usunietoMs: null }],
    ['BR-PRJ-006 ukonczony + wznow → w_toku, ukonczono_ms = NULL', ukonczony, 'wznow', { stan: 'w_toku', ukonczonoMs: null, usunietoMs: null }],
    ['BR-DAN-008 w_toku + usun → ten sam stan, usunieto_ms = teraz', wToku, 'usun', { ...wToku, usunietoMs: TERAZ }],
    ['BR-DAN-008 ukonczony + usun → ten sam stan, usunieto_ms = teraz', ukonczony, 'usun', { ...ukonczony, usunietoMs: TERAZ }],
    ['BR-DAN-008 usunięty w_toku + przywroc → usunieto_ms = NULL', { ...wToku, usunietoMs: T0 }, 'przywroc', wToku],
    ['BR-DAN-008 usunięty ukonczony + przywroc → usunieto_ms = NULL, ukonczono_ms bez zmian', { ...ukonczony, usunietoMs: T0 }, 'przywroc', ukonczony],
  ];
  test.each(dozwolone)('%s', (_n, p, z, oczek) => {
    expect(przejdzProjekt(p, z, TERAZ)).toEqual({ ok: true, wartosc: oczek });
  });

  const niedozwolone: [string, Projekt, ZdarzenieProjektu][] = [
    ['BR-PRJ-006 ukonczony + ukoncz', ukonczony, 'ukoncz'],
    ['BR-PRJ-006 w_toku + wznow', wToku, 'wznow'],
    ['BR-DAN-008 nieusunięty w_toku + przywroc', wToku, 'przywroc'],
    ['BR-DAN-008 nieusunięty ukonczony + przywroc', ukonczony, 'przywroc'],
    ['BR-PRJ-006 usunięty ukonczony + ukoncz', { ...ukonczony, usunietoMs: T0 }, 'ukoncz'],
    ['BR-PRJ-006 usunięty w_toku + wznow', { ...wToku, usunietoMs: T0 }, 'wznow'],
  ];
  test.each(niedozwolone)('%s → niedozwolone_przejscie', (_n, p, z) => {
    expect(przejdzProjekt(p, z, TERAZ)).toEqual(NIEDOZWOLONE);
  });
});

describe('BR-DAN-008 P-026 doSprzatniecia: kosz KOSZ_DNI dni (granica włączna)', () => {
  const usuniety = (msTemu: number): Projekt => ({ stan: 'w_toku', ukonczonoMs: null, usunietoMs: TERAZ - msTemu });
  test.each([
    ['29 dni → zostaje', 29 * DOBA, false],
    ['30 dni − 1 ms → zostaje', KOSZ_DNI * DOBA - 1, false],
    ['30 dni (= KOSZ_DNI) → sprzątnięty', KOSZ_DNI * DOBA, true],
    ['31 dni → sprzątnięty', 31 * DOBA, true],
  ] as const)('BR-DAN-008 P-026 usunięty %s', (_n, msTemu, oczek) => {
    expect(doSprzatniecia(usuniety(msTemu), TERAZ, TERAZ, KOSZ_DNI)).toBe(oczek); // poprzedni start = teraz (P-118 W2; P-120 Q4a)
  });
  test('BR-DAN-008 projekt nieusunięty (usunieto_ms = NULL) nigdy do sprzątnięcia', () => {
    expect(doSprzatniecia({ stan: 'ukonczony', ukonczonoMs: T0 - 400 * DOBA, usunietoMs: null }, TERAZ, TERAZ, KOSZ_DNI)).toBe(false);
  });
});

describe('BR-PRJ-013 sesja stopera: przejścia z tabeli moduly.md', () => {
  const START = T0;
  const trwa: Sesja = { stan: 'trwa', startMs: START, wstrzymanoMs: null, przerwyMs: 0, koniecMs: null, skorygowano: false, doSprawdzenia: false };
  const wstrzymana: Sesja = { ...trwa, stan: 'wstrzymana', wstrzymanoMs: START + 30 * MIN };
  const zakonczona: Sesja = { ...trwa, stan: 'zakonczona', przerwyMs: 10 * MIN, koniecMs: START + 2 * GODZ };

  test('BR-PRJ-013 (brak) + start → trwa, start_ms = teraz, bez przerw', () => {
    expect(rozpocznijSesje(START)).toEqual(trwa);
  });

  const dozwolone: [string, Sesja, ZdarzenieSesji, number, Sesja][] = [
    ['trwa + wstrzymaj → wstrzymana, wstrzymano_ms = teraz', trwa, { rodzaj: 'wstrzymaj' }, START + 30 * MIN, wstrzymana],
    ['wstrzymana + wznow → trwa, przerwy += teraz − wstrzymano_ms', wstrzymana, { rodzaj: 'wznow' }, START + 45 * MIN, { ...trwa, przerwyMs: 15 * MIN }],
    ['trwa + zakoncz → zakonczona, koniec_ms = teraz', trwa, { rodzaj: 'zakoncz' }, START + GODZ, { ...trwa, stan: 'zakonczona', koniecMs: START + GODZ }],
    // Zmiana 08 (partia 5): P-195 Q2a, P-199 Q4a — korekta zeruje przerwy (czas = koniec − start); wcześniej przerwyMs przechodziły bez zmian.
    ['zakonczona + koryguj → zakonczona, skorygowano, nowe start/koniec, przerwy 0', zakonczona, { rodzaj: 'koryguj', startMs: START + GODZ, koniecMs: START + 2 * GODZ }, TERAZ, { ...zakonczona, startMs: START + GODZ, koniecMs: START + 2 * GODZ, przerwyMs: 0, skorygowano: true }],
    ['zakonczona + koryguj z koniec = start (granica koniec ≥ start) → zapisane', zakonczona, { rodzaj: 'koryguj', startMs: START + GODZ, koniecMs: START + GODZ }, TERAZ, { ...zakonczona, startMs: START + GODZ, koniecMs: START + GODZ, przerwyMs: 0, skorygowano: true }],
  ];
  test.each(dozwolone)('BR-PRJ-013 %s', (_n, s, z, teraz, oczek) => {
    expect(przejdzSesje(s, z, teraz, SESJA_MAKS_H)).toEqual({ ok: true, wartosc: oczek });
  });

  test('BR-PRJ-013 wstrzymana + zakoncz → zakonczona, koniec_ms = teraz (przerwy przy końcu w pauzie: [DO USTALENIA] 05)', () => {
    const w = przejdzSesje(wstrzymana, { rodzaj: 'zakoncz' }, START + GODZ, SESJA_MAKS_H);
    expect(w.ok).toBe(true);
    if (w.ok) expect({ stan: w.wartosc.stan, koniecMs: w.wartosc.koniecMs, startMs: w.wartosc.startMs }).toEqual({ stan: 'zakonczona', koniecMs: START + GODZ, startMs: START });
  });

  test('BR-PRJ-013/S3 koniec przed początkiem (koniec = start − 1 ms) → zmiana nie zapisana, błędne dane', () => {
    expect(przejdzSesje(zakonczona, { rodzaj: 'koryguj', startMs: START + GODZ, koniecMs: START + GODZ - 1 }, TERAZ, SESJA_MAKS_H)).toEqual({ ok: false, powod: 'bledne_dane' });
    // P-195 Q2a: po korekcie czas = koniec − start, także gdy sesja miała przerwy (arkusz mówi to przed zapisem).
    const k = przejdzSesje(zakonczona, { rodzaj: 'koryguj', startMs: START, koniecMs: START + 90 * MIN }, TERAZ, SESJA_MAKS_H);
    expect(k.ok && czasSesjiMs(k.wartosc)).toBe(90 * MIN);
  });

  const niedozwolone: [string, Sesja, ZdarzenieSesji][] = [
    ['trwa + wznow', trwa, { rodzaj: 'wznow' }],
    ['trwa + koryguj', trwa, { rodzaj: 'koryguj', startMs: START, koniecMs: START + GODZ }],
    ['wstrzymana + wstrzymaj', wstrzymana, { rodzaj: 'wstrzymaj' }],
    ['wstrzymana + koryguj', wstrzymana, { rodzaj: 'koryguj', startMs: START, koniecMs: START + GODZ }],
    ['zakonczona + wstrzymaj', zakonczona, { rodzaj: 'wstrzymaj' }],
    ['zakonczona + wznow', zakonczona, { rodzaj: 'wznow' }],
    ['zakonczona + zakoncz', zakonczona, { rodzaj: 'zakoncz' }],
  ];
  test.each(niedozwolone)('BR-PRJ-013 %s → niedozwolone_przejscie', (_n, s, z) => {
    expect(przejdzSesje(s, z, TERAZ, SESJA_MAKS_H)).toEqual(NIEDOZWOLONE);
  });
});

describe('BR-PRJ-013/S1 P-072 (7a) zapomniany stoper: SESJA_MAKS_H przy starcie aplikacji', () => {
  const START = T0;
  const trwa: Sesja = { stan: 'trwa', startMs: START, wstrzymanoMs: null, przerwyMs: 0, koniecMs: null, skorygowano: false, doSprawdzenia: false };
  const H8 = SESJA_MAKS_H * GODZ;
  test('BR-PRJ-013/S1 P-072 trwa 8 h − 1 ms + start aplikacji → nadal trwa (bez zmian)', () => {
    expect(przejdzSesje(trwa, { rodzaj: 'start_aplikacji' }, START + H8 - 1, SESJA_MAKS_H)).toEqual({ ok: true, wartosc: trwa });
  });
  test.each([
    ['dokładnie 8 h', H8],
    ['8 h + 1 ms', H8 + 1],
    ['całą noc (14 h)', 14 * GODZ],
  ] as const)('BR-PRJ-013/S1 P-072 trwa %s + start aplikacji → zakonczona na start + 8 h, do sprawdzenia', (_n, uplynelo) => {
    expect(przejdzSesje(trwa, { rodzaj: 'start_aplikacji' }, START + uplynelo, SESJA_MAKS_H)).toEqual({
      ok: true,
      wartosc: { ...trwa, stan: 'zakonczona', koniecMs: START + H8, doSprawdzenia: true },
    });
  });
  test('BR-PRJ-013/S1 sesja 8 h skorygowana do 1 h → czas sesji 1 h (projekt 20 h → 13 h: suma sesji poza tym modułem)', () => {
    const zapomniana: Sesja = { ...trwa, stan: 'zakonczona', koniecMs: START + H8, doSprawdzenia: true };
    expect(czasSesjiMs(zapomniana)).toBe(8 * GODZ);
    const w = przejdzSesje(zapomniana, { rodzaj: 'koryguj', startMs: START, koniecMs: START + GODZ }, START + 9 * GODZ, SESJA_MAKS_H);
    expect(w.ok).toBe(true);
    if (w.ok) {
      expect(w.wartosc.skorygowano).toBe(true);
      expect(czasSesjiMs(w.wartosc)).toBe(GODZ);
    }
  });
  test('BR-PRJ-013 czas sesji = koniec − start − przerwy (2 h z 10 min przerwy → 110 min)', () => {
    expect(czasSesjiMs({ ...trwa, stan: 'zakonczona', przerwyMs: 10 * MIN, koniecMs: START + 2 * GODZ })).toBe(110 * MIN);
  });
});
