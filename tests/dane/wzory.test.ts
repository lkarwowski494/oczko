// Zapisy wzorów (ADR-0001, ADR-0011, ADR-0012): BR-WZR-001/S2, BR-WZR-003/S2, BR-WZR-008/S2. Wyrocznia: BRD wymagania-projekt.md (scenariusze),
// kryteria.json (uwagi: „plik uszkodzony jako wejście testu”, „plik wzoru niezmieniony: skrót pliku przed i po”).
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { utworzPortNode } from '../../src/dane/baza/adapter-node';
import { notatkiWzoru, odczytajZnacznik } from '../../src/dane/repozytoria/wzory';
import { importujWzor, ustawZnacznik } from '../../src/przypadki-uzycia/wzor';
import { dodajNotatkeWzoru } from '../../src/przypadki-uzycia/wzor-notatki';
import { czesc, licznik, plik, projekt, wzor } from './pomocnicze/dane-wejsciowe';
import { DOBA, ile, jeden, przygotuj, sha256Pliku, wlozPlik, wykonaj } from './pomocnicze/srodowisko';

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');

test('BR-WZR-001/S2: uszkodzony PDF → powod „uszkodzony”, bez pustego wzoru, bez wiersza plik i bez pliku w magazynie', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter')]);
  const sciezka = join(s.katalog, 'wzor.pdf');
  writeFileSync(sciezka, Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.from([0x00, 0xff, 0x13, 0x37])])); // ucięty nagłówek, brak xref i %%EOF
  expect(await importujWzor(s.z, { projektId: 'p1', plik: { id: 'f1', nazwa: 'wzor.pdf', sciezka, typ: 'application/pdf' } })).toEqual({ ok: false, powod: 'uszkodzony' });
  expect(await ile(s.baza, 'wzor')).toBe(0);
  expect(await ile(s.baza, 'plik')).toBe(0);
  expect(readdirSync(s.magazyn.katalog)).toEqual([]);
});

test('BR-WZR-003/S2: znacznik na rzędzie 13 → zamknięcie aplikacji → po tygodniu znacznik nadal na rzędzie 13 (ta sama strona)', async () => {
  const s = await przygotuj();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 13), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h)]);
  expect(await ustawZnacznik(s.z, { wzorId: 'w1', licznikId: 'l1', strona: 2, y: 0.4, wysokoscRzedu: 0.02, rzadBazowy: 13, kierunek: -1 })).toEqual({ ok: true, wartosc: undefined }); // kierunek wymagany (P-120 Q5a)
  s.baza.zamknij();
  s.zegar.przesun(7 * DOBA);
  const ponownie = utworzPortNode(join(s.katalog, 'oczko.db'));
  expect(await odczytajZnacznik(ponownie, 'w1')).toEqual({ licznikId: 'l1', strona: 2, rzad: 13 });
});

test('BR-WZR-008/S2: notatka „ujmowanie co 4 rzędy” przy rzędzie 30 → widoczna w tym miejscu, plik wzoru bez zmian (SHA-256 przed i po)', async () => {
  const s = await przygotuj();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 28), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h, JSON.stringify({ licznik_id: 'l1', strona: 0, y: 0.1, wysokosc_rzedu: 0.02, rzad_bazowy: 1 }))]);
  const shaPrzed = sha256Pliku(s.magazyn.sciezka(h));
  const wierszPrzed = await jeden(s.baza, 'SELECT * FROM plik WHERE sha256 = ?', [h]);
  expect(await dodajNotatkeWzoru(s.z, { wzorId: 'w1', rzad: 30, tekst: 'ujmowanie co 4 rzędy' })).toEqual({ ok: true, wartosc: undefined });
  expect(await notatkiWzoru(s.baza, 'w1')).toEqual([{ rzad: 30, tekst: 'ujmowanie co 4 rzędy' }]);
  expect(sha256Pliku(s.magazyn.sciezka(h))).toBe(shaPrzed);
  expect(await jeden(s.baza, 'SELECT * FROM plik WHERE sha256 = ?', [h])).toEqual(wierszPrzed);
});
