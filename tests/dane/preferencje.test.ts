// 07-jakosc-004 (ADR-0029, K-04a/b/e/f/g; BR-LIC-020/S3, BR-LIC-013/S2, BR-KAL-003/S6): preferencje urządzenia w tabeli `ustawienie` — przetrwają restart.
import { join } from 'node:path';
import { utworzPortNode } from '../../src/dane/baza/adapter-node';
import { utworzArchiwum } from '../../src/dane/archiwum';
import { migruj } from '../../src/dane/migracje/migruj';
import { preferencjeZUstawien } from '../../src/domena/preferencje';
import { WERSJA_SCHEMATU } from '../../src/konfiguracja';
import { preferencje } from '../../src/kompozycja/preferencje';
import { importuj } from '../../src/przypadki-uzycia/archiwum';
import { usunWszystkieDane } from '../../src/przypadki-uzycia/projekt';
import { projekt, archiwumWzorcowe } from './pomocnicze/dane-wejsciowe';
import { czasWTle, ile, jeden, przygotuj, zArchiwum } from './pomocnicze/srodowisko';

describe('K-04a: preferencjeZUstawien (czysta funkcja)', () => {
  test('brak kluczy → domyślne: wibracje i ekran włączone, miary „auto”', () => {
    expect(preferencjeZUstawien({})).toEqual({ wibracje: true, ekranNieGasnie: true, ukladMiar: 'auto' });
  });
  test('poprawne wartości przechodzą', () => {
    expect(preferencjeZUstawien({ wibracje: false, ekran_nie_gasnie: false, uklad_miar: 'imperial' })).toEqual({ wibracje: false, ekranNieGasnie: false, ukladMiar: 'imperial' });
    expect(preferencjeZUstawien({ uklad_miar: 'metric' }).ukladMiar).toBe('metric');
  });
  test('zły typ albo nieznany napis → wartość domyślna, nigdy zgadywanie (zapis uszkodzony = domyślna)', () => {
    expect(preferencjeZUstawien({ wibracje: 'nie', ekran_nie_gasnie: 0, uklad_miar: 'furlongs' })).toEqual({ wibracje: true, ekranNieGasnie: true, ukladMiar: 'auto' });
    expect(preferencjeZUstawien({ wibracje: null, ekran_nie_gasnie: undefined, uklad_miar: 7 })).toEqual({ wibracje: true, ekranNieGasnie: true, ukladMiar: 'auto' });
  });
});

describe('K-04b: restart (nowy kontener na tej samej bazie)', () => {
  test('zapis przez migawkę → nowa migawka wczytana z bazy ma te same wartości', async () => {
    const s = await przygotuj();
    const p = preferencje();
    expect(await p.zapisz(s.z, { wibracje: false, ekranNieGasnie: false, ukladMiar: 'imperial' })).toMatchObject({ ok: true });
    expect(p.stan()).toEqual({ wibracje: false, ekranNieGasnie: false, ukladMiar: 'imperial' });
    const poRestarcie = preferencje();
    expect(poRestarcie.stan().wibracje).toBe(true); // przed wczytaniem: domyślne
    await poRestarcie.wczytaj(s.z);
    expect(poRestarcie.stan()).toEqual({ wibracje: false, ekranNieGasnie: false, ukladMiar: 'imperial' });
  });
  test('zapis złego typu w bazie (JSON, ale nie wartość z listy) → domyślna dla tego klucza, pozostałe zachowane (schemat odrzuca nie-JSON: CHECK json_valid)', async () => {
    const s = await przygotuj();
    await s.baza.run("INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES ('wibracje', '\"nie\"', 1), ('uklad_miar', '\"metric\"', 1)");
    const p = preferencje();
    await p.wczytaj(s.z);
    expect(p.stan()).toEqual({ wibracje: true, ekranNieGasnie: true, ukladMiar: 'metric' });
  });
});

describe('K-04e: bez migracji', () => {
  test('wczytanie na bazie bez kluczy nie zapisuje żadnego wiersza, user_version bez zmiany, integrity_check = ok', async () => {
    const s = await przygotuj();
    const wersja = await jeden<{ user_version: number }>(s.baza, 'PRAGMA user_version');
    const przed = await ile(s.baza, 'ustawienie');
    await preferencje().wczytaj(s.z);
    expect(await ile(s.baza, 'ustawienie')).toBe(przed);
    expect(await jeden<{ user_version: number }>(s.baza, 'PRAGMA user_version')).toEqual(wersja);
    expect(wersja.user_version).toBe(WERSJA_SCHEMATU);
    expect(await jeden<{ integrity_check: string }>(s.baza, 'PRAGMA integrity_check')).toEqual({ integrity_check: 'ok' });
  });
});

describe('K-04f: import nie dotyka kluczy urządzenia', () => {
  test.each(['zastap', 'scal'] as const)('„%s” archiwum zawierającego te klucze zostawia lokalne wartości', async (tryb) => {
    const s = await przygotuj();
    const p = preferencje();
    await p.zapisz(s.z, { wibracje: false, ukladMiar: 'metric' });
    const sciezka = archiwumWzorcowe(s.katalog, 'obce', [projekt('cz', 'Czapka'),
      ['INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES (?, ?, ?)', ['wibracje', 'true', 1]],
      ['INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES (?, ?, ?)', ['uklad_miar', '"imperial"', 1]],
      ['INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES (?, ?, ?)', ['ekran_nie_gasnie', 'false', 1]]]);
    const za = zArchiwum(s.z);
    const w = await importuj(za, { sciezka, wybierz: async () => tryb });
    expect(w).toMatchObject({ ok: true });
    const q = preferencje();
    await q.wczytaj(s.z);
    expect(q.stan()).toEqual({ wibracje: false, ekranNieGasnie: true, ukladMiar: 'metric' });
  });
});

describe('K-04g: błąd zapisu i reset', () => {
  test('zablokowana baza (zapis rzuca) → wynik błąd, migawka bez zmiany', async () => {
    const s = await przygotuj();
    const p = preferencje();
    await p.zapisz(s.z, { ukladMiar: 'metric' });
    const zepsuta = { ...s.z, baza: { ...s.baza, transakcja: () => Promise.reject(new Error('SQLITE_FULL')), run: s.baza.run, all: s.baza.all } };
    const w = await p.zapisz(zepsuta as unknown as typeof s.z, { ukladMiar: 'imperial', wibracje: false });
    expect(w).toMatchObject({ ok: false });
    expect(p.stan()).toEqual({ wibracje: true, ekranNieGasnie: true, ukladMiar: 'metric' });
  });
  test('po „Usuń wszystkie dane” przeładowana migawka = wartości domyślne', async () => {
    const s = await przygotuj();
    const p = preferencje();
    await p.zapisz(s.z, { wibracje: false, ukladMiar: 'imperial' });
    expect(await usunWszystkieDane(zArchiwum(s.z))).toMatchObject({ ok: true });
    await p.wczytaj(s.z);
    expect(p.stan()).toEqual({ wibracje: true, ekranNieGasnie: true, ukladMiar: 'auto' });
  });
});
void join; void utworzPortNode; void utworzArchiwum; void migruj; void czasWTle;
