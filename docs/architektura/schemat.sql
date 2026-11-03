-- Oczko · schemat bazy wersji 1 (rola 05, E2, 2026-10-22) · ADR-0001, ADR-0002, ADR-0005, ADR-0013
-- Konwencje (moduł dane-lokalne-sqlite): tabele STRICT (SQLite ≥ 3.37), id TEXT (UUID nadaje aplikacja),
-- czas INTEGER ms UTC (nadaje jeden moduł zegara), JSON jako TEXT CHECK (json_valid(...)),
-- CHECK tylko dla niezmienników strukturalnych; progi dziedzinowe w src/konfiguracja.ts.
-- Listy stanów i rodzajów: jedna definicja w docs/architektura/stany.json (test „stany ⊆ CHECK”).
-- „Ostatnio usunięte” (F-33, P-026): usunieto_ms, trwałe usunięcie po 30 dniach przy uruchomieniu.
-- Zapis rekordu nadrzędnego: UPSERT, nigdy INSERT OR REPLACE (ADR-0002, rejestr SQLite, eksperyment A).

CREATE TABLE plik (                                   -- pliki poza bazą: Application Support/pliki/<sha256>.<rozszerzenie> (ADR-0001)
  sha256 TEXT PRIMARY KEY NOT NULL CHECK (length(sha256) = 64),
  rozszerzenie TEXT NOT NULL CHECK (length(rozszerzenie) > 0),
  bajty INTEGER NOT NULL CHECK (bajty >= 0),
  utworzono_ms INTEGER NOT NULL
) STRICT;

CREATE TABLE projekt (                                -- F-14, F-15, F-17, F-18, F-19, F-20, F-49, F-50, F-54, F-61
  id TEXT PRIMARY KEY NOT NULL,
  nazwa TEXT NOT NULL CHECK (length(nazwa) > 0),
  nienazwany INTEGER NOT NULL DEFAULT 0 CHECK (nienazwany IN (0, 1)),   -- 1 = projekt roboczy z BR-LIC-001 „Nazwanie później”; etykieta liczona przy wyświetlaniu (P-126 (1b))
  stan TEXT NOT NULL DEFAULT 'w_toku' CHECK (stan IN ('w_toku', 'ukonczony')),
  notatka TEXT NOT NULL DEFAULT '',
  drut_mm REAL CHECK (drut_mm IS NULL OR drut_mm > 0),
  narzedzie TEXT NOT NULL DEFAULT 'druty' CHECK (narzedzie IN ('druty', 'szydelko')), -- rodzaj do numeru US: RD-11 druty, RD-19 szydełko (P-184)
  film_adres TEXT CHECK (film_adres IS NULL OR film_adres GLOB 'http*'),   -- link do filmu projektu (F-55, P-246 S4a; P-218 (4): poza wzorem); tylko link, bez filmu
  film_nazwa TEXT,
  probka TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(probka)),   -- {oczka, rzedy, na_cm} wpisane raz (U-10)
  termin_dzien TEXT CHECK (termin_dzien IS NULL OR termin_dzien GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  kopia_z TEXT REFERENCES projekt(id) ON DELETE SET NULL,          -- „Zrób taką samą” (F-20)
  utworzono_ms INTEGER NOT NULL,
  zmieniono_ms INTEGER NOT NULL,
  ostatnia_praca_ms INTEGER NOT NULL,
  ukonczono_ms INTEGER,
  ukonczono_dzien TEXT CHECK (ukonczono_dzien IS NULL OR ukonczono_dzien GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),   -- dzień lokalny RD-16 przy ukończeniu (P-124 Q5a)
  usunieto_ms INTEGER,
  CHECK ((stan = 'ukonczony') = (ukonczono_ms IS NOT NULL) AND (ukonczono_ms IS NULL) = (ukonczono_dzien IS NULL))
) STRICT;
CREATE INDEX projekt_lista ON projekt(stan, ostatnia_praca_ms DESC) WHERE usunieto_ms IS NULL;
CREATE INDEX projekt_kopia_z ON projekt(kopia_z);

