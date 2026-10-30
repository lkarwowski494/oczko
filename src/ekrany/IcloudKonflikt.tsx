// Arkusz wyboru wersji licznika w konflikcie iCloud (partia 7; design-spec „Konflikt na liczniku (I1a)”, makieta fix7 `icloud-konflikt-wybor`):
// tytuł `dane.konflikt_tytul`, zdanie `icloud.konflikt_wybor_opis`, wybory `dane.konflikt_wybor` (VoiceOver `dane.konflikt_a11y`), „Not now”.
// Nic nie wybiera się po cichu (NFR-DAN-003); druga wersja zostaje w historii (zdarzenie `rozstrzygniecie`).
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Arkusz, Przycisk, Tresc } from './Arkusz';
import { cel as rozmiary, odstep, promien, typografia, useKolory } from './motyw';
import type { Tlumacz } from './wspolne';

type Konflikt = { lokalna: number; zdalna: number; urzadzenie: string };
export type KonfliktNaLiczniku = Konflikt | null; // pole stanu ekranu licznika (null = brak konfliktu)
export const opisKonfliktu = (k: Konflikt, t: Tlumacz): string =>
  `${t('icloud.konflikt_licznik')}. ${t('icloud.konflikt_opis', { lokalna: t('icloud.konflikt_wiersze', { count: k.lokalna }), zdalna: t('icloud.konflikt_wiersze', { count: k.zdalna }), urzadzenie: k.urzadzenie })}`;

/** Linia pod liczbą licznika (nazwany wyjątek od P-046, P-220 I1a): nagłówek, opis i „Choose”; liczba nad nią = wersja tego urządzenia. */
export function LiniaKonfliktu({ k, t, oglos, na: naWybierz }: { k: Konflikt; t: Tlumacz; oglos(tekst: string): void; na?(): void }): React.ReactElement {
  const kol = useKolory();
  useEffect(() => { oglos(opisKonfliktu(k, t)); }, []); // ogłoszenie VoiceOver raz przy pojawieniu się linii (design-spec I1a)
  const st = StyleSheet.create({
    linia: { gap: odstep.s, padding: odstep.m, borderRadius: promien.grupa, backgroundColor: kol.papierGrupa },
    tresc: { ...typografia.tresc, color: kol.grafit },
    przycisk: { minHeight: rozmiary.minimum, borderRadius: promien.przyciskDrugi, borderWidth: 2, borderColor: kol.drugiPrzyciskObrys, alignItems: 'center', justifyContent: 'center', paddingHorizontal: odstep.l },
  });
  return (
    <View style={st.linia} testID="licznik-konflikt">
      <Text style={[st.tresc, { fontWeight: '700' }]}>{t('icloud.konflikt_licznik')}</Text>
      <Text style={st.tresc}>{t('icloud.konflikt_opis', { lokalna: t('icloud.konflikt_wiersze', { count: k.lokalna }), zdalna: t('icloud.konflikt_wiersze', { count: k.zdalna }), urzadzenie: k.urzadzenie })}</Text>
      {naWybierz && (
        <Pressable accessibilityRole="button" accessibilityLabel={t('icloud.konflikt_wybierz')} onPress={naWybierz} style={st.przycisk} testID="licznik-konflikt-wybierz">
          <Text style={[st.tresc, { fontWeight: '700' }]}>{t('icloud.konflikt_wybierz')}</Text>
        </Pressable>
      )}
    </View>
  );
}

export type WyborWersji = { glowa: string; wartosc: number; tekst: string; etykieta: string };
export function IcloudKonflikt(p: { t: Tlumacz; licznik: string; wybory: readonly WyborWersji[]; naWybor(glowa: string): void; naZamknij(): void }): React.ReactElement {
  const { t } = p;
  return (
    <Arkusz tytul={t('dane.konflikt_tytul', { licznik: p.licznik })} testID="icloud-konflikt"
      przyciski={<Przycisk tekst={t('wspolne.nie_teraz')} onPress={p.naZamknij} rodzaj="tekstowy" testID="arkusz-zamknij" />}>
      <Tresc>{t('icloud.konflikt_wybor_opis')}</Tresc>
      {p.wybory.map((w, i) => (
        <Przycisk key={w.glowa} tekst={w.tekst} etykieta={w.etykieta} onPress={() => p.naWybor(w.glowa)} rodzaj="drugi" testID={`icloud-konflikt-wybor-${i}`} />
      ))}
    </Arkusz>
  );
}
