# 0033. Pula kopii sprzed „Replace” i „Delete all data” ma budżet miejsca 2 GB na rodzaj: zawsze zostaje najnowsza i pierwsza kopia najstarszego dnia, pozostałe pierwsze kopie dni do budżetu; kopia o nieznanym rozmiarze nie jest usuwana (zastępuje ADR-0032 pkt 2)
Data: 2026-11-03 · Status: **przyjęta** (P-437, wybór (c), koordynator wg P-087, 2026-11-03; do weta) · Rola: 05 (fix p3b, M1-audytor-generalny-090, 05-architekt-508, 12-niezawodnosc-501) · Zastępuje: ADR-0032 pkt 2 i częściowo DEC-18 (odrzuconą tam opcję b „limit wieku i miejsca”); dodaje pkt 7 do całej reguły ADR-0032 · Pozostałe punkty ADR-0032 (1, 3, 4, 5, 6) bez zmian · Zależy od: ADR-0028, ADR-0032, ADR-0019, ADR-0004, ADR-0020 (6)

## Kontekst i problem
ADR-0032 pkt 2 chroni pierwszą kopię każdego dnia przez 30 dni i nie ogranicza przy tym miejsca. Przy „Replace” codziennie, np. przy przenoszeniu danych między iPhone'em i iPadem eksportem, gdy iCloud w 1.0 jest wyłączony (`ICLOUD_W_1_0`), pula dochodzi do 31 kopii na rodzaj po imporcie i 30 po kamieniu milowym. Przy trzech „Replace” dziennie jest to 34 i 31. Każda kopia to pełne archiwum `.oczko` w `Documents/Backup`, który wchodzi do kopii urządzenia (ADR-0028). ADR-0032 („Od czego zależy”) uzależnił regułę od pomiaru rozmiaru kopii. Ten ADR zapisuje pomiar i decyzję.

## Czynniki decyzji
- **Pomiar R (rozmiar jednej kopii przed „Replace”), 2026-11-03, rola 05.** Ścieżka kodu „Replace”, czyli `archiwum.kopiaPrzed('importem')`: `VACUUM INTO` i ZIP metodą 0 z plikami magazynu. Dane syntetyczne według profili E0 §3 (`docs/architektura/eksperymenty/e0/skala.mjs`, [OCENA]): identyfikatory UUID, pliki losowe o rozmiarach z E0 (PDF 3 MB, zdjęcie 0,6 MB, rysunek 40 KB). Narzędzie i wynik: `oczko-warsztat/audit/M1-2026-11-02/role/05-architekt/fix-2026-11-03-p3b/dowody/` (`pomiar-r.test.ts`, `pomiar-r.json`). To rachunek, nie fakt dziedzinowy.

  | Profil (E0 §3) | `VACUUM INTO` | Pliki | **R** | 31·R | 34·R | 2·R |
  |---|---|---|---|---|---|---|
  | darmowy, 1 r. | 2,1 MB | 19,0 MB | **21,1 MB** | 0,65 GB | 0,72 GB | 0,04 GB |
  | darmowy, 3 r. | 5,9 MB | 56,9 MB | **62,8 MB** | 1,95 GB | 2,14 GB | 0,13 GB |
  | intensywny, 1 r. | 19,6 MB | 138,4 MB | **158,1 MB** | 4,90 GB | 5,38 GB | 0,32 GB |
  | intensywny, 3 r. | 58,4 MB | 415,2 MB | **473,9 MB** | 14,69 GB | 16,11 GB | 0,95 GB |

  Narzut ZIP i manifestu to 10–306 KB, więc R ≈ baza + pliki. Liczby kopii (31, 34) pochodzą z czystej funkcji `kopiePrzedDoUsuniecia` i `nazwaArchiwum` aplikacji (40 i 60 dni symulacji).
- **Próg: 2 GB na rodzaj** [OCENA 05]. *Dlaczego:* darmowy iCloud ma 5 GB („with 5 GB of storage for free”, support.apple.com/en-us/108047, odczyt 2026-11-03). Gdy miejsce się skończy, „your device won’t back up to iCloud” (support.apple.com/en-us/108922, odczyt 2026-11-03). Zatrzymana kopia całego urządzenia, razem z bazą Oczka, to większe ryzyko dla danych niż utrata pośrednich kopii sprzed „Replace”. 2 GB zostawia ponad połowę darmowego planu na resztę telefonu.
- Zasada wspólna 10 i zasada roli 12 nr 1: kopia, której rozmiaru nie znamy, nie jest usuwana (zastrzeżenie koordynatora P-437).
- Kontrakt nazw ADR-0028 pkt 1 i 4 oraz ADR-0032 pkt 5–6 bez zmian. Funkcja wyboru pozostaje czysta, a rozmiary dostaje od adaptera.

