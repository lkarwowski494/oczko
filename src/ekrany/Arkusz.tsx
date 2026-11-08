// Wspólne elementy arkuszy (design-spec „Komponenty”: arkusze systemowe — treść się przewija, przyciski zawsze widoczne). Dwa rodzaje (P-275 (4)):
// arkusz formularza — Cancel / tytuł / Save w nagłówku u góry (`naglowek-arkusza` makiet, Trening design-spec:66), arkusz decyzji — przyciski na dole.
// Prezentację arkusza (formSheet) daje trasa expo-router; tu tylko zawartość. Wartości z modułu motywu (tokeny 04).
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View, type KeyboardEvent, type TextStyle } from 'react-native';
import tokeny from '../../docs/design/tokeny.json';
import { cel, MAX_SKALA_TYTULOWA, odstep, PROG_KATEGORII_DOSTEPNOSCI, promien, ROZMIAR_SYMBOLU_KAPSULY, ROZMIAR_SYMBOLU_TRESCI, systemCzarny, typografia, typografiaDzianiny, useKolory, type Kolory } from './motyw';
import type { Tlumacz } from './wspolne';
import { SymbolSf, type NazwaSymbolu } from './SymbolSf';

// Tokeny arkusza formularza i znaczników (M3-MAK-02/03/04): `arkusz.*`, `znaczniki.*`; kolory z palety motywu po nazwie z tokenu.
const ark = tokeny.arkusz;
const znaczniki = tokeny.znaczniki;
const waga = (w: number) => String(w) as TextStyle['fontWeight'];
const kolor = (k: Kolory, nazwa: string) => (k as unknown as Record<string, string>)[nazwa]!;

/** Ile dół paska przycisków (współrzędne okna) zachodzi na górną krawędź klawiatury; bez klawiatury 0 (P-255 (a)). */
export function odstepNadKlawiatura(w: { dolPrzyciskow: number; gornaKlawiatury: number | null }): number {
  return w.gornaKlawiatury === null ? 0 : Math.max(0, w.dolPrzyciskow - w.gornaKlawiatury);
}
type Pomiar = (f: (x: number, y: number, szer: number, wys: number) => void) => void;

/**
 * Przyciski zawsze widoczne (design-spec „Komponenty”), także nad klawiaturą numeryczną (scen. 10: Save pod klawiszem „0”). Telefon: arkusz
 * sięga dołu ekranu, więc odstęp = wysokość klawiatury, bez pomiaru — pomiar w oknie w formSheet zawiódł na urządzeniu (P-262 (a), przebieg
 * 119: pasek bez odstępu). iPad: arkusz na środku, system go przesuwa → pomiar w oknie (measureInWindow). `zmierz`: testy.
 */
/** Przyciski arkusza formularza w nagłówku: Cancel (lewy) i Save albo Add (prawy, `zapisz`); testID jak dawniej w pasku (`arkusz-zamknij`, `formularz-zapisz`). */
export type FormularzArkusza = { t: Tlumacz; naZapisz(): void; naAnuluj(): void; anuluj?: string; zapisz?: string; zapiszA11y?: string; testZapisz?: string; wylaczony?: boolean };

/** Arkusz decyzji: ✕ w prawym górnym rogu nagłówka (design-spec :111, słownik interakcji „Zamknij”; 04-studio-projektowe-004); tytuł przed ✕ w kolejności VoiceOver. */
export type ZamknijArkusza = { etykieta: string; naZamknij(): void; testID?: string };

export function Arkusz(p: { tytul: string; children: React.ReactNode; przyciski?: React.ReactNode; formularz?: FormularzArkusza; zamknij?: ZamknijArkusza; testID?: string; zmierz?: Pomiar }): React.ReactElement {
  return p.formularz ? <ArkuszFormularza {...p} f={p.formularz} /> : <ArkuszDecyzji {...p} />;
}

/**
 * Formularz: nagłówek nad przewijaną treścią — klawiatura go nie zasłania (bez nasłuchu klawiatury). Design-spec „Arkusze”: przy dużym tekście nagłówek łamie
 * tytuł. E2-138-A1: RN (Yoga) nie zawija elementu z `flexBasis: 'auto'` do nowego wiersza, więc od AX1 układ jest jawny: Cancel i Save w jednym wierszu,
 * tytuł pod nimi na pełną szerokość (te same tokeny typografii); poniżej AX1 bez zmian. „bez spec — do potwierdzenia przez 04 w M1”: szczegół układu.
 */
