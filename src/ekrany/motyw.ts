// Moduł motywu (zasada 15, design-spec „Pliki”): wartości wyłącznie z docs/design/tokeny.json roli 04 (system „Dzianina”, M3 p1) — bez liczb wpisanych w ekranach.
// Kolory motywu jasnego i ciemnego z `useColorScheme`, z wariantem „Zwiększ kontrast” (M1-032); krój tytułowy Bree Serif (P-553), treść krojem systemowym (Dynamic Type).
//
// ZGODNOŚĆ Z POPRZEDNIMI NAZWAMI RÓL (przejściowo): ekrany p2–p8 jeszcze czytają stare nazwy (papier, grafit, olowek…, `odstep.sekcja`, `promien.grupa`…). Każda stara nazwa jest tu
// aliasem na token Dzianiny według docs/design/dzianina/mapa-tokenow.md (M3-S3-01), więc żadna wartość nie jest wpisana w kodzie; alias znika, gdy ostatnia partia przejdzie na nowe nazwy.
import { useSyncExternalStore } from 'react';
import { AccessibilityInfo, useColorScheme, type TextStyle } from 'react-native';
import tokeny from '../../docs/design/tokeny.json';

const ty = tokeny.typografia;
export type KoloryTokenow = typeof tokeny.kolory.jasny;
/** Odstępy Dzianiny + `sekcja` (stary klucz → `xxl`, mapa: odstęp między grupami 24 pt). */
export const odstep = { ...tokeny.odstepy, sekcja: tokeny.odstepy.xxl };
/** Promienie Dzianiny + stare klucze z mapy (grupa → lista, przyciskGlowny → plusLicznik, poleWyboru → plus, przyciskPelny/przyciskDrugi → przycisk, zakreslacz → wzor.zakreslaczPromien). */
export const promien = {
  ...tokeny.promienie,
  grupa: tokeny.promienie.lista, przyciskGlowny: tokeny.promienie.plusLicznik, przyciskPelny: tokeny.promienie.przycisk, przyciskDrugi: tokeny.promienie.przycisk,
  poleWyboru: tokeny.promienie.plus, zakreslacz: tokeny.wzor.zakreslaczPromien,
};
/** Cele dotyku Dzianiny + stare klucze z mapy (przyciskMinus → minus, poleWyboru → minimum: celem jest cały wiersz, pasek wzoru: 64 × 52 pt, +1 paska zajmuje resztę szerokości). */
export const cel = {
  ...tokeny.cele,
  przyciskMinus: tokeny.cele.minus, poleWyboru: tokeny.cele.minimum,
  przyciskMinusPaska: tokeny.cele.paskaWzoru.minSzerokosc, przyciskPlusPaskaWysokosc: tokeny.cele.paskaWzoru.wysokosc, przyciskPlusPaskaSzerokosc: tokeny.cele.paskaWzoru.minSzerokosc,
  przyciskPlusWysokosc: tokeny.cele.plusLicznik,
};
/** Ruch (design-spec „Ruch”): nowy rząd oczek 180 ms, krzywa easeOut; „Ogranicz ruch” = zmiana natychmiast. */
export const ruch = tokeny.ruch;
/** Haptyka (F-48): wzorce Dzianiny (rzad, przypomnienie, celCzesci, cofniecie, blokada, bladZapisu, stoperStart). */
export const haptykaTokeny = tokeny.haptyka;
/** Miniatura dzianiny w wierszu projektu i miniatura strony wzoru (tokeny `miniatura`). */
export const miniatura = tokeny.miniatura;
/** Strona wzoru w oryginalnych kolorach (ZM-10) i rama w barwie motywu (`kolory.<motyw>.wzorRama`). */
export const wzorTokeny = tokeny.wzor;

/** Kolory na stałym czarnym tle (zegarek, Dynamic Island, podgląd zdjęcia; design-spec „systemCzarny”): wprost z tokenów; stare nazwy ról (grafit, olowek, przyciskTlo…) usunięte w M3 p4b. */
export const systemCzarny = tokeny.kolory.systemCzarny;

