// PU-135 („Chcę przy AX5 czytać wszystkie główne ekrany”), część „każdy ekran przewija się do ostatniego elementu”: prawdziwe ekrany „Dziś”, licznik, projekt, „Historia”, „Ustawienia”,
// „Oczko Pro” i „Licencje open source” przy fontScale AX5 (3,571). Jest nie układa (Yoga) i nie przewija: sprawdzamy STRUKTURĘ — ostatni element treści leży WEWNĄTRZ kontenera przewijania
// (ScrollView albo FlatList), więc przy dużym tekście da się do niego dojechać, a nie wypada poza ekran. Przyciski przypięte na dole (licznik: strefa przycisków; Oczko Pro: pasek przycisków) są
// poza przewijaniem celowo — zostają widoczne zawsze.
// Poza Jest: faktyczne przewinięcie, widoczność i nieucięcie napisów na urządzeniu (scenariusz 120, oczekujący; wzór z notatką, tytuł z ▾ i karta Worda: osobne testy ekranów wzoru).
import React from 'react';
import { FlatList, ScrollView } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { Dzis, type DaneDzis } from '../../src/ekrany/Dzis';
import { HistoriaDni } from '../../src/ekrany/HistoriaDni';
import { Licencje } from '../../src/ekrany/Licencje';
import { Licznik } from '../../src/ekrany/Licznik';
import { Oferty } from '../../src/ekrany/Oferty';
import { Projekt, type PropsProjektu } from '../../src/ekrany/Projekt';
import { Ustawienia } from '../../src/ekrany/Ustawienia';
import { stanHistorii } from '../../src/kompozycja/historia';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaHaptyki, atrapaSystemu, plusOk, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
// fontScale 3,571 = kategoria dostępności 5 (wartość z design-spec, literał w mocku poniżej, nie import z kodu)
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: 3.571 }) }));

const idy = (korzen: ReactTestInstance): string[] => korzen.findAll((n) => typeof n.type === 'string' && typeof n.props.testID === 'string').map((n) => n.props.testID as string);
const kontenery = () => screen.UNSAFE_root.findAll((n) => n.type === ScrollView || n.type === FlatList);
/** Id-ki elementów leżących w którymkolwiek kontenerze przewijania. */
const wPrzewijaniu = () => new Set(kontenery().flatMap((k) => idy(k)));
const wszystkie = () => idy(screen.UNSAFE_root);

const DANE: DaneDzis = { data: 'Thursday, November 5', tydzien: [], pustyTydzien: true, dni: { zostalo: 3, limit: 5, miesiac: 'November' }, wToku: 3, miejsce: 'licznik', rzedyDzis: 4, coDalej: null };
const PROJEKT: PropsProjektu['stan'] = {
  nazwa: 'Harbor Sweater', notatka: 'Switch to 4 mm', miejsceWzoru: null, ostatniaZmiana: 'Nov 1', postep: { rodzaj: 'procent', wartosc: 44 }, termin: null,
  czesci: [
    { id: 'c1', nazwa: 'Left sleeve', rzedy: 42, cel: 96, paraZ: null, liczniki: [{ id: 'l1', nazwa: 'Rows', opis: '42 rows' }], calosc: null },
    { id: 'c2', nazwa: 'Front', rzedy: 74, cel: null, paraZ: null, calosc: 74, liczniki: [{ id: 'l2', nazwa: 'Body', opis: '62 rows' }, { id: 'l3', nazwa: 'Cable', opis: '12 rows' }] },
  ],
  szczegoly: { narzedzie: null, rozmiar: null, termin: null }, czas: { suma: '5h 20m', sesje: 7, doSprawdzenia: 2 },
};
const WIDOK_HISTORII = {
  dniRobotki: ['2026-10-22'], ukonczoneDnia: [], dzien: [{ projektId: 'p1', nazwa: 'Sweater', rzedy: 5, czasMs: null }],
  tydzien: { od: '2026-10-19', do: '2026-10-25', rzedy: 5, czasMs: null, ukonczone: 0, poprzednie: { rzedy: 1 } }, miesiac: { rzedy: 5, czasMs: null, ukonczone: 1, dni: 1 }, pierwsze: false,
};

