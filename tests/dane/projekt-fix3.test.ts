// Kontrakt 05 fix-3 dla schematu v1 (P-124 Q3a, Q5a; P-126 (1b); test roli 08 z wyroczni 05, do przeglądu 07):
// `ukonczono_dzien` (dzień lokalny RD-16 przy ukończeniu, tydzień po dacie lokalnej — moduly.md „Ukończone w tygodniu…”),
// `nienazwany` (projekt roboczy, dane.md „Projekt roboczy bez nazwy”), `application_id` (dane.md „Identyfikator pliku bazy”).
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sprawdzKopie } from '../../src/dane/kopia-ratunkowa';
import { APPLICATION_ID } from '../../src/dane/migracje/migruj';
import { podsumowanieTygodnia } from '../../src/dane/repozytoria/kalendarz';
import { utworzSzybkiLicznik } from '../../src/przypadki-uzycia/licznik';
import { nazwijProjekt, utworzProjekt, wznowProjekt, zakonczProjekt, zmienDateUkonczenia, zrobPonownie } from '../../src/przypadki-uzycia/projekt';
import { KORZEN, SCHEMAT_V1 } from './pomocnicze/dane-wejsciowe';
import { jeden, przygotuj } from './pomocnicze/srodowisko';

const OK = { ok: true, wartosc: undefined };
const stan = (s: Awaited<ReturnType<typeof przygotuj>>, id: string) =>
  jeden<{ stan: string; ukonczono_ms: number | null; ukonczono_dzien: string | null }>(s.baza, 'SELECT stan, ukonczono_ms, ukonczono_dzien FROM projekt WHERE id = ?', [id]);
const nazwa = (s: Awaited<ReturnType<typeof przygotuj>>, id: string) =>
  jeden<{ nazwa: string; nienazwany: number }>(s.baza, 'SELECT nazwa, nienazwany FROM projekt WHERE id = ?', [id]);
async function zProjektem() {
  const s = await przygotuj();
  const p = await utworzProjekt(s.z, { nazwa: 'Sweter', czesci: [] });
  if (!p.ok) throw new Error(p.powod);
  return { s, id: p.wartosc.projektId };
}

describe('ukonczono_dzien (P-123 pkt 4, P-124 Q5a)', () => {
  test('ukoncz zapisuje dzień lokalny z Zegar.teraz(), wznow czyści oba pola', async () => {
    const { s, id } = await zProjektem();
    s.zegar.ustaw(Date.UTC(2026, 9, 25, 22, 30), 'Europe/Moscow'); // poniedziałek 2026-10-26 01:30 w UTC+3
    expect(await zakonczProjekt(s.z, { projektId: id })).toEqual(OK);
    expect(await stan(s, id)).toEqual({ stan: 'ukonczony', ukonczono_ms: Date.UTC(2026, 9, 25, 22, 30), ukonczono_dzien: '2026-10-26' });
    expect(await wznowProjekt(s.z, { projektId: id })).toEqual(OK);
    expect(await stan(s, id)).toEqual({ stan: 'w_toku', ukonczono_ms: null, ukonczono_dzien: null });
  });

  test('zmienDateUkonczenia zmienia oba pola; dzień spoza RRRR-MM-DD → bledne_dane, bez zapisu', async () => {
    const { s, id } = await zProjektem();
    await zakonczProjekt(s.z, { projektId: id });
    // 08 partia 4 (P-137, aneks 05 fix-4): sygnatura bez ukonczonoMs — chwila = ta sama pora co ukończenie (T0 = 12:00 Warszawa = 10:00 UTC).
    expect(await zmienDateUkonczenia(s.z, { projektId: id, ukonczonoDzien: '2026-10-01' })).toEqual(OK);
    expect(await stan(s, id)).toMatchObject({ ukonczono_ms: Date.UTC(2026, 9, 1, 10), ukonczono_dzien: '2026-10-01' });
    expect(await zmienDateUkonczenia(s.z, { projektId: id, ukonczonoDzien: '2.10.2026' })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await stan(s, id)).toMatchObject({ ukonczono_dzien: '2026-10-01' });
  });

  test.each([
    ['poniedziałek 01:30 w UTC+3 → tydzień od tego poniedziałku', Date.UTC(2026, 9, 25, 22, 30), 'Europe/Moscow', { '2026-10-26': 1, '2026-10-25': 0 }],
    ['niedziela 23:30 w UTC−5 (poniedziałek 04:30 UTC) → tydzień tej niedzieli', Date.UTC(2026, 9, 26, 4, 30), 'America/Bogota', { '2026-10-25': 1, '2026-10-26': 0 }],
  ] as const)('moduly.md wyrocznia: %s', async (_n, ms, strefa, oczekiwane) => {
    const { s, id } = await zProjektem();
    s.zegar.ustaw(ms, strefa);
    await zakonczProjekt(s.z, { projektId: id });
    for (const [dzis, n] of Object.entries(oczekiwane)) {
      expect([dzis, (await podsumowanieTygodnia(s.baza, { dzis, pierwszyDzienTygodnia: 1 })).ukonczone]).toEqual([dzis, n]);
    }
  });

  test('CHECK: ukończony bez ukonczono_dzien odrzucony przez bazę', async () => {
    const { s, id } = await zProjektem();
    await expect(s.baza.run("UPDATE projekt SET stan = 'ukonczony', ukonczono_ms = 1 WHERE id = ?", [id])).rejects.toThrow(/CHECK/);
  });
});

