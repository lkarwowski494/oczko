# Pisownia angielska tekstów treści — en-US

Rozstrzygnięcie roli 06, 2026-10-26 (N5 z 04 fix-6, polecenie koordynatora wg P-087): teksty treści (1.0) i atlasu technik (1.1) piszemy **w odmianie en-US**. *Dlaczego:* angielski w aplikacji jest bazą en-US („Color”), a standard, na którym stoją tabele rozmiarów, używa pisowni „millimeter”.

## Lista dla 09 (i 08 przy nakładaniu łatek)
| Miejsce | Klucz | Było | Jest |
|---|---|---|---|
| `docs/design/fix6-2026-10-26/klucze.json` (łatka 04, nakłada 08) | `druty.uwaga_mm` | „Go by the size in millimetres: …” | „Go by the size in millimeters: letter and number sizes vary from maker to maker.” |
| tamże | `druty.bez_us` | „… Go by millimetres.” | „… Go by millimeters.” |
| kanon treści 06 (prywatny), klucze `size.note.mm`, `size.needle.no_us`, `size.hook.no_us`, `settings.sources.group.yarn` | — | „millimetres” | „millimeters” (zmienione, przegląd zastępczy powtórzony 2026-10-26) |

Inne słowa w odmianie brytyjskiej (colour, centre, metre, grey, catalogue, licence, organise): w `src/i18n/slowniki/en.json` i w łatce fix-6 nie występują (wyszukiwanie 2026-10-26). Tłumaczenia (09) biorą en-US jako źródło; `en-GB` w atlasie oznacza tylko nazwy technik szydełkowych w konwencji brytyjskiej (terminy, nie pisownię tekstu).
