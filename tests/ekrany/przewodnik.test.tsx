// Przewodnik po funkcjach (KO-027; spec 04 `docs/design/przewodnik-2026-11-10.md` §1–§6; P-685–P-688, P-691): trasa `/przewodnik` na prawdziwej bazie
// (kroki zawsze widoczne, 9 grup, 42 wiersze zwinięte, jedna funkcja rozwinięta naraz, przeczytane zapisane, „Pokaż” według ostatniego miejsca),
// wejścia: „Dziś” (symbol z podpisem przed zębatką) i wiersz Ustawień nad „Help” z postępem; „Help” z symbolem `lifepreserver` (P-685).
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { Dzis, type PropsDzis } from '../../src/ekrany/Dzis';
import { Ustawienia } from '../../src/ekrany/Ustawienia';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { FUNKCJE, GRUPY } from '../../src/domena/przewodnik';
import { przeczytanePrzewodnika } from '../../src/przypadki-uzycia/przewodnik';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki, atrapaSystemu, plusOk, stanLicznika, tEn } from './pomoc';

const mockRouter = { back: jest.fn(), push: jest.fn(), navigate: jest.fn(), dismissAll: jest.fn(), dismissTo: jest.fn(), canDismiss: jest.fn(() => true) };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranPrzewodnika = (require('../../app/przewodnik') as { default: React.ComponentType }).default;

async function start(o: { zLicznikiem: boolean }) {
  const { s, k, j } = await kompozycjaTestowa();
  if (o.zLicznikiem) {
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3)]);
    await k.otworz('l1');
  }
  mockAplikacja = { kontener: { z: s.z, j }, licznik: k };
  render(<EkranPrzewodnika />);
  await screen.findByTestId('przewodnik');
  return { s };
}
beforeEach(() => { for (const f of [mockRouter.back, mockRouter.push, mockRouter.navigate, mockRouter.dismissAll, mockRouter.dismissTo]) f.mockClear(); });

