// Ekran „Dziś” (M3 p2; ZM-01, ZM-18, P-549, P-563 (4a, 10a), P-571): tytuł z datą i zębatką Ustawień, karta „Kontynuuj” (K-B) z „+1”, baner serii pod kartą,
// wiersz „co dalej”, „Ten tydzień”, kafle funkcji i linia wolnych dni bez odnośnika Pro. Wygląd: docs/design/design-spec.md (Dzianina), makiety
// dzianina/wzorce-zrzuty/dzis-* (stany: pierwszy, limit, cofnąć, bez miejsca). „+1” karty = to samo zdarzenie co +1 licznika (ZM-18, ER-68): ten sam
// `naPlus` (przypadek użycia `dodajRzad`), ta sama funkcja skutku (`skutekPlus`: komunikat, haptyka, ogłoszenie) i ten sam arkusz limitu (BR-ZAK-006).
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import type { WzorzecHaptyki } from '../domena/porty';
import type { Klucz } from '../i18n/typy';
import { Dzianina } from './Dzianina';
import { Liczba } from './Liczba';
import { ArkuszLimitu } from './LicznikArkuszLimitu';
import { style as stylLicznika } from './LicznikStyl';
import type { PropsLicznika, StanEkranuLicznika } from './LicznikTypy';
import { cel, krojTytulowy, MAX_SKALA_TYTULOWA, ROZMIAR_SYMBOLU_TRESCI, odstep, PROG_KATEGORII_DOSTEPNOSCI, promien, typografiaDzianiny as ty, useKolory, type Kolory } from './motyw';
import tokeny from '../../docs/design/tokeny.json';
import { PrzyciskSymbolu } from './Pasek';
import { skutekPlus, type KomunikatPlus } from './po-plusie';
import { SymbolSf, type NazwaSymbolu } from './SymbolSf';

export type MiejsceDzis = 'licznik' | 'wzor' | 'lista';
export type DzienTygodnia = { dzien: string; skrot: string; dziergany: boolean; dzis: boolean; a11y: string };
/** Dane „Dziś” spoza stanu licznika (odczyty `widokHistorii`, `widokProjektow`, `widok` licznika), sformatowane w kompozycji. */
export type DaneDzis = {
  data: string;                        // „czwartek, 5 listopada” (język aplikacji)
  tydzien: DzienTygodnia[];            // 7 dni od poniedziałku (RD-20)
  pustyTydzien: boolean;               // pierwsze użycie: „Tu zobaczysz dni, w które dziergasz.”
  dni: { zostalo: number; limit: number; miesiac: string } | null; // null przy Pro (P-563 (10a): bez odnośnika)
  wToku: number;                       // karta bez ostatniego miejsca: liczba projektów w toku
  miejsce: MiejsceDzis;
  rzedyDzis: number;                   // jaśniejszy pas dzianiny
  coDalej: { za: number; tekst: string; ktory: number; razy: number } | null;
};
export type KafelDzis = 'nowy-projekt' | 'dodaj-wzor' | 'wloczka' | 'probka';
export type PropsDzis = Pick<PropsLicznika, 't' | 'oglos' | 'haptyka' | 'naPlus' | 'naCofnijSerie' | 'naOferty'> & {
  stan: StanEkranuLicznika;
  dane: DaneDzis | null;               // null: przed odczytem (karta z samego stanu licznika)
  jezyk?: string;
  naKontynuuj(): void;                 // „Kontynuuj ›” / „Otwórz licznik ›” (P-563 (4a))
  naWybierzProjekt(): void;            // „Wybierz projekt ›” → zakładka Projekty (P-564, P-565)
  naUstawienia?(): void;               // zębatka — jedyne wejście do Ustawień (P-571)
  naKafel?(k: KafelDzis): void;
};

// Symbole kafli z design-spec.md:48 (P-577): Nowy projekt plus.square, Dodaj wzór doc.text, Włóczka i druty scribble.variable [DO USTALENIA 04], Próbka square.grid.3x3.
const KAFLE: { k: KafelDzis; symbol: NazwaSymbolu; klucz: Klucz }[] = [
  { k: 'nowy-projekt', symbol: 'plus.square', klucz: 'projekty.nowy' },
  { k: 'dodaj-wzor', symbol: 'doc.text', klucz: 'wzor.dodaj' },
  { k: 'wloczka', symbol: 'scribble.variable', klucz: 'dzis.kafel_wloczka' },
  { k: 'probka', symbol: 'square.grid.3x3', klucz: 'probka.tytul' },
];
/** Kolumna dzianiny na karcie (M3-MAK-03, P-554): 112 × min. 216, AX5 min. 120, promień 12 — token `dzianina.kolumnaKarty` (zastępuje 1,5 × „+1” karty z p2). */
const KOLUMNA_KARTY = tokeny.dzianina.kolumnaKarty;