const EKRANY: { nazwa: string; pokaz: () => void; ostatniTresci?: string }[] = [
  { nazwa: 'Dziś', pokaz: () => { render(<Dzis stan={stanLicznika({ projekt: 'Harbor Sweater', czesc: 'Left sleeve', skonczone: 42, dziergany: 43 })} dane={DANE} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} naPlus={jest.fn(async () => plusOk(43))}
    naCofnijSerie={jest.fn()} naOferty={jest.fn()} naKontynuuj={jest.fn()} naWybierzProjekt={jest.fn()} naUstawienia={jest.fn()} naPrzewodnik={jest.fn()} naKafel={jest.fn()} />); } },
  { nazwa: 'Projekt', pokaz: () => { render(<Projekt stan={PROJEKT} t={t} naOtworzCzesc={jest.fn()} naOtworzLicznik={jest.fn()} naDodajCzesc={jest.fn()} naDodajLicznik={jest.fn()} naNotatka={jest.fn()} naNarzedzie={jest.fn()} naTermin={jest.fn()}
    naEdytuj={jest.fn()} naKoniecEdycji={jest.fn()} naZrobTakaSama={jest.fn()} naUsunProjekt={jest.fn()} naUsunCzesc={jest.fn()} naUsunLicznik={jest.fn()} naWstecz={jest.fn()} naSesje={jest.fn()} naProbka={jest.fn()} naWloczka={jest.fn()} />); } },
  { nazwa: 'Historia', pokaz: () => { render(<HistoriaDni stan={stanHistorii(WIDOK_HISTORII, { j: { t, jezyk: () => 'en', zegar24h: () => true }, miesiac: '2026-10', wybrany: '2026-10-22', dzis: '2026-10-26' })} t={t}
    naWybierz={jest.fn()} naPoprzedni={jest.fn()} naNastepny={jest.fn()} naProjekt={jest.fn()} />); } },
  { nazwa: 'Ustawienia', pokaz: () => { render(<Ustawienia stan={{ pro: null, dni: { zostalo: 3, limit: 5, miesiac: 'November' }, wibracje: true }} t={t} system={atrapaSystemu()} adresy={{ polityka: 'https://example.invalid/p', wsparcie: 'https://example.invalid/s', recenzja: 'https://example.invalid/r' }}
    naOferty={jest.fn()} naWibracje={jest.fn()} naZglosProblem={jest.fn()} naStanDanych={jest.fn()} dane={{ naEksport: jest.fn(), naImport: jest.fn(), naUsunWszystko: jest.fn() }}
    preferencje={{ ekranNieGasnie: true, ukladMiar: 'auto', naEkranNieGasnie: jest.fn(), naMiary: jest.fn() }} jezyk={{ stan: { wartosc: 'auto', jezyk: 'en' }, naJezyk: jest.fn(), naZglosTlumaczenie: jest.fn() }} naZrodla={jest.fn()} />); } },
  { nazwa: 'Licencje', pokaz: () => { render(<Licencje t={t} naWstecz={jest.fn()} />); } },
];

describe('PU-135 · AX5: ekrany przewijają się do ostatniego elementu', () => {
  test.each(EKRANY)('PU-135: „$nazwa” przy AX5 ma kontener przewijania, a ostatni element ekranu leży wewnątrz niego', ({ pokaz }) => {
    pokaz();
    expect(kontenery().length).toBeGreaterThan(0);
    const wszystkieId = wszystkie();
    expect(wszystkieId.length).toBeGreaterThan(5);
    const ostatni = wszystkieId[wszystkieId.length - 1];
    expect([ostatni, wPrzewijaniu().has(ostatni)]).toEqual([ostatni, true]);
  });

  test('PU-135: licznik — treść (aż do „Historia”) w ScrollView, przyciski +1/−1 przypięte na dole poza nim', () => {
    render(<Licznik stan={stanLicznika({ projekt: 'Harbor', czesc: 'Back', skonczone: 1, dziergany: 2 })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
    const w = wPrzewijaniu();
    for (const id of ['licznik-projekt', 'licznik-wartosc', 'licznik-historia']) expect([id, w.has(id)]).toEqual([id, true]);
    for (const id of ['licznik-plus', 'licznik-minus']) expect([id, w.has(id), wszystkie().includes(id)]).toEqual([id, false, true]);
  });

  test('PU-135: „Oczko Pro” — plany w ScrollView arkusza, przyciski kupna przypięte poza nim', () => {
    render(<Oferty stan={{ produkty: { rodzaj: 'gotowe', produkty: [{ id: 'oczko.pro.miesiac', cenaWyswietlana: '4,99 zł', okres: 'miesiac' }, { id: 'oczko.pro.rok', cenaWyswietlana: '19,99 zł', okres: 'rok' }] }, aktywne: null, familySharing: true }} t={t}
      adresy={{ polityka: 'https://example.invalid/p', warunki: 'https://example.invalid/w' }} naKup={jest.fn()} naPrzywroc={jest.fn()} naZarzadzaj={jest.fn()} naOtworzAdres={jest.fn()} naZamknij={jest.fn()} />);
    const w = wPrzewijaniu();
    for (const id of ['oferty-kafel-dzien', 'oferty-kafel-dane', 'oferty-plan-miesieczny', 'oferty-plan-roczny']) expect([id, w.has(id)]).toEqual([id, true]);
    expect([w.has('oferty-kup'), wszystkie().includes('oferty-kup')]).toEqual([false, true]);
  });
});
