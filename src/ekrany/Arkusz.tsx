// Wspólne elementy arkuszy (design-spec „Komponenty”: arkusze systemowe — treść się przewija, przyciski zawsze widoczne). Dwa rodzaje (P-275 (4)):
// arkusz formularza — Cancel / tytuł / Save w nagłówku u góry (`naglowek-arkusza` makiet, Trening design-spec:66), arkusz decyzji — przyciski na dole.
// Prezentację arkusza (formSheet) daje trasa expo-router; tu tylko zawartość. Wartości z modułu motywu (tokeny 04).
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type KeyboardEvent } from 'react-native';
import { cel, odstep, promien, typografia, useKolory, type Kolory } from './motyw';
import type { Tlumacz } from './wspolne';

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
export type FormularzArkusza = { t: Tlumacz; naZapisz(): void; naAnuluj(): void; zapisz?: string; zapiszA11y?: string; testZapisz?: string; wylaczony?: boolean };

/** Arkusz decyzji: ✕ w prawym górnym rogu nagłówka (design-spec :111, słownik interakcji „Zamknij”; 04-studio-projektowe-004); tytuł przed ✕ w kolejności VoiceOver. */
export type ZamknijArkusza = { etykieta: string; naZamknij(): void; testID?: string };

export function Arkusz(p: { tytul: string; children: React.ReactNode; przyciski?: React.ReactNode; formularz?: FormularzArkusza; zamknij?: ZamknijArkusza; testID?: string; zmierz?: Pomiar }): React.ReactElement {
  return p.formularz ? <ArkuszFormularza {...p} f={p.formularz} /> : <ArkuszDecyzji {...p} />;
}

/** Formularz: nagłówek nad przewijaną treścią — klawiatura go nie zasłania (bez nasłuchu klawiatury); przy dużym tekście tytuł łamie się pod przyciskami. */
function ArkuszFormularza(p: { tytul: string; children: React.ReactNode; f: FormularzArkusza; testID?: string }): React.ReactElement {
  const st = style(useKolory());
  const { f } = p;
  const zapisz = f.zapisz ?? f.t('wspolne.zapisz');
  return (
    <View style={st.arkusz} testID={p.testID}>
      <View style={st.naglowek} testID="arkusz-naglowek">
        <Pressable accessibilityRole="button" accessibilityLabel={f.t('wspolne.anuluj')} onPress={f.naAnuluj} style={st.akcja} testID="arkusz-zamknij">
          <Text style={st.anuluj}>{f.t('wspolne.anuluj')}</Text>
        </Pressable>
        <Text style={st.naglowekTytul} accessibilityRole="header">{p.tytul}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={f.zapiszA11y ?? zapisz} onPress={f.naZapisz} style={st.akcja} testID={f.testZapisz ?? 'formularz-zapisz'}
          disabled={f.wylaczony} accessibilityState={f.wylaczony ? { disabled: true } : undefined}>
          <Text style={[st.zapisz, f.wylaczony && st.wylaczonyTekst]}>{zapisz}</Text>
        </Pressable>
      </View>
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
      <ScrollView contentContainerStyle={st.tresc} keyboardShouldPersistTaps="handled">
        {p.zamknij ? (
          <View style={st.naglowekDecyzji} testID="arkusz-naglowek-decyzji">
            <Text style={[st.tytul, st.rosnie]} accessibilityRole="header">{p.tytul}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={p.zamknij.etykieta} onPress={p.zamknij.naZamknij} style={st.zamknij} testID={p.zamknij.testID}>
              <Text style={st.zamknijZnak} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>✕</Text>
            </Pressable>
          </View>
        ) : <Text style={st.tytul} accessibilityRole="header">{p.tytul}</Text>}
        {p.children}
      </ScrollView>
      <View ref={pasek} style={[st.przyciski, { paddingBottom: odstep.l + nadKlawiatura }]} testID="arkusz-przyciski">{p.przyciski}</View>
    </View>
  );
}

