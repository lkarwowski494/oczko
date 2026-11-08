// Ustawienia › Język (F-36, BR-ZAK-004, ADR-0017, P-075 (3b), P-115, P-126 (7a); design-spec „Ustawienia › Język”, wzór Treningu):
// „Same as phone” i 35 lokalizacji nazwą własną (NAZWY_JEZYKOW, krój systemowy), radio ze znakiem wyboru (`checkmark`), każda nazwa czytana głosem swojego języka.
// Wybór działa od razu (kompozycja zapisuje i wraca); ekran nie podpowiada języka zastępczego (P-115, 7a).
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Przycisk } from './Arkusz';
import { cel, MAX_SKALA_TYTULOWA, MAX_SKALA_ZNAKU_WYBORU, odstep, promien, ROZMIAR_SYMBOLU_TRESCI, typografia, useKolory, type Kolory } from './motyw';
import { SymbolSf } from './SymbolSf';
import tokeny from '../../docs/design/tokeny.json';
import { JEZYKI, NAZWY_JEZYKOW, type PreferencjaJezyka } from '../i18n/jezyki';
import type { Tlumacz } from './wspolne';
import { Wstecz } from './Pasek';

export type PropsWyboruJezyka = { t: Tlumacz; wybrany: PreferencjaJezyka; naWybierz(p: PreferencjaJezyka): void; naUstawieniaIos(): void; naWstecz?(): void };

export function WyborJezyka({ t, wybrany, naWybierz, naUstawieniaIos, naWstecz }: PropsWyboruJezyka): React.ReactElement {
  const k = useKolory();
  const st = style(k);
  const opcje: { p: PreferencjaJezyka; nazwa: string; tag?: string }[] = [
    { p: 'auto', nazwa: t('ustawienia.jezyk_automatyczny') },
    ...JEZYKI.map((j) => ({ p: j, nazwa: NAZWY_JEZYKOW[j], tag: j })),
  ];
  return (
    <ScrollView style={st.ekran} contentContainerStyle={st.tresc} testID="jezyk">
      {naWstecz && <Wstecz tekst={t('wspolne.wstecz')} onPress={naWstecz} />}
      <Text style={st.tytul} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t('ustawienia.jezyk')}</Text>
      <View style={st.grupa} accessibilityRole="radiogroup">
        {opcje.map((o) => {
          const w = o.p === wybrany;
          return (
            <Pressable key={o.p} accessibilityRole="radio" accessibilityState={{ checked: w }} accessibilityLanguage={o.tag}
              accessibilityLabel={w ? t('jezyk.wybrany_a11y', { nazwa: o.nazwa }) : o.nazwa} onPress={() => naWybierz(o.p)}
              style={st.wiersz} testID={`jezyk-${o.p}`}>
              <Text style={st.nazwa}>{o.nazwa}</Text>
              {w && <SymbolSf nazwa={tokeny.znaczniki.wyboruListy.symbol as 'checkmark'} rozmiar={ROZMIAR_SYMBOLU_TRESCI} kolor={k[tokeny.znaczniki.wyboruListy.kolor as 'akcentTekst']} maxSkala={MAX_SKALA_ZNAKU_WYBORU} />}
            </Pressable>
          );
        })}
      </View>
      <View style={st.grupa}>
        <Przycisk tekst={t('jezyk.ustawienia_ios')} onPress={naUstawieniaIos} rodzaj="tekstowy" testID="jezyk-ustawienia-ios" />
      </View>
      <Text style={st.opis}>{t('jezyk.ustawienia_ios_opis')}</Text>
    </ScrollView>
  );
}

function style(k: Kolory) {
  return StyleSheet.create({
    ekran: { flex: 1, backgroundColor: k.tlo },
    tresc: { padding: odstep.l, gap: odstep.l },
    tytul: { ...typografia.tytul, color: k.tekst },
    grupa: { borderRadius: promien.lista, backgroundColor: k.powierzchnia, overflow: 'hidden' },
    wiersz: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: cel.minimum, paddingHorizontal: odstep.l, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
    nazwa: { ...typografia.tresc, color: k.tekst }, // krój systemowy: Libre Franklin nie ma greki i CJK (P-064)
    opis: { ...typografia.podpis, color: k.tekst2, paddingHorizontal: odstep.m },
  });
}
