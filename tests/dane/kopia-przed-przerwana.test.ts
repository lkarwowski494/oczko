// 12-niezawodnosc-506 (P-443; NIE-03 / ARCH-11; ADR-0028, ADR-0032, ADR-0033): zapis archiwum `.oczko` przerwany zabiciem procesu (bez `catch`)
// nie może zostawić pliku pod nazwą docelową. Niepełny plik `oczko-przed-importem-<dzień>.oczko` byłby „pierwszą kopią dnia” w puli, a prawdziwa
// kopia sprzed serii (`-2`) znikałaby przy kamieniu następnego dnia. Przerwanie: przy 5. zapisie kawałka ZIP-a stan dysku jest zrzucany, a po
// zakończeniu wywołania katalogi wracają do tego zrzutu (sprzątanie z `catch` nie ma skutku, jak po SIGKILL); baza nie jest zmieniana przed wczytaniem.
import { cpSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { FileHandle } from '../narzedzia/expo-file-system-node'; // ten sam moduł co `expo-file-system` w Jest (moduleNameMapper)
import { utworzArchiwum } from '../../src/dane/archiwum';
import { migruj } from '../../src/dane/migracje/migruj';
import { sprzatnijKopiePrzed, sprzatnijTymczasowe } from '../../src/niezawodnosc/kopie';
import { ROZSZERZENIE_ARCHIWUM } from '../../src/konfiguracja';
import { eksportuj, importuj } from '../../src/przypadki-uzycia/archiwum';
import { archiwumWzorcowe, projekt, zycie } from './pomocnicze/dane-wejsciowe';
import { DOBA, czasWTle, licznosci, migawka, przygotuj, wlozPlik, wykonaj } from './pomocnicze/srodowisko';

const PLIK_PRZED = /^oczko-przed-(importem|usunieciem)-(\d{4})-(\d{2})-(\d{2})(?:-(\d+))?\.oczko$/; // ADR-0032 pkt 5
const POMIN = ['blad', 'ustawienie'];

async function srodowisko() {
  const s = await przygotuj();
  const pliki = { pdf: wlozPlik(s.magazyn, Buffer.from('PDF-1.4 abc'), 'pdf'), rys: wlozPlik(s.magazyn, Buffer.from('PKDRAWING'), 'pkdrawing'), jpg: wlozPlik(s.magazyn, Buffer.from('JPEG-DANE!'), 'jpg') };
  await wykonaj(s.baza, zycie(pliki));
  const archiwum = utworzArchiwum({ baza: s.baza, magazyn: s.magazyn, zegar: s.zegar, katalogi: s.z.katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
  return { ...s, za: { ...s.z, archiwum, czasWTle } };
}

/** Uzbrojone przerwanie: przy `n`-tym zapisie kawałka zrzut katalogów i wyjątek; `przywroc()` cofa katalogi do zrzutu (stan dysku po zabiciu). */
function przerwanie(katalogi: string[], n = 5) {
  const zrzut = mkdtempSync(join(tmpdir(), 'oczko-zrzut-'));
  let uzbrojone = false, licznik = 0, zrzucono = false;
  const oryginal = FileHandle.prototype.writeBytes;
  const szpieg = jest.spyOn(FileHandle.prototype, 'writeBytes').mockImplementation(function (this: FileHandle, b: Uint8Array) {
    if (uzbrojone && ++licznik === n) {
      katalogi.forEach((k, i) => cpSync(k, join(zrzut, String(i)), { recursive: true }));
      zrzucono = true;
      uzbrojone = false;
      throw new Error('[symulacja] proces zabity w trakcie zapisu ZIP-a');
    }
    return oryginal.call(this, b);
  });
  return {
    uzbroj() { uzbrojone = true; licznik = 0; },
    przywroc() {
      szpieg.mockRestore();
      if (!zrzucono) throw new Error('przerwanie nie nastąpiło');
      katalogi.forEach((k, i) => { rmSync(k, { recursive: true, force: true }); cpSync(join(zrzut, String(i)), k, { recursive: true }); });
    },
  };
}
const pliki = (k: string) => readdirSync(k).sort();

describe('12-niezawodnosc-506: przerwany zapis archiwum nie zostawia pliku pod nazwą docelową', () => {
  test('12-niezawodnosc-506 S5: „Zastąp” zabite w trakcie ZIP-a → w Backup nic; start sprząta plik tymczasowy; ponowienie tego dnia i „Zastąp” dnia 1 → kopia sprzed serii zostaje po kamieniu i jej import przywraca liczności', async () => {
    const s = await srodowisko();
    const backup = s.z.katalogi.kopiePrzed, tmp = s.z.katalogi.tymczasowy;
    const przed = await licznosci(s.baza);
    const migPrzed = await migawka(s.baza, POMIN);
    const backupPrzed = pliki(backup), tmpPrzed = pliki(tmp);
    expect(backupPrzed).toEqual([]);

    // dzień 0: „Zastąp” przerwane przy 5. zapisie kawałka kopii przed (po sprawdzeniu archiwum, które też pisze pliki)
    const p = przerwanie([backup, tmp]);
    const w0 = await importuj(s.za, { sciezka: archiwumWzorcowe(s.katalog, 'plik-a', [projekt('plik-a', 'plik-a')]), wybierz: async () => { p.uzbroj(); return 'zastap'; } });
    expect(w0.ok).toBe(false);
    p.przywroc();
    expect(await licznosci(s.baza)).toEqual(przed); // baza nietknięta (kopia przed wczytaniem)
    expect(pliki(backup).filter((n) => PLIK_PRZED.test(n))).toEqual([]); // nic pod nazwą z puli kopii
    const sierotyTmp = pliki(tmp).filter((n) => !tmpPrzed.includes(n));
    expect(sierotyTmp.filter((n) => n.endsWith(ROZSZERZENIE_ARCHIWUM))).toEqual([]);

    // start po zabiciu: sprzątanie katalogu tymczasowego (wpisy sprzed startu) i pula kopii przy kamieniu
    expect(sprzatnijTymczasowe(tmp, Date.now() + 1)).toMatchObject({ ok: true });
    expect(pliki(tmp)).toEqual([]);
    expect(sprzatnijKopiePrzed(backup, s.zegar.teraz().ms)).toEqual({ ok: true, wartosc: [] });

    // ponowienie tego dnia (udane) → kopia z danymi sprzed serii
    const w1 = await importuj(s.za, { sciezka: archiwumWzorcowe(s.katalog, 'plik-b', [projekt('plik-b', 'plik-b')]), wybierz: async () => 'zastap' });
    if (!w1.ok || w1.wartosc.kopiaPrzed === null) throw new Error('zastap 1');
    const kopiaSerii = w1.wartosc.kopiaPrzed;
    expect(basename(kopiaSerii)).toBe(`oczko-przed-importem-${s.zegar.teraz().dzien}${ROZSZERZENIE_ARCHIWUM}`);
    const rozmiarSerii = statSync(kopiaSerii).size;

    // dzień 1: kolejne „Zastąp”, kamień milowy
    s.zegar.przesun(DOBA);
    const w2 = await importuj(s.za, { sciezka: archiwumWzorcowe(s.katalog, 'plik-c', [projekt('plik-c', 'plik-c')]), wybierz: async () => 'zastap' });
    if (!w2.ok || w2.wartosc.kopiaPrzed === null) throw new Error('zastap 2');
    expect(sprzatnijKopiePrzed(backup, s.zegar.teraz().ms)).toEqual({ ok: true, wartosc: [] });
    expect(pliki(backup)).toEqual([basename(kopiaSerii), basename(w2.wartosc.kopiaPrzed)].sort());
    expect(statSync(kopiaSerii).size).toBe(rozmiarSerii);

    // import kopii sprzed serii przywraca dane sprzed pierwszego „Zastąp”
    expect(await importuj(s.za, { sciezka: kopiaSerii, wybierz: async () => 'zastap' })).toMatchObject({ ok: true, wartosc: { tryb: 'zastap' } });
    expect(await licznosci(s.baza)).toEqual(przed);
    expect(await migawka(s.baza, POMIN)).toBe(migPrzed);
    expect(await s.baza.all('PRAGMA integrity_check')).toEqual([{ integrity_check: 'ok' }]);
    expect(await s.baza.all('PRAGMA foreign_key_check')).toEqual([]);
    if (process.env.DOWOD_M2) {
      console.log(JSON.stringify({ licznosciPrzed: przed, licznosciPo: await licznosci(s.baza), backupPrzed, backupPo: pliki(backup), tmpPrzed, sierotyTmpPoPrzerwaniu: sierotyTmp, tmpPoStarcie: [], integrity: 'ok', foreignKeys: [] }, null, 1));
    }
  });

  test('12-niezawodnosc-506 eksport: zapis `.oczko` zabity w trakcie ZIP-a → w katalogu docelowym nie ma pliku `.oczko`, a sierotę usuwa sprzątanie przy starcie', async () => {
    const s = await srodowisko();
    const tmp = s.z.katalogi.tymczasowy;
    const p = przerwanie([tmp]);
    p.uzbroj();
    expect((await eksportuj(s.za, { katalogDocelowy: tmp })).ok).toBe(false);
    p.przywroc();
    expect(pliki(tmp).filter((n) => n.endsWith(ROZSZERZENIE_ARCHIWUM))).toEqual([]);
    expect(sprzatnijTymczasowe(tmp, Date.now() + 1)).toMatchObject({ ok: true });
    expect(pliki(tmp)).toEqual([]);
  });
});
