// BX20 / zad. 2 (KO-136, wariant 1, P-952; scenariusze 31 i 122, NFR-WYD-001 p95 ≤ 100 ms): krótsza ścieżka „+1” między stuknięciem a widoczną wartością.
// Przed zmianą po każdym „+1” kompozycja czytała stan dwa razy (`stan()` w `plusZEkranu` i jeszcze raz w `odswiez` po powrocie), a ekran zatwierdzał dwa razy
// (wartość z wyniku, potem cały stan z `odswiez`) — drugi odczyt (widok + linia konfliktu) i drugie zatwierdzenie wypadały w oknie pomiaru (po zapisie, przed drugą klatką).
// Teraz wynik „+1” niesie pełny stan z tego samego odczytu (`wartosc.stan`): `odswiez` po „+1” nie jest wołane. Liczba zatwierdzeń ekranu NIE jest tu asertowana: w Jest
// (act) wychodzi 2 przed i po zmianie, więc nie rozróżnia (BX20, zmierzone); wiarygodna miara to liczba odczytów stanu. Czas mierzy przebieg iOS (31 i 122, progi bez zmian).
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { EkranLicznika } from '../../src/ekrany/Aplikacja';
import type { StanEkranuLicznika } from '../../src/ekrany/Licznik';
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, Zegarek } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika } from '../../src/kompozycja/licznik';
import { czesc, dzienLimitu, licznik, projekt, zdarzenie } from '../dane/pomocnicze/dane-wejsciowe';
import { DOBA, T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki, plusOk, stanLicznika, tEn } from './pomoc';

const tresc = (id: string): string => { const e = screen.getByTestId(id); return String(e.props.accessibilityValue?.text ?? e.props.accessibilityLabel ?? e.props.children); };

describe('ekran: „+1” bez drugiego odczytu stanu, gdy wynik niesie pełny stan', () => {
  async function uklad(wynikiPlus: (n: number) => ReturnType<typeof plusOk>) {
    const t = await tEn();
    let skonczone = 0;
    const stan = (n: number): StanEkranuLicznika => stanLicznika({ skonczone: n, dziergany: n + 1 });
    const odswiez = jest.fn(async () => stan(skonczone));
    const naMinus = jest.fn(async () => ({ ok: true as const, wartosc: { skonczone: --skonczone } }));
    const dodajRzad = jest.fn(async () => { skonczone += 1; return wynikiPlus(skonczone); });
    const uslugi = { start: async () => ({ licznik: stan(0), ekranWlaczony: true }), dodajRzad };
    render(<EkranLicznika t={t} oglos={jest.fn()} porty={{ haptyka: atrapaHaptyki() }} uslugi={uslugi} dzialania={{ odswiez, naMinus }} jezyk="en" />);
    await screen.findByTestId('licznik-plus');
    return { odswiez, naMinus, dodajRzad };
  }

  test('wynik z `stan`: `odswiez` po „+1” niewołane, wartość i pole spoza skonczone/dziergany z pełnego stanu wyniku', async () => {
    const u = await uklad((n) => plusOk(n, { stan: stanLicznika({ skonczone: n, dziergany: n + 1, projekt: 'Mist Sweater' }) }));
    await act(async () => { fireEvent.press(screen.getByTestId('licznik-plus')); });
    expect(u.dodajRzad).toHaveBeenCalledTimes(1);
    expect(u.odswiez).not.toHaveBeenCalled();
    expect(tresc('licznik-wartosc')).toContain('1');
    expect(screen.getByText('Mist Sweater')).toBeTruthy(); // pole spoza skonczone/dziergany pochodzi z pełnego stanu wyniku, nie z odczytu po powrocie
  });
  test('wynik bez `stan` (zgodność wsteczna): `odswiez` po „+1” jak dotąd, wartość poprawna', async () => {
    const u = await uklad((n) => plusOk(n));
    await act(async () => { fireEvent.press(screen.getByTestId('licznik-plus')); });
    expect(u.odswiez).toHaveBeenCalledTimes(1);
    expect(tresc('licznik-wartosc')).toContain('1');
  });
  test('zachowanie (zapis, wartość, cofnięcie): „+1” ×2, „−1” — wartości 1, 2, 1; zapis ×2; po „−1” odczyt stanu', async () => {
    const u = await uklad((n) => plusOk(n, { stan: stanLicznika({ skonczone: n, dziergany: n + 1 }) }));
    await act(async () => { fireEvent.press(screen.getByTestId('licznik-plus')); });
    expect(tresc('licznik-wartosc')).toContain('1');
    await act(async () => { fireEvent.press(screen.getByTestId('licznik-plus')); });
    expect(tresc('licznik-wartosc')).toContain('2');
    expect(u.dodajRzad).toHaveBeenCalledTimes(2);
    await act(async () => { fireEvent.press(screen.getByTestId('licznik-minus')); });
    expect(u.naMinus).toHaveBeenCalledTimes(1);
    expect(tresc('licznik-wartosc')).toContain('1');
    expect(u.odswiez).toHaveBeenCalledTimes(1); // „−1” zostaje przy odczycie po zapisie
  });
});

