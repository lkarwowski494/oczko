// Menu przeglądarki wzoru: arkusz u dołu ekranu z pozycjami (••• i lista wzorów ▾; design-spec „Wzór, rysik i iPad”). Wydzielone bez zmian z WzorPrzegladarka.tsx (limit rozmiaru pliku).
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { cel, MAX_SKALA_TYTULOWA, odstep, ROZMIAR_SYMBOLU, typografia, useKolory } from './motyw';
import type { Tlumacz } from './wspolne';
import { SymbolSf } from './SymbolSf';

export type StyleMenu = { menuTlo: ViewStyle; menu: ViewStyle; pozycja: ViewStyle; tresc: TextStyle; niszczaca: TextStyle };

export function Menu(p: { st: StyleMenu; zamknij(): void; children: React.ReactNode }) {
  return (
    <View style={p.st.menuTlo} accessibilityViewIsModal>
      <Pressable style={StyleSheet.absoluteFill} onPress={p.zamknij} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <ScrollView style={p.st.menu} accessibilityRole="menu">{p.children}</ScrollView>
    </View>
  );
}
export function Pozycja(p: { st: StyleMenu; tekst: string; id: string; niszczaca?: boolean; onPress(): void }) {
  return (
    <Pressable accessibilityRole="menuitem" accessibilityLabel={p.tekst} onPress={p.onPress} style={p.st.pozycja} testID={p.id}>
      <Text style={[p.st.tresc, p.niszczaca && p.st.niszczaca]}>{p.tekst}</Text>
    </Pressable>
  );
}

/**
 * Lista wzorów projektu (▾, W9b): ✓ przy bieżącym; stuknięcie wybiera wzór (przełączanie i zamknięcie menu robi wywołujący). Pod wzorami wiersze stron WWW
 * czekających na sieć z ✕ (aneks partii 8, poz. 12 C; `wzor.czeka_siec`): wiersz niczego nie przełącza, a po zapisie strony zamienia się we wzór.
 */
export function MenuWzorow(p: { st: StyleMenu; t: Tlumacz; wzory: { wzorId: string; nazwa: string }[]; oczekujace: { id: string; nazwa: string }[]; wzorId: string; zamknij(): void; naWybor(wzorId: string): void; naUsunOczekujacy(id: string): void }) {
  const k = useKolory();
  const w = StyleSheet.create({
    wiersz: { flexDirection: 'row', alignItems: 'center', gap: odstep.s }, rosnie: { flex: 1 }, podpis: { ...typografia.podpis, color: k.olowek },
    ikona: { minWidth: cel.minimum, minHeight: cel.minimum, alignItems: 'center', justifyContent: 'center' },
  });
  return (
    <Menu st={p.st} zamknij={p.zamknij}>
      {p.wzory.map((x) => (
        <Pressable key={x.wzorId} accessibilityRole="menuitem" accessibilityLabel={x.nazwa} accessibilityState={{ selected: x.wzorId === p.wzorId }} onPress={() => p.naWybor(x.wzorId)} style={[p.st.pozycja, w.wiersz]}>
          <Text style={[p.st.tresc, w.rosnie]}>{x.nazwa}</Text>
          {x.wzorId === p.wzorId && <SymbolSf nazwa="checkmark" rozmiar={ROZMIAR_SYMBOLU} kolor={k.akcentTekst} maxSkala={MAX_SKALA_TYTULOWA} />}{/* 011: znaczniki.wyboruListy */}
        </Pressable>
      ))}
      {p.oczekujace.map((o) => (
        <View key={o.id} style={[p.st.pozycja, w.wiersz]} testID="wzor-czeka-siec">
          <View style={w.rosnie}>
            <Text style={p.st.tresc}>{o.nazwa}</Text>
            <Text style={w.podpis}>{p.t('wzor.czeka_siec')}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={p.t('wzor.usun_oczekujacy_a11y', { nazwa: o.nazwa })} style={w.ikona} onPress={() => p.naUsunOczekujacy(o.id)}>
            <SymbolSf nazwa="xmark" rozmiar={ROZMIAR_SYMBOLU} kolor={k.grafit} maxSkala={MAX_SKALA_TYTULOWA} />
          </Pressable>
        </View>
      ))}
    </Menu>
  );
}
