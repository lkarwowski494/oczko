// Ekran projektu (F-04, F-14, F-15, F-17, F-18, F-20, F-33, F-46, F-52, F-60, F-61; BR-PRJ-005, BR-PRJ-014, BR-LIC-018, BR-DNI-004/005).
// Układ i teksty: design-spec „Projekt, części i kosz” i makiety `docs/design/fix5-2026-10-26/projekt-kosz.html` (04 fix-5, P-183 3a): na wierzchu
// tylko elementy z BR; „+” (część, licznik) i ••• (Edit, Make another, Delete…, przy ukończonym Resume) jako menu w ekranie z testID z „Dla 08”.
// Sygnatura bazowa: propozycja 07 (E3, Z07-22); pola partii 5 opcjonalne, więc test 07 `projekt-dni.test.tsx` działa bez zmian.
// Postęp, cele i daty liczy domena i kompozycja; ekran tylko pokazuje i woła.
import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { cel, odstep, promien, typografia, useKolory, type Kolory } from './motyw';
import type { Tlumacz } from './wspolne';

export type LicznikProjektu = { id: string; nazwa: string; opis: string }; // opis sformatowany: „12 rows”, „18 stitches”
export type CzescProjektu = {
  id: string; nazwa: string; rzedy: number; cel: number | null; paraZ: string | null; // paraZ: id pierwszej części pary
  paraNazwa?: string | null; liczniki?: LicznikProjektu[]; calosc?: number | null;     // partia 5: liczniki części i licznik całości (BR-LIC-018)
};
export type PropsProjektu = {
  stan: {
    nazwa: string;
    czesci: CzescProjektu[];
    notatka: string | null;
    miejsceWzoru: string | null;     // „Page 3, row 48” (sformatowane)
    ostatniaZmiana: string;          // sformatowana data
    postep: { rodzaj: 'procent'; wartosc: number } | { rodzaj: 'brak-celow' };  // RD-14 (RD-14-W6)
    termin?: string | null;          // linia terminu (RD-15) sformatowana; null = bez terminu (BR-DNI-005 „Bez terminu nic”)
    ukonczony?: boolean;
    szczegoly?: { narzedzie: string | null; rozmiar: string | null; termin: string | null; probka?: string | null }; // „Needles” / „4 mm (US 6)” / krótka data / „22 stitches / 10 cm”
    /** Daty ukończonego projektu (F-51, design-spec „Data ukończenia”): sformatowane z rokiem i dni RRRR-MM-DD dla zakresu wyboru. */
    daty?: { start: string; koniec: string; startDzien: string; koniecDzien: string; dzis: string } | null;
    /** Czas projektu (P-191 P4a): suma sformatowana albo null bez sesji; liczba sesji i do sprawdzenia (`do_korekty`). */
    czas?: { suma: string | null; sesje: number; doSprawdzenia: number };
  };
  t: Tlumacz;
  naOtworzCzesc(id: string): void;
  edycja?: boolean;
  naOtworzLicznik?(id: string): void;
  naDodajCzesc?(): void; naDodajLicznik?(): void;
  naNotatka?(): void; naNarzedzie?(): void; naTermin?(): void;
  naEdytuj?(): void; naKoniecEdycji?(): void; naZrobTakaSama?(): void; naUsunProjekt?(): void; naWznow?(): void;
  naUsunCzesc?(id: string): void; naUsunLicznik?(id: string): void;
  naWstecz?(): void;
  naDataUkonczenia?(dzien: string): void; // zapis od razu po wyborze (bez „Save”, design-spec)
  naSesje?(): void;
  naProbka?(): void; // U-10: kalkulator „Swatch” z próbką projektu
  /** Grupa „Photos” po „Note” (P-191 P9a); składa kompozycja (`GrupaZdjec`). */
  zdjecia?: React.ReactNode;
  /** Grupa „Pattern(s)” nad „Details” (design-spec W8, partia 6); składa kompozycja (`GrupaWzorow`). */
  wzory?: React.ReactNode;
};