CREATE TABLE czesc (                                  -- kawałek projektu (F-14, F-08, F-52)
  id TEXT PRIMARY KEY NOT NULL,
  projekt_id TEXT NOT NULL REFERENCES projekt(id) ON DELETE CASCADE,
  nazwa TEXT NOT NULL CHECK (length(nazwa) > 0),
  kolejnosc INTEGER NOT NULL,
  cel_rzedow INTEGER CHECK (cel_rzedow IS NULL OR cel_rzedow >= 1),
  para_z TEXT REFERENCES czesc(id) ON DELETE SET NULL,            -- bliźniak (BR-PRJ-014)
  zmieniono_ms INTEGER NOT NULL,
  usunieto_ms INTEGER
) STRICT;
CREATE INDEX czesc_projekt ON czesc(projekt_id, kolejnosc);
CREATE INDEX czesc_para_z ON czesc(para_z);

CREATE TABLE licznik (                                -- F-01, F-03, F-04, F-05, F-09, F-46
  id TEXT PRIMARY KEY NOT NULL,
  czesc_id TEXT NOT NULL REFERENCES czesc(id) ON DELETE CASCADE,
  nazwa TEXT NOT NULL DEFAULT '',
  rodzaj TEXT NOT NULL DEFAULT 'rzedy' CHECK (rodzaj IN ('rzedy', 'oczka')),
  znaczenie TEXT NOT NULL DEFAULT 'skonczone' CHECK (znaczenie IN ('skonczone', 'w_trakcie')),
  dlugosc_powtorzenia INTEGER CHECK (dlugosc_powtorzenia IS NULL OR dlugosc_powtorzenia >= 1), -- RD-12-W5
  zablokowany INTEGER NOT NULL DEFAULT 0 CHECK (zablokowany IN (0, 1)),
  wartosc INTEGER NOT NULL DEFAULT 0 CHECK (wartosc >= 0),         -- wynik funkcji scal() na zdarzeniach; pamięć podręczna w tej samej transakcji co zdarzenie
  glowa TEXT,                                                      -- id ostatniego zdarzenia (rodzic kolejnego)
  konflikt INTEGER NOT NULL DEFAULT 0 CHECK (konflikt IN (0, 1)),  -- scal() zwrócił 'konflikt' (NFR-DAN-003, F-58)
  kolejnosc INTEGER NOT NULL,
  zmieniono_ms INTEGER NOT NULL,
  usunieto_ms INTEGER
) STRICT;
CREATE INDEX licznik_czesc ON licznik(czesc_id, kolejnosc);

CREATE TABLE zdarzenie (                              -- historia zmian (BR-LIC-003), tylko dopisywana (ADR-0005)
  id TEXT PRIMARY KEY NOT NULL,
  licznik_id TEXT NOT NULL REFERENCES licznik(id) ON DELETE CASCADE,
  rodzaj TEXT NOT NULL CHECK (rodzaj IN ('plus', 'minus', 'wpisanie', 'zerowanie', 'cofniecie', 'rozstrzygniecie')),
  wartosc INTEGER CHECK (wartosc IS NULL OR wartosc >= 0),         -- dla wpisanie, cofniecie, rozstrzygniecie
  wartosc_po INTEGER NOT NULL CHECK (wartosc_po >= 0),
  rodzice TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(rodzice) AND json_type(rodzice) = 'array'),
  cofa TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(cofa) AND json_type(cofa) = 'array'), -- id cofniętych zdarzeń (F-02, F-47)
  zrodlo TEXT NOT NULL CHECK (zrodlo IN ('aplikacja', 'ekran_blokady', 'zegarek', 'synchronizacja', 'import')),
  urzadzenie TEXT NOT NULL,
  urzadzenie_rodzaj TEXT CHECK (urzadzenie_rodzaj IN ('iphone', 'ipad')), -- P-247 U6a: rodzaj urządzenia (Platform.isPad) do wyboru wersji; NULL (CHECK przepuszcza) = nieznany: zegarek, starsze
  czas_ms INTEGER NOT NULL,                                        -- chwila UTC (RD-16)
  strefa TEXT NOT NULL CHECK (length(strefa) > 0),                 -- IANA w chwili zmiany (RD-16)
  dzien TEXT NOT NULL CHECK (dzien GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'), -- data lokalna, nie przeliczana później (RD-16)
  CHECK ((rodzaj IN ('wpisanie', 'cofniecie', 'rozstrzygniecie')) = (wartosc IS NOT NULL))
) STRICT;
CREATE INDEX zdarzenie_licznik_czas ON zdarzenie(licznik_id, czas_ms);
CREATE INDEX zdarzenie_dzien ON zdarzenie(dzien, licznik_id);

