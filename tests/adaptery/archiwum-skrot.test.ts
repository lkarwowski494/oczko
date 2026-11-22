// Archiwum z wstrzykniętym skrótem pliku (P-130: na urządzeniu SHA-256 natywnie strumieniowo; test roli 08): sprawdz liczy skrót każdego
// rozpakowanego pliku funkcją `skrot` zamiast TS w trakcie rozpakowania; skrót różny od nazwy → `uszkodzony` (R-067), jak ścieżka TS.
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { utworzArchiwum } from '../../src/dane/archiwum';
import { sha256PlikuTs } from '../../src/dane/pliki/magazyn';
import { migruj } from '../../src/dane/migracje/migruj';
import { zycie } from '../dane/pomocnicze/dane-wejsciowe';
import { przygotuj, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';

async function zArchiwum() {
  const s = await przygotuj();
  const pliki = { pdf: wlozPlik(s.magazyn, Buffer.from('PDF-1.4 abc'), 'pdf'), rys: wlozPlik(s.magazyn, Buffer.from('PKDRAWING'), 'pkdrawing'), jpg: wlozPlik(s.magazyn, Buffer.from('JPEG-DANE!'), 'jpg') };
  await wykonaj(s.baza, zycie(pliki));
  const zwykle = utworzArchiwum({ baza: s.baza, magazyn: s.magazyn, zegar: s.zegar, katalogi: s.z.katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
  const cel = join(s.katalog, 'eksport');
  mkdirSync(cel, { recursive: true });
  const e = await zwykle.zapisz(cel);
  if (!e.ok) throw new Error(e.powod);
  const zeSkrotem = (skrot: (sciezka: string) => Promise<string>) =>
    utworzArchiwum({ baza: s.baza, magazyn: s.magazyn, zegar: s.zegar, katalogi: s.z.katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)', skrot });
  return { sciezka: e.wartosc.sciezka, pliki, zeSkrotem };
}

test('P-130: sprawdz woła wstrzyknięty skrót dla każdego pliku z archiwum (3 pliki) i przyjmuje archiwum, gdy skrót = nazwa', async () => {
  const a = await zArchiwum();
  const wolane: string[] = [];
  const w = await a.zeSkrotem(async (p) => { wolane.push(p); return sha256PlikuTs(p); }).sprawdz(a.sciezka);
  expect(w.ok).toBe(true);
  expect(wolane.map((p) => p.slice(p.lastIndexOf('/') + 1, p.lastIndexOf('/') + 65)).sort()).toEqual([a.pliki.pdf, a.pliki.rys, a.pliki.jpg].sort());
});

test('R-067 P-130: wstrzyknięty skrót różny od nazwy pliku → uszkodzony', async () => {
  const a = await zArchiwum();
  expect(await a.zeSkrotem(async () => '0'.repeat(64)).sprawdz(a.sciezka)).toEqual({ ok: false, powod: 'uszkodzony' });
});
