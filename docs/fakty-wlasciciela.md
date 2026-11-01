# Fakty o właścicielu i jego środowisku

Czytany na starcie każdej sesji (hak `SessionStart` w `.claude/settings.json`, jak w Treningu). Zanim zapytasz właściciela o fakt albo o potwierdzenie, sprawdź ten plik i repo `lkarwowski494/trening` (P-315); w pytaniu podaj, gdzie szukałeś. Repo publiczne: bez danych osobowych — tylko fakty potrzebne do pracy, każdy ze źródłem.

| Fakt | Źródło |
|---|---|
| Ma iPhone'a i Apple Watch; testuje na obu | Trening `docs/fakty-wlasciciela.md` (build 1030 23.10, build 1033 29.10.2026); P-316 |
| Ma iPada, nie ma Apple Pencil | P-226, 26.10.2026 |
| Na urządzeniu testuje tylko to, co zmieniło się od jego ostatniego testu (lista zawężona z dowodem) | Trening `docs/fakty-wlasciciela.md`, 29.10.2026 |
| W App Store Connect ma rolę Account Holder; konto wspólne z Treningiem | Trening `docs/48-zgloszenie-1-0.md` Z-11, Z-22 |
| Umowa Paid Apps aktywna, bank i podatki bez braków (konto, nie aplikacja) | Trening `docs/18-przekazanie.md:589`, 26.10.2026; P-316 |
| Klucz API App Store Connect zespołu istnieje (sekrety `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8` w Treningu, środowisko `release`) | Trening `.github/workflows/testflight.yml`; P-316 |
| Strefa czasowa: Polska (od 25.10.2026 UTC+1); godziny dla właściciela z `TZ=Europe/Warsaw date`, nie z pamięci | Trening `docs/fakty-wlasciciela.md` |
| Maszyny macOS w GitHub Actions zwykle brak ok. 14:00–23:00 UTC | P-187, P-307; Trening `docs/fakty-wlasciciela.md` |
| Nie jest ekspertem dziedzinowym; rozstrzyga sprawy produktowe, nie merytoryczne | CLAUDE.md, zasada wspólna 1 |
| Decyzje podejmuje koordynator (P-087); u właściciela: koszty, jego konta, scalenie do `main`, wysyłka do Apple | CLAUDE.md, P-087 |
