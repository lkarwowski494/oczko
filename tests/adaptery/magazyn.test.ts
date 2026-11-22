// Magazyn plików po SHA-256 (ADR-0001; test roli 08 na prawdziwym dysku): adres = treść, ten sam plik raz, brak pliku tymczasowego po zapisie,
// skrót wstrzykiwany (na urządzeniu natywny, P-130) = SHA-256 z node:crypto dla ścieżki TS.
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { utworzMagazyn } from '../../src/dane/pliki/magazyn';
import { katalogTymczasowy } from '../dane/pomocnicze/srodowisko';

test('zapisz: SHA-256 kawałkami = node:crypto, plik pod <sha>.<rozszerzenie> z tą samą treścią, bez .tmp; drugi zapis tej samej treści bez kopii', async () => {
  const k = katalogTymczasowy();
  const zrodlo = join(k, 'wzor.pdf');
  const tresc = randomBytes((1 << 20) * 2 + 5);
  writeFileSync(zrodlo, tresc);
  const m = utworzMagazyn(join(k, 'pliki'));
  const h = createHash('sha256').update(tresc).digest('hex');
  expect(await m.zapisz(zrodlo, 'pdf')).toEqual({ ok: true, wartosc: { sha256: h, bajty: tresc.length } });
  expect(readFileSync(m.sciezka(h)).equals(tresc)).toBe(true);
  expect(await m.zapisz(zrodlo, 'pdf')).toMatchObject({ ok: true });
  expect(readdirSync(join(k, 'pliki'))).toEqual([`${h}.pdf`]);
  await m.usun(h);
  expect(existsSync(join(k, 'pliki', `${h}.pdf`))).toBe(false);
});

test('skrót wstrzyknięty (natywny na urządzeniu) jest używany zamiast TS; złe rozszerzenie albo brak źródła → bledne_dane', async () => {
  const k = katalogTymczasowy();
  const zrodlo = join(k, 'a.jpg');
  writeFileSync(zrodlo, 'JPEG');
  const wolane: string[] = [];
  const m = utworzMagazyn(join(k, 'pliki'), { skrot: async (s) => { wolane.push(s); return 'a'.repeat(64); }, wolne: () => 123 });
  expect(await m.zapisz(zrodlo, 'jpg')).toEqual({ ok: true, wartosc: { sha256: 'a'.repeat(64), bajty: 4 } });
  expect([wolane, await m.wolneMiejsce()]).toEqual([[zrodlo], 123]);
  expect([await m.zapisz(zrodlo, '../x'), await m.zapisz(join(k, 'brak.jpg'), 'jpg')]).toEqual([{ ok: false, powod: 'bledne_dane' }, { ok: false, powod: 'bledne_dane' }]);
});
