// Ekran „Przewodnik” (KO-027; spec 04 `docs/design/przewodnik-2026-11-10.md` §2–§6, P-686–P-688; analogia Trening `app/guide.tsx`): duży tytuł i wstęp,
// „Pierwsze kroki” (6 kroków zawsze widocznych, numer to treść — kolejność czynności), „Biblioteka funkcji” z postępem i 9 grupami; wiersz funkcji
// rozwija opis i „Pokaż ›” (najwyżej jeden naraz, bez animacji, jak licencje fix11). Stan przeczytania: `checkmark` przed szewronem i tekst VoiceOver.
// Bez przycisków na dole, bez wyszukiwania i obrazków (§2.5, §9). Wygląd wyłącznie z tokenów (`lista`, `odstepy`, typografia Dzianiny).
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FUNKCJE, GRUPY, KROKI, type FunkcjaPrzewodnika, type KrokPrzewodnika } from '../domena/przewodnik';
import { MAX_SKALA_TYTULOWA, ROZMIAR_SYMBOLU_TRESCI, cel, odstep, promien, typografia, typografiaDzianiny, useKolory, type Kolory } from './motyw';
import { Wstecz } from './Pasek';
import { SymbolSf } from './SymbolSf';
import type { Tlumacz } from './wspolne';
import tokeny from '../../docs/design/tokeny.json';

const L = tokeny.lista;

function style(k: Kolory) {
  return StyleSheet.create({
    ekran: { flex: 1, backgroundColor: k.tlo },
    zawartosc: { paddingHorizontal: odstep.l, paddingTop: odstep.m, paddingBottom: odstep.sekcja, gap: odstep.l },
    tytul: { ...typografiaDzianiny.duzyTytul, color: k.tekst },
    wstep: { ...typografia.tresc2, color: k.tekst2 },
    sekcja: { ...typografiaDzianiny.tytul, color: k.tekst },
    blok: { gap: L.naglowekGrupy.odstepDoGrupy },
    postep: { ...typografia.tresc2, color: k.tekst2 },
    naglowekGrupy: { ...typografia.instrukcja, color: k.tekst }, // `lista.naglowekGrupy` 17 / 700 / `tekst`, nad grupą
    grupa: { borderRadius: promien.lista, backgroundColor: k.powierzchnia, overflow: 'hidden' },
    podzialka: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: k.linia },
    krok: { flexDirection: 'row', alignItems: 'flex-start', gap: odstep.m, paddingHorizontal: L.paddingPoziomy, paddingTop: L.paddingPionowy },
    numer: { ...typografiaDzianiny.tytul, color: k.tekst2 },
    kolumna: { flex: 1 },
    zdanie: { ...typografia.tresc, color: k.tekst },
    wiersz: { flexDirection: 'row', alignItems: 'center', gap: odstep.s, minHeight: L.minWysokoscWiersza, paddingHorizontal: L.paddingPoziomy, paddingVertical: L.paddingPionowy },
    nazwa: { ...typografia.tresc, fontWeight: '600', color: k.tekst, flex: 1, flexShrink: 1 },
    opis: { paddingHorizontal: L.paddingPoziomy },
    // „Pokaż ›” — przycisk tekstowy (akcja poboczna, design-spec „Arkusz formularza” (4)): `akcentTekst` 700, cel 44 pt (§2.2, krytyka (1))
    pokaz: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: odstep.xs / 2, minHeight: cel.minimum },
    pokazTekst: { ...typografia.instrukcja, color: k.akcentTekst },
    bezPokaz: { height: L.paddingPionowy }, // Apple Watch: bez „Pokaż” (§3), dolny odstęp jak wiersz
  });
}
type St = ReturnType<typeof style>;

export type PropsPrzewodnika = {
  t: Tlumacz;
  /** Język tekstów dla VoiceOver (jak Trening `guide.tsx:28`). */
  jezyk: string;
  przeczytane: readonly string[];
  /** Parametry opisów (`{{limit}}` w opisie Pro z konfiguracji, §7). */
  parametry: { limit: number };
  otwarta: string | null;
  naRozwin(id: string | null): void;
  naPokaz(cel: KrokPrzewodnika | FunkcjaPrzewodnika): void;
  naWstecz?(): void;
};

function Pokaz(p: { t: Tlumacz; nazwa: string; testID: string; st: St; onPress(): void }): React.ReactElement {
  const k = useKolory();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={p.t('przewodnik.pokaz_a11y', { nazwa: p.nazwa })} onPress={p.onPress} style={p.st.pokaz} testID={p.testID}>
      <Text style={p.st.pokazTekst}>{p.t('przewodnik.pokaz')}</Text>
      <SymbolSf nazwa="chevron.forward" rozmiar={ROZMIAR_SYMBOLU_TRESCI} kolor={k.akcentTekst} maxSkala={MAX_SKALA_TYTULOWA} />
    </Pressable>
  );
}

