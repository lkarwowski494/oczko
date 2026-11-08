// Grupa zakładek (M3 p2, WD-1, ZM-18): Dziś, Projekty, Narzędzia, Historia — ikona i podpis; licznik, wzór, arkusze i Ustawienia leżą w stosie korzenia
// nad zakładkami (pasek zakładek ukryty na liczniku i wzorze). expo-router `Tabs` (pasek JS z pakietu, bez nowej zależności): kolory i krój z tokenów Dzianiny,
// testID przycisków jak w kontrakcie e2e/README.md (`nav-dzis`, `nav-projekty`, `nav-narzedzia`, `nav-historia`). Zakładka Historia = trasa `dni`
// (kalendarz dni, ER-71), inna niż arkusz `historia` (historia zmian licznika).
import React from 'react';
import { Tabs } from 'expo-router';
import { SymbolSf, type NazwaSymbolu } from '../../src/ekrany/SymbolSf';
import { MAX_SKALA_KAPSULY, ROZMIAR_SYMBOLU, typografiaDzianiny, useKolory } from '../../src/ekrany/motyw';
import { useAplikacja } from '../../src/kompozycja/Kontekst';
import type { Klucz } from '../../src/i18n/typy';

// Symbole z design-spec.md:48 (P-577): Dziś sun.max (z pary calendar.day.timeline.left / sun.max, [DO USTALENIA] okiem na urządzeniu), Projekty square.stack,
// Narzędzia ruler, Historia calendar.
const ZAKLADKI: { trasa: string; klucz: Klucz; symbol: NazwaSymbolu; testID: string }[] = [
  { trasa: 'index', klucz: 'zakladki.dzis', symbol: 'sun.max', testID: 'nav-dzis' },
  { trasa: 'projekty', klucz: 'zakladki.projekty', symbol: 'square.stack', testID: 'nav-projekty' },
  { trasa: 'narzedzia', klucz: 'zakladki.narzedzia', symbol: 'ruler', testID: 'nav-narzedzia' },
  { trasa: 'dni', klucz: 'zakladki.historia', symbol: 'calendar', testID: 'nav-historia' },
];

export default function Zakladki(): React.ReactElement {
  const k = useKolory();
  const { kontener } = useAplikacja();
  const t = kontener.j.t;
  return (
    // „Back” na Narzędziach i Historii (M1-016, scenariusz e2e 16) wraca do poprzednio otwartej zakładki — historia zakładek, nie pierwsza zakładka.
    <Tabs backBehavior="history" screenOptions={{
      headerShown: false,
      sceneStyle: { backgroundColor: k.tlo },
      tabBarStyle: { backgroundColor: k.pasek, borderTopColor: k.pasekLinia },
      tabBarActiveTintColor: k.zakladkaWybrana,
      tabBarInactiveTintColor: k.zakladka,
      tabBarLabelStyle: typografiaDzianiny.zakladka,
      tabBarAllowFontScaling: true,
    }}>
      {ZAKLADKI.map((z) => (
        <Tabs.Screen key={z.trasa} name={z.trasa} options={{
          title: t(z.klucz),
          tabBarAccessibilityLabel: t(z.klucz),
          tabBarButtonTestID: z.testID,
          tabBarIcon: ({ color }) => <SymbolSf nazwa={z.symbol} rozmiar={ROZMIAR_SYMBOLU} kolor={color} maxSkala={MAX_SKALA_KAPSULY} />,
        }} />
      ))}
    </Tabs>
  );
}
