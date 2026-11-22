# Poprawki z aneksu 04, sesja E (rola 08, tryb fix; 2026-11-02)

Gałąź: `claude/kopia-poprawki-e-2026-11-02` (baza `claude/kopia-integracja-2026-11-02` c649f78 + merge roboczej `origin/claude/jolly-thompson-paz6d8` 40f810f, same docs: d7fa571). Polecenie: `oczko-warsztat` 97e37c5 `koordynacja/role-2026-11-01/08-poprawki-04.md`, sekcja E. Na roboczą nie pushowano. Menu licznika (sesja B) nietknięte.

## Stan (2 z 3 ID)
| ID | Rodzaj | Test (czerwony → zielony) | Commit | Wynik |
|---|---|---|---|---|
| 04-studio-projektowe-008 (P1) | D | `tests/ekrany/przycisk-glowny-obrys.test.tsx`: 10 z 13 czerwonych (brak `borderWidth`/`borderColor`) → 13 zielonych, oba motywy | 17d9a3d | zrobione |
| 04-studio-projektowe-012 (P2) | D | `tests/ekrany/projekt-naglowek-zdjec.test.tsx`: 2 z 2 czerwone (`fontWeight` "700" wobec braku) → zielone, oba motywy | 9345e3c | zrobione |
| Wiersz „czeka na sieć” w liście wzorów ▾ (aneks partii 8, poz. 12 C; P-353 (d)) | D | — | — | **nie zaczęte** (następna sesja) |

`env -u NODE_PATH npm run verify` kod 0 po każdym commicie: po 008 312 zestawów / 3138 testów, po 012 313 zestawów / 3140 testów (baza koordynatora 311 / 3125). `tabela-08.md` regenerowana. Zrzuty przed/po: niewykonane (Linux bez symulatora); dowód wizualny to asercje stylu na prawdziwych tokenach i próbka krawędzi u 07 w E2E („+1 row”, „Keep counting”, „Continue with Yearly” = `#8C9098`, 2 pt).

## 008: co zmieniono
Obrys `borderWidth: 2` w `przyciskObrys` w każdym miejscu z tłem `przyciskTlo` (jasny: obrys = tło, bez widocznej zmiany; ciemny `#8C9098`, 4,36:1 do arkusza wg `kontrast-aneks8.txt`): `Arkusz.tsx` `glowny` (Keep counting, Continue with Yearly, Save a copy of my data), `LicznikStyl.ts` `plus`, `WzorPrzegladarka.tsx` `plus`, `Stoper.tsx` `kapsula` (pauza zachowuje obrys drugiego przycisku), `HistoriaDni.tsx` wybrany dzień (spec: „wybrany dzień = przycisk główny”). Przycisk nieaktywny bez zmian (R1: obrys = tło nieaktywne). Etykieta przycisku głównego arkusza: `typografia.przyciskPelny` (Libre Franklin 700, rozmiar z tokenu `tresc` = 17 pt) zamiast 28 pt (`motyw.ts`; bez nowego tokenu w `tokeny.json`). Wyszukanie po poprawce: `grep przyciskTlo src app` → 5 trafień, wszystkie z obrysem.

## Nowe znaleziska (nienaprawione; do decyzji koordynatora / 04)
1. **Etykieta „Delete all data” (`niszczacy`) nadal 28 pt** (`Arkusz.tsx` `niszczacyTekst`), a wzorzec `fix8-2026-10-27/fix8.html:186` ma 17 pt — ten sam mechanizm co 008, 04 go nie wymienił. Brzegowe (jeden przycisk, jeden ekran). Poprawka: `typografia.przyciskPelny`, jedna linia plus test.
2. **Kapsuła stopera: etykieta 28 pt** (`Stoper.tsx` `kapsulaTekst`), design-spec (linia 528) mówi „Libre Franklin 700 17 pt”. Realność: do potwierdzenia zrzutem 04.
3. **012: różnica koloru z zrzutu 04 nie odtwarza się w kodzie**: oba nagłówki mają `olowek`; różniła się tylko waga. Jeśli na zrzucie „Photos” nadal jest jaśniejszy, przyczyna jest poza stylem (np. pogrubienie wygląda jaśniej na ciemnym tle) — do ponownego zrzutu.
4. Nagłówki sekcji ekranu projektu mają `podpis` 15 pt; wzorzec `.naglowek-grupy` 13 pt (`partia8.html:75`). Dotyczy wszystkich nagłówków, nie tylko „Photos”; 04 uznał ich za zgodne. Do wyjaśnienia z 04, nie ruszano.
5. Promień przycisku głównego arkusza w kodzie `promien.przyciskGlowny` = 20, wzorzec `.przycisk-pelny` ma 14 (`partia8.html:70`) — nie zbadane, do 04.

## Następny krok: wiersz „czeka na sieć” w liście wzorów ▾
Decyzja 04: wariant C (`design-spec.md:936`, makieta `aneks8.html` stan `wzor-przelacznik-czeka`, wzorce `wzorce-zrzuty/aneks8-wzor-przelacznik-czeka-*`): w liście wzorów (▾ `wzor.przelacz_naglowek`) wiersz „Web page — Waiting for the internet to save the web page.” z ✕ (`wzor.czeka_siec`, `wzor.usun_oczekujacy_a11y`; bez nowych kluczy); ▾ widoczne także przy jednym wzorze, gdy coś czeka; po powrocie sieci wiersz zamienia się we wzór bez ogłoszenia. Punkty wejścia: `src/ekrany/WzorPrzegladarka.tsx:114` (`s.wzory.length >= 2` decyduje o ▾; menu `ustawMenu('wzory')`), istniejący wiersz oczekującego w `src/ekrany/WzorGrupa.tsx:46-49` (`o.stan === 'siec'`, testID `wzor-czeka-siec`), model w `src/kompozycja/wzor.ts` / `StanPrzegladarki` (dodać listę oczekujących). Test przed kodem w `tests/ekrany/wzor-przegladarka.test.tsx`: jeden wzór + oczekujący → ▾ jest, wiersz z ✕ jest, ✕ usuwa oczekującego (ten sam przypadek użycia co w WzorGrupa).
