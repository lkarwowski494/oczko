// mapa-tokenow.mjs — M3-S3-01: każda z 183 pozycji starego docs/design/tokeny.json → token Dzianiny albo „usunięte, bo …”.
// Użycie: node mapa-tokenow.mjs <docs/design>  → zapisuje dzianina/mapa-tokenow.md; kod 1, gdy pozycji brakuje,
// gdy mapa ma pozycję spoza starego pliku albo gdy wskazany token nie istnieje w dzianina/tokeny.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const kat = process.argv[2];
const stary = JSON.parse(readFileSync(join(kat, 'tokeny.json'), 'utf8'));
const nowy = JSON.parse(readFileSync(join(kat, 'dzianina/tokeny.json'), 'utf8'));
const liscie = (o, p = []) => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? liscie(v, [...p, k]) : [[[...p, k].join('.'), v]]));
const wartosc = (o, sciezka) => sciezka.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);

// Kolory motywu: ten sam klucz w jasny i ciemny. [cel w kolory.<motyw>, uwaga] albo [null, powód usunięcia].
const KOLOR = {
  papier: ['tlo', 'tło ekranu; runo musket zamiast bieli papieru (P-547: żaden ekran płaski biały ani czarny)'],
  papierGrupa: ['powierzchnia', 'tło grup, wierszy, kafli'],
  grafit: ['tekst', 'tusz Dzianiny'],
  olowek: ['tekst2', ''],
  linia: ['linia', ''],
  zakreslacz: ['zakreslacz', 'tylko strona wzoru (stały #F6E04A w obu motywach, bo strona jest w oryginale: ZM-10, P-563 (8a)); w interfejsie zakreślenie instrukcji zastępuje znacznik `akcent` wiersza „co dalej”'],
  tekstNaZakreslaczu: ['tekst', 'tekst wiersza „co dalej” na `powierzchnia` (zakreślenie interfejsu zastąpione znacznikiem `akcent`); na stronie wzoru tekst to treść pliku'],
  zakreslaczKrawedz: ['akcent', 'znacznik wiersza „co dalej” (`.zn`) i „Za n rzędów:” w `akcentTekst` na liczniku'],
  przyciskTlo: ['przycisk', 'wypełniony w obu motywach (P-547)'],
  przyciskTekst: ['przyciskTekst', ''],
  przyciskObrys: [null, 'przycisk główny jest wypełniony w obu motywach, bez obrysu (P-547)'],
  drugiPrzyciskObrys: ['tekst2', 'obrys −1 licznika i paska wzoru (`.minus`, `.pasek-wz .m`: 2 pt `tekst2`)'],
  blad: ['tekst', 'tekst błędu w kolorze `tekst` z ikoną „!” i `role=alert`; czerwień (`niszczacy`) tylko dla działań nieodwracalnych (jeden kolor = jedno znaczenie, design-spec „Kolory”)'],
  kreska: [null, 'kreski (element firmowy kierunku A) zastąpione dzianiną (P-552): `akcent`, `akcentJasny`, `igla`'],
  arkusz: ['powierzchnia', 'arkusz formularza jest systemowy (tło arkusza z motywu systemu); treść grup na `powierzchnia`'],
  przyciskNieaktywnyTlo: ['przyciskNieaktywny', 'z przerywaną ramą `przyciskNieaktywnyRama` i ikoną stanu (jak `oferty-czeka-*`)'],
  przyciskNieaktywnyTekst: ['przyciskNieaktywnyTekst', ''],
  przyciskNiszczacyTlo: ['niszczacy', ''],
  przyciskNiszczacyTekst: ['niszczacyTekst', ''],
};
const KONTRAST = {
  olowek: ['tekst2', ''], linia: ['linia', ''], drugiPrzyciskObrys: ['tekst2', 'obrys −1 = `tekst2` wariantu zwiększonego'],
  przyciskObrys: [null, 'przycisk główny bez obrysu (P-547)'],
  zakreslaczKrawedz: [null, 'znacznik „co dalej” ma kształt i tekst obok; `akcent` bez wariantu zwiększonego (para akcent/karta ≥ 3:1 w obu motywach)'],
  przyciskNieaktywnyTlo: [null, 'tło przycisku nieaktywnego = `powierzchnia`; „Zwiększ kontrast” podnosi tekst i ramę (`przyciskNieaktywnyTekst`, `przyciskNieaktywnyRama`)'],
  przyciskNieaktywnyTekst: ['przyciskNieaktywnyTekst', ''],
};
const M = { _opis: ['_opis', 'opis pliku Dzianiny (P-552, P-553)'] };
for (const [m, n] of [['jasny', 'jasny'], ['ciemny', 'ciemny']]) for (const [k, [c, u]] of Object.entries(KOLOR)) M[`kolor.${m}.${k}`] = [c && `kolory.${n}.${c}`, u];
for (const [m, n] of [['jasnyKontrast', 'jasnyZwiekszony'], ['ciemnyKontrast', 'ciemnyZwiekszony']]) for (const [k, [c, u]] of Object.entries(KONTRAST)) if (wartosc(stary, `kolor.${m}.${k}`) !== undefined) M[`kolor.${m}.${k}`] = [c && `kolory.${n}.${c}`, u];
Object.assign(M, {
  'kolor._wloczka': [null, 'kolor włóczki projektu (kropka przy nazwie, opcjonalnie kolor kresek) nie występuje w makietach Dzianiny (`projekty-*`); kresek już nie ma — czy kropka zostaje w p4: otwarte pytanie O-1 w tym pliku'],
  'kolor.wzor._opis': ['wzor._opis', 'strona w oryginale w obu motywach'],
  'kolor.wzor.strona': ['wzor.strona', ''], 'kolor.wzor.znacznik': ['wzor.znacznik', 'tusz Dzianiny zamiast grafitu'],
  'kolor.wzor.znacznikTlo': ['wzor.znacznikTlo', ''], 'kolor.wzor.etykietaTlo': ['wzor.etykietaTlo', ''], 'kolor.wzor.etykietaTekst': ['wzor.etykietaTekst', ''],
  'kolor.systemCzarny._opis': ['kolory.systemCzarny._opis', ''], 'kolor.systemCzarny.tlo': ['kolory.systemCzarny.tlo', ''],
  'kolor.systemCzarny.kartaStack': ['kolory.systemCzarny.kartaStack', 'przybliżenie, pomiar na urządzeniu'],
  'kolor.systemCzarny.grafit': ['kolory.systemCzarny.tekst', ''], 'kolor.systemCzarny.olowek': ['kolory.systemCzarny.tekst2', ''],
  'kolor.systemCzarny.przyciskTlo': ['kolory.systemCzarny.przycisk', 'wypełniony (miód) jak przycisk motywu ciemnego'],
  'kolor.systemCzarny.przyciskTekst': ['kolory.systemCzarny.przyciskTekst', ''],
  'kolor.systemCzarny.przyciskObrys': [null, 'przycisk wypełniony, bez obrysu (P-547)'],
  'kolor.systemCzarny.zakreslacz': ['kolory.systemCzarny.akcent', 'znacznik rzędu z przypomnieniem (jak `.zn` „co dalej”)'],
  'kolor.systemCzarny.tekstNaZakreslaczu': ['kolory.systemCzarny.tekst', 'tekst instrukcji obok znacznika'],
  'kolor.systemCzarny.zakreslaczKrawedz': ['kolory.systemCzarny.akcentTekst', '„Za n rzędów:” w akcencie'],
  'typografia._zasada': ['kroje', 'Bree Serif zamiast Libre Franklin (P-553); treść systemowa bez zmian; skale w `typografia.*.maxSkala`'],
  'typografia.liczba.krój': ['typografia.liczbaLicznika.kroj', '„tytul” = Bree Serif'],
  'typografia.liczba.grubość': [null, 'Bree Serif ma jedną odmianę (400)'],
  'typografia.liczba.rozmiar': ['typografia.liczbaLicznika.pt', '104 pt (było 96); na karcie „Dziś” `liczbaKarty` 56 pt'],
  'typografia.liczba.interlinia': ['typografia.liczbaLicznika.interlinia', ''], 'typografia.liczba.maxSkala': ['typografia.liczbaLicznika.maxSkala', ''],
  'typografia.liczba.minSkala': ['typografia.liczbaLicznika.minSkala', ''],
  'typografia.liczba.cyfry': ['typografia.liczbaLicznika.cyfry', '„komorka” zamiast cyfr tabelarycznych (Bree bez `tnum`; `typografia.cyfry`, P-563 (2a))'],
  'typografia.liczbaPaska._opis': ['typografia.liczbaPaskaWzoru', 'pasek wzoru −1 / rząd / +1 (`wzor-*`)'],
  'typografia.liczbaPaska.rozmiar': ['typografia.liczbaPaskaWzoru.pt', '28 pt (było 40)'], 'typografia.liczbaPaska.interlinia': ['typografia.liczbaPaskaWzoru.interlinia', ''],
  'typografia.liczbaKolumny._opis': ['typografia.liczbaPaskaWzoru', 'kolumny licznika obok wzoru (W3) nie ma w makietach TO BE; liczba przy wzorze = pasek wzoru; układ iPada obok wzoru — audyt 04 po p3b (P-546)'],
  'typografia.liczbaKolumny.rozmiar': ['typografia.liczbaPaskaWzoru.pt', 'jak wyżej'], 'typografia.liczbaKolumny.interlinia': ['typografia.liczbaPaskaWzoru.interlinia', 'jak wyżej'],
  'typografia.tytul.krój': ['typografia.duzyTytul.kroj', ''], 'typografia.tytul.grubość': [null, 'Bree Serif ma jedną odmianę'],
  'typografia.tytul.rozmiar': ['typografia.duzyTytul.pt', '34 pt (było 30)'], 'typografia.tytul.interlinia': ['typografia.duzyTytul.interlinia', ''],
  'typografia.tytul.styl iOS': ['typografia.duzyTytul.styl', 'largeTitle'],
  'typografia.instrukcja.krój': ['typografia.tresc.kroj', 'instrukcja rzędu = wiersz „co dalej”: krój systemowy, słowo czynności pogrubione (`dzis-*`, `licznik-*`)'],
  'typografia.instrukcja.grubość': ['typografia.tresc', 'pogrubione tylko słowo czynności'], 'typografia.instrukcja.rozmiar': ['typografia.tresc.pt', '17 pt (było 20)'],
  'typografia.instrukcja.interlinia': ['typografia.tresc.interlinia', ''],
  'typografia.przycisk.krój': ['typografia.przyciskPlus.kroj', '„+1”: krój systemowy 800; pozostałe przyciski: `tresc` 700'],
  'typografia.przycisk.grubość': ['typografia.przyciskPlus.waga', ''], 'typografia.przycisk.rozmiar': ['typografia.przyciskPlus.pt', '26 pt (było 28)'],
  'typografia.przycisk.interlinia': ['typografia.tresc.interlinia', ''],
  'typografia.znakWyboru._opis': [null, 'pole wyboru z ✓ w kroju tytułowym zastępuje znacznik okrągły z ikoną `ptaszek` (SF `checkmark`), jak plany w `oferty-*`; promień `promienie.plus`'],
  'typografia.znakWyboru.krój': [null, 'jak wyżej (ikona, nie znak kroju)'], 'typografia.znakWyboru.grubość': [null, 'jak wyżej'],
  'typografia.znakWyboru.rozmiar': [null, 'jak wyżej; ikona 18 pt w znaczniku 26 pt, przy AX5 28 pt w 40 pt (`oferty-*-ax5`)'],
  'typografia.znakWyboru.interlinia': [null, 'jak wyżej'], 'typografia.znakWyboru.maxSkala': [null, 'jak wyżej'],
  'typografia.tresc.krój': ['typografia.tresc.kroj', ''], 'typografia.tresc.rozmiar': ['typografia.tresc.pt', ''],
  'typografia.tresc.interlinia': ['typografia.tresc.interlinia', ''], 'typografia.tresc.styl iOS': ['typografia.tresc.styl', ''],
  'typografia.podpis.krój': ['typografia.tresc2.kroj', ''], 'typografia.podpis.rozmiar': ['typografia.tresc2.pt', ''],
  'typografia.podpis.interlinia': ['typografia.tresc2.interlinia', ''], 'typografia.podpis.styl iOS': ['typografia.tresc2.styl', ''],
  'typografia.drobny.krój': ['typografia.mala.kroj', ''], 'typografia.drobny.rozmiar': ['typografia.mala.pt', ''],
  'typografia.drobny.interlinia': ['typografia.mala.interlinia', ''], 'typografia.drobny.styl iOS': ['typografia.mala.styl', ''],
  'odstep._jednostka': ['odstepy.jednostka', ''], 'odstep.xs': ['odstepy.xs', ''], 'odstep.s': ['odstepy.s', ''], 'odstep.m': ['odstepy.m', ''],
  'odstep.l': ['odstepy.l', ''], 'odstep.xl': ['odstepy.xl', ''], 'odstep.xxl': ['odstepy.xxl', '24 pt (było 28)'],
  'odstep.sekcja': ['odstepy.xxl', 'odstęp między grupami 24 pt; menu ••• jest systemowe (ZM-05) i dzieli grupy samo'],
  'promien._zasada': ['promienie._hierarchia', ''], 'promien.przyciskGlowny': ['promienie.plusLicznik', 'wielki „+1” licznika 26 pt (było 20)'],
  'promien.przyciskPelny': ['promienie.przycisk', ''], 'promien.przyciskDrugi': ['promienie.przycisk', ''],
  'promien.grupa': ['promienie.lista', 'lista grupowana 16 pt (było 12)'], 'promien.pole': ['promienie.pole', ''],
  'promien.poleWyboru': ['promienie.plus', 'znacznik wyboru okrągły (połowa boku)'], 'promien.zakreslacz': ['wzor.zakreslaczPromien', ''],
  'cel.minimum': ['cele.minimum', ''], 'cel.przyciskMinus': ['cele.minus', ''], 'cel.przyciskPlusWysokosc': ['cele.plusLicznik', ''],
  'cel.odstepMinusPlus': ['cele.odstepMinusPlus', '12 pt (było 28); przy AX5 −1 pod +1 na pełną szerokość'],
  'cel.przyciskMinusPaska': ['cele.paskaWzoru.minSzerokosc', '−1 paska wzoru 64 × 52 pt (było 56)'],
  'cel.przyciskPlusPaskaWysokosc': ['cele.paskaWzoru.wysokosc', '52 pt (było 72)'],
  'cel.przyciskPlusPaskaSzerokosc': ['cele.paskaWzoru', '+1 paska wzoru zajmuje resztę szerokości (było 132 pt)'],
  'cel.poleWyboru': ['cele.minimum', 'celem jest cały wiersz wyboru ≥ 44 pt'],
  'miniatura._zasada': ['miniatura.stronaWzoru._gdzie', ''], 'miniatura.szerokosc': ['miniatura.stronaWzoru.szerokosc', ''],
  'miniatura.proporcja': ['miniatura.stronaWzoru.proporcja', ''], 'miniatura.promien': ['miniatura.stronaWzoru.promien', ''],
  'ruch._zasada': ['ruch.ograniczRuch', ''], 'ruch.kreska.czas': ['ruch.rzadOczek', 'nowy rząd oczek 180 ms (kreska 120 ms)'],
  'ruch.kreska.krzywa': ['ruch.krzywa', ''],
  'ruch.piataKreska.czas': [null, 'bez kresek nie ma piątej kreski (P-552)'], 'ruch.piataKreska.krzywa': [null, 'jak wyżej'],
  'ruch.zakreslenie.czas': [null, 'zakreślenie instrukcji w interfejsie zastąpione znacznikiem „co dalej” bez animacji (ruch tylko przy +1 i zmianie ekranu)'],
  'ruch.zakreslenie.krzywa': [null, 'jak wyżej'],
  'ruch.cofniecie.czas': ['ruch.rzadOczek', 'cofnięcie = ten sam ruch w drugą stronę'], 'ruch.cofniecie.krzywa': ['ruch.krzywa', ''],
  'haptyka._zasada': ['haptyka', 'F-48: rząd i przypomnienie rozróżnialne'], 'haptyka.plus': ['haptyka.rzad', ''],
  'haptyka.piataKreska': [null, 'bez kresek nie ma piątej kreski (P-552)'],
  'haptyka.rzadZInstrukcja': ['haptyka.przypomnienie', 'notificationWarning zamiast dwóch .medium (zatwierdzone P-554)'],
  'haptyka.minus': ['haptyka.cofniecie', ''], 'haptyka.blokadaStukniecie': ['haptyka.blokada', 'selection zamiast .rigid (P-554)'],
  'haptyka.bladZapisu': ['haptyka.bladZapisu', ''], 'haptyka.stoperStart': ['haptyka.stoperStart', ''],
  'haptykaZegarek._zasada': ['haptykaZegarek._opis', ''], 'haptykaZegarek.bladZapisu': ['haptykaZegarek.bladZapisu', 'WKHapticType.retry'],
  'haptykaZegarek.blokadaStukniecie': ['haptykaZegarek.blokada', 'WKHapticType.failure'], 'haptykaZegarek.przypomnienie': ['haptykaZegarek.przypomnienie', 'WKHapticType.notification'],
  'znakKresek._opis': ['znakKresek._opis', ''], 'znakKresek._kolor': ['znakKresek.kolorSystemCzarny', 'kolory jako odwołania do tokenów Dzianiny'],
  'znakKresek.kolorSystemCzarny': ['znakKresek.kolorSystemCzarny', '= `kolory.systemCzarny.tekst`'], 'znakKresek.kolorJasny': ['znakKresek.kolorJasny', '= `kolory.jasny.tekst`'],
  'znakKresek.kolorCiemny': ['znakKresek.kolorCiemny', '= `kolory.ciemny.tekst`'],
});
for (const k of ['plik', 'viewBox', 'proporcja', 'gruboscKreskiWJednostkach', 'wyspa._gdzie', 'wyspa.wysokosc', 'wyspa.szerokosc', 'wyspa.kreska', 'wyspa.maxSkala', 'smartStack._gdzie', 'smartStack.wysokosc', 'smartStack.szerokosc', 'smartStack.kreska', 'smartStack.maxSkala'])
  M[`znakKresek.${k}`] ??= [`znakKresek.${k}`, ''];

