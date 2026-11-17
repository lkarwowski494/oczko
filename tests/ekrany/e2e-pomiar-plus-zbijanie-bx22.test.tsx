// BX22 / KO-143 (scenariusz 31, NFR-WYD-001): przebieg iOS 43994041193 dał p95 116 ms przy progu 100 ms, a scenariusz 122 (bez panelu wejść) 82 ms w tym samym przebiegu —
// panel `e2e-licznik-wejscia` dokładał ≈ 34 ms (BX15 policzył 4 zatwierdzenia panelu w oknie pomiaru). Opcja A (wybór koordynatora): w buildzie E2E powiadomienia panelu są
// zbijane od `wejscie('plus')` do chwili po próbce (app/licznik.tsx zwalnia je w drugiej klatce) i idą jednym zatwierdzeniem; stan w pamięci aktualizuje się od razu.
// Próg, asercje scenariuszy 31/122 i `licznik-plus` bez zmian. Test liczy zatwierdzenia (Jest nie mierzy klatek) — jak BX15.
import React, { Profiler } from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { diagnostykaLicznika, PanelLicznika, wznowPowiadomienia, zerujWejscia } from '../../src/kompozycja/e2e/panele';

const mikro = () => new Promise<void>((r) => setTimeout(r, 0));

afterEach(() => { jest.useRealTimers(); });

test('jedno „+1”: w oknie pomiaru (od t0 do drugiej klatki) panel nie ma żadnego zatwierdzenia, po zwolnieniu — jedno z końcowymi liczbami', async () => {
  zerujWejscia();
  let wOknie = false; let wOknieLiczba = 0; let poOknieLiczba = 0;
  render(<Profiler id="p" onRender={() => { if (wOknie) wOknieLiczba += 1; else poOknieLiczba += 1; }}><PanelLicznika /></Profiler>);
  poOknieLiczba = 0; // montowanie
  const d = diagnostykaLicznika;
  await act(async () => {
    d.wejscie('plus');
    wOknie = true; // t0
    await mikro();
    d.zapis('plus', true); d.stan(1);
    await mikro();
    d.odswiezenie('start');
    await mikro();
    d.odswiezenie('zastosowane'); d.stan(1);
    await mikro();
    wOknie = false; // druga klatka po zapisie: próbka dopisana
    wznowPowiadomienia();
  });
  expect(wOknieLiczba).toBe(0);
  expect(poOknieLiczba).toBe(1);
  expect(screen.getByTestId('e2e-licznik-wejscia').props.children).toBe(
    'counter input: plus 1, minus 0; saves ok: plus 1, minus 0; saves failed: 0; state value: 1; refresh: started 1, applied 1, skipped 0',
  );
});

test('zbijanie zdejmuje bezpiecznik czasowy: bez zwolnienia panel i tak odświeża się po 1,5 s (żadna próbka nie zostawia panelu zamrożonego)', async () => {
  jest.useFakeTimers();
  zerujWejscia();
  render(<PanelLicznika />);
  const d = diagnostykaLicznika;
  act(() => { d.wejscie('plus'); d.zapis('plus', true); d.stan(7); });
  expect(screen.getByTestId('e2e-licznik-wejscia').props.children).toContain('state value: none');
  act(() => { jest.advanceTimersByTime(1499); });
  expect(screen.getByTestId('e2e-licznik-wejscia').props.children).toContain('state value: none');
  act(() => { jest.advanceTimersByTime(2); });
  expect(screen.getByTestId('e2e-licznik-wejscia').props.children).toContain('plus 1, minus 0; saves ok: plus 1');
  expect(screen.getByTestId('e2e-licznik-wejscia').props.children).toContain('state value: 7');
});

test('„−1” i zdarzenia spoza „+1” nie są wstrzymywane (panel odświeża się od razu); zwolnienie bez wstrzymania nic nie psuje', async () => {
  zerujWejscia();
  render(<PanelLicznika />);
  const d = diagnostykaLicznika;
  act(() => { d.wejscie('minus'); });
  expect(screen.getByTestId('e2e-licznik-wejscia').props.children).toContain('minus 1');
  act(() => { wznowPowiadomienia(); wznowPowiadomienia(); });
  act(() => { d.stan(3); });
  expect(screen.getByTestId('e2e-licznik-wejscia').props.children).toContain('state value: 3');
});

test('zerujWejscia w trakcie wstrzymania zwalnia je (test nie dziedziczy zamrożenia po poprzednim)', () => {
  zerujWejscia();
  render(<PanelLicznika />);
  act(() => { diagnostykaLicznika.wejscie('plus'); });
  act(() => { zerujWejscia(); });
  act(() => { diagnostykaLicznika.stan(2); });
  expect(screen.getByTestId('e2e-licznik-wejscia').props.children).toContain('state value: 2');
});
