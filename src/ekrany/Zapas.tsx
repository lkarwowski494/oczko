// Zapas włóczki i druty (F-37, BR-ZAP-001/003/004; P-191 P8a; design-spec „Zapas”; makiety fix6 `zapas`, `zapas-filtr`, `zapas-pusty`,
// `wloczka`, `druty-lista`, `drut`). Stan list i przeliczenia (RD-03, RD-11, RD-19) liczy kompozycja; ekran pokazuje i woła zapis.
// Pielęgnacja tylko tekstem (OG-13, OP-11). Krokowiec motków co KROK_MOTKA (jak karta ukończenia, P-126 (2a)).
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Arkusz, Komunikat, Pole, Przycisk, Tresc, Wybor } from './Arkusz';
import { useZapis, type Zapis } from './FormularzeProjektu';
import { WierszGrupy, style as styleNarzedzi } from './Narzedzia';
import { cel, MAX_SKALA_TYTULOWA, odstep, promien, typografia, useKolory, type Kolory } from './motyw';
import type { Tlumacz } from './wspolne';
import { krokMotkow } from '../domena/zapas';
import type { FiltrZapasu, StanDrutow, StanZapasu } from '../kompozycja/zapas';
import type { FormularzWloczki as DaneWloczki, RodzajNarzedzia } from '../przypadki-uzycia/zapas';

const NAZWY_KATEGORII = ['kategoria.nazwa_0', 'kategoria.nazwa_1', 'kategoria.nazwa_2', 'kategoria.nazwa_3', 'kategoria.nazwa_4', 'kategoria.nazwa_5', 'kategoria.nazwa_6', 'kategoria.nazwa_7'] as const;

/** Pasek ekranu listy: tytuł i „+” (makieta: „‹ Tools … ＋”; powrót gestem systemowym jak „Recently deleted”). */
function Naglowek(p: { tytul: string; dodaj: string; naDodaj(): void; testID: string }): React.ReactElement {
  const st = style(useKolory());
  return (
    <View style={st.naglowek}>
      <Text style={st.tytul} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{p.tytul}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={p.dodaj} onPress={p.naDodaj} style={st.plus} testID={p.testID}>
        <Text style={st.plusZnak}>＋</Text>
      </Pressable>
    </View>
  );
}

