// Rząd podpisanych akcji pod liczbą (M3 p3a, ZM-04, P-580, P-581, P-586): Notatka, Wzór, Cel, Stoper, Historia (makieta dzianina/ekrany.html `licznik`, `.akcje`).
// Każda akcja to symbol SF nad podpisem; przy kategoriach dostępności (AX1+) akcje są listą pod notatką — symbol obok podpisu (`.duzy .akcje`).
// Komponent `AkcjaLicznika` dzieli ze stoperem (Stoper.tsx): ten sam wygląd komórki, w trakcie sesji zamiast podpisu stoi czas.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import tokeny from '../../docs/design/tokeny.json';
import { cel, MAX_SKALA_KAPSULY, MAX_SKALA_TYTULOWA, odstep, promien, typografiaDzianiny as ty, useKolory, type Kolory } from './motyw';
import { SymbolSf, type NazwaSymbolu } from './SymbolSf';
import type { Tlumacz } from './wspolne';

/** Stan „biegnie” stopera (M3-MAK-03, P-586 (2a), token `stoper.biegnie`): tło, rama, symbol i czas z nazw ról kolorów w tokenie, nie z wypełnienia `akcent`. */
const biegnie = tokeny.stoper.biegnie;
const rola = (k: Kolory, nazwa: string): string => k[nazwa as keyof Kolory];

/** Rozmiary symbolu akcji: 24 pt w rzędzie, 40 pt w liście AX (makieta `.akcje a .ik`, `.duzy .akcje a .ik`) — wymiary rysunkowe z makiety, nie dziedzinowe. */
export const ROZMIAR_SYMBOLU_AKCJI = 24, ROZMIAR_SYMBOLU_AKCJI_AX = 40;

/** Wymiar komórki rzędu akcji (M3-LIC-02, makieta `.akcje`: grid auto-fit minmax(64px, 1fr)): podstawa 64 pt i równy przyrost, rząd zawija się. Korzeń `Stoper` bierze ten sam wzór, żeby nie zwinął się do 0. */
export const KOMORKA_AKCJI = { flexGrow: 1, flexBasis: cel.paskaWzoru.minSzerokosc } as const;

export type PropsAkcji = {
  symbol: NazwaSymbolu;
  podpis: string;
  /** Nazwa dla VoiceOver; bez niej — podpis (WCAG 2.5.3: nazwa zawiera widoczny tekst). */
  etykieta?: string;
  onPress?(): void;
  testID: string;
  wylaczony?: boolean;
  duzyTekst: boolean;
  /** Sesja stopera trwa: komórka z ramą `akcentTekst` (token `stoper.biegnie`; stan niesie też symbol i nazwa dla VoiceOver, nie sam kolor) — tylko dla `Stoper`. */
  podkreslona?: boolean;
  /** Podpis to czas (stoper): cyfry tabelaryczne, żeby upływ sekund nie przesuwał tekstu. */
  cyfryTabelaryczne?: boolean;
};

export function AkcjaLicznika(p: PropsAkcji): React.ReactElement {
  const k = useKolory();
  const st = styl(k);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={p.etykieta ?? p.podpis} accessibilityState={p.wylaczony ? { disabled: true } : undefined}
      disabled={p.wylaczony || !p.onPress} onPress={p.onPress} style={[st.akcja, p.duzyTekst ? st.akcjaAx : null, p.podkreslona ? st.akcjaAktywna : null, p.podkreslona && p.duzyTekst ? st.akcjaAktywnaAx : null, p.wylaczony ? st.akcjaWylaczona : null]} testID={p.testID}>
      <SymbolSf nazwa={p.symbol} rozmiar={p.duzyTekst ? ROZMIAR_SYMBOLU_AKCJI_AX : ROZMIAR_SYMBOLU_AKCJI} kolor={p.podkreslona ? rola(k, biegnie.ikona) : k.ikona} maxSkala={MAX_SKALA_TYTULOWA} />
      <Text style={[st.podpis, p.cyfryTabelaryczne ? { fontVariant: ['tabular-nums'] } : null, p.podkreslona ? st.czasBiegnie : null]} maxFontSizeMultiplier={MAX_SKALA_KAPSULY} numberOfLines={p.duzyTekst ? undefined : 1} adjustsFontSizeToFit={!p.duzyTekst} accessible={false}>{p.podpis}</Text>
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
    rzad: { flexDirection: 'row', flexWrap: 'wrap', gap: odstep.s },
    listaAx: { flexDirection: 'column', gap: odstep.s },
    akcja: { ...KOMORKA_AKCJI, minHeight: cel.paskaWzoru.minSzerokosc, alignItems: 'center', justifyContent: 'center', gap: odstep.xs, paddingVertical: odstep.s, paddingHorizontal: odstep.xs, borderRadius: promien.przycisk, backgroundColor: k.powierzchnia },
    akcjaAx: { flexGrow: 0, flexBasis: 'auto', flexDirection: 'row', justifyContent: 'flex-start', alignSelf: 'stretch', gap: odstep.m, paddingHorizontal: odstep.l },
    // Rama 2 pt wchodzi do wnętrza komórki: odstęp wewnętrzny maleje o jej grubość, więc biegnący stoper nie zmienia szerokości kolumny ani miejsca na podpis (M3-LIC-02).
    akcjaAktywna: { backgroundColor: rola(k, biegnie.tlo), borderWidth: biegnie.gruboscRamy, borderColor: rola(k, biegnie.rama), paddingHorizontal: odstep.xs - biegnie.gruboscRamy, paddingVertical: odstep.s - biegnie.gruboscRamy },
    akcjaAktywnaAx: { paddingHorizontal: odstep.l - biegnie.gruboscRamy },
    akcjaWylaczona: { opacity: 0.5 },
    podpis: { ...ty.mala, fontWeight: '600', color: k.tekst },
    czasBiegnie: { fontWeight: String(biegnie.wagaCzasu) as '700', color: rola(k, biegnie.czas), fontVariant: [biegnie.cyfry] as ['tabular-nums'] },
  });
}
