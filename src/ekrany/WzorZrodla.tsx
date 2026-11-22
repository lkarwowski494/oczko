// Ekran „Dodaj wzór” (trasa `/wzor` bez otwartego wzoru; design-spec „Dodanie wzoru” W7a, ZM-06): menu źródeł otwarte od razu w przewijanej treści.
// Wydzielone z `app/wzor.tsx` (limit 20 KB na plik trasy, `jakosc:kontrole`).
import React from 'react';
import { ScrollView } from 'react-native';
import { GrupaWzorow, type PropsGrupyWzorow } from './WzorGrupa';
import { Wstecz } from './Pasek';
import { odstep, useKolory } from './motyw';

/**
 * WL-1171-01 (P-830): to ekran w stosie (push), więc ma widoczne „Back” jak inne ekrany (design-spec „wstecz” 006; analogia Trening docs/22:454 — gest od krawędzi
 * zostaje dodatkiem, nie jedyną drogą). Etykieta = tytuł poprzedniego ekranu z `Wstecz`.
 */
export function EkranZrodelWzoru(p: PropsGrupyWzorow & { naWstecz(): void }): React.ReactElement {
  const { naWstecz, ...grupa } = p;
  const k = useKolory();
  // 07-p3 (AX5): menu źródeł ma przy AX5 ok. 2117 pt — w ScrollView, żeby ostatnie źródło było osiągalne
  return (
    <ScrollView style={{ flex: 1, backgroundColor: k.papier }} contentContainerStyle={{ padding: odstep.l }}>
      <Wstecz tekst={p.t('wspolne.wstecz')} onPress={naWstecz} />
      <GrupaWzorow {...grupa} />
    </ScrollView>
  );
}
