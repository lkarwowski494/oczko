// Kopia liczb treści w domenie (src/domena/obliczenia/parametry.ts) = docs/tresci/parametry.json roli 06 (jak stany.ts a stany.json).
// Rola 08 (partia 1): granica ADR-0003 nie pozwala domenie importować z docs/; test pada, gdy 06 zmieni rejestr bez regeneracji kopii.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import parametry from '../../../docs/tresci/parametry.json';
import { CAL_W_CM, JARD_W_M, UNCJA_W_G, CZTERY_CALE_W_CM, DRUTY, SZYDELKA, GRUBOSC } from '../../../src/domena/obliczenia/parametry';

const stala = (n: string) => parametry.jednostki.find((p) => p.parametr === n)?.wartosc;

describe('P-081 P-084 P-086 parametry treści w domenie = rejestr roli 06', () => {
  test('stałe jednostek (JED-001, JED-002, JED-005, JED-006)', () => {
    expect({ CAL_W_CM, JARD_W_M, UNCJA_W_G, CZTERY_CALE_W_CM }).toEqual({ CAL_W_CM: stala('cal_w_cm'), JARD_W_M: stala('jard_w_m'), UNCJA_W_G: stala('uncja_w_g'), CZTERY_CALE_W_CM: stala('cztery_cale_w_cm') });
  });
  test('tabele drutów, szydełek i grubości (zbiory wierszy z rejestru, ta sama liczność)', () => {
    expect(DRUTY).toEqual(parametry.druty.map((d) => ({ mm: d.mm, us: d.us })));
    expect(SZYDELKA).toEqual(parametry.szydelka.map((d) => ({ mm: d.mm, us: d.us })));
    expect(GRUBOSC).toEqual(parametry.grubosc.map((g) => ({ kategoria: g.kategoria, min: g.proba_4in_min, max: g.proba_4in_max })));
    expect(DRUTY.length).toBeGreaterThan(0);
  });
  test('plik jest dokładnie wynikiem generatora (bez ręcznych zmian)', () => {
    expect(() => execFileSync('node', [join(__dirname, '../../../scripts/domena/generuj-parametry.mjs'), '--sprawdz'], { stdio: 'pipe' })).not.toThrow();
  });
});
