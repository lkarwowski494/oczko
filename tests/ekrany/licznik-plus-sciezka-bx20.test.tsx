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
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
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
