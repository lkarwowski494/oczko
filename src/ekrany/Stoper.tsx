// Stoper sesji na liczniku (F-21, U-4; design-spec „Stoper, sesje i Historia”, P-191 P1a–P3a; M3 p3a, P-586 2a: czwarta akcja w rzędzie pod liczbą).
// Bez sesji: akcja „Stoper” (start jednym stuknięciem). Trwa: ta sama komórka z ramą `akcentTekst` (token `stoper.biegnie`), ikona i czas liczony od znacznika przez
// komponent czasu, nie przez stan ekranu. Wstrzymana: komórka zwykła z symbolem pauzy, czas stoi. Stuknięcie w komórkę w trakcie sesji: menu.
// Odstępstwo nazwane (jak R8, P-191): menu i alert „inny projekt” jako widoki w ekranie, nie systemowy arkusz akcji / Alert.
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { cel, PROG_KATEGORII_DOSTEPNOSCI, odstep, promien, typografia, useKolory, type Kolory } from './motyw';
import { AkcjaLicznika, KOMORKA_AKCJI } from './LicznikAkcje';
import { Przycisk } from './Arkusz';
import type { Tlumacz } from './wspolne';

/** `znacznikMs` = start_ms + przerwy_ms (czas = teraz − znacznik); wstrzymana: czas stały. */
export type StanStopera = { rodzaj: 'brak' } | { rodzaj: 'trwa'; znacznikMs: number; startGodzina: string } | { rodzaj: 'wstrzymana'; czasMs: number; startGodzina: string };
export type PropsStopera = {
  stan: StanStopera;
  inny: { projekt: string; biezacy: string } | null; // P3a: otwarta sesja w innym projekcie
  t: Tlumacz;
  teraz(): number;
  naStart(): void; naWstrzymaj(): void; naWznow(): void; naZatrzymaj(): void; naInnyPotwierdz(): void; naInnyAnuluj(): void;
};