CREATE TABLE notatka_rzedu (                          -- notatka przy rzędzie (BR-PRJ-014 „to samo miejsce”)
  id TEXT PRIMARY KEY NOT NULL,
  licznik_id TEXT NOT NULL REFERENCES licznik(id) ON DELETE CASCADE,
  rzad INTEGER NOT NULL CHECK (rzad >= 1),
  tekst TEXT NOT NULL CHECK (length(tekst) > 0),
  zmieniono_ms INTEGER NOT NULL
) STRICT;
CREATE INDEX notatka_rzedu_licznik ON notatka_rzedu(licznik_id, rzad);

CREATE TABLE przypomnienie (                          -- „od rzędu s, co N, M razy” (F-06, RD-13)
  id TEXT PRIMARY KEY NOT NULL,
  licznik_id TEXT NOT NULL REFERENCES licznik(id) ON DELETE CASCADE,
  od_rzedu INTEGER NOT NULL CHECK (od_rzedu >= 1),
  co_n INTEGER NOT NULL CHECK (co_n >= 1),
  razy INTEGER NOT NULL CHECK (razy >= 1),
  tekst TEXT NOT NULL DEFAULT '',
  zmieniono_ms INTEGER NOT NULL
) STRICT;
CREATE INDEX przypomnienie_licznik ON przypomnienie(licznik_id);

