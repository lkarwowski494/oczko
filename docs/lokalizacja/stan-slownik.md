# Stan: słownik terminów × 35 języków (rola 09, P-271, P-272)
Aktualizacja: 2026-10-27 · sesja session_01T66VByqAL8puHu6nZh23xw · kopia `claude/kopia-09` · **etap zakończony, raport u koordynatora**

## Co i po co
Słownik terminów dziewiarskich i szydełkowych przed przekładem interfejsu (lekcja L-030 repo `trening`: przekład zdanie po zdaniu bez słownika dał kalki w 33 językach). Nie zależy od tekstów UI, które zmieni audyt 04 (P-272). Kluczy `src/i18n` nie zmieniano. Praca agenta, bez płatnych API.

## Pliki
- `docs/lokalizacja/slownik-terminow.json` — jedno źródło: 44 pojęcia × 35 języków (termin zalecany, warianty, skrót, zakazane z powodem, pewność, źródła z cytatem). Źródła tylko jako ID; tytuły, adresy i kopie surowych tekstów w `oczko-warsztat/09-lokalizacja/2026-10-27-slownik/` (koordynator 2026-10-27, bramka marek P-121 (5)); nazwy producentów w cytatach i uwagach zastąpione „[nazwa]”.
- `docs/lokalizacja/slownik-terminow.md` — generowany: `node docs/lokalizacja/narzedzia/slownik.mjs --md`.
- `docs/lokalizacja/narzedzia/slownik.mjs` — kontrola (kompletność, źródła, cytat przy pewności „wysoka”, wzorce, termin a własny zakaz, trafienie wzorca w en) i strażnik `--slowniki <katalog>` (termin zakazany w przekładzie tekstu, którego en zawiera pojęcie; wyjątki w `slownik-wyjatki.json`, gdy powstanie).

## Wynik (dowód)
- `node docs/lokalizacja/narzedzia/slownik.mjs --md` → `błędy: 0, uwagi: 0; pojęć: 44, języków: 35` (kod 0); `node scripts/jakosc/marki.mjs` → naruszeń 0.
- 1540 wpisów: wysoka 704, średnia 392, niska 444 (wszystkie niskie z `[DO SPRAWDZENIA]`). 126 źródeł; cytaty sprawdzone skryptem jako dosłowne fragmenty zapisanych kopii (raporty grup).
- Najsłabsze języki (niska): hu 41/44, vi 33, lv 27, id 24, ms 24, el 20, sr 19, tr 17, pt-BR 16 — bez źródła szczebla ≤ 3 albo z zablokowanymi stronami. Bez żadnego wpisu „wysoka”: bg, el, sr, vi.
- Pojęcia słabe we wszystkich językach: zapas (stash), kategoria grubości i włóczka lace (nazwy CYC), licznik, znacznik rzędu w aplikacji, masa motka, blokowanie.

## Ustalenia ważne dla przekładu (z cytatami w pliku)
- Wzór-instrukcja ≠ wzór-splot: de Anleitung (nie Muster), ru описание (nie узор), uk опис, lt aprašymas, et juhend, pt-BR receita, tr tarif (model = splot).
- Pułapka US/UK szydełka istnieje praktycznie tylko w en: w większości języków nazwy idą od wysokości/liczby narzutów (zgodnie z US); źródła w konwencji UK: cs (glosariusz sklepu), ms (słownik DBP). Fałszywi przyjaciele: nl „halve vaste”, tr „yarım sık ilmek”, ro „semipicioruș”, uk „півстовпчик” = slip stitch; da/nb „kæde-/kjedemaske” = slip stitch.
- Rząd: it „ferro” = też drut, nl „naald” = też drut (zalecane „rij”), es „vuelta” = rząd i okrążenie, nl „toer” = okrążenie.
- Gęstość i próbka jednym słowem: de Maschenprobe, ja ゲージ, es muestra, it campione, fr échantillon.

## Decyzje dla koordynatora (P-087)
- **D1 „robótka” (knitting day, Keep knitting) w 17 językach bez słowa wspólnego** (de, nl, da, nb, sv, fi, cs, sk, sl, hr, sr, et, lv, lt, hu, es, vi): (a) para „druty i szydełko”, jak w słowniku teraz — wierne, ale długie; (b) samo słowo drutowe, jak źródło en — krótkie, wyklucza szydełkujących; (c) słowo szersze (de Handarbeit) — obejmuje też szycie. Rekomendacja: (a) w nazwach i opisach, (b) dopuszczalne w etykietach ≤ 12 znaków jako wyjątek z wpisem; brzmienie zatwierdza 04 w audycie.
- **D2 it „ferro” vs „riga”** (rząd w liczniku wspólnym dla obu rzemiosł): rekomendacja „riga” (ferro = też drut); słownik ma teraz „ferro” ze źródła.
- **D3 nazwy kategorii grubości CYC — ROZSTRZYGNIĘTE 2026-10-30 (P-298, wariant c, rola 06):** numer 0–7 zawsze; nazwa lokalna tylko ze źródła szczebla ≤ 3 — es, es-419, fr (tabele CYC, sekcja `kategorie_cyc` w słowniku); pozostałe języki: numer + nazwa en. Wyjątek nazwany: es kategoria 0 = „Lace” (CYC-ES: „Liston”, niepewne znaczenie, do przeglądu rodzimego). Wpływ na klucze: 08 i 09.
- **D4 pl — ROZSTRZYGNIĘTE 2026-10-30 (rola 06, hierarchia źródeł, TRE-05):** bind off = „zakańczanie” (warianty „zamykanie”, „oczka zamykające”); ujmowanie = „odejmowanie” (symetria z „dodawanie”, tie-break nazwany; 4 inne nazwy jako warianty); sc = „półsłupek zwykły” („oczko ścisłe” wieloznaczne nawet w jednym źródle). Szczegóły w uwagach pojęć i w `oczko-warsztat/06-tresci/2026-10-30-fix-p281/`.

## Polecenia dla innych ról (nie wykonane tu, P-272)
- 07: strażnik w `tests/` uruchamiający `node docs/lokalizacja/narzedzia/slownik.mjs --slowniki src/i18n/slowniki` po każdej fali E3 oraz samą kontrolę (`… slownik.mjs`, kod 0) w `verify`.
- 09 E3: kontekst tłumacza = wpisy języka docelowego (zalecany, zakazane, uwaga) dla pojęć trafionych wzorcem `wykrywaj` w danym kluczu; drugi przegląd AI dostaje ten sam wycinek.
- Rodzimi recenzenci (kolejność z `jezyki.md`): lista „Do sprawdzenia” w `slownik-terminow.md`.

## Uwaga o historii gałęzi
Commit 163317f na `claude/kopia-09` ma autora `Claude` i zawiera tytuły i adresy źródeł (poprawka historii wymaga force-push — zablokowany, nie wykonano). Na gałąź roboczą idzie jeden nowy commit z poprawnym autorem i oczyszczoną treścią.
