// Menu przeglądarki wzoru: arkusz u dołu ekranu z pozycjami (••• i przełączanie wzorów; design-spec „Wzór, rysik i iPad”). Wydzielone bez zmian z WzorPrzegladarka.tsx (limit rozmiaru pliku).
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';

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
