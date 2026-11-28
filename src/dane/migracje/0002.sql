-- Oczko · migracja 2 (1.0.2): krok licznika, ZM-24 (ADR-0036 K1, P-1097). Zwykła migracja w transakcji (ADD COLUMN, bez przebudowy tabeli).
-- `krok` jest lokalny (icloud-tabele.json: licznik.pomin); wyzwalacz licznik_icloud_u ma jawną listę kolumn bez `krok`. Istniejące liczniki dostają 1.
ALTER TABLE licznik ADD COLUMN krok INTEGER NOT NULL DEFAULT 1 CHECK (krok IN (1, 2));
