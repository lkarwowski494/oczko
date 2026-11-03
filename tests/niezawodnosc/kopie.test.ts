// Rola 12 E2: sprzątanie kopii (ADR-0020 (6): 30 dni, nigdy przed kamieniem milowym) i ZIP surowej kopii (ADR-0020 (3), opcja B P-080 (3b)).
// Wyrocznie: liczby z ADR-0020 „Potwierdzenie” (29 dni zostaje, 31 usunięta), format ZIP czytany niezależnym czytnikiem testów (APPNOTE),
// SHA-256 z node:crypto, nagłówek pliku SQLite (sqlite.org/fileformat2.html §1.3: user_version offset 60, application_id offset 68, big-endian).
import { existsSync, lstatSync, mkdirSync, readdirSync, statSync, symlinkSync, truncateSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { KOPIA_PRZED_IMPORTEM_BUDZET_B, KOPIA_PRZED_IMPORTEM_DNI, KOPIA_PRZED_IMPORTEM_MAKS, KOPIE_RATUNKOWE_DNI } from '../../src/konfiguracja';
import { nazwaArchiwum } from '../../src/dane/archiwum';
import { czySaKopiePrzed, kopieDoUsuniecia, kopiePrzedDoUsuniecia, saKopiePrzed, sprzatnijKopie, sprzatnijKopiePrzed, zipSurowejKopii, type ManifestSurowejKopii } from '../../src/niezawodnosc/kopie';
import { czytajZip } from '../dane/pomocnicze/dane-wejsciowe';
import { DOBA, T0, katalogTymczasowy, sha256, sha256Pliku } from '../dane/pomocnicze/srodowisko';
import { procesZabityZOtwartaBaza, uszkodzStrone } from './pomocnicze';

const dni = (n: number) => T0 - n * DOBA;
const SUROWE = ['oczko.db', 'oczko.db-wal', 'oczko.db-shm']; // jak wynik surowaKopia (PLIK_BAZY + -wal, -shm)
const plik = (nazwa: string) => ({ nazwa, katalog: false });
const katalog = (nazwa: string) => ({ nazwa, katalog: true });

describe('P-080 ADR-0020 (6) sprzątanie kopii (wołane tylko przy kamieniu milowym)', () => {
  test('P-080: KOPIE_RATUNKOWE_DNI = 30', () => expect(KOPIE_RATUNKOWE_DNI).toBe(30));

  test('P-080: kopia 29 dni zostaje, 31 dni usunięta — każdy rodzaj kopii z czasem w nazwie', () => {
    const wpisy = [
      katalog(`ratunkowe-${dni(29)}`), katalog(`ratunkowe-${dni(31)}`),
      plik(`przed-importem-${dni(29)}.db`), plik(`przed-importem-${dni(31)}.db`),
      plik(`przed-przywroceniem-${dni(29)}.db`), plik(`przed-przywroceniem-${dni(31)}.db`),
      plik(`przed-migracja-2-${dni(31)}.db`), plik(`przed-migracja-3-${dni(29)}.db`),
    ];
    expect(kopieDoUsuniecia(wpisy, T0).sort()).toEqual([`przed-importem-${dni(31)}.db`, `przed-migracja-2-${dni(31)}.db`, `przed-przywroceniem-${dni(31)}.db`, `ratunkowe-${dni(31)}`].sort());
  });

  test('P-080: granica — dokładnie 30 dni zostaje, 30 dni + 1 ms usunięta', () => {
    expect(kopieDoUsuniecia([plik(`przed-importem-${dni(30)}.db`), plik(`przed-importem-${dni(30) - 1}.db`)], T0)).toEqual([`przed-importem-${dni(30) - 1}.db`]);
  });

  test('P-080: bez czasu w nazwie (np. dzisiejsze `przed-migracja-2.db`), nazwa obca albo czas z przyszłości (zegar cofnięty) → zostaje', () => {
    const wpisy = [plik('przed-migracja-2.db'), plik('notatki.txt'), katalog('ratunkowe-'), plik(`przed-importem-${T0 + 5 * DOBA}.db`), plik(`przed-importem-${dni(40)}.db-wal`), katalog('tmp')];
    expect(kopieDoUsuniecia(wpisy, T0)).toEqual([]);
  });

  test('P-080: adapter — usuwa stare pliki i katalogi surowych kopii, reszta nietknięta', () => {
    const k = katalogTymczasowy();
    const stary = join(k, `ratunkowe-${dni(31)}`);
    mkdirSync(stary);
    for (const n of ['oczko.db', 'oczko.db-wal', 'oczko.db-shm']) writeFileSync(join(stary, n), n);
    mkdirSync(join(k, `ratunkowe-${dni(2)}`));
    writeFileSync(join(k, `przed-importem-${dni(31)}.db`), 'x');
    writeFileSync(join(k, `przed-importem-${dni(1)}.db`), 'x');
    writeFileSync(join(k, 'przed-migracja-2.db'), 'x');
    const w = sprzatnijKopie(k, T0);
    expect(w).toEqual({ ok: true, wartosc: [`przed-importem-${dni(31)}.db`, `ratunkowe-${dni(31)}`].sort() });
    expect([stary, join(k, `przed-importem-${dni(31)}.db`)].map(existsSync)).toEqual([false, false]);
    expect([join(k, `ratunkowe-${dni(2)}`), join(k, `przed-importem-${dni(1)}.db`), join(k, 'przed-migracja-2.db')].map(existsSync)).toEqual([true, true, true]);
  });

  test('P-080: adapter — brak katalogu kopii → nic do usunięcia, bez błędu', () => {
    expect(sprzatnijKopie(join(katalogTymczasowy(), 'nie-ma'), T0)).toEqual({ ok: true, wartosc: [] });
  });
});

describe('P-080 (3b) ADR-0020 (3) ZIP surowej kopii (baza się nie otwiera)', () => {
  test('P-080 (3b): uszkodzona baza po awarii → jeden ZIP z trzema plikami o SHA-256 z manifestu, user_version i application_id z nagłówka', async () => {
    const dane = katalogTymczasowy();
    procesZabityZOtwartaBaza(dane, 50);
    uszkodzStrone(join(dane, 'oczko.db'), 2);
    const shaOryginalu = ['oczko.db', 'oczko.db-wal', 'oczko.db-shm'].map((n) => sha256Pliku(join(dane, n)));
    const cel = join(katalogTymczasowy(), 'oczko-ratunkowa.zip');
    const w = await zipSurowejKopii(dane, SUROWE, cel, { aplikacja: '1.0.0', build: '17', terazMs: T0 });
    if (!w.ok) throw new Error(w.powod);
    const zip = czytajZip(cel);
    expect([...zip.keys()].sort()).toEqual(['manifest.json', 'oczko.db', 'oczko.db-shm', 'oczko.db-wal']);
    const manifest = JSON.parse(zip.get('manifest.json')!.toString('utf8')) as ManifestSurowejKopii;
    expect(manifest).toEqual(w.wartosc);
    expect(manifest).toMatchObject({ format: 'oczko-ratunkowa', wersja: 1, aplikacja: '1.0.0', build: '17', utworzono: T0, user_version: 0, application_id: 0 });
    for (const p of manifest.pliki) expect({ nazwa: p.nazwa, sha: sha256(zip.get(p.nazwa)!), bajty: zip.get(p.nazwa)!.length }).toEqual({ nazwa: p.nazwa, sha: p.sha256, bajty: p.bajty });
    expect(['oczko.db', 'oczko.db-wal', 'oczko.db-shm'].map((n) => sha256Pliku(join(dane, n)))).toEqual(shaOryginalu);
  });

  test('P-080 (3b): user_version i application_id bazy Oczka czytane z nagłówka bez otwierania SQLite', async () => {
    const dane = katalogTymczasowy();
    const naglowek = Buffer.alloc(100);
    naglowek.write('SQLite format 3\0', 0, 'latin1');
    naglowek.writeUInt32BE(7, 60);
    naglowek.writeUInt32BE(1331919467, 68);
    writeFileSync(join(dane, 'oczko.db'), naglowek);
    const w = await zipSurowejKopii(dane, SUROWE, join(katalogTymczasowy(), 'k.zip'), { aplikacja: '1.0.0', build: '17', terazMs: T0 });
    expect(w).toMatchObject({ ok: true, wartosc: { user_version: 7, application_id: 1331919467, pliki: [{ nazwa: 'oczko.db', bajty: 100 }] } });
  });

  test('P-080 (3b): plik krótszy niż nagłówek albo bez sygnatury SQLite → user_version i application_id = null, ZIP powstaje', async () => {
    const dane = katalogTymczasowy();
    writeFileSync(join(dane, 'oczko.db'), 'to nie jest baza');
    const w = await zipSurowejKopii(dane, SUROWE, join(katalogTymczasowy(), 'k.zip'), { aplikacja: '1.0.0', build: '17', terazMs: T0 });
    expect(w).toMatchObject({ ok: true, wartosc: { user_version: null, application_id: null } });
  });

  test('P-080 (3b): brak oczko.db w katalogu surowej kopii → bledne_dane, bez pliku ZIP', async () => {
    const cel = join(katalogTymczasowy(), 'k.zip');
    expect(await zipSurowejKopii(katalogTymczasowy(), SUROWE, cel, { aplikacja: '1.0.0', build: '17', terazMs: T0 })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(existsSync(cel)).toBe(false);
  });

  test('P-080 (3b): cel już istnieje → zapis odrzucony, istniejący plik nietknięty (kopia nigdy nie nadpisuje)', async () => {
    const dane = katalogTymczasowy();
    writeFileSync(join(dane, 'oczko.db'), 'x');
    const cel = join(katalogTymczasowy(), 'k.zip');
    writeFileSync(cel, 'stary');
    expect(await zipSurowejKopii(dane, SUROWE, cel, { aplikacja: '1.0.0', build: '17', terazMs: T0 })).toEqual({ ok: false, powod: 'zapis' });
    expect(sha256Pliku(cel)).toBe(sha256('stary'));
  });
});

// DEC-18 a (P-393, M1-audytor-generalny-013, 12-niezawodnosc-003): ADR-0032 zastępuje pkt 4 ADR-0028. Dawne oczekiwania „przy 3 kopiach zostają
// 2 najnowsze” i „-2, -3 tego samego dnia usuwają kopię bez przyrostka” wynikały z zastąpionej reguły (pula liczona samą ilością), nie z osłabienia testu.
describe('07-jakosc-003 K-03f ADR-0032 (DEC-18 a): pula kopii z Documents/Backup (czysta funkcja)', () => {
  const dzien = (n: number) => new Date(T0 - n * DOBA).toISOString().slice(0, 10);
  const imp = (n: number, k = '') => `oczko-przed-importem-${dzien(n)}${k}.oczko`;
  const usu = (n: number, k = '') => `oczko-przed-usunieciem-${dzien(n)}${k}.oczko`;
  const z1 = (nazwy: string[]) => nazwy.map((nazwa) => ({ nazwa, bajty: 1 })); // M1-090 (ADR-0033 W3): sygnatura z rozmiarami; 1 B nie dotyka budżetu
  const posortowane = (a: string[]) => [...a].sort();
  test('M1-013 test akceptacyjny: trzy „Zastąp” jednego dnia → zostaje kopia sprzed pierwszego i najnowsza (usunięta środkowa)', () => {
    expect(kopiePrzedDoUsuniecia(z1([imp(1), imp(1, '-2'), imp(1, '-3')]), T0)).toEqual([imp(1, '-2')]);
  });
  test('kolejność wejścia bez znaczenia; -10 jest nowsza niż -9 (liczba, nie tekst)', () => {
    expect(posortowane(kopiePrzedDoUsuniecia(z1([imp(1, '-10'), imp(1), imp(1, '-9'), imp(1, '-2')]), T0))).toEqual(posortowane([imp(1, '-9'), imp(1, '-2')]));
  });
  test('pierwsza kopia każdego dnia zostaje do 30 dni ponad limit: kopie z trzech dni → żadna nie jest usuwana', () => {
    expect(kopiePrzedDoUsuniecia(z1([imp(1), imp(2), imp(3)]), T0)).toEqual([]);
  });
  test('limit 2 liczy pierwsze kopie dni i najnowszą: dzień −3 (A, A-2) i dzień −1 (B) → usunięta tylko A-2', () => {
    expect(kopiePrzedDoUsuniecia(z1([imp(3), imp(3, '-2'), imp(1)]), T0)).toEqual([imp(3, '-2')]);
  });
  test('najnowsza zostaje zawsze, także gdy pierwsze kopie dni już przekraczają limit', () => {
    expect(kopiePrzedDoUsuniecia(z1([imp(5), imp(3), imp(1), imp(1, '-2')]), T0)).toEqual([]);
    expect(kopiePrzedDoUsuniecia(z1([imp(5), imp(3), imp(1), imp(1, '-2'), imp(1, '-3')]), T0)).toEqual([imp(1, '-2')]);
  });
  test('bez kopii bez przyrostka (usunięta w Plikach) chroniona jest najstarsza zostawiona z tego dnia', () => {
    expect(kopiePrzedDoUsuniecia(z1([imp(1, '-2'), imp(1, '-3'), imp(1, '-4')]), T0)).toEqual([imp(1, '-3')]);
  });
  test('starsza niż 30 dni jest usuwana także jako pierwsza kopia dnia; 29 dni zostaje', () => {
    expect(kopiePrzedDoUsuniecia(z1([imp(29), imp(40)]), T0)).toEqual([imp(40)]);
    expect(kopiePrzedDoUsuniecia(z1([imp(31), imp(31, '-2'), imp(1)]), T0)).toEqual([imp(31, '-2'), imp(31)]);
  });
  test('ochrona i limit osobno dla importu i usunięcia (ta sama reguła, ADR-0032)', () => {
    expect(kopiePrzedDoUsuniecia(z1([imp(1), imp(2), usu(1), usu(2)]), T0)).toEqual([]);
    expect(posortowane(kopiePrzedDoUsuniecia(z1([imp(1), imp(1, '-2'), imp(1, '-3'), usu(1), usu(1, '-2'), usu(1, '-3')]), T0))).toEqual(posortowane([imp(1, '-2'), usu(1, '-2')]));
  });
  test('obca nazwa, stara kopia .db i data z przyszłości zostają i nie liczą się do limitu ani do pierwszej kopii dnia', () => {
    const przyszla = `oczko-przed-importem-${dzien(-5)}.oczko`;
    expect(kopiePrzedDoUsuniecia(z1(['notatki.txt', 'przed-importem-1.db', przyszla, `oczko-przed-importem-${dzien(-5)}-2.oczko`, imp(1), imp(1, '-2'), imp(1, '-3')]), T0)).toEqual([imp(1, '-2')]);
  });
});

// M1-audytor-generalny-090 (05-architekt-508, 12-niezawodnosc-501; P-437, ADR-0033 zastępuje ADR-0032 pkt 2): pula jednego rodzaju ma budżet
// 2 000 000 000 B; chronione zawsze: najnowsza i pierwsza kopia najstarszego dnia; kopia o nieznanym rozmiarze (null) nie jest usuwana. Wektory W1–W4
// z ADR-0033 „Potwierdzenie”; liczby z rachunku reguły (model 05 `opcja-c.mjs`: W1 4 kopie po kamieniu, 5 i 7 po imporcie; W3 31 i 30).
describe('M1-090 K-03f ADR-0033 (P-437): budżet miejsca puli kopii przed „Zastąp” — wektory W1–W4', () => {
  const BUDZET = 2_000_000_000; // B; ADR-0033 pkt 4 (P-437) — wyrocznia z decyzji, nie z konfiguracji
  const R_DUZE = 473_943_370; // B; ADR-0033 W1 (pomiar R, profil intensywny 3 r.)
  const R_MALE = 21_116_414; // B; ADR-0033 W3 (pomiar R, profil darmowy 1 r.)
  const P = 'oczko-przed-importem';
  const dzienZ = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  const imp = (n: number, k = '') => `${P}-${dzienZ(T0 - n * DOBA)}${k}.oczko`;
  const dzienNazwy = (nazwa: string) => /^oczko-przed-importem-(\d{4}-\d{2}-\d{2})/.exec(nazwa)?.[1] ?? '';
  type Dzien = { poImporcie: number; poKamieniu: number; suma: number; najnowsza: boolean; najstarszaDzienna: boolean; pierwszaSerii: boolean };
  // „Zastąp” k razy dziennie przez 40 dni (nazwy jak w aplikacji, nazwaArchiwum), sprzątanie przy kamieniu godzinę po imporcie.
  function seria(R: number, k: number, budzetB?: number): { dni: Dzien[]; pule: string[][] } {
    let pula: { nazwa: string; bajty: number | null }[] = [];
    const dni: Dzien[] = [];
    const pule: string[][] = [];
    for (let d = 0; d < 40; d++) {
      const t = T0 + d * DOBA;
      for (let i = 0; i < k; i++) pula.push({ nazwa: nazwaArchiwum(pula.map((w) => w.nazwa), P, dzienZ(t)), bajty: R });
      const poImporcie = pula.length;
      const najnowsza = pula[pula.length - 1]?.nazwa;
      const usun = new Set(budzetB === undefined ? kopiePrzedDoUsuniecia(pula, t + 3_600_000) : kopiePrzedDoUsuniecia(pula, t + 3_600_000, KOPIA_PRZED_IMPORTEM_MAKS, KOPIA_PRZED_IMPORTEM_DNI, budzetB));
      pula = pula.filter((w) => !usun.has(w.nazwa));
      const najstarszyDzien = pula.map((w) => dzienNazwy(w.nazwa)).sort()[0];
      dni.push({
        poImporcie,
        poKamieniu: pula.length,
        suma: pula.reduce((s, w) => s + (w.bajty ?? 0), 0),
        najnowsza: pula.some((w) => w.nazwa === najnowsza),
        najstarszaDzienna: pula.some((w) => w.nazwa === `${P}-${najstarszyDzien}.oczko`),
        pierwszaSerii: d >= 30 || pula.some((w) => w.nazwa === `${P}-${dzienZ(T0)}.oczko`), // kopia sprzed serii zostaje do 30 dni
      });
      pule.push(pula.map((w) => w.nazwa));
    }
    return { dni, pule };
  }

  test('KOPIA_PRZED_IMPORTEM_BUDZET_B = 2 000 000 000 B (ADR-0033, P-437)', () => expect(KOPIA_PRZED_IMPORTEM_BUDZET_B).toBe(BUDZET));

  test('W1: „Zastąp” raz dziennie × 40 dni, kopia 473 943 370 B → po każdym kamieniu suma ≤ 2 GB, najwyżej 4 kopie; najnowsza, pierwsza kopia najstarszego dnia i kopia sprzed serii (do 30 dni) zostają', () => {
    const { dni } = seria(R_DUZE, 1);
    expect(Math.max(...dni.map((d) => d.suma))).toBeLessThanOrEqual(BUDZET);
    expect(dni.map((d) => d.poKamieniu)).toEqual([1, 2, 3, ...Array<number>(37).fill(4)]);
    expect(dni.map((d) => d.poImporcie)).toEqual([1, 2, 3, 4, ...Array<number>(36).fill(5)]);
    expect(dni.every((d) => d.najnowsza && d.najstarszaDzienna && d.pierwszaSerii)).toBe(true);
  });

  test('W1 (trzy „Zastąp” dziennie): po kamieniu najwyżej 4 kopie i suma ≤ 2 GB, po imporcie najwyżej 7; ochrona jak w W1', () => {
    const { dni } = seria(R_DUZE, 3);
    expect(Math.max(...dni.map((d) => d.suma))).toBeLessThanOrEqual(BUDZET);
    expect(Math.max(...dni.map((d) => d.poKamieniu))).toBe(4);
    expect(Math.max(...dni.map((d) => d.poImporcie))).toBe(7);
    expect(dni.every((d) => d.najnowsza && d.najstarszaDzienna && d.pierwszaSerii)).toBe(true);
  });

  test('W2: rozmiar null u kandydata, którego usunąłby budżet, i u kopii starszej niż 30 dni → obie zostają, budżet ich nie liczy i usuwa następnego kandydata', () => {
    const R = 474_000_000;
    const wpisy = [{ nazwa: imp(40), bajty: null }, { nazwa: imp(10), bajty: R }, { nazwa: imp(5), bajty: null }, ...[4, 3, 2, 1].map((n) => ({ nazwa: imp(n), bajty: R }))];
    expect(kopiePrzedDoUsuniecia(wpisy, T0)).toEqual([imp(4)]); // 5 · R = 2,37 GB > 2 GB → najstarszy kandydat o znanym rozmiarze (dzień −4)
  });

  test('W2: rozmiar nieznany to też 0, liczba ujemna, NaN i nieskończoność — kopia nie jest usuwana żadną regułą (wiek, limit 2, budżet)', () => {
    for (const zly of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(kopiePrzedDoUsuniecia([{ nazwa: imp(40), bajty: zly }, { nazwa: imp(1), bajty: 10 }], T0)).toEqual([]);
      expect(kopiePrzedDoUsuniecia([{ nazwa: imp(1), bajty: 10 }, { nazwa: imp(1, '-2'), bajty: zly }, { nazwa: imp(1, '-3'), bajty: 10 }], T0)).toEqual([]);
    }
    expect(kopiePrzedDoUsuniecia([{ nazwa: imp(1), bajty: 10 }, { nazwa: imp(1, '-2'), bajty: 10 }, { nazwa: imp(1, '-3'), bajty: 10 }], T0)).toEqual([imp(1, '-2')]); // kontrola: ze znanym rozmiarem -2 znika
  });

  test('W3: kopia 21 116 414 B, „Zastąp” raz dziennie × 40 dni → 31 kopii po imporcie i 30 po kamieniu; pule identyczne z regułą ADR-0032 (budżet nie działa)', () => {
    const z = seria(R_MALE, 1);
    expect(Math.max(...z.dni.map((d) => d.poImporcie))).toBe(31);
    expect(Math.max(...z.dni.map((d) => d.poKamieniu))).toBe(30);
    expect(z.pule).toEqual(seria(R_MALE, 1, Number.POSITIVE_INFINITY).pule);
  });

  test('W4: dwie chronione po 1 200 000 000 B i kandydaci → zostają tylko chronione (najstarsza dzienna i najnowsza)', () => {
    const wpisy = [{ nazwa: imp(5), bajty: 1_200_000_000 }, { nazwa: imp(3), bajty: 1_200_000_000 }, { nazwa: imp(2), bajty: 1_000_000 }, { nazwa: imp(1), bajty: 1_200_000_000 }];
    expect([...kopiePrzedDoUsuniecia(wpisy, T0)].sort()).toEqual([imp(3), imp(2)].sort());
  });

  test('budżet osobno dla importu i usunięcia: duże kopie przed usunięciem nie usuwają kopii przed importem', () => {
    const usu = (n: number) => `oczko-przed-usunieciem-${dzienZ(T0 - n * DOBA)}.oczko`;
    const wpisy = [...[4, 3, 2, 1].map((n) => ({ nazwa: imp(n), bajty: 1_000 })), ...[4, 3, 2, 1].map((n) => ({ nazwa: usu(n), bajty: 900_000_000 }))];
    expect([...kopiePrzedDoUsuniecia(wpisy, T0)].sort()).toEqual([usu(3), usu(2)].sort());
  });

  // Adapter na prawdziwym katalogu (Documents/Backup w katalogu tymczasowym). Pliki rzadkie: rozmiar jak kopia R, bez zajmowania dysku.
  const kopiaRzadka = (katalog: string, nazwa: string, bajty: number) => { const p = join(katalog, nazwa); writeFileSync(p, ''); truncateSync(p, bajty); return p; };
  const sumaKatalogu = (katalog: string) => readdirSync(katalog).reduce((s, n) => { try { return s + statSync(join(katalog, n)).size; } catch { return s; } }, 0);

  test('W1 adapter: 40 dni „Zastąp” z kopią 473 943 370 B w Documents/Backup → liczności kopii przed/po sprzątaniu 5/4, suma na dysku ≤ 2 GB', () => {
    const backup = join(katalogTymczasowy(), 'Documents', 'Backup');
    mkdirSync(backup, { recursive: true });
    const przed: number[] = [];
    const po: number[] = [];
    for (let d = 0; d < 40; d++) {
      const t = T0 + d * DOBA;
      const najnowsza = nazwaArchiwum(readdirSync(backup), P, dzienZ(t));
      kopiaRzadka(backup, najnowsza, R_DUZE);
      przed.push(readdirSync(backup).length);
      expect(sprzatnijKopiePrzed(backup, t + 3_600_000).ok).toBe(true);
      po.push(readdirSync(backup).length);
      expect(sumaKatalogu(backup)).toBeLessThanOrEqual(BUDZET);
      expect(existsSync(join(backup, najnowsza))).toBe(true);
    }
    expect({ przed, po }).toEqual({ przed: [1, 2, 3, 4, ...Array<number>(36).fill(5)], po: [1, 2, 3, ...Array<number>(37).fill(4)] });
  });

  test('W2 adapter: rozmiar rzuca dla jednej nazwy (dowiązanie bez celu) i plik 0 B → obie kopie zostają, reszta sprzątana budżetem i wiekiem', () => {
    const backup = join(katalogTymczasowy(), 'Documents', 'Backup');
    mkdirSync(backup, { recursive: true });
    const R = 474_000_000;
    symlinkSync(join(backup, 'nie-ma-takiego-pliku'), join(backup, imp(40))); // starsza niż 30 dni, rozmiaru nie da się odczytać
    symlinkSync(join(backup, 'nie-ma-takiego-pliku-2'), join(backup, imp(6))); // kandydat budżetu, rozmiaru nie da się odczytać
    writeFileSync(join(backup, imp(5)), ''); // 0 B = rozmiar nieznany
    kopiaRzadka(backup, imp(35), R); // starsza niż 30 dni, rozmiar znany
    for (const n of [10, 4, 3, 2, 1]) kopiaRzadka(backup, imp(n), R);
    writeFileSync(join(backup, 'notatki.txt'), 'x');
    expect(readdirSync(backup)).toHaveLength(10);
    expect(sprzatnijKopiePrzed(backup, T0)).toEqual({ ok: true, wartosc: [imp(35), imp(4)].sort() });
    expect(readdirSync(backup).sort()).toEqual([imp(40), imp(10), imp(6), imp(5), imp(3), imp(2), imp(1), 'notatki.txt'].sort());
    expect(lstatSync(join(backup, imp(40))).isSymbolicLink()).toBe(true);
    expect(lstatSync(join(backup, imp(6))).isSymbolicLink()).toBe(true);
  });
});

describe('P-339 N-05-2: czy w Documents/Backup są kopie Oczka (podpis w „Data and sync” tylko wtedy)', () => {
  test('nazwy z ADR-0028 (przed importem i przed usunięciem, także z przyrostkiem) → są kopie', () => {
    expect(czySaKopiePrzed(['oczko-przed-importem-2026-10-30.oczko'])).toBe(true);
    expect(czySaKopiePrzed(['oczko-przed-usunieciem-2026-10-30-2.oczko'])).toBe(true);
    expect(czySaKopiePrzed(['notatki.txt', 'oczko-przed-importem-2026-10-30.oczko'])).toBe(true);
  });
  test('pusty katalog i obce pliki (także .db ze starych buildów i nazwa bez daty) → nie ma kopii', () => {
    expect(czySaKopiePrzed([])).toBe(false);
    expect(czySaKopiePrzed(['notatki.txt', 'przed-importem-1767225600000.db', 'oczko-przed-importem-bez-daty.oczko', 'oczko-przed-importem-2026-10-30.oczko.tmp'])).toBe(false);
  });
  test('adapter na prawdziwym katalogu: brak katalogu → false; pusty → false; z kopią → true; obcy plik → false', () => {
    const korzen = katalogTymczasowy();
    const backup = join(korzen, 'Documents', 'Backup');
    expect(saKopiePrzed(backup)).toBe(false); // katalog nie istnieje
    mkdirSync(backup, { recursive: true });
    expect(saKopiePrzed(backup)).toBe(false);
    writeFileSync(join(backup, 'obcy.txt'), 'x');
    expect(saKopiePrzed(backup)).toBe(false);
    writeFileSync(join(backup, 'oczko-przed-usunieciem-2026-10-30.oczko'), 'x');
    expect(saKopiePrzed(backup)).toBe(true);
  });
});
