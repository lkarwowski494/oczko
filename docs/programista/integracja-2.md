# Integracja 2 (rola 08, tryb fix; 2026-11-02): scalenie kopii partii 8, 07 i 10

Gałąź: `claude/kopia-integracja-2026-11-02` (od roboczej 967fa11, tylko lokalnie do decyzji koordynatora). Polecenie: `oczko-warsztat` c9ea3b7 `koordynacja/role-2026-11-01/08-integracja-2.md`. Zatwierdzone: P-344, P-350, P-353. Na roboczą nie pushowano.

## Scalenia (`--no-ff`)
| Kopia | Merge | Konflikty i rozwiązanie |
|---|---|---|
| 8d (ff5adec, zawiera 8a+8b+8c) | d1b2d87 | `src/kompozycja/projekt.ts` — suma: wiersz `wloczka` (07-jakosc-001, 8) + `count` w `probka` (09, P-307); `en.kontekst.json` — suma kluczy; `en-XA.json` — regeneracja `npm run i18n:pseudo`; `tabela-08.md` — regeneracja. W `tests/` brak różnic względem rodziców (`git show --cc` pusty). |
| 8e (bc4ab44) | 7629da4 | tylko `tabela-08.md` (regeneracja); `scripts/natywne/kopie.json` scalił się sam (poprawny JSON). |
| 07 (9009f25) | a8dc0a8 | `docs/decyzje.md`, `docs/plan-prac.md`, `docs/przekazanie-koordynatora.md` — kopia niosła starszy stan dokumentów koordynatora; w spornych hunkach zostaje robocza (nowsza); diff do roboczej w tych trzech plikach pusty. |
| 10 (1bbf5ab) | 47fb6af | bez konfliktów. |

## Poprawka integracyjna (180e3dc)
Konflikt semantyczny bez konfliktu tekstowego: 09 przerobił `limit.arkusz_dni` na `_one/_other` (forma wg `count`), a `app/formularz/[rodzaj].tsx:120` (8b) wołał klucz bez `count` → arkusz pokazywał surowy klucz. Dopisane `count`. Test 024/S5 (`tests/ekrany/wpisanie-trasa.test.tsx:38`) miał stary literał „free knitting days”; en mówi „crafting days” od dc8e2fb (P-302/P-304 f) — zmieniony literał, asercja zostaje. Skan wszystkich `t('klucz')` dla kluczy liczby mnogiej bez `count`: 1 trafienie (to).

## Wynik bramki (po 180e3dc)
- `typecheck`, `typecheck:testy`, `lint`, kontrole repo (ADR, granice, BRD, tabela-08, schemat): zielone.
- `npm test`: 310 zestawów, 3113 testów; **1 czerwony**: `tests/i18n/konfiguracja.test.ts` (skrypt pseudolokalizacji kończy kodem 1 z powodu poniższego).
- `npm run i18n` (ostatni krok `jakosc:kontrole`): **kod 1, 2370 błędów** = partia 8 dodała do `en.json` klucze, których nie ma w 34 przetłumaczonych słownikach: 73 bazy kluczy „brak tłumaczenia” × 34 języki + `dane.zastapiono` (en: `{{kopia}}`, tłumaczenia: `{{nazwa}}`,`{{miejsce}}` → w tych językach ekran „Data replaced” pokazałby niewypełnione `{{…}}`). Kopie 8a–8e przechodziły, bo ich baza nie miała jeszcze słowników 09. Rozkład: ustawienia 13, wzor 11, przyp 9, licznik 9, oferty 6, historia 5, projekty 4, projekt 4, formularz 4, ukonczenie 3, dane 3, import 2, stan_danych 1. Lista kluczy: `npm run -s i18n | grep '^BŁĄD pl '`.
- Awaria w runtime: brak klucza → tekst z en (`src/i18n/i18n.ts:56-58`, łańcuch język → źródło); wyjątek `dane.zastapiono` (stare parametry).

## STOP do koordynatora (verify nie jest kodem 0, push wstrzymany)
Plan zakłada falę przekładu dopiero po audycie (P-320, `plan-prac.md` 3.11), a bramka i18n tego nie przewiduje. Opcje w wiadomości do koordynatora. Do czasu decyzji: kroki 4a–c nie rozpoczęte.

## Następny krok
Po decyzji: (1) wdrożyć wybraną opcję, (2) `env -u NODE_PATH npm run verify` kod 0, (3) push kopii, (4) poprawki 4a (P-353 a+b), 4b (P-350), 4c (P-351) — każda test czerwony → zielony, osobny commit.
