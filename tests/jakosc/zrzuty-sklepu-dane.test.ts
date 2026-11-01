/* Dane pokazowe do zrzutów App Store (P-319; plan `docs/wydanie/metadane/zrzuty-plan.md`, wzór: Trening `scripts/screens/store-seed.test.ts`).
 * Test jest bramką generatora (`tests/narzedzia/zrzuty-sklepu-ziarno.ts`): dane powstają z przypadków użycia aplikacji, więc sprawdzamy, że daje je w kształcie,
 * którego potrzebują kadry — i że nic w nich nie wygląda na dane prawdziwe. Przy `ZRZUTY_DANE_OUT=<katalog>` ten sam test zapisuje wynik w podanym katalogu
 * (krok „Dane pokazowe” workflowu `store-screenshots.yml`); bez zmiennej pisze do katalogu tymczasowego.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { pdfWzoru, TERAZ_ZRZUTOW, zbudujDaneSklepu, type Podsumowanie } from '../narzedzia/zrzuty-sklepu-ziarno';

const WYJSCIE = process.env.ZRZUTY_DANE_OUT ?? mkdtempSync(join(tmpdir(), 'zrzuty-dane-'));
const KOPIA = mkdtempSync(join(tmpdir(), 'zrzuty-kopia-')); // odczyty na kopii: otwarcie bazy WAL tworzy pliki -wal/-shm, a katalog wyjściowy ma zostać czysty
let p: Podsumowanie;
beforeAll(async () => { p = await zbudujDaneSklepu(WYJSCIE); copyFileSync(join(WYJSCIE, 'oczko.db'), join(KOPIA, 'oczko.db')); }, 120_000);
afterAll(() => { rmSync(KOPIA, { recursive: true, force: true }); if (!process.env.ZRZUTY_DANE_OUT) rmSync(WYJSCIE, { recursive: true, force: true }); });

const baza = <T>(sql: string, ...par: (string | number)[]): T[] => {
  const db = new DatabaseSync(join(KOPIA, 'oczko.db'));
  try { return db.prepare(sql).all(...par) as T[]; } finally { db.close(); }
};

describe('zrzuty sklepu · dane pokazowe z przypadków użycia aplikacji', () => {
  test('katalog wyjściowy: oczko.db bez plików -wal/-shm (także po odczytach testu), pliki wzoru po SHA-256 i podsumowanie', () => {
    baza('SELECT count(*) FROM projekt'); // odczyt na kopii nie zostawia śladu w katalogu wyjściowym
    expect(existsSync(join(WYJSCIE, 'oczko.db'))).toBe(true);
    expect(existsSync(join(WYJSCIE, 'oczko.db-wal'))).toBe(false);
    expect(existsSync(join(WYJSCIE, 'oczko.db-shm'))).toBe(false);
    const pliki = readdirSync(join(WYJSCIE, 'pliki'));
    expect(pliki).toHaveLength(1);
    const sha = createHash('sha256').update(readFileSync(join(WYJSCIE, 'pliki', pliki[0]))).digest('hex');
    expect(pliki[0]).toBe(`${sha}.pdf`);
  });

  test('5 projektów: 4 w toku i 1 ukończony, z nazwami bez marek', () => {
    const w = baza<{ nazwa: string; stan: string }>('SELECT nazwa, stan FROM projekt WHERE usunieto_ms IS NULL ORDER BY nazwa');
    expect(w.map((x) => x.nazwa)).toEqual(['Baby Blanket', 'Cable Hat', 'Fingerless Mitts', 'Harbor Sweater', 'Moss Stitch Scarf']);
    expect(w.filter((x) => x.stan === 'ukonczony').map((x) => x.nazwa)).toEqual(['Fingerless Mitts']);
    expect(w.filter((x) => x.stan === 'w_toku')).toHaveLength(4);
  });

  test('kadr 1: licznik Harbor Sweater / Body ma 47 rzędów, cel 120 i przypomnienie na rzędzie 48 („decrease at both ends”)', () => {
    expect(p.projekty.find((x) => x.nazwa === 'Harbor Sweater')?.rzedy).toBe(47);
    const [c] = baza<{ cel_rzedow: number; nazwa: string }>("SELECT c.cel_rzedow, c.nazwa FROM czesc c JOIN licznik l ON l.czesc_id = c.id WHERE l.id = ?", p.licznikGlownyId);
    expect(c).toMatchObject({ cel_rzedow: 120, nazwa: 'Body' });
    const [r] = baza<{ od_rzedu: number; co_n: number; razy: number; tekst: string }>('SELECT od_rzedu, co_n, razy, tekst FROM przypomnienie WHERE licznik_id = ?', p.licznikGlownyId);
    expect(r).toEqual({ od_rzedu: 12, co_n: 6, razy: 8, tekst: 'decrease at both ends' });
    expect(r.od_rzedu + r.co_n * 6).toBe(48); // rząd 48 = 12 + 6 × 6 (niezależny rachunek z definicji przypomnienia)
  });

  test('kadry 2–3: wzór PDF projektu Harbor Sweater ma 3 strony, znacznik przy rzędzie 47 i notatkę przy rzędzie', () => {
    const [wz] = baza<{ nazwa: string; zrodlo: string; znacznik: string }>('SELECT nazwa, zrodlo, znacznik FROM wzor');
    expect(wz).toMatchObject({ nazwa: 'Harbor Sweater', zrodlo: 'pdf' });
    expect(JSON.parse(wz.znacznik)).toMatchObject({ strona: 0, rzad_bazowy: 47, wartosc_przy_ustawieniu: 47, licznik_id: p.licznikGlownyId });
    expect(baza<{ rzad: number; tekst: string }>('SELECT rzad, tekst FROM notatka_rzedu')).toEqual([{ rzad: 47, tekst: 'Check length before the next decrease.' }]);
    const pdf = pdfWzoru().toString('latin1');
    expect(pdf.startsWith('%PDF-1.4')).toBe(true);
    expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true);
    expect((pdf.match(/\/Type \/Page /g) ?? []).length).toBe(3);
  });

  test('xref wzoru wskazuje na początki obiektów (poprawny PDF, nie tylko nagłówek i %%EOF)', () => {
    const b = pdfWzoru();
    const t = b.toString('latin1');
    const start = Number(/startxref\n(\d+)\n/.exec(t)?.[1]);
    expect(t.slice(start, start + 4)).toBe('xref');
    const wpisy = [...t.slice(start).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
    expect(wpisy.length).toBeGreaterThanOrEqual(9);
    wpisy.forEach((o, i) => expect(t.slice(o, o + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`));
  });

  test('kadr 4: darmowe dni — w listopadzie 2 dni pracy (5 i 12.11), więc „3 of 5 free knitting days left”; w październiku 10 dni (jak z Pro)', () => {
    expect(p.dniListopada).toBe(2);
    expect(5 - p.dniListopada).toBe(3);
    expect(p.dniPazdziernika).toBe(10);
    expect(baza<{ dzien: string; pro: number }>("SELECT dzien, pro FROM dzien_limitu WHERE dzien LIKE '2026-11%' ORDER BY dzien")).toEqual([{ dzien: '2026-11-05', pro: 0 }, { dzien: '2026-11-12', pro: 0 }]);
  });

  test('kadr 4: etykiety „last worked N days ago” — Scarf 13 dni, Blanket 22, Hat 7; Harbor dziś', () => {
    const dzis = Date.UTC(2026, 10, 12);
    const dni = (d: string): number => Math.round((dzis - Date.parse(`${d}T00:00:00Z`)) / 86_400_000);
    expect(p.projekty.map((x) => [x.nazwa, dni(x.ostatniaPraca)])).toEqual([['Harbor Sweater', 0], ['Moss Stitch Scarf', 13], ['Baby Blanket', 22], ['Cable Hat', 7], ['Fingerless Mitts', 21]]);
  });

  test('kadr 5: historia licznika głównego kończy się dziś wpisami „+1” co 6 s, ostatni 46 → 47, a dziennik zdarzeń jest liniowy', () => {
    const z = baza<{ rodzaj: string; wartosc_po: number; czas_ms: number; dzien: string }>(
      'SELECT rodzaj, wartosc_po, czas_ms, dzien FROM zdarzenie WHERE licznik_id = ? ORDER BY czas_ms DESC, id DESC LIMIT 4', p.licznikGlownyId);
    expect(z.map((x) => x.wartosc_po)).toEqual([47, 46, 45, 44]);
    expect(new Set(z.map((x) => x.rodzaj))).toEqual(new Set(['plus']));
    expect(z.every((x) => x.dzien === '2026-11-12')).toBe(true);
    expect(z[0].czas_ms - z[1].czas_ms).toBe(6000);
  });

  test('kadr 6: kalendarz — dni pracy w październiku obejmują 6, 8, 11, 15, 18, 21, 22, 27, 29 i 30.10; ukończenie rękawiczek 22.10', () => {
    const dniPracy = baza<{ dzien: string }>("SELECT DISTINCT dzien FROM zdarzenie WHERE dzien LIKE '2026-10%' ORDER BY dzien").map((x) => x.dzien.slice(8));
    expect(dniPracy).toEqual(['06', '08', '11', '15', '18', '21', '22', '27', '29', '30']);
    const [u] = baza<{ stan: string; ukonczono_dzien: string }>("SELECT stan, ukonczono_dzien FROM projekt WHERE nazwa = 'Fingerless Mitts'");
    expect(u).toEqual({ stan: 'ukonczony', ukonczono_dzien: '2026-10-22' });
  });

  test('aplikacja otworzy się na liczniku Body (ostatnie miejsce) bez okna „Uczciwe zasady”', () => {
    const w = Object.fromEntries(baza<{ klucz: string; wartosc: string }>('SELECT klucz, wartosc FROM ustawienie').map((x) => [x.klucz, JSON.parse(x.wartosc)]));
    expect(w.okno_uczciwe_zasady_widziane).toBe(true);
    expect(w.ostatnie_miejsce).toMatchObject({ ekran: 'licznik', id: p.licznikGlownyId });
  });

  test('zegar: „teraz” zrzutów to czwartek 12.11.2026 09:41, ten sam napis idzie do argumentu `oczkoE2eTeraz`', () => {
    expect(TERAZ_ZRZUTOW).toBe('2026-11-12T09:41:00');
    expect(new Date('2026-11-12T09:41:00Z').getUTCDay()).toBe(4); // czwartek
    expect(p.teraz).toBe(TERAZ_ZRZUTOW);
    expect(p.strefa).toBe('UTC');
  });

  test('dane zmyślone: żadnych adresów, numerów ani nazw marek w nazwach i notatkach', () => {
    const teksty = [
      ...baza<{ n: string }>('SELECT nazwa AS n FROM projekt').map((x) => x.n),
      ...baza<{ n: string }>('SELECT nazwa AS n FROM czesc').map((x) => x.n),
      ...baza<{ n: string }>("SELECT coalesce(notatka, '') AS n FROM projekt").map((x) => x.n),
      ...baza<{ n: string }>('SELECT tekst AS n FROM przypomnienie').map((x) => x.n),
    ].join(' | ');
    expect(teksty).not.toMatch(/@|https?:|www\.|\d{9}|lion brand|drops|paintbox|rowan|ravelry|knitpro|addi/i);
  });
});
