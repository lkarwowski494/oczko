// Ekran „Dodaj wzór” (trasa `/wzor` bez otwartego wzoru; design-spec „Dodanie wzoru” W7a, ZM-06): menu źródeł otwarte od razu w przewijanej treści.
// Wydzielone z `app/wzor.tsx` (limit 20 KB na plik trasy, `jakosc:kontrole`).
import React from 'react';
import { ScrollView } from 'react-native';
import { GrupaWzorow, type PropsGrupyWzorow } from './WzorGrupa';
import { odstep, useKolory } from './motyw';

export function EkranZrodelWzoru(p: PropsGrupyWzorow): React.ReactElement {
  const k = useKolory();
  // 07-p3 (AX5): menu źródeł ma przy AX5 ok. 2117 pt — w ScrollView, żeby ostatnie źródło było osiągalne
  return (
    <ScrollView style={{ flex: 1, backgroundColor: k.papier }} contentContainerStyle={{ padding: odstep.l }}>
      <GrupaWzorow {...p} />
    </ScrollView>
  );
}