CREATE TABLE sesja (                                  -- stoper (F-21, F-51); czas ze znaczników, nie z odliczania (ADR-0013)
  id TEXT PRIMARY KEY NOT NULL,
  projekt_id TEXT NOT NULL REFERENCES projekt(id) ON DELETE CASCADE,
  stan TEXT NOT NULL CHECK (stan IN ('trwa', 'wstrzymana', 'zakonczona')),
  start_ms INTEGER NOT NULL,
  wstrzymano_ms INTEGER,
  przerwy_ms INTEGER NOT NULL DEFAULT 0 CHECK (przerwy_ms >= 0),
  koniec_ms INTEGER,
  skorygowano INTEGER NOT NULL DEFAULT 0 CHECK (skorygowano IN (0, 1)),
  do_korekty INTEGER NOT NULL DEFAULT 0 CHECK (do_korekty IN (0, 1)),  -- zamknięta automatycznie (SESJA_MAKS_H) albo druga otwarta sesja przy scaleniu (ADR-0005, Z07-14); pokazana do sprawdzenia
  strefa TEXT NOT NULL,
  dzien TEXT NOT NULL CHECK (dzien GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  zmieniono_ms INTEGER NOT NULL DEFAULT 0,                          -- scalenie encji iCloud i importu „scal” (P-221 Q6a); nadaje aplikacja przy każdym przejściu, 0 = sprzed łatki fix-7
  CHECK ((stan = 'zakonczona') = (koniec_ms IS NOT NULL)),
  CHECK ((stan = 'wstrzymana') = (wstrzymano_ms IS NOT NULL)),
  CHECK (koniec_ms IS NULL OR koniec_ms >= start_ms)
) STRICT;
CREATE UNIQUE INDEX sesja_jedna_otwarta ON sesja((stan IN ('trwa', 'wstrzymana'))) WHERE stan IN ('trwa', 'wstrzymana');
CREATE INDEX sesja_projekt ON sesja(projekt_id, start_ms);
CREATE INDEX sesja_dzien ON sesja(dzien);

CREATE TABLE wzor (                                   -- F-24, F-25, F-26, F-55 (ADR-0011)
  id TEXT PRIMARY KEY NOT NULL,
  projekt_id TEXT NOT NULL REFERENCES projekt(id) ON DELETE CASCADE,
  nazwa TEXT NOT NULL CHECK (length(nazwa) > 0),
  zrodlo TEXT NOT NULL CHECK (zrodlo IN ('pdf', 'obraz', 'www', 'word')),
  pdf_sha256 TEXT REFERENCES plik(sha256) ON DELETE RESTRICT,       -- NULL tylko dla Worda w podglądzie (P-071 (5a))
  oryginal_sha256 TEXT REFERENCES plik(sha256) ON DELETE RESTRICT,
  adres TEXT,                                                       -- URL strony albo filmu
  znacznik TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(znacznik)), -- {licznik_id, strona, y, wysokosc_rzedu, rzad_bazowy, wartosc_przy_ustawieniu, kierunek} (BR-WZR-003); y i wysokosc_rzedu: ułamek wysokości strony 0–1; kierunek 1 (w dół) albo -1 (w górę) (ADR-0011, uzupełnienia; fix-2 P-118 Q2a)
  zmieniono_ms INTEGER NOT NULL,
  usunieto_ms INTEGER,                                              -- usunięty z projektu do kosza (P-220 N4, P-229): przywracany, trwale usunięty przy sprzątaniu po KOSZ_DNI (nagrobek dla iCloud, P-221 Q6a)
  obroty TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(obroty)),     -- obrót strony w widoku {"<strona>": 90|180|270} (P-246 S3a); plik wzoru bez zmian (P-218 (2)); synchronizowany z wzorem
  strony INTEGER CHECK (strony IS NULL OR strony > 0),               -- liczba stron zapisana przy imporcie (P-252); NULL = nieznana
  CHECK (pdf_sha256 IS NOT NULL OR (zrodlo = 'word' AND oryginal_sha256 IS NOT NULL))
) STRICT;
CREATE INDEX wzor_projekt ON wzor(projekt_id);
CREATE INDEX wzor_pdf ON wzor(pdf_sha256);
CREATE INDEX wzor_oryginal ON wzor(oryginal_sha256);

CREATE TABLE rysunek (                                -- PKDrawing na stronę (F-28, F-56, ADR-0012)
  wzor_id TEXT NOT NULL REFERENCES wzor(id) ON DELETE CASCADE,
  strona INTEGER NOT NULL CHECK (strona >= 0),
  plik_sha256 TEXT NOT NULL REFERENCES plik(sha256) ON DELETE RESTRICT,
  zmieniono_ms INTEGER NOT NULL,
  PRIMARY KEY (wzor_id, strona)
) STRICT;
CREATE INDEX rysunek_plik ON rysunek(plik_sha256);

CREATE TABLE wloczka (                                -- zapas (F-37, BR-ZAP-001, BR-ZAP-004)
  id TEXT PRIMARY KEY NOT NULL,
  nazwa TEXT NOT NULL CHECK (length(nazwa) > 0),
  producent TEXT NOT NULL DEFAULT '',
  sklad TEXT NOT NULL DEFAULT '',
  kolor TEXT NOT NULL DEFAULT '',
  waga_motka_g REAL CHECK (waga_motka_g IS NULL OR waga_motka_g > 0),
  dlugosc_motka_m REAL CHECK (dlugosc_motka_m IS NULL OR dlugosc_motka_m > 0),
  motki REAL NOT NULL DEFAULT 0 CHECK (motki >= 0),
  kategoria INTEGER CHECK (kategoria IS NULL OR kategoria BETWEEN 0 AND 7), -- kategoria grubości CYC 0–7 z etykiety albo wybrana przez użytkownika; NULL = nieznana (BR-ZAP-004, RD-10, P-110 Q6a)
  pielegnacja TEXT NOT NULL DEFAULT '',                             -- tekstem (OG-13)
  notatka TEXT NOT NULL DEFAULT '',
  zmieniono_ms INTEGER NOT NULL,
  usunieto_ms INTEGER
) STRICT;
CREATE INDEX wloczka_nazwa ON wloczka(nazwa COLLATE NOCASE) WHERE usunieto_ms IS NULL;
CREATE INDEX wloczka_kategoria ON wloczka(kategoria, nazwa COLLATE NOCASE) WHERE usunieto_ms IS NULL; -- filtr grubości w zapasie (BR-ZAP-004)

