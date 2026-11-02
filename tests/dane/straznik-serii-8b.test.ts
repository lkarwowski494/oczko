// 07-jakosc-014 (BR-LIC-019 S3, S5, S7; RD-17, L-06, L-19): strażnik serii zna rodzaj licznika (oczka bez pytania), pytanie niesie źródło i godzinę serii,
// a „Cofnij” w pytaniu zwraca dzień limitu (tylko gdy seria zaczęła dzień bez innych dodań), z historii — nie. Prawdziwa baza (node:sqlite).
import { cofnijSerie } from '../../src/przypadki-uzycia/licznik';
import { widokLicznika } from '../../src/przypadki-uzycia/widok-licznika';
import { czesc, dzienLimitu, licznik, projekt, ustawGlowe, zdarzenie, type Instr } from './pomocnicze/dane-wejsciowe';
import { DOBA, MIN, T0, ile, przygotuj, wykonaj } from './pomocnicze/srodowisko';

const START = T0 + 14 * MIN; // 2026-10-22 12:14 Europe/Warsaw
/** Pięć +1 co 300 ms na końcu historii licznika `id` (RD-17-W1: seria stuknięć), zaczynających się od wartości `od`. */
function seria(id: string, od: number, o: { zrodlo?: string[]; dzien?: string } = {}): Instr[] {
  const w: Instr[] = [];
  for (let i = 1; i <= 5; i++) w.push(zdarzenie(`${id}-s${i}`, id, 'plus', od + i, i > 1 ? [`${id}-s${i - 1}`] : od ? [`${id}-z${od}`] : [], START + (i - 1) * 300, { zrodlo: o.zrodlo?.[i - 1], dzien: o.dzien }));
  w.push(ustawGlowe(id, od + 5, `${id}-s5`));
  return w;
}
async function start(instr: Instr[]) {
  const s = await przygotuj();
  // starsze rzędy sprzed 5 dni (inny dzień), żeby „inne dodania dnia” były puste
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...instr]);
  s.zegar.ustaw(START + 10 * MIN);
  return s;
}
const widok = async (s: Awaited<ReturnType<typeof start>>, id = 'l1') => {
  const w = await widokLicznika(s.z, { licznikId: id });
  if (!w.ok) throw new Error(w.powod);
  return w.wartosc;
};
const dniLimitu = async (s: Awaited<ReturnType<typeof start>>) => (await s.baza.all<{ dzien: string }>('SELECT dzien FROM dzien_limitu ORDER BY dzien')).map((r) => r.dzien);

describe('014 S3: licznik oczek (ER-24)', () => {
  test('pięć +1 w 1,2 s: licznik rzędów pyta o serię, licznik oczek nie', async () => {
    const s = await start([...licznik('l1', 'c1', 30, { t: T0 - 5 * DOBA }), ...seria('l1', 30), ...licznik('l2', 'c1', 30, { t: T0 - 5 * DOBA, rodzaj: 'oczka', kolejnosc: 2 }), ...seria('l2', 30)]);
    expect((await widok(s, 'l1')).seria).toMatchObject({ ile: 5, odZdarzeniaId: 'l1-s1' });
    expect((await widok(s, 'l2')).seria).toBeNull();
  });
});

describe('014 S5: źródło i godzina serii', () => {
  test('seria z ekranu blokady niesie źródło i godzinę pierwszego dodania (nie scalenia)', async () => {
    const s = await start([...licznik('l1', 'c1', 30, { t: T0 - 5 * DOBA }), ...seria('l1', 30, { zrodlo: Array(5).fill('ekran_blokady') })]);
    expect((await widok(s)).seria).toMatchObject({ ile: 5, zrodlo: 'ekran_blokady', odMs: START });
  });
  test('seria z zegarka → zegarek; z aplikacji → aplikacja; mieszana → aplikacja (bez zgadywania jednego źródła)', async () => {
    const z = await start([...licznik('l1', 'c1', 30, { t: T0 - 5 * DOBA }), ...seria('l1', 30, { zrodlo: Array(5).fill('zegarek') })]);
    expect((await widok(z)).seria).toMatchObject({ zrodlo: 'zegarek' });
    const a = await start([...licznik('l1', 'c1', 30, { t: T0 - 5 * DOBA }), ...seria('l1', 30)]);
    expect((await widok(a)).seria).toMatchObject({ zrodlo: 'aplikacja' });
    const m = await start([...licznik('l1', 'c1', 30, { t: T0 - 5 * DOBA }), ...seria('l1', 30, { zrodlo: ['ekran_blokady', 'ekran_blokady', 'aplikacja', 'aplikacja', 'aplikacja'] })]);
    expect((await widok(m)).seria).toMatchObject({ zrodlo: 'aplikacja' });
  });
});

describe('014 S7: „Cofnij” w pytaniu zwraca dzień limitu (L-19), z historii nie (L-06)', () => {
  const baza = () => [...licznik('l1', 'c1', 30, { t: T0 - 5 * DOBA }), ...seria('l1', 30), dzienLimitu('2026-10-17', 'l1-z1'), dzienLimitu('2026-10-22', 'l1-s1')];
  test('pytanie serii: seria zaczęła dzień i nie ma innych dodań → dzień wraca, wartość 30', async () => {
    const s = await start(baza());
    const r = await cofnijSerie(s.z, { licznikId: 'l1', odZdarzeniaId: 'l1-s1', zrodlo: 'pytanie-serii' });
    expect(r).toMatchObject({ ok: true, wartosc: { wartosc: 30 } });
    expect(await dniLimitu(s)).toEqual(['2026-10-17']);
  });
  test('ta sama seria cofnięta z historii: dzień zostaje', async () => {
    const s = await start(baza());
    expect((await cofnijSerie(s.z, { licznikId: 'l1', odZdarzeniaId: 'l1-s1', zrodlo: 'historia' })).ok).toBe(true);
    expect(await dniLimitu(s)).toEqual(['2026-10-17', '2026-10-22']);
  });
  test('inne +1 tego dnia na innym liczniku (L-19c): dzień zostaje także z pytania', async () => {
    const s = await start([...baza(), ...licznik('l2', 'c1', 1, { t: T0 + 5 * MIN, kolejnosc: 2 })]);
    expect((await cofnijSerie(s.z, { licznikId: 'l1', odZdarzeniaId: 'l1-s1', zrodlo: 'pytanie-serii' })).ok).toBe(true);
    expect(await dniLimitu(s)).toEqual(['2026-10-17', '2026-10-22']);
    expect(await ile(s.baza, 'zdarzenie', "licznik_id = 'l1' AND rodzaj = 'cofniecie'")).toBe(1);
  });
  test('dzień limitu zaczęło inne zdarzenie niż seria (L-19b): dzień zostaje', async () => {
    const s = await start([...licznik('l1', 'c1', 30, { t: T0 - 5 * DOBA }), ...seria('l1', 30), dzienLimitu('2026-10-22', 'ktos-inny')]);
    expect((await cofnijSerie(s.z, { licznikId: 'l1', odZdarzeniaId: 'l1-s1', zrodlo: 'pytanie-serii' })).ok).toBe(true);
    expect(await dniLimitu(s)).toEqual(['2026-10-22']);
  });
});