function ArkuszFormularza(p: { tytul: string; children: React.ReactNode; f: FormularzArkusza; testID?: string }): React.ReactElement {
  const st = style(useKolory());
  const duzyTekst = useWindowDimensions().fontScale >= PROG_KATEGORII_DOSTEPNOSCI;
  const { f } = p;
  const zapisz = f.zapisz ?? f.t('wspolne.zapisz');
  const anuluj = (
    <Pressable accessibilityRole="button" accessibilityLabel={f.anuluj ?? f.t('wspolne.anuluj')} onPress={f.naAnuluj} style={st.akcja} testID="arkusz-zamknij">
      <Text style={st.anuluj}>{f.anuluj ?? f.t('wspolne.anuluj')}</Text>
    </Pressable>
  );
  const zapisanie = (
    <Pressable accessibilityRole="button" accessibilityLabel={f.zapiszA11y ?? zapisz} onPress={f.naZapisz} style={st.akcja} testID={f.testZapisz ?? 'formularz-zapisz'}
      disabled={f.wylaczony} accessibilityState={f.wylaczony ? { disabled: true } : undefined}>
      <Text style={f.wylaczony ? st.zapiszNieaktywny : st.zapisz}>{zapisz}</Text>
    </Pressable>
  );
  return (
    <View style={st.arkusz} testID={p.testID}>
      {duzyTekst ? (
        <View style={st.naglowekDuzy} testID="arkusz-naglowek">
          <View style={st.akcjeDuzy} testID="arkusz-akcje">{anuluj}{zapisanie}</View>
          <Text style={st.naglowekTytulOsobny} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA} accessibilityRole="header">{p.tytul}</Text>
        </View>
      ) : (
        <View style={st.naglowek} testID="arkusz-naglowek">
          {anuluj}
          <Text style={st.naglowekTytul} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA} accessibilityRole="header">{p.tytul}</Text>
          {zapisanie}
        </View>
      )}
      <ScrollView contentContainerStyle={st.tresc} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>{p.children}</ScrollView>
    </View>
  );
}

function ArkuszDecyzji(p: { tytul: string; children: React.ReactNode; przyciski?: React.ReactNode; zamknij?: ZamknijArkusza; testID?: string; zmierz?: Pomiar }): React.ReactElement {
  const st = style(useKolory());
  const pasek = useRef<View>(null);
  const [nadKlawiatura, ustawNadKlawiatura] = useState(0);
  const biezacy = useRef(0);
  useEffect(() => {
    const zmierz: Pomiar = p.zmierz ?? ((f) => pasek.current?.measureInWindow(f));
    const ustaw = (o: number) => { biezacy.current = o; ustawNadKlawiatura(o); };
    const naPokaz = (e: KeyboardEvent) => {
      if (Platform.OS === 'ios' && !Platform.isPad) { ustaw(Math.max(0, e.endCoordinates.height)); return; }
      zmierz((_x, y, _s, wys) => ustaw(odstepNadKlawiatura({ dolPrzyciskow: y + wys - biezacy.current, gornaKlawiatury: e.endCoordinates.screenY })));
    };
    // iOS: WillShow i DidShow (drugie, gdyby pierwsze przepadło przy zmianie pola); ustawienie jest idempotentne.
    const pokaz = Platform.OS === 'ios' ? [Keyboard.addListener('keyboardWillShow', naPokaz), Keyboard.addListener('keyboardDidShow', naPokaz)] : [Keyboard.addListener('keyboardDidShow', naPokaz)];
    const schowaj = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => ustaw(0));
    return () => { pokaz.forEach((s) => s.remove()); schowaj.remove(); };
  }, [p.zmierz]);
  return (
    <View style={st.arkusz} testID={p.testID}>
      {/* P2-6 (04, Aneks P2 poz. 9): przy AX5 lista akcji nie mieści się — przycięty ostatni wiersz jest wskazówką przewijania; bez wskaźnika, cienia i przyciągania do wiersza (Trening S18). */}
      <ScrollView contentContainerStyle={st.tresc} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {p.zamknij ? (
          <View style={st.naglowekDecyzji} testID="arkusz-naglowek-decyzji">
            <Text style={[st.tytul, st.rosnie]} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA} accessibilityRole="header">{p.tytul}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={p.zamknij.etykieta} onPress={p.zamknij.naZamknij} style={st.zamknij} testID={p.zamknij.testID}>
              <SymbolSf nazwa="xmark" rozmiar={ROZMIAR_SYMBOLU_KAPSULY} kolor={st.zamknijZnak.color} maxSkala={MAX_SKALA_TYTULOWA} />
            </Pressable>
          </View>
        ) : <Text style={st.tytul} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA} accessibilityRole="header">{p.tytul}</Text>}
        {p.children}
      </ScrollView>
      <View ref={pasek} style={[st.przyciski, { paddingBottom: odstep.l + nadKlawiatura }]} testID="arkusz-przyciski">{p.przyciski}</View>
    </View>
  );
}

