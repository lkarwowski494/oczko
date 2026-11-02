// Arkusz notatki na wzorze (F-56, 07-jakosc-007, P-330 2A; design-spec „Partia 8”, 007): stuknięcie chipu z widoku natywnego otwiera arkusz
// „Close / Note for row n / Edit” z treścią i wierszem „Delete note” (alert z potwierdzeniem); Edit przechodzi w „Cancel / Save”.
// Chip zbiorczy (≥ 2 notatki jednego rzędu) otwiera najpierw listę „Notes on page n”. Chipy rysuje widok natywny (`oczko-wzor`), tu tylko arkusz.
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ChipNotatki } from '../domena/znacznik-wzoru';
import { cel as rozmiary, odstep, promien, typografia, useKolory, type Kolory } from './motyw';
import type { Tlumacz } from './wspolne';

export type PropsArkuszaNotatek = {
  t: Tlumacz;
  chipy?: ChipNotatki[];
  otwartyChip?: number | null;                    // rząd licznika chipu otwartego w widoku natywnym
  naChip?(rzad: number | null): void;
  naZmienNotatke?(id: string, tekst: string): Promise<boolean>;
  naUsunNotatke?(id: string): Promise<boolean>;
  potwierdz(tytul: string, opis: string, przycisk: string, f: () => void): void;
  naBlad(): void;                                 // nieudany zapis: ekran pokazuje `licznik.blad_zapisu` (zasada: zapis nie wygląda na udany)
};

export function ArkuszNotatekWzoru(p: PropsArkuszaNotatek): React.ReactElement | null {
  const { t } = p;
  const k = useKolory();
  const st = style(k);
  const [wybrana, ustawWybrana] = useState<string | null>(null); // wiersz listy chipu zbiorczego
  const [edycja, ustawEdycje] = useState<string | null>(null);   // treść w trakcie zmiany (Edit → Cancel / Save)
  const chip = p.otwartyChip == null ? undefined : p.chipy?.find((c) => c.rzad === p.otwartyChip);
  if (!chip) return null;
  const notatka = chip.notatki.length === 1 ? chip.notatki[0] : chip.notatki.find((n) => n.id === wybrana);
  const zamknij = () => { ustawWybrana(null); ustawEdycje(null); p.naChip?.(null); };
  async function zapisz(id: string, nowa: string) { if (await (p.naZmienNotatke?.(id, nowa) ?? Promise.resolve(false))) ustawEdycje(null); else p.naBlad(); }
  async function usun(id: string) { ustawWybrana(null); if (!(await (p.naUsunNotatke?.(id) ?? Promise.resolve(false)))) p.naBlad(); }
  const naglowek = (lewy: React.ReactNode, tytul: string, prawy: React.ReactNode) => (
    <View style={st.naglowek}>{lewy}<Text style={[st.tresc, st.pogrubiony, st.tytul]} accessibilityRole="header">{tytul}</Text>{prawy}</View>
  );
  const przycisk = (tekst: string, id: string, f: () => void, pogrubiony = false) => (
    <Pressable accessibilityRole="button" accessibilityLabel={tekst} style={st.przyciskNaglowka} testID={id} onPress={f}><Text style={[st.tresc, pogrubiony && st.pogrubiony]}>{tekst}</Text></Pressable>
  );
  return (
    <View style={st.tlo} accessibilityViewIsModal>
      <Pressable style={StyleSheet.absoluteFill} onPress={zamknij} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <ScrollView style={st.arkusz}>
        {notatka ? (
          <View>
            {naglowek(
              przycisk(t(edycja === null ? 'wspolne.zamknij' : 'wspolne.anuluj'), 'wzor-notatka-zamknij', () => (edycja === null ? zamknij() : ustawEdycje(null))),
              t('wzor.notatka_tytul', { n: chip.rzadWzoru }),
              przycisk(t(edycja === null ? 'wzor.notatka_edytuj' : 'wspolne.zapisz'), 'wzor-notatka-edytuj', () => { if (edycja === null) ustawEdycje(notatka.tekst); else if (edycja.trim()) void zapisz(notatka.id, edycja); }, true),
            )}
            {edycja === null
              ? <Text style={[st.tresc, st.zawartosc]} testID="wzor-notatka-tresc">{notatka.tekst}</Text>
              : <TextInput accessibilityLabel={t('wzor.notatka_tytul', { n: chip.rzadWzoru })} value={edycja} onChangeText={ustawEdycje} testID="wzor-notatka-edycja" multiline style={[st.tresc, st.pole]} />}
            {edycja === null && (
              <Pressable accessibilityRole="button" accessibilityLabel={t('wzor.notatka_usun')} testID="wzor-notatka-usun" style={st.pozycja}
                onPress={() => p.potwierdz(t('wzor.notatka_usun_tytul'), t('wzor.notatka_usun_opis', { n: chip.rzadWzoru }), t('wzor.notatka_usun'), () => void usun(notatka.id))}>
                <Text style={[st.tresc, st.niszczaca]}>{t('wzor.notatka_usun')}</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View>
            {naglowek(przycisk(t('wspolne.zamknij'), 'wzor-notatka-zamknij', zamknij), t('wzor.notatki_tytul', { strona: chip.strona + 1 }), <View style={st.przyciskNaglowka} />)}
            {chip.notatki.map((n) => (
              <Pressable key={n.id} accessibilityRole="button" accessibilityLabel={t('wzor.notatka_chip', { n: chip.rzadWzoru, tekst: n.tekst })} style={st.pozycja} testID={`wzor-notatka-wiersz-${n.id}`} onPress={() => ustawWybrana(n.id)}>
                <Text style={st.tresc} numberOfLines={2}>{t('wzor.notatka_chip', { n: chip.rzadWzoru, tekst: n.tekst })}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function style(k: Kolory) {
  return StyleSheet.create({
    tlo: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end' },
    arkusz: { maxHeight: '60%', margin: odstep.l, borderRadius: promien.grupa, backgroundColor: k.arkusz },
    naglowek: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: rozmiary.minimum, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
    przyciskNaglowka: { minWidth: rozmiary.minimum, minHeight: rozmiary.minimum, justifyContent: 'center', paddingHorizontal: odstep.l },
    tytul: { flex: 1, textAlign: 'center' },
    tresc: { ...typografia.tresc, color: k.grafit },
    pogrubiony: { fontWeight: '700' },
    zawartosc: { padding: odstep.l },
    pozycja: { minHeight: rozmiary.minimum, justifyContent: 'center', paddingHorizontal: odstep.l, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
    niszczaca: { color: k.blad },
    pole: { minHeight: rozmiary.minimum, borderRadius: promien.pole, backgroundColor: k.papier, padding: odstep.s, margin: odstep.l },
  });
}
