// 07-jakosc-025 (BR-LIC-006, F-04, design-spec „Partia 8”, 025): licznik oczek mówi „stitch”, nie „row”, i nie ma tego, co dotyczy rzędów.
// Stan ekranu z prawdziwej kompozycji na prawdziwej bazie (licznik oczek w projekcie z licznikiem rzędów), ekran z prawdziwym t() z en.json.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Licznik, type StanEkranuLicznika } from '../../src/ekrany/Licznik';
import { MenuCel, MenuProjektu } from '../../src/ekrany/MenuProjektu';
import { wykonanieDnia } from '../../src/dane/repozytoria/dni';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki, tEn, wywolaniaLicznika } from './pomoc';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: 1 }) }));

const sql = (q: string, ...p: unknown[]): [string, unknown[]] => [q, p];
async function stanOczek(): Promise<{ stan: StanEkranuLicznika; s: Awaited<ReturnType<typeof kompozycjaTestowa>>['s'] }> {
  const { s, k } = await kompozycjaTestowa();
  s.pro.wartosc = true;
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 20), ...licznik('l2', 'c1', 5, { rodzaj: 'oczka', kolejnosc: 2 }),
    sql('UPDATE czesc SET cel_rzedow = 96 WHERE id = ?', 'c1'), sql('UPDATE projekt SET termin_dzien = ? WHERE id = ?', '2026-10-31', 'p1'),
    sql("INSERT INTO przypomnienie (id, licznik_id, od_rzedu, co_n, razy, tekst, zmieniono_ms) VALUES ('r1', 'l2', 6, 6, 5, 'x', 1)"),
    sql('UPDATE licznik SET dlugosc_powtorzenia = 4, znaczenie = ? WHERE id = ?', 'w_trakcie', 'l2')]);
  await k.otworz('l2');
  return { stan: await k.dzialania.odswiez!(), s };
}
const pokaz = async (stan: StanEkranuLicznika) => {
  const t = await tEn();
  const w = wywolaniaLicznika();
  render(<Licznik stan={stan} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...w} />);
};

test('025: model ekranu oczek nie niesie celu, celu dnia, przypomnienia, powtórzenia ani rzędu w robocie', async () => {
  const { stan } = await stanOczek();
  expect(stan).toMatchObject({ rodzaj: 'oczka', skonczone: 5, znaczenie: 'skonczone', cel: null, celDnia: null, przypomnienie: null, powtorzenie: null, calosc: null, blizniak: null, baner: null });
});
test('025: ekran oczek: „stitches”, „+1 stitch”, etykiety „Add stitch”/„Remove stitch”, bez „Now knitting row” i bez słowa „row”', async () => {
  const { stan } = await stanOczek();
  await pokaz(stan);
  expect(screen.getByTestId('licznik-wartosc').props.accessibilityLabel).toBe('5');
  expect(screen.getByText('stitches')).toBeTruthy();
  expect(screen.getByText('+1 stitch')).toBeTruthy();
  expect(screen.getByLabelText('Remove stitch')).toBeTruthy();
  expect(screen.getByLabelText(/^Add stitch/)).toBeTruthy();
  expect(screen.queryByTestId('licznik-teraz-rzad')).toBeNull();
  expect(screen.queryByText(/\brows?\b/i)).toBeNull();
});
test('025: menu licznika oczek bez „Reminders”, powtórzenia, celu i trybu rzędu; licznik rzędów je ma', async () => {
  const t = await tEn();
  const akcje = { naNazwa: jest.fn(), naCel: jest.fn(), naPrzypomnienie: jest.fn(), naPowtorzenie: jest.fn(), naWpisz: jest.fn(), naZablokuj: jest.fn(), naOdblokuj: jest.fn(), naZeruj: jest.fn(), naUkoncz: jest.fn(), naZamknij: jest.fn(), naZnaczenie: jest.fn() };
  // M3 p3a: cel i przypomnienie są w arkuszu „Cel” (`MenuCel`, akcja `licznik-cel`, której licznik oczek nie ma — tests/ekrany/licznik-akcje.test.tsx); w ••• zostaje „znaczenie liczby”.
  const { unmount } = render(<MenuProjektu stan={{ projekt: 'Sweter', zablokowany: false, wartosc: 5, oczka: true }} t={t} {...akcje} />);
  for (const id of ['menu-cel', 'menu-przypomnienie', 'menu-znaczenie']) expect(screen.queryByTestId(id)).toBeNull();
  expect(screen.getByTestId('menu-wpisz-wartosc')).toBeTruthy();
  unmount();
  render(<MenuProjektu stan={{ projekt: 'Sweter', zablokowany: false, wartosc: 5 }} t={t} {...akcje} />);
  expect(screen.getByTestId('menu-znaczenie')).toBeTruthy();
  screen.unmount();
  render(<MenuCel stan={{ projekt: 'Sweter', przypomnienia: 0 }} t={t} {...akcje} />);
  for (const id of ['menu-cel', 'menu-przypomnienie']) expect(screen.getByTestId(id)).toBeTruthy();
});
test('025 (podsumowania): +1 na liczniku oczek nie wchodzi do rzędów dnia', async () => {
  const { s } = await stanOczek();
  expect(await wykonanieDnia(s.baza, s.zegar.teraz().dzien)).toEqual({ rzedy: 20 }); // 20 rzędów l1; 5 oczek l2 poza sumą
});
