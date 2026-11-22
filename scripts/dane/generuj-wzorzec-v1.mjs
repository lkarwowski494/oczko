// Wzorzec wydanej bazy schematu 1: tests/bazy/v1.db + v1.db-wal + v1.db-shm (P-306 (B), P-496, P-519; dane.md „Polityka migracji”, R-074, R-075).
// Schemat = migracja 1 z src/dane/migracje/sql.ts (ta sama treść, którą wykonuje runner aplikacji: 0001.sql bez komentarzy), w jednej transakcji z user_version. Dane: brzegowe, wymyślone,
// bez danych osobowych; identyfikatory i czasy stałe → ta sama treść przy każdym uruchomieniu (bajty -wal różnią się solą, treść nie).
// Wariant migawki kopii urządzenia: część A przepisana do pliku głównego (checkpoint), część B tylko w -wal (wal_autocheckpoint = 0),
// trzy pliki skopiowane przy otwartym połączeniu. Test: tests/dane/wzorzec-v1.test.ts, migracja z kopii: tests/dane/migracje-wydanych.test.ts.
// Uruchamiać tylko przed wydaniem v1 w App Store (po wydaniu wzorzec jest zamrożony; zmiana schematu = migracja 0002 i wzorzec v2.db).
// Użycie: node --experimental-strip-types --no-warnings scripts/dane/generuj-wzorzec-v1.mjs [katalog-docelowy (domyślnie tests/bazy)]
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const KORZEN = join(import.meta.dirname, '../..');
const cel = resolve(process.argv[2] ?? join(KORZEN, 'tests/bazy'));
const PLIKI = ['v1.db', 'v1.db-wal', 'v1.db-shm'];
const { MIGRACJE } = await import(pathToFileURL(join(KORZEN, 'src/dane/migracje/sql.ts')).href);
const MIGRACJA_1 = MIGRACJE.find((m) => m.wersja === 1);
if (!MIGRACJA_1) throw new Error('brak migracji 1 w src/dane/migracje/sql.ts');

const TERAZ = Date.UTC(2026, 10, 3, 12); // chwila „wydania” wzorca; usunięcia liczone od niej (KOSZ_DNI = 30)
const MIN = 60_000, GODZ = 3_600_000, DOBA = 86_400_000;
const id = (p, n) => `${p}-0000-4000-8000-${String(n).padStart(12, '0')}`; // UUID-podobne, stałe
const sha = (t) => createHash('sha256').update(t).digest('hex');
const dzienWaw = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));

// Teksty brzegowe: znaki spoza BMP, CJK, RTL, łączące, ZWJ, cudzysłowy i „SQL” w treści, nowe linie, bardzo długie.
const NAZWA_UNICODE = 'Ząb 🧶 毛衣 سترة Ελληνικά é 👩‍👩‍👧 «"\';--»';
const DLUGA = ('Rząd 1: 2o, 2l; powtarzaj ✓ — ' + 'ŻÓŁĆ漢字🧶\n').repeat(2700); // > 100 000 znaków (punkty kodowe, length() SQLite)
const DLUGA_NAZWA = 'Bardzo długa nazwa projektu ' + 'ą'.repeat(2000);

