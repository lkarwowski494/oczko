// Ekran „Dziś” (M3 p2; ZM-01, ZM-18, P-549, P-563 (4a, 10a), P-571): tytuł z datą i zębatką Ustawień, karta „Kontynuuj” (K-B) z „+1”, baner serii pod kartą,
// wiersz „co dalej”, „Ten tydzień”, kafle funkcji i linia wolnych dni bez odnośnika Pro. Wygląd: docs/design/design-spec.md (Dzianina), makiety
// dzianina/wzorce-zrzuty/dzis-* (stany: pierwszy, limit, cofnąć, bez miejsca). „+1” karty = to samo zdarzenie co +1 licznika (ZM-18, ER-68): ten sam
// `naPlus` (przypadek użycia `dodajRzad`), ta sama funkcja skutku (`skutekPlus`: komunikat, haptyka, ogłoszenie) i ten sam arkusz limitu (BR-ZAK-006).
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import type { WzorzecHaptyki } from '../domena/porty';
import type { Klucz } from '../i18n/typy';
import { Dzianina, WCIECIE_DZIANINY } from './Dzianina';
import { Liczba } from './Liczba';
import { ArkuszLimitu } from './LicznikArkuszLimitu';
import { style as stylLicznika } from './LicznikStyl';
import type { PropsLicznika, StanEkranuLicznika } from './LicznikTypy';
import { MAX_SKALA_TYTULOWA, ROZMIAR_SYMBOLU_TRESCI, PROG_AX3, PROG_KATEGORII_DOSTEPNOSCI, useKolory } from './motyw';
import tokeny from '../../docs/design/tokeny.json';
import { style } from './DzisStyl';
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

