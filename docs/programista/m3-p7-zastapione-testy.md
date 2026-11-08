# M3 p7 — zastąpione testy (rola 08, build, 2026-11-08)

Zasada: testów zachowania i testID nie zmieniano; zmieniono tylko asercje, których wartość wynika z decyzji P-561 / P-563 (12) (kafel „Dla rodziny” zamiast zdania `oferty.rodzina`) albo z BR-DAN-009 / P-573 (ekran po „Usuń wszystkie dane”).

| Plik | Test | Było | Jest | Powód |
|---|---|---|---|---|
| `tests/ekrany/oferty.test.tsx` | „P-089 (2) → P-563 (12): …” | tekst „Shared with your family through Family Sharing.” (zdanie dopisane do „Bez Pro”) | tekst kafla P-563 (12) „You can share it with your family through Family Sharing.”; część „bez Family Sharing nic o nim nie ma” bez zmian | P-561 (02 002 A), P-563 (12), raport 02 003: kafel zastępuje zdanie, nowe brzmienie. Pokrycie nowych zachowań: `tests/ekrany/m3-p7-oferty.test.tsx` |
| `tests/i18n/kropka-srodkowa-034.test.ts` | „144: „ · ” sklejane w kodzie tylko w plikach z listy wyjątków” | `Oferty.tsx`: 2 miejsca (widoczny wiersz planu i etykieta VoiceOver) | 1 miejsce (tylko etykieta VoiceOver) | P-557 / design-spec Dzianiny: plan to trzy osobne linie (nazwa, cena w Bree, podpis) zamiast „nazwa · cena” w jednej; etykieta VoiceOver bez zmian (testy `m1-092-etykiety-planow`). Inwentarz wyjątków się zmniejszył, reguła („tylko w plikach z listy”) bez zmian |
| `tests/ekrany/usun-wszystko-trasa.test.tsx` | „N-05-1: arkusz mówi o kopii…” i „07-jakosc-004 …” (2 asercje `dismissTo`) | `dismissTo('/projekty')` | `dismissTo('/')` | polecenie p7 pkt 3, BR-DAN-009 [DO USTALENIA] z P-573: po „Usuń wszystkie dane” start na „Dziś” w stanie pustym (jak zimny start, P-563 (4a)). Zmiana zachowania w `app/usun-wszystko.tsx`; dane i kolejność kroków (kopia → usunięcie → iCloud → preferencje → reset licznika) bez zmian |