CREATE TABLE narzedzie (                              -- BR-ZAP-003
  id TEXT PRIMARY KEY NOT NULL,
  rodzaj TEXT NOT NULL CHECK (rodzaj IN ('druty', 'szydelko', 'inne')),
  rozmiar_mm REAL CHECK (rozmiar_mm IS NULL OR rozmiar_mm > 0),
  opis TEXT NOT NULL DEFAULT '',
  zmieniono_ms INTEGER NOT NULL,
  usunieto_ms INTEGER
) STRICT;

CREATE TABLE projekt_wloczka (                        -- przypisanie i zużycie (BR-ZAP-002, U-9)
  projekt_id TEXT NOT NULL REFERENCES projekt(id) ON DELETE CASCADE,
  wloczka_id TEXT NOT NULL REFERENCES wloczka(id) ON DELETE CASCADE,
  zuzyto_motki REAL CHECK (zuzyto_motki IS NULL OR zuzyto_motki >= 0),
  odjeto_motki REAL CHECK (odjeto_motki IS NULL OR odjeto_motki >= 0),    -- ile faktycznie odjęto od zapasu przy potwierdzeniu (po obcięciu do 0); NULL = brak odjęcia; zwrot przy odznaczeniu (P-334)
  zmieniono_ms INTEGER NOT NULL,
  PRIMARY KEY (projekt_id, wloczka_id)
) STRICT;
CREATE INDEX projekt_wloczka_wloczka ON projekt_wloczka(wloczka_id);

CREATE TABLE zdjecie (                                -- F-16 (projekt, etykieta włóczki)
  id TEXT PRIMARY KEY NOT NULL,
  projekt_id TEXT REFERENCES projekt(id) ON DELETE CASCADE,
  wloczka_id TEXT REFERENCES wloczka(id) ON DELETE CASCADE,
  plik_sha256 TEXT NOT NULL REFERENCES plik(sha256) ON DELETE RESTRICT,
  utworzono_ms INTEGER NOT NULL,
  CHECK ((projekt_id IS NULL) <> (wloczka_id IS NULL))
) STRICT;
CREATE INDEX zdjecie_projekt ON zdjecie(projekt_id);
CREATE INDEX zdjecie_wloczka ON zdjecie(wloczka_id);
CREATE INDEX zdjecie_plik ON zdjecie(plik_sha256);

CREATE TABLE obliczenie (                             -- F-38: wynik z danymi wejściowymi zapisany w projekcie
  id TEXT PRIMARY KEY NOT NULL,
  projekt_id TEXT REFERENCES projekt(id) ON DELETE CASCADE,
  rodzaj TEXT NOT NULL CHECK (rodzaj IN ('oczka_z_probki', 'jednostki', 'grubosc')),
  wejscie TEXT NOT NULL CHECK (json_valid(wejscie)),
  wynik TEXT NOT NULL CHECK (json_valid(wynik)),
  wersja_regul TEXT NOT NULL,                                       -- wersja rejestru merytorycznego roli 06
  utworzono_ms INTEGER NOT NULL
) STRICT;
CREATE INDEX obliczenie_projekt ON obliczenie(projekt_id);

