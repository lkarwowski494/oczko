# Poprawki po raporcie E2E #135, sesja A (rola 08, tryb fix; 2026-11-02)

Gałąź: `claude/kopia-poprawki-a-2026-11-02` (od `claude/kopia-integracja-2026-11-02` c649f78). Polecenie: `oczko-warsztat` 50ff573 `koordynacja/role-2026-11-01/08-poprawki-e2.md`, sekcja A. Zatwierdzone: E2E-A4 (P-358, opcja 1), P-353 (a)+(b). Na roboczą nie pushowano.

## Klasyfikacja i dowody
| ID | Rodzaj / realność | Test (czerwony przed → zielony po) | Commit |
|---|---|---|---|
| E2E-A4 | D, brzegowy (bramka) | `tests/adaptery/tryb-e2e-straznik.test.ts` (okno 2 s zamiast 6 s; poza E2E bez wpływu; podłączenie w `kontener.ts`), `tests/dane/straznik-okno-e2e.test.ts` (3 dodania co 2,5 s: seria `null` → seria 3 w widoku i historii), `tests/jakosc/e2e-okno-straznika.test.ts` (scenariusz 04: argument w `launchApp`, czekanie > okno przed serią, README) | 716f4c6 |
| P-353 (a) | D, realny (droga bez wyjścia: wybór pliku, który zawsze odpada) | `tests/adaptery/wybor-pliku-wzoru.test.ts` (selektor zawierał `application/msword` → tylko PDF i `.docx`) | cc69c72 |
| P-353 (b) | D, teoretyczny (martwa gałąź) | `tests/dane/wzor-dodaj.test.ts` (oryginał `.doc` zapisany jako `doc` → zawsze `docx`; dawny test gałęzi zastąpiony) | cc69c72 |

## Co się zmieniło
- **E2E-A4:** argument startu `oczkoE2eOknoStraznika=<s>` (0 < s ≤ 600; zła wartość albo build bez `EXPO_PUBLIC_E2E=1` → 2 s) czyta tylko `src/platforma/tryb-e2e.ts` (`oknoStraznikaS`); `kontener.ts` ustawia `Zaleznosci.straznikOknoS`, `widok-licznika.ts` (widok i historia) używa go zamiast `STRAZNIK_OKNO_S`. Domena i konfiguracja produktu bez zmian (okno 2 s ma dotychczasowe testy). Scenariusz 04: własny `launchApp` z argumentem (podprzepływ `start-czysty` nie zna argumentu; reszta kroków jak w nim) i odstęp 6,5 s przed serią.
- **Dlaczego odstęp:** seria to ciąg dodań z przerwami ≤ okno (`straznik-tempa.ts:20`); przy oknie 6 s dwa wcześniejsze `+1` (przerwa ≈ 2,2 s + kroki) mogłyby wejść do ciągu i baner dałby „Added 5 rows”, nie 3. Wolne maszyny tylko wydłużają przerwy, więc odstęp jest odporny na prędkość.
- **P-353:** `wybierzPlikWzoru` bez `application/msword`; `dodajWzor` zapisuje oryginał Worda jako `docx` (gałąź `.doc` usunięta). Ponowne wyszukanie `msword`/`.doc` w `src`, `app`, `modules`, `targets`, `scripts`: brak innych trafień (komentarz w `rodzaj-pliku.ts:15` opisuje obecną regułę). Dane: `.doc` nie był osiągalny, więc w bazie nie ma wierszy `rozszerzenie = 'doc'`; brak migracji.
- `e2e/README.md`: wiersz `oczkoE2eOknoStraznika` w tabeli argumentów startu. `docs/jakosc/e4/tabela-08.md` zregenerowana (248 plików testów, commit osobno).

## Wynik bramki
`env -u NODE_PATH npm run verify` na tabeli 08 po regeneracji: **kod 0 — 315 zestawów, 3147 testów** (baza c649f78: 311 / 3125; +4 zestawy, +22 testy). Typecheck, typecheck:testy, lint, kontrole repo: zielone.

## Nie sprawdzone tutaj (czeka na przebieg macOS po scaleniu)
- Czy Maestro na iOS przekazuje `oczkoE2eOknoStraznika` jak pozostałe argumenty (`Settings.get`, README: „potwierdza pierwszy przebieg” — ten sam mechanizm co `oczkoE2eTeraz`).
- Scenariusz 04 na symulatorze: baner „Added 3 rows in … Undo?” przy oknie 6 s. Brak ponowienia przy czerwonym (P-091 10a).
- Bundel wydania bez śladów: nowy napis `oczkoE2eOknoStraznika` podlega wzorcowi `oczkoE2e` w `scripts/wydanie/slady-testowe.mjs` (kontrola w `kontrola-ipa.sh`); tak jak pozostałe klucze, literał stoi w funkcji `oknoStraznikaS` — sprawdzenie na prawdziwym IPA.

## Uwagi
- Ścieżki wrażliwe (migracje, kopie, import, workflowy, zakupy) nietknięte, więc przegląd subagentem nie dotyczy.
- Do przeglądu 07: scenariusz 04 nie używa już `subflows/start-czysty.yaml` (kopia 4 kroków); jeśli start-czysty się zmieni, trzeba zmienić też 04.