type RodzajPrzycisku = 'glowny' | 'niszczacy' | 'drugi' | 'tekstowy'; // niszczacy: tylko arkusz decyzji o nieodwracalnym usunięciu, jeden na ekran (04 fix-8, P-275 (2))
export function Przycisk(p: { tekst: string; etykieta?: string; onPress(): void; rodzaj?: RodzajPrzycisku; testID?: string; rola?: 'button' | 'link'; wylaczony?: boolean }): React.ReactElement {
  const st = style(useKolory());
  const r = p.rodzaj ?? 'drugi';
  return (
    <Pressable accessibilityRole={p.rola ?? 'button'} accessibilityLabel={p.etykieta ?? p.tekst} onPress={p.onPress} testID={p.testID}
      disabled={p.wylaczony} accessibilityState={p.wylaczony ? { disabled: true } : undefined}
      style={[r === 'glowny' ? st.glowny : r === 'niszczacy' ? st.niszczacy : r === 'drugi' ? st.drugi : st.tekstowy, p.wylaczony && st.wylaczony]}>
      <Text style={[r === 'glowny' ? st.glownyTekst : r === 'niszczacy' ? st.niszczacyTekst : st.drugiTekst, p.wylaczony && st.wylaczonyTekst]}>{p.tekst}</Text>
    </Pressable>
  );
}

export function Pole(p: { etykieta: string; wartosc: string; naZmiane(t: string): void; liczbowe?: boolean; dziesietne?: boolean; wielowierszowe?: boolean; testID?: string; naKoniec?(): void }): React.ReactElement {
  const k = useKolory();
  const st = style(k);
  return (
    <View style={st.pole}>
      <Text style={st.podpis} importantForAccessibility="no" accessibilityElementsHidden>{p.etykieta}</Text>
      <TextInput accessibilityLabel={p.etykieta} value={p.wartosc} onChangeText={p.naZmiane} testID={p.testID} style={st.wejscie}
        keyboardType={p.dziesietne ? 'decimal-pad' : p.liczbowe ? 'number-pad' : 'default'} returnKeyType={p.liczbowe || p.dziesietne || p.wielowierszowe ? undefined : 'done'}
        onSubmitEditing={p.naKoniec} multiline={p.wielowierszowe} textAlignVertical={p.wielowierszowe ? 'top' : undefined}
        autoCorrect={false} placeholderTextColor={k.olowek} />
    </View>
  );
}

/** Wybór jednej z opcji (radio, `selected`; design-spec „VoiceOver”: wybory znaczenia i narzędzia jako radio). */
export function Wybor<T extends string>(p: { opcje: { wartosc: T; tekst: string; opis?: string }[]; wybrana: T; naWybor(w: T): void }): React.ReactElement {
  const st = style(useKolory());
  return (
    <View accessibilityRole="radiogroup" style={st.wybor}>
      {p.opcje.map((o) => (
        <Pressable key={o.wartosc} accessibilityRole="radio" accessibilityLabel={o.tekst} accessibilityState={{ selected: o.wartosc === p.wybrana }}
          onPress={() => p.naWybor(o.wartosc)} style={[st.opcja, o.wartosc === p.wybrana && st.opcjaWybrana]}>
          <Text style={st.drugiTekst}>{o.tekst}</Text>
          {o.opis && <Text style={st.podpis}>{o.opis}</Text>}
        </Pressable>
      ))}
    </View>
  );
}

/** Komunikat błędu; `znak` dodaje „!” przed tekstem (design-spec: błąd tekstem i znakiem, nie samym kolorem), VoiceOver czyta sam tekst. */
export function Komunikat({ tekst, znak }: { tekst: string; znak?: boolean }): React.ReactElement {
  const st = style(useKolory());
  return <Text style={st.blad} accessibilityRole="alert" accessibilityLiveRegion="assertive" accessibilityLabel={znak ? tekst : undefined}>{znak ? `! ${tekst}` : tekst}</Text>;
}
export function Tresc({ children, podpis, testID }: { children: React.ReactNode; podpis?: boolean; testID?: string }): React.ReactElement {
  const st = style(useKolory());
  return <Text style={podpis ? st.podpis : st.zwykly} testID={testID}>{children}</Text>;
}