type RodzajPrzycisku = 'glowny' | 'niszczacy' | 'drugi' | 'tekstowy'; // niszczacy: tylko arkusz decyzji o nieodwracalnym usunięciu, jeden na ekran (04 fix-8, P-275 (2))
export function Przycisk(p: { tekst: string; etykieta?: string; podpowiedz?: string; onPress(): void; rodzaj?: RodzajPrzycisku; testID?: string; rola?: 'button' | 'link'; wylaczony?: boolean; rozwiniety?: boolean; naCzarnym?: boolean; symbol?: NazwaSymbolu; symbolPrzed?: NazwaSymbolu }): React.ReactElement {
  const k = useKolory();
  const st = style(k);
  const r = p.rodzaj ?? 'drugi';
  // Na stałym czarnym tle (M1-089, design-spec „Tło StanWczytywania”, `czarne`): wypełnienie, obrys i tekst z `systemCzarny`, nie z motywu.
  // Tekstowy na czerni: tylko kolor tekstu (bez wypełnienia), jak „Close” w stanie błędu podglądu zdjęć (M1-094).
  const czarny = p.naCzarnym && r !== 'tekstowy' ? { backgroundColor: systemCzarny.przycisk, borderColor: systemCzarny.przycisk } : null;
  // Kolor tekstu przycisku (M3 p4b, P-598): symbol przed tekstem (`symbolPrzed`) ma tę samą barwę co tekst — w stanie nieaktywnym `przyciskNieaktywnyTekst`.
  const kolorTekstu = p.wylaczony ? k.przyciskNieaktywnyTekst : p.naCzarnym && r !== 'tekstowy' ? systemCzarny.przyciskTekst : r === 'glowny' ? k.przyciskTekst : r === 'niszczacy' ? k.niszczacyTekst : k.tekst;
  const tekst = <Text style={[r === 'glowny' ? st.glownyTekst : r === 'niszczacy' ? st.niszczacyTekst : st.drugiTekst, p.naCzarnym && { color: systemCzarny.przyciskTekst }, p.wylaczony && st.wylaczonyTekst]}>{p.tekst}</Text>;
  return (
    <Pressable accessibilityRole={p.rola ?? 'button'} accessibilityLabel={p.etykieta ?? p.tekst} accessibilityHint={p.podpowiedz} onPress={p.onPress} testID={p.testID}
      disabled={p.wylaczony} accessibilityState={p.wylaczony || p.rozwiniety !== undefined ? { ...(p.wylaczony ? { disabled: true } : {}), ...(p.rozwiniety !== undefined ? { expanded: p.rozwiniety } : {}) } : undefined}
      style={[r === 'glowny' ? st.glowny : r === 'niszczacy' ? st.niszczacy : r === 'drugi' ? st.drugi : st.tekstowy, czarny, p.wylaczony && st.wylaczony]}>
      {p.symbol
        ? <SymbolSf nazwa={p.symbol} rozmiar={ROZMIAR_SYMBOLU_KAPSULY} kolor={k.tekst} maxSkala={MAX_SKALA_TYTULOWA} />/* M1-146: sam symbol (rozwinięcie wpisu historii), `tekst` zostaje etykietą VoiceOver */
        : p.symbolPrzed
          ? <View style={st.przedTekstem}><SymbolSf nazwa={p.symbolPrzed} rozmiar={ROZMIAR_SYMBOLU_TRESCI} kolor={kolorTekstu} maxSkala={MAX_SKALA_TYTULOWA} />{tekst}</View>
          : tekst}
    </Pressable>
  );
}

