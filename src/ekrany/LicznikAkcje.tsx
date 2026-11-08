// Rząd podpisanych akcji pod liczbą (M3 p3a, ZM-04, P-580, P-581, P-586): Notatka, Wzór, Cel, Stoper, Historia (makieta dzianina/ekrany.html `licznik`, `.akcje`).
// Każda akcja to symbol SF nad podpisem; przy kategoriach dostępności (AX1+) akcje są listą pod notatką — symbol obok podpisu (`.duzy .akcje`).
// Komponent `AkcjaLicznika` dzieli ze stoperem (Stoper.tsx): ten sam wygląd komórki, w trakcie sesji zamiast podpisu stoi czas.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cel, MAX_SKALA_KAPSULY, MAX_SKALA_TYTULOWA, odstep, promien, typografiaDzianiny as ty, useKolory, type Kolory } from './motyw';
import { SymbolSf, type NazwaSymbolu } from './SymbolSf';
import type { Tlumacz } from './wspolne';

/** Rozmiary symbolu akcji: 24 pt w rzędzie, 40 pt w liście AX (makieta `.akcje a .ik`, `.duzy .akcje a .ik`) — wymiary rysunkowe z makiety, nie dziedzinowe. */
export const ROZMIAR_SYMBOLU_AKCJI = 24, ROZMIAR_SYMBOLU_AKCJI_AX = 40;

export type PropsAkcji = {
  symbol: NazwaSymbolu;
  podpis: string;
  /** Nazwa dla VoiceOver; bez niej — podpis (WCAG 2.5.3: nazwa zawiera widoczny tekst). */
  etykieta?: string;
  onPress?(): void;
  testID: string;
  wylaczony?: boolean;
  duzyTekst: boolean;
  /** Sesja stopera trwa: komórka w kolorze akcentu (stan niesie też symbol i nazwa dla VoiceOver, nie sam kolor) — tylko dla `Stoper`. */
  podkreslona?: boolean;
  /** Podpis to czas (stoper): cyfry tabelaryczne, żeby upływ sekund nie przesuwał tekstu. */
  cyfryTabelaryczne?: boolean;
};

export function AkcjaLicznika(p: PropsAkcji): React.ReactElement {
  const k = useKolory();
  const st = styl(k);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={p.etykieta ?? p.podpis} accessibilityState={p.wylaczony ? { disabled: true } : undefined}
      disabled={p.wylaczony || !p.onPress} onPress={p.onPress} style={[st.akcja, p.duzyTekst ? st.akcjaAx : null, p.podkreslona ? st.akcjaAktywna : null, p.wylaczony ? st.akcjaWylaczona : null]} testID={p.testID}>
      <SymbolSf nazwa={p.symbol} rozmiar={p.duzyTekst ? ROZMIAR_SYMBOLU_AKCJI_AX : ROZMIAR_SYMBOLU_AKCJI} kolor={p.podkreslona ? k.naAkcencie : k.ikona} maxSkala={MAX_SKALA_TYTULOWA} />
      <Text style={[st.podpis, p.cyfryTabelaryczne ? { fontVariant: ['tabular-nums'] } : null, p.podkreslona ? { color: k.naAkcencie } : null]} maxFontSizeMultiplier={MAX_SKALA_KAPSULY} numberOfLines={p.duzyTekst ? undefined : 1} adjustsFontSizeToFit={!p.duzyTekst} accessible={false}>{p.podpis}</Text>
    </Pressable>
  );
}

export type PropsRzedu = {
  t: Tlumacz;
  duzyTekst: boolean;
  /** Licznik oczek (BR-LIC-006): bez celu części. */
  oczka: boolean;
  naNotatka?(): void; naWzor?(): void; naCel?(): void; naHistorie(): void;
  /** Komponent stopera z kompozycji; bez niego akcja jest widoczna, ale nieaktywna (brak projektu = nie ma do czego przypisać sesji). */
  stoper?: React.ReactNode;
};

export function RzadAkcji(p: PropsRzedu): React.ReactElement {
  const { t, duzyTekst } = p;
  const k = useKolory();
  const st = styl(k);
  return (
    <View style={duzyTekst ? st.listaAx : st.rzad} testID="licznik-akcje">
      <AkcjaLicznika symbol="note.text" podpis={t('licznik.akcja_notatka')} onPress={p.naNotatka} testID="licznik-akcja-notatka" duzyTekst={duzyTekst} />
      <AkcjaLicznika symbol="doc.text" podpis={t('licznik.akcja_wzor')} onPress={p.naWzor} testID="licznik-wzor" duzyTekst={duzyTekst} />
      {!p.oczka && <AkcjaLicznika symbol="flag" podpis={t('licznik.akcja_cel')} etykieta={t('licznik.akcja_cel_a11y')} onPress={p.naCel} testID="licznik-cel" duzyTekst={duzyTekst} />}
      {p.stoper ?? <AkcjaLicznika symbol="stopwatch" podpis={t('licznik.akcja_stoper')} wylaczony testID="licznik-stoper" duzyTekst={duzyTekst} />}
      <AkcjaLicznika symbol="clock.arrow.circlepath" podpis={t('licznik.akcja_historia')} onPress={p.naHistorie} testID="licznik-historia" duzyTekst={duzyTekst} />
    </View>
  );
}

function styl(k: Kolory) {
  return StyleSheet.create({
    rzad: { flexDirection: 'row', gap: odstep.s },
    listaAx: { flexDirection: 'column', gap: odstep.s },
    akcja: { flex: 1, minWidth: cel.paskaWzoru.minSzerokosc, minHeight: cel.paskaWzoru.minSzerokosc, alignItems: 'center', justifyContent: 'center', gap: odstep.xs, paddingVertical: odstep.s, paddingHorizontal: odstep.xs, borderRadius: promien.przycisk, backgroundColor: k.powierzchnia },
    akcjaAx: { flexDirection: 'row', justifyContent: 'flex-start', alignSelf: 'stretch', gap: odstep.m, paddingHorizontal: odstep.l },
    akcjaAktywna: { backgroundColor: k.akcent },
    akcjaWylaczona: { opacity: 0.5 },
    podpis: { ...ty.mala, fontWeight: '600', color: k.tekst },
  });
}
