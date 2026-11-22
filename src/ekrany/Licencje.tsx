// Ekran „Open source licenses” (M1-245, P-661, fix11; design: docs/design/fix11-2026-11-10.md): krój Bree Serif z pełnym tekstem OFL (warunek 2 licencji),
// treści licencji (MIT, Apache-2.0…) rozwijane stuknięciem, biblioteki natywne iOS spoza npm i pakiety npm z notami o prawach autorskich. Dane: moduł
// wygenerowany `src/domena/licencje.generated.ts` (scripts/jakosc/licencje-generuj.mjs, kontrola w jakosc:kontrole). Treści prawne, nazwy pakietów i SPDX bez tłumaczenia
// i bez limitu skali tekstu (AX5); jedna licencja rozwinięta naraz, bez animacji.
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { KROJE, NATYWNE_IOS, PAKIETY_NPM, TEKSTY_LICENCJI, type WpisLicencji } from '../domena/licencje.generated';
import { MAX_SKALA_TYTULOWA, ROZMIAR_SYMBOLU_TRESCI, cel, odstep, promien, typografia, useKolory, type Kolory } from './motyw';
import { Wstecz } from './Pasek';
import { SymbolSf } from './SymbolSf';
import type { Tlumacz } from './wspolne';

const IDENTYFIKATORY = Object.keys(TEKSTY_LICENCJI).sort();
const wpisId = (r: WpisLicencji) => `${r[0]}@${r[1]}`;

function style(k: Kolory) {
  return StyleSheet.create({
    ekran: { flex: 1, backgroundColor: k.tlo },
    zawartosc: { padding: odstep.l, paddingBottom: odstep.sekcja, gap: odstep.l },
    tytul: { ...typografia.tytul, color: k.tekst },
    wstep: { ...typografia.tresc2, color: k.tekst2 },
    naglowek: { ...typografia.instrukcja, color: k.tekst, paddingTop: odstep.s, paddingBottom: odstep.s },
    grupa: { borderRadius: promien.lista, backgroundColor: k.powierzchnia, overflow: 'hidden' },
    wiersz: { flexDirection: 'row', alignItems: 'center', gap: odstep.m, minHeight: cel.minimum, paddingHorizontal: odstep.l, paddingVertical: odstep.m },
    // Wiersze pakietów to osobne elementy listy wirtualizowanej: kontener grupy rysuje się po jednym wierszu, więc zaokrąglenia tylko na pierwszym i ostatnim.
    pakiet: { marginHorizontal: odstep.l, borderRadius: 0 },
    pakietPierwszy: { borderTopLeftRadius: promien.lista, borderTopRightRadius: promien.lista },
    pakietOstatni: { borderBottomLeftRadius: promien.lista, borderBottomRightRadius: promien.lista },
    podzialka: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: k.linia },
    kolumna: { flex: 1, gap: odstep.xs },
    nazwa: { ...typografia.tresc, color: k.tekst },
    podpis: { ...typografia.mala, color: k.tekst2 },
    tresc: { ...typografia.mala, color: k.tekst, paddingLeft: odstep.l, paddingRight: odstep.l, paddingTop: odstep.m, paddingBottom: odstep.l },
  });
}
type St = ReturnType<typeof style>;

/** Wiersz z podpisami (jedna linia na element `podpisy`) — nieinteraktywny (biblioteki natywne, pakiety). */
function WierszInfo({ nazwa, podpisy, st, pierwszy }: { nazwa: string; podpisy: readonly string[]; st: St; pierwszy: boolean }): React.ReactElement {
  return (
    <View style={[st.wiersz, pierwszy ? null : st.podzialka]}>
      <View style={st.kolumna}>
        <Text style={st.nazwa}>{nazwa}</Text>
        {podpisy.map((p, i) => <Text key={`${i}-${p}`} style={st.podpis}>{p}</Text>)}
      </View>
    </View>
  );
}

