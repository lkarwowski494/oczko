/* Dane pokazowe do zrzutów App Store (P-319, plan: docs/wydanie/metadane/zrzuty-plan.md; wzór: Trening `scripts/screens/store-seed.test.ts`).
 * Bez zmian w kodzie aplikacji: dane powstają przez PRAWDZIWE przypadki użycia aplikacji (`src/przypadki-uzycia`) na bazie z jej własnymi migracjami,
 * z zegarem testowym cofniętym w czasie (historia z kilku tygodni). Wynik to katalog `Application Support` aplikacji: `oczko.db` (bez `-wal`) i `pliki/`
 * (PDF wzoru po SHA-256, ADR-0001). Skrypt `scripts/ci/zrzuty-sklepu.sh` kopiuje go do kontenera aplikacji w symulatorze przed każdym ekranem.
 * Dane są zmyślone (wytyczne Apple 2.3.9): nazwy projektów bez marek, wzór PDF napisany od zera na potrzeby zrzutów, żadnych danych osobowych.
 * Czas: „teraz” zrzutów = `TERAZ` (czas lokalny bez strefy); ten sam napis idzie do argumentu `oczkoE2eTeraz` aplikacji E2E, więc „last worked N days ago”,
 * dni limitu i kalendarz nie zależą od daty uruchomienia. Strefa danych = strefa symulatora (runner GitHub: UTC); godziny pracy w środku dnia (10–20),
 * żeby przesunięcie strefy nie zmieniło dnia zdarzenia.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dodajNotatkeWzoru, importujWzor, ustawZnacznik } from '../../src/przypadki-uzycia/wzor';
import { dodajRzad } from '../../src/przypadki-uzycia/licznik';
import { ustawDrut, utworzProjekt, zakonczProjekt, zapiszNotatke, type NowyProjekt } from '../../src/przypadki-uzycia/projekt';
import { dodajPrzypomnienie, ustawCel } from '../../src/przypadki-uzycia/czesc';
import { zapamietajLicznik } from '../../src/przypadki-uzycia/widok-licznika';
import { zapiszUstawienie } from '../../src/dane/repozytoria/ustawienia';
import type { Wynik } from '../../src/domena/bledy';
import { przygotuj, zegarTestowy, type Srodowisko } from '../dane/pomocnicze/srodowisko';

/** „Teraz” zrzutów: czwartek 12.11.2026, 09:41 — jak godzina na pasku stanu (xcrun simctl status_bar --time 9:41). */
export const TERAZ_ZRZUTOW = '2026-11-12T09:41:00';

export type Podsumowanie = {
  katalog: string;
  teraz: string;
  strefa: string;
  projekty: { nazwa: string; stan: 'w_toku' | 'ukonczony'; rzedy: number; ostatniaPraca: string }[];
  dniListopada: number;
  dniPazdziernika: number;
  licznikGlownyId: string;
  wzorId: string;
};

