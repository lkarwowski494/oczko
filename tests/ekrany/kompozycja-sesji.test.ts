// Kompozycja listy sesji i grupy „Time” (P-191 P4a–P5a; design-spec „Stoper, sesje i Historia”): grupy dniami startu od najnowszej, druga
// linia według stanu, koniec następnego dnia, suma tylko zakończonych sesji.
import { stanCzasu, stanSesji } from '../../src/kompozycja/sesje';
import type { SesjaNaEkranie } from '../../src/przypadki-uzycia/sesja';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { SESJA_MAKS_H } from '../../src/konfiguracja';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const H = 3_600_000, M = 60_000;
const T = Date.UTC(2026, 9, 22, 18); // 20:00 Warszawa
const j = () => ({ t, jezyk: () => 'en', zegar24h: () => true });
const s = (id: string, z: Partial<SesjaNaEkranie>): SesjaNaEkranie => ({ id, projektId: 'p1', stan: 'zakonczona', startMs: T, koniecMs: T + H, przerwyMs: 0, wstrzymanoMs: null, czasMs: H, skorygowano: false, doKorekty: false, ...z });

test('grupy dniami od najnowszej, druga linia, „the next day”, trwająca nieedytowalna; suma i liczba do sprawdzenia', () => {
  const lista = [
    s('a', { startMs: T - 2 * 24 * H, koniecMs: T - 2 * 24 * H + 8 * H, czasMs: 8 * H, doKorekty: true }),
    s('b', { startMs: T - 24 * H, koniecMs: T - 24 * H + 5 * H, czasMs: 4 * H, przerwyMs: H }),
    s('c', { startMs: T + 3 * H, koniecMs: T + 5 * H, czasMs: 2 * H, skorygowano: true }), // 23:00 → 01:00
    s('d', { startMs: T + 6 * H, koniecMs: null, stan: 'trwa', czasMs: 0 }),
  ];
  const w = stanSesji(lista, { j: j(), terazMs: T + 7 * H, strefa: 'Europe/Warsaw' });
  expect(w.sesje.map((x) => x.id)).toEqual(['d', 'c', 'b', 'a']);
  expect(w.sesje.map((x) => x.druga)).toEqual([{ rodzaj: 'trwa' }, { rodzaj: 'skorygowana' }, { rodzaj: 'pauzy', czas: '1 h' }, { rodzaj: 'do_sprawdzenia', godziny: SESJA_MAKS_H }]);
  expect(w.sesje[1]?.wiersz).toBe('23:00–01:00 the next day');
  expect(w.sesje.map((x) => x.edytowalna)).toEqual([false, true, true, true]);
  expect(w.podsumowanie).toEqual({ czas: '14 h', liczba: 4 });
  expect(stanCzasu(lista, j())).toEqual({ suma: '14 h', sesje: 4, doSprawdzenia: 1 });
  expect(stanCzasu([], j())).toEqual({ suma: null, sesje: 0, doSprawdzenia: 0 });
});