const stare = liscie(stary);
const bledy = [];
for (const [k] of stare) if (!(k in M)) bledy.push(`brak w mapie: ${k}`);
for (const k of Object.keys(M)) if (!stare.some(([s]) => s === k)) bledy.push(`w mapie, a nie w starym pliku: ${k}`);
for (const [k, [c, u]] of Object.entries(M)) {
  if (c && wartosc(nowy, c) === undefined) bledy.push(`${k}: token ${c} nie istnieje w dzianina/tokeny.json`);
  if (!c && !u) bledy.push(`${k}: usunięte bez powodu`);
}
const pokaz = (v) => (v === undefined ? '' : typeof v === 'object' ? 'grupa' : String(v).length > 40 ? String(v).slice(0, 38) + '…' : String(v));
const wiersze = stare.map(([k, v]) => { const [c, u] = M[k] || [null, '']; return `| \`${k}\` | ${pokaz(v).replace(/\|/g, '\\|')} | ${c ? `\`${c}\`` : '**usunięte**'} | ${c ? pokaz(wartosc(nowy, c)).replace(/\|/g, '\\|') : ''} | ${(c ? u : 'bo ' + u).replace(/\|/g, '\\|')} |`; });
const usuniete = stare.filter(([k]) => !M[k]?.[0]).length;
writeFileSync(join(kat, 'dzianina/mapa-tokenow.md'), `# Mapa tokenów: stary \`docs/design/tokeny.json\` → Dzianina (\`tokeny.json\` w tym katalogu)

M3-S3-01 · 2026-11-08 · rola 04 (fix) · wygenerowane: \`node docs/design/narzedzia/mapa-tokenow.mjs docs/design\` (kod 1, gdy pozycji brakuje albo wskazany token nie istnieje). Pozycje: ${stare.length} (liście starego pliku, z kluczami „_”), w tym ${stare.length - usuniete} z nowym tokenem i ${usuniete} usuniętych z powodem.

**Dla roli 08 (p1):** kod czyta wyłącznie nowe tokeny; stary klucz bez odpowiednika = funkcja wyglądu kierunku A, której Dzianina nie ma (kreski, pole wyboru z ✓, obrys przycisku głównego). Wartość zmieniona (np. 96 → 104 pt) jest zatwierdzona makietami P-554; zrzuty wzorcowe: \`wzorce-zrzuty/\`.

**Otwarte pytania**
- **O-1 (do 03/właściciela przez koordynatora, przed p4):** kolor włóczki projektu (\`kolor._wloczka\`, P-063: kropka przy nazwie projektu) — makiety \`projekty-*\` go nie pokazują. Opcje: (a) kropka koloru włóczki zostaje w wierszu projektu, przy miniaturze dzianiny (obwódka \`linia\`, gdy kontrast < 3:1) — zachowuje funkcję, jeden element więcej w wierszu; (b) kolor włóczki tylko w ekranie projektu (sekcja włóczki) — prostszy wiersz, informacja o krok dalej. Rekomendacja: (b), bo miniatura dzianiny już niesie postęp, a druga barwa w wierszu konkuruje z akcentem; decyzja zakresu należy do 03.

| Stary klucz | Stara wartość | Token Dzianiny | Nowa wartość | Uwagi |
|---|---|---|---|---|
${wiersze.join('\n')}
`);
for (const b of bledy) console.log('BŁĄD', b);
console.log(bledy.length ? `${bledy.length} błędów` : `OK: ${stare.length} pozycji (${stare.length - usuniete} z tokenem, ${usuniete} usuniętych z powodem); wszystkie tokeny istnieją`);
process.exit(bledy.length ? 1 : 0);
