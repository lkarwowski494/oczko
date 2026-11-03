// Przekazanie 04 → 08 (M1-audytor-generalny-142, DEC-36 a; design-spec „Aneks M2 partia 3c1”): nieudany ZIP na ekranie awaryjnym → alert z kluczami kopii.
// Miejsce docelowe: tests/ekrany/ekran-awaryjny-kopia.test.tsx. Trwała kontrola klasy 512/517: EkranAwaryjny nie używa tekstów formularza.
// Wyrocznia: docs/design/fix15-2026-11-03/klucze.json (awaryjny.blad_kopii, awaryjny.blad_kopii_opis).
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

const WYR = JSON.parse(readFileSync(join(__dirname, '../../docs/design/fix15-2026-11-03/klucze.json'), 'utf8')) as { en: Record<string, string> };
const mockA = { zapiszKopie: jest.fn(), zipSurowej: jest.fn(), kopia: Promise.resolve(), sha: jest.fn(), nieudaneStarty: 0, etapPoprzedniegoStartu: null, bledyZKopii: [] };
jest.mock('../../src/kompozycja/start-aplikacji', () => ({
  ...jest.requireActual('../../src/kompozycja/start-aplikacji'),
  trybAwaryjny: () => mockA,
  sprobujNormalnieTeraz: jest.fn(async () => undefined),
}));
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({ udostepnijPlik: jest.fn(async () => undefined) }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { EkranAwaryjny } = require('../../src/kompozycja/EkranAwaryjny') as typeof import('../../src/kompozycja/EkranAwaryjny');

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
afterEach(() => jest.restoreAllMocks());

for (const [powod, wynikArchiwum] of [['brak_miejsca', 'brak_miejsca'], ['uszkodzony', null], ['petla-startow', null], ['wersja_nowsza', null]] as const) {
  test(`${powod}: archiwum i ZIP surowej kopii zawiodły → alert „Couldn’t save a copy” z kluczami kopii, nie formularza`, async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockA.zapiszKopie.mockResolvedValue(wynikArchiwum);
    mockA.zipSurowej.mockResolvedValue(null);
    render(<EkranAwaryjny powod={powod} t={t} naNormalnie={jest.fn()} />);
    fireEvent.press(screen.getByRole('button', { name: /copy/i }));
    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(alert.mock.calls[0]?.slice(0, 2)).toEqual([WYR.en['awaryjny.blad_kopii'], WYR.en['awaryjny.blad_kopii_opis']]);
    expect(alert.mock.calls[0]?.[0]).not.toBe(t('formularz.blad_zapisu'));
  });
}
test('trwała kontrola: EkranAwaryjny nie woła alertu błędu zapisu formularza', () => {
  expect(readFileSync(join(__dirname, '../../src/kompozycja/EkranAwaryjny.tsx'), 'utf8')).not.toMatch(/alertBleduZapisu\(t, 'formularz'\)/);
});
