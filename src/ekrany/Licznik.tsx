// Ekran licznika (F-01–F-10, F-47, BR-LIC-*, BR-ZAK-006). Sygnatura: propozycja 07 (E3), porty i granice zatwierdzone przez 05 (Z07-22).
// Wygląd: docs/design/design-spec.md (komponenty, macierz stanów, VoiceOver) i ekrany.html `licznik-start`, `licznik-w-toku`, `limit`,
// `limit-zawczasu`; wartości z modułu motywu (tokeny 04), teksty przez t(). Decyzje (limit, blokada w danych, cel dnia) liczy domena —
// ekran pokazuje stan, który dostał; ogłoszenie i haptyka dopiero po wyniku ok (R-148). Typy: LicznikTypy.ts, style: LicznikStyl.ts.
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { LiniaKonfliktu } from './IcloudKonflikt';
import type { WzorzecHaptyki } from '../domena/porty';
import { MAX_SKALA_LICZBY, MAX_SKALA_MINUSA, MAX_SKALA_TYTULOWA, PROG_KATEGORII_DOSTEPNOSCI, useKolory } from './motyw';
import { Kreski } from './Kreski';
import { ArkuszLimitu } from './LicznikArkuszLimitu';
import { LinijkaCelu } from './LicznikCel';
import { style } from './LicznikStyl';
import type { PropsLicznika, StanEkranuLicznika, ZdarzeniePlus } from './LicznikTypy';
import type { Tlumacz } from './wspolne';

export type { BanerLicznika, LimitNaLiczniku, PropsLicznika, StanEkranuLicznika, WynikPlus, ZdarzeniePlus } from './LicznikTypy';
export type { Style } from './LicznikStyl';

/** F-48: rozpoznawalne są tylko dwa wzorce — rząd i rząd „ze znaczeniem” (instrukcja, koniec powtórzenia, cel dnia lub części). */
function wzorzecPoPlus(z: readonly ZdarzeniePlus[]): WzorzecHaptyki {
  return z.some((x) => x !== 'rzad') ? 'rzadZInstrukcja' : 'plus';
}

/** Seria z ekranu blokady albo zegarka scalona po otwarciu: źródło i godzina serii, nie scalenia (BR-LIC-019 S5, RD-17-W8); inne źródła → null (zdanie z czasem trwania). */
function tekstSerii(t: Tlumacz, b: Extract<NonNullable<StanEkranuLicznika['baner']>, { rodzaj: 'seria' }>): string | null {
  if (b.zrodlo === 'ekran_blokady') return t('licznik.seria_blokada', { count: b.n, godzina: b.godzina });
  if (b.zrodlo === 'zegarek') return t('licznik.seria_zegarek', { count: b.n, godzina: b.godzina });
  return null;
}

type Komunikat = 'blad_zapisu' | 'zablokowany' | null;