CREATE TABLE dzien_limitu (                           -- dni limitu V4 (startDnia, P-057, P-067); wejście `dni` funkcji limit.mjs
  dzien TEXT PRIMARY KEY NOT NULL CHECK (dzien GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  pro INTEGER NOT NULL CHECK (pro IN (0, 1)),
  zaczeto_ms INTEGER NOT NULL,
  zdarzenie_id TEXT NOT NULL                                        -- zdarzenie, które zaczęło dzień (bez FK: dzień zostaje po usunięciu licznika; dane.md, KP-15, L-16)
) STRICT;

CREATE TABLE poczekalnia (                           -- rekordy z synchronizacji, importu, dziennika i zegarka, które czekają na rodzica albo encję (ADR-0005, P-110 Q1a)
  id TEXT PRIMARY KEY NOT NULL,                                     -- id rekordu (zdarzenia albo encji); powtórzone dostarczenie = ten sam wiersz
  rodzaj_rekordu TEXT NOT NULL CHECK (rodzaj_rekordu IN ('zdarzenie', 'encja')),
  dane TEXT NOT NULL CHECK (json_valid(dane)),                      -- rekord w postaci adaptera (bez kluczy obcych: rodzic może jeszcze nie istnieć)
  powod TEXT NOT NULL CHECK (powod IN ('brak_rodzica', 'brak_encji', 'nowsza_wersja')),
  zrodlo TEXT NOT NULL CHECK (zrodlo IN ('synchronizacja', 'import', 'ekran_blokady', 'zegarek')),
  przyszlo_ms INTEGER NOT NULL,                                     -- pierwsze dostarczenie; po POCZEKALNIA_DNI: wpis w `blad` i „niepełna historia” w Stanie danych, wiersz zostaje
  proby INTEGER NOT NULL DEFAULT 0 CHECK (proby >= 0)
) STRICT;
CREATE INDEX poczekalnia_przyszlo ON poczekalnia(przyszlo_ms);

CREATE TABLE ustawienie (                             -- ustawienia i mały stan (np. ostatnie miejsce F-49, stan Pro dla zegarka)
  klucz TEXT PRIMARY KEY NOT NULL,
  wartosc TEXT NOT NULL CHECK (json_valid(wartosc)),
  zmieniono_ms INTEGER NOT NULL
) STRICT;

CREATE TABLE blad (                                   -- diagnostyka lokalna F-57, bez treści projektów (NFR-PRY-001)
  id INTEGER PRIMARY KEY,
  czas_ms INTEGER NOT NULL,
  kod TEXT NOT NULL CHECK (length(kod) > 0),
  szczegoly TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(szczegoly))
) STRICT;

CREATE TABLE synchronizacja (                         -- stan iCloud na urządzeniu (ADR-0005, uzupełnienie fix-7; P-221 Q5a); lokalna, bez wyzwalaczy, poza importem i archiwum
  id INTEGER PRIMARY KEY CHECK (id = 1),
  wlaczona INTEGER NOT NULL DEFAULT 0 CHECK (wlaczona IN (0, 1)),   -- przełącznik F-27 (domyślnie wyłączony, BR-DAN-002/S3, P-220 I1a); 0 = wyzwalacze nie piszą do skrzynki
  wejscie INTEGER NOT NULL DEFAULT 0 CHECK (wejscie IN (0, 1)),     -- 1 tylko wewnątrz transakcji partii z iCloud (zapis nie wraca do skrzynki); zerowane przed COMMIT
  stan_silnika BLOB,                                                -- CKSyncEngine.State.Serialization, zapisywany w transakcji partii, którą opisuje
  nr_zmiany INTEGER NOT NULL DEFAULT 0 CHECK (nr_zmiany >= 0),      -- licznik zmian skrzynki (zwiększa go wyzwalacz); nigdy nie maleje
  zmieniono_ms INTEGER NOT NULL DEFAULT 0
) STRICT;
INSERT INTO synchronizacja (id) VALUES (1);