export function Przewodnik(p: PropsPrzewodnika): React.ReactElement {
  const k = useKolory();
  const st = style(k);
  const { t } = p;
  const krokA11y = (n: number) => t('przewodnik.krok_a11y', { n, m: KROKI.length });
  const nazwa = (f: FunkcjaPrzewodnika) => ('klucz' in f.nazwa ? t(f.nazwa.klucz) : f.nazwa.literal);
  const przeczytanych = p.przeczytane.length;
  return (
    <ScrollView style={st.ekran} contentContainerStyle={st.zawartosc} testID="przewodnik">
      {p.naWstecz && <Wstecz tekst={t('wspolne.wstecz')} onPress={p.naWstecz} />}
      <View style={st.blok}>
        <Text style={st.tytul} accessibilityRole="header">{t('przewodnik.tytul')}</Text>
        <Text style={st.wstep}>{t('przewodnik.wstep')}</Text>
      </View>

      <View style={st.blok}>
        <Text style={st.sekcja} accessibilityRole="header">{t('przewodnik.pierwsze_kroki')}</Text>
        <View style={st.grupa}>
          {KROKI.map((krok, i) => (
            <View key={krok.n} style={[st.krok, i > 0 ? st.podzialka : null]} testID={`przewodnik-krok-${krok.n}`}>
              <Text style={st.numer} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA} accessibilityElementsHidden importantForAccessibility="no">{krok.n}</Text>
              <View style={st.kolumna}>
                <Text style={st.zdanie} accessibilityLabel={`${krokA11y(krok.n)}. ${t(krok.tekst)}`} accessibilityLanguage={p.jezyk}>{t(krok.tekst)}</Text>
                <Pokaz t={t} nazwa={krokA11y(krok.n)} st={st} onPress={() => p.naPokaz(krok)} testID={`przewodnik-krok-${krok.n}-pokaz`} />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={st.blok}>
        <Text style={st.sekcja} accessibilityRole="header">{t('przewodnik.biblioteka')}</Text>
        <Text style={st.postep} testID="przewodnik-postep">{t('przewodnik.przeczytane', { n: przeczytanych, m: FUNKCJE.length })}</Text>
      </View>

      {GRUPY.map((g) => (
        <View key={g.id} style={st.blok} testID={`przewodnik-grupa-${g.id}`}>
          <Text style={st.naglowekGrupy} accessibilityRole="header">{t(g.nazwa)}</Text>
          <View style={st.grupa}>
            {g.funkcje.map((f, i) => {
              const otwarta = p.otwarta === f.id;
              const czytana = p.przeczytane.includes(f.id);
              return (
                <View key={f.id} style={i > 0 ? st.podzialka : null}>
                  <Pressable accessibilityRole="button" accessibilityLanguage={p.jezyk} accessibilityState={{ expanded: otwarta }}
                    accessibilityLabel={`${nazwa(f)}, ${t(g.nazwa)}, ${t(czytana ? 'przewodnik.przeczytana' : 'przewodnik.nieprzeczytana')}`}
                    onPress={() => p.naRozwin(otwarta ? null : f.id)} style={st.wiersz} testID={`przewodnik-f-${f.id}`}>
                    <Text style={st.nazwa}>{nazwa(f)}</Text>
                    {czytana && <SymbolSf nazwa="checkmark" rozmiar={ROZMIAR_SYMBOLU_TRESCI} kolor={k.tekst2} maxSkala={MAX_SKALA_TYTULOWA} />}
                    <SymbolSf nazwa={otwarta ? 'chevron.up' : 'chevron.down'} rozmiar={ROZMIAR_SYMBOLU_TRESCI} kolor={k.tekst2} maxSkala={MAX_SKALA_TYTULOWA} />
                  </Pressable>
                  {otwarta && (
                    <View style={st.opis}>
                      <Text style={st.zdanie} accessibilityLanguage={p.jezyk} testID={`przewodnik-f-${f.id}-opis`}>{t(f.opis, p.parametry)}</Text>
                      {f.trasa !== null ? <Pokaz t={t} nazwa={nazwa(f)} st={st} onPress={() => p.naPokaz(f)} testID={`przewodnik-f-${f.id}-pokaz`} /> : <View style={st.bezPokaz} />}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
