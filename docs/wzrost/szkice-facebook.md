# Szkice wpisów w grupach na Facebooku (rola 11, 2026-11-24; P-1029)

Bez nazw grup i danych osób. Publikuje właściciel ze swojego konta, po wydaniu 1.0, 2–4 grupy dziennie (P-1030); inne języki niż pl i en — przekład roli 09. Przed publikacją: (1) porównaj każde zdanie „Co robi” z opisem w App Store po akceptacji Apple — zdanie, którego tam nie ma, wykreśl; (2) zmień pierwsze zdanie i kolejność punktów pod grupę (zasada 4: każdy wpis inny); (3) wpisz link (zwykły albo kampanii `ct=fb-<język>`); (4) zapis w `oczko-warsztat/11-wzrost/2026-11-24-fb/grupy.md`, podsumowanie tygodnia w `docs/wzrost/dziennik.md`.

Grafika (P-1032): jeden surowy zrzut `03-wzor` w języku grupy (bez ramki), kopia w `oczko-warsztat/11-wzrost/2026-11-24-fb/grafika/`.

Źródło twierdzeń: `docs/wydanie/metadane/pl.store.json` i `en.store.json` (opis sklepu 1.0). Bez cen w kwotach (różnią się między krajami). Bez zegarka, dopóki werdykt 07 go nie potwierdzi.

## Warianty bez kodu C0 i E0 — do publikacji od 2026-11-27 (WZ1, KO-216; P-1065, P-1066)

Stan 27.11: 1.0.1 w sprzedaży od 2026-11-26T19:07:54Z; kody ofert **nie istnieją** (wymagają 02, 10 i kroku właściciela w App Store Connect), więc wpisy nie mówią o kodzie ani o bezpłatnym okresie. Każde zdanie „co robi” porównane z opisem wydanej wersji: tabela w `docs/wzrost.md`, „Sesja 3”, T-01–T-13. Odczyt opisu: Apple Lookup API 2026-11-27 08:44 UTC, `lang=pl_pl` dla pl (bez `lang` lookup zwraca opis angielski także dla `country=pl`).

**Jak składać wpis (zasada 4: każdy wpis inny):** (1) wybierz **otwarcie** z tabeli pod typ grupy, (2) wstaw **punkty** w kolejności z rotacji (wpis 1: 1-2-3, wpis 2: 2-3-1, wpis 3: 3-1-2, potem od nowa), (3) wybierz **zamknięcie** K1 albo K2 (naprzemiennie), (4) link storefrontu grupy, (5) nawiąż jednym słowem do tematu grupy tylko wtedy, gdy to prawda (np. nazwa techniki z jej opisu); nigdy nie wklejaj tej samej kombinacji drugi raz w tym samym tygodniu. Obraz: `03-wzor` w języku grupy (P-1032).

**Linki (storefront grupy; sprawdzone 2026-11-27, HTTP 200):**
- pl: `https://apps.apple.com/pl/app/oczko-row-counter/id6823678721`
- us: `https://apps.apple.com/us/app/oczko-row-counter/id6823678721` · gb: `…/gb/…` · ca: `…/ca/…` · au: `…/au/…` (ten sam identyfikator)
- Bez `pt` i `ct` — zakładka Campaigns pojawi się po danych analitycznych; link kampanii dopiero wtedy (moduł `pomiar-prywatny`).

**Punkty (z opisu sklepu, T-02–T-06):**

| | PL | EN |
|---|---|---|
| 1 | jedno stuknięcie dodaje rząd, a stuknięcie −1 go cofa | one tap adds a row, and tapping −1 takes it back |
| 2 | wzór (PDF albo zdjęcie) leży obok licznika, a bieżący rząd zaznaczasz na nim sam | your pattern (a PDF or a photo) sits next to the counter, and you mark your current row on it |
| 3 | po przerwie otwiera się tam, gdzie była przerwa, z notatką obok licznika | after a break it opens where you stopped, with your note next to the counter |

