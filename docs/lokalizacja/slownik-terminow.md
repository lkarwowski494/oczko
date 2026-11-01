# Słownik terminów dziewiarskich i szydełkowych (35 języków)

Plik generowany z `docs/lokalizacja/slownik-terminow.json` (jedno źródło); nie edytuj ręcznie: `node docs/lokalizacja/narzedzia/slownik.mjs --md`.

Termin zalecany = słowo, którego używają wzory i producenci włóczek w danym kraju (nie dosłowny przekład z en ani z pl), z przeczytanego źródła według hierarchii P-017 (normy → podręczniki → organizacje i producenci → przewodniki; fora i Wikipedia tylko wskazówka). Nazwy producentów, sklepów i autorów w cytatach i uwagach zastąpiono „[nazwa]” albo ID źródła (repo publiczne; pełne dane w rejestrze prywatnym). Brak źródła = pewność niska i [DO SPRAWDZENIA], nie zgadujemy. „zakazane” = kalki i fałszywi przyjaciele z powodem; wzorzec to wyrażenie regularne (bez wielkości liter, Unicode). Źródłem tekstów jest en-US (P-075); pułapki US/UK (szydełko, bind off/cast off, gauge/tension) rozstrzyga znaczenie US. Pojedyncze terminy ze słownika producenta S-DRP tylko jako fakty z ID (P-104, P-106).

Pojęć: 44 · języków: 35 · wpisów: 1540 (wysoka 704, średnia 392, niska 444). Pewność: **wysoka** — termin dosłownie w przeczytanym źródle szczebla 1–3, w tym znaczeniu (cytat); nadal bez przeglądu rodzimego użytkownika; **srednia** — źródło szczebla 4, termin tylko pośrednio w źródle szczebla 1–3, cytat niesprawdzony dosłownie albo termin produktu (brzmienie 04); **niska** — bez przeczytanego źródła: [DO SPRAWDZENIA] u rodzimego użytkownika albo w źródle.

## Pojęcia