export function Licznik(p: PropsLicznika): React.ReactElement {
  const { stan: s, t } = p;
  const k = useKolory();
  const st = style(k);
  const [komunikat, ustawKomunikat] = useState<Komunikat>(null);
  const [arkuszLimitu, ustawArkuszLimitu] = useState<number | null>(null); // numer rzędu, który nie został dodany
  const zamontowany = useRef(true);
  useEffect(() => () => { zamontowany.current = false; }, []);

  const baner = s.baner;
  useEffect(() => {
    if (baner?.rodzaj === 'seria') p.oglos(tekstSerii(t, baner) ?? t('licznik.seria', { count: baner.n }));
    // ogłoszenie raz na pojawienie się banera (design-spec „VoiceOver”: seria stuknięć)
  }, [baner?.rodzaj, baner?.n]);

  const zagraj = (w: WzorzecHaptyki) => { if (s.wibracje) p.haptyka.zagraj(w); };
  const start = s.projekt === null && s.skonczone === 0;
  const nrRobocza = s.dziergany;
  const oczka = s.rodzaj === 'oczka'; // BR-LIC-006: „stitch” zamiast „row”, bez rzędu w robocie (07-jakosc-025)

  async function plus() {
    if (s.zablokowany) { // stan znany z góry: bez zapisu, komunikat jak odblokować (BR-LIC-004/S3)
      ustawKomunikat('zablokowany');
      zagraj('blokadaStukniecie');
      return;
    }
    const w = await p.naPlus();
    if (!zamontowany.current) return;
    if (!w.ok) {
      if (w.powod === 'limit') {
        ustawArkuszLimitu(nrRobocza);
        p.oglos(t('limit.ogloszenie', { n: nrRobocza, miesiac: s.miesiac.nazwa }));
      } else ustawKomunikat(w.powod === 'zablokowany' ? 'zablokowany' : 'blad_zapisu');
      return;
    }
    ustawKomunikat(null);
    zagraj(wzorzecPoPlus(w.wartosc.zdarzenia));
    const wej = w.wartosc.wejscieWPrzypomnienie;
    if (wej) p.oglos(t('licznik.wejscie_w_przypomnienie', { n: wej.rzad, tekst: wej.tekst, ktory: wej.ktory, razy: wej.razy }));
    else if (oczka) p.oglos(t('licznik.po_dodaniu_oczka', { count: w.wartosc.skonczone }));
    else p.oglos(t('licznik.po_dodaniu', { zrobione: w.wartosc.skonczone, nastepny: w.wartosc.dziergany }));
  }
  async function minus() {
    if (s.zablokowany) { ustawKomunikat('zablokowany'); zagraj('blokadaStukniecie'); return; }
    const w = await p.naMinus();
    if (!zamontowany.current) return;
    if (!w.ok) { ustawKomunikat(w.powod === 'zablokowany' ? 'zablokowany' : 'blad_zapisu'); return; }
    ustawKomunikat(null);
    zagraj('minus');
  }

  const liczba = s.znaczenie === 'w_trakcie' ? s.dziergany : s.skonczone;
  // Kategorie dostępności (04 fix-8 wariant (d), P-275 (3)): liczba nad nazwami, podpis +1 tylko w etykiecie VoiceOver (scen. 30).
  const duzyTekst = useWindowDimensions().fontScale >= PROG_KATEGORII_DOSTEPNOSCI;
  const zawczasu = s.limit.rodzaj === 'zawczasu';
  const etykietaPlus = oczka
    ? t('licznik.plus_a11y_oczka')
    : start
    ? t('licznik.plus')
    : s.przypomnienie
      ? t('licznik.plus_a11y_instrukcja', { n: nrRobocza, tekst: s.przypomnienie.tekst })
      : t('licznik.plus_a11y', { n: nrRobocza });

  const wierszLiczby = (
    <View style={st.liczbaWiersz} testID="licznik-wartosc-wiersz">
      <Text style={st.liczba} maxFontSizeMultiplier={MAX_SKALA_LICZBY} testID="licznik-wartosc">{String(liczba)}</Text>
      <Text style={st.podpis}>{s.cel !== null ? t('licznik.z_celu', { cel: s.cel }) : oczka ? t('licznik.jednostka_oczka', { count: liczba }) : t('licznik.jednostka')}</Text>
    </View>
  );

  return (
    <View style={st.ekran} onMagicTap={() => void plus()}>{/* Magic Tap = +1, ta sama ścieżka co przycisk (design-spec:88, P-284) */}
      <View style={st.pasek}>
        {p.naProjekty ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('projekty.tytul')} onPress={p.naProjekty} style={[st.ikona, st.navLink]} testID="nav-projekty">
            <Text style={[st.tresc, st.link]}>{`‹ ${t('projekty.tytul')}`}</Text>
          </Pressable>
        ) : <View />}
        <View style={st.paskaPrawa} testID="licznik-ikony">
          {p.stoper}
          {p.naWzor && (
            <Pressable accessibilityRole="button" accessibilityLabel={t('licznik.wzor_a11y')} onPress={p.naWzor} style={st.ikona} testID="licznik-wzor">
              <Text style={st.ikonaTekst} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>▤</Text>
            </Pressable>
          )}
          <Pressable accessibilityRole="button" accessibilityLabel={t('licznik.historia')} onPress={p.naHistorie} style={st.ikona} testID="licznik-historia">
            <Text style={st.ikonaTekst} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>◷</Text>
          </Pressable>
          {s.projekt !== null && (
            <Pressable accessibilityRole="button" accessibilityLabel={t('licznik.menu_a11y')} onPress={p.naMenu} style={st.ikona} testID="licznik-menu">
              <Text style={st.ikonaTekst} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>•••</Text>
            </Pressable>
          )}
        </View>
      </View>
      {s.zablokowany && (
        <View style={st.blokada} accessibilityRole="summary">
          <Text style={st.tresc}>{t('licznik.zablokowany')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('licznik.odblokuj')} onPress={p.naOdblokuj} style={st.blokadaPrzycisk} testID="pasek-blokady-odblokuj">
            <Text style={[st.tresc, st.pogrubiony]}>{t('licznik.odblokuj')}</Text>
          </Pressable>
        </View>
      )}
      <ScrollView contentContainerStyle={st.srodek}>
        {duzyTekst && wierszLiczby}
        {s.projekt !== null && (p.naProjekt ? (
          <Pressable accessibilityRole="button" accessibilityLabel={s.projekt} onPress={p.naProjekt} style={st.wpisProjektu}>
            <Text style={st.podpis} testID="licznik-projekt">{s.projekt}</Text>
          </Pressable>
        ) : <Text style={st.podpis} testID="licznik-projekt">{s.projekt}</Text>)}
        <Text style={st.tytul} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{s.czesc ?? t('licznik.tytul_roboczy')}</Text>
        {!start && !oczka && <Text style={st.instrukcja} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA} testID="licznik-teraz-rzad">{t('licznik.teraz', { n: nrRobocza })}</Text>}
        {baner?.rodzaj === 'seria' && (
          <View style={st.baner}>
            {/* testID na tekście: Maestro porównuje tekst elementu o tym id (E2E 40290477970, scenariusz 04) */}
            <Text style={st.tresc} testID="baner-serii">{tekstSerii(t, baner) ?? t('licznik.baner_seria', { count: baner.n, sekundy: baner.sekundy })}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('licznik.cofnij', { count: baner.n })} onPress={p.naCofnijSerie} style={st.drugiPrzycisk} testID="baner-serii-cofnij">
              <Text style={[st.tresc, st.pogrubiony]}>{t('licznik.cofnij', { count: baner.n })}</Text>
            </Pressable>
          </View>
        )}
        {baner?.rodzaj === 'cofnieto' && <Text style={[st.tresc, st.baner]}>{t('licznik.cofnieto', { count: baner.n, wartosc: baner.wartosc })}</Text>}
        {!duzyTekst && wierszLiczby}
        {s.konflikt && <LiniaKonfliktu k={s.konflikt} t={t} oglos={p.oglos} na={p.naKonflikt} />}
        {start && <Text style={st.tresc}>{t('licznik.podpowiedz_start')}</Text>}
        {s.cel !== null && <LinijkaCelu s={s} t={t} st={st} naNastepnaCzesc={p.naNastepnaCzesc} />}
        {s.calosc && <Text style={st.podpis}>{s.calosc.czesc === null ? t('projekt.calosc', { count: s.calosc.rzedy }) : t('licznik.calosc', { czesc: s.calosc.czesc, count: s.calosc.rzedy })}</Text>}
        {s.celDnia && <Text style={st.podpis}>{t('licznik.cel_dnia', { count: s.celDnia.rzedy })}</Text>}
        {s.limit.rodzaj === 'ostatni-darmowy' && <Text style={st.podpis}>{t('licznik.ostatni_darmowy', { miesiac: s.miesiac.nazwa })}</Text>}
        {zawczasu && (
          <Pressable accessibilityRole="link" accessibilityLabel={t('limit.pro_link')} onPress={p.naOferty} testID="limit-oferta-link">
            <Text style={[st.tresc, st.link]}>{t('limit.pro_link')}</Text>
          </Pressable>
        )}
        {s.sesja && s.sesja.rzedy > 0 && (
          <View>
            <Text style={st.podpis} testID="kreski-podpis">{t(oczka ? 'licznik.znaczniki_sesji_oczka' : 'licznik.znaczniki_sesji', { count: s.sesja.rzedy, godzina: s.sesja.od })}</Text>
            <Kreski n={s.sesja.rzedy} kolor={k.kreska} />
          </View>
        )}
        {p.sprawdzStopera}
        {s.przypomnienie && (
          <View style={st.zakreslacz} accessibilityRole="text">
            <Text style={[st.instrukcja, { color: k.tekstNaZakreslaczu }]} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t('licznik.przypomnienie', { n: nrRobocza, tekst: s.przypomnienie.tekst })}</Text>
            <Text style={[st.podpis, { color: k.tekstNaZakreslaczu }]}>
              {s.przypomnienie.nastepny !== null
                ? t('licznik.przypomnienie_postep', { ktory: s.przypomnienie.ktory, razy: s.przypomnienie.razy, nastepny: s.przypomnienie.nastepny })
                : t('licznik.przypomnienie_postep_ostatnie', { ktory: s.przypomnienie.ktory, razy: s.przypomnienie.razy })}
            </Text>
          </View>
        )}
        {s.powtorzenie && (
          <Text style={st.tresc}>{`${s.powtorzenie.nazwa} · ${t('licznik.powtorzenie', { numer: s.powtorzenie.numer, rzad: s.powtorzenie.rzadW, dlugosc: s.powtorzenie.dlugosc })}`}</Text>
        )}
        {s.notatka && (
          <View>
            <Text style={st.podpis}>{t('licznik.notatka')}</Text>
            <Text style={st.tresc}>{s.notatka}</Text>
          </View>
        )}
        {s.blizniak && (s.blizniak.notatka || s.blizniak.przypomnienie) && (
          <Text style={st.tresc}>{t('licznik.blizniak', { rzad: s.blizniak.rzad, tresc: [s.blizniak.notatka, s.blizniak.przypomnienie].filter(Boolean).join(' · ') })}</Text>
        )}
        {komunikat && (
          <Text style={st.tresc} accessibilityRole="alert" accessibilityLiveRegion="assertive" testID={komunikat === 'blad_zapisu' ? 'blad-zapisu' : undefined}>
            {t(komunikat === 'zablokowany' ? 'licznik.zablokowany_stukniecie' : 'licznik.blad_zapisu')}
          </Text>
        )}
      </ScrollView>
      {zawczasu ? (
        <View style={st.komunikatLimitu} accessibilityRole="summary">
          <Text style={st.tresc} testID="limit-zawczasu">{t('limit.zawczasu', { count: s.miesiac.rzedyDanych, miesiac: s.miesiac.nazwa, data: s.miesiac.wznowienie })}</Text>
        </View>
      ) : (
        <View style={st.przyciski}>
          <Pressable accessibilityRole="button" accessibilityLabel={t(oczka ? 'licznik.minus_a11y_oczka' : 'licznik.minus_a11y')} onPress={minus} style={st.minus} testID="licznik-minus">
            <Text style={st.minusTekst} maxFontSizeMultiplier={MAX_SKALA_MINUSA}>{t('licznik.minus')}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={etykietaPlus} onPress={plus} style={st.plus} testID="licznik-plus">
            <Text style={st.plusTekst} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t(oczka ? 'licznik.plus_oczka' : 'licznik.plus')}</Text>
            {!start && !duzyTekst && <Text style={st.plusPodpis}>{oczka ? t('licznik.podpis_plus_oczka') : t('licznik.podpis_plus', { n: nrRobocza })}</Text>}
          </Pressable>
        </View>
      )}
      {arkuszLimitu !== null && (
        <ArkuszLimitu n={arkuszLimitu} s={s} t={t} st={st} naOferty={() => { ustawArkuszLimitu(null); p.naOferty(); }} naZamknij={() => ustawArkuszLimitu(null)} />
      )}
    </View>
  );
}
