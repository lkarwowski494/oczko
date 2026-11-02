// E2-137-A3 (scen. 08, bramka, ścieżka utraty danych): po „Delete all data” (kopia przed usunięciem, ADR-0028) import wcześniejszego eksportu nie dawał
// `import-gotowy` w 30 s i nie zgłaszał błędu. Hipoteza 07: coś po kopii + usunięciu trzyma kolejkę bazy. Test na prawdziwym SQLite (node:sqlite) odtwarza
// kolejność z ekranów (`app/ustawienia.tsx` importZ: licznosciBazy → importuj; `app/usun-wszystko.tsx`: usunWszystkieDane) i pilnuje, że żadna pozycja kolejki
// (adaptera i przypadków użycia) nie wisi: sonda dopisana na koniec kolejki kończy się w ograniczonym czasie po każdym kroku.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { utworzArchiwum } from '../../src/dane/archiwum';
import { migruj } from '../../src/dane/migracje/migruj';
import { eksportuj, importuj } from '../../src/przypadki-uzycia/archiwum';
import { wKolejce } from '../../src/przypadki-uzycia/kolejka';
import { usunWszystkieDane } from '../../src/przypadki-uzycia/projekt';
import type { Manifest } from '../../src/przypadki-uzycia/porty-propozycja';
import { zycie } from './pomocnicze/dane-wejsciowe';
import { czasWTle, licznosci, przygotuj, wlozPlik, wykonaj } from './pomocnicze/srodowisko';

const LIMIT_MS = 5000; // w teście wszystko trwa ms; 5 s = „wisi” (na urządzeniu E2E czekało 30 s)

function wCzasie<T>(p: Promise<T>, etap: string): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  const limit = new Promise<never>((_, odrzuc) => { t = setTimeout(() => odrzuc(new Error(`wisi: ${etap} (> ${LIMIT_MS} ms)`)), LIMIT_MS); });
  return Promise.race([p, limit]).finally(() => { if (t) clearTimeout(t); });
}

async function srodowisko() {
  const s = await przygotuj();
  const pliki = { pdf: wlozPlik(s.magazyn, Buffer.from('PDF-1.4 abc'), 'pdf'), rys: wlozPlik(s.magazyn, Buffer.from('PKDRAWING'), 'pkdrawing'), jpg: wlozPlik(s.magazyn, Buffer.from('JPEG-DANE!'), 'jpg') };
  await wykonaj(s.baza, zycie(pliki));
  const archiwum = utworzArchiwum({ baza: s.baza, magazyn: s.magazyn, zegar: s.zegar, katalogi: s.z.katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
  return { ...s, za: { ...s.z, archiwum, czasWTle } };
}
/** Sonda: pozycja na końcu obu kolejek (adaptera i przypadków użycia) musi się wykonać — inaczej coś przed nią wisi. */
async function kolejkaWolna(s: Awaited<ReturnType<typeof srodowisko>>, etap: string): Promise<void> {
  await wCzasie(wKolejce(s.baza, () => s.baza.all('SELECT 1 AS x')), `kolejka przypadków użycia po: ${etap}`);
  await wCzasie(s.baza.run('SELECT 1'), `kolejka adaptera po: ${etap}`);
}
// to samo zapytanie co `licznosciBazy()` w app/ustawienia.tsx
const licznosciEkranu = (s: Awaited<ReturnType<typeof srodowisko>>) => s.baza.all<{ p: number }>('SELECT count(*) AS p FROM projekt');

test('E2-137-A3: eksport → kopia i usunięcie wszystkiego → odczyt liczności i import „scal” kończą się w ograniczonym czasie, kolejka bez wiszącej pozycji', async () => {
  const s = await srodowisko();
  const przed = await licznosci(s.baza);
  const eksport = await wCzasie(eksportuj(s.za, { katalogDocelowy: s.za.katalogi.tymczasowy }), 'eksport');
  if (!eksport.ok) throw new Error(`eksport: ${eksport.powod}`);
  await kolejkaWolna(s, 'eksport');

  expect(await wCzasie(usunWszystkieDane(s.za), 'usunWszystkieDane')).toMatchObject({ ok: true });
  expect(existsSync(join(s.za.katalogi.kopiePrzed, 'oczko-przed-usunieciem-2026-10-22.oczko'))).toBe(true);
  await kolejkaWolna(s, 'usunięcie wszystkich danych');

  expect(await wCzasie(licznosciEkranu(s), 'licznosciBazy')).toEqual([{ p: 0 }]);

  let pokazanoWybor = false;
  const wybierz = async (_m: Manifest) => { pokazanoWybor = true; return 'scal' as const; };
  const w = await wCzasie(importuj(s.za, { sciezka: eksport.wartosc.sciezka, wybierz }), 'import po usunięciu');
  expect(pokazanoWybor).toBe(true); // „import-gotowy” w aplikacji = wywołanie wybierz po sprawdzeniu manifestu
  expect(w).toMatchObject({ ok: true, wartosc: { tryb: 'scal' } });
  await kolejkaWolna(s, 'import');
  expect(await licznosci(s.baza)).toEqual(przed);

  // drugi import tego samego pliku (scenariusz 08): scalenie idempotentne, też bez zawieszenia
  const w2 = await wCzasie(importuj(s.za, { sciezka: eksport.wartosc.sciezka, wybierz }), 'drugi import');
  expect(w2).toMatchObject({ ok: true, wartosc: { tryb: 'scal' } });
  await kolejkaWolna(s, 'drugi import');
  expect(await licznosci(s.baza)).toEqual(przed);
});