const tmp = mkdtempSync(join(tmpdir(), 'oczko-wzorzec-v1-'));
const plik = join(tmp, 'v1.db');
const db = new DatabaseSync(plik);
const w = (sql, ...p) => db.prepare(sql).run(...p);
try {
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  // --- migracja 1 jak runner (src/dane/migracje/migruj.ts): BEGIN, treść migracji, user_version w tej samej transakcji, COMMIT
  db.exec('BEGIN IMMEDIATE');
  db.exec(MIGRACJA_1.sql);
  db.exec('PRAGMA user_version = 1');
  db.exec('COMMIT');

  // --- część A: dane brzegowe (w pliku głównym po checkpoincie)
  db.exec('BEGIN IMMEDIATE');
  // iCloud włączony: wyzwalacze wypełniają zmiana_icloud w tych samych transakcjach (P-221 Q5a)
  w('UPDATE synchronizacja SET wlaczona = 1, stan_silnika = ?, zmieniono_ms = ? WHERE id = 1', new Uint8Array([0, 1, 2, 0xfe, 0xff, 0]), TERAZ - DOBA);

  const PDF = sha('wzor.pdf'), DOCX = sha('wzor.docx'), RYS = sha('rysunek.data'), ZDJ = sha('zdjecie.jpg'), PUSTY = sha('');
  for (const [s, r, b] of [[PDF, 'pdf', 204_800], [DOCX, 'docx', 51_200], [RYS, 'data', 1_024], [ZDJ, 'jpg', 2_097_152], [PUSTY, 'bin', 0]])
    w('INSERT INTO plik (sha256, rozszerzenie, bajty, utworzono_ms) VALUES (?, ?, ?, ?)', s, r, b, TERAZ - 10 * DOBA);

  const P = (n) => id('11111111', n);
  const projekt = (n, o = {}) => w(
    `INSERT INTO projekt (id, nazwa, nienazwany, stan, notatka, drut_mm, narzedzie, film_adres, film_nazwa, probka, termin_dzien, kopia_z,
       utworzono_ms, zmieniono_ms, ostatnia_praca_ms, ukonczono_ms, ukonczono_dzien, usunieto_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    P(n), o.nazwa ?? `Projekt ${n}`, o.nienazwany ?? 0, o.ukonczono ? 'ukonczony' : 'w_toku', o.notatka ?? '', o.drut ?? null, o.narzedzie ?? 'druty',
    o.film ?? null, o.filmNazwa ?? null, o.probka ?? '{}', o.termin ?? null, o.kopiaZ ?? null,
    o.t ?? TERAZ - 20 * DOBA, o.zm ?? TERAZ - 2 * DOBA, o.praca ?? TERAZ - 2 * DOBA, o.ukonczono ?? null, o.ukonczono ? dzienWaw(o.ukonczono) : null, o.usunieto ?? null,
  );
  projekt(1, { nazwa: 'Sweter raglanowy', drut: 4.5, film: 'https://example.com/film', filmNazwa: 'Film', probka: '{"oczka":22,"rzedy":30,"na_cm":10}', termin: '2026-12-24', notatka: 'Notatka\nw dwóch liniach' });
  projekt(2, { nazwa: '2026-11-03', nienazwany: 1 }); // projekt roboczy; pozostałe pola puste/NULL
  projekt(3, { nazwa: 'Czapka (kopia)', narzedzie: 'szydelko', drut: 0.6, kopiaZ: P(1), ukonczono: TERAZ - 3 * DOBA + 23 * GODZ }); // ukończony, szydełko, kopia projektu 1
  projekt(4, { nazwa: NAZWA_UNICODE, notatka: DLUGA, drut: 25 });
  projekt(5, { nazwa: DLUGA_NAZWA, usunieto: TERAZ - 29 * DOBA }); // w koszu, w terminie
  projekt(6, { nazwa: 'Szal po terminie kosza', usunieto: TERAZ - 31 * DOBA, ukonczono: TERAZ - 40 * DOBA }); // po terminie, jeszcze nie sprzątnięty
  projekt(7, { nazwa: 'x', t: 0, zm: 0, praca: 0 }); // najkrótsza nazwa, czas 0

  const C = (n) => id('22222222', n);
  const czesc = (n, p, o = {}) => w('INSERT INTO czesc (id, projekt_id, nazwa, kolejnosc, cel_rzedow, para_z, zmieniono_ms, usunieto_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    C(n), P(p), o.nazwa ?? `Część ${n}`, o.kolejnosc ?? n, o.cel ?? null, o.para ?? null, TERAZ - 5 * DOBA, o.usunieto ?? null);
  czesc(1, 1, { nazwa: 'Przód', cel: 120 });
  czesc(2, 1, { nazwa: 'Rękaw lewy', cel: 80 });
  czesc(3, 1, { nazwa: 'Rękaw prawy', cel: 80, para: C(2) }); // bliźniak
  czesc(4, 1, { nazwa: 'Usunięta część', usunieto: TERAZ - DOBA });
  czesc(5, 2, { nazwa: '—', kolejnosc: -1 });
  czesc(6, 3, { nazwa: 'Całość', cel: 1 });
  czesc(7, 4, { nazwa: NAZWA_UNICODE, kolejnosc: 2_147_483_647 });
  czesc(8, 5, { nazwa: 'W koszu z projektem' });
  czesc(9, 6, { nazwa: 'Po terminie' });

  const L = (n) => id('33333333', n);
  const licznik = (n, c, o = {}) => w(
    'INSERT INTO licznik (id, czesc_id, nazwa, rodzaj, znaczenie, dlugosc_powtorzenia, zablokowany, wartosc, glowa, konflikt, kolejnosc, zmieniono_ms, usunieto_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    L(n), C(c), o.nazwa ?? '', o.rodzaj ?? 'rzedy', o.znaczenie ?? 'skonczone', o.powt ?? null, o.blok ?? 0, o.wartosc ?? 0, o.glowa ?? null, o.konflikt ?? 0, o.kolejnosc ?? 0, TERAZ - DOBA, o.usunieto ?? null);
  const Z = (n) => id('44444444', n);
  const zdarzenie = (n, l, rodzaj, po, o = {}) => w(
    'INSERT INTO zdarzenie (id, licznik_id, rodzaj, wartosc, wartosc_po, rodzice, cofa, zrodlo, urzadzenie, urzadzenie_rodzaj, czas_ms, strefa, dzien) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    Z(n), L(l), rodzaj, o.wartosc ?? null, po, JSON.stringify(o.rodzice ?? []), JSON.stringify(o.cofa ?? []), o.zrodlo ?? 'aplikacja', o.urz ?? 'urz-a',
    o.urzRodzaj === undefined ? 'iphone' : o.urzRodzaj, o.t ?? TERAZ - DOBA + n * MIN, o.strefa ?? 'Europe/Warsaw', o.dzien ?? dzienWaw(o.t ?? TERAZ - DOBA + n * MIN));

  // licznik 1: zwykła historia, wszystkie rodzaje zdarzeń i źródła
  licznik(1, 1, { nazwa: 'Rzędy', wartosc: 3, glowa: Z(8), powt: 8 });
  zdarzenie(1, 1, 'plus', 1);
  zdarzenie(2, 1, 'plus', 2, { rodzice: [Z(1)], zrodlo: 'ekran_blokady' });
  zdarzenie(3, 1, 'minus', 1, { rodzice: [Z(2)], zrodlo: 'zegarek', urz: 'zegarek-1', urzRodzaj: null });
  zdarzenie(4, 1, 'wpisanie', 10, { wartosc: 10, rodzice: [Z(3)], urzRodzaj: 'ipad', urz: 'urz-b' });
  zdarzenie(5, 1, 'cofniecie', 1, { wartosc: 1, rodzice: [Z(4)], cofa: [Z(4)] });
  zdarzenie(6, 1, 'zerowanie', 0, { rodzice: [Z(5)], zrodlo: 'synchronizacja', urz: 'urz-b', urzRodzaj: 'ipad' });
  zdarzenie(7, 1, 'plus', 1, { rodzice: [Z(6)], zrodlo: 'import' });
  zdarzenie(8, 1, 'wpisanie', 3, { wartosc: 3, rodzice: [Z(7)], strefa: 'Pacific/Kiritimati', t: TERAZ - 12 * GODZ, dzien: '2026-11-04' }); // UTC+14: dzień lokalny „jutro”
  // licznik 2: konflikt (dwie gałęzie z dwóch urządzeń, scal() → 'konflikt'), potem licznik 3 z rozstrzygnięciem
  licznik(2, 2, { nazwa: 'Konflikt', wartosc: 6, konflikt: 1, glowa: Z(12), kolejnosc: 1 });
  zdarzenie(10, 2, 'wpisanie', 5, { wartosc: 5 });
  zdarzenie(11, 2, 'plus', 6, { rodzice: [Z(10)], urz: 'urz-a' });
  zdarzenie(12, 2, 'wpisanie', 9, { wartosc: 9, rodzice: [Z(10)], urz: 'urz-b', zrodlo: 'synchronizacja', urzRodzaj: 'ipad' });
  licznik(3, 3, { nazwa: 'Rozstrzygnięty', wartosc: 7, glowa: Z(23) });
  zdarzenie(20, 3, 'wpisanie', 5, { wartosc: 5 });
  zdarzenie(21, 3, 'plus', 6, { rodzice: [Z(20)] });
  zdarzenie(22, 3, 'plus', 6, { rodzice: [Z(20)], urz: 'urz-b', zrodlo: 'synchronizacja' });
  zdarzenie(23, 3, 'rozstrzygniecie', 7, { wartosc: 7, rodzice: [Z(21), Z(22)] });
  // licznik 4: wartość maksymalna dokładna w JS (Number.MAX_SAFE_INTEGER), oczka, w trakcie, zablokowany
  licznik(4, 7, { nazwa: NAZWA_UNICODE, rodzaj: 'oczka', znaczenie: 'w_trakcie', blok: 1, wartosc: Number.MAX_SAFE_INTEGER, glowa: Z(30), powt: 2_147_483_647 });
  zdarzenie(30, 4, 'wpisanie', Number.MAX_SAFE_INTEGER, { wartosc: Number.MAX_SAFE_INTEGER, t: 8_640_000_000_000_000, dzien: '9999-12-31', strefa: 'Etc/GMT-14' });
  // liczniki bez zdarzeń: zero, usunięty, w projekcie w koszu
  licznik(5, 1, { nazwa: 'Pusty', kolejnosc: 2 });
  licznik(6, 4, { nazwa: 'Usunięty licznik', wartosc: 12, usunieto: TERAZ - 29 * DOBA });
  licznik(7, 8, { nazwa: 'W koszu', wartosc: 1 });
  licznik(8, 9, { nazwa: 'Po terminie', wartosc: 2 });
  licznik(9, 6, { wartosc: 1, glowa: Z(40) });
  zdarzenie(40, 9, 'plus', 1, { t: TERAZ - 3 * DOBA });

  w('INSERT INTO notatka_rzedu (id, licznik_id, rzad, tekst, zmieniono_ms) VALUES (?, ?, ?, ?, ?)', id('55555555', 1), L(1), 1, 'Tu zmiana wzoru ✂', TERAZ - DOBA);
  w('INSERT INTO notatka_rzedu (id, licznik_id, rzad, tekst, zmieniono_ms) VALUES (?, ?, ?, ?, ?)', id('55555555', 2), L(4), 2_147_483_647, DLUGA, TERAZ - DOBA);
  w('INSERT INTO przypomnienie (id, licznik_id, od_rzedu, co_n, razy, tekst, zmieniono_ms) VALUES (?, ?, ?, ?, ?, ?, ?)', id('66666666', 1), L(1), 5, 6, 10, 'Dodaj oczko', TERAZ - DOBA);
  w('INSERT INTO przypomnienie (id, licznik_id, od_rzedu, co_n, razy, tekst, zmieniono_ms) VALUES (?, ?, ?, ?, ?, ?, ?)', id('66666666', 2), L(2), 1, 1, 1, '', TERAZ - DOBA);

  const S = (n) => id('77777777', n);
  w("INSERT INTO sesja (id, projekt_id, stan, start_ms, przerwy_ms, koniec_ms, skorygowano, strefa, dzien, zmieniono_ms) VALUES (?, ?, 'zakonczona', ?, ?, ?, 1, 'Europe/Warsaw', ?, ?)",
    S(1), P(1), TERAZ - 2 * DOBA, 10 * MIN, TERAZ - 2 * DOBA + 2 * GODZ, dzienWaw(TERAZ - 2 * DOBA), TERAZ - 2 * DOBA + 2 * GODZ);
  w("INSERT INTO sesja (id, projekt_id, stan, start_ms, koniec_ms, do_korekty, strefa, dzien) VALUES (?, ?, 'zakonczona', ?, ?, 1, 'America/St_Johns', ?)", // zamknięta automatycznie, zmieniono_ms 0
    S(2), P(3), TERAZ - 5 * DOBA, TERAZ - 5 * DOBA + 8 * GODZ, '2026-10-29');
  w("INSERT INTO sesja (id, projekt_id, stan, start_ms, wstrzymano_ms, przerwy_ms, strefa, dzien, zmieniono_ms) VALUES (?, ?, 'wstrzymana', ?, ?, 0, 'Europe/Warsaw', ?, ?)", // jedna otwarta
    S(3), P(1), TERAZ - GODZ, TERAZ - 30 * MIN, dzienWaw(TERAZ), TERAZ - 30 * MIN);

  const W = (n) => id('88888888', n);
  const wzor = (n, p, zrodlo, pdf, oryg, o = {}) => w(
    'INSERT INTO wzor (id, projekt_id, nazwa, zrodlo, pdf_sha256, oryginal_sha256, adres, znacznik, zmieniono_ms, usunieto_ms, obroty, strony) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    W(n), P(p), o.nazwa ?? `Wzór ${n}`, zrodlo, pdf, oryg, o.adres ?? null, o.znacznik ?? '{}', TERAZ - 4 * DOBA, o.usunieto ?? null, o.obroty ?? '{}', o.strony ?? null);
  wzor(1, 1, 'pdf', PDF, null, { strony: 12, obroty: '{"0":90,"3":270}', znacznik: JSON.stringify({ licznik_id: L(1), strona: 0, y: 0.25, wysokosc_rzedu: 0.02, rzad_bazowy: 1, wartosc_przy_ustawieniu: 3, kierunek: -1 }) });
  wzor(2, 1, 'word', null, DOCX, { nazwa: 'Wzór z Worda (podgląd)' });
  wzor(3, 4, 'www', PDF, null, { adres: 'https://example.com/wzor?a=1&b=ż', nazwa: NAZWA_UNICODE, strony: 1 });
  wzor(4, 3, 'obraz', PDF, ZDJ, { usunieto: TERAZ - 29 * DOBA });
  w('INSERT INTO rysunek (wzor_id, strona, plik_sha256, zmieniono_ms) VALUES (?, ?, ?, ?)', W(1), 0, RYS, TERAZ - 3 * DOBA);
  w('INSERT INTO rysunek (wzor_id, strona, plik_sha256, zmieniono_ms) VALUES (?, ?, ?, ?)', W(1), 11, PUSTY, TERAZ - 3 * DOBA);

  const WL = (n) => id('99999999', n);
  w(`INSERT INTO wloczka (id, nazwa, producent, sklad, kolor, waga_motka_g, dlugosc_motka_m, motki, kategoria, pielegnacja, notatka, zmieniono_ms)
     VALUES (?, 'Merino 4', 'Wytwórnia', '100% wełna merino', 'Grafit', 50, 200, 3.5, 3, 'Pranie ręczne 30°C', 'Partia 12', ?)`, WL(1), TERAZ - 6 * DOBA);
  w("INSERT INTO wloczka (id, nazwa, zmieniono_ms) VALUES (?, 'a', ?)", WL(2), TERAZ - 6 * DOBA); // same domyślne: puste napisy, NULL, motki 0
  w("INSERT INTO wloczka (id, nazwa, motki, kategoria, kolor, zmieniono_ms) VALUES (?, ?, 1e9, 0, ?, ?)", WL(3), NAZWA_UNICODE, DLUGA_NAZWA, TERAZ - 6 * DOBA);
  w("INSERT INTO wloczka (id, nazwa, kategoria, zmieniono_ms, usunieto_ms) VALUES (?, 'Usunięta 29', 7, ?, ?)", WL(4), TERAZ - 29 * DOBA, TERAZ - 29 * DOBA);
  w("INSERT INTO wloczka (id, nazwa, zmieniono_ms, usunieto_ms) VALUES (?, 'Usunięta 31', ?, ?)", WL(5), TERAZ - 31 * DOBA, TERAZ - 31 * DOBA);

  w("INSERT INTO narzedzie (id, rodzaj, rozmiar_mm, opis, zmieniono_ms) VALUES (?, 'druty', 4.5, 'Druty z żyłką 80 cm', ?)", id('aaaaaaaa', 1), TERAZ - 6 * DOBA);
  w("INSERT INTO narzedzie (id, rodzaj, rozmiar_mm, zmieniono_ms) VALUES (?, 'szydelko', 0.6, ?)", id('aaaaaaaa', 2), TERAZ - 6 * DOBA);
  w("INSERT INTO narzedzie (id, rodzaj, zmieniono_ms, usunieto_ms) VALUES (?, 'inne', ?, ?)", id('aaaaaaaa', 3), TERAZ - 31 * DOBA, TERAZ - 31 * DOBA);

  w('INSERT INTO projekt_wloczka (projekt_id, wloczka_id, zuzyto_motki, odjeto_motki, zmieniono_ms) VALUES (?, ?, NULL, NULL, ?)', P(1), WL(1), TERAZ - 2 * DOBA);
  w('INSERT INTO projekt_wloczka (projekt_id, wloczka_id, zuzyto_motki, odjeto_motki, zmieniono_ms) VALUES (?, ?, 3, 1, ?)', P(3), WL(2), TERAZ - 3 * DOBA); // zapas 1, zużycie 3 → odjęto 1 (P-334)
  w('INSERT INTO projekt_wloczka (projekt_id, wloczka_id, zuzyto_motki, odjeto_motki, zmieniono_ms) VALUES (?, ?, 1.5, 0, ?)', P(4), WL(4), TERAZ - 3 * DOBA); // włóczka w koszu

  w('INSERT INTO zdjecie (id, projekt_id, wloczka_id, plik_sha256, utworzono_ms) VALUES (?, ?, NULL, ?, ?)', id('bbbbbbbb', 1), P(1), ZDJ, TERAZ - 2 * DOBA);
  w('INSERT INTO zdjecie (id, projekt_id, wloczka_id, plik_sha256, utworzono_ms) VALUES (?, NULL, ?, ?, ?)', id('bbbbbbbb', 2), WL(1), ZDJ, TERAZ - 2 * DOBA); // ten sam plik w dwóch miejscach

  w("INSERT INTO obliczenie (id, projekt_id, rodzaj, wejscie, wynik, wersja_regul, utworzono_ms) VALUES (?, ?, 'oczka_z_probki', ?, ?, '1.1', ?)",
    id('cccccccc', 1), P(1), '{"oczka":22,"na_cm":10,"szerokosc_cm":50}', '{"oczka":110}', TERAZ - 2 * DOBA);
  w("INSERT INTO obliczenie (id, projekt_id, rodzaj, wejscie, wynik, wersja_regul, utworzono_ms) VALUES (?, NULL, 'jednostki', '{}', '[]', '', ?)", id('cccccccc', 2), TERAZ - 2 * DOBA);
  w("INSERT INTO obliczenie (id, projekt_id, rodzaj, wejscie, wynik, wersja_regul, utworzono_ms) VALUES (?, ?, 'grubosc', '{\"wpi\":12}', '{\"kategoria\":3}', '1.1', ?)", id('cccccccc', 3), P(6), TERAZ - 40 * DOBA);

  w("INSERT INTO dzien_limitu (dzien, pro, zaczeto_ms, zdarzenie_id) VALUES (?, 0, ?, ?)", dzienWaw(TERAZ - DOBA), TERAZ - DOBA + MIN, Z(1));
  w("INSERT INTO dzien_limitu (dzien, pro, zaczeto_ms, zdarzenie_id) VALUES ('2026-10-01', 1, ?, ?)", Date.UTC(2026, 9, 1, 8), id('44444444', 999)); // zdarzenie już nie istnieje (bez FK)

  w("INSERT INTO poczekalnia (id, rodzaj_rekordu, dane, powod, zrodlo, przyszlo_ms, proby) VALUES (?, 'zdarzenie', ?, 'brak_rodzica', 'zegarek', ?, 0)",
    id('dddddddd', 1), JSON.stringify({ id: id('dddddddd', 1), licznik_id: L(1), rodzaj: 'plus', rodzice: [id('44444444', 998)] }), TERAZ - 8 * DOBA);
  w("INSERT INTO poczekalnia (id, rodzaj_rekordu, dane, powod, zrodlo, przyszlo_ms, proby) VALUES (?, 'encja', ?, 'nowsza_wersja', 'synchronizacja', ?, 2147483647)",
    id('dddddddd', 2), JSON.stringify({ encja: 'projekt', nazwa: NAZWA_UNICODE, wersja_schematu: 2 }), TERAZ - 31 * DOBA);

  w("INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES ('okno_uczciwe_zasady_widziane', 'true', ?)", TERAZ - 10 * DOBA);
  w("INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES ('jezyk', '\"pl\"', ?)", TERAZ - 10 * DOBA);
  w("INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES ('ostatni_start_ms', ?, ?)", String(TERAZ), TERAZ); // ostatni start = chwila wzorca (test kosza liczy od niej)

  w("INSERT INTO blad (czas_ms, kod, szczegoly) VALUES (?, 'dziennik_linia', ?)", TERAZ - DOBA, JSON.stringify({ linia: 'x'.repeat(4096) }));
  w("INSERT INTO blad (czas_ms, kod) VALUES (?, 'poczekalnia_przeterminowana')", TERAZ - 2 * DOBA);
  // skrzynka iCloud: część wysłana i potwierdzona, część objęta pobraniem strefy
  w("UPDATE zmiana_icloud SET wyslano_nr = nr, objete = 1 WHERE encja = 'plik'");
  w("UPDATE zmiana_icloud SET wyslano_nr = nr WHERE encja = 'wloczka'");
  db.exec('COMMIT');
  db.exec('PRAGMA wal_checkpoint(TRUNCATE)');

  // --- część B: ostatnie zapisy tylko w -wal (migawka kopii urządzenia bez checkpointu, R-075)
  db.exec('PRAGMA wal_autocheckpoint = 0');
  db.exec('BEGIN IMMEDIATE');
  zdarzenie(9, 1, 'plus', 4, { rodzice: [Z(8)], t: TERAZ - MIN });
  w('UPDATE licznik SET wartosc = 4, glowa = ?, zmieniono_ms = ? WHERE id = ?', Z(9), TERAZ - MIN, L(1));
  w('UPDATE projekt SET ostatnia_praca_ms = ?, zmieniono_ms = ? WHERE id = ?', TERAZ - MIN, TERAZ - MIN, P(1));
  w("INSERT INTO poczekalnia (id, rodzaj_rekordu, dane, powod, zrodlo, przyszlo_ms) VALUES ('wal-0000-4000-8000-000000000001', 'encja', '{}', 'brak_encji', 'ekran_blokady', ?)", TERAZ);
  db.exec('COMMIT');

  const kontrola = db.prepare('PRAGMA integrity_check').all();
  const fk = db.prepare('PRAGMA foreign_key_check').all();
  if (kontrola.length !== 1 || kontrola[0].integrity_check !== 'ok' || fk.length !== 0) throw new Error(`wzorzec niespójny: ${JSON.stringify({ kontrola, fk })}`);
  if (!existsSync(plik + '-wal')) throw new Error('brak -wal po części B');

  // --- kopia trzech plików przy otwartym połączeniu (jak migawka kopii urządzenia)
  mkdirSync(cel, { recursive: true });
  for (const n of PLIKI) rmSync(join(cel, n), { force: true });
  for (const n of PLIKI) copyFileSync(join(tmp, n), join(cel, n));
} finally {
  db.close();
  rmSync(tmp, { recursive: true, force: true });
}
console.log(`[generuj-wzorzec-v1] ${PLIKI.map((n) => join(cel, n)).join(', ')}`);
