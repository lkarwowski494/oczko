# Dane atlasu technik — format 1 (kontrakt 1.1), po weryfikacji E3

Kopia z repo treści roli 06 (P-212; przejście na format 1 po werdyktach E3, P-214, 2026-10-26). Źródłem prawdy jest repo treści; pliki nadpisuje rola 06 po każdej zmianie. *Dlaczego kopia:* rola 05 i 08 testują silnik rysunków i ekran atlasu na prawdziwych kartach.

| Plik | Zawartość |
|---|---|
| `atlas.json` | manifest: `format`, `wersja`, lista kart z bajtami i sha256 |
| `karty/<id>.json` | 87 kart według `docs/atlas/kontrakt-krokow.md` 1.1: 33 pozycje MVP poza skrótami (5 tabel, 28 kart — M1 i warkocz rozdzielone na dwie karty, Z-06-04), 51 haseł skrótu z wierszy tabel, 3 nabierania `po-generatorze` |
| `teksty/en.json` | teksty en-US pod kluczami `atlas.<id>.<pole>` (baza) |
| `teksty/en-GB.json` | tylko klucze różne w konwencji UK: nazwy oczek szydełkowych, także w `opis_alt` |
| `dodatki-06.json` | ID twierdzeń przypisane do każdego kroku i uwagi 06 do kontraktu (pytania Q-1.1-1…3) — pomoc dla 05, nie czyta tego aplikacja |

- **Status: treść zweryfikowana (E3)**; brzmienie do przeglądu przez 04 (P-212 Q2a). Języki gotowe: en-US, en-GB przy szydełku; sv — terminy w rejestrze, teksty po 09.
- **Terminy w językach bez słownika producenta (NZ-P222-06, P-222, P-223, P-232, 2026-10-26):** `terminy` kart mają też języki fali 1 (ru, uk, ja, ko, zh-Hant, tr, pt-BR, es-419) i fali 2 (ro, bg, el, hr, sr, sk, sl, lt, lv, ms, id; vi bez potwierdzonych) — tylko terminy potwierdzone (szydełko tylko z dowodem ruchu); `jezyki_gotowe` bez zmian, bo teksty robi 09. Karty szydełkowe es-419 zostają ukryte (konwencja mieszana, P-213).
- Walidator: `node --experimental-strip-types --no-warnings scripts/atlas/waliduj.mjs docs/atlas/dane/karty` → 79 uwag: 75 po stronie silnika (operacje i fazy jeszcze nierysowane: 39; przeplot i budowa w p2tog i s2kp2: 36) i 4 z pytań do 05 (Q-1.1-1 ściegi: 3, Q-1.1-3 kółko: 1); lista w `docs/atlas/stan.md`.
- ID twierdzeń (`ATL-*`, `TRM-*`) wskazują rejestr roli 06, który zostaje prywatny (P-108 (3)). Cytatów i nazw źródeł tu nie ma poza linią źródła przy tabelach (`atlas.tabela.linia_standardu` i `…linia_zrodla`, P-112 (1)).
