// Zdjęcia projektu (F-16, BR-PRJ-003; P-191 P9a; design-spec „Zdjęcia”; makiety fix6 `projekt-zdjecia`, `zdjecie-zrodlo`, `zdjecie-podglad`,
// `zdjecie-usun`). Wybór źródła jako lista w ekranie (jak menu „+” i ••• projektu, R8 P-191 — odstępstwo od arkusza systemowego do audytu 04).
// „Share” podglądu (P-219 2A): plik przekodowany bez metadanych i GPS (kompozycja), arkusz systemowy.
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { cel, MAX_SKALA_TYTULOWA, odstep, promien, systemCzarny, typografia, useKolory, type Kolory } from './motyw';
import type { Tlumacz } from './wspolne';
import { SymbolSf } from './SymbolSf';

export type Miniatura = { id: string; uri: string };
const MINIATURA = 88; // pt (design-spec „Zdjęcia”)

export function GrupaZdjec(p: {
  t: Tlumacz; miniatury: Miniatura[]; naWybierz(z: 'aparat' | 'biblioteka'): void; naOtworz(i: number): void; panelE2e?: React.ReactNode;
  naglowek?: string; testID?: string; // arkusz włóczki: „Label photo” (P-191 P9a: jedna grupa zdjęć, bez rozróżnienia)
}): React.ReactElement {
  const { t } = p;
  const st = style(useKolory());
  const [zrodlo, ustawZrodlo] = useState(false);
  const wybierz = (z: 'aparat' | 'biblioteka') => () => { ustawZrodlo(false); p.naWybierz(z); };
  return (
    <View testID={p.testID ?? 'projekt-zdjecia'} style={{ gap: odstep.s }}>
      <Text style={st.naglowek} accessibilityRole="header">{p.naglowek ?? t('zdjecia.naglowek')}</Text>
      <ScrollView horizontal contentContainerStyle={st.rzad} showsHorizontalScrollIndicator={false}>
        {p.miniatury.map((m, i) => (
          <Pressable key={m.id} accessibilityRole="imagebutton" accessibilityLabel={t('zdjecia.a11y', { n: i + 1, count: p.miniatury.length })}
            onPress={() => p.naOtworz(i)} testID="zdjecia-miniatura">
            <Image source={{ uri: m.uri }} style={st.miniatura} />
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" accessibilityLabel={t('zdjecia.dodaj')} onPress={() => ustawZrodlo((x) => !x)} style={st.kafel} testID="zdjecia-dodaj">
          <SymbolSf nazwa="plus" rozmiar={Number(typografia.tytul.fontSize)} kolor={st.plus.color} maxSkala={MAX_SKALA_TYTULOWA} />
          <Text style={st.kafelTekst}>{t('zdjecia.dodaj')}</Text>
        </Pressable>
      </ScrollView>
      {zrodlo && (
        <View style={st.menu}>
          {p.panelE2e}
          <Pozycja tekst={t('zdjecia.zrob')} onPress={wybierz('aparat')} />
          <Pozycja tekst={t('zdjecia.wybierz')} onPress={wybierz('biblioteka')} />
          <Pozycja tekst={t('wspolne.anuluj')} onPress={() => ustawZrodlo(false)} />
        </View>
      )}
    </View>
  );
}
function Pozycja(p: { tekst: string; onPress(): void }): React.ReactElement {
  const st = style(useKolory());
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={p.tekst} onPress={p.onPress} style={st.pozycja}>
      <Text style={st.tekst}>{p.tekst}</Text>
    </Pressable>
  );
}

/** Podgląd na czarnym tle (P-191 P9a): przesunięcie w bok między zdjęciami; alternatywa — miniatury na ekranie projektu. */
export function PodgladZdjec(p: {
  t: Tlumacz; zdjecia: Miniatura[]; poczatek: number; naZamknij(): void; naUsun(id: string): void; naUdostepnij(id: string): void;
  potwierdz(tytul: string, opis: string, przycisk: string, f: () => void): void;
}): React.ReactElement {
  const { t } = p;
  const st = style(useKolory());
  const { width } = useWindowDimensions();
  const [i, ustawI] = useState(Math.min(p.poczatek, Math.max(0, p.zdjecia.length - 1)));
  const biezace = p.zdjecia[i];
  return (
    <View style={st.podglad}>
      <View style={st.pasek}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('wspolne.zamknij')} onPress={p.naZamknij} style={st.przycisk}>
          <Text style={st.jasny}>{t('wspolne.zamknij')}</Text>
        </Pressable>
      </View>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentOffset={{ x: i * width, y: 0 }}
        onMomentumScrollEnd={(e) => ustawI(Math.round(e.nativeEvent.contentOffset.x / Math.max(1, width)))}>
        {p.zdjecia.map((z, k) => (
          <Image key={z.id} source={{ uri: z.uri }} resizeMode="contain" accessible accessibilityRole="image"
            accessibilityLabel={t('zdjecia.a11y', { n: k + 1, count: p.zdjecia.length })} style={{ width, flex: 1 }} />
        ))}
      </ScrollView>
      <View style={st.pasek}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('ukonczenie.udostepnij')} onPress={() => { if (biezace) p.naUdostepnij(biezace.id); }}
          style={st.przycisk} testID="zdjecie-udostepnij">
          <Text style={st.jasny}>{t('ukonczenie.udostepnij')}</Text>
        </Pressable>
        <Text style={st.jasny}>{t('zdjecia.a11y', { n: i + 1, count: p.zdjecia.length })}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t('zdjecia.usun')} testID="zdjecie-usun" style={st.przycisk}
          onPress={() => { if (biezace) p.potwierdz(t('zdjecia.usun_tytul'), t('zdjecia.usun_opis'), t('zdjecia.usun'), () => p.naUsun(biezace.id)); }}>
          <Text style={st.jasny}>{t('zdjecia.usun')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function style(k: Kolory) {
  return StyleSheet.create({
    naglowek: { ...typografia.drobny, color: k.olowek }, // jak nagłówki sekcji ekranu projektu (Projekt.tsx), 04-studio-projektowe-012, H-1c (13 pt)
    rzad: { gap: odstep.s, alignItems: 'center' },
    miniatura: { width: MINIATURA, height: MINIATURA, borderRadius: promien.pole },
    kafel: { minWidth: MINIATURA, minHeight: MINIATURA, padding: odstep.s, borderRadius: promien.pole, borderWidth: 2, borderColor: k.drugiPrzyciskObrys, alignItems: 'center', justifyContent: 'center' },
    plus: { ...typografia.tytul, color: k.grafit },
    kafelTekst: { ...typografia.podpis, color: k.grafit, textAlign: 'center' },
    menu: { borderRadius: promien.grupa, backgroundColor: k.papierGrupa, overflow: 'hidden' },
    pozycja: { minHeight: cel.minimum, justifyContent: 'center', paddingHorizontal: odstep.l, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
    tekst: { ...typografia.tresc, color: k.grafit },
    // Podgląd: czarne tło (makieta `zdjecie-podglad`) — tokeny kolor.systemCzarny, bez nowych kolorów.
    podglad: { flex: 1, backgroundColor: systemCzarny.tlo },
    pasek: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: odstep.l, minHeight: cel.minimum },
    przycisk: { minHeight: cel.minimum, minWidth: cel.minimum, justifyContent: 'center' },
    jasny: { ...typografia.tresc, color: systemCzarny.grafit },
  });
}