export function Pole(p: { etykieta: string; wartosc: string; naZmiane(t: string): void; liczbowe?: boolean; dziesietne?: boolean; wielowierszowe?: boolean; testID?: string; naKoniec?(): void; naFokus?(): void }): React.ReactElement {
  const k = useKolory();
  const st = style(k);
  const [fokus, ustawFokus] = useState(false); // obrys pola z fokusem: `arkusz.pole.obrysFokus` (stan niesie też kursor, nie tylko kolor)
  return (
    <View style={st.pole}>
      <Text style={st.podpis} importantForAccessibility="no" accessibilityElementsHidden>{p.etykieta}</Text>
      <TextInput accessibilityLabel={p.etykieta} value={p.wartosc} onChangeText={p.naZmiane} testID={p.testID} style={[st.wejscie, fokus && st.wejscieFokus]}
        keyboardType={p.dziesietne ? 'decimal-pad' : p.liczbowe ? 'number-pad' : 'default'} returnKeyType={p.liczbowe || p.dziesietne || p.wielowierszowe ? undefined : 'done'}
        onSubmitEditing={p.naKoniec} onFocus={() => { ustawFokus(true); p.naFokus?.(); }} onBlur={() => ustawFokus(false)} multiline={p.wielowierszowe} textAlignVertical={p.wielowierszowe ? 'top' : undefined}
        autoCorrect={false} placeholderTextColor={k.tekst2} />
    </View>
  );
}

/**
 * Znacznik wyboru jednej opcji (M3-MAK-03, `znaczniki.radio`): kółko 28 pt (od AX1 40) z obwódką `tekst2`, wybrane wypełnione `przycisk` z ptaszkiem w `przyciskTekst` —
 * ten sam język wyboru co plany Oczko Pro. Dekoracyjny (ukryty przed VoiceOver): stan niesie `accessibilityState.selected` wiersza.
 */
export function ZnacznikRadio({ wybrany }: { wybrany: boolean }): React.ReactElement {
  const k = useKolory();
  const r = useWindowDimensions().fontScale >= PROG_KATEGORII_DOSTEPNOSCI ? znaczniki.radioAx5 : znaczniki.radio;
  return (
    <View testID="znacznik-radio" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={[{ width: r, height: r, borderRadius: r / 2, alignItems: 'center', justifyContent: 'center' }, wybrany ? { backgroundColor: k.przycisk } : { borderWidth: 2, borderColor: k.tekst2 }]}>
      {wybrany && <SymbolSf nazwa="checkmark" rozmiar={ROZMIAR_SYMBOLU_TRESCI} kolor={k.przyciskTekst} maxSkala={MAX_SKALA_TYTULOWA} waga="bold" />}
    </View>
  );
}

