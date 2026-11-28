// PU-355 (katalog: „Oczekujące 1.0.2”). ZM-24 (U6, ADR-0036 kontrakt TS pkt 1, 3, 6; P-1097): `dodajRzad` przy `licznik.krok = 2` zapisuje
// dwa zdarzenia `plus` w jednej transakcji (ten sam `czas_ms`, rodzic drugiego = pierwsze, `wartosc_po` kolejno +1), jedna decyzja limitu
// (`dzien_limitu.zdarzenie_id` = pierwsze); „Cofnij” cofa całe stuknięcie; −1 zostaje −1. Wyrocznia: kontrakt ADR-0036 i wektory CO-01, IN-04.
import { cofnijOstatnie, dodajRzad, odejmijRzad, utworzSzybkiLicznik } from '../../src/przypadki-uzycia/licznik';
import { ile, jeden, przygotuj } from './pomocnicze/srodowisko';

type Z = { id: string; rodzaj: string; rodzice: string; cofa: string; czas_ms: number; wartosc_po: number };
async function licznikKrok2(pro = false) {
  const s = await przygotuj();
  s.pro.wartosc = pro;
  const w = await utworzSzybkiLicznik(s.z);
  if (!w.ok) throw new Error(w.powod);
  const kolumny = (await s.baza.all<{ name: string }>('PRAGMA table_info(licznik)')).map((k) => k.name);
  if (!kolumny.includes('krok')) throw new Error('NIEZAIMPLEMENTOWANE: ZM-24 licznik.krok (migracja 0002, ADR-0036 K1)');
  await s.baza.run('UPDATE licznik SET krok = 2 WHERE id = ?', [w.wartosc.licznikId]);
  return { s, l: w.wartosc.licznikId };
}
const zdarzenia = (s: Awaited<ReturnType<typeof przygotuj>>, l: string) => s.baza.all<Z>('SELECT id, rodzaj, rodzice, cofa, czas_ms, wartosc_po FROM zdarzenie WHERE licznik_id = ? ORDER BY rowid', [l]);
const wartosc = async (s: Awaited<ReturnType<typeof przygotuj>>, l: string) => (await jeden<{ wartosc: number }>(s.baza, 'SELECT wartosc FROM licznik WHERE id = ?', [l])).wartosc;

describe('ZM-24 dodajRzad z krokiem 2 (ADR-0036)', () => {
  test('ZM-24 PU-355: „+2” → wartość +2, dwa plus, ten sam czas, łańcuch rodziców, wartosc_po 1 i 2', async () => {
    const { s, l } = await licznikKrok2();
    const r = await dodajRzad(s.z, { licznikId: l });
    expect(r).toMatchObject({ ok: true, wartosc: { wartosc: 2 } });
    const z = await zdarzenia(s, l);
    expect(z.map((x) => [x.rodzaj, x.wartosc_po])).toEqual([['plus', 1], ['plus', 2]]);
    expect(z[0].czas_ms).toBe(z[1].czas_ms);
    expect(JSON.parse(z[1].rodzice)).toEqual([z[0].id]);
    expect(await wartosc(s, l)).toBe(2);
  });

  test('ZM-24 PU-355: jedna decyzja limitu na stuknięcie — jeden wiersz dzien_limitu wskazujący pierwsze zdarzenie (bez Pro)', async () => {
    const { s, l } = await licznikKrok2(false);
    await dodajRzad(s.z, { licznikId: l });
    const z = await zdarzenia(s, l);
    expect(await ile(s.baza, 'dzien_limitu')).toBe(1);
    expect(await jeden(s.baza, 'SELECT zdarzenie_id FROM dzien_limitu')).toEqual({ zdarzenie_id: z[0].id });
  });

  test('ZM-24 PU-355 (CO-01): „Cofnij” po „+2” cofa oba zdarzenia jednym cofnięciem i wraca do wartości sprzed stuknięcia', async () => {
    const { s, l } = await licznikKrok2(true);
    await dodajRzad(s.z, { licznikId: l });
    await dodajRzad(s.z, { licznikId: l });
    expect(await wartosc(s, l)).toBe(4);
    const r = await cofnijOstatnie(s.z, { licznikId: l });
    expect(r).toMatchObject({ ok: true, wartosc: { wartosc: 2 } });
    const z = await zdarzenia(s, l);
    const cofniecie = z[z.length - 1];
    expect(cofniecie.rodzaj).toBe('cofniecie');
    expect(JSON.parse(cofniecie.cofa).sort()).toEqual([z[2].id, z[3].id].sort());
  });

  test('ZM-24 PU-355 (IN-04): −1 przy kroku 2 odejmuje 1', async () => {
    const { s, l } = await licznikKrok2(true);
    await dodajRzad(s.z, { licznikId: l });
    const r = await odejmijRzad(s.z, { licznikId: l });
    expect(r).toMatchObject({ ok: true, wartosc: { wartosc: 1 } });
  });
});
