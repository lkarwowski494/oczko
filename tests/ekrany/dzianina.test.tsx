// M3 p1 (ADR-0034 Potwierdzenie; design-spec:17): render bez własnej atrapy, jeden element „obraz”, etykieta z propsu (z t() u wywołującego), bez <Text> w rysunku,
// ruch 180 ms przy zmianie rzędów, „Ogranicz ruch” = zmiana natychmiast.
import React from 'react';
import { Animated, AccessibilityInfo } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import tokeny from '../../docs/design/tokeny.json';
import { Dzianina } from '../../src/ekrany/Dzianina';

const ETYKIETA = 'Rękaw lewy: 48 z 96 rzędów, dziś 12, następne w rzędzie 60';
const dane = { gotowe: 48, cel: 96, dzis: 12, przypomnienie: 60 };
afterEach(() => jest.restoreAllMocks());

describe('<Dzianina>', () => {
  test('jeden element dostępności z rolą obrazu i etykietą z propsu; części rysunku niedostępne osobno', () => {
    render(<Dzianina {...dane} etykieta={ETYKIETA} szerokosc={80} wysokosc={120} testID="dz" />);
    const el = screen.getByTestId('dz');
    expect(el.props.accessible).toBe(true);
    expect(el.props.accessibilityRole).toBe('image');
    expect(el.props.accessibilityLabel).toBe(ETYKIETA);
    expect(screen.getByLabelText(ETYKIETA)).toBe(el);
  });
  test('rysunek zawiera Pattern oczek „V”, dzianinę, linię celu, igłę i ząbek; bez elementu Text', () => {
    render(<Dzianina {...dane} etykieta={ETYKIETA} szerokosc={80} wysokosc={120} testID="dz" />);
    for (const id of ['dz-oczka', 'dz-dzianina', 'dz-pas-dzis', 'dz-linia-celu', 'dz-igla', 'dz-zabek']) expect(screen.getByTestId(id, { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByTestId('dz-tekst', { includeHiddenElements: true })).toBeNull();
    expect(JSON.stringify(screen.toJSON())).not.toContain('RNSVGText');
  });
  test('stany: 0 rzędów = sama igła (bez dzianiny i pasa); bez celu = bez linii celu; bez przypomnienia = bez ząbka', () => {
    render(<Dzianina gotowe={0} cel={null} dzis={0} przypomnienie={null} etykieta="x" szerokosc={80} wysokosc={120} testID="dz" />);
    expect(screen.getByTestId('dz-igla', { includeHiddenElements: true })).toBeTruthy();
    for (const id of ['dz-dzianina', 'dz-pas-dzis', 'dz-linia-celu', 'dz-zabek']) expect(screen.queryByTestId(id, { includeHiddenElements: true })).toBeNull();
  });
  test('zmiana liczby rzędów animuje 180 ms (tokeny ruch.rzadOczek), „Ogranicz ruch” = bez animacji', async () => {
    expect((tokeny as any).ruch.rzadOczek).toBe(180);
    const timing = jest.spyOn(Animated, 'timing');
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const pierwszy = render(<Dzianina {...dane} etykieta="a" szerokosc={80} wysokosc={120} testID="dz" />);
    const rerender = pierwszy.rerender;
    await act(async () => { await Promise.resolve(); });
    rerender(<Dzianina {...dane} gotowe={49} etykieta="a" szerokosc={80} wysokosc={120} testID="dz" />);
    expect(timing).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ duration: 180 }));
    timing.mockClear();
    pierwszy.unmount(); // odmontowanie zdejmuje subskrypcję „Ogranicz ruch”; kolejny render pyta system od nowa
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const m = render(<Dzianina {...dane} etykieta="a" szerokosc={80} wysokosc={120} testID="dz2" />);
    await act(async () => { await Promise.resolve(); });
    m.rerender(<Dzianina {...dane} gotowe={50} etykieta="a" szerokosc={80} wysokosc={120} testID="dz2" />);
    expect(timing).not.toHaveBeenCalled();
  });
});