describe('kompozycja na prawdziwej bazie: wynik „+1” niesie ten sam stan, który dałby odczyt po powrocie', () => {
  const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined };
  const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };

  async function srodowisko() {
    const s = await przygotuj();
    const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 17)]);
    const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true }, { wibracje: () => true, aplikacjaAktywna: () => true });
    expect((await k.przygotuj()).ok).toBe(true);
    await k.otworz('l1');
    return k;
  }

  test('`dodajRzad().wartosc.stan` równa się `dzialania.odswiez()` zaraz po „+1”', async () => {
    const k = await srodowisko();
    const w = await k.uslugi.dodajRzad();
    expect(w.ok).toBe(true);
    if (!w.ok) return;
    expect(w.wartosc.skonczone).toBe(18);
    expect(w.wartosc.stan).toBeDefined();
    expect(w.wartosc.stan).toEqual(await k.dzialania.odswiez?.());
    expect(w.wartosc.stan?.skonczone).toBe(18);
  });
  test('pierwsze „+1” bez projektu (projekt roboczy): stan z wyniku ma już założony projekt i wartość 1', async () => {
    const s = await przygotuj();
    const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
    const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true }, { wibracje: () => true, aplikacjaAktywna: () => true });
    expect((await k.przygotuj()).ok).toBe(true);
    const w = await k.uslugi.dodajRzad();
    expect(w.ok).toBe(true);
    if (!w.ok) return;
    expect(w.wartosc.stan?.skonczone).toBe(1);
    expect(w.wartosc.stan).toEqual(await k.dzialania.odswiez?.());
  });
});

describe('CP-01 (BX23): pełny stan z wyniku „+1” == `odswiez()` na bogatym stanie', () => {
  async function bogaty() {
    const s = await przygotuj(); // teraz 2026-10-22 12:00 Europe/Warsaw, urządzenie `iphone-test`
    const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
    const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity: { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined },
      zegarek: { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined } }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true }, { wibracje: () => true, aplikacjaAktywna: () => true });
    await wykonaj(s.baza, [
      projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód', 1, { cel: 100 }), ...licznik('l1', 'c1', 32, { t: T0 - 3 * DOBA }),
      ["UPDATE projekt SET termin_dzien = '2026-10-31' WHERE id = 'p1'", []], // cel dnia
      ["UPDATE licznik SET dlugosc_powtorzenia = 8, znaczenie = 'skonczone' WHERE id = 'l1'", []], // powtórzenie
      ["INSERT INTO przypomnienie (id, licznik_id, od_rzedu, co_n, razy, tekst, zmieniono_ms) VALUES ('pr1', 'l1', 6, 6, 10, 'ujmowanie', ?)", [T0]], // przypomnienie
      ...['2026-10-01', '2026-10-02', '2026-10-03'].map((d, n) => dzienLimitu(d, `l1-z${n + 1}`)), // trzy dni limitu przed dzisiejszym; dziś będzie czwarty → „ostatni darmowy”
      zdarzenie('ipad-w', 'l1', 'wpisanie', 18, ['l1-z32'], T0 - 3 * DOBA + 40 * 60_000, { wartosc: 18, urzadzenie: 'ipad' }), // konflikt iCloud: druga gałąź z iPada
    ]);
    expect((await k.przygotuj()).ok).toBe(true);
    await k.otworz('l1');
    return { s, k };
  }

  test('seria 3 × „+1”, ostatni dzień limitu, blokada z innego źródła tuż po zapisie, konflikt: `wynik.stan` == `odswiez()`', async () => {
    const { s, k } = await bogaty();
    s.zegar.ustaw(T0 + 3_600_000);
    for (let n = 0; n < 2; n++) { expect((await k.uslugi.dodajRzad()).ok).toBe(true); s.zegar.przesun(300); }
    // Blokada licznika ustawiona zaraz po zapisie ostatniego „+1” (przed odczytem stanu): wyzwalacz w bazie testowej, produkt nie jest dotykany.
    await wykonaj(s.baza, [["CREATE TRIGGER zablokuj_po_plusie AFTER INSERT ON zdarzenie WHEN NEW.rodzaj = 'plus' BEGIN UPDATE licznik SET zablokowany = 1 WHERE id = NEW.licznik_id; END", []]]);
    const w = await k.uslugi.dodajRzad();
    expect(w.ok).toBe(true);
    if (!w.ok) return;
    const stan = w.wartosc.stan;
    // Strażnik fixtury: każde z dziesięciu pól, które mutacje BX23 zerują, ma w tym stanie wartość inną niż domyślna (inaczej `toEqual` poniżej niczego by nie łapał).
    expect(stan).toMatchObject({
      projekt: 'Sweter', cel: 100, celDnia: { rzedy: expect.any(Number) }, powtorzenie: { dlugosc: 8 }, limit: { rodzaj: 'ostatni-darmowy' }, zablokowany: true,
      baner: { rodzaj: 'seria', n: 3 }, sesja: { rzedy: 3 }, konflikt: { zdalna: 18, urzadzenie: 'ipad' }, przypomnienie: { tekst: 'ujmowanie' },
    });
    expect(stan).toEqual(await k.dzialania.odswiez?.()); // cały stan, nie pola po kolei: „+1” niesie dokładnie ten stan, który dałby odczyt po powrocie
  });
});