CREATE TABLE zmiana_icloud (                          -- skrzynka zmian do wysłania (P-221 Q5a); wypełniają wyzwalacze w tej samej transakcji co dane
  encja TEXT NOT NULL,                                              -- nazwa tabeli z docs/architektura/icloud-tabele.json
  klucz TEXT NOT NULL,                                              -- klucz główny; klucz złożony = json_array(kolumny)
  usuniete INTEGER NOT NULL CHECK (usuniete IN (0, 1)),             -- 1 = usunięcie (także kaskadą) → rekord usunięty w CloudKit
  nr INTEGER NOT NULL,                                              -- nr_zmiany ostatniej zmiany; potwierdzenie wysyłki usuwa wpis tylko z nr ≤ wysłanego
  wyslano_nr INTEGER CHECK (wyslano_nr IS NULL OR wyslano_nr <= nr),   -- NULL = niewysłany; = nr: potwierdzony, czeka na pełne pobranie strefy (ADR-0005, uzupełnienie 2026-11-03)
  objete INTEGER NOT NULL DEFAULT 0 CHECK (objete IN (0, 1)),          -- 1 = wysłany przed początkiem bieżącego pobrania strefy; usuwany na jego udanym końcu
  PRIMARY KEY (encja, klucz)
) STRICT;