export function Projekt(p: PropsProjektu): React.ReactElement {
  const { stan: s, t } = p;
  const k = useKolory();
  const st = style(k);
  const [menu, ustawMenu] = useState<null | 'dodaj' | 'opcje'>(null);
  const [wyborDaty, ustawWyborDaty] = useState(false);
  const wgId = new Map(s.czesci.map((c) => [c.id, c]));
  const wybierz = (f?: () => void) => () => { ustawMenu(null); f?.(); };
  const pozycja = (tekst: string, f: (() => void) | undefined, testID: string, destrukcyjna = false) => (
    <Pressable key={testID} accessibilityRole="button" onPress={wybierz(f)} style={st.pozycjaMenu} testID={testID}>
      <Text style={[st.tekst, destrukcyjna && { color: k.blad }]}>{tekst}</Text>
    </Pressable>
  );
  const usun = (nazwa: string, f: () => void, testID: string) => p.edycja && (
    <Pressable accessibilityRole="button" accessibilityLabel={t('usun.a11y', { nazwa })} onPress={f} style={st.usun} testID={testID}>
      <Text style={[st.tekst, { color: k.blad }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">⊖</Text>
    </Pressable>
  );
  const opisCzesci = (c: CzescProjektu) => (c.cel !== null ? t('projekt.czesc_cel', { rzedy: c.rzedy, count: c.cel }) : t('projekt.czesc_rzedy', { count: c.rzedy }));
  return (
    <ScrollView style={st.ekran} contentContainerStyle={st.tresc}>
      {(p.naWstecz || p.naEdytuj || p.edycja) && (
        <View style={st.pasek}>
          {p.naWstecz && (
            <Pressable accessibilityRole="button" onPress={p.naWstecz} style={st.ikona} testID="nav-wstecz">
              <Text style={st.tekst}>‹ {t('wspolne.wstecz')}</Text>
            </Pressable>
          )}
          <View style={st.odstep} />
          {p.edycja ? (
            <Pressable accessibilityRole="button" onPress={p.naKoniecEdycji} style={st.ikona} testID="projekt-gotowe">
              <Text style={[st.tekst, st.pogrubiony]}>{t('wspolne.gotowe')}</Text>
            </Pressable>
          ) : (
            <>
              {!s.ukonczony && p.naDodajCzesc && (
                <Pressable accessibilityRole="button" accessibilityLabel={t('projekt.dodaj_a11y')} onPress={() => ustawMenu(menu === 'dodaj' ? null : 'dodaj')} style={st.ikona} testID="projekt-dodaj">
                  <Text style={st.ikonaTekst} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">＋</Text>
                </Pressable>
              )}
              <Pressable accessibilityRole="button" accessibilityLabel={t('projekt.menu_a11y')} onPress={() => ustawMenu(menu === 'opcje' ? null : 'opcje')} style={st.ikona} testID="projekt-menu">
                <Text style={st.ikonaTekst} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">•••</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
      {menu === 'dodaj' && (
        <View style={st.grupa}>
          {pozycja(t('projekt.dodaj_czesc'), p.naDodajCzesc, 'projekt-dodaj-czesc')}
          {pozycja(t('projekt.dodaj_licznik'), p.naDodajLicznik, 'projekt-dodaj-licznik')}
        </View>
      )}
      {menu === 'opcje' && (
        <View style={st.grupa}>
          {s.ukonczony && pozycja(t('projekt.wznow'), p.naWznow, 'projekt-wznow')}
          {!s.ukonczony && pozycja(t('projekt.edytuj'), p.naEdytuj, 'projekt-edytuj')}
          {pozycja(t('projekt.zrob_taka_sama'), p.naZrobTakaSama, 'projekt-zrob-taka-sama')}
          {pozycja(t('projekt.usun'), p.naUsunProjekt, 'projekt-usun', true)}
        </View>
      )}
      <Text style={st.tytul} accessibilityRole="header">{s.nazwa}</Text>
      {s.postep.rodzaj === 'procent' ? (
        <View>
          <Text style={st.tekst}>{t('projekt.postep', { procent: s.postep.wartosc })}</Text>
          <Text style={st.podpis}>{t('projekt.postep_opis')}</Text>
        </View>
      ) : <Text style={st.podpis}>{t('projekt.postep_bez_celow')}</Text>}
      {s.termin && <Text style={st.podpis} testID="projekt-linia-terminu">{s.termin}</Text>}
      {p.edycja && <Text style={st.podpis}>{t('projekt.edycja_info')}</Text>}

      <Text style={st.naglowek} accessibilityRole="header">{t('projekt.czesci')}</Text>
      <View style={st.grupa}>
        {s.czesci.map((c) => {
          const para = c.paraZ ? c.paraNazwa ?? wgId.get(c.paraZ)?.nazwa ?? null : null;
          const liczniki = c.liczniki ?? [];
          const jeden = liczniki.length <= 1;
          return (
            <View key={c.id} style={st.czesc}>
              <View style={st.wiersz}>
                {usun(c.nazwa, () => p.naUsunCzesc?.(c.id), 'projekt-usun-czesc')}
                <Pressable accessibilityRole="button" onPress={() => (jeden && liczniki[0] && p.naOtworzLicznik ? p.naOtworzLicznik(liczniki[0].id) : p.naOtworzCzesc(c.id))} style={st.wierszTekst}>
                  <Text style={[st.tekst, st.pogrubiony]}>{c.nazwa}</Text>
                  {para && <Text style={st.podpis}>{t('projekt.para', { nazwa: para })}</Text>}
                  {jeden ? <Text style={st.podpis}>{opisCzesci(c)}</Text>
                    : c.calosc != null && <Text style={st.podpis}>{t('projekt.calosc', { count: c.calosc })}</Text>}
                  {para && c.cel === null && <Text style={st.podpis}>{t('projekt.cel_z_pary', { nazwa: para })}</Text>}
                </Pressable>
              </View>
              {(!jeden || p.edycja) && liczniki.map((l) => (
                <View key={l.id} style={[st.wiersz, st.wciecie]}>
                  {usun(l.nazwa, () => p.naUsunLicznik?.(l.id), 'projekt-usun-licznik')}
                  <Pressable accessibilityRole="button" onPress={() => p.naOtworzLicznik?.(l.id)} style={st.wierszTekst}>
                    <Text style={st.tekst}>{l.nazwa}</Text>
                    <Text style={st.podpis}>{l.opis}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          );
        })}
      </View>

      {s.czas && (
        <View testID="projekt-czas">
          <Text style={st.naglowek} accessibilityRole="header">{t('projekt.czas')}</Text>
          <View style={st.grupa}>
            {s.czas.suma === null ? (
              <View style={st.wierszGrupy}><Text style={st.podpis}>{t('projekt.czas_brak')}</Text></View>
            ) : (
              <>
                <View style={[st.wierszGrupy, { flexDirection: 'row', justifyContent: 'space-between' }]} accessible>
                  <Text style={st.tekst}>{t('projekt.czas_wiersz')}</Text>
                  <Text style={st.tekst}>{s.czas.suma}</Text>
                </View>
                <Pressable accessibilityRole="button" onPress={p.naSesje} disabled={!p.naSesje} style={st.wierszGrupy} testID="projekt-sesje">
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={st.tekst}>{t('projekt.sesje')}</Text>
                    <Text style={st.tekst}>{String(s.czas.sesje)}<Text importantForAccessibility="no" accessibilityElementsHidden>{' ›'}</Text></Text>
                  </View>
                  {s.czas.doSprawdzenia > 0 && <Text style={st.podpis}>{t('projekt.sesje_sprawdz', { count: s.czas.doSprawdzenia })}</Text>}
                </Pressable>
              </>
            )}
          </View>
        </View>
      )}

      {(s.notatka || p.naNotatka) && (
        <>
          <Text style={st.naglowek} accessibilityRole="header">{t('licznik.notatka')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={s.notatka ? t('projekt.notatka_a11y', { tresc: s.notatka }) : t('projekt.notatka_pusta')}
            onPress={p.naNotatka} disabled={!p.naNotatka} style={[st.grupa, st.wierszGrupy]} testID="projekt-notatka">
            <Text style={s.notatka ? st.tekst : st.podpis} numberOfLines={3}>{s.notatka ?? t('projekt.notatka_pusta')}</Text>
          </Pressable>
        </>
      )}

      {p.zdjecia}

      {p.wzory}

      {s.szczegoly && (
        <>
          <Text style={st.naglowek} accessibilityRole="header">{t('projekt.szczegoly')}</Text>
          <View style={st.grupa}>
            <Pressable accessibilityRole="button" onPress={p.naNarzedzie} style={st.wierszGrupy} testID="projekt-narzedzie">
              <Text style={st.tekst}>{s.szczegoly.narzedzie ?? t('projekt.narzedzie_wiersz')}</Text>
              <Text style={st.podpis}>{s.szczegoly.rozmiar ?? t('projekt.dodaj_wartosc')}</Text>
            </Pressable>
            {p.naProbka && (
              <Pressable accessibilityRole="button" onPress={p.naProbka} style={st.wierszGrupy} testID="projekt-probka">
                <Text style={st.tekst}>{t('projekt.probka')}</Text>
                <Text style={st.podpis}>{s.szczegoly.probka ?? t('projekt.dodaj_wartosc')}</Text>
              </Pressable>
            )}
            <Pressable accessibilityRole="button" onPress={p.naTermin} style={st.wierszGrupy} testID="projekt-termin">
              <Text style={st.tekst}>{t('projekt.termin')}</Text>
              <Text style={st.podpis}>{s.szczegoly.termin ?? t('projekt.termin_brak')}</Text>
            </Pressable>
          </View>
        </>
      )}
      {s.ukonczony && s.daty && (
        <View>
          <View style={st.grupa}>
            <View style={st.wierszGrupy}>
              <Text style={st.tekst}>{t('projekt.data_startu')}</Text>
              <Text style={st.podpis}>{s.daty.start}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`${t('projekt.data_ukonczenia')}, ${s.daty.koniec}`} onPress={() => ustawWyborDaty(!wyborDaty)}
              style={st.wierszGrupy} testID="projekt-data-ukonczenia">
              <Text style={st.tekst}>{t('projekt.data_ukonczenia')}</Text>
              <Text style={st.podpis}>{s.daty.koniec}</Text>
            </Pressable>
            {wyborDaty && (
              <DateTimePicker value={dataZDnia(s.daty.koniecDzien)} mode="date" display="inline" minimumDate={dataZDnia(s.daty.startDzien)} maximumDate={dataZDnia(s.daty.dzis)}
                testID="projekt-data-ukonczenia-wybor" onValueChange={(_e, d) => p.naDataUkonczenia?.(dzienZDaty(d))} />
            )}
          </View>
          <Text style={st.podpis}>{t('projekt.data_ukonczenia_opis')}</Text>
        </View>
      )}
      {s.miejsceWzoru && <Text style={st.tekst}>{t('projekt.miejsce_wzoru', { miejsce: s.miejsceWzoru })}</Text>}
      <Text style={st.podpis}>{t('projekt.ostatnia_zmiana', { data: s.ostatniaZmiana })}</Text>
    </ScrollView>
  );
}

const dzienZDaty = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dataZDnia = (dzien: string): Date => { const [r, m, d] = dzien.split('-').map(Number); return new Date(r, m - 1, d, 12); }; // południe: bez przeskoku doby przy DST

function style(k: Kolory) {
  return StyleSheet.create({
    ekran: { flex: 1, backgroundColor: k.papier },
    tresc: { padding: odstep.l, gap: odstep.m },
    pasek: { flexDirection: 'row', alignItems: 'center' },
    odstep: { flex: 1 },
    ikona: { minWidth: cel.minimum, minHeight: cel.minimum, alignItems: 'center', justifyContent: 'center' },
    ikonaTekst: { ...typografia.instrukcja, color: k.grafit },
    tytul: { ...typografia.tytul, color: k.grafit },
    naglowek: { ...typografia.podpis, color: k.olowek, marginTop: odstep.s },
    grupa: { borderRadius: promien.grupa, backgroundColor: k.papierGrupa, overflow: 'hidden' },
    czesc: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
    wiersz: { flexDirection: 'row', alignItems: 'center', minHeight: cel.minimum },
    wciecie: { paddingLeft: odstep.xl },
    wierszTekst: { flex: 1, padding: odstep.m, minHeight: cel.minimum, justifyContent: 'center' },
    wierszGrupy: { padding: odstep.m, minHeight: cel.minimum, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
    pozycjaMenu: { padding: odstep.m, minHeight: cel.minimum, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
    usun: { minWidth: cel.minimum, minHeight: cel.minimum, alignItems: 'center', justifyContent: 'center' },
    tekst: { ...typografia.tresc, color: k.grafit },
    pogrubiony: { fontWeight: '700' },
    podpis: { ...typografia.podpis, color: k.olowek },
  });
}
