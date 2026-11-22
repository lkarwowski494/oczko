// Arkusz skrzynki importu na liście projektów (design-spec R2; P-230 Q2a, scenariusz 52): „N patterns to add”, lista projektów w toku + „New project”,
// „Not now” zostawia zlecenia; testID `skrzynka`, `skrzynka-projekt`. Nie nad licznikiem (P-046) — slot tylko w ListaProjektow.
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ArkuszSkrzynki } from '../../src/ekrany/WzorSkrzynka';
import { opisZlecenia } from '../../src/kompozycja/wzor-dodawanie';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

test('1 zlecenie: tytuł w liczbie pojedynczej, nazwa pliku, wybór projektu → naWybierz(projektId); „New project” → null', () => {
  const naWybierz = jest.fn();
  render(<ArkuszSkrzynki t={t} pozycje={[{ id: 'z1', nazwa: 'Harbor test pattern.pdf' }]} projekty={[{ id: 'p1', nazwa: 'Harbor Sweater' }, { id: 'p2', nazwa: 'Scarf' }]}
    naWybierz={naWybierz} naNieTeraz={jest.fn()} />);
  expect(screen.getByTestId('skrzynka')).toBeTruthy();
  expect(screen.getByText('1 pattern to add')).toBeTruthy();
  expect(screen.getByText('Harbor test pattern.pdf')).toBeTruthy();
  fireEvent.press(screen.getAllByTestId('skrzynka-projekt')[1]);
  expect(naWybierz).toHaveBeenLastCalledWith('p2');
  fireEvent.press(screen.getByRole('button', { name: 'New project' }));
  expect(naWybierz).toHaveBeenLastCalledWith(null);
});

test('2 zlecenia: „2 patterns to add”; „Not now” zamyka bez zmian', () => {
  const naNieTeraz = jest.fn();
  render(<ArkuszSkrzynki t={t} pozycje={[{ id: 'a', nazwa: 'a.pdf' }, { id: 'b', nazwa: 'b.pdf' }]} projekty={[]} naWybierz={jest.fn()} naNieTeraz={naNieTeraz} />);
  expect(screen.getByText('2 patterns to add')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Not now' }));
  expect(naNieTeraz).toHaveBeenCalled();
});

// R2 (design-spec :775) „z podglądem pliku”: pod nazwą rodzaj (jak `wzor.wiersz_opis`), bez miniatury (miniatura = natywna, plan 1.1 pkt 7).
test('podgląd pozycji: rodzaj pliku pod nazwą', () => {
  render(<ArkuszSkrzynki t={t} pozycje={[{ id: 'z1', nazwa: 'Harbor.pdf', opis: 'PDF' }, { id: 'z2', nazwa: 'video.example', opis: 'Video' }]} projekty={[]}
    naWybierz={jest.fn()} naNieTeraz={jest.fn()} />);
  expect(screen.getByText('PDF')).toBeTruthy();
  expect(screen.getByText('Video')).toBeTruthy();
});
test.each([
  [{ rodzaj: 'plik', typ: 'com.adobe.pdf', sciezki: ['a.pdf'] }, 'PDF'],
  [{ rodzaj: 'plik', typ: 'org.openxmlformats.wordprocessingml.document', sciezki: ['a.docx'] }, 'Word document'],
  [{ rodzaj: 'plik', typ: 'public.jpeg', sciezki: ['1.jpg'] }, 'Photo'],
  [{ rodzaj: 'plik', typ: 'public.jpeg', sciezki: ['1.jpg', '2.jpg', '3.jpg'] }, 'Photo · 3 pages'],
  [{ rodzaj: 'adres', typ: 'public.url', sciezki: [], adres: 'https://example.org/' }, 'Web page'],
  [{ rodzaj: 'film', typ: 'public.url', sciezki: [] }, 'Video'],
] as const)('opisZlecenia %j → %s', (zl, opis) => {
  expect(opisZlecenia({ id: 'z', nazwa: 'n', adres: null, projektId: null, utworzonoMs: 0, ...zl, sciezki: [...zl.sciezki] }, t)).toBe(opis);
});