| id | en | pl | znaczenie | kluczy en |
|---|---|---|---|---|
| `robotka` | knitting (as the app's general word for the craft: "knitting day", "Keep knitting", "knitting time") | robótka / dzierganie | ogólne słowo na pracę ręczną, której użytkownik się oddaje w aplikacji: obejmuje i druty, i szydełko (aplikacja jest dla obu). W en źródło używa „knitting” także dla osób szydełkujących. NIE: tylko robienie na drutach, jeśli język ma słowo wspólne; NIE: dzianina maszynowa. | 0 |
| `dziergac_na_drutach` | knit (on needles) | robić na drutach | tworzyć dzianinę drutami; czynność (czasownik). NIE: szydełkować. | 4 |
| `szydelkowac` | crochet | szydełkować | tworzyć robótkę szydełkiem (czynność i rzemiosło). | 0 |
| `rzad` | row | rząd | jedna warstwa oczek przerobiona od brzegu do brzegu (albo jedno okrążenie przy robótce na okrągło) — jednostka licznika. NIE: wiersz tabeli, kolejka, szereg. | 139 |
| `okrazenie` | round | okrążenie | rząd przerabiany na okrągło (druty z żyłką, szydełko w kółko). W interfejsie en nie występuje (licznik mówi „row”), ale tłumacz musi go znać, żeby nie użyć go zamiast „rzędu”. | 0 |
| `oczko` | stitch (single loop on the needle) | oczko | pojedyncza pętla dzianiny/robótki — jednostka liczona (licznik „Stitches”, próbka „stitches per 10 cm”). NIE: ścieg (wzór splotu), NIE: ścieg szwalniczy/hafciarski. | 30 |
| `scieg` | stitch pattern (e.g. "stockinette stitch") | ścieg / splot | sposób przerabiania oczek dający określoną fakturę (np. dżersej, ścieg francuski). NIE: pojedyncze oczko. | 4 |
| `scieg_dzersejowy` | stockinette stitch (US) / stocking stitch (UK) | ścieg dżersejowy (pończoszniczy) | ścieg: na prawej stronie same oczka prawe, na lewej same lewe (w rzędach). Używany w opisie kategorii grubości („knitted in stockinette stitch”). | 4 |
| `licznik` | counter (row counter) | licznik (rzędów) | narzędzie w aplikacji liczące rzędy albo oczka danej części. | 37 |
| `czesc` | part (a piece counted separately: a sleeve, the back, a sock) | część (element robótki) | element projektu liczony osobno, np. rękaw, tył, skarpeta. NIE: część zamienna, rozdział. | 38 |
| `powtorzenie` | repeat (pattern repeat) | powtórzenie (raport wzoru) | zestaw rzędów (albo oczek) wzoru powtarzany wielokrotnie; „Rows in one repeat”. NIE: „powtórz” w sensie ponów operację, NIE: ponowne odtwarzanie. | 5 |
| `wzor` | pattern (written instructions for a project) | wzór (opis / instrukcja wykonania) | dokument z instrukcją wykonania robótki (PDF, zdjęcie, strona). NIE: wzór splotu/ornament (ścieg), NIE: szablon/form krawiecki. | 40 |
| `schemat` | chart (knitting/crochet chart) | schemat | graficzny zapis wzoru w kratkach/symbolach, czytany zwykle od dołu. NIE: wykres statystyczny. | 2 |
| `znacznik_rzedu` | marker / row marker (on the pattern page in the app) | znacznik (rzędu na stronie wzoru) | pozioma linia w aplikacji pokazująca bieżący rząd na stronie wzoru. NIE: znacznik oczek (fizyczny kółeczko na drucie) — choć słowo bywa to samo, w aplikacji chodzi o zakładkę/linijkę. | 5 |
| `probka` | swatch | próbka | mały kawałek dzianiny wykonany przed projektem do zmierzenia gęstości. | 11 |
| `gestosc` | gauge (US) / tension (UK) | gęstość dzianiny (oczka i rzędy na 10 cm) | liczba oczek i rzędów na 10 cm / 4 in, zmierzona na próbce. NIE: kaliber, NIE: przyrząd pomiarowy (miarka do drutów). | 10 |
| `blokowanie` | block / blocking | blokowanie (wykończenie: namoczenie/naparowanie i rozpięcie) | nadanie gotowej dzianinie (lub próbce) kształtu i wymiaru przez zwilżenie/parowanie i suszenie rozpiętej. NIE: blokowanie ekranu/dostępu. | 1 |
| `wloczka` | yarn | włóczka | nić do robótek ręcznych. NIE: przędza przemysłowa w sensie technicznym, NIE: nić do szycia. | 20 |
| `motek` | skein (unit of yarn as sold; ball/hank) | motek | jednostka sprzedaży włóczki (motek/kłębek), liczona w zapasie i zużyciu. | 15 |
| `zapas` | stash (yarn stash) | zapas (włóczki) | włóczka, którą użytkownik ma w domu. NIE: kryjówka, NIE: magazyn sklepu. | 7 |
| `grubosc_wloczki` | yarn weight (category 0–7) | grubość włóczki (kategoria) | kategoria grubości nici według standardu CYC (0 lace … 7 jumbo). NIE: masa w gramach (osobne pojęcie masa_motka). | 7 |
| `masa_motka` | weight per skein (grams) | waga (masa) motka w gramach | masa jednego motka, np. 50 g. NIE: grubość włóczki. | 1 |
| `metraz` | length per skein (yardage) | długość nici w motku (metraż) | długość nici w jednym motku, np. 200 m / 50 g. | 1 |
| `etykieta_wloczki` | yarn label (ball band) | etykieta (banderola) włóczki | opaska na motku z danymi włóczki (skład, masa, długość, zalecane druty). | 4 |
| `wloczka_lace` | lace yarn / lace weight (category 0) | włóczka koronkowa (najcieńsza, kategoria 0) | najcieńsza kategoria grubości włóczki. NIE: robótka ażurowa/koronka jako technika (choć w wielu językach to samo słowo). | 2 |
| `druty` | knitting needles | druty (do robótek) | narzędzie do robienia na drutach. NIE: igły do szycia, NIE: drut metalowy. | 15 |
| `szydelko` | crochet hook | szydełko | narzędzie z haczykiem do szydełkowania. NIE: hak, haczyk wędkarski. | 11 |
| `druty_z_zylka` | circular needles | druty z żyłką (okrągłe) | dwa krótkie druty połączone żyłką, do robótki na okrągło lub dużych prac. | 1 |
| `rozmiar_drutu` | needle size / hook size (mm; US number) | rozmiar (grubość) drutów / szydełka w mm | średnica drutu lub szydełka w milimetrach (w USA dodatkowo numer). NIE: długość drutu. | 2 |
| `oczko_prawe` | knit stitch (k) | oczko prawe | podstawowe oczko przerabiane na prawo. | 0 |
| `oczko_lewe` | purl stitch (p) | oczko lewe | podstawowe oczko przerabiane na lewo. | 0 |
| `nabieranie_oczek` | cast on (CO) | nabieranie oczek | założenie pierwszych oczek na drut. | 0 |
| `zamykanie_oczek` | bind off (US) / cast off (UK) | zamykanie (zakańczanie) oczek | zdjęcie oczek z drutu tak, by dzianina się nie spruła. NIE (pl): „oczko zamykające” w szydełku (slip stitch). | 0 |
| `ujmowanie` | decrease (dec) | ujmowanie (gubienie) oczek | zmniejszenie liczby oczek, np. przez przerobienie 2 razem. | 1 |
| `dodawanie` | increase (inc) | dodawanie (dobieranie) oczek | zwiększenie liczby oczek. | 0 |
| `narzut` | yarn over (yo; UK also yfwd/yrn) | narzut | owinięcie nici wokół drutu (dodatkowa pętla, zwykle dziurka w ażurze). | 0 |
| `dwa_razem_na_prawo` | knit two together (k2tog) | 2 oczka razem na prawo | ujęcie: dwa oczka przerobione razem jak jedno prawe (pochylenie w prawo). | 0 |
| `scieg_francuski` | garter stitch | ścieg francuski | w rzędach same oczka prawe po obu stronach. | 0 |
| `sciagacz` | ribbing / rib | ściągacz | naprzemienne kolumny oczek prawych i lewych (np. 1×1, 2×2), elastyczny brzeg. | 0 |
| `lancuszek` | chain (ch) | oczko łańcuszka / łańcuszek | podstawowe oczko szydełkowe tworzące łańcuszek. | 0 |
| `oczko_zamykajace_szyd` | slip stitch (sl st) — crochet | oczko zamykające (szydełko) | najniższe oczko szydełkowe do łączenia i przesuwania się. NIE (pl): zamykanie oczek na drutach. | 0 |
| `oczko_scisle` | single crochet (US sc) = double crochet (UK dc) | oczko ścisłe / półsłupek zwykły | wkłucie, przeciągnięcie, przerobienie dwóch pętli razem — PUŁAPKA US/UK: „double crochet” w UK to ten ścieg, w US — słupek. | 0 |
| `polslupek` | half double crochet (US hdc) = half treble (UK htr) | półsłupek (nawijany) | narzut, wkłucie, przeciągnięcie, przerobienie trzech pętli razem. | 0 |
| `slupek` | double crochet (US dc) = treble (UK tr) | słupek | narzut, wkłucie, przeciągnięcie, dwa razy po dwie pętle. PUŁAPKA US/UK. | 0 |

## Terminy zalecane (pewność: ✓ wysoka, ~ średnia, ? niska = [DO SPRAWDZENIA])

| pojęcie | en | pl | bg | cs | da | de | el | es | es-419 |
|---|---|---|---|---|---|---|---|---|---|
| `robotka` | knitting ~ | robótka ~ | плетене ~ | pletení a háčkování ~ | strik og hækling ~ | Stricken und Häkeln ~ | πλέξιμο ~ | tejer ~ | tejer ~ |
| `dziergac_na_drutach` | knit ✓ | robić na drutach ~ | плетене на две куки ~ | plést ✓ | strikke ✓ | stricken ✓ | πλέκω με βελόνες ~ | tejer (con agujas) ~ | tejer (con agujas) ~ |
| `szydelkowac` | crochet ✓ | szydełkować ~ | плетене на една кука ~ | háčkovat ✓ | hækle ✓ | häkeln ✓ | πλέκω με βελονάκι ~ | hacer ganchillo ~ | tejer a crochet ? |
| `rzad` | row ✓ | rząd ✓ | ред ~ | řada ✓ | række ✓ | Reihe ✓ | σειρά ~ | vuelta ✓ | vuelta ~ |
| `okrazenie` | round ✓ | okrążenie ✓ | ред (в кръг) ~ | kruhová řada ~ | omgang ✓ | Runde ✓ | γύρος ~ | vuelta (en redondo) ✓ | vuelta (en redondo) ~ |
| `oczko` | stitch ✓ | oczko ✓ | бримка ~ | oko ✓ | maske ✓ | Masche ✓ | πόντος ~ | punto ✓ | punto ~ |
| `scieg` | stitch pattern ~ | ścieg ✓ | плетка ~ | vzor ~ | mønster ✓ | Muster ✓ | πλέξη ~ | punto ✓ | punto ~ |
| `scieg_dzersejowy` | stockinette stitch ✓ | ścieg dżersejowy ✓ | лицева плетка ~ | lícový žerzej ~ | glatstrikning ✓ | glatt rechts ✓ | ζέρσεϊ ~ | punto jersey (derecho) ✓ | punto jersey (derecho) ~ |
| `licznik` | counter ~ | licznik ~ | брояч на редове ? | počítadlo řad ~ | rækketæller ? | Reihenzähler ~ | μετρητής σειρών ? | cuentavueltas ? | cuentavueltas ? |
| `czesc` | part ~ | część ~ | част (детайл) ? | díl ~ | del ✓ | Teil ✓ | κομμάτι ? | pieza ✓ | pieza ~ |
| `powtorzenie` | repeat ✓ | powtórzenie ~ | повторение ~ | opakování vzoru ~ | rapport ? | Rapport ? | επανάληψη ~ | repetición ~ | repetición ~ |
| `wzor` | pattern ✓ | wzór ~ | модел ~ | návod ✓ | opskrift ✓ | Anleitung ✓ | πατρόν ~ | patrón ✓ | patrón ✓ |
| `schemat` | chart ✓ | schemat ✓ | схема ~ | schéma ✓ | diagram ✓ | Strickschrift ✓ | διάγραμμα ? | gráfico ✓ | gráfico ~ |
| `znacznik_rzedu` | marker ~ | znacznik ? | маркер ~ | značka ~ | markering ? | Markierung ? | δείκτης ~ | marcador de vuelta ? | marcador de vuelta ? |
| `probka` | swatch ✓ | próbka ✓ | мостра ~ | zkušební vzorek ~ | prøve ✓ | Maschenprobe ✓ | δείγμα ? | muestra ✓ | muestra ~ |
| `gestosc` | gauge ✓ | gęstość splotu ✓ | мярка (мостра) ~ | hustota pletení ? | strikkefasthed ✓ | Maschenprobe ✓ | πυκνότητα πλεξίματος ? | muestra ✓ | tensión ~ |
| `blokowanie` | blocking ✓ | blokowanie ? | блокиране ? | blokování ~ | spænde ud ? | spannen ✓ | μπλοκάρισμα ? | bloquear ? | bloquear ? |
| `wloczka` | yarn ✓ | włóczka ✓ | прежда ~ | příze ✓ | garn ✓ | Garn ✓ | νήμα ~ | hilo ✓ | estambre ✓ |
| `motek` | skein ~ | motek ? | кълбо ? | klubko ✓ | nøgle ~ | Knäuel ✓ | κουβάρι ? | ovillo ✓ | madeja ? |
| `zapas` | stash ~ | zapas włóczki ? | запас от прежда ? | zásoba příze ? | garnlager ? | Garnvorrat ? | απόθεμα νημάτων ? | reserva de lanas ? | reserva de lanas ? |
| `grubosc_wloczki` | yarn weight ✓ | grubość włóczki ? | дебелина на преждата ? | tloušťka příze ~ | garntykkelse ? | Garnstärke ? | πάχος νήματος ? | grosor ✓ | grosor ~ |
| `masa_motka` | weight per skein ~ | waga motka ? | тегло на кълбото ? | hmotnost klubka (g) ? | vægt pr. nøgle (g) ? | Gewicht pro Knäuel (g) ~ | βάρος κουβαριού (γρ.) ? | peso (del ovillo) ? | peso (del ovillo) ? |
| `metraz` | length per skein ~ | długość nici w motku ? | дължина ? | návin ~ | løbelængde ? | Lauflänge ✓ | μήκος (μ.) ? | metros por ovillo ? | metros por ovillo ? |
| `etykieta_wloczki` | yarn label ✓ | etykieta ? | етикет ~ | etiketa (příze) ? | banderole ? | Banderole ✓ | ετικέτα ? | etiqueta ? | etiqueta ? |
| `wloczka_lace` | lace ✓ | włóczka koronkowa ? | прежда за дантела (lace) ? | krajková příze ~ | lacegarn ? | Lacegarn ? | νήμα lace ? | encaje ~ | encaje ~ |
| `druty` | needles ✓ | druty ✓ | игли (за плетене) ~ | pletací jehlice ✓ | strikkepinde ✓ | Stricknadeln ✓ | βελόνες ~ | agujas (de punto) ✓ | agujas ✓ |
| `szydelko` | hook ✓ | szydełko ✓ | кука ~ | háček ✓ | hæklenål ✓ | Häkelnadel ✓ | βελονάκι ~ | ganchillo ✓ | gancho ✓ |
| `druty_z_zylka` | circular needles ~ | druty z żyłką ~ | кръгови игли ? | kruhové jehlice ✓ | rundpind ✓ | Rundstricknadel ✓ | κυκλικές βελόνες ? | agujas circulares ? | agujas circulares ? |
| `rozmiar_drutu` | size (mm) ✓ | rozmiar (mm) ? | номер игли ~ | velikost (číslo) jehlic v mm ? | pindestørrelse (nr. i mm) ~ | Nadelstärke ✓ | νούμερο βελόνας (mm) ? | número de agujas ✓ | tamaño (de aguja / gancho) ✓ |
| `oczko_prawe` | knit stitch ✓ | oczko prawe ✓ | лицева бримка ~ | hladce (hladké oko) ~ | ret maske ✓ | rechte Masche ✓ | καλός πόντος ~ | punto derecho ✓ | punto derecho ~ |
| `oczko_lewe` | purl stitch ✓ | oczko lewe ✓ | опакова бримка ~ | obrace (obrácené oko) ~ | vrang maske ✓ | linke Masche ✓ | ανάποδος πόντος ~ | punto revés ✓ | punto revés ~ |
| `nabieranie_oczek` | cast on ✓ | nabieranie oczek ✓ | набиране на бримки ? | nahodit oka (nahození) ~ | slå op ✓ | anschlagen ✓ | ρίξιμο πόντων ~ | montar (puntos) ✓ | montar (puntos) ~ |
| `zamykanie_oczek` | bind off ✓ | zakańczanie oczek ✓ | закриване на бримки ? | uzavřít oka (uzavření) ~ | lukke af ✓ | abketten ✓ | κλείσιμο πλεκτού ~ | cerrar (los puntos) ✓ | cerrar (los puntos) ~ |
| `ujmowanie` | decrease ✓ | odejmowanie oczek ~ | свиване ~ | ujímání (ujmout oka) ~ | indtagning ✓ | abnehmen ✓ | μείωση πόντων ~ | disminuir / menguar ✓ | disminuir / menguar ~ |
| `dodawanie` | increase ✓ | dodawanie oczek ✓ | наддаване ~ | přidávání (přidat oko) ~ | udtagning ✓ | zunehmen ✓ | αύξηση πόντων ~ | aumentar / aumento ✓ | aumentar / aumento ~ |
| `narzut` | yarn over ✓ | narzut ✓ | наметка ~ | nahození ~ | omslag ✓ | Umschlag ✓ | ζετέ ~ | hebra ✓ | lazada ? |
| `dwa_razem_na_prawo` | knit 2 together ✓ | 2 oczka razem na prawo ✓ | 2 лицеви бримки, изплетени заедно ~ | splést 2 oka hladce ~ | strik 2 ret sammen ✓ | 2 Maschen rechts zusammenstricken ✓ | 2 πόντοι μαζί καλή ~ | dos puntos juntos derecho ✓ | dos puntos juntos derecho ~ |
| `scieg_francuski` | garter stitch ~ | ścieg francuski ✓ | всички редове лицево ? | vroubkový vzor ~ | retstrikning ✓ | kraus rechts ✓ | γαρνιτούρα ~ | punto bobo ✓ | punto santa clara ? |
| `sciagacz` | ribbing ~ | ściągacz ✓ | ластик ? | patent (pružný vzor) ~ | rib ? | Rippenmuster ✓ | λάστιχο ~ | punto elástico ✓ | punto elástico ~ |
| `lancuszek` | chain ✓ | oczko łańcuszka ✓ | въздушна бримка ~ | řetízkové oko ✓ | luftmaske ✓ | Luftmasche ✓ | αλυσίδα ? | punto de cadeneta ✓ | cadena ? |
| `oczko_zamykajace_szyd` | slip stitch ✓ | oczko zamykające ✓ | залепена бримка ~ | pevné oko ? | kædemaske ✓ | Kettmasche ✓ | τυφλό γαϊτανάκι ? | punto enano ✓ | punto deslizado ? |
| `oczko_scisle` | single crochet ✓ | półsłupek zwykły ~ | нисък пълнеж ~ | krátký sloupek ✓ | fastmaske ✓ | feste Masche ✓ | κοντό ξυλάκι ? | punto bajo ✓ | punto bajo ~ |
| `polslupek` | half double crochet ✓ | półsłupek nawijany ~ | полупълнеж ~ | polodlouhý sloupek ~ | halv stangmaske ✓ | halbes Stäbchen ✓ | μισό ψηλό ξυλάκι ? | punto medio alto ✓ | punto medio alto ~ |
| `slupek` | double crochet ✓ | słupek ✓ | висок пълнеж с 1 наметка ~ | dlouhý sloupek ✓ | stangmaske ✓ | Stäbchen ✓ | ψηλό ξυλάκι ? | punto alto ✓ | punto alto ~ |

| pojęcie | et | fi | fr | hr | hu | id | it | ja | ko |
|---|---|---|---|---|---|---|---|---|---|
| `robotka` | kudumine ja heegeldamine ~ | neulominen ja virkkaus ~ | ouvrage ✓ | pletenje i kukičanje ~ | kötés-horgolás ? | merajut ✓ | lavoro ✓ | 編み物 ✓ | 뜨개 ✓ |
| `dziergac_na_drutach` | kuduma ✓ | neuloa ✓ | tricoter ✓ | plesti ✓ | kötni ? | merajut dengan jarum ? | lavorare a maglia ✓ | 棒針編み（棒針で編む） ✓ | 대바늘뜨기 ~ |
| `szydelkowac` | heegeldama ✓ | virkata ✓ | crocheter ✓ | kukičati ✓ | horgolni ? | merajut (dengan hakpen) ✓ | lavorare all’uncinetto ~ | かぎ針編み（かぎ針で編む） ✓ | 코바늘뜨기 ✓ |
| `rzad` | rida ✓ | kerros ✓ | rang ✓ | red ~ | sor ? | baris ✓ | ferro ✓ | 段 ✓ | 단 ✓ |
| `okrazenie` | ring ✓ | kerros ~ | tour ✓ | krug ~ | kör ? | putaran ✓ | giro ✓ | 段（輪編み） ✓ | 단 ✓ |
| `oczko` | silmus ✓ | silmukka ✓ | maille ✓ | očica ✓ | szem ✓ | tusuk ~ | maglia ✓ | 目 ✓ | 코 ✓ |
| `scieg` | kude ✓ | neule ~ | point ✓ | bod ~ | kötésminta (minta) ? | pola tusuk ? | punto ✓ | 編み方 ~ | 무늬 ~ |
| `scieg_dzersejowy` | parempidine kude ✓ | sileä neule ✓ | jersey endroit ✓ | glatki bod (desno lice) ? | harisnyakötés (simakötés) ? | stockinette ? | maglia rasata ✓ | メリヤス編み ✓ | 메리야스뜨기 ✓ |
| `licznik` | ridade loendur ? | kerroslaskin ~ | compteur de rangs ? | brojač redova ? | sorszámláló ? | penghitung baris ? | contagiri ✓ | 段数カウンター ? | 카운터 ? |
| `czesc` | tükk ~ | osa ? | partie ✓ | dio ? | darab (rész) ? | bagian ? | parte ✓ | パーツ ? | 파트 ? |
| `powtorzenie` | mustrikord ✓ | mallikerta ✓ | motif (à répéter) ~ | ponavljanje uzorka ~ | mintaismétlés ? | pengulangan ~ | motivo da ripetere ✓ | 繰り返し ~ | 반복 ✓ |
| `wzor` | juhend ~ | ohje ✓ | modèle ✓ | upute ~ | leírás (minta) ? | pola ✓ | spiegazione ✓ | 編み図 ~ | 도안 ✓ |
| `schemat` | mustriskeem ✓ | kaavio ✓ | diagramme ✓ | shema ~ | mintarajz (diagram) ? | diagram ✓ | schema ✓ | 編み図 ✓ | 기호 도안 ✓ |
| `znacznik_rzedu` | märkija (silmusemärkija) ? | merkki ~ | repère (de rang) ? | oznaka (marker) ? | jelölő (szemjelölő) ? | penanda ~ | segnariga ? | マーカー ? | 마커 ~ |
| `probka` | proovitükk ~ | mallitilkku ✓ | échantillon ✓ | probni uzorak ~ | próbadarab (mintadarab) ? | sampel rajutan ? | campione ✓ | ゲージ（試し編み） ~ | 스와치 ✓ |
| `gestosc` | koetihedus ✓ | tiheys ✓ | échantillon ✓ | gustoća pletiva ? | kötéssűrűség ? | gauge (kerapatan rajutan) ? | campione ✓ | ゲージ ✓ | 게이지 ✓ |
| `blokowanie` | viimistlemine ~ | pingotus ✓ | blocage ? | blokiranje ? | blokkolás (formára szárítás) ? | blocking ? | bloccaggio ? | 仕上げ（スチームアイロン） ~ | 블로킹 ? |
| `wloczka` | lõng ✓ | lanka ✓ | fil ✓ | pređa ✓ | fonal ✓ | benang rajut ✓ | filato ✓ | 糸 ✓ | 실 ✓ |
| `motek` | tokk ✓ | kerä ✓ | pelote ✓ | klupko ✓ | gombolyag ? | gulung ✓ | gomitolo ✓ | 玉 ✓ | 볼 ✓ |
| `zapas` | lõngavaru ? | lankavarasto ? | stock de fils ? | zaliha pređe ? | fonalkészlet ? | stok benang ? | scorta di filati ? | 手持ちの糸 ~ | 보유 실 ? |
| `grubosc_wloczki` | lõnga jämedus ? | langan vahvuus ~ | grosseur ✓ | debljina pređe ? | fonalvastagság ? | ketebalan benang ? | spessore del filato ? | 糸の太さ ✓ | 실 굵기 ✓ |
| `masa_motka` | toki kaal ? | kerän paino (g) ~ | poids (de la pelote) ? | težina klupka ~ | gombolyag súlya ? | berat per gulung (g) ~ | peso (in grammi) ~ | 重量（1玉あたり） ✓ | 중량 ✓ |
| `metraz` | lõnga pikkus tokis ? | juoksevuus ✓ | métrage ? | dužina niti ~ | futóhossz (méter/gombolyag) ? | panjang benang (m) ? | metraggio ~ | 糸長 ✓ | 길이 ~ |
| `etykieta_wloczki` | lõngasilt (banderoll) ? | vyöte ? | bande de pelote ✓ | etiketa ~ | címke ~ | label ✓ | etichetta ✓ | ラベル（糸のラベル） ✓ | 라벨 ? |
| `wloczka_lace` | pitslõng (kategooria 0) ? | lace-lanka ? | dentelle ✓ | čipkasta pređa (lace) ? | csipkefonal (0. kategória) ? | benang lace ? | lace (filato per pizzo) ? | 極細 ~ | 레이스실 ? |
| `druty` | kudumisvardad ✓ | neulepuikot ✓ | aiguilles (à tricoter) ✓ | igle za pletenje ~ | kötőtű ? | jarum rajut ? | ferri ✓ | 棒針 ✓ | 대바늘 ✓ |
| `szydelko` | heegelnõel ✓ | virkkuukoukku ✓ | crochet ✓ | kukica ~ | horgolótű ? | hakpen ✓ | uncinetto ✓ | かぎ針 ✓ | 코바늘 ✓ |
| `druty_z_zylka` | ringvardad ✓ | pyöröpuikko ✓ | aiguilles circulaires ✓ | kružne igle ? | körkötőtű ? | jarum rajut sirkular ? | ferri circolari ✓ | 輪針 ✓ | 줄바늘 ✓ |
| `rozmiar_drutu` | varraste number (nr) ~ | puikkokoko (mm) ~ | numéro d’aiguille ✓ | broj igle (mm) ~ | tűméret (mm) ? | ukuran hook / jarum (mm) ~ | numero dei ferri ~ | 号数（mm） ✓ | 바늘 사이즈 ~ |
| `oczko_prawe` | parempidine silmus ✓ | oikea silmukka ✓ | maille endroit ✓ | prava očica ~ | sima szem ? | tusuk knit ? | maglia diritta ✓ | 表目 ✓ | 겉뜨기 ✓ |
| `oczko_lewe` | pahempidine silmus ✓ | nurja silmukka ✓ | maille envers ✓ | kriva očica ~ | fordított szem ? | tusuk purl ? | maglia rovescia ✓ | 裏目 ✓ | 안뜨기 ✓ |
| `nabieranie_oczek` | silmuste ülesloomine ✓ | luoda silmukat ✓ | monter les mailles ✓ | nametnuti očice ~ | szemfelszedés ? | cast on ? | avviare le maglie ✓ | 作り目 ✓ | 코잡기 ✓ |
| `zamykanie_oczek` | mahakudumine ✓ | päätellä silmukat ✓ | rabattre les mailles ✓ | završiti pletivo (zatvaranje očica) ~ | leláncolás (szemek lezárása) ? | bind off ? | intrecciare le maglie ✓ | 伏せ止め ✓ | 코막음 ✓ |
| `ujmowanie` | kahandamine ✓ | kavennus ✓ | diminuer / diminution ✓ | oduzimanje očica ~ | fogyasztás ? | pengurangan tusuk ? | diminuire / diminuzione ✓ | 減らし目 ~ | 코줄임 ✓ |
| `dodawanie` | kasvatamine ✓ | lisäys ✓ | augmenter / augmentation ✓ | dodavanje očica ? | szaporítás ? | penambahan tusuk ? | aumentare / aumento ✓ | 増し目 ✓ | 코늘림 ✓ |
| `narzut` | õhksilmus ✓ | langankierto ✓ | jeté ✓ | omot (navoj) ? | ráhajtás ? | yarn over ? | gettato ✓ | かけ目 ✓ | 바늘비우기 ✓ |
| `dwa_razem_na_prawo` | 2 silmust parempidi kokku ✓ | neulo 2 silmukkaa oikein yhteen ✓ | 2 mailles ensemble à l’endroit ✓ | dvije očice zajedno pravo ~ | 2 szem simán együtt ? | k2tog (2 tusuk knit bersamaan) ? | 2 maglie insieme a diritto ✓ | 左上2目一度 ✓ | 왼코 겹치기 ? |
| `scieg_francuski` | ripskude ✓ | ainaoikeinneule ? | point mousse ✓ | sve pravo (bod nabora) ? | lustakötés ? | garter stitch ? | maglia legaccio ✓ | ガーター編み ✓ | 가터뜨기 ✓ |
| `sciagacz` | soonik ✓ | joustinneule ✓ | côtes ✓ | rebrasti bod ~ | patentkötés / bordáskötés (1 sima, 1 fordított) ? | rib ? | coste ✓ | ゴム編み ✓ | 고무뜨기 ✓ |
| `lancuszek` | ahelsilmus ✓ | ketjusilmukka ✓ | maille en l’air ✓ | lančić ✓ | láncszem ? | tusuk rantai ✓ | catenella ✓ | 鎖編み ✓ | 사슬뜨기 ✓ |
| `oczko_zamykajace_szyd` | aassilmus ✓ | piilosilmukka ✓ | maille coulée ✓ | vezna očica ~ | kispálca (hamispálca) ? | slip stitch ~ | maglia bassissima ✓ | 引き抜き編み ✓ | 빼뜨기 ✓ |
| `oczko_scisle` | kinnissilmus ✓ | kiinteä silmukka ✓ | maille serrée ✓ | niski štapić ~ | rövidpálca (US sc) ? | tusuk tunggal ✓ | maglia bassa ✓ | 細編み ✓ | 짧은뜨기 ✓ |
| `polslupek` | poolsammas ~ | puolipylväs ? | demi-bride ✓ | poluvisoki štapić ~ | félpálca ? | tusuk setengah ganda ✓ | mezza maglia alta ✓ | 中長編み ✓ | 긴뜨기 ✓ |
| `slupek` | sammas ~ | pylväs ? | bride ✓ | visoki štapić ~ | egyráhajtásos pálca (US dc) ? | tusuk ganda ✓ | maglia alta ✓ | 長編み ✓ | 한길긴뜨기 ✓ |

| pojęcie | lt | lv | ms | nb | nl | pt | pt-BR | ro | ru |
|---|---|---|---|---|---|---|---|---|---|
| `robotka` | mezgimas ir nėrimas ~ | adīšana un tamborēšana ~ | mengait ✓ | strikking og hekling ~ | breien en haken ~ | trabalho ✓ | tecer ~ | împletire ✓ | вязание ✓ |
| `dziergac_na_drutach` | megzti virbalais ✓ | adīt ~ | mengait (dengan jarum kait) ✓ | strikke ✓ | breien ✓ | tricotar ✓ | tricotar ✓ | a tricota ✓ | вязать спицами ✓ |
| `szydelkowac` | nerti vąšeliu ✓ | tamborēt ~ | mengait krusye ~ | hekle ✓ | haken ✓ | fazer crochet ~ | fazer crochê ~ | a croșeta ✓ | вязать крючком ✓ |
| `rzad` | eilė ✓ | rinda ~ | baris ✓ | rad ~ | rij ✓ | carreira ✓ | carreira ✓ | rând ✓ | ряд ✓ |
| `okrazenie` | ratas (megzti ratu) ~ | aplis (adīt pa apli) ? | pusingan ? | omgang ✓ | toer ✓ | volta ? | volta ? | rând (circular) ~ | круговой ряд ✓ |
| `oczko` | akis ✓ | valdziņš ~ | gelungan ✓ | maske ✓ | steek ✓ | malha ✓ | ponto ✓ | ochi ✓ | петля ✓ |
| `scieg` | raštas ✓ | adījums ~ | jahit (kait) ~ | strikkemønster ? | steek (w złożeniach: tricotsteek, ribbelsteek) ~ | ponto ✓ | ponto ✓ | punct ✓ | узор (вязка) ✓ |
| `scieg_dzersejowy` | lygus mezgimas (lygusis raštas) ? | labiski gludais adījums ~ | jahit stokin ? | glattstrikk ✓ | tricotsteek ✓ | ponto jersey ✓ | ponto meia ~ | punct jerseu ✓ | лицевая гладь ✓ |
| `licznik` | eilučių skaitiklis ✓ | rindu skaitītājs ? | pembilang baris ? | omgangsteller ? | toerenteller ? | contador de carreiras ? | contador de carreiras ? | numărător de rânduri ? | счётчик рядов ? |
| `czesc` | detalė ? | detaļa ? | bahagian ? | del ~ | deel ✓ | parte ? | parte ? | piesă ? | деталь ✓ |
| `powtorzenie` | raporto kartojimas (raportas) ? | raksta atkārtojums (raports) ? | ulangan ? | rapport ? | herhaling ✓ | repetição ~ | repetição ✓ | raport ✓ | раппорт ✓ |
| `wzor` | aprašymas ✓ | apraksts ? | corak ? | oppskrift ✓ | patroon ✓ | modelo ~ | receita ✓ | model ? | описание ✓ |
| `schemat` | schema ✓ | shēma ~ | rajah corak ? | diagram ✓ | schema ~ | gráfico ? | gráfico ~ | schemă ✓ | схема ✓ |
| `znacznik_rzedu` | žymeklis ✓ | marķieris ? | penanda ? | merke ~ | markering ~ | marcador de carreira ? | marcador de carreira ? | marcaj ? | маркер ✓ |
| `probka` | bandinys (mezgimo pavyzdys) ? | paraugs ? | sampel ~ | prøvelapp ✓ | proeflapje ✓ | amostra ✓ | amostra ? | mostră ✓ | образец ✓ |
| `gestosc` | mezgimo tankumas ~ | adīšanas blīvums ? | ketumpatan sirat ~ | strikkefasthet ✓ | stekenverhouding ✓ | amostra ✓ | amostra ? | densitatea împletiturii ~ | плотность вязания ✓ |
| `blokowanie` | blokavimas ✓ | blokēšana (mitrā apstrāde) ? | blocking ? | blokking ? | opspannen ✓ | blocar ? | blocagem ? | călcare (prin cârpă umedă) ? | блокировка (влажно-тепловая обработка) ? |
| `wloczka` | siūlai ✓ | dzija ✓ | benang ✓ | garn ✓ | garen ✓ | fio ✓ | fio ✓ | fire pentru tricotat ✓ | пряжа ✓ |
| `motek` | kamuoliukas ~ | kamols ~ | gegelung ✓ | nøste ✓ | bol ✓ | novelo ✓ | novelo ✓ | ghem ✓ | моток ✓ |
| `zapas` | siūlų atsargos ? | dziju krājums ? | simpanan benang ? | garnlager ? | garenvoorraad ? | fios em casa (stash) ? | estoque de fios ? | stoc de fire ? | запас пряжи ? |
| `grubosc_wloczki` | siūlų storis ~ | [nazwa] biezums ? | ketebalan benang ? | garntykkelse ? | garendikte ? | espessura do fio ✓ | espessura do fio ? | grosimea firului ~ | толщина пряжи ? |
| `masa_motka` | kamuoliuko svoris ~ | svars ~ | berat segegelung (g) ? | vekt per nøste (g) ~ | gewicht per bol (g) ~ | peso (g) ? | peso (g) ? | greutatea ghemului (g) ? | вес мотка ? |
| `metraz` | metražas ✓ | garums ~ | panjang benang (m) ? | løpelengde ✓ | looplengte ~ | metragem ✓ | metragem ? | lungimea firului (m) ? | длина нити в мотке ~ |
| `etykieta_wloczki` | etiketė ? | etiķete ~ | label benang ? | banderole ? | banderol ? | cinta ✓ | etiqueta ? | etichetă ✓ | этикетка (пряжи) ? |
| `wloczka_lace` | nėriniams skirti siūlai (0 kategorija) ? | mežģīņu dzija (0. kategorija) ? | benang lace ? | lacegarn ? | lacegaren ? | renda ✓ | fio lace ? | fir foarte subțire (lace) ? | пряжа для кружевного вязания (категория 0) ? |
| `druty` | virbalai ✓ | adāmadatas ~ | jarum kait ✓ | strikkepinner ✓ | breinaalden ✓ | agulhas de tricot ✓ | agulhas de tricô ✓ | andrele ✓ | спицы ✓ |
| `szydelko` | vąšelis ✓ | tamboradata ~ | jarum krusye ✓ | heklenål ✓ | haaknaald ✓ | agulha de crochet ✓ | agulha de crochê ~ | croșetă ✓ | крючок ✓ |
| `druty_z_zylka` | virbalai su valu ~ | apaļadāmās adatas ~ | jarum kait bulat ? | rundpinne ✓ | rondbreinaald ✓ | agulha circular ✓ | agulha circular ? | andrele circulare ✓ | круговые спицы ✓ |
| `rozmiar_drutu` | virbalų numeris (Nr., mm) ✓ | adatu numurs (Nr., mm) ~ | saiz jarum (mm) ? | pinnestørrelse (nr. = mm) ~ | naalddikte (mm) ~ | número da agulha ✓ | número da agulha ? | grosimea andrelelor (mm) ~ | номер спиц / крючка (мм) ✓ |
| `oczko_prawe` | geroji akis ✓ | labiskais valdziņš ? | jahit kait ✓ | rett maske ✓ | rechte steek ✓ | malha de meia ✓ | ponto meia ✓ | ochi pe față ✓ | лицевая петля ✓ |
| `oczko_lewe` | išvirkščioji akis ✓ | kreiliskais valdziņš ? | jahit purl ✓ | vrang maske ✓ | averechte steek ✓ | malha de liga ✓ | ponto tricô ✓ | ochi pe dos ✓ | изнаночная петля ✓ |
| `nabieranie_oczek` | akių uždėjimas ✓ | valdziņu uzmešana ? | mula mata kait ? | legge opp ✓ | opzetten ✓ | montar (malhas) ✓ | montar os pontos ✓ | montarea ochiurilor ✓ | набор петель ✓ |
| `zamykanie_oczek` | akių nuleidimas ~ | valdziņu nodarīšana (nobeigšana) ? | mati mata kait ✓ | felle av ✓ | afkanten ✓ | rematar ✓ | arrematar ~ | încheierea ochiurilor ✓ | закрытие петель ✓ |
| `ujmowanie` | akių nuleidimas (sumezgimas kartu) ~ | valdziņu sarukums (noraukšana) ? | kurangkan mata kait ? | felling ? | minderen ✓ | diminuição ✓ | diminuição ✓ | scăderea ochiurilor ✓ | убавка ✓ |
| `dodawanie` | akių pridėjimas ✓ | valdziņu piemešana ? | tambah mata kait ? | økning ✓ | meerderen ? | aumento ✓ | aumento ✓ | adăugarea ochiurilor ✓ | прибавка ✓ |
| `narzut` | užmetimas ✓ | apmetiens ? | lilit benang ? | kast ~ | omslag ~ | laçada ~ | laçada ~ | jeteu ✓ | накид ✓ |
| `dwa_razem_na_prawo` | 2 akys sumezgamos kartu į dešinę ✓ | 2 valdziņi kopā labiski ? | kait dua bersama ? | strikk 2 masker rett sammen ? | 2 steken recht samenbreien ✓ | 2 malhas juntas em meia ~ | ponto juntos meia ✓ | două ochiuri împletite împreună pe față ✓ | 2 петли вместе лицевой ✓ |
| `scieg_francuski` | keliaraštis (visos akys geros) ? | rievu adījums (abpusēji labiski) ? | jahit garter ~ | rillestrikk ? | ribbelsteek ✓ | ponto de liga ~ | ponto barra ~ | punct leneș ✓ | платочная вязка ✓ |
| `sciagacz` | rantai (rantinis raštas) ? | valnītis (ribu adījums) ? | jahit permatang ~ | vrangbord ✓ | boordsteek ? | canelado ✓ | ponto sanfona ? | punct elastic ✓ | резинка ✓ |
| `lancuszek` | oro akis (oro akių grandinėlė) ? | gaisa valdziņš (ķēdīte) ? | kait tali air ✓ | luftmaske ✓ | losse ✓ | corrente ✓ | correntinha ✓ | ochi liber ✓ | воздушная петля ✓ |
| `oczko_zamykajace_szyd` | jungiamoji akis ? | ievilktais valdziņš ? | sekali kait ~ | kjedemaske ✓ | halve vaste ✓ | ponto baixíssimo ? | ponto baixíssimo ✓ | semipicioruș ✓ | соединительная петля ~ |
| `oczko_scisle` | stulpelis be apvijos (US sc) ? | īsais stabiņš (US sc) ? | [DO SPRAWDZENIA] ? | fastmaske ✓ | vaste ✓ | ponto baixo ✓ | ponto baixo ✓ | picioruș fără jeteu ✓ | столбик без накида ✓ |
| `polslupek` | pusstulpis su apvija ? | pusstabiņš ? | separuh sekali belit ? | halvstav ✓ | half stokje ? | meio ponto alto ~ | meio ponto alto ✓ | [DO SPRAWDZENIA] ? | полустолбик с накидом ~ |
| `slupek` | stulpelis su apvija (US dc) ? | garais stabiņš (US dc) ? | sekali belit ~ | stav ✓ | stokje ~ | ponto alto ~ | ponto alto ✓ | picioruș cu un jeteu ✓ | столбик с накидом ✓ |

| pojęcie | sk | sl | sr | sv | tr | uk | vi | zh-Hant |
|---|---|---|---|---|---|---|---|---|
| `robotka` | pletenie a háčkovanie ~ | pletenje in kvačkanje ~ | плетење и хеклање ? | stickning och virkning ~ | örgü ✓ | в'язання ✓ | đan móc ? | 編織 ✓ |
| `dziergac_na_drutach` | pliesť ✓ | plesti ✓ | плести ~ | sticka ✓ | şişle örmek ~ | в'язати спицями ✓ | đan ~ | 棒針編織 ✓ |
| `szydelkowac` | háčkovať ✓ | kvačkati ✓ | хеклати ~ | virka ✓ | tığla örmek ~ | в'язати гачком ✓ | móc ~ | 鉤針編織 ✓ |
| `rzad` | riadok ~ | vrsta ✓ | ред ~ | varv ✓ | sıra ~ | ряд ✓ | hàng ~ | 段 ✓ |
| `okrazenie` | kruh (rad v kruhu) ~ | krog ? | круг ~ | varv ~ | tur ? | коловий ряд ✓ | vòng ? | 段（輪編） ~ |
| `oczko` | očko ~ | zanka ✓ | петља ~ | maska ✓ | ilmek ✓ | петля ✓ | mũi ~ | 針 ✓ |
| `scieg` | vzor ~ | vzorec ✓ | бод ~ | mönster ~ | örgü modeli ✓ | візерунок ✓ | kiểu đan ? | 花樣 ~ |
| `scieg_dzersejowy` | lícový džerzej ? | gladko desno ~ | глатки бод ? | slätstickning ✓ | jarse örgü ~ | лицьова гладь ? | mũi đan trơn (stockinette) ? | 平面編 ✓ |
| `licznik` | počítadlo riadkov ? | števec vrstic ~ | бројач редова ? | varvräknare ? | sıra sayacı ? | лічильник рядів ? | bộ đếm hàng ? | 計數器 ? |
| `czesc` | časť ~ | del ~ | део ? | del ✓ | parça ? | деталь ✓ | phần ? | 織片 ~ |
| `powtorzenie` | opakovanie (vzoru) ~ | ponovitev vzorca ~ | понављање мустре ? | rapport ? | tekrar ? | рапорт ✓ | lặp lại ? | 重複 ? |
| `wzor` | návod ~ | navodila ~ | мустра ~ | mönster ✓ | tarif ? | опис ~ | mẫu ~ | 織法 ~ |
| `schemat` | schéma ~ | shema ? | шема ~ | diagram ✓ | şema ? | схема ✓ | sơ đồ ? | 織圖 ✓ |
| `znacznik_rzedu` | označovač ~ | označevalec ? | маркер ? | linjal ~ | işaretçi ? | маркер ✓ | vạch đánh dấu ? | 記號 ? |
| `probka` | skúšobná vzorka ~ | poskusni vzorček ~ | узорак ~ | provlapp ✓ | numune ? | зразок ✓ | mẫu thử ? | 密度織片 ? |
| `gestosc` | hustota (skúška očiek) ~ | gostota pletenja ? | густина плетења ? | masktäthet ✓ | örgü sıklığı ? | щільність в'язання ✓ | mật độ mũi (gauge) ? | 密度 ✓ |
| `blokowanie` | blokovanie ? | blokiranje ? | блокирање ? | blockning ✓ | buharla şekillendirme ? | волого-теплова обробка ~ | định hình (blocking) ? | 整燙定型 ✓ |
| `wloczka` | priadza ✓ | preja ✓ | вуница ? | garn ✓ | iplik ✓ | пряжа ✓ | len ~ | 毛線 ✓ |
| `motek` | klbko ~ | klobčič ✓ | клупко ~ | nystan ✓ | yumak ✓ | моток ✓ | cuộn len ~ | 線球 ✓ |
| `zapas` | zásoba priadze ? | zaloga preje ? | залиха вунице ? | garnlager ? | iplik stoku ? | запас пряжі ? | kho len ? | 庫存毛線 ? |
| `grubosc_wloczki` | hrúbka priadze ? | debelina preje ? | дебљина вунице ? | garngrupp ~ | iplik kalınlığı ? | товщина нитки ~ | độ dày sợi ? | 線材粗細 ✓ |
| `masa_motka` | hmotnosť klbka (g) ? | teža klobčiča ? | тежина клупка ? | vikt per nystan (g) ~ | yumak ağırlığı (g) ? | вага мотка ? | trọng lượng cuộn (g) ? | 每球重量（g） ? |
| `metraz` | návin (dĺžka) ? | dolžina preje (metraža) ? | дужина конца ? | löplängd ? | metraj ? | довжина нитки в мотку (метраж) ? | chiều dài sợi (m) ? | 每球長度（m） ? |
| `etykieta_wloczki` | etiketa ? | ovitek (volne) ~ | етикета ? | banderoll ? | etiket ? | етикетка ? | nhãn len ? | 毛線標籤 ✓ |
| `wloczka_lace` | čipková priadza (lace) ? | čipkasta preja (lace) ? | вуница за чипку (lace) ? | lacegarn ? | çok ince iplik (lace) ? | тонка пряжа для мережива (категорія 0) ? | len siêu mảnh (lace) ? | 蕾絲線 ? |
| `druty` | pletacie ihlice ✓ | pletilke ✓ | игле за плетење ~ | stickor ✓ | şiş ✓ | спиці ✓ | que đan ~ | 棒針 ✓ |
| `szydelko` | háčik ✓ | kvačka ✓ | хеклица ~ | virknål ✓ | tığ ✓ | гачок ✓ | kim móc ~ | 鉤針 ✓ |
| `druty_z_zylka` | kruhové ihlice ✓ | okrogle pletilke ✓ | кружне игле ~ | rundsticka ? | misinalı şiş ✓ | кругові спиці ? | kim đan vòng ? | 輪針 ✓ |
| `rozmiar_drutu` | číslo ihlíc (v mm) ~ | številka pletilk ~ | број игле (mm) ? | stickstorlek (mm) ~ | şiş numarası ~ | номер гачка / спиць (мм) ✓ | cỡ kim (mm) ? | 棒針規格（mm） ~ |
| `oczko_prawe` | hladko (hladké očko) ~ | desna zanka ✓ | права петља ~ | rät maska ✓ | yüz ilmek ~ | лицьова петля ~ | mũi lên ? | 下針 ✓ |
| `oczko_lewe` | obratko (obrátené očko) ~ | leva zanka ✓ | крива петља ~ | avig maska ✓ | ters ilmek ✓ | виворітна петля ~ | mũi xuống ? | 上針 ✓ |
| `nabieranie_oczek` | nahodiť očká ~ | nasnuti zanke ✓ | наметање петљи ~ | lägga upp ✓ | ilmek atma ~ | набір петель ~ | lên mũi ? | 起針 ✓ |
| `zamykanie_oczek` | uzatvoriť očká ~ | zazankati zanke ~ | затварање петљи ? | maska av ✓ | ilmek kapatma ? | закривання петель ~ | chốt mũi ? | 套收針 ✓ |
| `ujmowanie` | uberanie (ubrať) ~ | snemanje zank ~ | смањивање ~ | intagning ✓ | eksiltme ~ | скорочення петель ~ | giảm mũi ~ | 減針 ✓ |
| `dodawanie` | pridávanie (pridať očko) ~ | dodajanje zank ~ | повећавање ~ | ökning ✓ | artırma ~ | додавання петель ✓ | tăng mũi ~ | 加針 ✓ |
| `narzut` | nahodenie (nahodiť) ~ | ovoj ✓ | навој ~ | omslag ✓ | ilmek dolama ~ | накид ✓ | vòng sợi (yarn over) ? | 掛針 ✓ |
| `dwa_razem_na_prawo` | spliesť 2 očká hladko ~ | 2 zanki skupaj desno ~ | две петље заједно на право ? | sticka ihop 2 maskor rätt ✓ | iki ilmeği birlikte yüz örmek ~ | 2 петлі разом лицьовою ? | đan 2 mũi chung ? | 左上2併針 ✓ |
| `scieg_francuski` | vrúbkovaný vzor ~ | vse desno (kodrasti vzorec) ? | све право ? | rätstickning ✓ | haraşo örgü ~ | хусткова в’язка ? | [DO SPRAWDZENIA] ? | 起伏編 ✓ |
| `sciagacz` | patent ~ | patentni vzorec (1 leva 1 desna) ~ | ребрасти бод ~ | resår ✓ | lastik örgü ~ | резинка ? | bo (đan bo) ? | 鬆緊編 ✓ |
| `lancuszek` | retiazkové očko ~ | verižna petlja ✓ | ланчић ~ | luftmaska ✓ | zincir ~ | повітряна петля ✓ | mũi xích ? | 鎖針 ✓ |
| `oczko_zamykajace_szyd` | pevné očko ~ | vezna petlja ? | мртва петља ~ | smygmaska ✓ | basit kroşe ~ | з'єднувальний стовпчик ✓ | mũi trượt ? | 引拔針 ✓ |
| `oczko_scisle` | krátky stĺpik ~ | gosta petlja ✓ | ниски стубић ~ | fast maska ✓ | sık ilmek ~ | стовпчик без накиду ✓ | mũi móc đơn ? | 短針 ✓ |
| `polslupek` | polodlhý stĺpik ~ | polšibična petlja ~ | обичан стубић ~ | halvstolpe ✓ | yarı üçlü ilmek ~ | півстовпчик із накидом ✓ | mũi móc nửa kép ? | 中長針 ✓ |
| `slupek` | dlhý stĺpik ✓ | šibična petlja ✓ | стубић са једним навијутком ~ | stolpe ✓ | düz üçlü ilmek ~ | стовпчик із накидом ✓ | mũi móc kép ? | 長針 ✓ |

## Terminy zakazane (kalki)

| pojęcie | język | wzorzec | powód |
|---|---|---|---|
| `robotka` | pl | `dzianin` | „dzianina” to wyrób (materiał), nie czynność ani robótka szydełkowa |
| `robotka` | es | `\bg[eé]nero de punto\b` | dzianina przemysłowa [DO SPRAWDZENIA] |
| `robotka` | es-419 | `\bg[eé]nero de punto\b` | dzianina przemysłowa [DO SPRAWDZENIA] |
| `robotka` | fr | `\bbonneterie` | bonneterie = dzianina/pończosznictwo przemysłowe, nie robótka ręczna [DO SPRAWDZENIA] |
| `robotka` | ja | `ニッティング` | kalka „knitting”; w ja wskazuje druty/dzianinę, nie obejmuje szydełka [DO SPRAWDZENIA] |
| `robotka` | ko | `니팅` | kalka „knitting”; wskazuje tylko druty [DO SPRAWDZENIA] |
| `robotka` | ko | `편직` | 편직 = dzianie przemysłowe/maszynowe [DO SPRAWDZENIA] |
| `robotka` | pt | `\btecer\b` | w pt-PT „tecer” = tkać; w pt-BR bywa ogólne dla robótek (S-CIR) [DO SPRAWDZENIA] |
| `robotka` | ru | `трикотаж` | trikotaż = dzianina/wyroby (zwykle maszynowe), nie hobby |
| `robotka` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `robotka` | zh-Hant | `針織` | 針織 = dzianie/dzianina (też przemysłowe: NAER „hand knitting 手工針織”, MOE 針織品 = wyroby dziane); nie obejmuje szydełka [DO SPRAWDZENIA] |
| `dziergac_na_drutach` | cs | `štrik` | potoczny germanizm „štrikovat”; wzory i słowniki używają „plést” [DO SPRAWDZENIA] |
| `dziergac_na_drutach` | de | `\bwirk(en\|t\|e)\b` | wirken = dzianie maszynowe/tkanie dzianiny przemysłowej, nie ręczne robienie na drutach [DO SPRAWDZENIA] |
| `dziergac_na_drutach` | et | `varrasta` | Käsitööteaduse oskussõnad: „varrastama — väldi” |
| `dziergac_na_drutach` | et | `\bkuju(ma\|n)` | Käsitööteaduse oskussõnad: „kujuma — väldi” |
| `dziergac_na_drutach` | fi | `\bkuto` | kutoa = tkać; [nazwa] rozdziela „Kudonta” i „Neulonta” (potocznie bywa używane dla drutów) |
| `dziergac_na_drutach` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `szydelkowac` | ja | `クロッシェ` | zapożyczenie „crochet” rzadkie w ja; standard to かぎ針編み [DO SPRAWDZENIA] |
| `szydelkowac` | vi | `đan bằng kim móc` | opisowa glosa słownikowa; w UI „móc (len)” [DO SPRAWDZENIA] |
| `szydelkowac` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `szydelkowac` | zh-Hant | `勾針\|勾織` | forma nienormatywna; MOE i wydawcy piszą 鉤針/鉤織 [DO SPRAWDZENIA] |
| `rzad` | pl | `(?<![\p{L}])wiersz` | „wiersz” to wiersz tekstu/tabeli, nie rząd dzianiny |
| `rzad` | pl | `(?<![\p{L}])szereg` | kalka „row” → szereg [DO SPRAWDZENIA] |
| `rzad` | cs | `řád(?:ek\|ku\|ky\|cích)` | „řádek” = wiersz tekstu/tabeli; w robótce „řada” [DO SPRAWDZENIA] |
| `rzad` | da | `\blinje\b` | linia/wiersz (kalka „row”) [DO SPRAWDZENIA] |
| `rzad` | de | `\bZeile` | Zeile = wiersz tekstu/tabeli (kalka „row”); w dzianinie rząd to Reihe [DO SPRAWDZENIA] |
| `rzad` | fi | `\brivi` | rivi = wiersz tekstu/tabeli (kalka „row”) [DO SPRAWDZENIA] |
| `rzad` | fr | `\blignes?\b` | „ligne” = wiersz tekstu/tabeli, nie rząd dzianiny [DO SPRAWDZENIA] |
| `rzad` | it | `\bfil[ae]\b` | „fila” w LG to rząd kratek schematu, nie jednostka licznika [DO SPRAWDZENIA] |
| `rzad` | ja | `行(?!う\|き\|っ)` | 行 = wiersz tekstu/tabeli; rząd robótki to 段 [DO SPRAWDZENIA] |
| `rzad` | ja | `列` | 列 = kolumna/szereg, nie rząd robótki [DO SPRAWDZENIA] |
| `rzad` | ko | `(?<![진실])행(?!사\|동)` | 행 = wiersz tabeli/tekstu; rząd robótki to 단 [DO SPRAWDZENIA] |
| `rzad` | ko | `줄(?!바늘)` | 줄 = linia/sznurek; rząd to 단 [DO SPRAWDZENIA] |
| `rzad` | ms | `\bderet` | „deret” = szereg/kolejka (ogólne znaczenie „row”) [DO SPRAWDZENIA] |
| `rzad` | nb | `\blinje\b` | linia/wiersz (kalka „row”) [DO SPRAWDZENIA] |
| `rzad` | nl | `\bregel` | regel = wiersz tekstu (kalka „row”) [DO SPRAWDZENIA] |
| `rzad` | pt | `\bfileiras?\b` | kalka „row” [DO SPRAWDZENIA] |
| `rzad` | pt | `\blinhas?\b` | „linha” = nić/wiersz tekstu (w S-R4-ORG „uma linha” obok igły do szycia) |
| `rzad` | vi | `\bdãy\b` | ogólne „szereg”, nie rząd dzianiny [DO SPRAWDZENIA] |
| `rzad` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `rzad` | zh-Hant | `行` | 行 = konwencja kontynentalna/wiersz tekstu; w TW (tradycja japońska) rząd = 段 [DO SPRAWDZENIA] |
| `rzad` | zh-Hant | `橫列` | 橫列 = termin przemysłowy (NAER course: 線圈橫列) |
| `okrazenie` | da | `\bcirkel` | kalka „round” jako koło [DO SPRAWDZENIA] |
| `okrazenie` | de | `\bKreis` | Kreis = koło/okrąg geometryczny (kalka „round”) [DO SPRAWDZENIA] |
| `okrazenie` | es | `\brondas?\b` | kalka z en „round” [DO SPRAWDZENIA] |
| `okrazenie` | es-419 | `\brondas?\b` | kalka z en „round” [DO SPRAWDZENIA] |
| `okrazenie` | ko | `라운드` | kalka „round” [DO SPRAWDZENIA] |
| `okrazenie` | nl | `\bcirkel` | kalka „round” jako koło [DO SPRAWDZENIA] |
| `okrazenie` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `okrazenie` | zh-Hant | `圈` | konwencja kontynentalna (圈 = okrążenie); w TW 段 [DO SPRAWDZENIA] |
| `oczko` | pl | `(?<![\p{L}])ścieg(?:u\|i\|ów\|iem)?(?![\p{L}])` | „stitch” jako jednostka liczona to oczko, nie ścieg (ścieg = rodzaj splotu) |
| `oczko` | bg | `\bстежк\|\bбод\b` | стежка/бод = ścieg szwalniczy; w dziewiarstwie „бримка” [DO SPRAWDZENIA] |
| `oczko` | cs | `\bsteh` | steh = ścieg szwalniczy/hafciarski (KOS: „křížkový steh cross stitch”), nie oczko |
| `oczko` | cs | `\bočk` | „očko” to forma słowacka/zdrobnienie; producent ([nazwa] cs) pisze „oko” |
| `oczko` | da | `\bsting\b` | sting = ścieg szwalniczy (S-MAY-DA „Sy sidestykkerne i med pæne små sting”) |
| `oczko` | de | `\bStich` | Stich = ścieg szwalniczy/hafciarski; pojedyncze oczko dzianiny to Masche (S-JUN, S-LG-DE) [DO SPRAWDZENIA] |
| `oczko` | el | `βελονι[άα]` | „βελονιά” = ścieg szwalniczy/hafciarski, nie oczko dzianiny [DO SPRAWDZENIA] |
| `oczko` | es | `\bpuntadas?\b` | puntada = ścieg szwalniczy/hafciarski |
| `oczko` | es-419 | `\bpuntadas?\b` | puntada = ścieg szwalniczy/hafciarski |
| `oczko` | et | `\bpist` | piste = ścieg szwalniczy (S-KT-ET: „mõne pistega kinni”) |
| `oczko` | fi | `\b(pisto\|tikki)` | ścieg hafciarski/szwalniczy [DO SPRAWDZENIA] |
| `oczko` | fr | `\bpoints?\b` | „point” = ścieg/splot (point mousse, point de jersey); jako jednostka liczona tylko „maille”. Poprawne w pojęciu „scieg” — zakaz dotyczy wyłącznie liczenia oczek |
| `oczko` | fr | `\bpiq[uû]res?\b` | piqûre = ścieg szwalniczy |
| `oczko` | hr | `\bšav` | šav = szew [DO SPRAWDZENIA] |
| `oczko` | hu | `öltés` | öltés = ścieg szwalniczy/hafciarski [DO SPRAWDZENIA] |
| `oczko` | id | `\bjahitan\b` | „jahitan” = szew/ścieg szwalniczy; tu tylko w kalce „Chain Stitches” (jahitan rantai) [DO SPRAWDZENIA] |
| `oczko` | it | `\bpunt[oi]\b` | „punto” = ścieg/splot (punto coste, punto treccia); jako jednostka liczona tylko „maglia”. Poprawne w pojęciu „scieg” |
| `oczko` | it | `\bcucitur` | szew/ścieg szwalniczy |
| `oczko` | ja | `ステッチ` | „stitch” jako ścieg hafciarski/szwalniczy; oczko w dzianinie to 目 [DO SPRAWDZENIA] |
| `oczko` | ja | `縫い目` | 縫い目 = ścieg szwu |
| `oczko` | ko | `스티치(?!마커)` | „stitch” jako zapożyczenie: w Banksia tylko „특수스티치” (ścieg specjalny); pojedyncze oczko to 코 [DO SPRAWDZENIA] |
| `oczko` | ko | `바늘땀\|땀` | 땀 = ścieg szwalniczy |
| `oczko` | lt | `dygsn` | dygsnis = ścieg szwalniczy/hafciarski (IATE: „kryželio dygsnis” = cross-stitch) |
| `oczko` | lv | `dūrien` | dūriens = ścieg szwalniczy [DO SPRAWDZENIA] |
| `oczko` | ms | `\bjahit(an)?\b(?! (kait\|purl\|garter\|permatang\|rantai))` | „jahit/jahitan” = ścieg szwalniczy; w DBP tylko w nazwach ściegów (jahit kait, jahit purl) — nie jako pojedyncze oczko |
| `oczko` | nb | `\bsting\b` | sting = ścieg szwalniczy [DO SPRAWDZENIA] |
| `oczko` | pt | `\bpontos?\b` | w pt-PT na drutach jednostka to „malha”, „ponto” = ścieg (ponto jersey) lub oczko szydełkowe (S-R4-CUPCAKE „2 pb em cada ponto”) — zakaz tylko dla oczek drutowych |
| `oczko` | ro | `\bcus[ăa]tur` | cusătură = ścieg szwalniczy/hafciarski (źródło używa go w rozdziale o haftowaniu, nie o dzianinie) |
| `oczko` | ro | `\bpunct(ul\|e\|ele)?\b` | w dzianinie „punct” = ścieg/splot (punct jerseu), nie pojedyncze oczko; poprawne tylko w pojęciu scieg |
| `oczko` | ru | `стеж(о\|к)` | стежок = ścieg szwalniczy/hafciarski, nie oczko dzianiny [DO SPRAWDZENIA] |
| `oczko` | sk | `\bsteh` | steh = ścieg szwalniczy (LBH: „doslova steh” — dosłowne tłumaczenie stitch, nie termin) |
| `oczko` | sl | `\bvbod` | vbod = ścieg szwalniczy/hafciarski (IATE: „križni vbod” = cross-stitch) |
| `oczko` | sv | `\bstygn` | stygn = ścieg szwalniczy/hafciarski [DO SPRAWDZENIA] |
| `oczko` | tr | `\bdikiş` | dikiş = szew/ścieg szwalniczy, nie oczko [DO SPRAWDZENIA] |
| `oczko` | tr | `\bpuan\b` | kalka „point/punto” [DO SPRAWDZENIA] |
| `oczko` | uk | `стіб(о)?к` | стібок = ścieg szwalniczy (S-HOD-UK8: „потайними стібками”), nie oczko |
| `oczko` | vi | `mũi khâu` | „mũi khâu” = ścieg szwalniczy (to samo hasło słownika, znaczenie „sewing”) |
| `oczko` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `oczko` | zh-Hant | `針步\|針腳\|縫線` | ścieg szwalniczy (NAER chain stitch: 鎖鏈針步) |
| `scieg` | cs | `\bsteh` | steh = ścieg szwalniczy/hafciarski, nie splot dzianiny |
| `scieg` | de | `\bStich` | Stich = ścieg szwalniczy; ścieg dziewiarski to Muster (np. Rippenmuster, Perlmuster) [DO SPRAWDZENIA] |
| `scieg` | et | `\bpist` | ścieg szwalniczy |
| `scieg` | hu | `öltés` | ścieg szwalniczy |
| `scieg` | ja | `ステッチ` | kalka „stitch”; w ja splot to 〜編み [DO SPRAWDZENIA] |
| `scieg` | ru | `стеж(о\|к)` | ścieg szwalniczy [DO SPRAWDZENIA] |
| `scieg` | sk | `\bsteh` | steh = ścieg szwalniczy, nie splot |
| `scieg` | sl | `\bvbod` | vbod = ścieg szwalniczy, nie splot |
| `scieg` | uk | `стіб(о)?к` | ścieg szwalniczy |
| `scieg` | vi | `đường may` | „đường may” = szew (słownik: „vết chỉ, đường may”) — nie ścieg dzianiny |
| `scieg` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `scieg` | zh-Hant | `圖案` | 圖案 = motyw/obrazek (np. żakard), nie splot [DO SPRAWDZENIA] |
| `scieg_dzersejowy` | da | `\bstrømpestrik` | kalka UK „stocking stitch” [DO SPRAWDZENIA] |
| `scieg_dzersejowy` | fr | `\bpoint de bas\b` | kalka z en „stocking stitch” [DO SPRAWDZENIA] |
| `scieg_dzersejowy` | ja | `ストッキネット` | kalka „stockinette” [DO SPRAWDZENIA] |
| `scieg_dzersejowy` | ja | `平編み` | 平編み = robótka płaska (w rzędach), nie ścieg dżersejowy (S-NV-KB0: 平編みの時に使います) |
| `scieg_dzersejowy` | ko | `스토키네트` | kalka „stockinette” [DO SPRAWDZENIA] |
| `scieg_dzersejowy` | ko | `평뜨기` | kalka pl/zh „ścieg płaski”; nie w źródłach [DO SPRAWDZENIA] |
| `scieg_dzersejowy` | nl | `\bkousensteek` | kalka UK „stocking stitch” [DO SPRAWDZENIA] |
| `scieg_dzersejowy` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `scieg_dzersejowy` | zh-Hant | `平針(?!刺繡)` | 平針 = termin przemysłowy/kontynentalny (NAER plain stitch: 平針線圈); w TW 平面編 [DO SPRAWDZENIA] |
| `scieg_dzersejowy` | zh-Hant | `緯平` | termin przemysłowy (jersey) [DO SPRAWDZENIA] |
| `licznik` | cs | `čítač` | „čítač” = licznik techniczny/elektroniczny [DO SPRAWDZENIA] |
| `licznik` | da | `\b(skranke\|disk)\b` | counter jako lada [DO SPRAWDZENIA] |
| `licznik` | de | `\b(Theke\|Tresen\|Schalter)\b` | counter jako lada/okienko (kalka) [DO SPRAWDZENIA] |
| `licznik` | it | `\bcontator[ei]\b` | kalka „counter” (licznik techniczny) [DO SPRAWDZENIA] |
| `licznik` | nl | `\b(toonbank\|balie)\b` | counter jako lada [DO SPRAWDZENIA] |
| `licznik` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `czesc` | de | `\bErsatzteil` | część zamienna [DO SPRAWDZENIA] |
| `czesc` | ru | `запчаст` | część zamienna, nie element robótki |
| `czesc` | uk | `запчаст` | część zamienna |
| `czesc` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `czesc` | zh-Hant | `零件\|配件` | część zamienna/akcesorium |
| `powtorzenie` | de | `\bWiedergabe` | Wiedergabe = odtwarzanie (replay) [DO SPRAWDZENIA] |
| `powtorzenie` | et | `\bkordus` | „kordus” = powtórzenie ogólne/pętla programu (Sõnaveeb: kordus → loop), nie raport wzoru |
| `powtorzenie` | ja | `リピート` | kalka „repeat” (np. odtwarzanie) [DO SPRAWDZENIA] |
| `powtorzenie` | ko | `리피트` | kalka „repeat” [DO SPRAWDZENIA] |
| `powtorzenie` | ru | `\bповтор(ы\|а\|ов)?\b` | rzeczownik „повтор” = ponowienie/powtórka (np. odtwarzania); w opisach wzorów jednostka to „раппорт” [DO SPRAWDZENIA] |
| `powtorzenie` | uk | `\bповтор(и\|у\|ів)?\b` | rzeczownik = ponowienie/powtórka; we wzorach „рапорт” [DO SPRAWDZENIA] |
| `powtorzenie` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `powtorzenie` | zh-Hant | `完全組織\|花紋循環` | termin przemysłowy (NAER), obcy dla dziergających ręcznie |
| `wzor` | cs | `\bstřih` | střih = wykrój krawiecki ([nazwa]: „schéma vzoru a střih” — osobne rzeczy) |
| `wzor` | cs | `šablon` | szablon, nie instrukcja wykonania [DO SPRAWDZENIA] |
| `wzor` | da | `\bmønster` | mønster = wzór splotu (S-HJE „Strik mønster til de sidste 3 m”), nie instrukcja; poprawne w pojęciu „scieg” |
| `wzor` | de | `\bMuster\b` | Muster = wzór splotu/ścieg (S-LG-DE „Rippenmuster”, S-JUN „Großes Perlmuster”), nie instrukcja wykonania; poprawne tylko w pojęciu „scieg” |
| `wzor` | de | `\bSchnittmuster` | Schnittmuster = wykrój krawiecki [DO SPRAWDZENIA] |
| `wzor` | et | `\bmuster` | „muster” = ornament/motyw (EKI: „pinnal korduv joonte või värviliste kujundite kombinatsioon”), nie dokument z instrukcją |
| `wzor` | fi | `\bmalli\b` | malli = model/fason (S-KAL-FI „Villapaita on malliltaan hieman väljä”), nie instrukcja |
| `wzor` | fr | `\bgabarits?\b` | gabarit = szablon/wykrój [DO SPRAWDZENIA] |
| `wzor` | it | `\bcartamodell` | wykrój krawiecki |
| `wzor` | it | `\bpattern\b` | anglicyzm [DO SPRAWDZENIA] |
| `wzor` | ja | `模様(?!編み)` | 模様 = ornament/wzór splotu, nie dokument instrukcji |
| `wzor` | ja | `型紙` | 型紙 = wykrój krawiecki |
| `wzor` | ko | `무늬` | 무늬 = wzór splotu/ornament, nie dokument instrukcji |
| `wzor` | ko | `본(?!뜨기)` | 본 = szablon/wykrój krawiecki [DO SPRAWDZENIA] |
| `wzor` | lt | `\brašt` | „raštas” = wzór splotu/ornament, nie instrukcja |
| `wzor` | lv | `\braksts` | „raksts” = wzór splotu/ornament, nie instrukcja [DO SPRAWDZENIA] |
| `wzor` | nl | `\b(sjabloon\|mal)\b` | szablon/forma krawiecka [DO SPRAWDZENIA] |
| `wzor` | pt-BR | `\bpadr(?:ão\|ao\|ões)\b` | „padrão” = ornament/standard, nie instrukcja wykonania [DO SPRAWDZENIA] |
| `wzor` | pt-BR | `\bmoldes?\b` | wykrój krawiecki [DO SPRAWDZENIA] |
| `wzor` | ru | `\bузор` | „узор” = wzór splotu/motyw (ścieg), nie dokument z instrukcją |
| `wzor` | ru | `шаблон\|выкройк` | szablon / wykrój krawiecki, nie opis robótki |
| `wzor` | sk | `\bstrih` | strih = wykrój krawiecki [DO SPRAWDZENIA] |
| `wzor` | sl | `\bkroj` | kroj = wykrój krawiecki [DO SPRAWDZENIA] |
| `wzor` | sv | `\bmall\b` | mall = szablon (kalka „template”) [DO SPRAWDZENIA] |
| `wzor` | tr | `\bmodel(i\|ler\|leri)?\b(?! tarif)` | „model” w tr = splot/ścieg (S-TEKE-2021: „örgü modelleri” to wzory splotów), nie instrukcja wykonania — poprawne w pojęciu scieg |
| `wzor` | uk | `візерун\|узор` | візерунок/узор = wzór splotu (ścieg), nie dokument z instrukcją |
| `wzor` | uk | `викрій\|шаблон` | wykrój/szablon krawiecki |
| `wzor` | vi | `hoa văn` | „hoa văn” = ornament/deseń (słownik: „repeated decoration”), nie instrukcja |
| `wzor` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `wzor` | zh-Hant | `紙型\|版型` | wykrój krawiecki |
| `wzor` | zh-Hant | `圖案` | 圖案 = motyw/ornament, nie instrukcja [DO SPRAWDZENIA] |
| `schemat` | pl | `wykres` | „chart” to schemat dziewiarski, nie wykres statystyczny |
| `schemat` | cs | `\bgraf` | chart jako wykres statystyczny [DO SPRAWDZENIA] |
| `schemat` | da | `\b(graf\|kort)\b` | chart jako wykres/mapa [DO SPRAWDZENIA] |
| `schemat` | de | `\b(Diagramm\|Grafik\|Tabelle\|Karte)\b` | chart jako wykres/mapa (kalka) [DO SPRAWDZENIA] |
| `schemat` | el | `γράφημα` | „chart” jako wykres statystyczny [DO SPRAWDZENIA] |
| `schemat` | et | `graafik\|diagramm` | wykres |
| `schemat` | fi | `\b(kuvaaja\|kartta)` | chart jako wykres/mapa [DO SPRAWDZENIA] |
| `schemat` | fr | `\bgraphiques?\b` | graphique = wykres statystyczny [DO SPRAWDZENIA] |
| `schemat` | hu | `grafikon` | wykres |
| `schemat` | id | `\bgrafik\b` | „chart” jako wykres [DO SPRAWDZENIA] |
| `schemat` | it | `\bgrafic[oi]\b` | wykres statystyczny [DO SPRAWDZENIA] |
| `schemat` | ja | `チャート` | „chart” jako wykres; w ja schemat to 編み図/記号図 [DO SPRAWDZENIA] |
| `schemat` | ja | `グラフ` | グラフ = wykres statystyczny (u NV tylko „編み目グラフノート” = papier kratkowy) |
| `schemat` | ko | `그래프\|도표` | wykres statystyczny/tabela, nie schemat robótki |
| `schemat` | lt | `diagram\|grafik` | wykres |
| `schemat` | nb | `\b(graf\|kart)\b` | chart jako wykres/mapa [DO SPRAWDZENIA] |
| `schemat` | nl | `\b(grafiek\|kaart)\b` | chart jako wykres/mapa [DO SPRAWDZENIA] |
| `schemat` | ru | `диаграмм\|график` | wykres statystyczny, nie schemat dziewiarski |
| `schemat` | sk | `\bgraf` | chart jako wykres [DO SPRAWDZENIA] |
| `schemat` | sv | `\b(graf\|karta)\b` | chart jako wykres/mapa [DO SPRAWDZENIA] |
| `schemat` | tr | `\bgrafik` | „chart” jako wykres [DO SPRAWDZENIA] |
| `schemat` | uk | `діаграм\|графік` | wykres, nie schemat |
| `schemat` | vi | `biểu đồ` | „chart” jako wykres statystyczny [DO SPRAWDZENIA] |
| `schemat` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `schemat` | zh-Hant | `圖表` | 圖表 = wykres/tabela |
| `schemat` | zh-Hant | `圖解` | 圖解 = ilustrowany poradnik (np. tytuły „全圖解”), nie schemat [DO SPRAWDZENIA] |
| `znacznik_rzedu` | cs | `zvýrazňovač\|\bfix` | marker jako mazak/zakreślacz [DO SPRAWDZENIA] |
| `znacznik_rzedu` | da | `\b(tusch\|overstregningspen)` | marker jako mazak [DO SPRAWDZENIA] |
| `znacznik_rzedu` | de | `\b(Textmarker\|Filzstift\|Edding)\b` | marker jako mazak [DO SPRAWDZENIA] |
| `znacznik_rzedu` | fi | `\b(tussi\|korostuskynä)` | marker jako mazak [DO SPRAWDZENIA] |
| `znacznik_rzedu` | nb | `\b(tusj\|markeringspenn)` | marker jako mazak [DO SPRAWDZENIA] |
| `znacznik_rzedu` | nl | `\b(markeerstift\|stift)\b` | marker jako mazak [DO SPRAWDZENIA] |
| `znacznik_rzedu` | ru | `фломастер` | mazak/flamaster, nie znacznik |
| `znacznik_rzedu` | sv | `\b(överstrykningspenna\|tuschpenna)` | marker jako mazak [DO SPRAWDZENIA] |
| `znacznik_rzedu` | uk | `фломастер` | mazak |
| `znacznik_rzedu` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `znacznik_rzedu` | zh-Hant | `麥克筆\|馬克筆` | mazak (kalka „marker”) |
| `probka` | de | `\b(Stichprobe\|Stoffmuster\|Farbmuster)\b` | próbka statystyczna/handlowa (kalka „sample”) [DO SPRAWDZENIA] |
| `probka` | ja | `見本` | 見本 = próbka towaru/wzorzec [DO SPRAWDZENIA] |
| `probka` | ko | `견본\|샘플` | 견본/샘플 = próbka towaru [DO SPRAWDZENIA] |
| `probka` | nl | `\b(monster\|staal)\b` | próbka handlowa (kalka „sample”) [DO SPRAWDZENIA] |
| `probka` | ru | `пробник` | próbka kosmetyku/perfum [DO SPRAWDZENIA] |
| `probka` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `probka` | zh-Hant | `布樣\|樣本` | próbka tkaniny/handlowa (NAER swatch: 小塊布樣) [DO SPRAWDZENIA] |
| `gestosc` | da | `\bspænding` | kalka UK „tension” [DO SPRAWDZENIA] |
| `gestosc` | de | `\bSpannung` | kalka UK „tension”; Fadenspannung to naciąg nici, nie gęstość [DO SPRAWDZENIA] |
| `gestosc` | de | `\b(Lehre\|Kaliber\|Messgerät\|Nadelmaß)\b` | gauge jako przyrząd [DO SPRAWDZENIA] |
| `gestosc` | el | `μετρητ` | „gauge” jako przyrząd [DO SPRAWDZENIA] |
| `gestosc` | es | `\bcalibre\b` | kalka „gauge”; używa go CYC-ES („tensión o calibre del punto”), [nazwa] nie [DO SPRAWDZENIA] |
| `gestosc` | es | `\bmedidor\b` | przyrząd [DO SPRAWDZENIA] |
| `gestosc` | es-419 | `\bcalibre\b` | kalka „gauge”, choć używa jej CYC-ES [DO SPRAWDZENIA] |
| `gestosc` | et | `kaliib\|mõõdik` | przyrząd, nie gęstość |
| `gestosc` | fi | `\bjännit` | kalka UK „tension” [DO SPRAWDZENIA] |
| `gestosc` | fi | `\bmittari` | gauge jako przyrząd [DO SPRAWDZENIA] |
| `gestosc` | fr | `\bjauges?\b` | kalka z en „gauge” (przyrząd) [DO SPRAWDZENIA] |
| `gestosc` | it | `\bcalibr` | kalka „gauge” (przyrząd) [DO SPRAWDZENIA] |
| `gestosc` | ja | `密度` | 密度 to termin chiński; w ja dzianinowej gęstości nie nazywa się 密度 [DO SPRAWDZENIA] |
| `gestosc` | ja | `テンション` | kalka UK „tension” [DO SPRAWDZENIA] |
| `gestosc` | ko | `밀도` | kalka pl „gęstość”/zh 密度; w ko używa się 게이지 [DO SPRAWDZENIA] |
| `gestosc` | ko | `텐션` | kalka UK „tension” [DO SPRAWDZENIA] |
| `gestosc` | lt | `kalibr\|matuokl` | przyrząd [DO SPRAWDZENIA] |
| `gestosc` | ms | `\btolok\b` | DBP: „tolok: Sebarang alat untuk mengukur” — przyrząd, nie gęstość (choć „tolok kait” istnieje w Istilah) |
| `gestosc` | nb | `\bspenning` | kalka UK „tension” [DO SPRAWDZENIA] |
| `gestosc` | nl | `\bspanning` | kalka UK „tension” [DO SPRAWDZENIA] |
| `gestosc` | nl | `\bdichtheid` | kalka z pl „gęstość” [DO SPRAWDZENIA] |
| `gestosc` | ro | `\becartament` | kalka „gauge” jako rozstaw (szyn) [DO SPRAWDZENIA] |
| `gestosc` | ro | `\btensiun` | kalka UK „tension” [DO SPRAWDZENIA] |
| `gestosc` | ru | `калибр\|датчик` | kaliber/czujnik (en gauge jako przyrząd) |
| `gestosc` | ru | `натяжени` | kalka z UK „tension”; натяжение нити = naprężenie nitki, nie gęstość [DO SPRAWDZENIA] |
| `gestosc` | sv | `\bspänning` | kalka UK „tension” [DO SPRAWDZENIA] |
| `gestosc` | tr | `\bgerilim` | kalka „tension” [DO SPRAWDZENIA] |
| `gestosc` | uk | `калібр\|датчик` | kaliber/czujnik |
| `gestosc` | uk | `натяг` | kalka UK „tension” (naprężenie nitki) [DO SPRAWDZENIA] |
| `gestosc` | vi | `máy đo\|cái đo` | słownik: „gauge — an instrument for measuring … cái đo, máy đo” — przyrząd, nie gęstość dzianiny |
| `gestosc` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `gestosc` | zh-Hant | `規格\|隔距` | NAER gauge = 針織機規格/隔距 (parametr maszyny), nie gęstość robótki |
| `gestosc` | zh-Hant | `張力` | kalka UK „tension” [DO SPRAWDZENIA] |
| `blokowanie` | da | `\bspær` | blokada (kalka „block”) [DO SPRAWDZENIA] |
| `blokowanie` | de | `\b(sperr\|blockier)` | blokada ekranu/dostępu (kalka „block”) [DO SPRAWDZENIA] |
| `blokowanie` | et | `blokeeri` | blokowanie dostępu/ekranu [DO SPRAWDZENIA] |
| `blokowanie` | fi | `\b(esto\|estää\|lukit)` | blokada (kalka „block”) [DO SPRAWDZENIA] |
| `blokowanie` | ja | `ブロック(?!ング)` | ブロック = blokada/blok (IT), nie blokowanie dzianiny [DO SPRAWDZENIA] |
| `blokowanie` | ko | `차단\|잠금` | blokada (dostęp/ekran), nie wykończenie dzianiny |
| `blokowanie` | nb | `\bsperr` | blokada (kalka „block”) [DO SPRAWDZENIA] |
| `blokowanie` | nl | `\bblokker` | blokkeren = zablokować (ekran/konto); wzory NL mówią „(op)spannen” [DO SPRAWDZENIA] |
| `blokowanie` | ru | `блокировк[аи] (экрана\|доступа)` | blokada ekranu/dostępu |
| `blokowanie` | sv | `\bspärr` | spärr = blokada (kalka „block”) [DO SPRAWDZENIA] |
| `blokowanie` | uk | `блокуван` | blokada (ekranu, dostępu) [DO SPRAWDZENIA] |
| `blokowanie` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `blokowanie` | zh-Hant | `封端\|封段` | NAER blocking = 封端/封段 (termin przemysłowy) |
| `blokowanie` | zh-Hant | `封鎖\|阻擋\|鎖定` | blokada (dostęp/ekran) |
| `wloczka` | pl | `przędz` | „przędza” to termin techniczny/przemysłowy; w robótkach „włóczka” [DO SPRAWDZENIA] |
| `wloczka` | bg | `\bконец` | конец = nić; dla włóczki „прежда” (w opisach techniki „конец” bywa nitką roboczą) [DO SPRAWDZENIA] |
| `wloczka` | cs | `\bnit[ěi]?\b` | nit = nić (do szycia); dla włóczki „příze” — „nit” poprawne tylko jako pojedyncza nitka [DO SPRAWDZENIA] |
| `wloczka` | de | `\b(Nähgarn\|Zwirn)\b` | nić do szycia [DO SPRAWDZENIA] |
| `wloczka` | el | `κλωστ` | „κλωστή” = nić do szycia/haftu [DO SPRAWDZENIA] |
| `wloczka` | es | `\bhilo de coser\b` | nić do szycia |
| `wloczka` | fr | `\bfils? à coudre\b` | nić do szycia (w S-BDF-2525 osobna pozycja „Fil à coudre beige”) |
| `wloczka` | id | `\bbenang jahit` | nić do szycia [DO SPRAWDZENIA] |
| `wloczka` | ja | `縫い糸\|ミシン糸` | nić do szycia (NV: osobne kategorie 縫い糸, ミシン糸) |
| `wloczka` | ko | `재봉실\|바느질 ?실` | nić do szycia |
| `wloczka` | ms | `\byarn\b` | w DBP „yarn” = termin przemysłu tekstylnego; w robótce „benang” [DO SPRAWDZENIA] |
| `wloczka` | pt | `\blinhas?\b` | „linha” = nić do szycia/kordonek (S-R4-ORG: „Uma agulha de coser, uma linha”) |
| `wloczka` | sk | `\bniť` | niť = nić do szycia (IATE: „šijacia niť”) [DO SPRAWDZENIA] |
| `wloczka` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `wloczka` | zh-Hant | `針織紗\|紗線` | termin przemysłowy (NAER knitting yarn: 針織紗) [紗線: DO SPRAWDZENIA] |
| `wloczka` | zh-Hant | `縫線\|縫紉線` | nić do szycia |
| `motek` | de | `\bSträhne` | Strähne = kosmyk (kalka „skein”) [DO SPRAWDZENIA] |
| `motek` | ja | `ボール` | kalka „ball” [DO SPRAWDZENIA] |
| `motek` | ja | `スケイン` | kalka „skein” [DO SPRAWDZENIA] |
| `motek` | ko | `스케인` | kalka „skein” [DO SPRAWDZENIA] |
| `motek` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `motek` | zh-Hant | `絞紗` | NAER skein/hank = 絞紗 (przemysł przędzalniczy); w aplikacji 線球 [DO SPRAWDZENIA] |
| `zapas` | cs | `skrýš` | kryjówka [DO SPRAWDZENIA] |
| `zapas` | de | `\bVersteck` | kryjówka (kalka „stash”) [DO SPRAWDZENIA] |
| `zapas` | ja | `隠し場所\|へそくり` | kalka „stash” jako kryjówka/oszczędności |
| `zapas` | nl | `\b(verstopplaats\|bergplaats)\b` | kryjówka (kalka „stash”) [DO SPRAWDZENIA] |
| `zapas` | ru | `заначк\|тайник` | kryjówka/schowek [DO SPRAWDZENIA] |
| `zapas` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `zapas` | zh-Hant | `藏匿\|私藏` | kalka „stash” jako kryjówka |
| `grubosc_wloczki` | pl | `(?<![\p{L}])wag[aię]\s+włóczk` | kalka „yarn weight” — w pl grubość, nie waga [DO SPRAWDZENIA] |
| `grubosc_wloczki` | cs | `\bváh\|hmotnost` | w kontekście kategorii grubości: weight ≠ masa (dla masa_motka poprawne) [DO SPRAWDZENIA] |
| `grubosc_wloczki` | da | `\bvægt\b` | vægt = masa (pojęcie masa_motka), nie kategoria grubości [DO SPRAWDZENIA] |
| `grubosc_wloczki` | de | `\bGewicht\b` | Gewicht = masa (pojęcie masa_motka), nie kategoria grubości [DO SPRAWDZENIA] |
| `grubosc_wloczki` | el | `βάρος` | „weight” jako masa [DO SPRAWDZENIA] |
| `grubosc_wloczki` | es | `\bpeso\b` | kalka „weight” w znaczeniu grubości (tak CYC-ES: „Sistema de Peso”); poprawne tylko dla masy motka [DO SPRAWDZENIA] |
| `grubosc_wloczki` | fi | `\bpaino\b` | paino = masa (S-RAU-FI „1000 m lankaa painaa 570 g”), nie kategoria grubości |
| `grubosc_wloczki` | fr | `\bpoids\b` | kalka „weight” w znaczeniu grubości; „poids” poprawne tylko dla masy motka (pojęcie masa_motka). Uwaga: sam CYC-FR w przypisie pisze „fils de poids dentelles” [DO SPRAWDZENIA] |
| `grubosc_wloczki` | id | `\bberat\b` | „weight” jako masa — tu kategoria grubości [DO SPRAWDZENIA] |
| `grubosc_wloczki` | it | `\bpeso\b` | kalka „weight” w znaczeniu grubości; poprawne tylko dla masy motka [DO SPRAWDZENIA] |
| `grubosc_wloczki` | ja | `重さ\|重量` | „weight” jako masa; grubość nici to 太さ (masa motka to osobne pojęcie 重量) |
| `grubosc_wloczki` | ko | `무게\|중량` | „weight” jako masa; grubość to 굵기 (masa motka = 중량) |
| `grubosc_wloczki` | ms | `\bberat\b` | „weight” jako masa [DO SPRAWDZENIA] |
| `grubosc_wloczki` | nb | `\bvekt\b` | vekt = masa (pojęcie masa_motka), nie kategoria grubości [DO SPRAWDZENIA] |
| `grubosc_wloczki` | nl | `\bgewicht\b` | gewicht = masa włóczki (S-SCH „Schema 1: Gewicht volgens juiste stekenverhouding … niet te weinig garen”), nie kategoria grubości |
| `grubosc_wloczki` | pt | `\bpeso\b` | kalka „weight” w znaczeniu grubości; poprawne tylko dla masy motka [DO SPRAWDZENIA] |
| `grubosc_wloczki` | pt-BR | `\bpeso\b` | kalka „weight” w znaczeniu grubości; poprawne tylko dla masy [DO SPRAWDZENIA] |
| `grubosc_wloczki` | ro | `\bgreutate` | „weight” jako masa — kategoria grubości to nie masa [DO SPRAWDZENIA] |
| `grubosc_wloczki` | ru | `\bвес пряжи` | masa, nie grubość [DO SPRAWDZENIA] |
| `grubosc_wloczki` | sv | `\bvikt\b` | vikt = masa (pojęcie masa_motka), nie kategoria grubości [DO SPRAWDZENIA] |
| `grubosc_wloczki` | tr | `\bağırlı` | „weight” jako masa [DO SPRAWDZENIA] |
| `grubosc_wloczki` | uk | `\bвага пряж` | masa, nie grubość [DO SPRAWDZENIA] |
| `grubosc_wloczki` | vi | `trọng lượng` | „weight” jako masa [DO SPRAWDZENIA] |
| `grubosc_wloczki` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `grubosc_wloczki` | zh-Hant | `重量` | „weight” jako masa; grubość to 粗細 |
| `grubosc_wloczki` | zh-Hant | `支數` | 支數 = numer przędzy (przemysł, NAER yarn count 紗支數) |
| `masa_motka` | ja | `太さ` | 太さ = grubość nici, nie masa motka |
| `masa_motka` | ko | `굵기` | 굵기 = grubość nici, nie masa |
| `masa_motka` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `masa_motka` | zh-Hant | `粗細` | 粗細 = grubość, nie masa |
| `metraz` | ja | `ヤーデージ` | kalka „yardage” [DO SPRAWDZENIA] |
| `metraz` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `etykieta_wloczki` | fr | `\blabels?\b` | anglicyzm |
| `etykieta_wloczki` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `wloczka_lace` | es | `\blist[oó]n\b` | „listón” (= listwa/wstążka) to błąd przekładu CYC-ES dla kategorii Lace |
| `wloczka_lace` | es-419 | `\blist[oó]n\b` | „listón” to błąd przekładu CYC-ES dla kategorii Lace |
| `wloczka_lace` | ja | `レース編み` | レース編み = technika (koronka szydełkowa), nie kategoria grubości |
| `wloczka_lace` | ko | `레이스뜨기` | technika koronkowa, nie kategoria grubości [DO SPRAWDZENIA] |
| `wloczka_lace` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `druty` | pl | `(?<![\p{L}])igł` | „needles” w robótkach to druty, nie igły (igła dziewiarska to inne narzędzie) |
| `druty` | cs | `\bjehl(?:a\|y\|e\|u\|ou\|ám\|ami\|ách)\b` | jehla = igła do szycia (KOS/KNC: „jehla needle”); dziewiarskie „jehlice” |
| `druty` | da | `\b(synål\|stoppenål)` | igła do szycia/cerowania (S-MAY2-DA „Synål”, S-RIT-DA „Stoppenål”) |
| `druty` | de | `\bNähnadel` | igła do szycia |
| `druty` | de | `\bDraht` | kalka z pl „drut” (drut metalowy) [DO SPRAWDZENIA] |
| `druty` | es | `\bagujas? de coser\b` | igła do szycia |
| `druty` | es-419 | `\bagujas? de coser\b` | igła do szycia |
| `druty` | et | `(?<!heegel)nõel` | „nõel” = igła do szycia; wyjątek „heegelnõel” (szydełko) |
| `druty` | fi | `\bneula` | neula = igła (S-PRI-FI „viimeistelyneulan”, „neulansilmään”) |
| `druty` | fr | `\baiguilles? à (?:coudre\|broder)\b` | igła do szycia/haftu |
| `druty` | hu | `varrótű` | igła do szycia |
| `druty` | id | `\bjarum jahit` | igła do szycia (źródło odróżnia „jarum jahit biasa”) |
| `druty` | it | `\baghi?\b` | „ago” = igła (np. „ago da lana” do zszywania, S-LG), nie drut |
| `druty` | ja | `縫い針\|まち針` | igła do szycia / szpilka (NV: osobne kategorie 縫い針, まち針) |
| `druty` | ja | `ニードル` | „needle” w ja = igła (np. do filcowania) [DO SPRAWDZENIA] |
| `druty` | ko | `재봉 ?바늘\|바느질 ?바늘\|돗바늘` | igła do szycia / igła tapicerska (돗바늘 to igła do zszywania dzianiny, inne narzędzie) |
| `druty` | lt | `\badat` | adata = igła do szycia [DO SPRAWDZENIA] |
| `druty` | lv | `šujadat` | igła do szycia [DO SPRAWDZENIA] |
| `druty` | ms | `\bjarum jahit` | igła do szycia [DO SPRAWDZENIA] |
| `druty` | nb | `\b(stoppenål\|synål)` | igła do szycia/cerowania (S-PAN-NB „fest den med en stoppenål”) |
| `druty` | pt | `\bagulhas? de (?:coser\|tape[cç]aria)\b` | igła do szycia/zszywania (S-R4-SERAFIM „Agulha de tapeçaria”) |
| `druty` | ro | `\bac(ul\|e\|ele)?\b` | „ac” = igła do szycia (źródło: „se ascunde, cu acul, sub ochiurile”) — nie drut |
| `druty` | ru | `\bигл` | игла/иглы = igła do szycia |
| `druty` | sk | `\bihl(?:a\|y\|e\|u\|ou\|ám\|ami\|ách)\b` | ihla = igła do szycia ([nazwa] SK ma osobną kategorię „Ihly” obok „Pletacie ihlice”) |
| `druty` | sv | `\b(synål\|stoppnål)` | igła do szycia [DO SPRAWDZENIA] |
| `druty` | tr | `\biğne` | „iğne” = igła do szycia; (wyjątek: nazwa oczka „sık iğne” w szydełku) [DO SPRAWDZENIA] |
| `druty` | uk | `\bголк` | голка = igła do szycia (S-RAN-UK7: „Голка для зшивання”) |
| `druty` | vi | `kim khâu` | „kim khâu” = igła do szycia (słownik: „used in sewing”) |
| `druty` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `druty` | zh-Hant | `織針` | NAER knitting needle = 織針 (igła maszyny dziewiarskiej) |
| `druty` | zh-Hant | `縫衣針\|縫針` | igła do szycia |
| `szydelko` | pl | `(?<![\p{L}])ha(?:k\|cz)` | „hook” to szydełko, nie hak/haczyk |
| `szydelko` | cs | `\bhák` | hák = hak [DO SPRAWDZENIA] |
| `szydelko` | da | `\bkrog\b` | krog = hak (kalka „hook”) [DO SPRAWDZENIA] |
| `szydelko` | de | `\bHaken\b` | Haken = hak/haczyk (kalka „hook”) [DO SPRAWDZENIA] |
| `szydelko` | el | `γάντζ` | „γάντζος” = hak (kalka „hook”) [DO SPRAWDZENIA] |
| `szydelko` | es | `\banzuelos?\b` | haczyk wędkarski |
| `szydelko` | et | `\bkonks` | hak ogólny |
| `szydelko` | fr | `\bhame[cç]ons?\b` | haczyk wędkarski [DO SPRAWDZENIA] |
| `szydelko` | id | `\bkait\b` | „kait” = hak/haczyk (kalka); w ms poprawne, w id nie [DO SPRAWDZENIA] |
| `szydelko` | it | `\bganc[ie]` | hak [DO SPRAWDZENIA] |
| `szydelko` | ja | `フック` | kalka „hook” [DO SPRAWDZENIA] |
| `szydelko` | ko | `갈고리\|후크` | kalka „hook” (hak) [DO SPRAWDZENIA] |
| `szydelko` | lt | `\bkabl` | hak ogólny [DO SPRAWDZENIA] |
| `szydelko` | ms | `\bcangkuk\b` | „cangkuk” = hak (kalka „hook”) [DO SPRAWDZENIA] |
| `szydelko` | ms | `\bmata kail\b` | haczyk wędkarski (DBP: „fish hook, mata kail”) |
| `szydelko` | nb | `\bkrok\b` | krok = hak (kalka „hook”) [DO SPRAWDZENIA] |
| `szydelko` | ro | `\bc[âa]rlig` | kalka „hook” (hak) [DO SPRAWDZENIA] |
| `szydelko` | ru | `\bкрюк\b` | hak (ogólny), nie szydełko |
| `szydelko` | sv | `\bkrok\b` | krok = hak (kalka „hook”) [DO SPRAWDZENIA] |
| `szydelko` | tr | `\bkanca` | kanca = hak (kalka „hook”) [DO SPRAWDZENIA] |
| `szydelko` | uk | `крючок` | rusycyzm; ukr. podręcznik: „гачок” [DO SPRAWDZENIA] |
| `szydelko` | vi | `lưỡi câu` | haczyk wędkarski (słownik: hook → „lưỡi câu”) |
| `szydelko` | vi | `cái móc\|cái mắc` | wieszak/haczyk (słownik: hook → „cái móc; cái mắc”) — nie szydełko |
| `szydelko` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `szydelko` | zh-Hant | `掛鉤\|魚鉤` | kalka „hook” (hak) |
| `druty_z_zylka` | de | `\bkreisförmig` | kalka „circular” [DO SPRAWDZENIA] |
| `druty_z_zylka` | ja | `サーキュラー` | kalka „circular” [DO SPRAWDZENIA] |
| `druty_z_zylka` | ko | `원형 ?바늘` | kalka „circular needle” [DO SPRAWDZENIA] |
| `druty_z_zylka` | nl | `\bcirculaire naald` | kalka „circular needle” [DO SPRAWDZENIA] |
| `druty_z_zylka` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `druty_z_zylka` | zh-Hant | `環形針\|圓針` | forma kontynentalna/kalka „circular needle” [DO SPRAWDZENIA] |
| `rozmiar_drutu` | ja | `サイズ` | „size” w ja zwykle rozmiar ubrania; grubość drutu to 号数 [DO SPRAWDZENIA] |
| `rozmiar_drutu` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `oczko_prawe` | cs | `\bprav[éáý]\s+ok` | kalka z pl/de „prawe oczko”; w cs „hladce” [DO SPRAWDZENIA] |
| `oczko_prawe` | de | `\brichtig` | kalka „right” w sensie „poprawny” [DO SPRAWDZENIA] |
| `oczko_prawe` | fr | `\bmailles? droites?\b` | kalka z pl „prawe” [DO SPRAWDZENIA] |
| `oczko_prawe` | it | `\bmagli[ae] destr` | kalka z pl „prawe” [DO SPRAWDZENIA] |
| `oczko_prawe` | lt | `dešin(ė\|i)(oji)? akis` | kalka z pl „oczko prawe” [DO SPRAWDZENIA] |
| `oczko_prawe` | nl | `\b(juist\|correct)\b` | kalka „right” = poprawny [DO SPRAWDZENIA] |
| `oczko_prawe` | pt | `\btric[oô]\b` | w pt-BR „ponto tricô” = oczko LEWE; w pt-PT „tricot” = robienie na drutach — nie używać jako nazwy oczka |
| `oczko_prawe` | ru | `правая петля\|прав(ой\|ая) петл` | kalka z pl „oczko prawe”/de „rechte Masche” [DO SPRAWDZENIA] |
| `oczko_prawe` | uk | `прав(а\|ої) петл` | kalka z pl „oczko prawe” [DO SPRAWDZENIA] |
| `oczko_prawe` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `oczko_prawe` | zh-Hant | `正針` | konwencja kontynentalna (正针) [DO SPRAWDZENIA] |
| `oczko_lewe` | cs | `\blev[éáý]\s+ok` | kalka z pl/de „lewe oczko”; w cs „obrace” [DO SPRAWDZENIA] |
| `oczko_lewe` | de | `\bPerlmasche` | kalka „purl”; Perlmuster to inny ścieg (S-JUN „Großes Perlmuster”: 1 M re, 1 M li) |
| `oczko_lewe` | es | `\bpuntos? izquierdos?\b` | kalka z pl „lewe” [DO SPRAWDZENIA] |
| `oczko_lewe` | es-419 | `\bpuntos? izquierdos?\b` | kalka z pl „lewe” [DO SPRAWDZENIA] |
| `oczko_lewe` | fr | `\bmailles? gauches?\b` | kalka z pl „lewe” [DO SPRAWDZENIA] |
| `oczko_lewe` | it | `\bmagli[ae] sinistr` | kalka z pl „lewe” [DO SPRAWDZENIA] |
| `oczko_lewe` | lt | `kair(ė\|i)(oji)? akis` | kalka z pl „oczko lewe” [DO SPRAWDZENIA] |
| `oczko_lewe` | nl | `\bparelsteek` | kalka „purl”; parelsteek to ścieg ryżowy (wiedza) [DO SPRAWDZENIA] |
| `oczko_lewe` | pt | `\bponto tric[oô]\b` | forma pt-BR (S-CIR), w pt-PT niezrozumiała jako oczko lewe |
| `oczko_lewe` | pt-BR | `\bmalha de liga\b` | forma pt-PT; w pt-BR „ponto tricô” [DO SPRAWDZENIA] |
| `oczko_lewe` | ru | `лев(ая\|ой) петл` | kalka z pl „oczko lewe” [DO SPRAWDZENIA] |
| `oczko_lewe` | uk | `лів(а\|ої) петл` | kalka z pl „oczko lewe” [DO SPRAWDZENIA] |
| `oczko_lewe` | vi | `mũi đan móc` | słownik daje „purl — mũi đan móc”, ale „móc” = szydełko — ryzyko pomylenia z oczkiem szydełkowym |
| `oczko_lewe` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `oczko_lewe` | zh-Hant | `泊爾` | NAER purl stitch = 泊爾針法 (transliteracja przemysłowa) |
| `oczko_lewe` | zh-Hant | `反針` | konwencja kontynentalna (反针) [DO SPRAWDZENIA] |
| `nabieranie_oczek` | pl | `narzucani` | „narzucanie oczek” (S-BAR) koliduje z „narzut” (yo) |
| `nabieranie_oczek` | cs | `\bnab[ií]r\|\bnabrat` | nabrat = podjąć oczka z brzegu (KOS: „nabrat pick up”), nie nabieranie oczek |
| `nabieranie_oczek` | de | `\baufnehmen\b` | w S-JUN „aufn aufnehmen” = nabieranie oczek z brzegu (pick up), nie nabieranie na początku robótki |
| `nabieranie_oczek` | sk | `\bnabra` | nabrať = podjąć oczko (KLB: „N – nabrať očko”), nie nabieranie oczek |
| `nabieranie_oczek` | sl | `\bpobira` | pobirati zanke = podnosić spuszczone oczka (Fran: „pobirati zanke na nogavicah”) |
| `nabieranie_oczek` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `nabieranie_oczek` | zh-Hant | `起圈\|上機` | NAER cast on = 起圈，針織上機 (maszyna) |
| `zamykanie_oczek` | da | `\bhæft` | hæfte ender = chowanie nitek (S-MAY-DA „Hæft ender”), nie zamykanie oczek |
| `zamykanie_oczek` | de | `\bschließ` | schließen = zszywanie szwów (S-LG-DE „Schulternähte schließen”), nie zamykanie oczek |
| `zamykanie_oczek` | fr | `\bfermer (?:les\|toutes les) mailles\b` | kalka z pl „zamykanie oczek” [DO SPRAWDZENIA]; w szydełku „fermées ensemble” (S-BDF-2525) jest poprawne — to inne pojęcie |
| `zamykanie_oczek` | ja | `引き抜き編み` | 引き抜き編み = oczko zamykające szydełkowe (sl st), nie zamykanie oczek na drutach |
| `zamykanie_oczek` | ko | `빼뜨기` | 빼뜨기 = oczko zamykające szydełkowe (sl st), nie zamykanie na drutach |
| `zamykanie_oczek` | nl | `\bafhecht` | afhechten = wykańczanie/chowanie nitek (S-SCH „Hecht alle draadjes af”), nie zamykanie oczek |
| `zamykanie_oczek` | ru | `спуст` | спустить петлю = spuścić (zgubić) oczko [DO SPRAWDZENIA] |
| `zamykanie_oczek` | sv | `\bstäng` | kalka „close/cast off” [DO SPRAWDZENIA] |
| `zamykanie_oczek` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `zamykanie_oczek` | zh-Hant | `脫圈\|織完` | NAER cast off = 脫圈；織完 (maszyna) |
| `zamykanie_oczek` | zh-Hant | `引拔針` | 引拔針 = sl st szydełkowe, nie zamykanie oczek na drutach |
| `ujmowanie` | pl | `zamykan` | „zamykanie” w pl częściej = zakańczanie (bind off) |
| `ujmowanie` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `dodawanie` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `narzut` | de | `\bGarn\s+über` | dosłowna kalka „yarn over” [DO SPRAWDZENIA] |
| `narzut` | ru | `воздушн` | „воздушная петля” = oczko łańcuszka (szydełko), nie narzut; EKI podaje ją błędnie jako odpowiednik et „õhksilmus” |
| `narzut` | uk | `повітрян` | повітряна петля = oczko łańcuszka (szydełko), nie narzut |
| `narzut` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `narzut` | zh-Hant | `繞線` | kalka „yarn over” [DO SPRAWDZENIA] |
| `dwa_razem_na_prawo` | ja | `右上2目一度` | 右上2目一度 to ssk, nie k2tog |
| `dwa_razem_na_prawo` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `dwa_razem_na_prawo` | zh-Hant | `右上2併針` | 右上2併針 = ssk, nie k2tog |
| `scieg_francuski` | cs | `francouzsk` | kalka z pl „ścieg francuski” [DO SPRAWDZENIA] |
| `scieg_francuski` | de | `\b(Strumpfband\|Hosenband)` | kalka „garter” (podwiązka) [DO SPRAWDZENIA] |
| `scieg_francuski` | de | `\bfranzösisch` | kalka z pl „ścieg francuski” [DO SPRAWDZENIA] |
| `scieg_francuski` | es | `\bpunto (?:de )?liga\b` | kalka z en „garter” [DO SPRAWDZENIA] |
| `scieg_francuski` | es | `\bpunto franc[eé]s\b` | kalka z pl „ścieg francuski” [DO SPRAWDZENIA] |
| `scieg_francuski` | et | `prantsus` | kalka z pl „ścieg francuski” |
| `scieg_francuski` | fr | `\bpoint (?:de )?jarreti[eè]re\b` | kalka z en „garter” [DO SPRAWDZENIA] |
| `scieg_francuski` | fr | `\bpoint fran[cç]ais\b` | kalka z pl „ścieg francuski” [DO SPRAWDZENIA] |
| `scieg_francuski` | hu | `francia` | kalka z pl „ścieg francuski” (franciakötés w IATE = „French knitting”, inna technika) |
| `scieg_francuski` | it | `\bpunto francese\b` | kalka z pl „ścieg francuski” [DO SPRAWDZENIA] |
| `scieg_francuski` | lt | `prancūz` | kalka z pl „ścieg francuski” |
| `scieg_francuski` | nl | `\bfranse steek` | kalka z pl „ścieg francuski” [DO SPRAWDZENIA] |
| `scieg_francuski` | nl | `\bkousenband` | kalka „garter” [DO SPRAWDZENIA] |
| `scieg_francuski` | ru | `французск` | kalka z pl „ścieg francuski” |
| `scieg_francuski` | ru | `гартер` | kalka z en garter |
| `scieg_francuski` | uk | `французьк` | kalka z pl „ścieg francuski” |
| `scieg_francuski` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `sciagacz` | ja | `リブ` | kalka „rib” [DO SPRAWDZENIA] |
| `sciagacz` | ko | `리브` | kalka „rib” [DO SPRAWDZENIA] |
| `sciagacz` | nl | `\bribbel` | fałszywy przyjaciel en „rib”: ribbel(steek) = ścieg francuski (S-SCHK2-NL), nie ściągacz |
| `sciagacz` | vi | `xương sườn\|\bsườn\b` | słownik: „rib — xương sườn”/„sườn” (żebro anatomiczne) — kalka |
| `sciagacz` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `sciagacz` | zh-Hant | `羅紋` | NAER rib stitch = 羅紋針法 (przemysł/konwencja kontynentalna 罗纹) [DO SPRAWDZENIA] |
| `lancuszek` | da | `\bkæde\b` | kalka „chain”; kædemaske (km) to oczko zamykające (S-MAY-DA), więc „kæde-” myli pojęcia |
| `lancuszek` | de | `\bKette\b` | Kette = łańcuch (kalka „chain”); poprawnie Luftmasche, ciąg = Luftmaschenkette [DO SPRAWDZENIA] |
| `lancuszek` | et | `õhksilm` | õhksilmus = narzut, nie łańcuszek (pułapka z ru „воздушная петля”) |
| `lancuszek` | nb | `\bkjede\b` | kalka „chain”; kjedemaske = oczko zamykające (S-PAN-NB), więc „kjede-” myli pojęcia |
| `lancuszek` | nl | `\bketting` | kalka „chain” [DO SPRAWDZENIA] |
| `lancuszek` | ru | `\bцеп(ь\|и)\b` | łańcuch ogólny; w szydełku „цепочка” [DO SPRAWDZENIA] |
| `lancuszek` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `lancuszek` | zh-Hant | `鎖鏈針步\|鏈狀針法` | NAER chain stitch = ścieg łańcuszkowy w szyciu |
| `oczko_zamykajace_szyd` | de | `\b(Schlupfmasche\|Gleitmasche)` | kalka „slip stitch” [DO SPRAWDZENIA] |
| `oczko_zamykajace_szyd` | fi | `\bliukusilmuk` | kalka „slip stitch” [DO SPRAWDZENIA] |
| `oczko_zamykajace_szyd` | ja | `すべり目` | すべり目 = oczko zdjęte na drutach (knit slip stitch), nie sl st szydełkowe |
| `oczko_zamykajace_szyd` | ja | `伏せ止め` | zamykanie oczek na drutach, nie sl st |
| `oczko_zamykajace_szyd` | ko | `코막음` | 코막음 = zamykanie oczek na drutach, nie sl st |
| `oczko_zamykajace_szyd` | ms | `\bpindah kait\b` | DBP: „slip stitch (knitting) pindah kait” — zdjęcie oczka na drutach, nie oczko szydełkowe |
| `oczko_zamykajace_szyd` | nl | `\b(glijsteek\|halve steek)\b` | kalka „slip stitch” [DO SPRAWDZENIA] |
| `oczko_zamykajace_szyd` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `oczko_zamykajace_szyd` | zh-Hant | `暗縫` | NAER slip stitch = 暗縫 (ścieg kryty w szyciu) |
| `oczko_zamykajace_szyd` | zh-Hant | `滑針` | 滑針 = oczko zdjęte na drutach, nie sl st szydełkowe |
| `oczko_scisle` | pl | `(?<![\p{L}])słup(?:ek\|ka\|ki)(?![\p{L}])` | „słupek” to US dc; kalka UK „double crochet” → słupek przesuwa ścieg |
| `oczko_scisle` | da | `\bdobbelt hækl` | kalka UK „double crochet” [DO SPRAWDZENIA] |
| `oczko_scisle` | de | `\bDoppel-?häkel` | kalka UK „double crochet” [DO SPRAWDZENIA] |
| `oczko_scisle` | de | `\beinfache Häkelmasche` | kalka US „single crochet” [DO SPRAWDZENIA] |
| `oczko_scisle` | es-419 | `\bcrochet sencillo\b` | kalka z en US „single crochet” (tak CYC-ES, który w tej samej tabeli błędnie pisze „32 a 42 punto alto”) |
| `oczko_scisle` | et | `topelt\|kahekordne sammas` | kalka UK „double crochet”; „kahekordne sammas” = wyższe oczko |
| `oczko_scisle` | ja | `長編み` | 長編み to US dc (słupek), nie sc |
| `oczko_scisle` | ko | `한길긴뜨기` | 한길긴뜨기 = US dc, nie sc (pułapka UK dc) |
| `oczko_scisle` | nl | `\bdubbele? haaksteek` | kalka UK „double crochet” [DO SPRAWDZENIA] |
| `oczko_scisle` | nl | `\benkele haaksteek` | kalka US „single crochet” [DO SPRAWDZENIA] |
| `oczko_scisle` | ru | `двойн(ой\|ые) столбик` | kalka UK „double crochet” — w ru „двойной столбик” oznacza wyższe oczko |
| `oczko_scisle` | ru | `полустолбик(?! с накид)` | kalka z pl „półsłupek”; w ru „полустолбик с накидом” = hdc |
| `oczko_scisle` | uk | `подвійн(ий\|і) стовпчик` | kalka UK „double crochet” |
| `oczko_scisle` | uk | `півстовпчик(?! (із\|з) накид)` | w uk „півстовпчик” = sl st; kalka z pl „półsłupek” |
| `oczko_scisle` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `oczko_scisle` | zh-Hant | `長針` | 長針 = US dc, nie sc (pułapka UK dc) |
| `oczko_scisle` | zh-Hant | `雙鉤` | kalka „double crochet” (UK sc) [DO SPRAWDZENIA] |
| `polslupek` | ko | `반 ?한길` | kalka „half double crochet” [DO SPRAWDZENIA] |
| `polslupek` | nl | `\bhalve vaste` | halve vaste = oczko zamykające (S-SCH „hv in eerste s om te sluiten”), nie półsłupek |
| `polslupek` | ro | `semipicioru[șş]` | „semipicioruș” = sl st (oczko zamykające; S-MD-EDT56: „Semipicioruș (ochi alunecat)”), nie półsłupek — fałszywy przyjaciel „semi-” |
| `polslupek` | tr | `yar[ıi]m s[ıi]k` | „yarım sık ilmek” = sl st (oczko zamykające), nie półsłupek — fałszywy przyjaciel „yarım” (MEGEP: „basit kroşe (yarım sık ilmek)”) |
| `polslupek` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `slupek` | pl | `podwójn\w* słup` | kalka „double crochet” → „podwójny słupek” to US tr |
| `slupek` | da | `\bdobbelt stangmaske` | dobbelt stangmaske = 2 narzuty, US treble (S-MAY-DA „dobbelt stangmaske dbstgm, slå garnet 2 gange om nålen”) |
| `slupek` | de | `\bDoppel-?stäbchen` | w S-JUN Doppel-Stäbchen = 2 narzuty (US treble); kalka „double crochet” daje zły ścieg |
| `slupek` | es | `\b(?:doble crochet\|crochet doble)\b` | kalka z en „double crochet” [DO SPRAWDZENIA] |
| `slupek` | es | `\bpunto alto doble\b` | = US tr ([nazwa]: „Punto alto doble / Triple crochet”), nie słupek |
| `slupek` | es-419 | `\b(?:doble crochet\|crochet doble)\b` | kalka z en „double crochet” [DO SPRAWDZENIA] |
| `slupek` | es-419 | `\bpunto alto doble\b` | = US tr ([nazwa]: „Punto alto doble / Triple crochet”), nie słupek |
| `slupek` | et | `kahekordne sammas` | „kahekordne sammas” = US tr (2 narzuty), kalka z „double crochet” [DO SPRAWDZENIA] |
| `slupek` | fi | `\bkaksoispylväs` | kaksoispylväs = US treble (wiedza) [DO SPRAWDZENIA] |
| `slupek` | fr | `\bdouble[- ]brides?\b` | „double bride” to US tr / UK dtr (osobny ścieg u [nazwa]), nie słupek — kalka z „double crochet” |
| `slupek` | it | `\bmagli[ae] alt[ae] dopp` | „maglia alta doppia” = US tr (S-LG-GRANNY wymienia osobno), nie słupek |
| `slupek` | ja | `長々編み` | 長々編み = US tr (słupek podwójny), nie dc |
| `slupek` | ja | `細編み` | 細編み = US sc (UK dc) — pułapka UK „double crochet” |
| `slupek` | ko | `두길긴뜨기` | 두길긴뜨기 = US tr (słupek podwójny), nie dc |
| `slupek` | ko | `더블 ?크로셰` | kalka „double crochet”, niejednoznaczna US/UK |
| `slupek` | nb | `\bdobbelstav` | dobbelstav = US treble (wiedza) [DO SPRAWDZENIA] |
| `slupek` | nl | `\bdubbel stokje` | dubbel stokje = US treble (wiedza) [DO SPRAWDZENIA] |
| `slupek` | pt | `\bponto alto duplo\b` | = US tr (słupek podwójny), nie słupek |
| `slupek` | pt-BR | `\bponto alto duplo\b` | = US tr (S-CIR: „pad. Ponto Alto Duplo”), nie słupek |
| `slupek` | ru | `двойн(ой\|ые) столбик` | kalka en „double crochet”; „двойной столбик” to w ru wyższe oczko (2 narzuty) |
| `slupek` | sv | `\bdubbelstolpe` | dubbelstolpe (dst) to osobny, wyższy ścieg na liście S-JAR – kalka „double crochet” da zły ścieg |
| `slupek` | uk | `подвійн(ий\|і) стовпчик` | kalka en „double crochet” |
| `slupek` | zh-Hant | `钩\|针\|编\|织\|线` | znaki uproszczone (Chiny kontynentalne); zh-Hant (TW/HK) pisze 鉤 針 編 織 線 |
| `slupek` | zh-Hant | `長長針` | 長長針 = US tr, nie dc |
| `slupek` | zh-Hant | `短針` | 短針 = US sc (UK dc) — pułapka UK „double crochet” |

## Nazwy kategorii grubości CYC 0–7 (P-298)

P-298 (koordynator wg P-087, 2026-10-30; D3 z P-281): wariant (c). W interfejsie zawsze widoczny numer kategorii 0–7; nazwa lokalna tylko tam, gdzie jest przeczytane źródło ze szczebla ≤ 3 (tu: es i fr z tabeli kategorii CYC, szczebel 1); w pozostałych językach numer + nazwa en. Odrzucone: (a) zawsze numer + nazwa en (wierne CYC, ale nazwa po angielsku także tam, gdzie źródło ma lokalną); (b) nazwy tłumaczone we wszystkich językach (dla 31 języków bez normy CYC i bez źródła szczebla ≤ 3; kalki).

Pozostałe języki: numer kategorii + nazwa en (lace, super fine, fine, light, medium, bulky, super bulky, jumbo) w każdym języku poza en i językami z tej sekcji; nazwa lokalna dochodzi dopiero z przeczytanym źródłem szczebla ≤ 3 (osobne badanie, nie w tej partii).

| kategoria | en | es | es-419 | fr |
|---|---|---|---|---|
| 0 | lace | Lace | Lace | Dentelle |
| 1 | super fine | Súper fino | Súper fino | Super fin |
| 2 | fine | Fino | Fino | Fin |
| 3 | light | Ligero | Ligero | Léger |
| 4 | medium | Medio | Medio | Moyen |
| 5 | bulky | Abultado | Abultado | Bulky |
| 6 | super bulky | Súper abultado | Súper abultado | Très épais |
| 7 | jumbo | Jumbo | Jumbo | Géant |

- **es** (S-CYC-ES, odczyt 2026-10-30, tabela „Sistema de Peso Estandar para Estambre”, nagłówek „Nuevos Nombres de la Categoria” (osiem komórek, kolejność 0–7; zgodna z kolejnością en w tabeli CYC)): „Liston \| Super fino \| Fino \| Ligero \| Medio \| Abultado \| Super Abultado \| Jumbo” — Pisownia „Súper” z akcentem to ortografia (strona CYC-ES bez znaków diakrytycznych), do przeglądu rodzimego. Wyjątek nazwany: kategoria 0 w CYC-ES to „Liston”, ale „listón” znaczy wstążka/listwa, a nie koronka (ocena na podstawie wiedzy; sprawdzenie w słowniku RAE niemożliwe w tej sesji, dle.rae.es zwraca 403 — [DO SPRAWDZENIA]); przypis CYC-ES do kategorii 0 mówi o „hilos de peso Listón … diseños abiertos, tipo encaje”, czyli o włóczce ażurowej. W interfejsie kategoria 0 = „Lace” (nazwa en) do przeglądu rodzimego es. Kalka „peso” w tytule systemu CYC-ES nie wchodzi do UI (zakaz w grubosc_wloczki es).

- **es-419** (S-CYC-ES, odczyt 2026-10-30, jak es; strona CYC-ES jest wydaniem hiszpańskim dla rynku USA): „Liston \| Super fino \| Fino \| Ligero \| Medio \| Abultado \| Super Abultado \| Jumbo” — Te same nazwy co es: źródło (CYC, wydanie es dla USA) obejmuje odbiorców hiszpańskojęzycznych w Ameryce; przeniesienie na es-419 to ocena, do przeglądu rodzimego es-419. Zastrzeżenia jak w es (kategoria 0).

- **fr** (S-CYC-FR, odczyt 2026-10-30, tabela „Système Standard de Grosseur”, nagłówek „Nouvelle Catégorie Noms” (osiem komórek, kolejność 0–7)): „Dentelle \| Super Fin \| Fin \| Léger \| Moyen \| Bulky \| Trés Épais \| Géant” — W źródle „Trés Épais” z błędnym akcentem; w UI „Très épais” (ortografia, do przeglądu rodzimego fr). Kategoria 5 w CYC-FR zostaje po angielsku („Bulky”) — źródło tak ją nazywa. „Dentelle” to też koronka jako technika: w UI zawsze z numerem 0 (patrz wloczka_lace fr). CYC-FR pisze też „fils de poids dentelles” w przypisie; ta kalka „poids” nie wchodzi do UI.

## Do sprawdzenia przez rodzimego użytkownika albo źródło (pewność niska)

- **pl** (10): znacznik_rzedu („znacznik”), blokowanie („blokowanie”), motek („motek”), zapas („zapas włóczki”), grubosc_wloczki („grubość włóczki”), masa_motka („waga motka”), metraz („długość nici w motku”), etykieta_wloczki („etykieta”), wloczka_lace („włóczka koronkowa”), rozmiar_drutu („rozmiar (mm)”)
- **bg** (14): licznik („брояч на редове”), czesc („част (детайл)”), blokowanie („блокиране”), motek („кълбо”), zapas („запас от прежда”), grubosc_wloczki („дебелина на преждата”), masa_motka („тегло на кълбото”), metraz („дължина”), wloczka_lace („прежда за дантела (lace)”), druty_z_zylka („кръгови игли”), nabieranie_oczek („набиране на бримки”), zamykanie_oczek („закриване на бримки”), scieg_francuski („всички редове лицево”), sciagacz („ластик”)
- **cs** (6): gestosc („hustota pletení”), zapas („zásoba příze”), masa_motka („hmotnost klubka (g)”), etykieta_wloczki („etiketa (příze)”), rozmiar_drutu („velikost (číslo) jehlic v mm”), oczko_zamykajace_szyd („pevné oko”)
- **da** (11): licznik („rækketæller”), powtorzenie („rapport”), znacznik_rzedu („markering”), blokowanie („spænde ud”), zapas („garnlager”), grubosc_wloczki („garntykkelse”), masa_motka („vægt pr. nøgle (g)”), metraz („løbelængde”), etykieta_wloczki („banderole”), wloczka_lace („lacegarn”), sciagacz („rib”)
- **de** (5): powtorzenie („Rapport”), znacznik_rzedu („Markierung”), zapas („Garnvorrat”), grubosc_wloczki („Garnstärke”), wloczka_lace („Lacegarn”)
- **el** (20): licznik („μετρητής σειρών”), czesc („κομμάτι”), schemat („διάγραμμα”), probka („δείγμα”), gestosc („πυκνότητα πλεξίματος”), blokowanie („μπλοκάρισμα”), motek („κουβάρι”), zapas („απόθεμα νημάτων”), grubosc_wloczki („πάχος νήματος”), masa_motka („βάρος κουβαριού (γρ.)”), metraz („μήκος (μ.)”), etykieta_wloczki („ετικέτα”), wloczka_lace („νήμα lace”), druty_z_zylka („κυκλικές βελόνες”), rozmiar_drutu („νούμερο βελόνας (mm)”), lancuszek („αλυσίδα”), oczko_zamykajace_szyd („τυφλό γαϊτανάκι”), oczko_scisle („κοντό ξυλάκι”), polslupek („μισό ψηλό ξυλάκι”), slupek („ψηλό ξυλάκι”)
- **es** (8): licznik („cuentavueltas”), znacznik_rzedu („marcador de vuelta”), blokowanie („bloquear”), zapas („reserva de lanas”), masa_motka („peso (del ovillo)”), metraz („metros por ovillo”), etykieta_wloczki („etiqueta”), druty_z_zylka („agujas circulares”)
- **es-419** (14): szydelkowac („tejer a crochet”), licznik („cuentavueltas”), znacznik_rzedu („marcador de vuelta”), blokowanie („bloquear”), motek („madeja”), zapas („reserva de lanas”), masa_motka („peso (del ovillo)”), metraz („metros por ovillo”), etykieta_wloczki („etiqueta”), druty_z_zylka („agujas circulares”), narzut („lazada”), scieg_francuski („punto santa clara”), lancuszek („cadena”), oczko_zamykajace_szyd („punto deslizado”)
- **et** (8): licznik („ridade loendur”), znacznik_rzedu („märkija (silmusemärkija)”), zapas („lõngavaru”), grubosc_wloczki („lõnga jämedus”), masa_motka („toki kaal”), metraz („lõnga pikkus tokis”), etykieta_wloczki („lõngasilt (banderoll)”), wloczka_lace („pitslõng (kategooria 0)”)
- **fi** (7): czesc („osa”), zapas („lankavarasto”), etykieta_wloczki („vyöte”), wloczka_lace („lace-lanka”), scieg_francuski („ainaoikeinneule”), polslupek („puolipylväs”), slupek („pylväs”)
- **fr** (6): licznik („compteur de rangs”), znacznik_rzedu („repère (de rang)”), blokowanie („blocage”), zapas („stock de fils”), masa_motka („poids (de la pelote)”), metraz („métrage”)
- **hr** (13): scieg_dzersejowy („glatki bod (desno lice)”), licznik („brojač redova”), czesc („dio”), znacznik_rzedu („oznaka (marker)”), gestosc („gustoća pletiva”), blokowanie („blokiranje”), zapas („zaliha pređe”), grubosc_wloczki („debljina pređe”), wloczka_lace („čipkasta pređa (lace)”), druty_z_zylka („kružne igle”), dodawanie („dodavanje očica”), narzut („omot (navoj)”), scieg_francuski („sve pravo (bod nabora)”)
- **hu** (41): robotka („kötés-horgolás”), dziergac_na_drutach („kötni”), szydelkowac („horgolni”), rzad („sor”), okrazenie („kör”), scieg („kötésminta (minta)”), scieg_dzersejowy („harisnyakötés (simakötés)”), licznik („sorszámláló”), czesc („darab (rész)”), powtorzenie („mintaismétlés”), wzor („leírás (minta)”), schemat („mintarajz (diagram)”), znacznik_rzedu („jelölő (szemjelölő)”), probka („próbadarab (mintadarab)”), gestosc („kötéssűrűség”), blokowanie („blokkolás (formára szárítás)”), motek („gombolyag”), zapas („fonalkészlet”), grubosc_wloczki („fonalvastagság”), masa_motka („gombolyag súlya”), metraz („futóhossz (méter/gombolyag)”), wloczka_lace („csipkefonal (0. kategória)”), druty („kötőtű”), szydelko („horgolótű”), druty_z_zylka („körkötőtű”), rozmiar_drutu („tűméret (mm)”), oczko_prawe („sima szem”), oczko_lewe („fordított szem”), nabieranie_oczek („szemfelszedés”), zamykanie_oczek („leláncolás (szemek lezárása)”), ujmowanie („fogyasztás”), dodawanie („szaporítás”), narzut („ráhajtás”), dwa_razem_na_prawo („2 szem simán együtt”), scieg_francuski („lustakötés”), sciagacz („patentkötés / bordáskötés (1 sima, 1 fordított)”), lancuszek („láncszem”), oczko_zamykajace_szyd („kispálca (hamispálca)”), oczko_scisle („rövidpálca (US sc)”), polslupek („félpálca”), slupek („egyráhajtásos pálca (US dc)”)
- **id** (24): dziergac_na_drutach („merajut dengan jarum”), scieg („pola tusuk”), scieg_dzersejowy („stockinette”), licznik („penghitung baris”), czesc („bagian”), probka („sampel rajutan”), gestosc („gauge (kerapatan rajutan)”), blokowanie („blocking”), zapas („stok benang”), grubosc_wloczki („ketebalan benang”), metraz („panjang benang (m)”), wloczka_lace („benang lace”), druty („jarum rajut”), druty_z_zylka („jarum rajut sirkular”), oczko_prawe („tusuk knit”), oczko_lewe („tusuk purl”), nabieranie_oczek („cast on”), zamykanie_oczek („bind off”), ujmowanie („pengurangan tusuk”), dodawanie („penambahan tusuk”), narzut („yarn over”), dwa_razem_na_prawo („k2tog (2 tusuk knit bersamaan)”), scieg_francuski („garter stitch”), sciagacz („rib”)
- **it** (5): znacznik_rzedu („segnariga”), blokowanie („bloccaggio”), zapas („scorta di filati”), grubosc_wloczki („spessore del filato”), wloczka_lace („lace (filato per pizzo)”)
- **ja** (3): licznik („段数カウンター”), czesc („パーツ”), znacznik_rzedu („マーカー”)
- **ko** (7): licznik („카운터”), czesc („파트”), blokowanie („블로킹”), zapas („보유 실”), etykieta_wloczki („라벨”), wloczka_lace („레이스실”), dwa_razem_na_prawo („왼코 겹치기”)
- **lt** (14): scieg_dzersejowy („lygus mezgimas (lygusis raštas)”), czesc („detalė”), powtorzenie („raporto kartojimas (raportas)”), probka („bandinys (mezgimo pavyzdys)”), zapas („siūlų atsargos”), etykieta_wloczki („etiketė”), wloczka_lace („nėriniams skirti siūlai (0 kategorija)”), scieg_francuski („keliaraštis (visos akys geros)”), sciagacz („rantai (rantinis raštas)”), lancuszek („oro akis (oro akių grandinėlė)”), oczko_zamykajace_szyd („jungiamoji akis”), oczko_scisle („stulpelis be apvijos (US sc)”), polslupek („pusstulpis su apvija”), slupek („stulpelis su apvija (US dc)”)
- **lv** (27): okrazenie („aplis (adīt pa apli)”), licznik („rindu skaitītājs”), czesc („detaļa”), powtorzenie („raksta atkārtojums (raports)”), wzor („apraksts”), znacznik_rzedu („marķieris”), probka („paraugs”), gestosc („adīšanas blīvums”), blokowanie („blokēšana (mitrā apstrāde)”), zapas („dziju krājums”), grubosc_wloczki („[nazwa] biezums”), wloczka_lace („mežģīņu dzija (0. kategorija)”), oczko_prawe („labiskais valdziņš”), oczko_lewe („kreiliskais valdziņš”), nabieranie_oczek („valdziņu uzmešana”), zamykanie_oczek („valdziņu nodarīšana (nobeigšana)”), ujmowanie („valdziņu sarukums (noraukšana)”), dodawanie („valdziņu piemešana”), narzut („apmetiens”), dwa_razem_na_prawo („2 valdziņi kopā labiski”), scieg_francuski („rievu adījums (abpusēji labiski)”), sciagacz („valnītis (ribu adījums)”), lancuszek („gaisa valdziņš (ķēdīte)”), oczko_zamykajace_szyd („ievilktais valdziņš”), oczko_scisle („īsais stabiņš (US sc)”), polslupek („pusstabiņš”), slupek („garais stabiņš (US dc)”)
- **ms** (24): okrazenie („pusingan”), scieg_dzersejowy („jahit stokin”), licznik („pembilang baris”), czesc („bahagian”), powtorzenie („ulangan”), wzor („corak”), schemat („rajah corak”), znacznik_rzedu („penanda”), blokowanie („blocking”), zapas („simpanan benang”), grubosc_wloczki („ketebalan benang”), masa_motka („berat segegelung (g)”), metraz („panjang benang (m)”), etykieta_wloczki („label benang”), wloczka_lace („benang lace”), druty_z_zylka („jarum kait bulat”), rozmiar_drutu („saiz jarum (mm)”), nabieranie_oczek („mula mata kait”), ujmowanie („kurangkan mata kait”), dodawanie („tambah mata kait”), narzut („lilit benang”), dwa_razem_na_prawo („kait dua bersama”), oczko_scisle („[DO SPRAWDZENIA]”), polslupek („separuh sekali belit”)
- **nb** (11): scieg („strikkemønster”), licznik („omgangsteller”), powtorzenie („rapport”), blokowanie („blokking”), zapas („garnlager”), grubosc_wloczki („garntykkelse”), etykieta_wloczki („banderole”), wloczka_lace („lacegarn”), ujmowanie („felling”), dwa_razem_na_prawo („strikk 2 masker rett sammen”), scieg_francuski („rillestrikk”)
- **nl** (8): licznik („toerenteller”), zapas („garenvoorraad”), grubosc_wloczki („garendikte”), etykieta_wloczki („banderol”), wloczka_lace („lacegaren”), dodawanie („meerderen”), sciagacz („boordsteek”), polslupek („half stokje”)
- **pt** (9): okrazenie („volta”), licznik („contador de carreiras”), czesc („parte”), schemat („gráfico”), znacznik_rzedu („marcador de carreira”), blokowanie („blocar”), zapas („fios em casa (stash)”), masa_motka („peso (g)”), oczko_zamykajace_szyd („ponto baixíssimo”)
- **pt-BR** (16): okrazenie („volta”), licznik („contador de carreiras”), czesc („parte”), znacznik_rzedu („marcador de carreira”), probka („amostra”), gestosc („amostra”), blokowanie („blocagem”), zapas („estoque de fios”), grubosc_wloczki („espessura do fio”), masa_motka („peso (g)”), metraz („metragem”), etykieta_wloczki („etiqueta”), wloczka_lace („fio lace”), druty_z_zylka („agulha circular”), rozmiar_drutu („número da agulha”), sciagacz („ponto sanfona”)
- **ro** (10): licznik („numărător de rânduri”), czesc („piesă”), wzor („model”), znacznik_rzedu („marcaj”), blokowanie („călcare (prin cârpă umedă)”), zapas („stoc de fire”), masa_motka („greutatea ghemului (g)”), metraz („lungimea firului (m)”), wloczka_lace („fir foarte subțire (lace)”), polslupek („[DO SPRAWDZENIA]”)
- **ru** (7): licznik („счётчик рядов”), blokowanie („блокировка (влажно-тепловая обработка)”), zapas („запас пряжи”), grubosc_wloczki („толщина пряжи”), masa_motka („вес мотка”), etykieta_wloczki („этикетка (пряжи)”), wloczka_lace („пряжа для кружевного вязания (категория 0)”)
- **sk** (9): scieg_dzersejowy („lícový džerzej”), licznik („počítadlo riadkov”), blokowanie („blokovanie”), zapas („zásoba priadze”), grubosc_wloczki („hrúbka priadze”), masa_motka („hmotnosť klbka (g)”), metraz („návin (dĺžka)”), etykieta_wloczki („etiketa”), wloczka_lace („čipková priadza (lace)”)
- **sl** (12): okrazenie („krog”), schemat („shema”), znacznik_rzedu („označevalec”), gestosc („gostota pletenja”), blokowanie („blokiranje”), zapas („zaloga preje”), grubosc_wloczki („debelina preje”), masa_motka („teža klobčiča”), metraz („dolžina preje (metraža)”), wloczka_lace („čipkasta preja (lace)”), scieg_francuski („vse desno (kodrasti vzorec)”), oczko_zamykajace_szyd („vezna petlja”)
- **sr** (19): robotka („плетење и хеклање”), scieg_dzersejowy („глатки бод”), licznik („бројач редова”), czesc („део”), powtorzenie („понављање мустре”), znacznik_rzedu („маркер”), gestosc („густина плетења”), blokowanie („блокирање”), wloczka („вуница”), zapas („залиха вунице”), grubosc_wloczki („дебљина вунице”), masa_motka („тежина клупка”), metraz („дужина конца”), etykieta_wloczki („етикета”), wloczka_lace („вуница за чипку (lace)”), rozmiar_drutu („број игле (mm)”), zamykanie_oczek („затварање петљи”), dwa_razem_na_prawo („две петље заједно на право”), scieg_francuski („све право”)
- **sv** (7): licznik („varvräknare”), powtorzenie („rapport”), zapas („garnlager”), metraz („löplängd”), etykieta_wloczki („banderoll”), wloczka_lace („lacegarn”), druty_z_zylka („rundsticka”)
- **tr** (17): okrazenie („tur”), licznik („sıra sayacı”), czesc („parça”), powtorzenie („tekrar”), wzor („tarif”), schemat („şema”), znacznik_rzedu („işaretçi”), probka („numune”), gestosc („örgü sıklığı”), blokowanie („buharla şekillendirme”), zapas („iplik stoku”), grubosc_wloczki („iplik kalınlığı”), masa_motka („yumak ağırlığı (g)”), metraz („metraj”), etykieta_wloczki („etiket”), wloczka_lace („çok ince iplik (lace)”), zamykanie_oczek („ilmek kapatma”)
- **uk** (11): scieg_dzersejowy („лицьова гладь”), licznik („лічильник рядів”), zapas („запас пряжі”), masa_motka („вага мотка”), metraz („довжина нитки в мотку (метраж)”), etykieta_wloczki („етикетка”), wloczka_lace („тонка пряжа для мережива (категорія 0)”), druty_z_zylka („кругові спиці”), dwa_razem_na_prawo („2 петлі разом лицьовою”), scieg_francuski („хусткова в’язка”), sciagacz („резинка”)
- **vi** (33): robotka („đan móc”), okrazenie („vòng”), scieg („kiểu đan”), scieg_dzersejowy („mũi đan trơn (stockinette)”), licznik („bộ đếm hàng”), czesc („phần”), powtorzenie („lặp lại”), schemat („sơ đồ”), znacznik_rzedu („vạch đánh dấu”), probka („mẫu thử”), gestosc („mật độ mũi (gauge)”), blokowanie („định hình (blocking)”), zapas („kho len”), grubosc_wloczki („độ dày sợi”), masa_motka („trọng lượng cuộn (g)”), metraz („chiều dài sợi (m)”), etykieta_wloczki („nhãn len”), wloczka_lace („len siêu mảnh (lace)”), druty_z_zylka („kim đan vòng”), rozmiar_drutu („cỡ kim (mm)”), oczko_prawe („mũi lên”), oczko_lewe („mũi xuống”), nabieranie_oczek („lên mũi”), zamykanie_oczek („chốt mũi”), narzut („vòng sợi (yarn over)”), dwa_razem_na_prawo („đan 2 mũi chung”), scieg_francuski („[DO SPRAWDZENIA]”), sciagacz („bo (đan bo)”), lancuszek („mũi xích”), oczko_zamykajace_szyd („mũi trượt”), oczko_scisle („mũi móc đơn”), polslupek („mũi móc nửa kép”), slupek („mũi móc kép”)
- **zh-Hant** (8): licznik („計數器”), powtorzenie („重複”), znacznik_rzedu („記號”), probka („密度織片”), zapas („庫存毛線”), masa_motka („每球重量（g）”), metraz („每球長度（m）”), wloczka_lace („蕾絲線”)

## Źródła

Tytuły, adresy i kopie surowych tekstów są w prywatnym rejestrze (kolumna „rejestr”); w repo publicznym tylko ID (decyzja koordynatora 2026-10-27, bramka marek P-121 (5)).

| ID | szczebel | kraj | język | odczyt | rejestr |
|---|---|---|---|---|---|
| S-BANUL-PDF | 3 | KR | ko | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-BANUL-Y | 3 | KR | ko | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-BAR | 3 | PL | pl | 2026-10-25 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-BDF | 3 | FR | fr | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-BDF-1151 | 3 | FR | fr | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-BDF-1160 | 3 | FR | fr | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-BDF-1272 | 3 | FR | fr | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-BDF-2525 | 3 | FR | fr | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-BDF-6292 | 3 | FR | fr | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-BDF-TUTO | 3 | FR | fr | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-BDPU-UK | 3 | UA | uk | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-BEL-SK | 4 | SK | sk | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-CAMB-VI | 3 | GB | vi | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-CB-BG | 4 | BG | bg | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-CIR | 3 | BR | pt-BR | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-CYC-C | 1 | US | en | 2026-10-21 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-CYC-ES | 1 | US | es | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-CYC-FR | 1 | US | fr | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-CYC-H | 1 | US | en | 2026-10-21 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-CYC-K | 1 | US | en | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-CYC-W | 1 | US | en | 2026-10-21 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-DAR-JA | 3 | JP | ja | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-DBP-PRPM | 3 | MY | ms | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-DRP | 3 | NO | cs | 2026-10-26 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-DZ-LV | 4 | LV | lv | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-EKI-ET | 3 | EE | et | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-ESL-TW | 2 | TW | zh-Hant | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-FIL-NL | 3 | NL | nl | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-FRAN-SL | 2 | SI | sl | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-FRK-SR | 4 | RS | sr-Latn | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-GUZ | 3 | PL | pl | 2026-10-25 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-HJE | 3 | DK | da | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-HJP-HR | 2 | HR | hr | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-HOD-UK8 | 3 | UA | uk | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-IATE-EL | 3 | EU | el | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-IATE-G3 | 3 | EU | cs,sk,sl,hr,bg | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-IATE-G4 | 3 | EU | hu,et,lv,lt | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-JAR | 3 | SE | sv | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-JUN | 3 | DE | de | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-KAL-FI | 3 | FI | fi | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-KAT | 3 | ES | es | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-KAT-WEB | 3 | ES | es | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-KD | 3 | PL | pl | 2026-10-25 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-KLB-SK | 4 | SK | sk | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-KNC-CS | 4 | CZ | cs | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-KOS-CS | 4 | CZ | cs | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-KT-ET | 3 | EE | et | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-LAN-SL | 4 | SI | sl | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-LBH-SK | 4 | SK | sk | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-LG | 3 | IT | it | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-LG-DE | 3 | DE | de | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-LG-GILET | 3 | IT | it | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-LG-GRANNY | 3 | IT | it | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-LG-MERINO | 3 | IT | it | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-LG-TRECCIA | 3 | IT | it | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-LG-TUTO | 3 | IT | it | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-LG-UNC | 3 | IT | it | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-LG-ZUCCHE | 3 | IT | it | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-LG2-DE | 3 | DE | de | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-LWIM-KO | 3 | AU | ko | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-MAN-DE | 3 | CH | de | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-MAN-SK | 4 | SK | sk | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-MAR-FI | 3 | FI | fi | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-MAY-DA | 3 | DK | da | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-MAY2-DA | 3 | DK | da | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-MBP-PT | 3 | PT | pt-PT | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-MD-EDT56 | 3 | MD | ro | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-MD-EDT9 | 3 | MD | ro | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-MEGEP-REJ | 3 | TR | tr | 2026-10-26 (cytaty z rejestru), próba ponowna 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-MIH-RU | 3 | RU | ru | 2026-10-25 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-MK-SR | 4 | RS | sr-Latn | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-MOE-TW | 2 | TW | zh-Hant | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-N2K-BG | 4 | BG | bg | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-NAER-TW | 1 | TW | zh-Hant | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-NV-B | 3 | JP | ja | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-NV-K | 3 | JP | ja | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-NV-KB0 | 3 | JP | ja | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-NV-KB2 | 3 | JP | ja | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-NV-KB3 | 3 | JP | ja | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-NV-KB4 | 3 | JP | ja | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-NV-KB6 | 3 | JP | ja | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-NV-KK2 | 3 | JP | ja | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-NV-KK3 | 3 | JP | ja | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-NV-MEMO | 3 | JP | ja | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-NV-TOOLS | 3 | JP | ja | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-OV-CS | 4 | CZ | cs | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-PAM-HR | 4 | HR | hr | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-PAN-NB | 3 | NO | nb | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-PEH-RU | 3 | RU | ru | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-PLEKO-GR | 4 | GR | el | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-PLEKONTAS | 4 | GR | el | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-PLN-HR | 4 | HR | hr | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-POLINEMA | 3 | ID | id | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-PRI-FI | 3 | FI | fi | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-R4-AMOSTRA | 3 | PT | pt-PT | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-R4-CAPUCCINO | 3 | PT | pt-PT | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-R4-CUPCAKE | 3 | PT | pt-PT | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-R4-OPORTO | 3 | PT | pt-PT | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-R4-ORG | 3 | PT | pt-PT | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-R4-SERAFIM | 3 | PT | pt-PT | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-R4-TAB | 3 | PT | pt-PT | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-RAN-UK7 | 3 | UA | uk | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-RAU-FI | 3 | FI | fi | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-RAUMA-RU | 3 | FI | ru | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-RIT-DA | 3 | DK | da | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-RM450 | 3 | PL | pl | 2026-10-25 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-RP-CS | 4 | CZ | cs | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-SAN | 3 | NO | nb | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-SC-UK | 3 | GB | en | 2026-10-25 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-SCH | 3 | NL | nl | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-SCHK-NL | 3 | NL | nl | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-SCHK2-NL | 3 | NL | nl | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-SKOLA-HR | 3 | HR | hr | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-SM-LT | 4 | LT | lt | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-SPAL-LT | 3 | LT | lt | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-TAI | 3 | FI | fi | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-TEG-NB | 3 | NO | nb | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-TEKE-2021 | 2 | TR | tr | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-TKG-B | 3 | US | en | 2026-10-21 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-TKG-G | 3 | US | en | 2026-10-21 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-TUBITAK-BC | 3 | TR | tr | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-UNI-SL | 4 | SI | sl | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-UNP-2022 | 2 | ID | id | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-VLN-CS | 3 | CZ | cs | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-VLN-SK | 3 | CZ/SK | sk | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
| S-VS-CS | 4 | CZ | cs | 2026-10-27 | oczko-warsztat/09-lokalizacja/2026-10-27-slownik/zrodla.json |
