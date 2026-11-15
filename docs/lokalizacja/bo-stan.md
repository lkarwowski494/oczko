# BO — stan (podpisy zrzutów przez API, rola 09 build) · 2026-11-15

Gałąź: `claude/bo-podpisy-api-2026-11-15` (od 761b9551). Zadania 1–2 zrobione (testy czerwone fb1c4fb, kod i workflow 6a0523a; verify kod 0: `docs/lokalizacja/bo-verify.txt`).

- Moduł: `scripts/i18n/przeklad-podpisy.mjs` (przekład → krytyk, `--szacuj`, `--etap`, `--tylko`, `przyjmij --raport <katalog>`); workflow: tryb `podpisy` w `przeklad-tlumaczen.yml`.
- Szacunek lokalny (przybliżenie, Opus 5.5 high, 27 języków × 2 etapy): ≈ 1,90 USD; limit 30 USD. Założenie myślenia (1500 tokenów × mnożnik) do sprawdzenia próbą `limit=2`.
- Decyzje do weta: P-808 (przekład+krytyk, przyjęcie tylko po krytyku), P-809 (twarde kontrole). P-810 wolne.
- Zadania 3–4: koordynator wyzwala workflow (`tylko_szacuj=true`, potem płatny) z tej gałęzi i podaje run ID; potem pobrać artefakt `raport-podpisy`, przejrzeć jako tłumacz, `node scripts/i18n/przeklad-podpisy.mjs przyjmij --raport <katalog>`, testy, commit.
