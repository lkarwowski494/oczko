// M1-audytor-generalny-104 (źródło 08-programista-511; DEC-29 (a), P-418; zasada 10, ADR-0012): plik oczekujący rysunku (kreski z okna opóźnienia zapisu
// albo z nieudanego zapisu, M1-084) nie ginie, gdy wzór albo jego projekt leży w koszu w chwili odzysku — kosz da się cofnąć (`app/kosz.tsx`).
// `niedozwolone_przejscie` nie jest odrzuceniem trwałym: plik czeka, odzysk pomija wzór w koszu bez błędu, a po przywróceniu następny odzysk zapisuje kreski.
// Odrzuceniem trwałym zostaje `bledne_dane` (wzoru nie ma, np. po trwałym usunięciu z kosza przez `sprzatnijKosz`) — wtedy plik znika.
// Prawdziwy SQLite (node:sqlite) i prawdziwy system plików w katalogu tymczasowym; liczności tabel i plików w katalogu przed i po.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { KOSZ_DNI } from '../../src/konfiguracja';
import { sprzatnijKosz } from '../../src/przypadki-uzycia/kosz';
import { przywrocProjekt, usunProjekt } from '../../src/przypadki-uzycia/projekt';
import { przywrocWzor, usunWzor, zapiszRysunek } from '../../src/przypadki-uzycia/wzor';
import { odzyskajRysunki } from '../../src/przypadki-uzycia/wzor-widok';
import { plik, projekt, wzor } from './pomocnicze/dane-wejsciowe';
import { DOBA, ile, jeden, licznosci, przygotuj, sha256, wlozPlik, wykonaj } from './pomocnicze/srodowisko';

const PDF = Buffer.from('%PDF-1.4\n%%EOF\n');
const rysunekStrony = (s: Awaited<ReturnType<typeof przygotuj>>) => jeden<{ plik_sha256: string }>(s.baza, "SELECT plik_sha256 FROM rysunek WHERE wzor_id = 'w1' AND strona = 0");
async function zPlikiemOczekujacym() {
  const s = await przygotuj();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Harbor'), plik(h, 'pdf', 15), wzor('w1', 'p1', h)]);
  const k = join(s.katalog, 'tmp', 'rysunki-wzoru');
  mkdirSync(k, { recursive: true });
  const f = join(k, 'w1__0__a.pkdrawing');
  writeFileSync(f, 'ostatnie-kreski');
  return { s, k, f };
}
const poczatek = (s: Awaited<ReturnType<typeof przygotuj>>) => s.baza.run("INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES ('ostatni_start_ms', ?, ?) ON CONFLICT (klucz) DO UPDATE SET wartosc = excluded.wartosc", [String(s.zegar.teraz().ms), s.zegar.teraz().ms]);

