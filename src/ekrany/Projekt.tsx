// Ekran projektu (F-04, F-14, F-15, F-17, F-18, F-20, F-33, F-46, F-52, F-60, F-61; BR-PRJ-005, BR-PRJ-014, BR-LIC-018, BR-DNI-004/005).
// Układ i teksty: design-spec „Projekt, części i kosz” i makiety `docs/design/fix5-2026-10-26/projekt-kosz.html` (04 fix-5, P-183 3a): na wierzchu
// tylko elementy z BR; „+” (część, licznik) i ••• (Edit, Make another, Delete…, przy ukończonym Resume) jako menu w ekranie z testID z „Dla 08”.
// Sygnatura bazowa: propozycja 07 (E3, Z07-22); pola partii 5 opcjonalne, więc test 07 `projekt-dni.test.tsx` działa bez zmian.
// Postęp, cele i daty liczy domena i kompozycja; ekran tylko pokazuje i woła.
import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Dzianina } from './Dzianina';
import { cel, MAX_SKALA_TYTULOWA, miniatura, odstep, promien, PROG_KATEGORII_DOSTEPNOSCI, ROZMIAR_SYMBOLU_TRESCI, typografia, useKolory, type Kolory } from './motyw';
import { StrzalkaWiersza, SymbolSf } from './SymbolSf';
import { PrzyciskSymbolu, Wstecz } from './Pasek';
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
    szczegoly?: { narzedzie: string | null; rozmiar: string | null; termin: string | null; probka?: string | null; wloczka?: string }; // „Needles” / „4 mm (US 6)” / krótka data / „22 stitches / 10 cm”
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
  naWloczka?(): void; // wiersz „Yarn” w Details: arkusz wyboru włóczek z zapasu (07-jakosc-001)
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
  const duzyTekst = useWindowDimensions().fontScale >= PROG_KATEGORII_DOSTEPNOSCI; // od AX1: bez miniatury dzianiny, wartość Szczegółów pod etykietą (makiety `projekt-*-ax5`)
  const [menu, ustawMenu] = useState<null | 'dodaj' | 'opcje'>(null);
  const [wyborDaty, ustawWyborDaty] = useState(false);
  const wgId = new Map(s.czesci.map((c) => [c.id, c]));
  const wybierz = (f?: () => void) => () => { ustawMenu(null); f?.(); };
  const pozycja = (tekst: string, f: (() => void) | undefined, testID: string, destrukcyjna = false) => (
    <Pressable key={testID} accessibilityRole="button" onPress={wybierz(f)} style={st.pozycjaMenu} testID={testID}>
      <Text style={[st.tekst, destrukcyjna && { color: k.niszczacy }]}>{tekst}</Text>
    </Pressable>
  );
  const usun = (nazwa: string, f: () => void, testID: string) => p.edycja && (
    <Pressable accessibilityRole="button" accessibilityLabel={t('usun.a11y', { nazwa })} onPress={f} style={st.usun} testID={testID}>
      <SymbolSf nazwa="minus.circle.fill" rozmiar={ROZMIAR_SYMBOLU_TRESCI} kolor={k.niszczacy} maxSkala={MAX_SKALA_TYTULOWA} />{/* M1-146: zamiast glifu ⊖ */}
    </Pressable>
  );
  const opisCzesci = (c: CzescProjektu) => (c.cel !== null ? t('projekt.czesc_cel', { rzedy: c.rzedy, count: c.cel }) : t('projekt.czesc_rzedy', { count: c.rzedy }));
  /** Wiersz „etykieta po lewej, wartość `tekst2` po prawej, strzałka” (makieta `.wg`); od AX1 wartość pod etykietą, strzałka zostaje przy etykiecie. */
  const wartosc = (o: { etykieta: string; podpis?: string; wartosc: string; strzalka?: boolean; naStuknij?: () => void; wylaczony?: boolean; testID?: string; etykietaA11y?: string; przycisk?: boolean; dostepny?: boolean }) => {
    const etykieta = (
      <View style={st.wartoscEtykieta}>
        <Text style={st.tekst}>{o.etykieta}</Text>
        {o.podpis && <Text style={st.podpis}>{o.podpis}</Text>}
      </View>
    );
    const wart = <Text style={[st.wartosc, duzyTekst && st.wartoscPod]}>{o.wartosc}</Text>;
    const strzalka = o.strzalka ? <StrzalkaWiersza /> : null;
    const zawartosc = duzyTekst
      ? <><View style={st.wartoscGora}>{etykieta}{strzalka}</View>{wart}</>
      : <>{etykieta}{wart}{strzalka}</>;
    const styl = [st.wierszGrupy, st.wartoscWiersz, duzyTekst && st.wartoscKolumna];
    return o.przycisk === false
      ? <View style={styl} accessible={o.dostepny} testID={o.testID}>{zawartosc}</View>
      : <Pressable accessibilityRole="button" accessibilityLabel={o.etykietaA11y} onPress={o.naStuknij} disabled={o.wylaczony} style={styl} testID={o.testID}>{zawartosc}</Pressable>;
  };
  // Wcięcie liczników części z kilkoma licznikami: do tekstu części (margines + miniatura + odstęp); bez miniatury (AX1) albo ze znakiem usunięcia (edycja) tylko margines.
  const wciecie = duzyTekst || p.edycja ? odstep.l : odstep.l + miniatura.dzianina.szerokosc + odstep.m;
  const wyborPozycji = menu === 'dodaj' ? [
    pozycja(t('projekt.dodaj_czesc'), p.naDodajCzesc, 'projekt-dodaj-czesc'),
    pozycja(t('projekt.dodaj_licznik'), p.naDodajLicznik, 'projekt-dodaj-licznik'),
  ] : menu === 'opcje' ? [
    s.ukonczony && pozycja(t('projekt.wznow'), p.naWznow, 'projekt-wznow'),
    !s.ukonczony && pozycja(t('projekt.edytuj'), p.naEdytuj, 'projekt-edytuj'),
    pozycja(t('projekt.zrob_taka_sama'), p.naZrobTakaSama, 'projekt-zrob-taka-sama'),
    pozycja(t('projekt.usun'), p.naUsunProjekt, 'projekt-usun', true),
  ] : null;
  return (
    <ScrollView style={st.ekran} contentContainerStyle={st.tresc}>
      {(p.naWstecz || p.naEdytuj || p.edycja) && (
        <View style={st.pasekObszar}>
          <View style={st.pasek}>
            {/* „Wstecz”: w makiecie akcentTekst; jeden wygląd w całej aplikacji (033), zmiana domyślnej w Pasek.tsx — zgłoszenie do 04 */}
            {p.naWstecz && (
              <Wstecz tekst={t('wspolne.wstecz')} onPress={p.naWstecz} />
            )}
            <View style={st.odstep} />
            {p.edycja ? (
              <Pressable accessibilityRole="button" onPress={p.naKoniecEdycji} style={st.ikona} testID="projekt-gotowe">
                <Text style={[st.tekst, st.gotowe]}>{t('wspolne.gotowe')}</Text>
              </Pressable>
            ) : (
              <>
                {!s.ukonczony && p.naDodajCzesc && (
                  <PrzyciskSymbolu symbol="plus" etykieta={t('projekt.dodaj_a11y')} onPress={() => ustawMenu(menu === 'dodaj' ? null : 'dodaj')} testID="projekt-dodaj" kolor={k.akcentTekst} />
                )}
                <PrzyciskSymbolu symbol="ellipsis" etykieta={t('projekt.menu_a11y')} onPress={() => ustawMenu(menu === 'opcje' ? null : 'opcje')} testID="projekt-menu" kolor={k.akcentTekst} />
              </>
            )}
          </View>
          {/* Menu „+” i •••: pływająca lista pod paskiem, przy prawej krawędzi (makieta `projekt-menu`); natywne UIMenu — backlog jak P-586 (1a) */}
          {wyborPozycji && <View style={st.menuLista} testID="projekt-menu-lista">{wyborPozycji}</View>}
        </View>
      )}
      <Text style={st.tytul} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{s.nazwa}</Text>
      {s.postep.rodzaj === 'procent' ? (
        <View>
          <Text style={st.tekst} testID="projekt-postep">{t('projekt.postep', { procent: s.postep.wartosc })}</Text>
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
                <Pressable accessibilityRole="button" onPress={() => (jeden && liczniki[0] && p.naOtworzLicznik ? p.naOtworzLicznik(liczniki[0].id) : p.naOtworzCzesc(c.id))}
                  style={[st.wierszTekst, { paddingLeft: p.edycja ? odstep.xs : odstep.l }]} testID="projekt-czesc">
                  {/* Element firmowy: ta sama dzianina co na liście Projekty niesie postęp części (rzędy / cel); ozdoba — ukryta przed VoiceOver, od AX1 w ogóle */}
                  {!duzyTekst && (
                    <View style={st.miniatura} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID="projekt-miniatura">
                      <Dzianina gotowe={c.rzedy} cel={c.cel} dzis={0} przypomnienie={null} szerokosc={miniatura.dzianina.szerokosc - 2 * miniatura.dzianina.wciecie}
                        wysokosc={miniatura.dzianina.wysokosc - 2 * miniatura.dzianina.wciecie} etykieta="" />
                    </View>
                  )}
                  <View style={st.wierszOpis}>
                    <Text style={[st.tekst, st.pogrubiony]}>{c.nazwa}</Text>
                    {para && <Text style={st.podpis}>{t('projekt.para', { nazwa: para })}</Text>}
                    {jeden ? <Text style={st.podpis}>{opisCzesci(c)}</Text>
                      : c.calosc != null && <Text style={st.podpis}>{t('projekt.calosc', { count: c.calosc })}</Text>}
                    {c.cel !== null && c.rzedy >= c.cel && <Text style={st.podpis}>{t('licznik.cel_osiagniety')}</Text>}{/* F-08, design-spec: dopisek przy celu osiągniętym */}
                    {para && c.cel === null && <Text style={st.podpis}>{t('projekt.cel_z_pary', { nazwa: para })}</Text>}
                  </View>
                  <StrzalkaWiersza />
                </Pressable>
              </View>
              {(!jeden || p.edycja) && liczniki.map((l) => (
                <View key={l.id} style={[st.wiersz, { paddingLeft: wciecie }]} testID="projekt-licznik-wiersz">
                  {usun(l.nazwa, () => p.naUsunLicznik?.(l.id), 'projekt-usun-licznik')}
                  <Pressable accessibilityRole="button" onPress={() => p.naOtworzLicznik?.(l.id)} style={[st.wierszTekst, { paddingLeft: p.edycja ? odstep.xs : 0 }]} testID="projekt-licznik">
                    <View style={st.wierszOpis}>
                      <Text style={st.tekst}>{l.nazwa}</Text>
                      <Text style={st.podpis}>{l.opis}</Text>
                    </View>
                    <StrzalkaWiersza />
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
                {wartosc({ etykieta: t('projekt.czas_wiersz'), wartosc: s.czas.suma, przycisk: false, dostepny: true })}
                {wartosc({ etykieta: t('projekt.sesje'), podpis: s.czas.doSprawdzenia > 0 ? t('projekt.sesje_sprawdz', { count: s.czas.doSprawdzenia }) : undefined,
                  wartosc: String(s.czas.sesje), strzalka: true, naStuknij: p.naSesje, wylaczony: !p.naSesje, testID: 'projekt-sesje' })}
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
            {wartosc({ etykieta: s.szczegoly.narzedzie ?? t('projekt.narzedzie_wiersz'), wartosc: s.szczegoly.rozmiar ?? t('projekt.dodaj_wartosc'), strzalka: true, naStuknij: p.naNarzedzie, testID: 'projekt-narzedzie' })}
            {s.szczegoly.wloczka !== undefined && wartosc({ etykieta: t('projekt.wloczka'), wartosc: s.szczegoly.wloczka, strzalka: true, naStuknij: p.naWloczka, wylaczony: !p.naWloczka, testID: 'projekt-wloczka' })}
            {p.naProbka && wartosc({ etykieta: t('projekt.probka'), wartosc: s.szczegoly.probka ?? t('projekt.dodaj_wartosc'), strzalka: true, naStuknij: p.naProbka, testID: 'projekt-probka' })}
            {wartosc({ etykieta: t('projekt.termin'), wartosc: s.szczegoly.termin ?? t('projekt.termin_brak'), strzalka: true, naStuknij: p.naTermin, testID: 'projekt-termin' })}
          </View>
        </>
      )}
      {s.ukonczony && s.daty && (
        <View>
          <View style={st.grupa}>
            {wartosc({ etykieta: t('projekt.data_startu'), wartosc: s.daty.start, przycisk: false })}
            {wartosc({ etykieta: t('projekt.data_ukonczenia'), wartosc: s.daty.koniec, strzalka: true, etykietaA11y: `${t('projekt.data_ukonczenia')}, ${s.daty.koniec}`,
              naStuknij: () => ustawWyborDaty(!wyborDaty), testID: 'projekt-data-ukonczenia' })}
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
    ekran: { flex: 1, backgroundColor: k.tlo },
    tresc: { padding: odstep.l, gap: odstep.m },
    pasekObszar: { zIndex: 1 }, // menu pływa nad tytułem i grupami poniżej
    pasek: { flexDirection: 'row', alignItems: 'center' },
    odstep: { flex: 1 },
    ikona: { minWidth: cel.minimum, minHeight: cel.minimum, alignItems: 'center', justifyContent: 'center' },
    tytul: { ...typografia.tytul, color: k.tekst },
    naglowek: { ...typografia.instrukcja, color: k.tekst, marginTop: odstep.s }, // `projekt.naglowekGrupy`: 17 pt / 700 / tekst (jak „Ten tydzień”)
    grupa: { borderRadius: promien.lista, backgroundColor: k.powierzchnia, overflow: 'hidden' },
    czesc: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
    wiersz: { flexDirection: 'row', alignItems: 'center', minHeight: cel.minimum },
    wierszTekst: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: odstep.m, paddingVertical: odstep.m, paddingRight: odstep.m, minHeight: cel.minimum },
    wierszOpis: { flex: 1, justifyContent: 'center' },
    miniatura: { width: miniatura.dzianina.szerokosc, height: miniatura.dzianina.wysokosc, borderRadius: miniatura.dzianina.promien, backgroundColor: k.karta, padding: miniatura.dzianina.wciecie, flex: 0 },
    wierszGrupy: { paddingVertical: odstep.m, paddingHorizontal: odstep.l, minHeight: cel.minimum, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
    wartoscWiersz: { flexDirection: 'row', alignItems: 'center', gap: odstep.s },
    wartoscKolumna: { flexDirection: 'column', alignItems: 'stretch', gap: odstep.xs },
    wartoscGora: { flexDirection: 'row', alignItems: 'center', gap: odstep.s },
    wartoscEtykieta: { flex: 1, justifyContent: 'center' },
    wartosc: { ...typografia.tresc, color: k.tekst2, flexShrink: 1, textAlign: 'right' },
    wartoscPod: { textAlign: 'left' },
    // Menu „+” i •••: pływająca lista pod paskiem (makieta `.pr-menu`: powierzchnia, promień lista); brak tokenów szerokości, cienia i wysokości 48 pt pozycji — zgłoszenie do 04.
    menuLista: { position: 'absolute', top: '100%', right: 0, backgroundColor: k.powierzchnia, borderRadius: promien.lista, overflow: 'hidden', zIndex: 2 },
    pozycjaMenu: { paddingVertical: odstep.m, paddingHorizontal: odstep.l, minHeight: cel.minimum, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
    usun: { minWidth: cel.minimum, minHeight: cel.minimum, alignItems: 'center', justifyContent: 'center' },
    tekst: { ...typografia.tresc, color: k.tekst },
    pogrubiony: { fontWeight: '700' },
    gotowe: { fontWeight: '700', color: k.akcentTekst }, // „Gotowe” w edycji: akcentTekst, 700 (`arkusz.zapisz`, makieta `.gotowe`)
    podpis: { ...typografia.podpis, color: k.tekst2 },
  });
}
