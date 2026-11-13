# Przebieg na koncie właściciela: lokalizacje IAP przez model wersji v2 (KO-056)

Stan: przygotowane 2026-11-13 (sesja BG). **Niczego nie uruchomiono w App Store Connect** (brak kluczy w tej sesji, zakaz wyzwalania workflowów). Atrapa serwera w testach odzwierciedla odczytaną dokumentację Apple, nie prawdziwy serwer; poniższy przebieg jest pierwszym sprawdzeniem na żywo.
Warunek: scalenie gałęzi do `main` (workflow_dispatch działa tylko z plikiem na gałęzi domyślnej, P-319) i Twoje Approve środowiska `release`. Wszystko poza tym robi workflow.

## Kroki (każdy osobno; Ty tylko zatwierdzasz i wklejasz wynik)
1. **Dry-run:** Actions → „ASC lokalizacje produktów zakupu” → Run workflow → `tryb: dry-run` → Approve `release`. Workflow tylko czyta (GET). W podsumowaniu joba szukaj dla każdego z 4 obiektów (grupa, `oczko.pro.monthly`, `oczko.pro.yearly`, `oczko.pro.lifetime`) wiersza `(wersja N, STAN; istniejących lokalizacji: K)`.
2. **Co oznacza wynik dry-run:**
   - `K = 0` przy wersji ze stanem `APPROVED`/`PREPARE_FOR_SUBMISSION`, choć lokalizacje wpisano wcześniej przez v1: Apple nie pokazuje starych lokalizacji w wersji. Apply utworzy komplet w wersji roboczej (to bezpieczne, nic nie jest usuwane); wklej mi wynik, zapiszę to jako ustalenie.
   - `[wersja w recenzji: …]` i PROBLEM (kod 1): produkt ma wersję w recenzji, a teksty różnią się od pliku. Skrypt niczego nie zapisuje. Poczekaj na wynik recenzji albo wycofaj wysyłkę w App Store Connect, potem ponów.
   - Wiersz `[nowa wersja zostanie utworzona; …]`: apply założy wersję roboczą produktu (`POST …Versions`, stan `PREPARE_FOR_SUBMISSION`). Nie wysyła jej do recenzji.
   - Wszystkie wiersze `pomiń (bez zmian)` i kod 0: nic do zrobienia.
3. **Apply (dopiero po obejrzeniu dry-run):** ten sam workflow, `tryb: apply`, Approve. Zapis tworzy brakujące i aktualizuje różniące się lokalizacje w wersji roboczej; nigdy nie usuwa; lokalizacje spoza pliku kopiuje do nowej wersji.
4. **Drugi apply (dowód idempotencji):** uruchom `apply` jeszcze raz: oczekiwane `utwórz 0, zaktualizuj 0, nowe wersje 0`, kod 0.
5. **Wysyłka do recenzji:** poza zakresem skryptu i tej migracji. Zakupy i subskrypcje wysyłasz jak dotąd (App Store Connect, razem z wersją aplikacji); Apple wycofał też stare endpointy wysyłki (`*Submissions`), więc ewentualna automatyzacja wysyłki musi iść przez `reviewSubmissions` + `reviewSubmissionItems` z wersją produktu (osobne zadanie, nie ma go w repo).

## Ryzyka i nierozstrzygnięte (`[DO USTALENIA]`)
- Czy nowa wersja dziedziczy lokalizacje poprzedniej — dokumentacja nie mówi; skrypt działa w obu wariantach (odczyt lokalizacji nowej wersji przed planem), a log dry-run/apply pokaże, który zachodzi.
- Czy lokalizacje założone przez v1 są widoczne jako lokalizacje wersji — j.w.
- Termin usunięcia v1: dokumentacja Apple mówi „deprecated … remains available” bez daty; „od początku 2027” pochodzi tylko z e-maila Apple Developer Relations.
- Limity atrybutów (np. `customAppName`) bez zmian: założenie z nagłówka skryptu (≤ 30 znaków) potwierdzi pierwszy zapis.