export function Dzis(p: PropsDzis): React.ReactElement {
  const { stan: s, t, dane } = p;
  const k = useKolory();
  const st = style(k, p.jezyk);
  const stL = stylLicznika(k);
  const duzyTekst = useWindowDimensions().fontScale >= PROG_KATEGORII_DOSTEPNOSCI;
  const [komunikat, ustawKomunikat] = useState<KomunikatPlus>(null);
  const [arkuszLimitu, ustawArkuszLimitu] = useState<number | null>(null);
  const [kolumna, ustawKolumne] = useState<{ w: number; h: number } | null>(null);
  const zamontowany = useRef(true);
  useEffect(() => () => { zamontowany.current = false; }, []);
  const baner = s.baner;
  useEffect(() => {
    if (baner?.rodzaj === 'seria') p.oglos(t('licznik.seria', { count: baner.n })); // jak licznik: ogłoszenie raz na pojawienie się banera
  }, [baner?.rodzaj, baner?.n]);

  const oczka = s.rodzaj === 'oczka';
  const nrRobocza = s.dziergany;
  const zagraj = (w: WzorzecHaptyki) => { if (s.wibracje) p.haptyka.zagraj(w); };
  // Ta sama ścieżka co „+1” licznika (Licznik.tsx `plus`): blokada znana z góry, potem wynik przypadku użycia → `skutekPlus`.
  async function plus() {
    if (s.zablokowany) { ustawKomunikat('zablokowany'); zagraj('blokadaStukniecie'); return; }
    const w = await p.naPlus();
    if (!zamontowany.current) return;
    const sk = skutekPlus(t, w, { nrRobocza, miesiac: s.miesiac.nazwa, oczka });
    if (sk.komunikat === 'limit') ustawArkuszLimitu(nrRobocza); else ustawKomunikat(sk.komunikat);
    if (sk.haptyka) zagraj(sk.haptyka);
    if (sk.ogloszenie) p.oglos(sk.ogloszenie);
  }

  const bezMiejsca = dane?.miejsce === 'lista';
  const pierwszy = !bezMiejsca && s.projekt === null && s.skonczone === 0;
  const zawczasu = s.limit.rodzaj === 'zawczasu';
  const liczba = s.znaczenie === 'w_trakcie' ? s.dziergany : s.skonczone;
  const etykietaPlus = oczka ? t('licznik.plus_a11y_oczka') : pierwszy ? t('licznik.plus')
    : s.przypomnienie ? t('licznik.plus_a11y_instrukcja', { n: nrRobocza, tekst: s.przypomnienie.tekst }) : t('licznik.plus_a11y', { n: nrRobocza });
  const czesc = s.czesc ?? t('licznik.tytul_roboczy');
  const naKolumne = (e: LayoutChangeEvent) => { const { width, height } = e.nativeEvent.layout; ustawKolumne({ w: width, h: height }); };

  const przyciskKarty = (tekst: string, testID: string, onPress: () => void) => (
    <Pressable accessibilityRole="button" accessibilityLabel={tekst} onPress={onPress} style={st.przyciskKarty} testID={testID}>
      <Text style={st.przyciskKartyTekst} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{tekst}</Text>
      <SymbolSf nazwa="chevron.forward" rozmiar={ROZMIAR_SYMBOLU_TRESCI} kolor={k.przyciskNaKarcieTekst} maxSkala={MAX_SKALA_TYTULOWA} waga="bold" />
    </Pressable>
  );
  const karta = bezMiejsca ? (
    <View style={[st.karta, st.kartaKolumna]} testID="dzis-karta">
      <Text style={st.kartaTytul} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t('dzis.bez_miejsca_tytul')}</Text>
      <Text style={st.kartaPodpis}>{t('dzis.bez_miejsca', { count: dane?.wToku ?? 0 })}</Text>
      {przyciskKarty(t('dzis.wybierz_projekt'), 'dzis-wybierz-projekt', p.naWybierzProjekt)}
    </View>
  ) : (
    <View style={[st.karta, duzyTekst ? st.kartaKolumna : st.kartaWiersz]} testID="dzis-karta">
      <View style={duzyTekst ? st.dzianinaAx : st.dzianina} onLayout={naKolumne}>
        {kolumna && (
          <Dzianina gotowe={s.skonczone} cel={s.cel} dzis={dane?.rzedyDzis ?? 0} przypomnienie={dane?.coDalej ? s.skonczone + dane.coDalej.za + 1 : null}
            szerokosc={kolumna.w} wysokosc={kolumna.h} testID="dzis-dzianina"
            etykieta={s.cel !== null
              ? t('dzis.dzianina_a11y_cel', { czesc, count: s.skonczone, cel: s.cel, dzis: dane?.rzedyDzis ?? 0 })
              : t('dzis.dzianina_a11y', { czesc, count: s.skonczone, dzis: dane?.rzedyDzis ?? 0 })} />
        )}
      </View>
      <View style={st.opis}>
        <Text style={st.kartaTytul} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA} testID={pierwszy ? undefined : 'dzis-projekt'}>
          {pierwszy ? t('dzis.pierwszy_tytul') : s.projekt}
        </Text>
        <Text style={st.kartaPodpis}>
          {pierwszy ? t('dzis.pierwszy_opis') : s.cel !== null ? t('dzis.czesc_rzad_cel', { czesc, n: nrRobocza, cel: s.cel }) : t('dzis.czesc_rzad', { czesc, n: nrRobocza })}
        </Text>
        <View style={st.liczbaIPlus}>
          <View>
            <Liczba wartosc={String(liczba)} styl={st.liczba} pt={tokeny.typografia.liczbaKarty.pt} jezyk={p.jezyk} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA} testID="dzis-wartosc" />
            <Text style={st.kartaPodpis}>{oczka ? t('licznik.jednostka_oczka', { count: liczba }) : pierwszy ? t('licznik.jednostka', { count: liczba }) : t('dzis.gotowe', { count: liczba })}</Text>
          </View>
          {!zawczasu && (
            <Pressable accessibilityRole="button" accessibilityLabel={etykietaPlus} onPress={() => void plus()} style={st.plus} testID="dzis-plus">
              <Text style={st.plusTekst} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t(oczka ? 'licznik.plus_oczka' : 'licznik.plus')}</Text>
            </Pressable>
          )}
        </View>
        {zawczasu && (
          <View accessibilityRole="summary" style={st.limit}>
            <Text style={st.kartaTresc} testID="limit-zawczasu">{t('limit.zawczasu', { count: s.miesiac.rzedyDanych, miesiac: s.miesiac.nazwa, data: s.miesiac.wznowienie })}</Text>
            <Pressable accessibilityRole="link" accessibilityLabel={t('limit.pro_link')} onPress={p.naOferty} style={st.link} testID="limit-oferta-link">
              <Text style={[st.kartaTresc, st.podkreslony]}>{t('limit.pro_link')}</Text>
            </Pressable>
          </View>
        )}
        {komunikat && (
          <Text style={st.kartaTresc} accessibilityRole="alert" accessibilityLiveRegion="assertive" testID={komunikat === 'blad_zapisu' ? 'blad-zapisu' : undefined}>
            {t(komunikat === 'zablokowany' ? 'licznik.zablokowany_stukniecie' : 'licznik.blad_zapisu')}
          </Text>
        )}
        {przyciskKarty(pierwszy ? t('dzis.otworz_licznik') : t('dzis.kontynuuj'), 'dzis-kontynuuj', p.naKontynuuj)}
      </View>
    </View>
  );

  return (
    <View style={st.ekran}>
      <ScrollView contentContainerStyle={st.tresc}>
        <View style={st.naglowek}>
          <View style={st.opis}>
            <Text style={st.tytul} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t('dzis.tytul')}</Text>
            {dane && <Text style={st.podpis}>{dane.data}</Text>}
          </View>
          {p.naUstawienia && <PrzyciskSymbolu symbol="gearshape" etykieta={t('ustawienia.tytul')} onPress={p.naUstawienia} testID="nav-ustawienia" />}
        </View>
        {karta}
        {/* Baner strażnika serii pod kartą (dzis-cofnac-*, F-47, RD-17): karta i „+1” się nie przesuwają */}
        {baner?.rodzaj === 'seria' && (
          <View style={st.wiersz}>
            <Text style={st.trescEkranu} testID="baner-serii">{t('licznik.baner_seria', { count: baner.n, sekundy: baner.sekundy })}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('licznik.cofnij', { count: baner.n })} onPress={p.naCofnijSerie} style={st.drugiPrzycisk} testID="baner-serii-cofnij">
              <Text style={[st.trescEkranu, st.pogrubiony]}>{t('licznik.cofnij', { count: baner.n })}</Text>
            </Pressable>
          </View>
        )}
        {baner?.rodzaj === 'cofnieto' && <Text style={[st.trescEkranu, st.wiersz]}>{t('licznik.cofnieto', { count: baner.n, wartosc: baner.wartosc })}</Text>}
        {!bezMiejsca && !pierwszy && !oczka && dane?.coDalej && (
          <Pressable accessibilityRole="button" onPress={p.naKontynuuj} style={[st.wiersz, st.wierszPoziomy]} testID="dzis-co-dalej">
            <View style={st.znacznik} />
            <Text style={[st.trescEkranu, st.opis]}>
              {dane.coDalej.za === 0
                ? t('dzis.co_dalej_teraz', { tekst: dane.coDalej.tekst, ktory: dane.coDalej.ktory, razy: dane.coDalej.razy })
                : t('dzis.co_dalej', { count: dane.coDalej.za, tekst: dane.coDalej.tekst, ktory: dane.coDalej.ktory, razy: dane.coDalej.razy })}
            </Text>
            <SymbolSf nazwa="chevron.forward" rozmiar={ROZMIAR_SYMBOLU_TRESCI} kolor={k.tekst2} maxSkala={MAX_SKALA_TYTULOWA} />
          </Pressable>
        )}
        {dane && (
          <View style={st.sekcja}>
            <Text style={st.naglowekSekcji} accessibilityRole="header">{t('dzis.ten_tydzien')}</Text>
            <View style={duzyTekst ? st.tydzienAx : st.tydzien}>
              {dane.tydzien.map((d) => (
                <View key={d.dzien} style={duzyTekst ? st.dzienAx : st.dzien} accessible accessibilityLabel={d.a11y}>
                  <View style={[st.kwadrat, d.dziergany ? st.dziergany : null, d.dzis ? st.dzis : null]} />
                  <Text style={[st.skrot, d.dzis ? st.pogrubiony : null]}>{d.skrot}</Text>
                </View>
              ))}
            </View>
            {dane.pustyTydzien && <Text style={st.podpis}>{t('dzis.tydzien_pusty')}</Text>}
          </View>
        )}
        <View style={duzyTekst ? st.kafleAx : st.kafle}>
          {KAFLE.map((x) => (
            <Pressable key={x.k} accessibilityRole="button" accessibilityLabel={t(x.klucz)} onPress={() => p.naKafel?.(x.k)} style={duzyTekst ? st.kafelAx : st.kafel} testID={`dzis-kafel-${x.k}`}>
              <View style={st.ikona}><SymbolSf nazwa={x.symbol} rozmiar={ROZMIAR_SYMBOLU_TRESCI} kolor={k.ikona} maxSkala={MAX_SKALA_TYTULOWA} /></View>
              <Text style={[st.trescEkranu, st.pogrubiony]} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t(x.klucz)}</Text>
            </Pressable>
          ))}
        </View>
        {/* Linia wolnych dni tylko bez Pro, bez odnośnika „Oczko Pro” (P-563 (10a), ER-70) */}
        {dane?.dni && <Text style={st.podpis} testID="dzis-dni-darmowe">{t('projekty.dni', { count: dane.dni.limit, zostalo: dane.dni.zostalo, limit: dane.dni.limit, miesiac: dane.dni.miesiac })}</Text>}
      </ScrollView>
      {arkuszLimitu !== null && (
        <ArkuszLimitu n={arkuszLimitu} s={s} t={t} st={stL} naOferty={() => { ustawArkuszLimitu(null); p.naOferty(); }} naZamknij={() => ustawArkuszLimitu(null)} />
      )}
    </View>
  );
}

