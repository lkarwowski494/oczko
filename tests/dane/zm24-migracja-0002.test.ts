// PU-354 (katalog: „Oczekujące 1.0.2”). ZM-24 (U6, ADR-0036 K1, P-1097) i ZM-21 (U3, P-1098): pierwsza migracja po wydaniu (0002:
// `ALTER TABLE licznik ADD COLUMN krok INTEGER NOT NULL DEFAULT 1 CHECK (krok IN (1, 2))`) na kopii bazy wydanej 1.0.1 (`tests/bazy/v1.db`
// z -wal/-shm, R-075) — liczności, integrity_check, foreign_key_check, user_version 1 → 2, drugi przebieg bez zmian (ARCH-09), `krok = 1`
// dla istniejących; U3: `wartosc` i `znaczenie` każdego licznika bez zmian (zasada wspólna 10). Wyrocznia: dane wzorca sprzed migracji
// (odczyt pliku przed otwarciem kodem aplikacji) i decyzje P-1097/P-1098, nie kod migracji.
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { utworzPortNode } from '../../src/dane/baza/adapter-node';
import { migruj } from '../../src/dane/migracje/migruj';
import { KORZEN, czytajBaze, licznosciPliku } from './pomocnicze/dane-wejsciowe';
import { katalogTymczasowy, licznosci, migawka } from './pomocnicze/srodowisko';

const WZOR = join(KORZEN, 'tests/bazy/v1.db');
type Licznik = { id: string; wartosc: number; znaczenie: string };
function kopiaV1(): string {
  const kopia = join(katalogTymczasowy('oczko-0002-'), 'oczko.db');
  for (const s of ['', '-wal', '-shm']) if (existsSync(WZOR + s)) copyFileSync(WZOR + s, kopia + s);
  return kopia;
}
async function zKolumnaKrok(baza: ReturnType<typeof utworzPortNode>): Promise<void> {
  const kolumny = (await baza.all<{ name: string }>('PRAGMA table_info(licznik)')).map((k) => k.name);
  if (!kolumny.includes('krok')) throw new Error('NIEZAIMPLEMENTOWANE: ZM-24 migracja 0002 (licznik.krok, ADR-0036 K1)');
}

describe('ZM-24 / ZM-21 aktualizacja 1.0.1 → 1.0.2 na kopii v1.db', () => {
  test('ZM-24 PU-354: migruj → user_version 2, liczności i spójność bez zmian, drugi przebieg bez zmian; krok = 1 dla każdego licznika', async () => {
    const kopia = kopiaV1();
    const przed = licznosciPliku(kopia);
    const baza = utworzPortNode(kopia);
    expect(await migruj(baza)).toEqual({ ok: true, wartosc: { z: 1, do: 2 } });
    await zKolumnaKrok(baza);
    const po = await licznosci(baza);
    for (const t of Object.keys(przed)) expect({ t, n: po[t] }).toEqual({ t, n: przed[t] });
    expect(await baza.all('PRAGMA integrity_check')).toEqual([{ integrity_check: 'ok' }]);
    expect(await baza.all('PRAGMA foreign_key_check')).toEqual([]);
    expect(await baza.all('PRAGMA user_version')).toEqual([{ user_version: 2 }]);
    const kroki = await baza.all<{ krok: number }>('SELECT krok FROM licznik');
    expect(kroki.length).toBeGreaterThan(0);
    expect(kroki.every((k) => k.krok === 1)).toBe(true);
    const m = await migawka(baza);
    expect(await migruj(baza)).toEqual({ ok: true, wartosc: { z: 2, do: 2 } });
    expect(await migawka(baza)).toBe(m);
  });

  test('ZM-24 PU-354: CHECK (krok IN (1, 2)) odrzuca krok = 3 i krok = 0; krok = 2 przyjęty (KROK_MAKS, ARCH-02)', async () => {
    const baza = utworzPortNode(kopiaV1());
    await migruj(baza);
    await zKolumnaKrok(baza);
    const [l] = await baza.all<{ id: string }>('SELECT id FROM licznik LIMIT 1');
    await expect(baza.run('UPDATE licznik SET krok = 3 WHERE id = ?', [l.id])).rejects.toThrow(/CHECK/);
    await expect(baza.run('UPDATE licznik SET krok = 0 WHERE id = ?', [l.id])).rejects.toThrow(/CHECK/);
    await baza.run('UPDATE licznik SET krok = 2 WHERE id = ?', [l.id]);
    expect(await baza.all('SELECT krok FROM licznik WHERE id = ?', [l.id])).toEqual([{ krok: 2 }]);
  });

  test('ZM-24 PU-354: zmiana kroku nie trafia do skrzynki iCloud (krok lokalny w 1.0.2: wyzwalacz licznik_icloud_u bez `krok`, icloud-tabele.json `pomin`)', async () => {
    const baza = utworzPortNode(kopiaV1());
    await migruj(baza);
    await zKolumnaKrok(baza);
    const [l] = await baza.all<{ id: string }>('SELECT id FROM licznik LIMIT 1');
    const ile = async () => (await baza.all<{ n: number }>('SELECT count(*) AS n FROM zmiana_icloud'))[0].n;
    const n0 = await ile();
    await baza.run('UPDATE licznik SET krok = 2 WHERE id = ?', [l.id]);
    expect(await ile()).toBe(n0);
  });

  test('ZM-21 PU-354: po aktualizacji każdy licznik ma tę samą wartość i znaczenie co w bazie 1.0.1 (U3 bez migracji znaczenia, P-1098)', async () => {
    const kopia = kopiaV1();
    const przed = czytajBaze<Licznik>(kopia, 'SELECT id, wartosc, znaczenie FROM licznik ORDER BY id');
    expect(przed.length).toBeGreaterThan(0);
    const baza = utworzPortNode(kopia);
    expect(await migruj(baza)).toEqual({ ok: true, wartosc: { z: 1, do: 2 } }); // 1.0.2 = schemat 2 (ADR-0036); bez migracji test nie dowodzi aktualizacji
    expect(await baza.all<Licznik>('SELECT id, wartosc, znaczenie FROM licznik ORDER BY id')).toEqual(przed);
  });
});