-- Wyzwalacze skrzynki zmian (P-221 Q5a): tabele i klucze z docs/architektura/icloud-tabele.json; nie nadają czasu (czas nadaje aplikacja).
CREATE TRIGGER plik_icloud_i AFTER INSERT ON plik WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('plik', NEW.sha256, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER plik_icloud_u AFTER UPDATE ON plik WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('plik', NEW.sha256, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER plik_icloud_d AFTER DELETE ON plik WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('plik', OLD.sha256, 1, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER projekt_icloud_i AFTER INSERT ON projekt WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('projekt', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER projekt_icloud_u AFTER UPDATE ON projekt WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('projekt', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER projekt_icloud_d AFTER DELETE ON projekt WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('projekt', OLD.id, 1, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER czesc_icloud_i AFTER INSERT ON czesc WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('czesc', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER czesc_icloud_u AFTER UPDATE ON czesc WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('czesc', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER czesc_icloud_d AFTER DELETE ON czesc WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('czesc', OLD.id, 1, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER licznik_icloud_i AFTER INSERT ON licznik WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('licznik', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER licznik_icloud_u AFTER UPDATE OF id, czesc_id, nazwa, rodzaj, znaczenie, dlugosc_powtorzenia, zablokowany, kolejnosc, zmieniono_ms, usunieto_ms ON licznik WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('licznik', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER licznik_icloud_d AFTER DELETE ON licznik WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('licznik', OLD.id, 1, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER zdarzenie_icloud_i AFTER INSERT ON zdarzenie WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('zdarzenie', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER zdarzenie_icloud_u AFTER UPDATE ON zdarzenie WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('zdarzenie', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER zdarzenie_icloud_d AFTER DELETE ON zdarzenie WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('zdarzenie', OLD.id, 1, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER notatka_rzedu_icloud_i AFTER INSERT ON notatka_rzedu WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('notatka_rzedu', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER notatka_rzedu_icloud_u AFTER UPDATE ON notatka_rzedu WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('notatka_rzedu', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER notatka_rzedu_icloud_d AFTER DELETE ON notatka_rzedu WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('notatka_rzedu', OLD.id, 1, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER przypomnienie_icloud_i AFTER INSERT ON przypomnienie WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('przypomnienie', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER przypomnienie_icloud_u AFTER UPDATE ON przypomnienie WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('przypomnienie', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER przypomnienie_icloud_d AFTER DELETE ON przypomnienie WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('przypomnienie', OLD.id, 1, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER sesja_icloud_i AFTER INSERT ON sesja WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('sesja', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER sesja_icloud_u AFTER UPDATE ON sesja WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('sesja', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER sesja_icloud_d AFTER DELETE ON sesja WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('sesja', OLD.id, 1, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER wzor_icloud_i AFTER INSERT ON wzor WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('wzor', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER wzor_icloud_u AFTER UPDATE ON wzor WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('wzor', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER wzor_icloud_d AFTER DELETE ON wzor WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('wzor', OLD.id, 1, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER rysunek_icloud_i AFTER INSERT ON rysunek WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('rysunek', json_array(NEW.wzor_id, NEW.strona), 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER rysunek_icloud_u AFTER UPDATE ON rysunek WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('rysunek', json_array(NEW.wzor_id, NEW.strona), 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER rysunek_icloud_d AFTER DELETE ON rysunek WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('rysunek', json_array(OLD.wzor_id, OLD.strona), 1, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER wloczka_icloud_i AFTER INSERT ON wloczka WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('wloczka', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER wloczka_icloud_u AFTER UPDATE ON wloczka WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('wloczka', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER wloczka_icloud_d AFTER DELETE ON wloczka WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('wloczka', OLD.id, 1, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER narzedzie_icloud_i AFTER INSERT ON narzedzie WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('narzedzie', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER narzedzie_icloud_u AFTER UPDATE ON narzedzie WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('narzedzie', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER narzedzie_icloud_d AFTER DELETE ON narzedzie WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('narzedzie', OLD.id, 1, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER projekt_wloczka_icloud_i AFTER INSERT ON projekt_wloczka WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('projekt_wloczka', json_array(NEW.projekt_id, NEW.wloczka_id), 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER projekt_wloczka_icloud_u AFTER UPDATE ON projekt_wloczka WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('projekt_wloczka', json_array(NEW.projekt_id, NEW.wloczka_id), 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER projekt_wloczka_icloud_d AFTER DELETE ON projekt_wloczka WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('projekt_wloczka', json_array(OLD.projekt_id, OLD.wloczka_id), 1, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER zdjecie_icloud_i AFTER INSERT ON zdjecie WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('zdjecie', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER zdjecie_icloud_u AFTER UPDATE ON zdjecie WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('zdjecie', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER zdjecie_icloud_d AFTER DELETE ON zdjecie WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('zdjecie', OLD.id, 1, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER obliczenie_icloud_i AFTER INSERT ON obliczenie WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('obliczenie', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER obliczenie_icloud_u AFTER UPDATE ON obliczenie WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('obliczenie', NEW.id, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER obliczenie_icloud_d AFTER DELETE ON obliczenie WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('obliczenie', OLD.id, 1, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER dzien_limitu_icloud_i AFTER INSERT ON dzien_limitu WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('dzien_limitu', NEW.dzien, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER dzien_limitu_icloud_u AFTER UPDATE ON dzien_limitu WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('dzien_limitu', NEW.dzien, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER dzien_limitu_icloud_d AFTER DELETE ON dzien_limitu WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('dzien_limitu', OLD.dzien, 1, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER ustawienie_icloud_i AFTER INSERT ON ustawienie WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) AND NEW.klucz IN ('okno_uczciwe_zasady_widziane') BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('ustawienie', NEW.klucz, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER ustawienie_icloud_u AFTER UPDATE ON ustawienie WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) AND NEW.klucz IN ('okno_uczciwe_zasady_widziane') BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('ustawienie', NEW.klucz, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;
CREATE TRIGGER ustawienie_icloud_d AFTER DELETE ON ustawienie WHEN (SELECT wlaczona = 1 AND wejscie = 0 FROM synchronizacja WHERE id = 1) AND OLD.klucz IN ('okno_uczciwe_zasady_widziane') BEGIN UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1; INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES ('ustawienie', OLD.klucz, 1, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1)) ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = excluded.usuniete, nr = excluded.nr; END;

PRAGMA application_id = 1331919467;                   -- 0x4F637A6B, ASCII „Oczk” (dane.md „Identyfikator pliku bazy”, P-124 Q5a)