/** Wiersz rozwijany: przycisk z `accessibilityState.expanded`, pod nim (w tym samym kontenerze, za podziałką) tekst licencji; stuknięcie w rozwinięty zwija. */
function WierszRozwijany(p: { id: string; testID: string; nazwa: string; podpisy: readonly string[]; etykieta: string; tekst: string; otwarty: string | null; ustaw(id: string | null): void; st: St; pierwszy: boolean }): React.ReactElement {
  const k = useKolory();
  const rozwiniety = p.otwarty === p.id;
  return (
    <View style={p.pierwszy ? null : p.st.podzialka}>
      <Pressable accessibilityRole="button" accessibilityLabel={p.etykieta} accessibilityState={{ expanded: rozwiniety }} onPress={() => p.ustaw(rozwiniety ? null : p.id)} style={p.st.wiersz} testID={p.testID}>
        <View style={p.st.kolumna}>
          <Text style={p.st.nazwa}>{p.nazwa}</Text>
          {p.podpisy.map((x) => <Text key={x} style={p.st.podpis}>{x}</Text>)}
        </View>
        <SymbolSf nazwa={rozwiniety ? 'chevron.down' : 'chevron.right'} rozmiar={ROZMIAR_SYMBOLU_TRESCI} kolor={k.tekst2} maxSkala={MAX_SKALA_TYTULOWA} />
      </Pressable>
      {rozwiniety && (
        <View style={p.st.podzialka}>
          <Text style={p.st.tresc} selectable testID="licencje-tekst">{p.tekst}</Text>
        </View>
      )}
    </View>
  );
}

export function Licencje({ t, naWstecz }: { t: Tlumacz; naWstecz?(): void }): React.ReactElement {
  const k = useKolory();
  const st = style(k);
  const [otwarty, ustaw] = useState<string | null>(null);
  const notyWiersza = (r: WpisLicencji): readonly string[] => [r[2], ...r[3]];
  const naglowek = (klucz: Parameters<Tlumacz>[0]) => <Text style={st.naglowek} accessibilityRole="header">{t(klucz)}</Text>;
  const naglowekListy = (
    <View style={st.zawartosc}>
      {naWstecz && <Wstecz tekst={t('wspolne.wstecz')} onPress={naWstecz} />}
      <Text style={st.tytul} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t('ustawienia.licencje')}</Text>
      <Text style={st.wstep}>{t('licencje.wstep')}</Text>
      <View>
        {naglowek('licencje.grupa_kroje')}
        <View style={st.grupa}>
          {KROJE.map((f, i) => (
            <WierszRozwijany key={f.id} id={`kroj:${f.id}`} testID={`licencje-kroj-${f.id}`} nazwa={f.nazwa} podpisy={[f.spdx, f.nota]} etykieta={`${f.nazwa}, ${f.spdx}`}
              tekst={f.tekst} otwarty={otwarty} ustaw={ustaw} st={st} pierwszy={i === 0} />
          ))}
        </View>
      </View>
      <View>
        {naglowek('licencje.grupa_licencje')}
        <View style={st.grupa}>
          {IDENTYFIKATORY.map((id, i) => (
            <WierszRozwijany key={id} id={`lic:${id}`} testID={`licencje-licencja-${id}`} nazwa={id} podpisy={[]} etykieta={id} tekst={TEKSTY_LICENCJI[id]?.tekst ?? ''} otwarty={otwarty} ustaw={ustaw} st={st} pierwszy={i === 0} />
          ))}
        </View>
      </View>
      <View>
        {naglowek('licencje.grupa_natywne')}
        <View style={st.grupa}>
          {NATYWNE_IOS.map((r, i) => <WierszInfo key={wpisId(r)} nazwa={`${r[0]} ${r[1]}`} podpisy={notyWiersza(r)} st={st} pierwszy={i === 0} />)}
        </View>
      </View>
      {naglowek('licencje.grupa_pakiety')}
    </View>
  );
  return (
    <FlatList style={st.ekran} testID="licencje-lista" data={PAKIETY_NPM} keyExtractor={wpisId} ListHeaderComponent={naglowekListy} initialNumToRender={20} windowSize={11}
      contentContainerStyle={{ paddingBottom: odstep.sekcja }}
      renderItem={({ item, index }) => (
        <View style={[st.grupa, st.pakiet, index === 0 ? st.pakietPierwszy : null, index === PAKIETY_NPM.length - 1 ? st.pakietOstatni : null]}>
          <WierszInfo nazwa={`${item[0]} ${item[1]}`} podpisy={notyWiersza(item)} st={st} pierwszy={index === 0} />
        </View>
      )} />
  );
}
