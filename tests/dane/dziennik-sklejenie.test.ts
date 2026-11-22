// Dziennik +1: ucięta ostatnia linia a kolejne dopisanie (ADR-0008 (8), P-123 pkt 12, P-124: A + S + R). Test roli 05 (fix-3), w głównym zestawie od partii 3 roli 08 (DS-02):
// był czerwony na asercji (S-01, S-03, K-01–K-03: odczyt nie odzyskiwał zdarzenia ze sklejonej linii, `skroc` zostawiał ucięty ogon); zazielenia src/dane/dziennik.ts.
// Wyrocznia: wektory `sklejenie`, `skrocenie`, `dopisanie` w tests/wspolne/wzorce.json (te same czyta XCTest: X-DZ-05, X-DZ-12, X-DZ-13).
// Zapis linii (A) jest po stronie Swift (jedyny pisarz, `DziennikPlus`); tu tylko odczyt wyniku D-03.
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { PortBazy } from '../../src/domena/porty';
import { parsujDziennik, utworzDziennikNode } from '../../src/dane/dziennik';

type Sklejenie = { id: string; tekst: string; przyjete_id: string[]; odrzucone_linie: number[]; odzyskane: { linia: number; id: string }[] };
type Skrocenie = { id: string; tekst: string; do_id: string; po: string };
type Dopisanie = { id: string; przed: string; linia: string; po: string; przyjete_id?: string[]; odrzucone_linie?: number[] };
const wzorce = JSON.parse(readFileSync(join(__dirname, '../wspolne/wzorce.json'), 'utf8')) as { sklejenie: Sklejenie[]; skrocenie: Skrocenie[]; dopisanie: Dopisanie[] };
// `skroc` nie dotyka bazy (zapis diagnostyki jest w `odczytaj`).
const bezBazy = {} as PortBazy;
// Wektory, które już dziś przechodzą (pułapka i zachowanie bez ogona) — kontrola, że poprawka ich nie zepsuje.
const JUZ_DZIALA: Record<string, string> = { 'S-02': 'pułapka bez odzyskania', 'K-04': 'skrócenie bez ogona jak dotąd' };
const nazwa = (id: string) => (JUZ_DZIALA[id] ? `[ZIELONY-OK: ${JUZ_DZIALA[id]}] ${id}` : id);

describe('ADR-0008 (8) dziennik: wektory w manifeście (wykonano N z N)', () => {
  test('[ZIELONY-OK: kontrola liczności manifestu] P-124: sklejenie ≥ 3, skrocenie ≥ 4, dopisanie ≥ 3, id bez powtórzeń', () => {
    const id = [...wzorce.sklejenie, ...wzorce.skrocenie, ...wzorce.dopisanie].map((w) => w.id);
    expect([wzorce.sklejenie.length >= 3, wzorce.skrocenie.length >= 4, wzorce.dopisanie.length >= 3]).toEqual([true, true, true]);
    expect(new Set(id).size).toBe(id.length);
  });
});

describe('ADR-0008 (8R) odczyt sklejonej linii (R-023)', () => {
  test.each(wzorce.sklejenie.map((w) => [nazwa(w.id), w] as const))('P-124 %s: przyjęte zdarzenia i linie zgłoszone jak w wektorze', (_n, w) => {
    const { zdarzenia, uszkodzone } = parsujDziennik(w.tekst);
    expect({ przyjete: zdarzenia.map((z) => z.id), uszkodzone }).toEqual({ przyjete: w.przyjete_id, uszkodzone: w.odrzucone_linie });
  });
});

describe('ADR-0008 (8S) skrócenie usuwa ucięty ogon (R-022)', () => {
  test.each(wzorce.skrocenie.map((w) => [nazwa(w.id), w] as const))('P-124 %s: plik po skroc(do_id) = wektor', async (_n, w) => {
    const plik = join(mkdtempSync(join(tmpdir(), 'dziennik-')), 'dziennik-plus.jsonl');
    writeFileSync(plik, w.tekst);
    await utworzDziennikNode(plik, bezBazy).skroc(w.do_id);
    expect(readFileSync(plik, 'utf8')).toBe(w.po);
  });
});

describe('ADR-0008 (8A) plik po dopisaniu z regułą \\n czytelny w TS', () => {
  test.each(wzorce.dopisanie.filter((w) => w.przyjete_id).map((w) => [w.id, w] as const))(
    '[ZIELONY-OK: odczyt już pomija uciętą linię zakończoną \\n] P-124 %s: stuknięcie po ogonie przyjęte', (_n, w) => {
      expect(w.po.startsWith(w.przed)).toBe(true);
      const { zdarzenia, uszkodzone } = parsujDziennik(w.po);
      expect({ przyjete: zdarzenia.map((z) => z.id), uszkodzone }).toEqual({ przyjete: w.przyjete_id, uszkodzone: w.odrzucone_linie });
    });
});
