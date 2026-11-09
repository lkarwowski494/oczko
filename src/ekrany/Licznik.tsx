// Ekran licznika (F-01–F-10, F-47, BR-LIC-*, BR-ZAK-006). Sygnatura: propozycja 07 (E3), porty i granice zatwierdzone przez 05 (Z07-22).
// Wygląd: docs/design/design-spec.md (komponenty, macierz stanów, VoiceOver) i ekrany.html `licznik-start`, `licznik-w-toku`, `limit`,
// `limit-zawczasu`; wartości z modułu motywu (tokeny 04), teksty przez t(). Decyzje (limit, blokada w danych, cel dnia) liczy domena —
// ekran pokazuje stan, który dostał; ogłoszenie i haptyka dopiero po wyniku (R-148; błąd zapisu: M1-004). Typy: LicznikTypy.ts, style: LicznikStyl.ts.
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { LiniaKonfliktu } from './IcloudKonflikt';
import type { WzorzecHaptyki } from '../domena/porty';
import { MAX_SKALA_MINUSA, MAX_SKALA_TYTULOWA, odstep, PROG_AX3, PROG_KATEGORII_DOSTEPNOSCI, typografiaDzianiny, useKolory } from './motyw';
import tokeny from '../../docs/design/tokeny.json';
import { Dzianina } from './Dzianina';
import { Liczba } from './Liczba';
import { RzadAkcji } from './LicznikAkcje';
import { SymbolSf } from './SymbolSf';
import { ArkuszLimitu } from './LicznikArkuszLimitu';
import { LinijkaCelu } from './LicznikCel';
import { style } from './LicznikStyl';
import type { PropsLicznika, StanEkranuLicznika } from './LicznikTypy';
import type { Tlumacz } from './wspolne';
import { PrzyciskSymbolu, Wstecz } from './Pasek';
import { skutekPlus } from './po-plusie';