/** „m:ss” albo „h:mm:ss” (design-spec: kapsuła); ujemne = 0. */
export function czasStopera(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Komponent czasu: odświeża sam siebie co sekundę od znacznika (moduly.md „Jedno źródło czasu”); ekran nie trzyma tykającego stanu. */
function useCzas(stan: StanStopera, teraz: () => number): string {
  const policz = () => (stan.rodzaj === 'trwa' ? czasStopera(teraz() - stan.znacznikMs) : stan.rodzaj === 'wstrzymana' ? czasStopera(stan.czasMs) : '');
  const [czas, ustaw] = useState(policz);
  useEffect(() => {
    ustaw(policz());
    if (stan.rodzaj !== 'trwa') return undefined;
    const id = setInterval(() => ustaw(policz()), 1000);
    return () => clearInterval(id);
  }, [stan]); // eslint-disable-line react-hooks/exhaustive-deps
  return czas;
}

export function Stoper(p: PropsStopera): React.ReactElement {
  const { stan: s, t } = p;
  const k = useKolory();
  const st = style(k);
  const czas = useCzas(s, p.teraz);
  const [menu, ustawMenu] = useState(false);
  const wybierz = (f: () => void) => () => { ustawMenu(false); f(); };
  const duzy = useWindowDimensions().fontScale >= PROG_KATEGORII_DOSTEPNOSCI;
  return (
    <View style={[duzy ? st.korzenAx : st.korzen, menu || p.inny ? st.nad : null]}>
      {s.rodzaj === 'brak' ? (
        <AkcjaLicznika symbol="stopwatch" podpis={t('licznik.akcja_stoper')} etykieta={t('stoper.start_a11y')} onPress={p.naStart} testID="licznik-stoper" duzyTekst={duzy} />
      ) : (
        // Czas w komórce to ten sam tekst, który czyta etykieta; trwa = rama akcentTekst, wstrzymana = komórka zwykła z pauzą (stan nie tylko kolorem: symbol i etykieta).
        <AkcjaLicznika symbol={s.rodzaj === 'trwa' ? 'stopwatch' : 'pause.fill'} podpis={czas} etykieta={t(s.rodzaj === 'trwa' ? 'stoper.trwa_a11y' : 'stoper.wstrzymana_a11y', { czas })}
          onPress={() => ustawMenu((m) => !m)} podkreslona={s.rodzaj === 'trwa'} cyfryTabelaryczne testID="licznik-stoper" duzyTekst={duzy} />
      )}
      {menu && s.rodzaj !== 'brak' && (
        <View style={st.menu} testID="licznik-stoper-menu">
          <Text style={st.naglowek}>{t('stoper.menu_naglowek', { godzina: s.startGodzina })}</Text>
          {s.rodzaj === 'trwa'
            ? <Przycisk tekst={t('stoper.wstrzymaj')} onPress={wybierz(p.naWstrzymaj)} rodzaj="tekstowy" testID="stoper-wstrzymaj" />
            : <Przycisk tekst={t('stoper.wznow')} onPress={wybierz(p.naWznow)} rodzaj="tekstowy" testID="stoper-wznow" />}
          <Przycisk tekst={t('stoper.zatrzymaj')} onPress={wybierz(p.naZatrzymaj)} rodzaj="tekstowy" testID="stoper-zatrzymaj" />
        </View>
      )}
      {p.inny && (
        <View accessibilityRole="alert" style={st.menu} testID="licznik-stoper-inny">
          <Text style={[st.naglowek, st.pogrubiony]}>{t('stoper.inny_tytul', { projekt: p.inny.projekt })}</Text>
          <Text style={st.naglowek}>{t('stoper.inny_opis', { biezacy: p.inny.biezacy })}</Text>
          <Przycisk tekst={t('stoper.inny_potwierdz')} onPress={p.naInnyPotwierdz} rodzaj="glowny" testID="stoper-inny-potwierdz" />
          <Przycisk tekst={t('wspolne.anuluj')} onPress={p.naInnyAnuluj} rodzaj="tekstowy" />
        </View>
      )}
    </View>
  );
}

function style(k: Kolory) {
  return StyleSheet.create({
    korzen: { ...KOMORKA_AKCJI }, // M3-LIC-02: korzeń komórki w rzędzie akcji ma wymiar jak sąsiednie komórki (dawniej flex: 1 bez podstawy zwijał się do 0 i „Historia” nachodziła)
    korzenAx: { alignSelf: 'stretch' },
    nad: { zIndex: 10 }, // menu i alert „inny projekt” nad sąsiednimi akcjami (widoki w ekranie, nie systemowy arkusz — odstępstwo R8)
    menu: { position: 'absolute', top: '100%', marginTop: odstep.xs, right: 0, minWidth: 240, zIndex: 10, borderRadius: promien.grupa, backgroundColor: k.papierGrupa, padding: odstep.s, gap: odstep.xs },
    naglowek: { ...typografia.podpis, color: k.olowek, paddingHorizontal: odstep.m },
    pogrubiony: { color: k.grafit, fontWeight: '700' },
  });
}

/**
 * P-191 P5a (design-spec „Zapomniany stoper”): raz na liczniku projektu po automatycznym zamknięciu sesji — znak „i” + tekst (informacja,
 * nie kolor błędu) i odnośnik do arkusza korekty. Kiedy pokazać, liczą dane (`sesjaDoSprawdzenia`) i kompozycja.
 */
export function LiniaSprawdzenia({ t, godziny, naSprawdz }: { t: Tlumacz; godziny: number; naSprawdz(): void }): React.ReactElement {
  const k = useKolory();
  return (
    <View style={{ gap: odstep.xs }}>
      <View accessible role="status" style={{ flexDirection: 'row', gap: odstep.xs }}>
        <Text style={{ ...typografia.podpis, color: k.olowek }} importantForAccessibility="no" accessibilityElementsHidden>ⓘ</Text>
        <Text style={{ ...typografia.podpis, color: k.olowek, flex: 1 }}>{t('stoper.sprawdz', { count: godziny })}</Text>
      </View>
      <Pressable accessibilityRole="link" accessibilityLabel={t('stoper.sprawdz_link')} onPress={naSprawdz} testID="stoper-sprawdz" style={{ minHeight: cel.minimum, justifyContent: 'center' }}>
        <Text style={{ ...typografia.tresc, color: k.grafit, fontWeight: '700', textDecorationLine: 'underline' }}>{t('stoper.sprawdz_link')}</Text>
      </Pressable>
    </View>
  );
}
