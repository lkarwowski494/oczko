// Luki pokrycia E3 (rola 07): eksport bez Pro na limicie (BR-DAN-005/S2, docs/brd/wymagania-dane.md:61; L-07, S-09, KP-02: eksport
// nie woła strażnika i działa tak samo) oraz aktualizacja bez Pro (BR-ZAK-003/S2, wymagania-dane.md:229; KP-01: LIMIT_DNI ≥ poprzednie
// wydanie = 5 (P-057 D2), migracja zachowuje dni limitu i stan dostępu w `ustawienie`, dane.md:41).
// Poziom dane-node:sqlite (sygnatury: src/przypadki-uzycia/archiwum.ts eksportuj, src/dane/migracje/migruj.ts, adapter-node).
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { utworzArchiwum } from '../../../src/dane/archiwum';
import { utworzPortNode } from '../../../src/dane/baza/adapter-node';
import { migruj } from '../../../src/dane/migracje/migruj';
import { startDnia } from '../../../src/domena/limit';
import { LIMIT_DNI_W_MIESIACU, WERSJA_SCHEMATU } from '../../../src/konfiguracja';
import { eksportuj } from '../../../src/przypadki-uzycia/archiwum';
import type { Manifest } from '../../../src/przypadki-uzycia/porty-propozycja';
import { bazaWzorcowa, czytajZip, dzienLimitu, zycie, type Instr } from '../pomocnicze/dane-wejsciowe';
import { T0, czasWTle, katalogTymczasowy, licznosci, przygotuj, wlozPlik, wykonaj } from '../pomocnicze/srodowisko';

/** Poprzednie wydanie (P-057 D2): 5 darmowych dni limitu w miesiącu (KP-01: limit raz wydany tylko się luzuje). */
const LIMIT_POPRZEDNIEGO_WYDANIA = 5;

describe('BR-DAN-005 eksport bez Pro na limicie (KP-02)', () => {
  test('BR-DAN-005/S2 bez Pro, 5 z 5 dni użyte → eksport działa tak samo jak z Pro (te same liczności), bez nowego dnia limitu', async () => {
    const wynik: Record<string, Manifest['licznosci']> = {};
    for (const pro of [false, true]) {
      const s = await przygotuj();
      s.pro.wartosc = pro;
      const pliki = { pdf: wlozPlik(s.magazyn, 'PDF-1.4 abc', 'pdf'), rys: wlozPlik(s.magazyn, 'PKDRAWING', 'pkdrawing'), jpg: wlozPlik(s.magazyn, 'JPEG-DANE!', 'jpg') };
      const dni: Instr[] = ['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-09'].map((d) => dzienLimitu(d, 'l1-z1'));
      await wykonaj(s.baza, [...zycie(pliki), ...dni]); // zycie() dodaje 2026-10-22 = dziś (T0): 5 z 5
      const archiwum = utworzArchiwum({ baza: s.baza, magazyn: s.magazyn, zegar: s.zegar, katalogi: s.z.katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
      const cel = join(s.katalog, 'eksport');
      mkdirSync(cel, { recursive: true });
      const przed = await licznosci(s.baza);
      expect(przed.dzien_limitu).toBe(5);
      const w = await eksportuj({ ...s.z, archiwum, czasWTle }, { katalogDocelowy: cel });
      if (!w.ok) throw new Error(`eksport (pro=${pro}): ${w.powod}`);
      const manifest = JSON.parse(czytajZip(w.wartosc.sciezka).get('manifest.json')!.toString('utf8')) as Manifest;
      expect(manifest.licznosci).toEqual(przed);
      expect(await licznosci(s.baza)).toEqual(przed); // eksport nie dopisuje dnia limitu (nie woła strażnika)
      wynik[String(pro)] = manifest.licznosci;
    }
    expect(wynik.false).toEqual(wynik.true);
  });
});

describe('BR-ZAK-003 aktualizacja nie zabiera darmowego limitu (KP-01)', () => {
  test('BR-ZAK-003/S2 baza poprzedniej wersji bez Pro: po migracji dni limitu i stan dostępu bez zmian, limit ≥ 5, 4 z 5 dni → dzień dozwolony', async () => {
    const sciezka = join(katalogTymczasowy(), 'oczko.db');
    const dni: Instr[] = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04'].map((d) => dzienLimitu(d, `z-${d}`));
    // Klucz stanu dostępu w `ustawienie` (dane.md:41 „ostatni stan dla zegarka”): nazwa [DO USTALENIA] 05; test porównuje całą tabelę.
    const ustawienie: Instr = ["INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES ('pro', '{\"produkty\":[],\"wygasa\":null}', ?)", [T0]];
    bazaWzorcowa(sciezka, [...dni, ustawienie], { userVersion: 1 });
    const baza = utworzPortNode(sciezka);
    expect(await migruj(baza)).toEqual({ ok: true, wartosc: { z: 1, do: WERSJA_SCHEMATU } });
    expect(await baza.all('SELECT dzien, pro, zaczeto_ms, zdarzenie_id FROM dzien_limitu ORDER BY dzien')).toEqual(
      ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04'].map((d) => ({ dzien: d, pro: 0, zaczeto_ms: T0, zdarzenie_id: `z-${d}` })),
    );
    expect(await baza.all('SELECT klucz, wartosc, zmieniono_ms FROM ustawienie')).toEqual([{ klucz: 'pro', wartosc: '{"produkty":[],"wygasa":null}', zmieniono_ms: T0 }]);
    expect(LIMIT_DNI_W_MIESIACU).toBeGreaterThanOrEqual(LIMIT_POPRZEDNIEGO_WYDANIA);
    const dniLimitu = (await baza.all<{ dzien: string; pro: number }>('SELECT dzien, pro FROM dzien_limitu')).map((r) => ({ data: r.dzien, pro: r.pro === 1 }));
    expect(startDnia({ dni: dniLimitu, dzis: '2026-11-09', teraz: 1_800_000_000_000, ostatniPlus: null, pro: false })).toMatchObject({ dozwolone: true });
    baza.zamknij();
  });
});