/** Liczba całkowita ≥ 0 z pola (cyfry ASCII; pusty, ujemny, ułamek, tekst → null). */
export const liczbaZPola = (t: string): number | null => (/^\d+$/.test(t.trim()) ? Number(t.trim()) : null);

export function style(k: Kolory) {
  return StyleSheet.create({
    arkusz: { flex: 1, backgroundColor: k.arkusz },
    tresc: { padding: odstep.xl, gap: odstep.m },
    tytul: { ...typografia.tytul, color: k.grafit },
    naglowekDecyzji: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', columnGap: odstep.s },
    rosnie: { flexShrink: 1, flexGrow: 1 },
    zamknij: { minWidth: cel.minimum, minHeight: cel.minimum, alignItems: 'center', justifyContent: 'center' },
    zamknijZnak: { ...typografia.tresc, color: k.grafit },
    naglowek: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: odstep.s, minHeight: cel.minimum, paddingHorizontal: odstep.l, paddingTop: odstep.s },
    naglowekTytul: { ...typografia.tresc, color: k.grafit, fontWeight: '700', flexGrow: 1, flexShrink: 1, flexBasis: 'auto', textAlign: 'center' },
    akcja: { minHeight: cel.minimum, minWidth: cel.minimum, justifyContent: 'center' },
    anuluj: { ...typografia.tresc, color: k.grafit },
    zapisz: { ...typografia.tresc, color: k.grafit, fontWeight: '600' },
    przyciski: { padding: odstep.l, gap: odstep.s, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: k.linia },
    glowny: { minHeight: cel.minimum, borderRadius: promien.przyciskGlowny, backgroundColor: k.przyciskTlo, alignItems: 'center', justifyContent: 'center', paddingHorizontal: odstep.l },
    glownyTekst: { ...typografia.przycisk, color: k.przyciskTekst },
    niszczacy: { minHeight: cel.minimum, borderRadius: promien.przyciskGlowny, backgroundColor: k.przyciskNiszczacyTlo, alignItems: 'center', justifyContent: 'center', paddingHorizontal: odstep.l },
    niszczacyTekst: { ...typografia.przycisk, color: k.przyciskNiszczacyTekst },
    drugi: { minHeight: cel.minimum, borderRadius: promien.przyciskDrugi, borderWidth: 2, borderColor: k.drugiPrzyciskObrys, alignItems: 'center', justifyContent: 'center', paddingHorizontal: odstep.l },
    tekstowy: { minHeight: cel.minimum, alignItems: 'center', justifyContent: 'center', paddingHorizontal: odstep.l },
    drugiTekst: { ...typografia.tresc, color: k.grafit, fontWeight: '700' },
    pole: { gap: odstep.xs },
    wylaczony: { backgroundColor: k.przyciskNieaktywnyTlo, borderColor: k.przyciskNieaktywnyTlo }, // design-spec R1 (bez obrysu)
    wylaczonyTekst: { color: k.przyciskNieaktywnyTekst },
    wybor: { gap: odstep.s },
    opcja: { minHeight: cel.minimum, borderRadius: promien.pole, borderWidth: 2, borderColor: k.linia, padding: odstep.m, justifyContent: 'center' },
    opcjaWybrana: { borderColor: k.drugiPrzyciskObrys },
    wejscie: { ...typografia.tresc, color: k.grafit, minHeight: cel.minimum, borderRadius: promien.pole, borderWidth: 2, borderColor: k.drugiPrzyciskObrys, paddingHorizontal: odstep.m },
    podpis: { ...typografia.podpis, color: k.olowek },
    zwykly: { ...typografia.tresc, color: k.grafit },
    blad: { ...typografia.tresc, color: k.blad },
  });
}