/** Wybór jednej z opcji jako lista ze znacznikiem (radio, `selected`; design-spec „VoiceOver”: wybory znaczenia i narzędzia jako radio; makieta `formularz-narzedzie`). */
export function Wybor<T extends string>(p: { opcje: { wartosc: T; tekst: string; opis?: string; testID?: string }[]; wybrana: T; naWybor(w: T): void }): React.ReactElement {
  const st = style(useKolory());
  return (
    <View accessibilityRole="radiogroup" style={st.wybor}>
      {p.opcje.map((o, i) => (
        <Pressable key={o.wartosc} accessibilityRole="radio" accessibilityLabel={o.tekst} accessibilityState={{ selected: o.wartosc === p.wybrana }}
          onPress={() => p.naWybor(o.wartosc)} style={[st.opcja, i > 0 && st.opcjaPodzialka]} testID={o.testID}>
          <ZnacznikRadio wybrany={o.wartosc === p.wybrana} />
          <View style={st.opcjaTekst}>
            <Text style={st.zwykly}>{o.tekst}</Text>
            {o.opis && <Text style={st.podpis}>{o.opis}</Text>}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

/**
 * Komunikat błędu; `znak` dodaje „!” w kółku przed zdaniem (makieta `formularz-czesc`: błąd tekstem i znakiem, nie samym kolorem; `arkusz.blad`, bez czerwieni).
 * VoiceOver czyta samo zdanie (etykieta alertu), znak jest ozdobny i ukryty.
 */
export function Komunikat({ tekst, znak }: { tekst: string; znak?: boolean }): React.ReactElement {
  const st = style(useKolory());
  const duzy = useWindowDimensions().fontScale >= PROG_KATEGORII_DOSTEPNOSCI;
  if (!znak) return <Text style={st.blad} accessibilityRole="alert" accessibilityLiveRegion="assertive">{tekst}</Text>;
  const r = duzy ? ark.blad.znakRozmiarAx5 : ark.blad.znakRozmiar;
  return (
    <View accessible accessibilityRole="alert" accessibilityLiveRegion="assertive" accessibilityLabel={tekst} style={st.bladWiersz}>
      <View testID="komunikat-znak" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[st.bladZnak, { width: r, height: r, borderRadius: r / 2 }]}>
        <Text style={st.bladZnakTekst} maxFontSizeMultiplier={ark.blad.znakRozmiarAx5 / ark.blad.znakRozmiar}>!</Text>
      </View>
      <Text style={[st.blad, st.rosnie]}>{tekst}</Text>
    </View>
  );
}
/** Błąd zapisu w formularzu poza licznikiem i wzorem (Aneks P2 poz. 5): tytuł mówi, co się nie udało, druga linia wspólna; arkusz zostaje z wpisanymi wartościami. */
export function KomunikatZapisu({ t }: { t: Tlumacz }): React.ReactElement {
  const st = style(useKolory());
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={{ gap: odstep.s }}>
      <Text style={st.blad}>{t('formularz.blad_zapisu')}</Text>
      <Text style={st.podpis}>{t('wspolne.blad_zapisu_opis')}</Text>
    </View>
  );
}
export function Tresc({ children, podpis, testID, etykieta }: { children: React.ReactNode; podpis?: boolean; testID?: string; etykieta?: string }): React.ReactElement {
  const st = style(useKolory());
  return <Text style={podpis ? st.podpis : st.zwykly} testID={testID} accessibilityLabel={etykieta}>{children}</Text>;
}

/** Liczba całkowita ≥ 0 z pola (cyfry ASCII; pusty, ujemny, ułamek, tekst → null). */
export const liczbaZPola = (t: string): number | null => (/^\d+$/.test(t.trim()) ? Number(t.trim()) : null);

/** Formularz zgłasza trasie, czy wartości różnią się od tych z otwarcia arkusza („Discard changes?”, M1-audytor-generalny-020). */
export function useZglosZmiane(naZmiane: ((zmieniony: boolean) => void) | undefined, zmieniony: boolean): void {
  useEffect(() => { naZmiane?.(zmieniony); }, [naZmiane, zmieniony]);
}

// Przyciski pełnej szerokości (główny, niszczący): promień 14 wg wzorca `.przycisk-pelny` (partia8.html:70, design-spec.md:47) z tokenu `promien.przyciskPelny` (P2-2).
// `przyciskGlowny` (20) to strefa +1, `przyciskDrugi` (14) — przycisk z obrysem w rzędzie wyboru.
export function style(k: Kolory) {
  return StyleSheet.create({
    arkusz: { flex: 1, backgroundColor: k.powierzchnia },
    tresc: { padding: odstep.xl, gap: odstep.m },
    tytul: { ...typografia.tytul, color: k.tekst },
    naglowekDecyzji: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', columnGap: odstep.s },
    rosnie: { flexShrink: 1, flexGrow: 1 },
    zamknij: { minWidth: cel.minimum, minHeight: cel.minimum, alignItems: 'center', justifyContent: 'center' },
    zamknijZnak: { ...typografia.tresc, color: k.tekst },
    naglowek: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: odstep.s, minHeight: cel.minimum, paddingHorizontal: odstep.l, paddingTop: odstep.s },
    naglowekTytul: { ...typografia.tresc, color: k.tekst, fontWeight: '700', flexGrow: 1, flexShrink: 1, flexBasis: 'auto', textAlign: 'center' },
    naglowekDuzy: { paddingHorizontal: odstep.l, paddingTop: odstep.s, rowGap: odstep.xs },
    akcjeDuzy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: cel.minimum },
    naglowekTytulOsobny: { ...typografia.tresc, color: k.tekst, fontWeight: '700', alignSelf: 'stretch', textAlign: 'center' },
    akcja: { minHeight: cel.minimum, minWidth: cel.minimum, justifyContent: 'center' },
    // Nagłówek arkusza formularza (`arkusz.*`): Anuluj i Zapisz/Dodaj w barwie łącza (akcentTekst), nieaktywny — przyciskNieaktywnyTekst.
    anuluj: { ...typografia.tresc, color: kolor(k, ark.anuluj.kolor), fontWeight: waga(ark.anuluj.waga) },
    zapisz: { ...typografia.tresc, color: kolor(k, ark.zapisz.kolor), fontWeight: waga(ark.zapisz.waga) },
    zapiszNieaktywny: { ...typografia.tresc, color: kolor(k, ark.nieaktywny.kolor), fontWeight: waga(ark.nieaktywny.waga) },
    przyciski: { padding: odstep.l, gap: odstep.s, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: k.linia },
    glowny: { minHeight: cel.minimum, borderRadius: promien.przyciskPelny, backgroundColor: k.przycisk, borderWidth: 2, borderColor: k.przycisk, alignItems: 'center', justifyContent: 'center', paddingHorizontal: odstep.l },
    glownyTekst: { ...typografia.przyciskPelny, color: k.przyciskTekst },
    niszczacy: { minHeight: cel.minimum, borderRadius: promien.przyciskPelny, backgroundColor: k.niszczacy, alignItems: 'center', justifyContent: 'center', paddingHorizontal: odstep.l },
    niszczacyTekst: { ...typografia.przyciskPelny, color: k.niszczacyTekst },
    drugi: { minHeight: cel.minimum, borderRadius: promien.przyciskDrugi, borderWidth: 2, borderColor: k.tekst2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: odstep.l },
    tekstowy: { minHeight: cel.minimum, alignItems: 'center', justifyContent: 'center', paddingHorizontal: odstep.l },
    drugiTekst: { ...typografia.tresc, color: k.tekst, fontWeight: '700' },
    pole: { gap: odstep.xs },
    wylaczony: { backgroundColor: k.przyciskNieaktywny, borderStyle: 'dashed', borderColor: k.przyciskNieaktywnyRama }, // Dzianina: przerywana rama, nie sam kolor (design-spec „Kolory”)
    wylaczonyTekst: { color: k.przyciskNieaktywnyTekst },
    przedTekstem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', columnGap: odstep.s },
    // Lista wyboru (makieta `.radio`): tło `tlo` w arkuszu `powierzchnia`, promień listy, wiersze z podziałką `linia`, znacznik 28 pt, cały wiersz jest celem dotyku.
    wybor: { borderRadius: promien.lista, backgroundColor: k.tlo, overflow: 'hidden' },
    opcja: { minHeight: cel.minimum, flexDirection: 'row', alignItems: 'center', columnGap: odstep.m, paddingVertical: odstep.s, paddingHorizontal: odstep.l },
    opcjaPodzialka: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: k.linia },
    opcjaTekst: { flex: 1, flexShrink: 1 },
    // Pole wyboru (checkbox) w wierszu listy wyboru, wzorzec 04 `.pole-wyboru` (fix10-2026-11-01/partia8.html:208–209; design-spec „Partia 8” 001):
    // kwadrat 28 pt z obrysem `m-obrys`, zaznaczone wypełnione `p-tlo` ze znakiem `p-tekst`. Tokeny `cel.poleWyboru` (= `cele.minimum`), `promien.poleWyboru` (= `promienie.plus`), `typografia.znakWyboru`
    // (M1-audytor-generalny-145; wcześniej zastępcze z M1-050); znak ✓ najwyżej ×1,6 (`MAX_SKALA_ZNAKU_WYBORU`) w FormularzeProjektu.tsx.
    wierszWyboru: { flexDirection: 'row', alignItems: 'center', gap: odstep.m, minHeight: cel.minimum },
    poleWyboru: { ...typografia.znakWyboru, color: k.tekst, width: cel.poleWyboru, minHeight: cel.poleWyboru, textAlign: 'center', borderWidth: 2, borderColor: k.tekst2, borderRadius: promien.poleWyboru, overflow: 'hidden' },
    poleWyboruZaznaczone: { backgroundColor: k.przycisk, color: k.przyciskTekst },
    wejscie: { ...typografia.tresc, color: k.tekst, minHeight: ark.pole.minWysokosc, borderRadius: promien.pole, borderWidth: ark.pole.grubosc, borderColor: kolor(k, ark.pole.obrys), paddingHorizontal: odstep.m },
    wejscieFokus: { borderColor: kolor(k, ark.pole.obrysFokus) },
    podpis: { ...typografia.podpis, color: k.tekst2 },
    zwykly: { ...typografia.tresc, color: k.tekst },
    blad: { ...typografia.tresc, color: kolor(k, ark.blad.kolor) },
    bladWiersz: { flexDirection: 'row', alignItems: 'flex-start', columnGap: odstep.s },
    bladZnak: { borderWidth: 2, borderColor: kolor(k, ark.blad.znakObrys), alignItems: 'center', justifyContent: 'center' },
    bladZnakTekst: { ...typografiaDzianiny.mala, fontWeight: '800', color: kolor(k, ark.blad.kolor) },
  });
}
