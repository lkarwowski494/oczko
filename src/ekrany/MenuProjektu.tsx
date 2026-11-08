// Menu ••• licznika i arkusz „Cel” (M3 p3a, ZM-05, P-581 (a), P-586 (1a)): własne arkusze na trasie `/menu` (bez UIMenu). Sygnatura: propozycja 07 (E3), granice zatwierdzone przez 05 (Z07-22).
// ••• ma 6 pozycji w 2 grupach bez nagłówków (odstęp sekcji): korekta (nazwa, numer rzędu, znaczenie liczby, zerowanie na końcu) i stan (blokada, ukończenie).
// Zerowanie (F-45) dopiero po potwierdzeniu w tym arkuszu (BR-LIC-017/S6, R-007); blokada jako pozycja menu (design-spec „Blokada licznika”).
// „Wzór” przeszedł do akcji pod liczbą (`licznik-wzor`), cel, przypomnienie i powtórzenie do arkusza „Cel” (`MenuCel`, akcja `licznik-cel`).
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Arkusz, Przycisk, Tresc } from './Arkusz';
import { cel, odstep } from './motyw';
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
    <Arkusz tytul={s.projekt} przyciski={<Przycisk tekst={t('wspolne.anuluj')} onPress={p.naZamknij} rodzaj="tekstowy" testID="arkusz-zamknij" />}>
      {/* Dwie grupy bez nagłówków i bez testID (ZM-05: grupy dzieli odstęp sekcji): korekta u góry, „Reset to 0…” na jej końcu, z dala od „Mark project as finished”
          (mniejsze ryzyko pomyłki przy pozycjach, których skutek trudno cofnąć); stan — blokada i ukończenie. */}
      <View style={{ gap: odstep.sekcja }}>
        <View style={{ gap: odstep.s }}>
          <Przycisk tekst={t('menu.nazwa')} onPress={p.naNazwa} testID="menu-nazwa" />
          <Przycisk tekst={t('menu.wpisz')} onPress={p.naWpisz} testID="menu-wpisz-wartosc" />
          {p.naZnaczenie && !s.oczka && <Przycisk tekst={t('menu.znaczenie')} onPress={p.naZnaczenie} testID="menu-znaczenie" />}
          {/* M1-094 (04-studio-projektowe-506, DEC-26 a, opcja a): przy blokadzie wyłączony z podpowiedzią — nie pytamy o coś, czego nie da się zrobić */}
          <Przycisk tekst={t('menu.zeruj')} onPress={() => ustawPytanie(true)} testID="menu-zeruj" wylaczony={s.zablokowany}
            podpowiedz={s.zablokowany ? t('menu.zeruj_zablokowany') : undefined} />
          {s.zablokowany && <Tresc podpis>{t('menu.zeruj_zablokowany')}</Tresc>}
          {pytanie && !s.zablokowany && (
            <View style={{ gap: odstep.s }} accessibilityRole="alert">
              <Tresc>{t('menu.zeruj_pytanie', { projekt: s.projekt })}</Tresc>
              <Przycisk tekst={t('menu.zeruj_potwierdz')} onPress={() => { ustawPytanie(false); p.naZeruj(); }} rodzaj="glowny" />
            </View>
          )}
        </View>
        <View style={{ gap: odstep.s }}>
          {s.zablokowany
            ? <Przycisk tekst={t('menu.odblokuj')} onPress={p.naOdblokuj} testID="menu-odblokuj" />
            : <Przycisk tekst={t('menu.zablokuj')} onPress={p.naZablokuj} testID="menu-zablokuj" />}
          <Przycisk tekst={t('menu.ukoncz')} onPress={p.naUkoncz} testID="menu-ukoncz" />
        </View>
      </View>
    </Arkusz>
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
    <Arkusz tytul={t('licznik.akcja_cel')} przyciski={<Przycisk tekst={t('wspolne.anuluj')} onPress={p.naZamknij} rodzaj="tekstowy" testID="arkusz-zamknij" />}>
      <View style={{ gap: odstep.s }}>
        <Przycisk tekst={t('menu.cel')} onPress={p.naCel} testID="menu-cel" />
        {(s.przypomnienia ?? 0) > 0 && p.naPrzypomnienia
          ? <Pressable accessibilityRole="button" accessibilityLabel={`${t('przyp.menu')}, ${s.przypomnienia}`} onPress={p.naPrzypomnienia} testID="menu-przypomnienia" style={{ minHeight: cel.minimum, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tresc>{t('przyp.menu')}</Tresc>
              <Tresc podpis>{String(s.przypomnienia)}</Tresc>
            </Pressable>
          : <Przycisk tekst={t('menu.przypomnienie')} onPress={p.naPrzypomnienie} testID="menu-przypomnienie" />}
        <Przycisk tekst={t('menu.powtorzenie')} onPress={p.naPowtorzenie} testID="menu-powtorzenie" />
      </View>
    </Arkusz>
  );
}