/** Dodatkowe nazwy ról z poprzedniego systemu, liczone z palety (już z wariantem „Zwiększ kontrast”), według mapa-tokenow.md. */
function zgodnosc(p: KoloryTokenow & Partial<Record<string, string>>) {
  return {
    papier: p.tlo, papierGrupa: p.powierzchnia, arkusz: p.powierzchnia,
    grafit: p.tekst, olowek: p.tekst2,
    przyciskTlo: p.przycisk, przyciskObrys: p.przycisk, drugiPrzyciskObrys: p.tekst2,
    // Czerwień tylko dla działań nieodwracalnych (design-spec „Kolory”): pozostałe użycia `blad` w ekranach to działania usuwające (Projekt, WzorNotatki, WzorPrzegladarka);
    // tekst błędu w Arkusz.tsx używa `tekst` + znaku „!” (mapa: blad → tekst). Ekran licznika dopóki rysuje zakreślenie (p3a) czyta `zakreslacz` (żółć w obu motywach)
    // z tekstem `naAkcencie` (ciemny tusz) — odstępstwo od mapy (tekstNaZakreslaczu → tekst), bo w ciemnym motywie jasny tekst na żółci byłby nieczytelny.
    blad: p.niszczacy, tekstNaZakreslaczu: p.naAkcencie, zakreslaczKrawedz: p.akcent,
  };
}
type Zgodnosc = ReturnType<typeof zgodnosc>;
export type Kolory = KoloryTokenow & { [K in keyof Zgodnosc]-?: string } & { przyciskNieaktywnyRama: string; rysunekDrut: string };

function zbuduj(podstawa: KoloryTokenow, wariant?: Partial<Record<string, string>>): Kolory {
  const polaczone = { ...podstawa, ...wariant } as KoloryTokenow & Partial<Record<string, string>>;
  return { ...polaczone, ...zgodnosc(polaczone) } as Kolory;
}
// Obiekty stałe, żeby `style(k)` nie liczył się od nowa bez zmiany.
const PALETY: Record<'jasny' | 'ciemny' | 'jasnyKontrast' | 'ciemnyKontrast', Kolory> = {
  jasny: zbuduj(tokeny.kolory.jasny),
  ciemny: zbuduj(tokeny.kolory.ciemny),
  jasnyKontrast: zbuduj(tokeny.kolory.jasny, tokeny.kolory.jasnyZwiekszony),
  ciemnyKontrast: zbuduj(tokeny.kolory.ciemny, tokeny.kolory.ciemnyZwiekszony),
};
/** Kolory motywu jasnego niezależnie od ustawienia telefonu (obraz karty ukończenia trafia poza aplikację, design-spec P10a). */
export const kolorJasny = PALETY.jasny;

/**
 * Krój tytułowy (P-553, P-563 (9)): Bree Serif, plik STATYCZNY `assets/fonts/BreeSerif.ttf` = wydanie google/fonts `ofl/breeserif/BreeSerif-Regular.ttf` bez zmian
 * (pełny, z tekstem OFL w rekordach name; M1-audytor-generalny-241, SHA-256 w tests/ekrany/kroj-bree.test.ts; Reserved Font Name „Bree”; ten sam plik co docs/design/fonty),
 * ładowany natywnie pluginem expo-font (app.json). Jedna odmiana — przy „Pogrubionym tekście” bez zmiany. Pokrycie: łacina (w tym polskie znaki) tak; cyrylica, wietnamski, CJK nie, z greki tylko
 * Δ Ω μ π — dla języków z `kroje.tytul.jezykiSystemowe` tytuły i liczby krojem systemowym (`krojTytulowy`); znak spoza pliku w treści użytkownika dopełnia iOS krojem systemowym
 * [DO SPRAWDZENIA na urządzeniu: zrzut nazwy projektu cyrylicą, 04].
 */
export const KROJ_TYTULOWY = tokeny.kroje.tytul.rodzina;
const JEZYKI_KROJU_SYSTEMOWEGO: readonly string[] = tokeny.kroje.tytul.jezykiSystemowe;
/** Kod języka aplikacji → krój tytułowy: nazwa rodziny Bree albo `undefined` (krój systemowy; M3-S3-04). Warianty regionalne dopasowane prefiksem („ru-RU”, „zh-Hant-TW”). */
export function krojTytulowy(jezyk: string): string | undefined {
  const j = jezyk.replace('_', '-').toLowerCase();
  return JEZYKI_KROJU_SYSTEMOWEGO.some((s) => j === s.toLowerCase() || j.startsWith(`${s.toLowerCase()}-`)) ? undefined : KROJ_TYTULOWY;
}

