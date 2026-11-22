// Diagnostyka uszkodzonej linii dziennika (ADR-0008 (3′), kontrakt 05 fix-3, 71138d7; test roli 08 z kontraktu, do przeglądu 07):
// wpis `blad` ma całą linię `{ linia, tekst ≤ 4096 }`, a ta sama linia (samotny ucięty ogon, którego R-024 nie pozwala skrócić)
// nie dostaje drugiego wpisu przy kolejnym scaleniu.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { utworzDziennikNode } from '../../src/dane/dziennik';
import { scalDziennik } from '../../src/przypadki-uzycia/dziennik';
import { przygotuj } from './pomocnicze/srodowisko';

const wzorce = JSON.parse(readFileSync(join(__dirname, '../wspolne/wzorce.json'), 'utf8')) as { dopisanie: { id: string; przed: string }[] };
const przed = (id: string) => wzorce.dopisanie.find((w) => w.id === id)?.przed ?? '';
/** Ucięty ogon wektora D-03 (bajty po ostatnim `\n`). */
const ogon = przed('D-03').slice(przed('D-03').lastIndexOf('\n') + 1);
const wpisy = async (s: Awaited<ReturnType<typeof przygotuj>>) =>
  (await s.baza.all<{ kod: string; szczegoly: string }>("SELECT kod, szczegoly FROM blad WHERE kod = 'dziennik_uszkodzona_linia' ORDER BY id"))
    .map((w) => JSON.parse(w.szczegoly) as unknown);

describe('ADR-0008 (3′) wpis blad dla uszkodzonej linii dziennika', () => {
  test('dwa scalenia pliku z samym uciętym ogonem → 1 wiersz blad z pełnym tekstem linii', async () => {
    const s = await przygotuj();
    const plik = join(s.katalog, 'dziennik-plus.jsonl');
    writeFileSync(plik, ogon);
    const z = { ...s.z, dziennik: utworzDziennikNode(plik, s.baza) };
    await scalDziennik(z);
    await scalDziennik(z);
    expect(await wpisy(s)).toEqual([{ linia: 1, tekst: ogon }]);
    expect(readFileSync(plik, 'utf8')).toBe(ogon); // 0 przyjętych linii: bez skracania (R-024)
  });

  test('tekst linii dłuższej niż 4096 znaków ucięty do 4096', async () => {
    const s = await przygotuj();
    const plik = join(s.katalog, 'dziennik-plus.jsonl');
    const dluga = `{"id":"${'x'.repeat(5000)}`;
    writeFileSync(plik, `${dluga}\n`);
    await utworzDziennikNode(plik, s.baza).odczytaj();
    expect(await wpisy(s)).toEqual([{ linia: 1, tekst: dluga.slice(0, 4096) }]);
  });
});