export type PropsZapasu = {
  t: Tlumacz; stan: StanZapasu; zapytanie: string; filtr: FiltrZapasu;
  naSzukaj(z: string): void; naFiltr(f: FiltrZapasu): void; naDodaj(): void; naOtworz(id: string): void;
};
export function Zapas({ t, stan: s, zapytanie, filtr, naSzukaj, naFiltr, naDodaj, naOtworz }: PropsZapasu): React.ReactElement {
  const k = useKolory();
  const st = style(k);
  const sn = styleNarzedzi(k);
  const pustyZapas = s.pusto?.rodzaj === 'zapas';
  return (
    <ScrollView style={sn.ekran} contentContainerStyle={sn.tresc} keyboardShouldPersistTaps="handled" testID="zapas-lista">
      <Naglowek tytul={t('narzedzia.wloczki')} dodaj={t('zapas.dodaj')} naDodaj={naDodaj} testID="zapas-dodaj" />
      {pustyZapas ? (
        <View style={st.pusto}>
          <Text style={sn.opis}>{s.pusto?.tekst}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('zapas.dodaj')} onPress={naDodaj} style={st.przycisk}>
            <Text style={st.przyciskTekst}>{t('zapas.dodaj')}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <TextInput placeholder={t('projekty.szukaj')} accessibilityLabel={t('projekty.szukaj')} placeholderTextColor={k.olowek} value={zapytanie}
            onChangeText={naSzukaj} style={st.szukaj} autoCorrect={false} returnKeyType="search" testID="zapas-szukaj" />
          <View accessibilityRole="radiogroup" accessibilityLabel={t('zapas.filtr_a11y')} style={st.chipy} testID="zapas-filtr">
            {s.chipy.map((c) => (
              <Pressable key={String(c.wartosc)} accessibilityRole="radio" accessibilityLabel={c.tekst} accessibilityState={{ selected: c.wartosc === filtr }}
                onPress={() => naFiltr(c.wartosc)} style={[st.chip, c.wartosc === filtr && st.chipWybrany]}>
                <Text style={[st.chipTekst, c.wartosc === filtr && st.chipTekstWybrany]}>{c.tekst}</Text>
              </Pressable>
            ))}
          </View>
          {s.pusto ? (
            <View style={st.pusto}>
              <Text style={sn.opis} testID="zapas-brak-wynikow">{s.pusto.tekst}</Text>
              {s.pusto.rodzaj === 'filtr' && (
                <Pressable accessibilityRole="button" accessibilityLabel={t('zapas.pokaz_wszystkie')} onPress={() => naFiltr('wszystkie')} style={st.przycisk}>
                  <Text style={st.przyciskTekst}>{t('zapas.pokaz_wszystkie')}</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={sn.grupa}>
              {s.wiersze.map((w, i) => (
                <Pressable key={w.id} accessibilityRole="button" accessibilityLabel={[w.nazwa, w.linia, w.motek].filter(Boolean).join(', ')}
                  onPress={() => naOtworz(w.id)} testID="zapas-wynik" style={[sn.wiersz, i === s.wiersze.length - 1 && sn.wierszOstatni]}>
                  <View style={sn.wierszTekst}>
                    <Text style={sn.nazwa}>{w.nazwa}</Text>
                    <Text style={sn.opis}>{w.linia}</Text>
                    {w.motek ? <Text style={sn.opis}>{w.motek}</Text> : null}
                  </View>
                  <Text style={sn.opis} importantForAccessibility="no" accessibilityElementsHidden>›</Text>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

type Jednostka = 'm' | 'yd' | 'g' | 'oz';
/** Przełącznik jednostki pola (radio, `selected`; testID `zapas-jednostka-{j}`). */
function Jednostki(p: { opcje: [Jednostka, Jednostka]; wybrana: Jednostka; naWybor(j: Jednostka): void }): React.ReactElement {
  const st = style(useKolory());
  return (
    <View accessibilityRole="radiogroup" style={st.chipy}>
      {p.opcje.map((j) => (
        <Pressable key={j} accessibilityRole="radio" accessibilityLabel={j} accessibilityState={{ selected: j === p.wybrana }} onPress={() => p.naWybor(j)}
          style={[st.chip, j === p.wybrana && st.chipWybrany]} testID={`zapas-jednostka-${j}`}>
          <Text style={[st.chipTekst, j === p.wybrana && st.chipTekstWybrany]}>{j}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export type PropsFormularzaWloczki = {
  t: Tlumacz;
  poczatek: DaneWloczki | null;                                   // null = nowa włóczka
  jednostki: 'metryczne' | 'imperialne';                          // domyślne jednostki pól (wartość z bazy pokazana w metrycznych)
  przelicz(tekst: string, j: Jednostka): string | null;           // linia „= …” pod polem (RD-03)
  bazowa(tekst: string, j: Jednostka): number | null | 'zly';     // wartość pola w m albo g
  formatuj(n: number): string;
  naZapisz: Zapis<DaneWloczki>;
  naAnuluj(): void;
  zdjecia?: React.ReactNode;                                      // grupa „Label photo” (tylko przy edycji: zdjęcie potrzebuje id włóczki)
  naUsun?(): void;                                                // P-209: „Delete yarn” (potwierdzenie z terminem w trasie), tylko przy edycji
};
export function FormularzWloczki(p: PropsFormularzaWloczki): React.ReactElement {
  const { t, poczatek: w } = p;
  const st = style(useKolory());
  const imp = p.jednostki === 'imperialne' && w === null;
  const [nazwa, ustawNazwe] = useState(w?.nazwa ?? '');
  const [producent, ustawProducenta] = useState(w?.producent ?? '');
  const [sklad, ustawSklad] = useState(w?.sklad ?? '');
  const [kolor, ustawKolor] = useState(w?.kolor ?? '');
  const [kategoria, ustawKategorie] = useState<number | null>(w?.kategoria ?? null);
  const [wyborKategorii, ustawWybor] = useState(false);
  const [motki, ustawMotki] = useState<number>(w?.motki ?? 0);
  const [jd, ustawJd] = useState<Jednostka>(imp ? 'yd' : 'm');
  const dlugoscZBazy = w?.dlugoscMotkaM == null ? '' : p.formatuj(w.dlugoscMotkaM);
  const [dlugosc, ustawDlugosc] = useState(dlugoscZBazy);
  const [jw, ustawJw] = useState<Jednostka>(imp ? 'oz' : 'g');
  const wagaZBazy = w?.wagaMotkaG == null ? '' : p.formatuj(w.wagaMotkaG);
  const [waga, ustawWage] = useState(wagaZBazy);
  const [pielegnacja, ustawPielegnacje] = useState(w?.pielegnacja ?? '');
  const [notatka, ustawNotatke] = useState(w?.notatka ?? '');
  const [blad, zapisz] = useZapis();
  // Pole niezmienione (tekst i jednostka bazowa jak przy otwarciu) → wartość z bazy, nie zaokrąglona z ekranu (bez cichej zmiany danych).
  const d: number | null | 'zly' = w && dlugosc === dlugoscZBazy && jd === 'm' ? w.dlugoscMotkaM : p.bazowa(dlugosc, jd);
  const g: number | null | 'zly' = w && waga === wagaZBazy && jw === 'g' ? w.wagaMotkaG : p.bazowa(waga, jw);
  const nazwaKategorii = (n: number | null) => (n === null ? t('zapas.kategoria_brak') : `${n} · ${t(NAZWY_KATEGORII[n] ?? 'kategoria.nazwa_0')}`);
  const mozna = nazwa.trim() !== '' && d !== 'zly' && g !== 'zly';
  const naZapisz = () => {
    if (nazwa.trim() === '' || d === 'zly' || g === 'zly') return;
    zapisz(p.naZapisz, { nazwa: nazwa.trim(), producent, sklad, kolor, kategoria, motki, dlugoscMotkaM: d, wagaMotkaG: g, pielegnacja, notatka });
  };
  const liniaPola = (tekst: string, wartosc: number | null | 'zly', j: Jednostka, testID?: string) =>
    wartosc === 'zly' ? <Komunikat tekst={t('probka.blad_wartosc')} znak /> : (() => { const l = p.przelicz(tekst, j); return l ? <Tresc podpis testID={testID}>{l}</Tresc> : null; })();
  return (
    <Arkusz tytul={t(w ? 'zapas.edytuj' : 'zapas.dodaj')} formularz={{ t, zapisz: t(w ? 'wspolne.zapisz' : 'wspolne.dodaj'), naZapisz, naAnuluj: p.naAnuluj, wylaczony: !mozna }}>
      <Pole etykieta={t('zapas.pole_nazwa')} wartosc={nazwa} naZmiane={ustawNazwe} testID="zapas-nazwa" />
      <Pole etykieta={t('zapas.pole_producent')} wartosc={producent} naZmiane={ustawProducenta} />
      <Pole etykieta={t('zapas.pole_sklad')} wartosc={sklad} naZmiane={ustawSklad} />
      <Pole etykieta={t('zapas.pole_kolor')} wartosc={kolor} naZmiane={ustawKolor} />
      <Pressable accessibilityRole="button" accessibilityLabel={`${t('zapas.pole_kategoria')}, ${nazwaKategorii(kategoria)}`} onPress={() => ustawWybor((x) => !x)} style={st.wierszPola}>
        <Text style={st.etykieta}>{t('zapas.pole_kategoria')}</Text>
        <Text style={st.wartosc}>{nazwaKategorii(kategoria)} ›</Text>
      </Pressable>
      {wyborKategorii && (
        <Wybor<string> opcje={[null, 0, 1, 2, 3, 4, 5, 6, 7].map((n) => ({ wartosc: String(n), tekst: nazwaKategorii(n) }))} wybrana={String(kategoria)}
          naWybor={(x) => { ustawKategorie(x === 'null' ? null : Number(x)); ustawWybor(false); }} />
      )}
      <Text style={st.etykieta}>{t('zapas.pole_motki')}</Text>
      <View accessible accessibilityRole="adjustable" accessibilityLabel={t('zapas.pole_motki')} accessibilityValue={{ text: p.formatuj(motki) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => ustawMotki((m) => krokMotkow(m, e.nativeEvent.actionName === 'increment' ? 1 : -1))} style={st.krokowiec}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('ukonczenie.zuzycie_mniej')} onPress={() => ustawMotki((m) => krokMotkow(m, -1))} style={st.krok}><Text style={st.znak}>−</Text></Pressable>
        <Text style={st.wartoscKroku}>{p.formatuj(motki)}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t('ukonczenie.zuzycie_wiecej')} onPress={() => ustawMotki((m) => krokMotkow(m, 1))} style={st.krok}><Text style={st.znak}>+</Text></Pressable>
      </View>
      <Pole etykieta={t('zapas.pole_dlugosc')} wartosc={dlugosc} naZmiane={ustawDlugosc} dziesietne testID="zapas-dlugosc" />
      <Jednostki opcje={['m', 'yd']} wybrana={jd} naWybor={ustawJd} />
      {liniaPola(dlugosc, d, jd, 'zapas-przeliczone')}
      <Pole etykieta={t('zapas.pole_waga')} wartosc={waga} naZmiane={ustawWage} dziesietne testID="zapas-waga" />
      <Jednostki opcje={['g', 'oz']} wybrana={jw} naWybor={ustawJw} />
      {liniaPola(waga, g, jw)}
      <Pole etykieta={t('narzedzia.pielegnacja')} wartosc={pielegnacja} naZmiane={ustawPielegnacje} wielowierszowe />
      <Pole etykieta={t('zapas.pole_notatka')} wartosc={notatka} naZmiane={ustawNotatke} wielowierszowe />
      {p.zdjecia}
      {w && p.naUsun && <Przycisk tekst={t('usun.wloczka')} onPress={p.naUsun} rodzaj="tekstowy" testID="zapas-usun" />}
      {blad && <Komunikat tekst={t('licznik.blad_zapisu')} />}
    </Arkusz>
  );
}

export type PropsListyDrutow = { t: Tlumacz; stan: StanDrutow; naDodaj(): void; naOtworz(id: string): void };
export function ListaDrutow({ t, stan: s, naDodaj, naOtworz }: PropsListyDrutow): React.ReactElement {
  const k = useKolory();
  const sn = styleNarzedzi(k);
  return (
    <ScrollView style={sn.ekran} contentContainerStyle={sn.tresc} testID="druty-lista">
      <Naglowek tytul={t('narzedzia.druty')} dodaj={t('druty.dodaj')} naDodaj={naDodaj} testID="druty-dodaj" />
      {s.grupy.length === 0 ? <Text style={sn.opis}>{t('druty.pusto')}</Text> : (
        <>
          {s.grupy.map((g) => (
            <View key={g.naglowek} style={{ gap: odstep.s }}>
              <Text style={sn.naglowek} accessibilityRole="header">{g.naglowek}</Text>
              <View style={sn.grupa}>
                {g.wiersze.map((w, i) => (
                  <WierszGrupy key={w.id} tekst={w.rozmiar || w.opis} opis={w.rozmiar ? w.opis || undefined : undefined} onPress={() => naOtworz(w.id)} ostatni={i === g.wiersze.length - 1} />
                ))}
              </View>
            </View>
          ))}
          <Text style={sn.opis}>{t('druty.uwaga_mm')}</Text>
        </>
      )}
    </ScrollView>
  );
}

export type DaneDrutu = { rodzaj: RodzajNarzedzia; rozmiarMm: number | null; opis: string };
export function FormularzDrutu(p: {
  t: Tlumacz; poczatek: DaneDrutu | null; podglad(tekst: string, r: RodzajNarzedzia): string | null; parsuj(tekst: string): number | null | 'zly';
  formatuj(n: number): string; naZapisz: Zapis<DaneDrutu>; naAnuluj(): void; naUsun?(): void; // P-209, tylko przy edycji
}): React.ReactElement {
  const { t, poczatek: w } = p;
  const [rodzaj, ustawRodzaj] = useState<RodzajNarzedzia>(w?.rodzaj ?? 'druty');
  const [mm, ustawMm] = useState(w?.rozmiarMm == null ? '' : p.formatuj(w.rozmiarMm));
  const [opis, ustawOpis] = useState(w?.opis ?? '');
  const [blad, zapisz] = useZapis();
  const r = p.parsuj(mm);
  const podglad = p.podglad(mm, rodzaj);
  return (
    <Arkusz tytul={t(w ? 'druty.edytuj' : 'druty.dodaj')} formularz={{ t, zapisz: t(w ? 'wspolne.zapisz' : 'wspolne.dodaj'), wylaczony: r === 'zly', naAnuluj: p.naAnuluj, naZapisz: () => { if (r !== 'zly') zapisz(p.naZapisz, { rodzaj, rozmiarMm: r, opis: opis.trim() }); } }}>
      <Wybor<RodzajNarzedzia> opcje={[{ wartosc: 'druty', tekst: t('druty.igly') }, { wartosc: 'szydelko', tekst: t('projekt.szydelko') }, { wartosc: 'inne', tekst: t('druty.inne') }]}
        wybrana={rodzaj} naWybor={ustawRodzaj} />
      <Pole etykieta={t('formularz.narzedzie_mm')} wartosc={mm} naZmiane={ustawMm} dziesietne testID="formularz-rozmiar-mm" />
      {r === 'zly' ? <Komunikat tekst={t('formularz.narzedzie_blad')} znak /> : podglad ? <Tresc podpis>{podglad}</Tresc> : null}
      <Pole etykieta={t('druty.pole_opis')} wartosc={opis} naZmiane={ustawOpis} />
      <Tresc podpis>{t('druty.pole_opis_przyklad')}</Tresc>
      {w && p.naUsun && <Przycisk tekst={t('usun.narzedzie')} onPress={p.naUsun} rodzaj="tekstowy" testID="drut-usun" />}
      {blad && <Komunikat tekst={t('licznik.blad_zapisu')} />}
    </Arkusz>
  );
}

function style(k: Kolory) {
  return StyleSheet.create({
    naglowek: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: odstep.m },
    tytul: { ...typografia.tytul, color: k.grafit, flex: 1 },
    plus: { minWidth: cel.minimum, minHeight: cel.minimum, alignItems: 'center', justifyContent: 'center' },
    plusZnak: { ...typografia.tytul, color: k.grafit },
    szukaj: { ...typografia.tresc, color: k.grafit, minHeight: cel.minimum, borderRadius: promien.pole, backgroundColor: k.papierGrupa, paddingHorizontal: odstep.m },
    chipy: { flexDirection: 'row', flexWrap: 'wrap', gap: odstep.s },
    chip: { minHeight: cel.minimum, justifyContent: 'center', paddingHorizontal: odstep.m, borderRadius: promien.pole, borderWidth: 2, borderColor: k.linia },
    chipWybrany: { borderColor: k.drugiPrzyciskObrys, backgroundColor: k.papierGrupa },
    chipTekst: { ...typografia.podpis, color: k.grafit },
    chipTekstWybrany: { fontWeight: '700' },
    pusto: { gap: odstep.m, alignItems: 'flex-start' },
    przycisk: { minHeight: cel.minimum, justifyContent: 'center', paddingHorizontal: odstep.l, borderRadius: promien.przyciskDrugi, borderWidth: 2, borderColor: k.drugiPrzyciskObrys },
    przyciskTekst: { ...typografia.tresc, color: k.grafit, fontWeight: '700' },
    wierszPola: { minHeight: cel.minimum, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: odstep.m },
    etykieta: { ...typografia.podpis, color: k.olowek },
    wartosc: { ...typografia.tresc, color: k.grafit },
    krokowiec: { flexDirection: 'row', alignItems: 'center', gap: odstep.s },
    krok: { minWidth: cel.minimum, minHeight: cel.minimum, alignItems: 'center', justifyContent: 'center', borderRadius: promien.przyciskDrugi, borderWidth: 2, borderColor: k.drugiPrzyciskObrys },
    znak: { ...typografia.tresc, color: k.grafit, fontWeight: '700' },
    wartoscKroku: { ...typografia.tresc, color: k.grafit, minWidth: 72, textAlign: 'center' },
  });
}