const lh = (pt: number, interlinia: number) => Math.round(pt * interlinia);
const bree = (t: { pt: number; interlinia: number }): TextStyle => ({ fontFamily: KROJ_TYTULOWY, fontWeight: '400', fontSize: t.pt, lineHeight: lh(t.pt, t.interlinia) });
const systemowy = (t: { pt: number; interlinia: number }, waga?: TextStyle['fontWeight']): TextStyle => ({ fontSize: t.pt, lineHeight: lh(t.pt, t.interlinia), ...(waga ? { fontWeight: waga } : null) });
const plus = ty.przyciskPlus;
/** Typografia Dzianiny pod nazwami z tokenów (nowy kod używa tych nazw). */
export const typografiaDzianiny = {
  duzyTytul: bree(ty.duzyTytul), tytul: bree(ty.tytul),
  liczbaKarty: bree(ty.liczbaKarty), liczbaLicznika: bree(ty.liczbaLicznika), liczbaPaskaWzoru: bree(ty.liczbaPaskaWzoru), liczbaPodsumowania: bree(ty.liczbaPodsumowania),
  przyciskPlus: { fontSize: plus.pt, lineHeight: lh(plus.pt, ty.tresc.interlinia), fontWeight: String(plus.waga) as TextStyle['fontWeight'] } satisfies TextStyle,
  tresc: systemowy(ty.tresc), tresc2: systemowy(ty.tresc2), mala: systemowy(ty.mala),
  zakladka: { fontSize: ty.zakladka.pt, fontWeight: String(ty.zakladka.waga) as TextStyle['fontWeight'] } satisfies TextStyle,
};
/** Stare nazwy stylów tekstu → style Dzianiny według mapy (liczba → liczbaLicznika, liczbaPaska/Kolumny → liczbaPaskaWzoru, tytul → duzyTytul, instrukcja/przyciskPelny → treść pogrubiona,
 *  przycisk → przyciskPlus, podpis → tresc2, drobny → mala). Liczby w komórkach stałej szerokości: komponent `Liczba` (M3-S3-03). */
export const typografia = {
  liczba: typografiaDzianiny.liczbaLicznika, liczbaPaska: typografiaDzianiny.liczbaPaskaWzoru, liczbaKolumny: typografiaDzianiny.liczbaPaskaWzoru,
  tytul: typografiaDzianiny.duzyTytul,
  instrukcja: systemowy(ty.tresc, '700'), przycisk: typografiaDzianiny.przyciskPlus, znakWyboru: systemowy(ty.tresc, '700'), przyciskPelny: systemowy(ty.tresc, '700'),
  tresc: typografiaDzianiny.tresc, podpis: typografiaDzianiny.tresc2, drobny: typografiaDzianiny.mala,
  duzyTytul: typografiaDzianiny.duzyTytul, tresc2: typografiaDzianiny.tresc2, mala: typografiaDzianiny.mala,
};
/** Rozmiar symbolu SF w pasku (jak treść, 17 pt). */
export const ROZMIAR_SYMBOLU = ty.tresc.pt;
/** Rozmiar symbolu w kapsule stopera: jak etykieta kapsuły (treść, 17 pt). */
export const ROZMIAR_SYMBOLU_KAPSULY = ty.tresc.pt;
/** Symbol przy treści (design-spec „Paski i „wstecz””: „17 pt przy treści”): wskaźnik wiersza, rozwinięcie, usunięcie w trybie Edit (M1-146). */
export const ROZMIAR_SYMBOLU_TRESCI = ty.tresc.pt;
/** Największa skala kluczowej liczby licznika (bez ucięcia przy dużym tekście, tokeny „liczbaLicznika.maxSkala”). */
export const MAX_SKALA_LICZBY = ty.liczbaLicznika.maxSkala;
/** Dolny próg dopasowania liczby licznika do szerokości (`minimumFontScale`, tokeny „liczbaLicznika.minSkala”; M1-132). */
export const MIN_SKALA_LICZBY = ty.liczbaLicznika.minSkala;
/**
 * Wyjątek nazwany P-277 (do zastąpienia tokenami po audycie 04): RN mnoży każdy tekst przez jeden mnożnik Dynamic Type (AX5 = 3,571,
 * react-native RCTAccessibilityManager.mm `multipliers`), a system 04 skaluje krój tytułowy najwyżej ×1,8 i „−1” najwyżej ×1,4. Jak Trening `TEXT_SCALE_MAX` / `NUM_SCALE_MAX`.
 */