describe('ekran /przewodnik', () => {
  test('tytuł, wstęp, 6 kroków z „Show”, 9 grup z nagłówkami, 42 wiersze zwinięte, postęp 0 z 42', async () => {
    await start({ zLicznikiem: false });
    expect(screen.getAllByRole('header').map((h) => h.props.children)).toEqual(expect.arrayContaining(['Guide', 'First steps', 'Feature library']));
    expect(screen.getByText('First steps and every feature. “Show” opens the screen.')).toBeTruthy();
    for (let n = 1; n <= 6; n++) {
      expect(screen.getByTestId(`przewodnik-krok-${n}`)).toBeTruthy();
      expect(screen.getByTestId(`przewodnik-krok-${n}-pokaz`)).toHaveTextContent(/Show/);
    }
    expect(screen.getByTestId('przewodnik-krok-1')).toHaveTextContent(/On “Today”, tap “\+1”/);
    for (const g of GRUPY) expect(screen.getByTestId(`przewodnik-grupa-${g.id}`)).toBeTruthy();
    for (const f of FUNKCJE) expect(screen.getByTestId(`przewodnik-f-${f.id}`).props.accessibilityState).toMatchObject({ expanded: false });
    expect(screen.queryAllByTestId(/^przewodnik-f-.*-opis$/)).toHaveLength(0);
    expect(screen.getByTestId('przewodnik-postep')).toHaveTextContent('Read: 0 of 42');
  });

  test('rozwinięcie: opis i „Show”, etykieta VoiceOver z grupą i stanem, zapis przeczytanej, postęp; drugie rozwinięcie zwija pierwsze', async () => {
    const { s } = await start({ zLicznikiem: false });
    expect(screen.getByTestId('przewodnik-f-cel').props.accessibilityLabel).toBe('Set a goal for this part, Counter, not read');
    fireEvent.press(screen.getByTestId('przewodnik-f-cel'));
    await waitFor(() => expect(screen.getByTestId('przewodnik-postep')).toHaveTextContent('Read: 1 of 42'));
    expect(screen.getByTestId('przewodnik-f-cel-opis')).toHaveTextContent(/^Rows in this part\./);
    expect(screen.getByTestId('przewodnik-f-cel').props.accessibilityState).toMatchObject({ expanded: true });
    expect(screen.getByTestId('przewodnik-f-cel').props.accessibilityLabel).toBe('Set a goal for this part, Counter, read');
    expect(screen.getByTestId('przewodnik-f-cel-pokaz').props.accessibilityLabel).toBe('Show: Set a goal for this part');
    expect(await przeczytanePrzewodnika(s.z)).toEqual({ ok: true, wartosc: ['cel'] });
    fireEvent.press(screen.getByTestId('przewodnik-f-kosz'));
    await waitFor(() => expect(screen.getByTestId('przewodnik-postep')).toHaveTextContent('Read: 2 of 42'));
    expect(screen.queryByTestId('przewodnik-f-cel-opis')).toBeNull();
    expect(screen.getByTestId('przewodnik-f-kosz-opis')).toBeTruthy();
    fireEvent.press(screen.getByTestId('przewodnik-f-kosz')); // zwinięcie
    expect(screen.queryAllByTestId(/^przewodnik-f-.*-opis$/)).toHaveLength(0);
  });

  test('„Show” z miejscem pracy: licznik i projekt pchane na stos; zakładka przez zamknięcie stosu', async () => {
    await start({ zLicznikiem: true });
    fireEvent.press(screen.getByTestId('przewodnik-f-cel'));
    fireEvent.press(await screen.findByTestId('przewodnik-f-cel-pokaz'));
    await waitFor(() => expect(mockRouter.push).toHaveBeenLastCalledWith('/licznik'));
    fireEvent.press(screen.getByTestId('przewodnik-f-dodaj-licznik'));
    fireEvent.press(await screen.findByTestId('przewodnik-f-dodaj-licznik-pokaz'));
    await waitFor(() => expect(mockRouter.push).toHaveBeenLastCalledWith({ pathname: '/projekt/[id]', params: { id: 'p1' } }));
    fireEvent.press(screen.getByTestId('przewodnik-krok-6-pokaz'));
    await waitFor(() => expect(mockRouter.navigate).toHaveBeenLastCalledWith('/projekty'));
    expect(mockRouter.dismissAll).toHaveBeenCalled();
    expect(screen.getByTestId('przewodnik-krok-2-pokaz').props.accessibilityLabel).toBe('Show: Step 2 of 6');
  });

  test('„Show” bez miejsca pracy: licznik → „Today” (karta „First counter”), projekt → „Projects”', async () => {
    await start({ zLicznikiem: false });
    fireEvent.press(screen.getByTestId('przewodnik-krok-2-pokaz'));
    await waitFor(() => expect(mockRouter.navigate).toHaveBeenLastCalledWith('/'));
    expect(mockRouter.push).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('przewodnik-f-termin'));
    fireEvent.press(await screen.findByTestId('przewodnik-f-termin-pokaz'));
    await waitFor(() => expect(mockRouter.navigate).toHaveBeenLastCalledWith('/projekty'));
  });

  test('Apple Watch bez „Show”; opis Pro z limitem z konfiguracji; Oczko Pro prowadzi do Ustawień, nie do ofert', async () => {
    await start({ zLicznikiem: false });
    fireEvent.press(screen.getByTestId('przewodnik-f-zegarek'));
    expect(await screen.findByTestId('przewodnik-f-zegarek-opis')).toBeTruthy();
    expect(screen.queryByTestId('przewodnik-f-zegarek-pokaz')).toBeNull();
    fireEvent.press(screen.getByTestId('przewodnik-f-pro'));
    expect(await screen.findByTestId('przewodnik-f-pro-opis')).toHaveTextContent(/free crafting days a month: 5;/);
    fireEvent.press(screen.getByTestId('przewodnik-f-pro-pokaz'));
    await waitFor(() => expect(mockRouter.dismissTo).toHaveBeenLastCalledWith('/ustawienia'));
  });

  test('Q-001: „Show” funkcji Ustawień wraca do istniejącej trasy /ustawienia (dismissTo), nie kładzie na stos drugiej kopii', async () => {
    await start({ zLicznikiem: false });
    for (const id of ['wibracje', 'ekran', 'eksport', 'usun', 'pro']) {
      fireEvent.press(screen.getByTestId(`przewodnik-f-${id}`));
      fireEvent.press(await screen.findByTestId(`przewodnik-f-${id}-pokaz`));
      await waitFor(() => expect(mockRouter.dismissTo).toHaveBeenLastCalledWith('/ustawienia'));
    }
    expect(mockRouter.dismissTo).toHaveBeenCalledTimes(5);
    expect(mockRouter.push).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('przewodnik-f-jednostki')); // inne ekrany Ustawień zostają pchane (wstecz wraca do przewodnika)
    fireEvent.press(await screen.findByTestId('przewodnik-f-jednostki-pokaz'));
    await waitFor(() => expect(mockRouter.push).toHaveBeenLastCalledWith('/miary'));
    expect(mockRouter.dismissTo).toHaveBeenCalledTimes(5);
  });
});