export type { BanerLicznika, LimitNaLiczniku, PropsLicznika, StanEkranuLicznika, WynikPlus, ZdarzeniePlus } from './LicznikTypy';
export type { Style } from './LicznikStyl';

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
  const [wysokoscStrefy, ustawWysokoscStrefy] = useState<number | null>(null); // 016/LIC-04: zmierzona strefa „akcje + −1/+1” (onLayout)
  const zamontowany = useRef(true);
  useEffect(() => () => { zamontowany.current = false; }, []);

  const baner = s.baner;
  useEffect(() => {
    if (baner?.rodzaj === 'seria') p.oglos(tekstSerii(t, baner) ?? t('licznik.seria', { count: baner.n }));
    // ogłoszenie raz na pojawienie się banera (design-spec „VoiceOver”: seria stuknięć)
  }, [baner?.rodzaj, baner?.n]);

  const zagraj = (w: WzorzecHaptyki) => { if (s.wibracje) p.haptyka.zagraj(w); };
  // M1-004 (wariant (a) 04-studio-projektowe-003): nieudany zapis +1/−1 nie jest cichy dla VoiceOver i dotyku — komunikat, haptyka
  // `bladZapisu` (przy włączonych wibracjach) i jedno ogłoszenie tego samego tekstu; `accessibilityLiveRegion` działa tylko na Androidzie.
  const bladZapisu = () => {
    ustawKomunikat('blad_zapisu');
    zagraj('bladZapisu');
    p.oglos(t('licznik.blad_zapisu'));
  };
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
    const sk = skutekPlus(t, w, { nrRobocza, miesiac: s.miesiac.nazwa, oczka }); // SYS-01: ta sama funkcja co pasek pod wzorem
    if (sk.komunikat === 'limit') ustawArkuszLimitu(nrRobocza); else ustawKomunikat(sk.komunikat);
    if (sk.haptyka) zagraj(sk.haptyka);
    if (sk.ogloszenie) p.oglos(sk.ogloszenie);
  }
  async function minus() {
    if (s.zablokowany) { ustawKomunikat('zablokowany'); zagraj('blokadaStukniecie'); return; }
    const w = await p.naMinus();
    if (!zamontowany.current) return;
    if (!w.ok) { if (w.powod === 'zablokowany') ustawKomunikat('zablokowany'); else bladZapisu(); return; }
    ustawKomunikat(null);
    zagraj('minus');
  }

  const liczba = s.znaczenie === 'w_trakcie' ? s.dziergany : s.skonczone;
  // Kategorie dostępności (04 fix-8 wariant (d), P-275 (3)): podpis +1 tylko w etykiecie VoiceOver (scen. 30); układ AX z makiety `licznik-*-ax5`:
  // nazwa i część, dzianina jako pas, liczba, notatka, akcje jako lista, „+1” nad „−1” na pełną szerokość.
  const okno = useWindowDimensions();
  const duzyTekst = okno.fontScale >= PROG_KATEGORII_DOSTEPNOSCI;
  const ax3 = okno.fontScale >= PROG_AX3; // 016 (`licznik.ax3ax5`): liczba pod paskiem, tytuł najwyżej 2 wiersze, bez kolumny dzianiny
  const zawczasu = s.limit.rodzaj === 'zawczasu';
  const etykietaPlus = oczka
    ? t('licznik.plus_a11y_oczka')
    : start
    ? t('licznik.plus')
    : s.przypomnienie
      ? t('licznik.plus_a11y_instrukcja', { n: nrRobocza, tekst: s.przypomnienie.tekst })
      : t('licznik.plus_a11y', { n: nrRobocza });
  const nazwaCzesci = s.czesc ?? t('licznik.tytul_roboczy');
  const sesjaRzedy = s.sesja?.rzedy ?? 0; // pas „teraz” na dzianinie: rzędy bieżącej sesji (stan licznika nie niesie „rzędów dziś” — zgłoszenie do 04/05)
  // M1-132 (SP-07) po M3: `Liczba` (komórki stałej szerokości) nie zmniejsza się do szerokości, a kolumna obok dzianiny jest wąska — liczba rośnie schodkowo w tokenach:
  // do 3 cyfr `liczbaLicznika`, 4–5 `liczbaKarty`, 6+ `liczbaPaskaWzoru`; zawsze w jednym wierszu, jednostka pod liczbą.
  const cyfry = String(liczba).length;
  const krojLiczby = cyfry >= 6 ? tokeny.typografia.liczbaPaskaWzoru : cyfry >= 4 ? tokeny.typografia.liczbaKarty : tokeny.typografia.liczbaLicznika;
  const stylLiczby = cyfry >= 6 ? st.liczbaMala : cyfry >= 4 ? st.liczbaKarty : st.liczba;
  // Kolumna dzianiny z tokenu `dzianina.kolumnaLicznika` (M3-MAK-03, P-554): 64 × 260, AX5 pas o wysokości 96 na pełną szerokość (zastępuje 72 × 252 z p3a).
  const kolumnaLicznika = tokeny.dzianina.kolumnaLicznika;
  const wymiarDzianiny = duzyTekst ? { w: Math.max(0, okno.width - 2 * odstep.xl), h: kolumnaLicznika.ax5Wysokosc } : { w: kolumnaLicznika.szerokosc, h: kolumnaLicznika.wysokosc };

  const a8 = { czesc: nazwaCzesci, sesja: sesjaRzedy };
  const zp = s.przypomnienie ? { przypomnienie: s.przypomnienie.tekst, n: nrRobocza } : null; // 008: przypomnienie w etykiecie dzianiny (`*_przyp`)
  const dzianina = (
    <View style={duzyTekst ? st.dzianinaAx : st.dzianina}>
      <Dzianina gotowe={s.skonczone} cel={s.cel} dzis={sesjaRzedy} przypomnienie={s.przypomnienie ? nrRobocza : null} szerokosc={wymiarDzianiny.w} wysokosc={wymiarDzianiny.h} testID="licznik-dzianina"
        etykieta={s.cel !== null
          ? (zp ? t('licznik.dzianina_a11y_cel_przyp', { ...a8, count: s.skonczone, cel: s.cel, ...zp }) : t('licznik.dzianina_a11y_cel', { ...a8, count: s.skonczone, cel: s.cel }))
          : (zp ? t('licznik.dzianina_a11y_przyp', { ...a8, count: s.skonczone, ...zp }) : t('licznik.dzianina_a11y', { ...a8, count: s.skonczone }))} />
    </View>
  );
  const wierszLiczby = (
    <View style={st.kolumnaLiczby} testID="licznik-wartosc-wiersz">
      {/* M3-S3-03: liczba w komórkach stałej szerokości (`Liczba`), jedna etykieta VoiceOver; jednostka pod liczbą (makieta `.licz-num small`). */}
      <Liczba wartosc={String(liczba)} styl={stylLiczby} pt={krojLiczby.pt} jezyk={p.jezyk} maxFontSizeMultiplier={krojLiczby.maxSkala} testID="licznik-wartosc" />
      <Text style={st.podpis}>{s.cel !== null ? t('licznik.z_celu', { cel: s.cel }) : oczka ? t('licznik.jednostka_oczka', { count: liczba }) : s.znaczenie === 'w_trakcie' ? t('licznik.jednostka_w_trakcie') : t('licznik.jednostka', { count: liczba })}</Text>
      {!start && !oczka && s.znaczenie !== 'w_trakcie' && <Text style={st.instrukcja} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA} testID="licznik-teraz-rzad">{t('licznik.teraz', { n: nrRobocza })}</Text>}
    </View>
  );

  // M3-LIC-03: od AX1 lista akcji płynie z treścią (makieta `.duzy`); zwykle rząd stoi nad strefą „−1 / +1”, żeby długi tytuł go nie przycinał.
  const rzadAkcji = <RzadAkcji t={t} duzyTekst={duzyTekst} oczka={oczka} naNotatka={p.naNotatka} naWzor={p.naWzor} naCel={p.naCel} naHistorie={p.naHistorie} stoper={p.stoper} />;

  return (
    <View style={st.ekran} onMagicTap={() => void plus()}>{/* Magic Tap = +1, ta sama ścieżka co przycisk (design-spec:88, P-284) */}
      <View style={st.pasek}>
        <Wstecz tekst={t('wspolne.wstecz')} onPress={p.naWstecz ?? (() => undefined)} testID="nav-wstecz" />
        <View style={st.paskaPrawa} testID="licznik-ikony">
          {s.projekt !== null && (
            <PrzyciskSymbolu symbol="ellipsis" etykieta={t('licznik.menu_wiecej_a11y')} onPress={p.naMenu} testID="licznik-menu" />
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
      {/* 016 + LIC-04 (P-613, tokeny `licznik.strefa`): strefa leży na treści, a treść kończy się odstępem = zmierzona wysokość strefy + odstepy.l,
          więc ostatnie elementy (Następna część, podpis sesji, konflikt, notatka) przewijają się nad rząd akcji. */}
      <ScrollView style={st.przewijana} contentContainerStyle={[st.srodek, wysokoscStrefy !== null && { paddingBottom: wysokoscStrefy + odstep.l }]}>
        {ax3 && wierszLiczby}
        {s.projekt !== null && (
          <Pressable accessibilityRole="button" accessibilityLabel={t('licznik.projekt_wejscie_a11y', { projekt: s.projekt })} onPress={p.naProjekt} disabled={!p.naProjekt} style={st.wejscieProjektu} testID="licznik-projekt-wejscie">
            <Text style={st.wejscieTekst} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA} accessible={false}>{t('licznik.projekt_wejscie')}</Text>
          </Pressable>
        )}
        <Text style={st.tytul} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA} testID={s.projekt !== null ? 'licznik-projekt' : undefined}
          numberOfLines={ax3 ? tokeny.licznik.ax3ax5.tytulMaxWierszy : undefined} accessibilityLabel={ax3 ? (s.projekt ?? nazwaCzesci) : undefined}>{s.projekt ?? nazwaCzesci}</Text>
        {s.projekt !== null && <Text style={st.podpis}>{nazwaCzesci}</Text>}
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
        {!ax3 && (
          <View style={duzyTekst ? st.glownaAx : st.glowna}>
            {dzianina}
            {wierszLiczby}
          </View>
        )}
        {s.konflikt && <LiniaKonfliktu k={s.konflikt} t={t} oglos={p.oglos} na={p.naKonflikt} />}
        {start && <Text style={st.tresc}>{t('licznik.podpowiedz_start')}</Text>}
        {s.cel !== null && <LinijkaCelu s={s} t={t} st={st} naNastepnaCzesc={p.naNastepnaCzesc} />}
        {s.calosc && <Text style={st.podpis} testID="licznik-calosc">{s.calosc.czesc === null ? t('projekt.calosc', { count: s.calosc.rzedy }) : t('licznik.calosc', { czesc: s.calosc.czesc, count: s.calosc.rzedy })}</Text>}
        {s.celDnia && <Text style={st.podpis}>{t('licznik.cel_dnia', { count: s.celDnia.rzedy })}</Text>}
        {s.limit.rodzaj === 'ostatni-darmowy' && <Text style={st.podpis}>{t('licznik.ostatni_darmowy', { miesiac: s.miesiac.nazwa })}</Text>}
        {zawczasu && (
          <Pressable accessibilityRole="link" accessibilityLabel={t('limit.pro_link')} onPress={p.naOferty} style={st.ofertaLink} testID="limit-oferta-link">
            <Text style={[st.tresc, st.link]}>{t('limit.pro_link')}</Text>
          </Pressable>
        )}
        {s.sesja && s.sesja.rzedy > 0 && (
          // Kreski sesji zastąpiła dzianina (pas „teraz”); podpis zostaje (kreski-podpis: scenariusz 04, tekst z `znaczniki_sesji`).
          <Text style={st.podpis} testID="kreski-podpis">{t(oczka ? 'licznik.znaczniki_sesji_oczka' : 'licznik.znaczniki_sesji', { count: s.sesja.rzedy, godzina: s.sesja.od })}</Text>
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
          <Text style={st.tresc} testID="licznik-powtorzenie">{t('licznik.powtorzenie', { nazwa: s.powtorzenie.nazwa, numer: s.powtorzenie.numer, rzad: s.powtorzenie.rzadW, dlugosc: s.powtorzenie.dlugosc })}</Text>
        )}
        {s.notatka && (
          <View style={st.notatka} testID="licznik-notatka" accessible accessibilityLabel={s.notatka}>{/* 07-p3: jeden element VoiceOver, etykieta = treść (docs/design/testid.md) */}
            <SymbolSf nazwa="note.text" rozmiar={odstep.xl} kolor={k.akcentTekst} maxSkala={MAX_SKALA_TYTULOWA} />
            <Text style={[st.tresc, st.notatkaTekst]}>{s.notatka}</Text>
          </View>
        )}
        {s.blizniak && (s.blizniak.notatka || s.blizniak.przypomnienie) && (
          <Text style={st.tresc}>{s.blizniak.notatka && s.blizniak.przypomnienie
            ? t('licznik.blizniak_oba', { rzad: s.blizniak.rzad, notatka: s.blizniak.notatka, przypomnienie: s.blizniak.przypomnienie }) // M1-144: zdanie stanu z przecinkiem ze słownika, bez „ · ”
            : t('licznik.blizniak', { rzad: s.blizniak.rzad, tresc: s.blizniak.notatka || s.blizniak.przypomnienie || '' })}</Text>
        )}
        {duzyTekst && rzadAkcji}
      </ScrollView>
      <View style={st.strefa} onLayout={(e) => ustawWysokoscStrefy(e.nativeEvent.layout.height)}>
      {/* M1-004: komunikat w stałym miejscu nad przyciskami, poza przewijaną treścią (dawniej ostatnie dziecko ScrollView, pod notatką i kreskami) */}
      {komunikat && (
        <Text style={[st.tresc, st.komunikat]} accessibilityRole="alert" accessibilityLiveRegion="assertive" testID={komunikat === 'blad_zapisu' ? 'blad-zapisu' : undefined}>
          {t(komunikat === 'zablokowany' ? 'licznik.zablokowany_stukniecie' : 'licznik.blad_zapisu')}
        </Text>
      )}
      {!duzyTekst && <View style={st.akcjeStrefa}>{rzadAkcji}</View>}
      {zawczasu ? (
        <View style={st.komunikatLimitu} accessibilityRole="summary">
          <Text style={st.tresc} testID="limit-zawczasu">{t('limit.zawczasu', { count: s.miesiac.rzedyDanych, miesiac: s.miesiac.nazwa, data: s.miesiac.wznowienie })}</Text>
        </View>
      ) : (
        <View style={duzyTekst ? st.przyciskiAx : st.przyciski} testID="licznik-przyciski">
          {/* AX5 (makieta `.duzy .dol`): kolumna, „+1” nad „−1” na pełną szerokość; zwykle „−1” z lewej, „+1” zajmuje resztę rzędu */}
          {!duzyTekst && minusPrzycisk()}
          <Pressable accessibilityRole="button" accessibilityLabel={etykietaPlus} onPress={plus} style={duzyTekst ? st.plusAx : st.plus} testID="licznik-plus">
            <Text style={st.plusTekst} maxFontSizeMultiplier={tokeny.typografia.przyciskPlus.maxSkala}>{t(oczka ? 'licznik.plus_oczka' : 'licznik.plus')}</Text>{/* 005: limit z tokenu */}
            {!start && !duzyTekst && <Text style={st.plusPodpis}>{oczka ? t('licznik.podpis_plus_oczka') : t('licznik.podpis_plus', { n: nrRobocza })}</Text>}
          </Pressable>
          {duzyTekst && minusPrzycisk()}
        </View>
      )}
      </View>
      {arkuszLimitu !== null && (
        <ArkuszLimitu n={arkuszLimitu} s={s} t={t} st={st} naOferty={() => { ustawArkuszLimitu(null); p.naOferty(); }} naZamknij={() => ustawArkuszLimitu(null)} />
      )}
    </View>
  );

  function minusPrzycisk(): React.ReactElement {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={t(oczka ? 'licznik.minus_a11y_oczka' : 'licznik.minus_a11y')} onPress={minus} style={duzyTekst ? st.minusAx : st.minus} testID="licznik-minus">
        <Text style={st.minusTekst} maxFontSizeMultiplier={MAX_SKALA_MINUSA}>{t('licznik.minus')}</Text>
      </Pressable>
    );
  }
}
