// Bramka prośby o ocenę (P-150 E2-1a, P-156; kontrakt: docs/architektura/moduly.md „Prośba o ocenę”).
// Test roli 05 (fix-5, P-156 Q2a), przeniesiony przez 08 (partia 4, NZ-05-F5-08) z tests/akceptacja/domena/ w commicie z funkcją (DS-02). Wyrocznia: wektory PO-01–PO-11 (docs/wzrost.md, rola 11) z wejściami roli 05.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CzyProsicOOcene, WejscieProsby } from '../../src/domena/ocena';
import { niezaimplementowane } from '../../src/domena/zaslepka';

type Wektor = { id: string; wariant?: string; opis: string; wejscie: WejscieProsby; oczekiwane: boolean };
const { wektory } = JSON.parse(readFileSync(join(__dirname, '../../docs/architektura/wektory-prosby-o-ocene.json'), 'utf8')) as { wektory: Wektor[] };

const modul = jest.requireActual('../../src/domena/ocena') as { czyProsicOOcene?: CzyProsicOOcene };
const czyProsicOOcene: CzyProsicOOcene = modul.czyProsicOOcene ?? (() => niezaimplementowane('P-150 czyProsicOOcene'));

describe('P-150 prośba o ocenę: czyProsicOOcene', () => {
  test.each(wektory.map((w) => [`${w.id}${w.wariant ?? ''}`, w] as const))('P-150 %s', (_id, w) => {
    expect(czyProsicOOcene(w.wejscie)).toBe(w.oczekiwane);
  });

  test('P-150 PO-11: funkcja nie zmienia wejścia (zapis klucza robi przypadek użycia po wywołaniu systemowym)', () => {
    const wejscie: WejscieProsby = { zdarzenie: 'zamknieto_karte_ukonczenia', wersja: '1.0.0', ostatniaProsba: { wersja: '0.9.0', dzien: '2026-11-01' }, dzis: '2026-12-01', dostepna: true };
    const kopia = JSON.parse(JSON.stringify(wejscie));
    expect(czyProsicOOcene(wejscie)).toBe(true);
    expect(wejscie).toEqual(kopia);
  });
});
