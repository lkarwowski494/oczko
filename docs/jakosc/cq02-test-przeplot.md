# CQ-02: test przeplotu „+1”/„−1” (czerwony, do buildu 10)

- **Wynik:** czerwony na `919ea56` (gałąź `claude/bx25-2026-11-17`); oczekiwane „5”, jest „6”.
- **Przeplot (a):** „+1” wydane pierwsze, „−1” drugie, „−1” kończy się przed „+1” (baza: start 5, po obu działaniach 5). Starszy „+1” nadpisuje na ekranie nowszy stan po „−1”, bo `naPlus` (`src/ekrany/Aplikacja.tsx`) nie sprawdza zatwierdzonego nowszego działania. Przeplot (b) (odwrotna kolejność wydania) jest zielony na tym samym kodzie.
- **Realność:** brzegowa, odziedziczona (08-programista-002, `docs/jakosc/cq-recenzja-przyrostu.md`).
- **Decyzja:** KO-167, opcja B — straż „−1” po buildzie 9, razem z tym testem; `src/` bez zmian teraz. Do buildu 10.
- **Jak użyć:** zapisz blok jako `tests/ekrany/licznik-przeplot-plus-minus-cq02.test.tsx` razem ze strażą („−1” i „+1” ze wspólnym numerem działań); oba testy mają być wtedy zielone. To nie jest plik testu w `tests/`, nie jest `skip` ani `test.failing`.

```tsx
// CQ-02 (08-programista-002): „+1” i „−1” kończące się w odwrotnej kolejności niż wydane. Zapisy w bazie są szeregowane (kolejka `plusWToku`), więc stan bazy
// to wynik działań w kolejności wydania; ekran ma pokazać stan po OSTATNIM wydanym działaniu, zgodny z bazą, bez względu na kolejność zakończeń odpowiedzi.
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { EkranLicznika } from '../../src/ekrany/Aplikacja';
import type { StanEkranuLicznika, WynikPlus } from '../../src/ekrany/Licznik';
import { atrapaHaptyki, odroczona, plusOk, stanLicznika, tEn } from './pomoc';

const tresc = (id: string): string => { const e = screen.getByTestId(id); return String(e.props.accessibilityValue?.text ?? e.props.accessibilityLabel ?? e.props.children); };
const stan = (n: number): StanEkranuLicznika => stanLicznika({ skonczone: n, dziergany: n + 1 });
type Minus = { ok: true; wartosc: { skonczone: number } };

/** Atrapa bazy: działanie zmienia wartość w chwili wydania (kolejka zapisów), a odpowiedź czeka na rozwiązanie z testu; odczyt zwraca bieżącą wartość bazy. */
async function uklad(start: number) {
  const t = await tEn();
  let baza = start;
  const plusy: ReturnType<typeof odroczona<WynikPlus>>[] = [];
  const minusy: ReturnType<typeof odroczona<Minus>>[] = [];
  const dodajRzad = jest.fn(() => { baza += 1; const n = baza; const o = odroczona<WynikPlus>(); plusy.push(o); void o.obietnica; return o.obietnica.then((w) => (w.ok ? plusOk(n, { stan: stan(n) }) : w)); });
  const naMinus = jest.fn(() => { baza -= 1; const o = odroczona<Minus>(); minusy.push(o); return o.obietnica; });
  const odswiez = jest.fn(async () => stan(baza));
  const uslugi = { start: async () => ({ licznik: stan(start), ekranWlaczony: true }), dodajRzad };
  render(<EkranLicznika t={t} oglos={jest.fn()} porty={{ haptyka: atrapaHaptyki() }} uslugi={uslugi} dzialania={{ naMinus, odswiez }} jezyk="en" />);
  await screen.findByTestId('licznik-plus');
  const klik = (id: string) => act(async () => { fireEvent.press(screen.getByTestId(id)); });
  return { plusy, minusy, klik, baza: () => baza };
}

test('CQ-02: „+1” wydane pierwsze, „−1” drugie; „−1” kończy się przed „+1” — ekran = stan bazy po obu działaniach', async () => {
  const { plusy, minusy, klik, baza } = await uklad(5);
  await klik('licznik-plus');   // baza 6
  await klik('licznik-minus');  // baza 5
  expect(baza()).toBe(5);
  await act(async () => { minusy[0]!.rozwiaz({ ok: true, wartosc: { skonczone: 5 } }); });
  await act(async () => { plusy[0]!.rozwiaz(plusOk(6)); });
  expect(tresc('licznik-wartosc')).toContain('5');
  expect(tresc('licznik-wartosc')).not.toContain('6');
});

test('CQ-02: „−1” wydane pierwsze, „+1” drugie; „+1” kończy się przed „−1” — ekran = stan bazy po obu działaniach', async () => {
  const { plusy, minusy, klik, baza } = await uklad(5);
  await klik('licznik-minus');  // baza 4
  await klik('licznik-plus');   // baza 5
  expect(baza()).toBe(5);
  await act(async () => { plusy[0]!.rozwiaz(plusOk(5)); });
  await act(async () => { minusy[0]!.rozwiaz({ ok: true, wartosc: { skonczone: 4 } }); });
  expect(tresc('licznik-wartosc')).toContain('5');
  expect(tresc('licznik-wartosc')).not.toContain('4');
});
```