function style(k: Kolory, jezyk?: string) {
  const bree = jezyk === undefined ? {} : { fontFamily: krojTytulowy(jezyk) }; // języki z krojem systemowym (M3-S3-04)
  return StyleSheet.create({
    ekran: { flex: 1, backgroundColor: k.tlo },
    tresc: { paddingHorizontal: odstep.l, paddingBottom: odstep.sekcja, gap: odstep.xl },
    naglowek: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: odstep.m },
    tytul: { ...ty.duzyTytul, ...bree, color: k.tekst },
    podpis: { ...ty.tresc2, color: k.tekst2 },
    opis: { flex: 1, gap: odstep.xs },
    karta: { backgroundColor: k.karta, borderRadius: promien.karta, padding: odstep.l, gap: odstep.l },
    kartaWiersz: { flexDirection: 'row' },
    kartaKolumna: { flexDirection: 'column' },
    dzianina: { width: KOLUMNA_KARTY.szerokosc, alignSelf: 'stretch', minHeight: KOLUMNA_KARTY.minWysokosc, borderRadius: KOLUMNA_KARTY.promien, overflow: 'hidden' },
    dzianinaAx: { alignSelf: 'stretch', minHeight: KOLUMNA_KARTY.ax5MinWysokosc, borderRadius: KOLUMNA_KARTY.promien, overflow: 'hidden' },
    kartaTytul: { ...ty.tytul, ...bree, color: k.kartaTekst },
    kartaPodpis: { ...ty.tresc2, color: k.kartaTekst2 },
    kartaTresc: { ...ty.tresc, color: k.kartaTekst },
    liczbaIPlus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: odstep.m },
    liczba: { ...ty.liczbaKarty, ...bree, color: k.kartaTekst },
    plus: { width: cel.plus, height: cel.plus, borderRadius: cel.plus / 2, backgroundColor: k.akcent, alignItems: 'center', justifyContent: 'center' },
    plusTekst: { ...ty.przyciskPlus, color: k.naAkcencie },
    limit: { gap: odstep.s },
    link: { minHeight: cel.minimum, justifyContent: 'center' },
    podkreslony: { textDecorationLine: 'underline', fontWeight: '700' },
    przyciskKarty: { flexDirection: 'row', minHeight: cel.minimum, alignItems: 'center', justifyContent: 'center', gap: odstep.s, borderRadius: promien.przycisk, backgroundColor: k.przyciskNaKarcie, paddingHorizontal: odstep.l, paddingVertical: odstep.m },
    przyciskKartyTekst: { ...ty.tresc, fontWeight: '700', color: k.przyciskNaKarcieTekst },
    wiersz: { backgroundColor: k.powierzchnia, borderRadius: promien.przycisk, padding: odstep.l, gap: odstep.s },
    wierszPoziomy: { flexDirection: 'row', alignItems: 'center', minHeight: cel.minimum, gap: odstep.m },
    znacznik: { width: odstep.l, height: odstep.xl, borderRadius: odstep.s, backgroundColor: k.akcent },
    trescEkranu: { ...ty.tresc, color: k.tekst },
    pogrubiony: { fontWeight: '700' },
    drugiPrzycisk: { minHeight: cel.minimum, justifyContent: 'center', alignSelf: 'flex-start' },
    sekcja: { gap: odstep.m },
    naglowekSekcji: { ...ty.tresc, fontWeight: '700', color: k.tekst },
    tydzien: { flexDirection: 'row', gap: odstep.s },
    tydzienAx: { flexDirection: 'row', flexWrap: 'wrap', gap: odstep.s },
    dzien: { flex: 1, alignItems: 'center', gap: odstep.xs },
    dzienAx: { width: '22%', alignItems: 'center', gap: odstep.xs }, // AX5: tydzień 4 + 3 (design-spec „Typografia”)
    kwadrat: { alignSelf: 'stretch', aspectRatio: 1, minHeight: cel.minimum, borderRadius: promien.dzien, backgroundColor: k.dzienPusty },
    dziergany: { backgroundColor: k.akcent },
    dzis: { borderWidth: 2, borderColor: k.tekst },
    skrot: { ...ty.mala, color: k.tekst2 },
    kafle: { flexDirection: 'row', flexWrap: 'wrap', gap: odstep.l },
    kafleAx: { gap: odstep.l },
    kafel: { width: '47%', flexGrow: 1, minHeight: cel.plus * 2, backgroundColor: k.powierzchnia, borderRadius: promien.kafel, padding: odstep.l, gap: odstep.m, justifyContent: 'space-between' },
    kafelAx: { backgroundColor: k.powierzchnia, borderRadius: promien.kafel, padding: odstep.l, gap: odstep.m },
    ikona: { width: cel.minimum, height: cel.minimum, borderRadius: promien.przycisk, backgroundColor: k.ikonaTlo, alignItems: 'center', justifyContent: 'center' },
  });
}
