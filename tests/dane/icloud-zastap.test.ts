// „Zastąp” (import) i przywrócenie kopii tylko przy wyłączonej synchronizacji iCloud (ADR-0005, moduly.md „Kontrakt partii 7”; design-spec
// `icloud.zastap_wylacz`). Przy włączonej: usunięcie wszystkich wierszy przy aktywnych wyzwalaczach wpisałoby do skrzynki usunięcie każdego
// rekordu — wysyłka skasowałaby dane na innych urządzeniach. Odmowa w przypadku użycia (niedozwolone_przejscie), baza i skrzynka bez zmian.
import { migruj } from '../../src/dane/migracje/migruj';
import { utworzArchiwum } from '../../src/dane/archiwum';
import { eksportuj, importuj } from '../../src/przypadki-uzycia/archiwum';
import { przywrocKopie } from '../../src/przypadki-uzycia/przywracanie';
import { dodajRzad, utworzSzybkiLicznik } from '../../src/przypadki-uzycia/licznik';
import { czasWTle, przygotuj } from './pomocnicze/srodowisko';

async function srodowisko() {
  const s = await przygotuj();
  const archiwum = utworzArchiwum({ baza: s.baza, magazyn: s.magazyn, zegar: s.zegar, katalogi: s.z.katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
  const za = { ...s.z, archiwum, czasWTle };
  const l = await utworzSzybkiLicznik(s.z);
  if (!l.ok) throw new Error(l.powod);
  await dodajRzad(s.z, { licznikId: l.wartosc.licznikId });
  return { ...s, za, licznikId: l.wartosc.licznikId };
}
const ile = async (s: Awaited<ReturnType<typeof srodowisko>>, t: string) => (await s.baza.all<{ n: number }>(`SELECT count(*) AS n FROM ${t}`))[0].n;

describe('„Zastąp” i przywrócenie kopii przy włączonym iCloud', () => {
  test('import „zastąp”: odmowa, dane i skrzynka bez zmian; „scal” działa', async () => {
    const s = await srodowisko();
    const e = await eksportuj(s.za, { katalogDocelowy: s.za.katalogi.tymczasowy });
    if (!e.ok) throw new Error(e.powod);
    await s.baza.run('UPDATE synchronizacja SET wlaczona = 1 WHERE id = 1');
    await dodajRzad(s.z, { licznikId: s.licznikId });
    const skrzynka = await ile(s, 'zmiana_icloud');
    expect(await importuj(s.za, { sciezka: e.wartosc.sciezka, wybierz: async () => 'zastap' })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
    expect(await ile(s, 'zmiana_icloud')).toBe(skrzynka);
    expect(await s.baza.all('SELECT count(*) AS n FROM zmiana_icloud WHERE usuniete = 1')).toEqual([{ n: 0 }]);
    expect(await s.baza.all('SELECT wartosc FROM licznik WHERE id = ?', [s.licznikId])).toEqual([{ wartosc: 2 }]);
    s.zegar.przesun(1000); // katalog rozpakowania `import-<ms>` (odmowa, jak „anuluj”, zostawia go do sprzątania katalogu tymczasowego)
    expect(await importuj(s.za, { sciezka: e.wartosc.sciezka, wybierz: async () => 'scal' })).toMatchObject({ ok: true });
  });
  test('przywrócenie kopii: odmowa przy włączonej; po wyłączeniu przechodzi', async () => {
    const s = await srodowisko();
    const kopia = `${s.katalog}/kopia.db`;
    await s.baza.run('VACUUM INTO ?', [kopia]);
    await s.baza.run('UPDATE synchronizacja SET wlaczona = 1 WHERE id = 1');
    expect(await przywrocKopie(s.za, kopia)).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
    expect(await s.baza.all('SELECT count(*) AS n FROM zmiana_icloud WHERE usuniete = 1')).toEqual([{ n: 0 }]);
    await s.baza.run('UPDATE synchronizacja SET wlaczona = 0 WHERE id = 1');
    expect(await przywrocKopie(s.za, kopia)).toMatchObject({ ok: true });
  });
});