export const MAX_SKALA_TYTULOWA = 1.8;
export const MAX_SKALA_MINUSA = ty.przyciskPlus.maxSkala;
/** Kapsuła stopera: „skala tekstu najwyżej ×1,6” (ten sam wyjątek P-277); zakładki ×1,6 (tokeny `zakladka.maxSkala`). */
export const MAX_SKALA_KAPSULY = ty.zakladka.maxSkala;
/** Znak wyboru: skala najwyżej ×1,6 (jak zakładki). */
export const MAX_SKALA_ZNAKU_WYBORU = ty.zakladka.maxSkala;
/** Pierwsza kategoria dostępności Dynamic Type (AX1) w mnożniku RN; od niej układ licznika „liczba nad nazwami” (04 fix-8 wariant (d), P-275). */
export const PROG_KATEGORII_DOSTEPNOSCI = 1.786;
/** AX3 (UIContentSizeCategoryAccessibilityExtraLarge) w mnożniku RN: 2,643 (react-native React/CoreModules/RCTAccessibilityManager.mm:269);
 *  od niego układy `licznik.ax3ax5` i `kartaDzis.ax3ax5` (fix E5, P-614 (2), P-613). */
export const PROG_AX3 = 2.643;

/**
 * „Zwiększ kontrast” z systemu: `AccessibilityInfo.isDarkerSystemColorsEnabled` i zdarzenie `darkerSystemColorsChanged` (iOS, UIAccessibilityDarkerSystemColorsEnabled;
 * react-native 0.86.3, odczyt 2026-11-03). Jedna subskrypcja na całą aplikację; do pierwszej odpowiedzi systemu — paleta bez wariantu.
 */
let kontrast = false;
const sluchacze = new Set<() => void>();
let subskrypcja: { remove(): void } | null = null;
function ustawKontrast(v: boolean): void {
  if (v === kontrast) return;
  kontrast = v;
  sluchacze.forEach((f) => f());
}
function subskrybujKontrast(f: () => void): () => void {
  sluchacze.add(f);
  if (!subskrypcja) {
    subskrypcja = AccessibilityInfo.addEventListener('darkerSystemColorsChanged', ustawKontrast);
    AccessibilityInfo.isDarkerSystemColorsEnabled().then(ustawKontrast, () => undefined); // brak API (np. inna platforma): bez wariantu
  }
  return () => {
    sluchacze.delete(f);
    if (sluchacze.size === 0) { subskrypcja?.remove(); subskrypcja = null; }
  };
}

export function useKolory(): Kolory {
  const ciemny = useColorScheme() === 'dark';
  const zwiekszony = useSyncExternalStore(subskrybujKontrast, () => kontrast);
  return PALETY[ciemny ? (zwiekszony ? 'ciemnyKontrast' : 'ciemny') : (zwiekszony ? 'jasnyKontrast' : 'jasny')];
}

/** „Ogranicz ruch” (reduceMotion): `AccessibilityInfo.isReduceMotionEnabled` + zdarzenie `reduceMotionChanged` (react-native 0.86.3); do pierwszej odpowiedzi systemu — ruch dozwolony. */
let ograniczRuch = false;
const sluchaczeRuchu = new Set<() => void>();
let subskrypcjaRuchu: { remove(): void } | null = null;
function ustawRuch(v: boolean): void {
  if (v === ograniczRuch) return;
  ograniczRuch = v;
  sluchaczeRuchu.forEach((f) => f());
}
function subskrybujRuch(f: () => void): () => void {
  sluchaczeRuchu.add(f);
  if (!subskrypcjaRuchu) {
    subskrypcjaRuchu = AccessibilityInfo.addEventListener('reduceMotionChanged', ustawRuch);
    AccessibilityInfo.isReduceMotionEnabled().then(ustawRuch, () => undefined);
  }
  return () => {
    sluchaczeRuchu.delete(f);
    if (sluchaczeRuchu.size === 0) { subskrypcjaRuchu?.remove(); subskrypcjaRuchu = null; }
  };
}
export function useOgraniczRuch(): boolean {
  return useSyncExternalStore(subskrybujRuch, () => ograniczRuch);
}