**Linia ograniczeń (zawsze, jawność):** PL: „Za darmo przez 5 dni robótkowych w miesiącu, Oczko Pro znosi limit; eksport działa zawsze. Bez konta, bez reklam, bez śledzenia.” · EN: “Free for 5 crafting days a month; Oczko Pro removes the limit; export always works. No account, no ads, no tracking.” (T-12; bez kwot cen.)

**Zamknięcia:** PL K1: „Bardzo liczę na Wasze uwagi, także krytyczne — odpowiem w komentarzach.” · K2: „Chętnie przeczytam, co działa, a co nie — w komentarzu albo prywatnie.” · EN K1: “I'd love your feedback, critical too — I'll reply in the comments.” · K2: “Tell me what works and what doesn't — in the comments or by message.”
**Opcjonalna linia o ocenie** (P-1031 (2), do weta — patrz T-11; domyślnie bez niej): PL „A jeśli Oczko się przyda, szczera ocena w App Store pomaga małej aplikacji.” · EN “And if Oczko helps you, an honest rating on the App Store helps a small app.”

### C0 — historia autora, bez kodu — PL

Szkielet: **{otwarcie}** + „Zrobiłem kiedyś aplikację do śledzenia treningów i zauważyłem, że w robótkach na drutach i szydełku liczy się to samo: postęp, odhaczanie i zapamiętanie, gdzie się skończyło. Tak powstała ta aplikacja — licznik rzędów na iPhone'a i iPada:” + 3 punkty + linia ograniczeń + link + zamknięcie.

| Typ grupy | Otwarcie (pierwsze zdanie, jawne „jestem autorem”) |
|---|---|
| ogólna dziewiarska | „Cześć! Jestem autorem aplikacji Oczko i chciałbym pokazać ją osobom, które dziergają.” |
| szydełkowa | „Dzień dobry, piszę jako autor Oczka — licznika rzędów, który obsługuje i druty, i szydełko.” |
| początkujący | „Cześć! Jestem autorem nowej aplikacji Oczko i szukam opinii, zwłaszcza od osób, które dopiero uczą się robótek.” |

### C0 — author story, no code — EN

Skeleton: **{opening}** + “I once built an app for tracking workouts and noticed that knitting and crochet need the same things: tracking progress, ticking things off and remembering where you stopped. That's how this app came about — a row counter for iPhone and iPad:” + 3 points + limits line + link + closing.

