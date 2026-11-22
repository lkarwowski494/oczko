// Bezpieczny obszar ekranu (pasek stanu, wycięcie, wskaźnik Home): pasek nawigacji ekranów rysuje design-spec, nie system, więc trasa
// pełnoekranowa odsuwa treść od krawędzi (E2E 40290477970: „‹ Projects” i „•••” pod paskiem stanu nie przyjmowały stuknięć).
// iPad (partia 6, design-spec G1, ADR-0026): treść w kolumnie maks. 640 pt na środku, szerokość compact = układ telefonu (`ukladOkna`);
// build E2E: `oczkoE2eSzerokoscOkna` rysuje aplikację w kontenerze tej szerokości (P-225 Q2a). `pelnaSzerokosc`: przeglądarka wzoru (W4b).
import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ukladOkna } from '../domena/uklad';
import { useKolory } from '../ekrany/motyw';
import { szerokoscOknaE2e } from '../platforma/tryb-e2e';

export function Bezpieczny({ children, pelnaSzerokosc }: { children: React.ReactNode; pelnaSzerokosc?: boolean }): React.ReactElement {
  const k = useKolory();
  const okno = useWindowDimensions();
  const szerokosc = Math.min(szerokoscOknaE2e() ?? okno.width, okno.width);
  const u = ukladOkna({ szerokosc, wysokosc: okno.height });
  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: k.papier }}>
      <View testID="kolumna-tresci" style={{ flex: 1, alignSelf: 'center', width: '100%', maxWidth: pelnaSzerokosc ? szerokosc : u.tresc }}>{children}</View>
    </SafeAreaView>
  );
}
