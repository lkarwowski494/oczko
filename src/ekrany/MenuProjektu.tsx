// Menu ••• projektu (prototyp.html:129, design-spec.md:34). Arkusz systemowy. Sygnatura: propozycja 07 (E3), granice zatwierdzone przez 05 (Z07-22).
// Zerowanie (F-45) dopiero po potwierdzeniu w tym arkuszu (BR-LIC-017/S6, R-007); blokada jako pozycja menu (design-spec „Blokada licznika”).
import React, { useState } from 'react';
import { View } from 'react-native';
import { Arkusz, Przycisk, Tresc } from './Arkusz';
import { odstep } from './motyw';
import type { Tlumacz } from './wspolne';

export type PropsMenuProjektu = {
  stan: { projekt: string; zablokowany: boolean; wartosc: number; maWzor?: boolean; oczka?: boolean }; // oczka: bez pozycji dla rzędów (07-jakosc-025)
  t: Tlumacz;
  naNazwa(): void; naCel(): void; naPrzypomnienie(): void; naPowtorzenie(): void; naWpisz(): void;
  naZablokuj(): void; naOdblokuj(): void;
  /** Zerowanie (F-45): wołane dopiero po potwierdzeniu w tym arkuszu (BR-LIC-017/S6, R-007). */
  naZeruj(): void;
  naUkoncz(): void;
  naWzor?(): void; // partia 6 (design-spec W2a): „Pattern” albo „Add pattern…”
  naZnaczenie?(): void; // F-09 (partia 5, design-spec: `menu.znaczenie` w ••• licznika)
  naZamknij(): void;
};
export function MenuProjektu(p: PropsMenuProjektu): React.ReactElement {
  const { stan: s, t } = p;
  const [pytanie, ustawPytanie] = useState(false);
  return (
    <Arkusz tytul={s.projekt} przyciski={<Przycisk tekst={t('wspolne.anuluj')} onPress={p.naZamknij} rodzaj="tekstowy" testID="arkusz-zamknij" />}>
      <View style={{ gap: odstep.s }}>
        <Przycisk tekst={t('menu.nazwa')} onPress={p.naNazwa} testID="menu-nazwa" />
        {!s.oczka && <Przycisk tekst={t('menu.cel')} onPress={p.naCel} testID="menu-cel" />}
        {p.naWzor && <Przycisk tekst={t(s.maWzor ? 'menu.wzor' : 'menu.dodaj_wzor')} onPress={p.naWzor} testID="menu-wzor" />}
        {!s.oczka && <Przycisk tekst={t('menu.przypomnienie')} onPress={p.naPrzypomnienie} testID="menu-przypomnienie" />}
        {!s.oczka && <Przycisk tekst={t('menu.powtorzenie')} onPress={p.naPowtorzenie} testID="menu-powtorzenie" />}
        <Przycisk tekst={t('menu.wpisz')} onPress={p.naWpisz} testID="menu-wpisz-wartosc" />
        {p.naZnaczenie && !s.oczka && <Przycisk tekst={t('menu.znaczenie')} onPress={p.naZnaczenie} testID="menu-znaczenie" />}
        {s.zablokowany
          ? <Przycisk tekst={t('menu.odblokuj')} onPress={p.naOdblokuj} />
          : <Przycisk tekst={t('menu.zablokuj')} onPress={p.naZablokuj} />}
        <Przycisk tekst={t('menu.zeruj')} onPress={() => ustawPytanie(true)} />
        {pytanie && (
          <View style={{ gap: odstep.s }} accessibilityRole="alert">
            <Tresc>{t('menu.zeruj_pytanie', { projekt: s.projekt })}</Tresc>
            <Przycisk tekst={t('menu.zeruj_potwierdz')} onPress={() => { ustawPytanie(false); p.naZeruj(); }} rodzaj="glowny" />
          </View>
        )}
        <Przycisk tekst={t('menu.ukoncz')} onPress={p.naUkoncz} testID="menu-ukoncz" />
      </View>
    </Arkusz>
  );
}