describe('wejścia (P-685)', () => {
  let t: Tlumacz;
  beforeAll(async () => { t = await tEn(); });

  test('„Today”: przycisk „Guide” z widocznym podpisem przed zębatką, otwiera przewodnik', () => {
    const p: PropsDzis = {
      stan: stanLicznika({ projekt: 'Mist Sweater', czesc: 'Left sleeve', skonczone: 42, dziergany: 43, cel: 96 }), dane: null, t, oglos: jest.fn(), haptyka: atrapaHaptyki(),
      naPlus: jest.fn(async () => plusOk(43)), naCofnijSerie: jest.fn(), naOferty: jest.fn(), naKontynuuj: jest.fn(), naWybierzProjekt: jest.fn(), naUstawienia: jest.fn(), naPrzewodnik: jest.fn(),
    };
    render(<Dzis {...p} />);
    const przycisk = screen.getByTestId('nav-przewodnik');
    expect(przycisk.props.accessibilityLabel).toBe('Guide');
    expect(within(przycisk).getByText('Guide')).toBeTruthy();
    expect(within(przycisk).getByTestId('symbol-questionmark.circle', { includeHiddenElements: true })).toBeTruthy();
    const ids = screen.UNSAFE_root.findAll((n) => typeof n.props.testID === 'string' && /^nav-(przewodnik|ustawienia)$/.test(n.props.testID) && typeof n.type !== 'string').map((n) => n.props.testID as string);
    expect([...new Set(ids)]).toEqual(['nav-przewodnik', 'nav-ustawienia']);
    fireEvent.press(przycisk);
    expect(p.naPrzewodnik).toHaveBeenCalledTimes(1);
  });

  test('Ustawienia: wiersz „Guide” z postępem bezpośrednio nad „Help”; „Help” z symbolem lifepreserver', () => {
    const naPrzewodnik = jest.fn();
    render(<Ustawienia stan={{ pro: null, dni: null, wibracje: true }} t={t} system={atrapaSystemu()} adresy={{ polityka: 'https://example.invalid/p', wsparcie: 'https://example.invalid/s', recenzja: 'https://example.invalid/r' }}
      naOferty={jest.fn()} naWibracje={jest.fn()} naZglosProblem={jest.fn()} naStanDanych={jest.fn()} przewodnik={{ postep: { n: 3, m: 42 }, naPrzewodnik }} />);
    const wiersz = screen.getByTestId('ustawienia-przewodnik');
    expect(wiersz).toHaveTextContent(/Guide/);
    expect(wiersz).toHaveTextContent(/3 of 42/);
    expect(within(wiersz).getByTestId('symbol-questionmark.circle', { includeHiddenElements: true })).toBeTruthy();
    expect(within(screen.getByTestId('ustawienia-pomoc')).getByTestId('symbol-lifepreserver', { includeHiddenElements: true })).toBeTruthy();
    expect(within(screen.getByTestId('ustawienia-pomoc')).queryByTestId('symbol-questionmark.circle', { includeHiddenElements: true })).toBeNull();
    const kolejnosc = screen.UNSAFE_root.findAll((n) => typeof n.props.testID === 'string' && /^ustawienia-(stan-danych|przewodnik|pomoc)$/.test(n.props.testID) && typeof n.type !== 'string').map((n) => n.props.testID as string);
    expect([...new Set(kolejnosc)]).toEqual(['ustawienia-stan-danych', 'ustawienia-przewodnik', 'ustawienia-pomoc']);
    fireEvent.press(wiersz);
    expect(naPrzewodnik).toHaveBeenCalledTimes(1);
  });
});
