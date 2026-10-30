// Film projektu na ekranie projektu (design-spec W8 „Video”, W7a „Add video link”, stan „Film bez sieci”; 04 fix-8 film.html; P-276 (A)).
// Film to odnośnik poza wzorem, jeden na projekt (P-218 (4), P-246 S4a): Oczko trzyma tylko link. Menu wiersza: „Change link” (arkusz wypełniony,
// Save zastępuje — zamiana jawna) i „Remove link” (z potwierdzeniem); widoczny przycisk •••, przytrzymanie wiersza albo akcje VoiceOver (ta sama kolejność).
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { adresStrony } from '../domena/adres';
import { Arkusz, Komunikat, Pole, Tresc } from './Arkusz';
import { cel as rozmiary, odstep, typografia, useKolory, type Kolory } from './motyw';
import type { System, Tlumacz } from './wspolne';

export type FilmProjektu = { adres: string; nazwa: string | null };

export function WierszFilmu(p: { film: FilmProjektu; siec: 'jest' | 'brak'; t: Tlumacz; system: System; naZmien(): void; naUsun(): void }): React.ReactElement {
  const { t } = p;
  const st = style(useKolory());
  const [menu, ustawMenu] = useState(false);
  const akcje = [{ name: 'zmien', label: t('wzor.film_zmien') }, { name: 'usun', label: t('wzor.film_usun') }];
  const otworz = () => {
    if (p.siec === 'brak') Alert.alert(t('wzor.film_bez_sieci_tytul'), t('narzedzia.film_bez_sieci'), [{ text: t('wspolne.ok') }]);
    else p.system.otworzAdres(p.film.adres);
  };
  // VoiceOver: wiersz to jeden element (↗ w środku niedostępny osobno) — podwójne stuknięcie otwiera link, menu jako akcje.
  // „Remove link” pyta (04-studio-projektowe-006): link jest łatwy do wpisania, ale usunięcie nie ma Cofnij; ta sama ścieżka dla menu i akcji VoiceOver.
  const potwierdzUsuniecie = () => Alert.alert(t('wzor.film_usun_tytul'), t('wzor.film_usun_opis'), [
    { text: t('wspolne.anuluj'), style: 'cancel' },
    { text: t('wzor.film_usun'), style: 'destructive', onPress: p.naUsun },
  ]);
  const wykonaj = (a: string) => { ustawMenu(false); if (a === 'activate') otworz(); else if (a === 'zmien') p.naZmien(); else if (a === 'usun') potwierdzUsuniecie(); };
  return (
    <View>
      <Pressable onLongPress={() => ustawMenu(!menu)} accessibilityActions={[{ name: 'activate' }, ...akcje]} onAccessibilityAction={(e) => wykonaj(e.nativeEvent.actionName)}
        accessibilityLabel={`${t('wzor.film_wiersz')}, ${p.film.nazwa ?? p.film.adres}`} accessibilityHint={t('wzor.film_otworz_a11y')} style={[st.wiersz, st.poziomy]} testID="wzor-film-wiersz">
        <View style={st.rosnie}>
          <Text style={st.tekst}>{t('wzor.film_wiersz')}</Text>
          <Text style={st.podpis} numberOfLines={2}>{p.film.nazwa ?? p.film.adres}</Text>
        </View>
        <Pressable accessibilityRole="link" accessibilityLabel={t('wzor.film_otworz_a11y')} onPress={otworz} style={st.ikona}>
          <Text style={[st.tekst, st.akcja]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>↗</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('wzor.film_menu')} onPress={() => ustawMenu(!menu)} style={st.ikona} testID="wzor-film-menu">
          <Text style={[st.tekst, st.akcja]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>•••</Text>
        </Pressable>
      </Pressable>
      {menu && (
        <View accessibilityRole="menu" style={st.menu}>
          {akcje.map((a) => (
            <Pressable key={a.name} accessibilityRole="menuitem" accessibilityLabel={a.label} onPress={() => wykonaj(a.name)} style={st.pozycja}>
              <Text style={st.tekst}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

export function DodajFilm(p: { t: Tlumacz; naDodaj(): void }): React.ReactElement {
  const st = style(useKolory());
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={p.t('wzor.dodaj_film')} onPress={p.naDodaj} style={st.wiersz} testID="wzor-dodaj-film">
      <Text style={[st.tekst, st.akcja]}>{p.t('wzor.dodaj_film')}</Text>
    </Pressable>
  );
}

/** Arkusz „Video link” (W7a; P-276 „Change link”: wypełniony obecnym linkiem i nazwą). Zły adres → `wzor.link_blad` pod polem, nic nie zapisane. */
export function ArkuszFilmu(p: { t: Tlumacz; poczatek: FilmProjektu | null; naZapisz(f: { adres: string; nazwa: string }): void; naAnuluj(): void }): React.ReactElement {
  const { t } = p;
  const [adres, ustawAdres] = useState(p.poczatek?.adres ?? '');
  const [nazwa, ustawNazwe] = useState(p.poczatek?.nazwa ?? '');
  const [blad, ustawBlad] = useState(false);
  const zapisz = () => { const a = adresStrony(adres); if (a) p.naZapisz({ adres: a, nazwa: nazwa.trim() }); else ustawBlad(true); };
  return (
    <Arkusz tytul={t('wzor.film_tytul')} formularz={{ t, zapisz: t('wspolne.zapisz'), naZapisz: zapisz, naAnuluj: p.naAnuluj }}>
      <Pole etykieta={t('wzor.film_pole')} wartosc={adres} naZmiane={(x) => { ustawAdres(x); ustawBlad(false); }} testID="wzor-film-pole" />
      {blad && <Komunikat tekst={t('wzor.link_blad')} />}
      <Pole etykieta={t('wzor.film_nazwa')} wartosc={nazwa} naZmiane={ustawNazwe} naKoniec={zapisz} />
      <Tresc podpis>{t('wzor.film_opis')}</Tresc>
    </Arkusz>
  );
}

function style(k: Kolory) {
  return StyleSheet.create({
    wiersz: { minHeight: rozmiary.minimum, justifyContent: 'center', paddingHorizontal: odstep.l, paddingVertical: odstep.s, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
    poziomy: { flexDirection: 'row', alignItems: 'center', gap: odstep.s },
    rosnie: { flex: 1 },
    ikona: { minWidth: rozmiary.minimum, minHeight: rozmiary.minimum, alignItems: 'center', justifyContent: 'center' },
    tekst: { ...typografia.tresc, color: k.grafit },
    akcja: { fontWeight: '600' },
    podpis: { ...typografia.podpis, color: k.olowek },
    menu: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: k.linia, backgroundColor: k.arkusz },
    pozycja: { minHeight: rozmiary.minimum, justifyContent: 'center', paddingHorizontal: odstep.l, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
  });
}
