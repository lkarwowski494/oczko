// PU-298 (katalog przypadków użycia, „Wzory”): udostępniony wzór bez projektu → arkusz „1 pattern to add” → „Not now” → po restarcie (nowa kompozycja na tej samej skrzynce) arkusz wraca →
// „New project” zakłada projekt z tym wzorem; wariant: uszkodzony plik → alert „… wasn’t added” z „It may be damaged…”, po „OK” zlecenie znika ze skrzynki.
// Prawdziwa skrzynka w katalogu (App Group), prawdziwe przetworzSkrzynke / kompozycjaWzoru / SkrzynkaNaEkranie na bazie node:sqlite; atrapa tylko konwersji PDF (port natywny).
import React from 'react';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Alert, type AlertButton } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SkrzynkaNaEkranie } from '../../src/kompozycja/SkrzynkaNaEkranie';
import { kompozycjaWzoru } from '../../src/kompozycja/wzor';
import { migawkaWKatalogu } from '../../src/platforma/migawka';
import { skrzynkaWKatalogu } from '../../src/platforma/skrzynka';
import type { KonwersjaPlatformy } from '../../src/przypadki-uzycia/wzor';
import { czasWTle, jeden, katalogTymczasowy, przygotuj, ile } from '../dane/pomocnicze/srodowisko';
import { tEn } from './pomoc';

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n');
/** Zlecenie jak zapisuje je rozszerzenie: plik, potem manifest `zlecenie.json` (ścieżka pliku względna), bez projektu. */
function zlecenie(grupa: string, id: string, nazwa: string): void {
  const k = join(grupa, 'skrzynka', id);
  mkdirSync(k, { recursive: true });
  writeFileSync(join(k, nazwa), PDF);
  writeFileSync(join(k, 'zlecenie.json'), JSON.stringify({ id, rodzaj: 'plik', nazwa, sciezki: [nazwa], adres: null, typ: 'application/pdf', projektId: null, utworzonoMs: 1 }));
}
const konwersja: KonwersjaPlatformy = {
  async naPdf() { return { ok: false, powod: 'bledne_dane' }; },
  async sprawdzPdf(sciezka) { return sciezka.endsWith('.pdf') && !sciezka.includes('zepsuty') ? { ok: true, wartosc: { strony: 1 } } : { ok: false, powod: 'uszkodzony' }; },
};

test('PU-298: „Not now” → arkusz wraca po restarcie → „New project” zakłada projekt z wzorem; uszkodzony plik → alert „wasn’t added” z „It may be damaged…” i znika po „OK”', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const t = await tEn();
  const s = await przygotuj();
  const grupa = katalogTymczasowy('oczko-grupa-');
  const skrzynka = skrzynkaWKatalogu(grupa, () => s.zegar.teraz().ms);
  const zw = { ...s.z, konwersja, czasWTle, skrzynka, migawka: migawkaWKatalogu(grupa, () => s.zegar.teraz().ms), jezyk: () => 'en' };
  const uruchom = async () => { const kw = kompozycjaWzoru(zw, { grupa, zlecenieE2e: null }); await kw.poStarcie(); return kw; }; // „start aplikacji”
  zlecenie(grupa, 'z1', 'Harbor.pdf');

  let kw = await uruchom();
  const r = render(<SkrzynkaNaEkranie wz={kw} t={t} projekty={async () => []} naPoWyborze={jest.fn()} />);
  expect(await screen.findByText('1 pattern to add')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Not now' }));
  await waitFor(() => expect(screen.queryByText('1 pattern to add')).toBeNull());
  expect(await ile(s.baza, 'projekt')).toBe(0);
  expect(existsSync(join(grupa, 'skrzynka', 'z1'))).toBe(true);
  r.unmount();

  kw = await uruchom(); // restart: nowa kompozycja czyta tę samą skrzynkę
  render(<SkrzynkaNaEkranie wz={kw} t={t} projekty={async () => []} naPoWyborze={jest.fn()} />);
  expect(await screen.findByText('1 pattern to add')).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'New project' })); await new Promise((x) => setTimeout(x, 150)); });
  await waitFor(() => expect(screen.queryByText('1 pattern to add')).toBeNull());
  expect(await jeden(s.baza, 'SELECT p.nazwa AS projekt, w.nazwa AS wzor, w.zrodlo FROM wzor w JOIN projekt p ON p.id = w.projekt_id')).toEqual({ projekt: 'Harbor', wzor: 'Harbor', zrodlo: 'pdf' });
  expect(existsSync(join(grupa, 'skrzynka', 'z1'))).toBe(false);

  zlecenie(grupa, 'z2', 'zepsuty.pdf'); // wariant: uszkodzony plik
  kw = await uruchom();
  render(<SkrzynkaNaEkranie wz={kw} t={t} projekty={async () => []} naPoWyborze={jest.fn()} />);
  expect(await screen.findByText('1 pattern to add')).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'New project' })); await new Promise((x) => setTimeout(x, 150)); }); // import pliku się nie udaje
  await waitFor(() => expect(alert).toHaveBeenCalledWith('“zepsuty.pdf” wasn’t added', 'It may be damaged. Download or save it again, then add it.', expect.anything()));
  expect(existsSync(join(grupa, 'skrzynka', 'z2'))).toBe(true);
  await act(async () => { (alert.mock.calls.at(-1)?.[2] as AlertButton[])[0]?.onPress?.(); await new Promise((x) => setTimeout(x, 100)); });
  expect(existsSync(join(grupa, 'skrzynka', 'z2'))).toBe(false);
  expect(await ile(s.baza, 'wzor')).toBe(1);
  alert.mockRestore();
});
