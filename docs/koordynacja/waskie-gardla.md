# Wąskie gardła (WG) — Oczko

| WG | Objaw | Pomiar | Przyczyna | Działanie | Ryzyko | Stan |
|---|---|---|---|---|---|---|
| WG-01 | Pełny przebieg „Jakość · iOS” `[e2e-pelny] [e2e-ciemny]` ~110–120 min na kandydata | 9–10.11: przebiegi 6, 7, 8 (np. run 42732022664 00:55→02:48) | e2e iPhone cz. 1–3 ~80 min po buildzie ~25 min | do analizy (07): podział na więcej części / cache — przy tym samym zestawie kontroli | bez zmian kontroli | otwarte, 10.11 |
| WG-02 | Runda diagnozy bez danych | 1×: runda 1 ramek 024 (instrumentacja zamykała aplikację) ~1 h | instrumentacja bez testu obrotu | test przed instrumentacją (zrobione c26cccc) | bez zmian | obserwacja |
| WG-03 | `add_repo` prompts/oczko odrzucany przez klasyfikator w sesjach podrzędnych | 2× (M1 10.11 03:03; inny koordynator 00:16) | polityka auto mode | wyjątek: prompty z warsztatu; prośba do właściciela | brak | czeka na właściciela; 10.11 05:11 add_repo prompts przyjęte w sesji koordynatora M9 (nie dotyczy sesji podrzędnych — obserwuj) |
| WG-04 | sesja podrzędna nie może dodać repo z prawem zapisu (add_repo odrzucone w trybie auto) | 1 raz, ok. 3 min, sesja B 10.11 05:44 (apps4brew-www); pokrewne WG-03 (prompts) | zgoda właściciela jest tylko w rozmowie koordynatora | zadania wymagające innego repo z zapisem: subagent koordynatora albo repo jako `source_url` sesji; bez zmiany kontroli | bez zmian kontroli | otwarte, 10.11 |