## Rozważane opcje
- (a) Bez zmian (ADR-0032), uzupełnić tylko pomiar i próg powrotu.
- (b) DEC-25 b: pierwsza kopia dnia chroniona tylko przez ostatnie N dni (np. 7), bez rozmiarów.
- (c) Budżet miejsca puli: 2 GB na rodzaj, z dwiema kopiami chronionymi zawsze.

## Decyzja
Wybrano „(c)” (P-437), ponieważ tylko ta opcja trzyma pulę w progu we wszystkich zmierzonych profilach. Zachowuje też obie kopie, na których opiera się ADR-0032: dane sprzed serii „Replace” (pierwsza kopia najstarszego dnia) i stan sprzed ostatniego „Replace” (najnowsza). Przy małych danych zachowuje się dokładnie jak DEC-18 a. Powód odrzucenia budżetu w DEC-18 („nowy parametr bez danych”) usuwa pomiar powyżej.

Reguła (czysta funkcja `kopiePrzedDoUsuniecia`, `src/niezawodnosc/kopie.ts`, wołana przy kamieniu milowym strażnika, ADR-0019). Osobno dla `importem` i `usunieciem`. Nazwy obce i dni z przyszłości są pominięte jak w ADR-0032 pkt 5.
1. *(ADR-0032 pkt 1, bez zmian)* Kopia starsza niż `KOPIA_PRZED_IMPORTEM_DNI` (30) jest do usunięcia.
2. *(zastępuje ADR-0032 pkt 2)* Z młodszych zostają zawsze dwie kopie **chronione**: **najnowsza** (ADR-0032 pkt 3) i **pierwsza kopia najstarszego dnia** (najmniejszy przyrostek wśród obecnych z tego dnia). Pozostałe pierwsze kopie dni są **kandydatami budżetu**.
3. *(ADR-0032 pkt 4, bez zmian)* Kopie, które nie są pierwszą kopią swojego dnia, zostają od najnowszej, dopóki zostawionych jest mniej niż `KOPIA_PRZED_IMPORTEM_MAKS` (2). Reszta jest do usunięcia. Chronione i kandydaci liczą się do tej liczby jak dotąd.
4. **Budżet.** Suma S to suma rozmiarów (B) zostawionych kopii o znanym rozmiarze: chronionych, kandydatów i zostawionych w pkt 3. Dopóki S > `KOPIA_PRZED_IMPORTEM_BUDZET_B` (2 000 000 000 B), usuwany jest **najstarszy** kandydat o znanym rozmiarze (dzień rosnąco, potem przyrostek rosnąco), a S maleje o jego rozmiar. Chronionych nie usuwa się nigdy. Gdy same chronione przekraczają budżet (R > 1 GB), zostają tylko one i kopie o nieznanym rozmiarze.
5. **(nowy pkt 7 całej reguły) Nieznany rozmiar.** Rozmiar nieznany to `null` od adaptera: odczyt rzucił wyjątek albo wynik nie jest liczbą skończoną > 0. Archiwum `.oczko` ma zawsze co najmniej 22 B, więc 0 też oznacza nieznany rozmiar. Taka kopia **nie jest usuwana przez żadną regułę w tym sprzątaniu** (także pkt 1 i 3). Nie liczy się do S i nie jest kandydatem budżetu. Przy następnym kamieniu milowym rozmiar jest odczytywany ponownie. Ochronę (pkt 2) wyznaczają nadal same nazwy.

Wynik: po kamieniu pula jednego rodzaju zajmuje ≤ max(budżet, rozmiar dwóch chronionych) + kopie o nieznanym rozmiarze. Między kamieniami może urosnąć o R za każdy „Replace” (sprzątanie tylko przy starcie, ADR-0019). Przy R = 473,9 MB po kamieniu zostają 4 kopie (1,90 GB): chronione dwie i dwie najnowsze z kandydatów. Przy R = 21,1 MB zostaje wszystko, czyli 31/30 kopii jak w ADR-0032.

