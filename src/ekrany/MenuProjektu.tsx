// Menu ••• licznika i arkusz „Cel” (M3 p3a, ZM-05, P-581 (a), P-586 (1a)): własne arkusze na trasie `/menu` (bez UIMenu). Sygnatura: propozycja 07 (E3), granice zatwierdzone przez 05 (Z07-22).
// ••• ma 6 pozycji w 3 grupach listy bez nagłówków (009, P-614 (4)): korekta (nazwa, numer rzędu, znaczenie liczby), stan (blokada, ukończenie), zerowanie.
// Zerowanie (F-45) dopiero po potwierdzeniu w tym arkuszu (BR-LIC-017/S6, R-007); blokada jako pozycja menu (design-spec „Blokada licznika”).
// „Wzór” przeszedł do akcji pod liczbą (`licznik-wzor`), cel, przypomnienie i powtórzenie do arkusza „Cel” (`MenuCel`, akcja `licznik-cel`).
import React, { useState } from 'react';
import { View } from 'react-native';
import { Przycisk, Tresc } from './Arkusz';
import { ArkuszMenu, GrupaMenu, PozycjaMenu } from './MenuLista';
import { odstep } from './motyw';
import type { Tlumacz } from './wspolne';

export type PropsMenuProjektu = {
  stan: { projekt: string; zablokowany: boolean; wartosc: number; oczka?: boolean }; // oczka: bez „znaczenie liczby” (07-jakosc-025)
  t: Tlumacz;
  naNazwa(): void; naWpisz(): void;
  naZablokuj(): void; naOdblokuj(): void;
  /** Zerowanie (F-45): wołane dopiero po potwierdzeniu w tym arkuszu (BR-LIC-017/S6, R-007). */
  naZeruj(): void;
  naUkoncz(): void;
  naZnaczenie?(): void; // F-09 (partia 5, design-spec: `menu.znaczenie` w ••• licznika)
  naZamknij(): void;
};
export function MenuProjektu(p: PropsMenuProjektu): React.ReactElement {
  const { stan: s, t } = p;
  const [pytanie, ustawPytanie] = useState(false);
  return (
    <ArkuszMenu tytul={s.projekt} anuluj={t('wspolne.anuluj')} naAnuluj={p.naZamknij}>
      {/* 009 (P-614 (4), makieta `licznik-menu`): trzy grupy listy bez nagłówków — korekta, stan, zerowanie osobno na końcu (z dala od pozostałych pozycji). */}
      <GrupaMenu>
        <PozycjaMenu tekst={t('menu.nazwa')} onPress={p.naNazwa} testID="menu-nazwa" />
        <PozycjaMenu tekst={t('menu.wpisz')} onPress={p.naWpisz} testID="menu-wpisz-wartosc" />
        {p.naZnaczenie && !s.oczka && <PozycjaMenu tekst={t('menu.znaczenie')} onPress={p.naZnaczenie} testID="menu-znaczenie" />}
      </GrupaMenu>
      <GrupaMenu>
        {s.zablokowany
          ? <PozycjaMenu tekst={t('menu.odblokuj')} onPress={p.naOdblokuj} testID="menu-odblokuj" />
          : <PozycjaMenu tekst={t('menu.zablokuj')} onPress={p.naZablokuj} testID="menu-zablokuj" />}
        <PozycjaMenu tekst={t('menu.ukoncz')} onPress={p.naUkoncz} testID="menu-ukoncz" />
      </GrupaMenu>
      {/* M1-094 (04-studio-projektowe-506, DEC-26 a, opcja a): przy blokadzie wyłączony z podpowiedzią — nie pytamy o coś, czego nie da się zrobić */}
      <GrupaMenu>
        <PozycjaMenu tekst={t('menu.zeruj')} onPress={() => ustawPytanie(true)} testID="menu-zeruj" wylaczony={s.zablokowany}
          podpowiedz={s.zablokowany ? t('menu.zeruj_zablokowany') : undefined} />
      </GrupaMenu>
      {s.zablokowany && <Tresc podpis>{t('menu.zeruj_zablokowany')}</Tresc>}
      {pytanie && !s.zablokowany && (
        <View style={{ gap: odstep.s }} accessibilityRole="alert">
          <Tresc>{t('menu.zeruj_pytanie', { projekt: s.projekt })}</Tresc>
          <Przycisk tekst={t('menu.zeruj_potwierdz')} onPress={() => { ustawPytanie(false); p.naZeruj(); }} rodzaj="glowny" />
        </View>
      )}
    </ArkuszMenu>
  );
}

export type PropsMenuCel = {
  stan: { projekt: string; przypomnienia?: number };
  t: Tlumacz;
  naCel(): void; naPrzypomnienie(): void; naPrzypomnienia?(): void; naPowtorzenie(): void;
  naZamknij(): void;
};
/** Arkusz akcji „Cel” (P-581 a): ustawienia liczenia części — cel, przypomnienie („co N rzędów”, albo lista planów, gdy są), długość powtórzenia. Tylko licznik rzędów. */
export function MenuCel(p: PropsMenuCel): React.ReactElement {
  const { stan: s, t } = p;
  return (
    <ArkuszMenu tytul={t('licznik.akcja_cel')} anuluj={t('wspolne.anuluj')} naAnuluj={p.naZamknij}>
      <GrupaMenu>
        <PozycjaMenu tekst={t('menu.cel')} onPress={p.naCel} testID="menu-cel" />
        {(s.przypomnienia ?? 0) > 0 && p.naPrzypomnienia
          ? <PozycjaMenu tekst={t('przyp.menu')} etykieta={`${t('przyp.menu')}, ${s.przypomnienia}`} onPress={p.naPrzypomnienia} testID="menu-przypomnienia">
              <Tresc podpis>{String(s.przypomnienia)}</Tresc>
            </PozycjaMenu>
          : <PozycjaMenu tekst={t('menu.przypomnienie')} onPress={p.naPrzypomnienie} testID="menu-przypomnienie" />}
        <PozycjaMenu tekst={t('menu.powtorzenie')} onPress={p.naPowtorzenie} testID="menu-powtorzenie" />
      </GrupaMenu>
    </ArkuszMenu>
  );
}
