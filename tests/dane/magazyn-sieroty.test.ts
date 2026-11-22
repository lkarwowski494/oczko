// M1-audytor-generalny-023 (05-architekt-503, ADR-0001 „plik bez odwołania jest wykrywany”): „zastąp” i przywrócenie kopii kasują wiersze `plik`,
// a nie pliki; sprzątanie liczyło sieroty tylko z tabeli `plik`, więc plik bez wiersza zostawał w magazynie (i w kopii urządzenia) na zawsze.
// Start uzgadnia katalog magazynu z tabelą `plik`; plik młodszy niż PLIKI_OCHRONA_MIN zostaje (zapis pliku przed wierszem, Z07-15).
import { readdirSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { utworzArchiwum } from '../../src/dane/archiwum';
import { utworzMagazyn } from '../../src/dane/pliki/magazyn';
import { migruj } from '../../src/dane/migracje/migruj';
import { PLIKI_OCHRONA_MIN } from '../../src/konfiguracja';
import { importuj } from '../../src/przypadki-uzycia/archiwum';
import { uruchomDane } from '../../src/przypadki-uzycia/start';
import { archiwumWzorcowe, czesc, licznik, projekt, zycie } from './pomocnicze/dane-wejsciowe';
import { czasWTle, ile, licznosci, przygotuj, wlozPlik, wykonaj } from './pomocnicze/srodowisko';

const ustawCzas = (sciezka: string, ms: number) => utimesSync(sciezka, ms / 1000, ms / 1000);
async function poZastap() {
  const s = await przygotuj();
  const archiwum = utworzArchiwum({ baza: s.baza, magazyn: s.magazyn, zegar: s.zegar, katalogi: s.z.katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
  const pliki = { pdf: wlozPlik(s.magazyn, Buffer.from('PDF-1.4 abc'), 'pdf'), rys: wlozPlik(s.magazyn, Buffer.from('PKDRAWING'), 'pkdrawing'), jpg: wlozPlik(s.magazyn, Buffer.from('JPEG-DANE!'), 'jpg') };
  await wykonaj(s.baza, zycie(pliki));
  expect({ wiersze: await ile(s.baza, 'plik'), pliki: readdirSync(s.magazyn.katalog).length }).toEqual({ wiersze: 3, pliki: 3 });
  const sciezka = archiwumWzorcowe(s.katalog, 'czapka', [projekt('cz', 'Czapka'), czesc('cc', 'cz', 'Główka'), ...licznik('lc', 'cc', 4)]);
  const w = await importuj({ ...s.z, archiwum, czasWTle }, { sciezka, wybierz: async () => 'zastap' });
  if (!w.ok) throw new Error(w.powod);
  expect({ wiersze: await ile(s.baza, 'plik'), pliki: readdirSync(s.magazyn.katalog).length }).toEqual({ wiersze: 0, pliki: 3 }); // stan z sondy 05
  return { s, pliki };
}
const start = (s: Awaited<ReturnType<typeof przygotuj>>) => uruchomDane({ ...s.z, migruj: (b) => migruj(b) });

test('M1-023: po „Replace” i jednym starcie liczba plików w magazynie = liczba wierszy `plik` (0); dane z kopii nietknięte', async () => {
  const { s } = await poZastap();
  const teraz = s.zegar.teraz().ms;
  for (const n of readdirSync(s.magazyn.katalog)) ustawCzas(join(s.magazyn.katalog, n), teraz - (PLIKI_OCHRONA_MIN + 1) * 60_000);
  const przed = await licznosci(s.baza);
  expect(await start(s)).toMatchObject({ ok: true });
  expect(readdirSync(s.magazyn.katalog)).toEqual([]);
  expect(await ile(s.baza, 'plik')).toBe(0);
  expect({ ...(await licznosci(s.baza)), ustawienie: 0 }).toEqual({ ...przed, ustawienie: 0 }); // start zapisuje tylko ostatni_start_ms (P-110 Q5a)
});

test('M1-023: plik bez wiersza młodszy niż PLIKI_OCHRONA_MIN zostaje; plik z wierszem zostaje bez względu na wiek', async () => {
  const { s, pliki } = await poZastap();
  const teraz = s.zegar.teraz().ms;
  const stary = (h: string) => readdirSync(s.magazyn.katalog).find((n) => n.startsWith(h)) as string;
  ustawCzas(join(s.magazyn.katalog, stary(pliki.pdf)), teraz - (PLIKI_OCHRONA_MIN + 1) * 60_000);
  ustawCzas(join(s.magazyn.katalog, stary(pliki.rys)), teraz - (PLIKI_OCHRONA_MIN - 1) * 60_000); // import w toku: plik przed wierszem
  ustawCzas(join(s.magazyn.katalog, stary(pliki.jpg)), teraz - (PLIKI_OCHRONA_MIN + 1) * 60_000);
  await s.baza.run('INSERT INTO plik (sha256, rozszerzenie, bajty, utworzono_ms) VALUES (?, ?, ?, ?)', [pliki.jpg, 'jpg', 10, teraz]); // świeży wiersz (sprzątanie kosza usuwa stare wiersze bez odwołań)
  expect(await start(s)).toMatchObject({ ok: true });
  expect(readdirSync(s.magazyn.katalog).map((n) => n.split('.')[0]).sort()).toEqual([pliki.jpg, pliki.rys].sort());
  expect(s.magazyn.usuniete).toEqual([pliki.pdf]);
});

test('M1-023: adapter magazynu (expo-file-system) wypisuje pliki z czasem zmiany, także niedokończone `.tmp`', async () => {
  const s = await przygotuj();
  const m = utworzMagazyn(s.magazyn.katalog);
  const h = wlozPlik(s.magazyn, Buffer.from('PDF-1.4 abc'), 'pdf');
  const t = Math.floor(Date.now() / 1000) * 1000 - 60_000;
  ustawCzas(join(s.magazyn.katalog, `${h}.pdf`), t);
  writeFileSync(join(s.magazyn.katalog, `${'b'.repeat(64)}.jpg.tmp`), 'przerwany zapis');
  ustawCzas(join(s.magazyn.katalog, `${'b'.repeat(64)}.jpg.tmp`), t);
  expect((await m.pliki()).sort((a, b) => a.sha256.localeCompare(b.sha256))).toEqual([{ sha256: h, zmianaMs: t }, { sha256: 'b'.repeat(64), zmianaMs: t }].sort((a, b) => a.sha256.localeCompare(b.sha256)));
});