function ok<T>(w: Wynik<T>, co: string): T {
  if (!w.ok) throw new Error(`ziarno zrzutów: ${co}: ${String((w as { powod?: unknown }).powod)}`);
  return w.wartosc;
}
/** Chwila UTC z daty i godziny w podanej strefie (szukanie przez Intl; strefy bez przejść w tych dniach — UTC albo Europe/Warsaw w listopadzie). */
export function chwila(dzien: string, godzina: string, strefa: string): number {
  const probka = Date.parse(`${dzien}T${godzina}:00Z`);
  const f = new Intl.DateTimeFormat('en-US', { timeZone: strefa, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
  const c = Object.fromEntries(f.formatToParts(new Date(probka)).map((p) => [p.type, Number(p.value)]));
  const przesuniecie = Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute, c.second) - Math.floor(probka / 1000) * 1000;
  return probka - przesuniecie;
}

/** Wzór „Harbor Sweater” (zmyślony, własny tekst): trzy strony, PDF 1.4 napisany ręcznie (bez zależności), poprawny xref. */
export function pdfWzoru(): Buffer {
  const strony: string[][] = [
    ['HARBOR SWEATER', 'A top-down pullover in worsted weight wool', '', 'Gauge: 20 stitches and 28 rows = 10 cm in stockinette', 'Needles: 4 mm (US 6) and 3.5 mm (US 4)', 'Sizes: S (M, L)', '', 'BODY', 'Cast on 96 (104, 112) stitches and join in the round.', 'Rows 1-10: work 2x2 ribbing.', 'Row 11: knit all stitches.', 'Rows 12-47: work in stockinette.', 'Row 12: decrease at both ends, then every 6th row to row 54.'],
    ['BODY continued', '', 'Row 48: decrease at both ends.', 'Rows 49-53: knit.', 'Row 54: decrease at both ends.', 'Rows 55-100: knit until the piece measures 38 cm.', '', 'Tip: mark the row you are on with a pencil dot', 'in the margin, or let the counter keep your place.'],
    ['SLEEVES', '', 'Pick up 60 (64, 68) stitches around the armhole.', 'Work 12 rows in stockinette, then decrease', 'every 8th row until 44 (48, 52) stitches remain.', 'Finish with 8 rows of 2x2 ribbing.', 'Bind off loosely in pattern.'],
  ];
  const obiekty: string[] = [];
  const dodaj = (tresc: string): number => { obiekty.push(tresc); return obiekty.length; };
  const katalog = dodaj('<< /Type /Catalog /Pages 2 0 R >>'); // 1
  const liczbaStron = strony.length;
  dodaj(`<< /Type /Pages /Kids [${strony.map((_, i) => `${4 + i * 2} 0 R`).join(' ')}] /Count ${liczbaStron} >>`); // 2
  dodaj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'); // 3
  void katalog;
  for (const linie of strony) {
    const idStrony = obiekty.length + 1;
    const idTresci = idStrony + 1;
    dodaj(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${idTresci} 0 R >>`);
    const tekst = linie.map((l, i) => `BT /F1 ${i === 0 ? 20 : 13} Tf 56 ${770 - i * 22} Td (${l.replace(/[\\()]/g, '\\$&')}) Tj ET`).join('\n');
    dodaj(`<< /Length ${Buffer.byteLength(tekst)} >>\nstream\n${tekst}\nendstream`);
  }
  let wynik = '%PDF-1.4\n';
  const przesuniecia: number[] = [];
  obiekty.forEach((o, i) => { przesuniecia.push(Buffer.byteLength(wynik)); wynik += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(wynik);
  wynik += `xref\n0 ${obiekty.length + 1}\n0000000000 65535 f \n${przesuniecia.map((p) => `${String(p).padStart(10, '0')} 00000 n \n`).join('')}`;
  wynik += `trailer\n<< /Size ${obiekty.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(wynik, 'latin1');
}

type Praca = { dzien: string; godzina: string; kto: 'sweter' | 'szalik' | 'kocyk' | 'opaska' | 'czubek' | 'lewa' | 'prawa'; rzedy: number };
/**
 * Oś czasu pracy (chronologiczna). Sumy: Harbor Body 43 do 29.10 + 4 dziś = 47 („Now row 48”, przypomnienie od rzędu 12 co 6 daje rząd 48);
 * szalik 134 z 200, kocyk 62 z 240, opaska czapki 24 z 24 (29.10), czubek 23 z 40 (5.11), rękawiczki 60 + 60 (ukończone 22.10).
 * Dni z pracą: październik 6, 8, 11, 15, 18, 21, 22, 27, 29, 30 (10 dni, jak z Pro), listopad 5 i 12 (2 darmowe dni z 5 → „3 of 5 left”).
 */
const OS_CZASU: Praca[] = [
  { dzien: '2026-10-06', godzina: '18:10', kto: 'sweter', rzedy: 7 }, { dzien: '2026-10-06', godzina: '19:30', kto: 'lewa', rzedy: 15 }, { dzien: '2026-10-06', godzina: '19:50', kto: 'prawa', rzedy: 15 },
  { dzien: '2026-10-08', godzina: '19:00', kto: 'sweter', rzedy: 6 }, { dzien: '2026-10-08', godzina: '19:40', kto: 'szalik', rzedy: 30 },
  { dzien: '2026-10-11', godzina: '15:30', kto: 'sweter', rzedy: 6 }, { dzien: '2026-10-11', godzina: '16:30', kto: 'kocyk', rzedy: 20 }, { dzien: '2026-10-11', godzina: '17:00', kto: 'lewa', rzedy: 15 }, { dzien: '2026-10-11', godzina: '17:20', kto: 'prawa', rzedy: 15 },
  { dzien: '2026-10-15', godzina: '19:20', kto: 'sweter', rzedy: 5 }, { dzien: '2026-10-15', godzina: '19:55', kto: 'szalik', rzedy: 40 },
  { dzien: '2026-10-18', godzina: '14:00', kto: 'sweter', rzedy: 6 }, { dzien: '2026-10-18', godzina: '15:00', kto: 'kocyk', rzedy: 24 }, { dzien: '2026-10-18', godzina: '15:40', kto: 'lewa', rzedy: 15 }, { dzien: '2026-10-18', godzina: '16:00', kto: 'prawa', rzedy: 15 },
  { dzien: '2026-10-21', godzina: '19:15', kto: 'kocyk', rzedy: 18 },
  { dzien: '2026-10-22', godzina: '18:30', kto: 'sweter', rzedy: 5 }, { dzien: '2026-10-22', godzina: '19:10', kto: 'szalik', rzedy: 36 }, { dzien: '2026-10-22', godzina: '19:40', kto: 'lewa', rzedy: 15 }, { dzien: '2026-10-22', godzina: '19:55', kto: 'prawa', rzedy: 15 },
  { dzien: '2026-10-27', godzina: '16:10', kto: 'sweter', rzedy: 4 },
  { dzien: '2026-10-29', godzina: '18:15', kto: 'sweter', rzedy: 4 }, { dzien: '2026-10-29', godzina: '19:00', kto: 'opaska', rzedy: 24 },
  { dzien: '2026-10-30', godzina: '19:40', kto: 'szalik', rzedy: 28 },
  { dzien: '2026-11-05', godzina: '19:05', kto: 'czubek', rzedy: 23 },
  { dzien: '2026-11-12', godzina: '09:21', kto: 'sweter', rzedy: 4 },
];

export async function zbudujDaneSklepu(wyjscie: string, o: { teraz?: string; strefa?: string } = {}): Promise<Podsumowanie> {
  const teraz = o.teraz ?? TERAZ_ZRZUTOW;
  const strefa = o.strefa ?? 'UTC';
  const [dzienTeraz, godzinaTeraz] = teraz.split('T');
  const zegar = zegarTestowy(chwila('2026-10-01', '10:00', strefa), strefa);
  const s: Srodowisko = await przygotuj({ zegar, prefiksId: '5' });
  const z = s.z;
  const idzDo = (dzien: string, godzina: string): void => {
    const ms = chwila(dzien, godzina.slice(0, 5), strefa);
    zegar.ustaw(Math.max(ms, zegar.teraz().ms), strefa); // zegar nigdy nie cofa się w trakcie budowy
  };

  // --- projekty: wszystkie założone 1.10 (pierwsza praca później) ---
  s.pro.wartosc = true;
  const nowy = async (nazwa: string, czesci: string[]): Promise<NowyProjekt> => { zegar.przesun(60_000); return ok(await utworzProjekt(z, { nazwa, czesci }), `utworzProjekt ${nazwa}`); };
  const sweter = await nowy('Harbor Sweater', ['Body', 'Sleeves']);
  const szalik = await nowy('Moss Stitch Scarf', ['Scarf']);
  const kocyk = await nowy('Baby Blanket', ['Squares']);
  const czapka = await nowy('Cable Hat', ['Brim', 'Crown']);
  const rekawiczki = await nowy('Fingerless Mitts', ['Left', 'Right']);
  const body = sweter.czesci[0];
  const liczniki: Record<Praca['kto'], string> = {
    sweter: body.licznikId, szalik: szalik.czesci[0].licznikId, kocyk: kocyk.czesci[0].licznikId,
    opaska: czapka.czesci[0].licznikId, czubek: czapka.czesci[1].licznikId, lewa: rekawiczki.czesci[0].licznikId, prawa: rekawiczki.czesci[1].licznikId,
  };

  // Ustawienia jak z menu aplikacji: cele, druty, notatka, przypomnienie „od rzędu 12, co 6, 8 razy”.
  ok(await ustawCel(z, { czescId: body.czescId, cel: 120 }), 'cel body');
  ok(await ustawCel(z, { czescId: sweter.czesci[1].czescId, cel: 90 }), 'cel rękawów');
  ok(await ustawCel(z, { czescId: szalik.czesci[0].czescId, cel: 200 }), 'cel szalika');
  ok(await ustawCel(z, { czescId: kocyk.czesci[0].czescId, cel: 240 }), 'cel kocyka');
  ok(await ustawCel(z, { czescId: czapka.czesci[0].czescId, cel: 24 }), 'cel opaski');
  ok(await ustawCel(z, { czescId: czapka.czesci[1].czescId, cel: 40 }), 'cel czubka');
  ok(await ustawDrut(z, { projektId: sweter.projektId, drutMm: 4, narzedzie: 'druty' }), 'druty');
  ok(await zapiszNotatke(z, { projektId: sweter.projektId, tekst: 'Size M. Decrease every 6th row. Pick up sleeve stitches after the body.' }), 'notatka');
  ok(await dodajPrzypomnienie(z, { licznikId: body.licznikId, od: 12, co: 6, razy: 8, tekst: 'decrease at both ends' }), 'przypomnienie');

  // Wzór PDF (własny, zmyślony): import przez przypadek użycia aplikacji.
  const pdf = join(s.katalog, 'harbor-sweater.pdf');
  writeFileSync(pdf, pdfWzoru());
  const wzorId = ok(await importujWzor(z, { projektId: sweter.projektId, plik: { id: 'zrzuty-wzor', sciezka: pdf, nazwa: 'Harbor Sweater.pdf', typ: 'application/pdf' } }), 'importujWzor').wzorId;

  // --- oś czasu: +1 co 6 s (poza oknem serii RD-17); październik jak z Pro, listopad bez Pro (liczą się darmowe dni) ---
  for (const p of OS_CZASU) {
    idzDo(p.dzien, p.godzina);
    s.pro.wartosc = p.dzien < '2026-11-01';
    for (let i = 0; i < p.rzedy; i++) {
      ok(await dodajRzad(z, { licznikId: liczniki[p.kto] }), `dodajRzad ${p.kto}`);
      zegar.przesun(6000);
    }
    if (p.dzien === '2026-10-22' && p.kto === 'prawa') { // rękawiczki gotowe: ukończenie tego samego wieczoru
      zegar.przesun(5 * 60_000);
      ok(await zakonczProjekt(z, { projektId: rekawiczki.projektId }), 'ukończenie rękawiczek');
    }
  }

  // Znacznik wzoru przy rzędzie 47 (strona 1, ok. 40% wysokości) i notatka przy rzędzie — po pracy: `wartoscPrzyUstawieniu` = 47.
  s.pro.wartosc = false;
  ok(await ustawZnacznik(z, { wzorId, licznikId: body.licznikId, strona: 0, y: 0.4, wysokoscRzedu: 0.04, rzadBazowy: 47, kierunek: 1 }), 'ustawZnacznik');
  ok(await dodajNotatkeWzoru(z, { wzorId, rzad: 47, tekst: 'Check length before the next decrease.' }), 'notatka wzoru');

  // Okno „Uczciwe zasady” widziane; ostatnie miejsce = licznik Body (aplikacja otwiera się na liczniku z wzorem). Zegar na „teraz” zrzutów.
  idzDo(dzienTeraz, godzinaTeraz);
  await s.baza.transakcja(async (tx) => { await zapiszUstawienie(tx, 'okno_uczciwe_zasady_widziane', true, zegar.teraz().ms); });
  ok(await zapamietajLicznik(z, { licznikId: body.licznikId }), 'zapamietajLicznik');

  // --- wynik: oczko.db bez -wal oraz pliki wzoru ---
  const wartosc = async (licznikId: string): Promise<number> => (await s.baza.all<{ wartosc: number }>('SELECT wartosc FROM licznik WHERE id = ?', [licznikId]))[0].wartosc;
  const dni = async (prefiks: string): Promise<number> => (await s.baza.all<{ n: number }>('SELECT count(*) AS n FROM dzien_limitu WHERE dzien LIKE ?', [`${prefiks}%`]))[0].n;
  const podsumowanie: Podsumowanie = {
    katalog: wyjscie, teraz, strefa,
    projekty: [
      { nazwa: 'Harbor Sweater', stan: 'w_toku', rzedy: await wartosc(liczniki.sweter), ostatniaPraca: '2026-11-12' },
      { nazwa: 'Moss Stitch Scarf', stan: 'w_toku', rzedy: await wartosc(liczniki.szalik), ostatniaPraca: '2026-10-30' },
      { nazwa: 'Baby Blanket', stan: 'w_toku', rzedy: await wartosc(liczniki.kocyk), ostatniaPraca: '2026-10-21' },
      { nazwa: 'Cable Hat', stan: 'w_toku', rzedy: await wartosc(liczniki.czubek), ostatniaPraca: '2026-11-05' },
      { nazwa: 'Fingerless Mitts', stan: 'ukonczony', rzedy: await wartosc(liczniki.lewa), ostatniaPraca: '2026-10-22' },
    ],
    dniListopada: await dni('2026-11'),
    dniPazdziernika: await dni('2026-10'),
    licznikGlownyId: body.licznikId,
    wzorId,
  };
  s.baza.zamknij(); // zamknięcie ostatniego połączenia = checkpoint WAL i usunięcie oczko.db-wal
  rmSync(wyjscie, { recursive: true, force: true });
  mkdirSync(join(wyjscie, 'pliki'), { recursive: true });
  copyFileSync(join(s.katalog, 'oczko.db'), join(wyjscie, 'oczko.db'));
  for (const f of readdirSync(join(s.katalog, 'pliki'))) copyFileSync(join(s.katalog, 'pliki', f), join(wyjscie, 'pliki', f));
  writeFileSync(join(wyjscie, 'podsumowanie.json'), JSON.stringify(podsumowanie, null, 2));
  rmSync(s.katalog, { recursive: true, force: true });
  return podsumowanie;
}
export const skrotSha256 = (b: Buffer): string => createHash('sha256').update(b).digest('hex');