describe('M1-104: plik oczekujący rysunku a kosz (DEC-29 (a))', () => {
  test('wzór w koszu: odzyskajRysunki nie kasuje pliku i nie zgłasza błędu → przywrocWzor → następny odzysk zapisuje kreski', async () => {
    const { s, k, f } = await zPlikiemOczekujacym();
    expect(await usunWzor(s.z, { wzorId: 'w1' })).toEqual({ ok: true, wartosc: undefined });
    const przed = await licznosci(s.baza);
    expect(await odzyskajRysunki(s.z, { katalog: k })).toEqual({ ok: true, wartosc: 0 });
    expect(existsSync(f)).toBe(true);
    expect(readdirSync(k)).toEqual(['w1__0__a.pkdrawing']);
    expect(await licznosci(s.baza)).toEqual(przed); // nic nie zapisane, nic nie skasowane
    expect(await ile(s.baza, 'rysunek', "wzor_id = 'w1'")).toBe(0);
    expect(await przywrocWzor(s.z, { wzorId: 'w1' })).toEqual({ ok: true, wartosc: undefined });
    expect(await odzyskajRysunki(s.z, { katalog: k })).toEqual({ ok: true, wartosc: 1 });
    expect(await rysunekStrony(s)).toEqual({ plik_sha256: sha256('ostatnie-kreski') });
    expect(readdirSync(k)).toEqual([]);
  });

  test('projekt w koszu (wzór poza koszem): plik czeka; po przywrocProjekt następny odzysk zapisuje kreski', async () => {
    const { s, k, f } = await zPlikiemOczekujacym();
    expect(await usunProjekt(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: undefined });
    const przed = await licznosci(s.baza);
    expect(await odzyskajRysunki(s.z, { katalog: k })).toEqual({ ok: true, wartosc: 0 });
    expect(existsSync(f)).toBe(true);
    expect(await licznosci(s.baza)).toEqual(przed);
    expect(await przywrocProjekt(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: undefined });
    expect(await odzyskajRysunki(s.z, { katalog: k })).toEqual({ ok: true, wartosc: 1 });
    expect(await rysunekStrony(s)).toEqual({ plik_sha256: sha256('ostatnie-kreski') });
    expect(existsSync(f)).toBe(false);
  });

  test('zapiszRysunek wzoru w koszu zwraca niedozwolone_przejscie, ale plik oczekujący zostaje', async () => {
    const { s, f } = await zPlikiemOczekujacym();
    await usunWzor(s.z, { wzorId: 'w1' });
    expect(await zapiszRysunek(s.z, { wzorId: 'w1', strona: 0, plikTymczasowy: f })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
    expect(existsSync(f)).toBe(true);
  });

  test('wzór w koszu, dwa pliki tej samej strony oraz plik drugiego wzoru: wszystkie czekają, drugi wzór (poza koszem) zapisany', async () => {
    const { s, k } = await zPlikiemOczekujacym();
    const h = wlozPlik(s.magazyn, PDF, 'pdf');
    await wykonaj(s.baza, [wzor('w2', 'p1', h)]);
    writeFileSync(join(k, 'w1__0__b.pkdrawing'), 'nowsze');
    writeFileSync(join(k, 'w2__0__c.pkdrawing'), 'drugi');
    await usunWzor(s.z, { wzorId: 'w1' });
    expect(await odzyskajRysunki(s.z, { katalog: k })).toEqual({ ok: true, wartosc: 1 });
    expect(readdirSync(k).sort()).toEqual(['w1__0__a.pkdrawing', 'w1__0__b.pkdrawing']);
  });

  test('wzór usunięty na zawsze (sprzatnijKosz po KOSZ_DNI) → plik oczekujący znika przy następnym odzysku, bez błędu', async () => {
    const { s, k, f } = await zPlikiemOczekujacym();
    await usunWzor(s.z, { wzorId: 'w1' });
    expect(await odzyskajRysunki(s.z, { katalog: k })).toEqual({ ok: true, wartosc: 0 });
    expect(existsSync(f)).toBe(true); // w koszu jeszcze czeka
    s.zegar.przesun(KOSZ_DNI * DOBA + 60_000);
    await poczatek(s);
    const w = await sprzatnijKosz(s.z);
    expect(w.ok && w.wartosc.wzory).toBe(1);
    expect(await ile(s.baza, 'wzor', "id = 'w1'")).toBe(0);
    expect(await odzyskajRysunki(s.z, { katalog: k })).toEqual({ ok: true, wartosc: 0 });
    expect(existsSync(f)).toBe(false);
    expect(await ile(s.baza, 'rysunek', "wzor_id = 'w1'")).toBe(0);
  });

  test('projekt usunięty na zawsze razem z wzorem → plik oczekujący znika', async () => {
    const { s, k, f } = await zPlikiemOczekujacym();
    await usunProjekt(s.z, { projektId: 'p1' });
    s.zegar.przesun(KOSZ_DNI * DOBA + 60_000);
    await poczatek(s);
    const w = await sprzatnijKosz(s.z);
    expect(w.ok && w.wartosc.projekty).toBe(1);
    expect(await odzyskajRysunki(s.z, { katalog: k })).toEqual({ ok: true, wartosc: 0 });
    expect(existsSync(f)).toBe(false);
  });
});
