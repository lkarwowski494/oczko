# KD1 — rola 10 build: kody ofert „rok Oczko Pro za darmo” — źródła Apple i kroki właściciela (2026-11-27)

Koordynator: session_01BM51ocmU7QhJeCxywemjAn (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 3 USD (STOP 3,9). Decyzja: KO-219. Pula P: **P-1071…P-1073**. Kontekst: od 30% kończysz krok, stan w `docs/wydanie/kody-ofert.md`, push, PRZEKAZANIE.

## Rola
10-wydanie, tryb build. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 10-wydanie --tryb build --plik <scratchpad>/10-build.md`; przeczytaj w całości. Analogia (P-315): `add_repo` lkarwowski494/trening (odczyt) — czy Trening miał kody ofert / promo kody i jak (`repo:plik:linia`).

## Start
Gałąź `claude/kd1-kody-ofert-2026-11-27` od **ad045028** (`origin/claude/youthful-pasteur-kx83sn`). `npm ci`.

## Decyzja właściciela (wejście, nie do zmiany)
27.11 ok. 09:21 UTC (dosłownie): „Na razie rozdaje rok za darmo nie 3 miesiace. Rok to tyle ile sprawi ze warto zainstalowac. Dopoki nie rozbujamy aplikacji i tak na niej nie zarabiamy a nikt jej nie pobiera. Wiec albo rozdamy za darmo zdobedziemy popularnosc albo ona nie ruszy nigdy.” Wcześniej (P-1031, 24.11): publiczny kod we wpisach w grupach, osobny na język, wybór „Bez auto-odnowienia”. Produkty: Oczko Pro Lifetime (nie-konsumpcyjny), grupa subskrypcji Oczko Pro (monthly, yearly). Szkic wpisu z kodem: wariant K w `docs/wzrost/szkice-facebook.md` (gałąź WZ1).

## Zadania
1. **Źródła Apple w dniu pracy** (strony developer.apple.com / App Store Connect Help, cytat + data; zasada „przeczytanego źródła”, cytat sprawdzony na surowym tekście): (a) offer codes dla subskrypcji — czy jest bezpłatny okres 1 rok, czy po nim subskrypcja odnawia się automatycznie (czy da się tego uniknąć), kody własne (custom) vs jednorazowe, limity liczby i ważności, wymagania wobec aplikacji (realizacja kodu w aplikacji / link `apps.apple.com/redeem`); (b) czy offer codes obejmują zakupy nie-konsumpcyjne (Lifetime) — jeśli tak, to „za darmo na zawsze”, nie „na rok”; (c) promo codes (stare kody promocyjne) — czy nadal istnieją i limity.
2. **Kod aplikacji (tylko odczyt):** czy Oczko obsługuje realizację kodu (np. `presentOfferCodeRedeemSheet`, Transaction.updates) i czy uprawnienie z oferty jest rozpoznawane (`src/`, `modules/` — tylko czytasz). Brak obsługi = znalezisko z oceną (realny/brzegowy), bez zmian kodu.
3. `docs/wydanie/kody-ofert.md`: opcje (≥ 2, np. A: kod na roczną subskrypcję z rokiem za darmo i jasną informacją o odnowieniu; B: kod na Lifetime; C: inne), dla każdej: co dostaje użytkownik, co się dzieje po roku, zgodność z „nic się samo nie pobierze” (P-1031), ryzyko, limity; **rekomendacja**; kroki właściciela w App Store Connect krok po kroku (z nazwami pól z dokumentacji, czas [OCENA]); zdanie do wpisu zgodne z prawdą dla rekomendowanej opcji (pl, en). Decyzje P-1071…P-1073 w `docs/decyzje.md` (odnośnik KO-219). verify kod 0 → `docs/jakosc/kd1-verify.txt` (podsumowanie i kod). Commit, push.

## Zakazy
Bez wywołań App Store Connect API i dispatchu workflowów, bez tworzenia kodów, bez zmian `app/`, `src/`, `modules/`, `targets/`, workflowów; nie scalasz do integracji ani `main`; nigdy `--no-verify` ani force-push; nie tworzysz/archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507); przed pushem `git log --format='%h %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' ad045028..HEAD` bez trailerów. GitHub tylko przez MCP.

## Raport (≤ 10 linii, send_message)
PRZEKAZANIE: SHA, opcje z rekomendacją (1 zdanie każda), kluczowe cytaty Apple z datą, obsługa kodu w aplikacji, kroki właściciela (czas), P-, koszt.
