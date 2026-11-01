// 07-jakosc-017 (F-55, K-17d, ADR-0031 pkt 3): `SkrzynkaImportu.dodaj` — aplikacja dopisuje zlecenie „adres” (strona WWW bez sieci) do tej samej skrzynki
// App Group, w tym samym formacie `zlecenie.json` co rozszerzenie „Udostępnij do Oczka”. Zapis atomowy (plik tymczasowy → rename): katalog bez manifestu
// nie jest widoczny dla `pobierz`. Brak grupy App Group → błąd `zapis` (wołający pokazuje alert i zostawia adres w polu).
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { skrzynkaWKatalogu } from '../../src/platforma/skrzynka';
import { T0, katalogTymczasowy } from './pomocnicze/srodowisko';

const ADRES = 'https://example.org/wzory/czapka';
const nowa = (grupa: string | null, id = 'id-1') => skrzynkaWKatalogu(grupa, () => T0, () => id);

test('K-17d: dodaj zapisuje zlecenie „adres” widoczne dla pobierz, w formacie rozszerzenia (rodzaj, typ public.url, projekt, czas), bez plików tymczasowych', async () => {
  const grupa = katalogTymczasowy('oczko-grupa-');
  const skrzynka = nowa(grupa);
  expect(await skrzynka.dodaj({ rodzaj: 'adres', adres: ADRES, nazwa: 'example.org', projektId: 'p1' })).toEqual({ ok: true, wartosc: { id: 'id-1' } });
  expect(await skrzynka.pobierz()).toEqual([{ id: 'id-1', rodzaj: 'adres', nazwa: 'example.org', sciezki: [], adres: ADRES, typ: 'public.url', projektId: 'p1', utworzonoMs: T0 }]);
  expect(readdirSync(join(grupa, 'skrzynka', 'id-1'))).toEqual(['zlecenie.json']); // plik .tmp zamieniony nazwą (rename), nic nie zostaje
  expect(JSON.parse(readFileSync(join(grupa, 'skrzynka', 'id-1', 'zlecenie.json'), 'utf8'))).toMatchObject({ id: 'id-1', rodzaj: 'adres', adres: ADRES });
});
test('K-17d: zlecenie bez projektu (projektId null) też się zapisuje — trafi do wyboru projektu', async () => {
  const grupa = katalogTymczasowy('oczko-grupa-');
  const skrzynka = nowa(grupa);
  await skrzynka.dodaj({ rodzaj: 'adres', adres: ADRES, nazwa: 'example.org', projektId: null });
  expect((await skrzynka.pobierz())[0]).toMatchObject({ projektId: null, adres: ADRES });
});
test('K-17d: kolejne dodaj nie nadpisują poprzedniego (osobne id, osobne katalogi)', async () => {
  const grupa = katalogTymczasowy('oczko-grupa-');
  let n = 0;
  const skrzynka = skrzynkaWKatalogu(grupa, () => T0, () => `id-${++n}`);
  await skrzynka.dodaj({ rodzaj: 'adres', adres: ADRES, nazwa: 'a', projektId: 'p1' });
  await skrzynka.dodaj({ rodzaj: 'adres', adres: `${ADRES}2`, nazwa: 'b', projektId: 'p1' });
  expect((await skrzynka.pobierz()).map((z) => z.id)).toEqual(['id-1', 'id-2']);
});
test('K-17d: katalog z samym plikiem tymczasowym (zapis przerwany przed rename) nie jest widoczny dla pobierz', async () => {
  const grupa = katalogTymczasowy('oczko-grupa-');
  const k = join(grupa, 'skrzynka', 'przerwane');
  mkdirSync(k, { recursive: true });
  writeFileSync(join(k, 'zlecenie.json.tmp'), '{"id":"przerwane"');
  expect(await nowa(grupa).pobierz()).toEqual([]);
});
test('K-17d: brak App Group (grupa === null) → błąd `zapis`, nic nie zapisane', async () => {
  const skrzynka = nowa(null);
  expect(await skrzynka.dodaj({ rodzaj: 'adres', adres: ADRES, nazwa: 'example.org', projektId: 'p1' })).toEqual({ ok: false, powod: 'zapis' });
  expect(await skrzynka.pobierz()).toEqual([]);
});
test('K-17d: błąd zapisu na dysku (katalog skrzynki nie do utworzenia) → `zapis` i brak śmieci', async () => {
  const grupa = katalogTymczasowy('oczko-grupa-');
  writeFileSync(join(grupa, 'skrzynka'), 'plik zamiast katalogu'); // utworzenie <grupa>/skrzynka/<id> musi się nie udać
  expect(await nowa(grupa).dodaj({ rodzaj: 'adres', adres: ADRES, nazwa: 'example.org', projektId: 'p1' })).toEqual({ ok: false, powod: 'zapis' });
  expect(existsSync(join(grupa, 'skrzynka', 'id-1'))).toBe(false);
});
