# CA — stan (rola 08 fix, BY-001…003) · 2026-11-15

Gałąź: `claude/ca-przeplywy-2026-11-15` (baza: integracja `claude/youthful-pasteur-kx83sn` @ 4aec04c9 + scalony raport BY ce23e72d, commit 1e410c9a). Polecenie: `docs/koordynacja/polecenia/CA.md` @ 0bf28b28 (gałąź `koordynacja`). Koordynator od 18:34Z: session_01T66VBxpmFSovs14qTQgShL (wcześniej …BCKM4WGbpXjC2Kdb).

| ID | Rodzaj | Commit | Test (czerwony → zielony) |
|---|---|---|---|
| BY-001 (P1, reszta po BW) | D | cdc659f4 | `tests/ekrany/wzor-dodaj-wyjscie-by001.test.tsx` 2 czerwone na 1e410c9a (liczba `router.back`), zielone; trwały `tests/jakosc/wyjscia-tras.test.ts` czerwony na a117ded0 (`app/wzor.tsx` gałąź 4), zielony teraz |
| BY-002 (P2) | D | 476abe53 | `tests/ekrany/czesc-nazwa-zapasowa-by002.test.tsx` + `tests/domena/nazwa-czesci.test.ts`: 7 z 8 czerwonych na atrapie bez zmiany zachowania (asercje wartości; pole części potwierdzone czerwone na oryginalnej trasie), zielone; test powtórzenia dopisany po poprawce (nie widziany czerwonym) |
| BY-003 (P2) | P→D (KO-067) | 4a170f06 | `tests/ekrany/dzis-kafel-dodaj-wzor.test.tsx` 2 nowe czerwone na 476abe53, zielone |
| recenzja (P1 fixture 007, P2 wyścig kafla) | D | 1012e9f5, 489f45f2 | test czerwony n=2 projekty → zielony; struktura: `licznik-stan.ts` (limit 20 KB) osobnym commitem |
| P3 z BY | — | 86558d1b | tylko wpis `docs/programista/ca-odlozone.md`; decyzje P-842…P-845 |

Decyzje: P-842 (BY-003, zmienia P-588 c), P-843 (BY-002), P-844 (BY-001), P-845 (odłożone). Nowych kluczy i18n nie dodano (BY-002 używa istniejącego `formularz.nazwa_czesc_n`).
Analogia `trening`: nie sprawdzano (repo poza zakresem dostępu tej sesji) — oznaczone w P-842 jako [DO USTALENIA].
Dowód verify: `docs/programista/ca-verify-dowod.md`; recenzja niezależna: `docs/programista/ca-recenzja.md`.
Verify: kod 0 (614 zestawów, 7475 testów), recenzja: 1×P1 + 1×P2 naprawione (`ca-recenzja.md`). Następny krok: push (hak pre-push = verify) → PRZEKAZANIE. Bez scalania do integracji ani `main`.
Otwarte dla koordynatora: hak Stop sesji żąda tożsamości „Claude <noreply@anthropic.com>” (commity „Unverified”), polecenie CA/P-507 każe „Łukasz Karwowski <336954459+…>” — zostawiono P-507, bez przepisywania historii.
