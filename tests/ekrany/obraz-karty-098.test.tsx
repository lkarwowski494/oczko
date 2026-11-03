// M1-audytor-generalny-098 (09-lokalizacja-502, 503; LOK-05, LOK-07): podpis pod liczbą dni na obrazie karty to osobny klucz z formami CLDR
// (karta.dni_podpis), nie zdanie „{{count}} crafting days” z wyciętą liczbą (ja „編んだ日 日”, zh-Hant „個手作日”, ro „de zile”); liczby rzędów i dni
// na karcie i obrazie karty przez Intl.NumberFormat języka aplikacji (en „1,240”, de „1.240”, fr „1 240”).
import React from 'react';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react-native';
import { ObrazKarty } from '../../src/ekrany/ObrazKarty';
import { Ukonczenie, type StanUkonczenia } from '../../src/ekrany/Ukonczenie';
import { formatujLiczbe } from '../../src/i18n/format';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaSystemu } from './pomoc';

const tDla = async (jezyk: string): Promise<Tlumacz> =>
  (await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => [jezyk], zasoby: ZASOBY })).t;
const JEZYKI = Object.keys(ZASOBY).sort();
const KARTA = { nazwa: 'Sweter', okres: '1–21.10', czas: null, czesci: 1, zdjecie: null, wloczka: [] as string[] };
const KORZEN = join(__dirname, '..', '..');

test('w src/ekrany nie ma wycinania liczby z przetłumaczonego tekstu (replace(String(…)))', () => {
  const dir = join(KORZEN, 'src', 'ekrany');
  const trafienia = readdirSync(dir).filter((f) => /\.tsx?$/.test(f)).filter((f) => readFileSync(join(dir, f), 'utf8').includes('replace(String('));
  expect(trafienia).toEqual([]);
});

test('35 języków w ZASOBY', () => expect(JEZYKI).toHaveLength(35));

describe.each(JEZYKI)('obraz karty, %s: podpis pod liczbą dni', (jezyk) => {
  let t: Tlumacz;
  beforeAll(async () => { t = await tDla(jezyk); });
  test.each([1, 2, 5, 21])('dni = %i: podpis = karta.dni_podpis, bez cyfr', (n) => {
    render(<ObrazKarty stan={{ ...KARTA, rzedy: 1240, dni: n }} t={t} formatuj={(x) => formatujLiczbe(x, jezyk)} />);
    const liczba = screen.getByText(formatujLiczbe(n, jezyk));
    const kolumna = liczba.parent?.parent;
    const teksty = (kolumna?.findAllByType(liczba.type as never) ?? []).map((x) => String(x.props.children));
    const podpis = teksty[1] ?? '';
    expect(podpis).toBe(t('karta.dni_podpis', { count: n }));
    expect(podpis).not.toMatch(/\d/);
    expect(podpis).toBe(podpis.trim());
  });
});

describe.each([['en', '1,240'], ['de', '1.240'], ['fr', '1 240']])('liczba rzędów 1240 w %s → „%s” (Intl.NumberFormat)', (jezyk, oczekiwana) => {
  let t: Tlumacz;
  beforeAll(async () => { t = await tDla(jezyk); });
  test('obraz karty', () => {
    expect(formatujLiczbe(1240, jezyk)).toBe(oczekiwana);
    render(<ObrazKarty stan={{ ...KARTA, rzedy: 1240, dni: 3 }} t={t} formatuj={(x) => formatujLiczbe(x, jezyk)} />);
    expect(screen.getByText(oczekiwana)).toBeTruthy();
    expect(screen.queryByText('1240')).toBeNull();
  });
  test('karta ukończenia', () => {
    const stan: StanUkonczenia = { ...KARTA, rzedy: 1240, dni: 3, wloczka: [] };
    render(<Ukonczenie stan={stan} t={t} oglos={jest.fn()} system={atrapaSystemu()} liczby={{ formatuj: (x) => formatujLiczbe(x, jezyk, { maks: 2 }), parsuj: () => null }}
      naUdostepnij={jest.fn()} naGotowe={jest.fn()} />);
    expect(screen.getByText(oczekiwana)).toBeTruthy();
    expect(screen.queryByText('1240')).toBeNull();
  });
});