export function Dzis(p: PropsDzis): React.ReactElement {
  const { stan: s, t, dane } = p;
  const k = useKolory();
  const st = style(k, p.jezyk);
  const stL = stylLicznika(k);
  const skalaTekstu = useWindowDimensions().fontScale;
  const duzyTekst = skalaTekstu >= PROG_KATEGORII_DOSTEPNOSCI;
  const ax3 = skalaTekstu >= PROG_AX3; // 004: układ `kartaDzis.ax3ax5`
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
  const a8 = { czesc, dzis: dane?.rzedyDzis ?? 0 }, k8 = s.skonczone;
  const zp = dane?.coDalej ? { przypomnienie: dane.coDalej.tekst, n: s.skonczone + dane.coDalej.za + 1 } : null; // 008 (`*_przyp`)
  const elDzianina = kolumna && (
          <Dzianina gotowe={s.skonczone} cel={s.cel} dzis={dane?.rzedyDzis ?? 0} przypomnienie={dane?.coDalej ? s.skonczone + dane.coDalej.za + 1 : null}
            szerokosc={kolumna.w} wysokosc={kolumna.h} testID="dzis-dzianina" tlo={tokeny.dzianina.tloKolumnyKarty} wciecie={WCIECIE_DZIANINY}
            etykieta={s.cel !== null
              ? (zp ? t('dzis.dzianina_a11y_cel_przyp', { ...a8, count: k8, cel: s.cel, ...zp }) : t('dzis.dzianina_a11y_cel', { ...a8, count: k8, cel: s.cel }))
              : (zp ? t('dzis.dzianina_a11y_przyp', { ...a8, count: k8, ...zp }) : t('dzis.dzianina_a11y', { ...a8, count: k8 }))} />
        );
  const elTytul = (<Text style={st.kartaTytul} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA} testID={pierwszy ? undefined : 'dzis-projekt'}>
          {pierwszy ? t('dzis.pierwszy_tytul') : s.projekt}
        </Text>);
  const elPodpis = (<Text style={st.kartaPodpis}>
          {pierwszy ? t('dzis.pierwszy_opis') : s.cel !== null ? t('dzis.czesc_rzad_cel', { czesc, n: nrRobocza, cel: s.cel }) : t('dzis.czesc_rzad', { czesc, n: nrRobocza })}
        </Text>);
  const elLiczba = (<View>
            <Liczba wartosc={String(liczba)} styl={st.liczba} pt={tokeny.typografia.liczbaKarty.pt} jezyk={p.jezyk} maxFontSizeMultiplier={tokeny.typografia.liczbaKarty.maxSkala} testID="dzis-wartosc" />
            <Text style={st.kartaPodpis}>{oczka ? t('licznik.jednostka_oczka', { count: liczba }) : pierwszy ? t('licznik.jednostka', { count: liczba }) : t('dzis.gotowe', { count: liczba })}</Text>
          </View>);
  const elPlus = !zawczasu && (
            <Pressable accessibilityRole="button" accessibilityLabel={etykietaPlus} onPress={() => void plus()} style={ax3 ? st.plusAx3 : st.plus} testID="dzis-plus">
              <Text style={st.plusTekst} maxFontSizeMultiplier={tokeny.typografia.przyciskPlus.maxSkala}>{'+1'}</Text>{/* P-606: koło 72 pt mieści tylko „+1” (znak, nie tekst do tłumaczenia); „row / stitch” niesie etykieta VoiceOver */}
            </Pressable>
          );
  const elLimit = zawczasu && (
          <View accessibilityRole="summary" style={st.limit}>
            <Text style={st.kartaTresc} testID="limit-zawczasu">{t('limit.zawczasu', { count: s.miesiac.rzedyDanych, miesiac: s.miesiac.nazwa, data: s.miesiac.wznowienie })}</Text>
            <Pressable accessibilityRole="link" accessibilityLabel={t('limit.pro_link')} onPress={p.naOferty} style={st.link} testID="limit-oferta-link">
              <Text style={[st.kartaTresc, st.podkreslony]}>{t('limit.pro_link')}</Text>
            </Pressable>
          </View>
        );
  const elKomunikat = komunikat && (
          <Text style={st.kartaTresc} accessibilityRole="alert" accessibilityLiveRegion="assertive" testID={komunikat === 'blad_zapisu' ? 'blad-zapisu' : undefined}>
            {t(komunikat === 'zablokowany' ? 'licznik.zablokowany_stukniecie' : 'licznik.blad_zapisu')}
          </Text>
        );
  const karta = bezMiejsca ? (
    <View style={[st.karta, st.kartaKolumna]} testID="dzis-karta">
      <Text style={st.kartaTytul} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t('dzis.bez_miejsca_tytul')}</Text>
      <Text style={st.kartaPodpis}>{t('dzis.bez_miejsca', { count: dane?.wToku ?? 0 })}</Text>
      {przyciskKarty(t('dzis.wybierz_projekt'), 'dzis-wybierz-projekt', p.naWybierzProjekt)}
    </View>
  ) : (
    // 004 (P-614 (2) A, `kartaDzis.ax3ax5`): od AX3 karta to stos — liczba z „+1” (cele.plusAx5) na górze, tytuł, część, dzianina pasem 48 pt, „Kontynuuj”;
    // przy limicie komunikat stoi na miejscu „+1”. Poniżej AX3 układ bez zmian.
    ax3 ? (
      <View style={[st.karta, st.kartaKolumna]} testID="dzis-karta">
        <View style={[st.liczbaIPlus, st.liczbaIPlusAx3]}>{elLiczba}{elPlus}</View>
        {elLimit}{elTytul}{elPodpis}
        <View style={st.dzianinaAx3} onLayout={naKolumne}>{elDzianina}</View>
        {elKomunikat}
        {przyciskKarty(pierwszy ? t('dzis.otworz_licznik') : t('dzis.kontynuuj'), 'dzis-kontynuuj', p.naKontynuuj)}
      </View>
    ) : (
    <View style={[st.karta, duzyTekst ? st.kartaKolumna : st.kartaWiersz]} testID="dzis-karta">
      <View style={duzyTekst ? st.dzianinaAx : st.dzianina} onLayout={naKolumne}>
        {elDzianina}
      </View>
      <View style={st.opis}>
        {elTytul}
        {elPodpis}
        <View style={st.liczbaIPlus}>
          {elLiczba}
          {elPlus}
        </View>
        {elLimit}
        {elKomunikat}
        {przyciskKarty(pierwszy ? t('dzis.otworz_licznik') : t('dzis.kontynuuj'), 'dzis-kontynuuj', p.naKontynuuj)}
      </View>
    </View>
    )
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
