// P-219 (2A), polecenie koordynatora: „zapisany plik nie ma EXIF/GPS”. Najgorszy przypadek: przekodowanie natywne oddało plik z metadanymi
// (atrapa = ten sam plik) — po złożeniu w kompozycji plik w magazynie zdjęć nie ma Exif ani segmentów APPn poza JFIF.
import { mkdirSync, readFileSync, unlinkSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { maMetadane } from '../../src/dane/pliki/jpeg';
import { zBase64 } from '../../src/kompozycja/e2e-zdjecie';
import { zdjecieBezMetadanych } from '../../src/kompozycja/zdjecie-bez-metadanych';
import { dodajZdjecie } from '../../src/przypadki-uzycia/zdjecia';
import { projekt } from './pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from './pomocnicze/srodowisko';

const ZGPS = zBase64(/JPEG_B64 = '([^']+)'/.exec(readFileSync(join(__dirname, '../../src/kompozycja/e2e-zdjecie.ts'), 'utf8'))?.[1] ?? '');

test('zdjęcie z GPS → do magazynu trafia plik bez metadanych (także gdy przekodowanie zostawiło Exif); plik pośredni usunięty', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter')]);
  const tmp = join(s.katalog, 'tmp-zdjecia');
  mkdirSync(tmp, { recursive: true });
  const zrodlo = join(tmp, 'aparat.jpg');
  writeFileSync(zrodlo, ZGPS);
  const posredni = join(tmp, 'posredni.jpg');
  let n = 0;
  const plik = await zdjecieBezMetadanych(zrodlo, {
    przekoduj: async (p) => { writeFileSync(posredni, readFileSync(p)); return posredni; }, // atrapa: Exif zostaje
    czytaj: (p) => new Uint8Array(readFileSync(p)), zapisz: (p, b) => writeFileSync(p, b), usun: (p) => unlinkSync(p),
    tymczasowy: tmp, nazwa: () => `z${++n}`,
  });
  expect(plik).not.toBeNull();
  if (!plik) return;
  expect(existsSync(posredni)).toBe(false);
  const w = await dodajZdjecie(s.z, { cel: { projektId: 'p1' }, plik });
  expect(w.ok).toBe(true);
  const [r] = await s.baza.all<{ plik_sha256: string; rozszerzenie: string }>('SELECT z.plik_sha256, p.rozszerzenie FROM zdjecie z JOIN plik p ON p.sha256 = z.plik_sha256');
  const zapisany = new Uint8Array(readFileSync(s.magazyn.sciezka(r!.plik_sha256)));
  expect(r!.rozszerzenie).toBe('jpg');
  expect(maMetadane(zapisany)).toBe(false);
  expect(Buffer.from(zapisany).includes(Buffer.from('Exif'))).toBe(false);
});
