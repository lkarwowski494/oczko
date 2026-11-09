// 04-studio-projektowe-024, diagnoza (P-629): ramki układu z urządzenia w buildzie E2E — `onLayout` nazwanych widoków → tekst `e2e-ramki-kolumny`
// („nazwa x,y,w,h; …; okno WxH fs S”, współrzędne względem rodzica, zaokrąglone do pt). Ładowany wyłącznie przez `paneleE2e` (P-238), więc poza buildem
// E2E nie trafia do bundla. Tekst leży absolutnie (nie zmienia układu, który mierzy) i nie przyjmuje stuknięć; bez t(), jak inne panele E2E.
import React, { useMemo, useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';

export type RamkiE2e = { zmierz: Readonly<Record<string, (e: LayoutChangeEvent) => void>>; tekst: string };

/** Hak: `zmierz[nazwa]` do `onLayout`; `tekst` w kolejności `nazwy`, brak pomiaru = „-”, na końcu okno i skala tekstu.
 *  Wołany przy każdym renderze (liczba haków stała; obrót zmienia tylko `uklad`, 024 run 42678725514). Zmiana `uklad` zeruje pomiary, żeby ramki
 *  z poprzedniego ułożenia nie udawały bieżącego (wzorzec React „informacja z poprzedniego renderu”: setState w trakcie renderu). */
export function useRamkiE2e(nazwy: readonly string[], okno: { width: number; height: number; fontScale: number }, uklad: string): RamkiE2e {
  const [stan, ustaw] = useState<{ uklad: string; ramki: Readonly<Record<string, string>> }>({ uklad, ramki: {} });
  if (stan.uklad !== uklad) ustaw({ uklad, ramki: {} });
  const ramki = stan.uklad === uklad ? stan.ramki : {};
  const klucz = nazwy.join('|');
  const zmierz = useMemo(() => Object.fromEntries(klucz.split('|').map((n) => [n, (e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    const r = [x, y, width, height].map((v) => Math.round(v)).join(',');
    ustaw((s) => (s.ramki[n] === r ? s : { ...s, ramki: { ...s.ramki, [n]: r } }));
  }])), [klucz]);
  const tekst = `${nazwy.map((n) => `${n} ${ramki[n] ?? '-'}`).join('; ')}; okno ${Math.round(okno.width)}x${Math.round(okno.height)} fs ${okno.fontScale}`;
  return { zmierz, tekst };
}

/** Tekst ramek dla scenariusza (copyTextFrom): na górze rodzica, poza przepływem układu, bez stuknięć i bez skalowania tekstu. */
export function TekstRamek({ tekst }: { tekst: string }): React.ReactElement {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
      <Text testID="e2e-ramki-kolumny" style={{ fontSize: 9 }} maxFontSizeMultiplier={1}>{tekst}</Text>
    </View>
  );
}