### Konsekwencje
- Dobre: górna granica miejsca dla wszystkich profili E0. Kopia sprzed serii i najnowsza zostają zawsze. Brak usunięcia na zgadnięcie, gdy rozmiaru nie da się odczytać. Przy małych danych reguła daje ten sam wynik co ADR-0032.
- Złe: przy dużych danych pośrednie kopie dni giną wcześniej niż po 30 dniach. Kto po kilku dniach zauważy brak czegoś po „Replace” sprzed trzech dni, nie znajdzie tej kopii, jeśli była kandydatem ponad budżet. „Pierwsza kopia najstarszego dnia” przesuwa się na młodszą, gdy starsza skończy 30 dni, a pośrednie usunął już budżet. Funkcja dostaje rozmiary, co zmienia jej sygnaturę i wymaga odczytu rozmiaru w adapterze. Gdyby odczyt rozmiaru zawodził zawsze, pula nie maleje wcale (bezpieczne dla danych, ryzyko miejsca jak w ADR-0032).
- Od czego zależy (decyzja warunkowa, warunek powrotu): (1) Apple zmienia darmowy plan iCloud. (2) Rozmiar R z prawdziwych danych przekracza 1 GB, więc budżet chroni już tylko dwie kopie i trzeba wrócić do opcji z niezależną od R liczbą kopii. (3) iCloud włączony w wydaniu (`ICLOUD_W_1_0`): „Replace” jest wtedy niedostępny przy włączonej synchronizacji (ADR-0005), więc wzorzec codziennego „Replace” znika i budżet można przejrzeć. (4) Zgłoszenie użytkowniczki o brakującej pośredniej kopii. (5) Weto właściciela wobec P-437.

### Potwierdzenie
- Czysta funkcja: `tests/niezawodnosc/kopie.test.ts`, blok K-03f rozszerzony przez rolę 07 o wektory W1–W4 niżej. Dotychczasowe wektory K-03f z rozmiarem 1 B każdej kopii dają wynik bez zmian (W3).
  - **W1:** „Replace” raz dziennie × 40 dni, każda kopia 473 943 370 B, sprzątanie po imporcie każdego dnia. Po każdym kamieniu suma ≤ 2 000 000 000 B, najwyżej 4 kopie, najnowsza i pierwsza kopia najstarszego obecnego dnia są w puli.
  - **W2:** rozmiar `null` u kandydata, który bez tego byłby usunięty budżetem, i u kopii starszej niż 30 dni: obie zostają, a suma budżetu ich nie liczy. Wariant adaptera: `rozmiar` rzuca dla jednej nazwy w `Documents/Backup`, a `sprzatnijKopiePrzed` jej nie usuwa i resztę sprząta.
  - **W3:** R = 21 116 414 B, „Replace” raz dziennie × 40 dni: liczby kopii 31 po imporcie i 30 po kamieniu, wynik identyczny z regułą ADR-0032 dla tych samych nazw.
  - **W4:** dwie chronione po 1 200 000 000 B i kandydaci: zostają tylko chronione.
- Wektory W1–W4 sprawdzone na modelu reguły (nie kod aplikacji): `oczko-warsztat/audit/M1-2026-11-02/role/05-architekt/fix-2026-11-03-p3b/dowody/narzedzia/opcja-c.mjs` — W1: 4 kopie po kamieniu, 5 po imporcie (7 przy 3/dzień), suma maks. 1,896 GB; W3: 31/30, 0,633 GB.
- Adapter: `tests/dane/archiwum.test.ts` K-03h bez zmian w oczekiwaniach (małe archiwa).
- Lista kontrolna: NIE-03 (rola 12) / ARCH-11 (rola 05).

## Opcje: zalety i wady
### (a) bez zmian — zalety: zero kodu, pełna ochrona 30 dni · wady: przy profilu intensywnym pula ma 4,9–16,1 GB, czyli ponad darmowy iCloud całego urządzenia; próg niespełniony.
### (b) ochrona pierwszej kopii dnia tylko N dni — zalety: funkcja nadal widzi tylko nazwy, granica liczby kopii N+1 (N = 7: 8 po kamieniu, 11 po imporcie przy 3/dzień) · wady: granica liczby, nie miejsca; przy R = 473,9 MB to 3,8–5,2 GB; próg spełniony tylko do R ≈ 180 MB; kopia sprzed serii dłuższej niż N dni ginie zawsze, także przy małych danych.
### (c) budżet 2 GB z dwiema chronionymi — zalety: próg spełniony we wszystkich profilach, przy małych danych zachowanie DEC-18 a, kopia sprzed serii i najnowsza zawsze · wady: nowy parametr i rozmiary w funkcji; przy dużych danych mniej kopii pośrednich.