| Group type | Opening (first sentence, “I'm the developer”) |
|---|---|
| general knitting | “Hi! I'm the developer of Oczko, and I'd like to show it to people who knit.” |
| crochet | “Hello, I'm the developer of Oczko, a row counter that works for both knitting and crochet.” |
| beginners | “Hi! I'm the developer of a new app called Oczko, and I'm looking for feedback, especially from people who are still learning the craft.” |

### E0 — pytanie o pomyłkę + mała aplikacja, bez kodu — PL

Szkielet: **{otwarcie z pytaniem}** + „Aplikację rozwijam sam, więc na pewno nie jest jeszcze idealna — dlatego bardzo cenię sobie konstruktywne uwagi, w komentarzu albo prywatnie.” + 3 punkty + linia ograniczeń + link (zamknięcie K1/K2 wolno pominąć, bo uwagi są w szkielecie).

| Typ grupy | Otwarcie |
|---|---|
| ogólna dziewiarska | „Ile razy zdarzyło Wam się spruć kilka rzędów, bo pomyliło się liczenie albo zgubiło miejsce we wzorze? Jestem autorem Oczka — małej aplikacji na iPhone'a i iPada, zrobionej na ten kłopot.” |
| szydełkowa | „Szydełkujecie i zdarza Wam się zgubić, który to rząd? Jestem autorem Oczka — małej aplikacji na iPhone'a i iPada, która liczy rzędy i trzyma wzór obok licznika.” |
| początkujący | „Dopiero zaczynacie dziergać i gubicie się, w którym jesteście rzędzie? Jestem autorem Oczka — małej aplikacji na iPhone'a i iPada, w której licznik i wzór są na jednym ekranie.” |

### E0 — a mistake in your project + a small app, no code — EN

Skeleton: **{opening with a question}** + “I'm developing the app on my own, so it's surely not perfect yet — that's why I really value constructive feedback, in the comments or by message.” + 3 points + limits line + link.

| Group type | Opening |
|---|---|
| general knitting | “How many times have you had to rip back a few rows because you lost count or lost your place in the pattern? I'm the developer of Oczko, a small iPhone and iPad app made for exactly that.” |
| crochet | “Crocheting and losing track of which row you're on? I'm the developer of Oczko, a small iPhone and iPad app that counts rows and keeps your pattern next to the counter.” |
| beginners | “Just starting out and losing track of which row you're on? I'm the developer of Oczko, a small iPhone and iPad app where the counter and your pattern share one screen.” |

### Rekomendacja: który publikować najpierw (test C vs E, P-1031)
1. **Pierwszy wpis w ogóle: C0 (pl), grupa ogólna dziewiarska.** Powód: nisza reaguje nieufnie na aplikacje (filmy „czy to oszustwo”, `docs/wzrost.md` E1 sesji 2); C0 zaczyna od autora i prawdziwej historii, E0 od pytania, które czyta się jak tekst reklamowy, więc pierwszy kontakt z grupą niech będzie najspokojniejszy [OCENA].
2. **Od drugiego wpisu naprzemiennie C0 i E0 po grupach** (nie po dniach — dzień tygodnia nie miesza wyniku), w tym samym języku i typie grupy po równo. Szkice C i E z kodem zastępują C0/E0 dopiero, gdy kody istnieją; wtedy test C vs E zaczyna się od nowa (kod zmienia wpis).
3. **Co porównujemy** (bez `pt`/`ct` nie ma pobrań na wpis): przeżycie wpisu (usunięty/zatwierdzony), liczba komentarzy i pytań, wyraźne reakcje negatywne; pobrania z App Analytics tylko jako tło dnia. Przy 2–4 wpisach dziennie to ok. 7–14 wpisów na wariant w tydzień — **kierunek, nie rozstrzygnięcie** [OCENA]; próg i H po pierwszym tygodniu danych (P-1030 (3)), decyzja koordynatora.

## C. Wpis z historią i kodem (P-1031) — wersja główna, PL — **czeka na kody ofert** (nie publikować do czasu ich utworzenia; do tego czasu C0)

> Cześć! Zrobiłem kiedyś aplikację do śledzenia treningów i zauważyłem, że w robótkach na drutach i szydełku liczy się to samo: postęp, odhaczanie i zapamiętanie, gdzie się skończyło. Tak powstało **Oczko** — licznik rzędów na iPhone'a i iPada:
> • jedno stuknięcie dodaje rząd, pomyłkę cofniesz jednym ruchem,
> • wzór (PDF albo zdjęcie) obok licznika, z zaznaczonym bieżącym rzędem,
> • po przerwie otwiera się dokładnie tam, gdzie skończyliście.
>
> Aplikacja jest świeża w App Store, dlatego rozdaję **3 miesiące pełnej wersji za darmo — nic się potem samo nie pobierze**. Kod: OCZKOPL → <link realizacji kodu>
>
> Bardzo liczę na Wasze uwagi, także krytyczne. A jeśli Oczko się przyda, szczera ocena w App Store ogromnie pomaga małej aplikacji.

## C. Post with story and code (P-1031) — main version, EN

> Hi! I once built an app for tracking workouts and noticed that knitting and crochet need the same things: tracking progress, ticking things off and remembering where you stopped. That's how **Oczko** came about — a row counter for iPhone and iPad:
> • one tap adds a row, and a mistake is undone just as quickly,
> • your pattern (PDF or photo) next to the counter, with your current row marked,
> • after a break it opens exactly where you left off.
>
> It's brand new on the App Store, so I'm giving away **3 months of the full version for free — nothing renews or charges you afterwards**. Code: OCZKOEN → <code redemption link>
>
> I'd love your feedback, critical too. And if Oczko helps you, an honest rating on the App Store means a lot to a small app.

Zasady szkicu C: bez kodu „na zawsze” i bez żadnej nagrody za ocenę (P-1031 (2)); kod osobny na język; zdanie „nic się potem samo nie pobierze” tylko, jeśli kod ma wyłączone odnowienie — sprawdź w App Store Connect przed pierwszym wpisem.

## E. Wpis łączony: pomyłka przy robótce + mała aplikacja (P-1031, kandydat do testu z C) — PL — **czeka na kody ofert** (do tego czasu E0)

> Cześć! Ile razy trzeba było spruć kilka rzędów, bo pomyliło się liczenie albo zgubiło miejsce we wzorze? Właśnie na to zrobiłem **Oczko** — małą aplikację na iPhone'a i iPada:
> • jedno stuknięcie dodaje rząd, pomyłkę cofniesz jednym ruchem,
> • wzór (PDF albo zdjęcie) obok licznika, z zaznaczonym bieżącym rzędem,
> • po przerwie otwiera się dokładnie tam, gdzie skończyliście.
>
> Aplikację rozwijam sam, więc na pewno nie jest jeszcze idealna — dlatego bardzo cenię sobie konstruktywne uwagi, w komentarzu albo prywatnie. Na start rozdaję **3 miesiące pełnej wersji za darmo — nic się potem samo nie pobierze**. Kod: OCZKOPL → <link realizacji kodu>
>
> A jeśli Oczko się przyda, szczera ocena w App Store to dla małej aplikacji ogromne wsparcie.

## E. Combined post: a mistake in your project + a small app (P-1031, test candidate vs C) — EN

> Hi! How many times have you had to rip back a few rows because you lost count or lost your place in the pattern? That's exactly what I made **Oczko** for — a small iPhone and iPad app:
> • one tap adds a row, and a mistake is undone just as quickly,
> • your pattern (PDF or photo) next to the counter, with your current row marked,
> • after a break it opens exactly where you left off.
>
> I'm developing the app on my own, so it's surely not perfect yet — that's why I really value constructive feedback, in the comments or by message. To start, I'm giving away **3 months of the full version for free — nothing renews or charges you afterwards**. Code: OCZKOEN → <code redemption link>
>
> And if Oczko helps you, an honest rating on the App Store is huge support for a small app.

Zasady szkicu E: jak C i D. Pytanie na początku nie obiecuje, że pomyłek nie będzie (bez „już nigdy się nie pomylisz”). Bez prośby o testowanie (właściciel 2026-11-24: „nie prosimy o testowanie. Podkreślamy, że aplikację rozwijam sam, więc na pewno nie jest idealna i bardzo cenię sobie konstruktywny feedback”). Do testu idą C i E.

## D. Wpis „mała aplikacja, szukam błędów” (P-1031, wersja druga; **odrzucony 2026-11-24 — prosi o testowanie**, zostaje tylko jako historia) — PL

> Cześć! Szukam kilku osób, które pomogą mi wyłapać błędy w mojej małej aplikacji. Oczko to licznik rzędów na iPhone'a i iPada, który robię sam — dopiero trafił do App Store i na pewno nie jest jeszcze idealny.
>
> Co już umie:
> • jedno stuknięcie dodaje rząd, pomyłkę cofniesz jednym ruchem,
> • wzór (PDF albo zdjęcie) obok licznika, z zaznaczonym bieżącym rzędem,
> • po przerwie otwiera się dokładnie tam, gdzie skończyliście.
>
> Dla chętnych do testów: **3 miesiące pełnej wersji za darmo — nic się potem samo nie pobierze**. Kod: OCZKOPL → <link realizacji kodu>
>
> Każdy zgłoszony błąd, coś niejasnego albo brakującego — w komentarzu albo prywatnie — bardzo mi pomoże. Mała aplikacja żyje z opinii, więc jeśli Oczko się przyda, szczera ocena w App Store też ma ogromne znaczenie.

## D. "Small app, looking for bugs" (P-1031, second version) — EN

> Hi! I'm looking for a few people to help me catch bugs in my small app. Oczko is a row counter for iPhone and iPad that I build on my own — it has just landed on the App Store and it's surely not perfect yet.
>
> What it can already do:
> • one tap adds a row, and a mistake is undone just as quickly,
> • your pattern (PDF or photo) next to the counter, with your current row marked,
> • after a break it opens exactly where you left off.
>
> For anyone willing to test it: **3 months of the full version for free — nothing renews or charges you afterwards**. Code: OCZKOEN → <code redemption link>
>
> Every bug, anything confusing or missing — in the comments or by message — helps a lot. A small app lives on feedback, so if Oczko helps you, an honest rating on the App Store matters a lot too.

Zasady szkicu D: jak C; kod dostaje każdy bez warunku (nie „za zgłoszenie”), zgłoszenia błędów idą do komentarzy albo wiadomości, a ocena w App Store pozostaje osobną, szczerą prośbą. „Robię sam” — właściciel potwierdza przed publikacją, że to prawda.

## A. Wpis w grupie — PL

> Dzień dobry, jestem autorem aplikacji Oczko — licznika rzędów na iPhone'a i iPada do robótek na drutach i szydełku. Właśnie trafiła do App Store i zależy mi na uwagach osób, które naprawdę dziergają.
>
> Co robi:
> • jedno stuknięcie dodaje rząd (z wibracją), −1 cofa, a historia pokazuje każdą zmianę z godziną;
> • wzór z PDF-a, zdjęcia albo strony internetowej obok licznika, z zaznaczonym bieżącym rzędem;
> • otwiera się tam, gdzie była przerwa, z notatką obok licznika.
>
> Ograniczenia: tylko iPhone i iPad. Za darmo przez 5 dni robótkowych w miesiącu; Oczko Pro (subskrypcja albo jednorazowo) zdejmuje limit. Eksport projektów działa zawsze.
> Prywatność: bez konta, bez reklam, bez śledzenia, działa bez internetu.
>
> Link: <link>
> Chętnie przeczytam także krytyczne uwagi — odpowiem w komentarzach.

## B. Odpowiedź w wątku „jakiej aplikacji używacie do liczenia rzędów?” — PL

> Uprzedzam: jestem autorem aplikacji, więc nie jestem bezstronny. Zrobiłem Oczko właśnie na taki problem — licznik i wzór na jednym ekranie, a po przerwie otwiera się w tym samym miejscu. Tylko iPhone i iPad, za darmo 5 dni robótkowych w miesiącu. <link> — jeśli spróbujesz, daj znać, co nie działa.

## A. Post in a group — EN

> Hi, I'm the developer of Oczko, a row counter for knitting and crochet on iPhone and iPad. It has just been released on the App Store, and I'd really value feedback from people who knit and crochet.
>
> What it does:
> • one tap adds a row (with a vibration), −1 takes it back, and a history shows every change with its time;
> • your pattern from a PDF, a photo or a web page sits next to the counter, with your current row marked;
> • it opens where you stopped, with your note next to the counter.
>
> Limits: iPhone and iPad only. Free for 5 crafting days a month; Oczko Pro (subscription or one-time purchase) removes the limit. Export always works.
> Privacy: no account, no ads, no tracking, works offline.
>
> Link: <link>
> Critical feedback is welcome — I'll reply in the comments.

## B. Reply in a "which app do you use to count rows?" thread — EN

> Full disclosure: I'm the developer, so I'm biased. I made Oczko for exactly this — the counter and your pattern on one screen, and it reopens where you left off. iPhone and iPad only, free for 5 crafting days a month. <link> — if you try it, tell me what doesn't work.

## Uwagi
- „Nie jestem bezstronny” / „I'm biased” zostaje: jawność (dyrektywa 2005/29/WE zał. I pkt 22; UPNPR art. 7 pkt 22) i nisza czujna na ukrytą promocję.
- Czy dopisać, że autor sam nie dzierga — decyzja i słowa właściciela; szkic tego nie sugeruje w żadną stronę.
- Forma męska „Zrobiłem” — zgodna z autorem; zmień, jeśli publikuje kto inny.
