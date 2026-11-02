// E2E-A4 (P-358 opcja 1): okno strażnika serii (RD-17) przychodzi z zależności `straznikOknoS` (kompozycja ustawia je z argumentu E2E);
// bez niego obowiązuje STRAZNIK_OKNO_S = 2 s. Trzy dodania co 2,5 s nie są serią w oknie 2 s, w oknie 6 s są. Prawdziwa baza (node:sqlite).
import { historiaLicznika } from '../../src/przypadki-uzycia/widok-licznika';
import { widokLicznika } from '../../src/przypadki-uzycia/widok-licznika';
import { czesc, licznik, projekt, ustawGlowe, zdarzenie, type Instr } from './pomocnicze/dane-wejsciowe';
import { DOBA, MIN, T0, przygotuj, wykonaj } from './pomocnicze/srodowisko';

const START = T0 + 14 * MIN;
const ODSTEP_MS = 2500; // wolna maszyna: 3 stuknięcia w 5 s (#135: 4,18 s)
function trzyDodania(id: string, od: number): Instr[] {
  const w: Instr[] = [];
  for (let i = 1; i <= 3; i++) w.push(zdarzenie(`${id}-s${i}`, id, 'plus', od + i, i > 1 ? [`${id}-s${i - 1}`] : od ? [`${id}-z${od}`] : [], START + (i - 1) * ODSTEP_MS));
  w.push(ustawGlowe(id, od + 3, `${id}-s3`));
  return w;
}
async function start() {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 30, { t: T0 - 5 * DOBA }), ...trzyDodania('l1', 30)]);
  s.zegar.ustaw(START + 10 * MIN);
  return s;
}
const widok = async (z: Parameters<typeof widokLicznika>[0]) => {
  const w = await widokLicznika(z, { licznikId: 'l1' });
  if (!w.ok) throw new Error(w.powod);
  return w.wartosc;
};

test('bez straznikOknoS: okno 2 s z konfiguracji — trzy dodania co 2,5 s to nie seria', async () => {
  const s = await start();
  expect((await widok(s.z)).seria).toBeNull();
});

test('straznikOknoS = 6: te same dodania to seria 3 wierszy (widok licznika)', async () => {
  const s = await start();
  expect((await widok({ ...s.z, straznikOknoS: 6 })).seria).toMatchObject({ ile: 3, odZdarzeniaId: 'l1-s1' });
});

test('straznikOknoS = 6: seria jest też jednym wpisem „Undo” na końcu historii', async () => {
  const s = await start();
  const h = await historiaLicznika({ ...s.z, straznikOknoS: 6 }, { licznikId: 'l1' });
  if (!h.ok) throw new Error(h.powod);
  expect(h.wartosc[0].seria).toMatchObject({ ile: 3 });
  const bez = await historiaLicznika(s.z, { licznikId: 'l1' });
  if (!bez.ok) throw new Error(bez.powod);
  expect(bez.wartosc[0].seria).toBeNull();
});
