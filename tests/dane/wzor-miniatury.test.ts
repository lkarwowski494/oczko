// Plan 1.1 pkt 7 (design-spec W8: „Wiersz wzoru: miniatura pierwszej strony”): miniatury PDF wzorów projektu — plik pochodny (odtwarzalny) w systemowej
// pamięci podręcznej `Library/Caches/miniatury/<sha256>.png`, poza kopią urządzenia (M1-095, 05-architekt-506), generowany raz na plik PDF;
// Word bez PDF (podgląd zastępczy) i wzory w koszu bez miniatury; błąd → brak.
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { miniaturyWzorow } from '../../src/kompozycja/miniatury';
import { plikiPdfWzorow, usunWzor } from '../../src/przypadki-uzycia/wzor';
import { plik, projekt, wzor } from './pomocnicze/dane-wejsciowe';
import { przygotuj, wlozPlik, wykonaj } from './pomocnicze/srodowisko';

const PDF = Buffer.from('%PDF-1.4\n%%EOF\n');
async function srodowisko() {
  const s = await przygotuj();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h), wzor('w2', 'p1', h),
    ["INSERT INTO wzor (id, projekt_id, nazwa, zrodlo, pdf_sha256, oryginal_sha256, zmieniono_ms) VALUES ('w3', 'p1', 'Word', 'word', NULL, ?, 0)", [h]]]);
  return { s, h };
}

test('plikiPdfWzorow: wzory z PDF poza koszem (Word bez PDF pominięty)', async () => {
  const { s, h } = await srodowisko();
  expect(await plikiPdfWzorow(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: [{ wzorId: 'w1', sha256: h }, { wzorId: 'w2', sha256: h }] });
  await usunWzor(s.z, { wzorId: 'w2' });
  expect(await plikiPdfWzorow(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: [{ wzorId: 'w1', sha256: h }] });
});

test('miniaturyWzorow: jeden plik PNG na PDF (ten sam sha = jedna generacja), drugie wywołanie z pamięci; błąd generacji → bez wpisu', async () => {
  const { s, h } = await srodowisko();
  const gen = jest.fn(async (_pdf: string, cel: string) => { writeFileSync(cel, 'png'); return { ok: true as const, wartosc: undefined }; });
  const m = await miniaturyWzorow(s.z, gen, { projektId: 'p1' });
  const cel = join(s.z.katalogi.podreczny, 'miniatury', `${h}.png`);
  expect(m).toEqual({ w1: `file://${cel}`, w2: `file://${cel}` });
  expect(existsSync(join(s.z.katalogi.tymczasowy, 'miniatury'))).toBe(false); // nie w Application Support (kopia urządzenia)
  expect(gen).toHaveBeenCalledTimes(1);
  expect(gen).toHaveBeenCalledWith(s.z.magazyn.sciezka(h), cel);
  expect(existsSync(cel)).toBe(true);
  await miniaturyWzorow(s.z, gen, { projektId: 'p1' });
  expect(gen).toHaveBeenCalledTimes(1);
  const zly = jest.fn(async () => ({ ok: false as const, powod: 'uszkodzony' as const }));
  const { s: s2 } = await srodowisko();
  expect(await miniaturyWzorow(s2.z, zly, { projektId: 'p1' })).toEqual({});
});