describe('nienazwany — projekt roboczy (P-126 (1b))', () => {
  test('licznik od pierwszego uruchomienia: nienazwany = 1, nazwa zapasowa = data startu', async () => {
    const s = await przygotuj();
    const r = await utworzSzybkiLicznik(s.z);
    if (!r.ok) throw new Error(r.powod);
    expect(await nazwa(s, r.wartosc.projektId)).toEqual({ nazwa: s.zegar.teraz().dzien, nienazwany: 1 });
  });

  test('nadanie nazwy: nazwa = wpis i nienazwany = 0', async () => {
    const s = await przygotuj();
    const r = await utworzSzybkiLicznik(s.z);
    if (!r.ok) throw new Error(r.powod);
    expect(await nazwijProjekt(s.z, { projektId: r.wartosc.projektId, nazwa: ' Czapka ' })).toEqual(OK);
    expect(await nazwa(s, r.wartosc.projektId)).toEqual({ nazwa: 'Czapka', nienazwany: 0 });
  });

  test('„Zrób taką samą” z roboczego → roboczy z własną datą; z nazwanego → nazwany', async () => {
    const s = await przygotuj();
    const r = await utworzSzybkiLicznik(s.z);
    if (!r.ok) throw new Error(r.powod);
    s.zegar.przesun(3 * 86_400_000);
    const kopia = await zrobPonownie(s.z, { projektId: r.wartosc.projektId, szablonNazwy: '{{nazwa}} {{n}}' });
    if (!kopia.ok) throw new Error(kopia.powod);
    expect(await nazwa(s, kopia.wartosc.projektId)).toEqual({ nazwa: s.zegar.teraz().dzien, nienazwany: 1 });
    const { s: s2, id } = await zProjektem();
    const k2 = await zrobPonownie(s2.z, { projektId: id, szablonNazwy: '{{nazwa}} {{n}}' });
    if (!k2.ok) throw new Error(k2.powod);
    expect(await nazwa(s2, k2.wartosc.projektId)).toEqual({ nazwa: 'Sweter 2', nienazwany: 0 }); // M1-136 (DEC-35 b): kolejny wolny numer
  });
});

describe('application_id (P-123 pkt 11, P-124 Q5a)', () => {
  test('stała APPLICATION_ID = wartość w schemat.sql = 0x4F637A6B; baza po migracji ma ten identyfikator', async () => {
    const wSchemacie = /PRAGMA application_id = (\d+);/.exec(SCHEMAT_V1)?.[1];
    expect([APPLICATION_ID, Number(wSchemacie)]).toEqual([0x4f637a6b, 0x4f637a6b]);
    const s = await przygotuj();
    expect(await jeden(s.baza, 'PRAGMA application_id')).toEqual({ application_id: APPLICATION_ID });
  });

  test('0001.sql = schemat.sql także w PRAGMA application_id', () => {
    expect(readFileSync(join(KORZEN, 'src/dane/migracje/0001.sql'), 'utf8')).toContain('PRAGMA application_id = 1331919467;');
  });

  test('sprawdzKopie: baza z innym application_id odrzucona jako obca (bledne_dane) mimo poprawnych tabel', async () => {
    const s = await przygotuj();
    const sciezka = join(s.katalog, 'obca.db');
    await s.baza.run('VACUUM INTO ?', [sciezka]);
    const db = new DatabaseSync(sciezka);
    db.exec('PRAGMA application_id = 1');
    db.close();
    expect(await sprawdzKopie(sciezka)).toEqual({ ok: false, powod: 'bledne_dane' });
    const wlasna = join(s.katalog, 'wlasna.db');
    await s.baza.run('VACUUM INTO ?', [wlasna]);
    expect(await sprawdzKopie(wlasna)).toEqual({ ok: true, wartosc: { wersjaSchematu: 1 } });
  });
});
