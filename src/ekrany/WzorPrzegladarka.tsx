// Przeglądarka wzoru (design-spec „Wzór, rysik i iPad”, makiety fix7 `wzor.html`; P-220 W1a, W3, W4b, W5a, W6a, W9b; P-218 (1)–(3)).
// Strona PDF z rysunkami i znacznikiem to widok modułu natywnego `oczko-wzor` (slot `widok`, składa kompozycja); ekran rysuje pasek nawigacji,
// narzędzia, plakietkę strony i pasek licznika (te same testID co licznik). Jeden wzór widoczny naraz; obok wzoru tylko licznik (P-218 (3)).
import React, { useEffect, useState } from 'react';
import { RYSIK_PODPOWIEDZ_MS } from '../konfiguracja';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Narzedzie } from '../domena/rysik';
import type { ChipNotatki } from '../domena/znacznik-wzoru';
import { ArkuszNotatekWzoru } from './WzorNotatki';
import { pytajOdrzucZmiany } from './pytanie-odrzucenia';
import { Menu, MenuWzorow, Pozycja } from './WzorMenu';
import { LicznikWzoru, type BladPaska } from './WzorLicznik';
import { GlifZnacznika, PasekZnacznika, PytanieKierunku, type StanZnacznika } from './WzorZnacznik';
import { KOLUMNA_TRESCI_MAKS, type Uklad } from '../domena/uklad';
import { MAX_SKALA_TYTULOWA, ROZMIAR_SYMBOLU, ROZMIAR_SYMBOLU_TRESCI, cel as rozmiary, odstep, promien, typografia, useKolory, type Kolory } from './motyw';
import { SymbolSf, type NazwaSymbolu } from './SymbolSf';
import type { Tlumacz, WynikEkranu } from './wspolne';
import { PrzyciskSymbolu, Wstecz } from './Pasek';

export type StanPrzegladarki = {
  nazwa: string;
  opis: string;                                   // `wzor.wiersz_opis` („PDF · 6 pages”), testID `wzor-zrodlo`
  czesc: string;                                  // część licznika: „‹” wraca do niej (`wzor.wstecz_a11y`)
  wzory: { wzorId: string; nazwa: string }[];     // wzory projektu (W9b); ≥ 2 → tytuł przełącza
  oczekujace?: { id: string; nazwa: string }[];   // strony WWW projektu czekające na sieć: wiersze w liście ▾, a ▾ jest też przy jednym wzorze (poz. 12 C)
  wzorId: string;
  strona: { n: number; razem: number } | null;
  zakreslenia: number;
  narzedzie: Narzedzie;
  word: boolean;                                  // podgląd zastępczy Worda: bez znacznika i rysowania (W11)
  wskazowka?: boolean;                            // M1-131: pierwsze otwarcie — linia `wzor.wskazowka_znacznika` (decyzja i flaga: trasa)
  kierunek?: 1 | -1 | null;                       // kierunek rzędów zapisany w znaczniku; null = pierwsze ustawienie pyta (P-126 (3a))
  licznik: { liczba: number; dziergany: number; znaczenie: 'skonczone' | 'w_trakcie' }; // znaczenie liczby (F-09): w trakcie = liczba jest rzędem, bez linii „Now working row n”
  uklad: Uklad;
  jezyk?: string;                                 // kod języka aplikacji dla liczby paska (krój systemowy w części języków)
};
export type PropsPrzegladarki = {
  stan: StanPrzegladarki;
  t: Tlumacz;
  widok: React.ReactNode;
  terminKosza?: string;                           // krótka data końca kosza do opisu usunięcia (P-229)
  naWstecz(): void;
  naPrzelacz(wzorId: string): void;
  naUsunOczekujacy?(id: string): void;            // ✕ w wierszu „czeka na sieć”
  naNarzedzie(n: Narzedzie): void;
  naCofnij(): void;
  naZaznaczRzad(kierunek: 1 | -1): void;
  naNotatka?(tekst: string): void;              // notatka przy rzędzie znacznika (BR-WZR-008/S2; bez znacznika — najpierw „Mark row”, P-124 Q6a)
  naNowaNotatka?(jest: boolean): void;          // M1-141: arkusz nowej notatki z wpisanym tekstem — trasa pyta przy geście wstecz jak „Back”
  pasekZn?: { current: boolean };        // M1-131: przeglądarka zapisuje, czy pasek ustawień znacznika jest widoczny (do „Done”) — trasa pozwala wtedy przenieść pas stuknięciem
  znacznik?: StanZnacznika | null;                // pas na stronie: pasek ustawiania (krokowiec rzędu), koniec strony, „przed schematem” (F-26)
  razemStron?: number;
  oczekujacePrzytrzymanie?: boolean;              // przytrzymanie na wzorze bez znacznika czeka na kierunek (3a)
  naKierunekPrzytrzymania?(kierunek: 1 | -1): void;
  naNieTerazPrzytrzymania?(): void;               // DEC-38 a: „Not now” w karcie kierunku czyści przytrzymanie, znacznik nie powstaje
  naZmienKierunek?(kierunek: 1 | -1): void;       // „Change” w pasku znacznika
  naKrokRzaduZnacznika?(delta: 1 | -1): void;     // krokowiec rzędu schematu (BR-WZR-003 S3)
  naNastepnaStrona?(): void;                      // „Place on page n”
  chipy?: ChipNotatki[];                          // chipy notatek strony (F-56): arkusz notatki albo lista, gdy chip jest otwarty
  otwartyChip?: number | null;                    // rząd licznika chipu otwartego stuknięciem w widoku natywnym
  naChip?(rzad: number | null): void;
  naZmienNotatke?(id: string, tekst: string): Promise<boolean>;
  naUsunNotatke?(id: string): Promise<boolean>;
  naObroc(): void;
  naZmienNazwe(): void;
  tylkoRysik?: boolean;                    // po pierwszym rysiku (P-218 Q2a): podpowiedź raz na otwarcie (P-284 (1) A)                    // ••• → „Rename” (design-spec W1a)
  naUsun(): void;
  potwierdz(tytul: string, opis: string, przycisk: string, f: () => void): void;
  naPlus(): Promise<WynikEkranu<unknown>>;
  naMinus(): Promise<WynikEkranu<unknown>>;
  naOferty?(): void; // M1-203: odnośnik limitu na pasku
};

export function PrzegladarkaWzoru(p: PropsPrzegladarki): React.ReactElement {
  const { stan: s, t } = p;
  const k = useKolory();
  const st = style(k);
  const [menu, ustawMenu] = useState<'brak' | 'opcje' | 'wzory'>('brak');
  const [blad, ustawBlad] = useState<BladPaska>(false);
  const [pytanie, ustawPytanie] = useState<'brak' | 'zaznacz' | 'zmien'>('brak'); // „Which way do rows go on this page?” (3a: bez wartości domyślnej)
  const [ustawianie, ustawUstawianie] = useState(false); // pasek znacznika po „Mark row”/przeniesieniu, do „Done” (design-spec, „Przy liczeniu”)
  const pasekOtwarty = ustawianie && p.znacznik != null; // PasekZnacznika rysuje pasek tylko przy znaczniku
  useEffect(() => { if (p.pasekZn) p.pasekZn.current = pasekOtwarty; }, [pasekOtwarty, p.pasekZn]);
  const [notatka, ustawNotatke] = useState<'brak' | 'pasek' | 'arkusz'>('brak');
  const [tekst, ustawTekst] = useState('');
  const nowaZTekstem = notatka === 'arkusz' && tekst.trim().length > 0;
  useEffect(() => { p.naNowaNotatka?.(nowaZTekstem); }, [nowaZTekstem]); // eslint-disable-line react-hooks/exhaustive-deps -- tylko zmiana stanu arkusza
  const [podpowiedz, ustawPodpowiedz] = useState<'nie' | 'widac' | 'byla'>('nie'); // `wzor.rysik_podpowiedz` raz na otwarcie (P-284 (1) A)
  useEffect(() => {
    if (!p.tylkoRysik || podpowiedz !== 'nie') return;
    ustawPodpowiedz('widac');
    const z = setTimeout(() => ustawPodpowiedz('byla'), RYSIK_PODPOWIEDZ_MS);
    return () => clearTimeout(z);
  }, [p.tylkoRysik]); // eslint-disable-line react-hooks/exhaustive-deps -- tylko przejście na rysik
  const [notatkaPo, ustawNotatkaPo] = useState(false); // po ustawieniu znacznika arkusz notatki otwiera się sam (design-spec)
  const znacznikUstawiony = (kier: 1 | -1) => { p.naZaznaczRzad(kier); ustawUstawianie(true); if (notatkaPo) { ustawNotatkaPo(false); ustawNotatke('arkusz'); } };
  const zaznacz = () => { if (s.kierunek === 1 || s.kierunek === -1) znacznikUstawiony(s.kierunek); else ustawPytanie('zaznacz'); };
  const ustawiam = pytanie !== 'brak' || !!p.oczekujacePrzytrzymanie || ustawianie || p.znacznik != null; // M1-131: ustawianie zaczęte
  const [bezWskazowki, ustawBezWskazowki] = useState(false); // …i wskazówka już nie wraca (spec pkt 3 „Znika”)
  useEffect(() => { if (ustawiam) ustawBezWskazowki(true); }, [ustawiam]);
  const ipad = s.uklad.klasa === 'regular';
  const tryb = s.narzedzie !== 'brak';
  const obok = s.uklad.wzor === 'obok';
  const czekajace = s.oczekujace ?? [];

  async function licz(f: () => Promise<WynikEkranu<unknown>>) { const r = await f(); ustawBlad(r.ok ? false : r.powod === 'limit' || r.powod === 'zablokowany' ? r.powod : true); } // M1-203
  const narzedzie = (n: Narzedzie, klucz: 'wzor.zakreslacz' | 'wzor.pioro' | 'wzor.gumka', id: string, symbol: NazwaSymbolu) => (
    <Pressable key={id} accessibilityRole="button" accessibilityLabel={t(klucz)} accessibilityState={{ selected: s.narzedzie === n }}
      accessibilityValue={n === 'zakreslacz' ? { text: t('wzor.zakreslenia', { count: s.zakreslenia }) } : undefined}
      onPress={() => p.naNarzedzie(s.narzedzie === n ? 'brak' : n)} style={[st.ikona, s.narzedzie === n && st.wybrane]} testID={id}>
      <SymbolSf nazwa={symbol} rozmiar={ROZMIAR_SYMBOLU} kolor={k.grafit} maxSkala={MAX_SKALA_TYTULOWA} />
    </Pressable>
  );
  const cofnij = (
    <Pressable key="cofnij" accessibilityRole="button" accessibilityLabel={t('wzor.cofnij_rysunek')} onPress={p.naCofnij} style={st.ikona} testID="wzor-cofnij-rysunek">
      <SymbolSf nazwa="arrow.uturn.backward" rozmiar={ROZMIAR_SYMBOLU} kolor={k.grafit} maxSkala={MAX_SKALA_TYTULOWA} />
    </Pressable>
  );

  const pasekNawigacji = !ipad && tryb ? (
    // iPhone i iPad compact w trybie rysowania: pasek nawigacji zamienia się w pasek narzędzi (W5a)
    <View style={st.pasek}>
      <View style={st.grupa}>{narzedzie('zakreslacz', 'wzor.zakreslacz', 'wzor-zakreslacz', 'highlighter')}{narzedzie('gumka', 'wzor.gumka', 'wzor-gumka', 'eraser')}{cofnij}</View>
      <Pressable accessibilityRole="button" accessibilityLabel={t('wspolne.gotowe')} onPress={() => p.naNarzedzie('brak')} style={st.ikona}>
        <Text style={[st.tresc, st.pogrubiony]}>{t('wspolne.gotowe')}</Text>
      </Pressable>
    </View>
  ) : (
    <View style={st.pasek}>
      <Wstecz tylkoSymbol tekst={t('wspolne.wstecz')} etykieta={t('wzor.wstecz_a11y', { czesc: s.czesc })}
        onPress={() => { if (nowaZTekstem) pytajOdrzucZmiany(t, 'nowy', p.naWstecz); else p.naWstecz(); }} />
      <View style={st.tytulPaska}>
        {s.wzory.length >= 2 || czekajace.length > 0 ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('wzor.przelacz_a11y', { nazwa: s.nazwa })} onPress={() => ustawMenu('wzory')} style={st.przelacz} testID="wzor-przelacz">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: odstep.xs }}>{/* M1-146: chevron.down zamiast glifu ▾ */}
              <Text style={[st.tytul, { flexShrink: 1 }]} numberOfLines={2}>{s.nazwa}</Text>
              <SymbolSf nazwa="chevron.down" rozmiar={ROZMIAR_SYMBOLU_TRESCI} kolor={k.grafit} maxSkala={MAX_SKALA_TYTULOWA} />
            </View>
          </Pressable>
        ) : <Text style={st.tytul} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA} numberOfLines={2}>{s.nazwa}</Text>}
        <Text style={st.podpis} testID="wzor-zrodlo">{s.opis}</Text>
      </View>
      <View style={st.grupa}>
        {!s.word && (
          <Pressable accessibilityRole="button" accessibilityLabel={t('wzor.zaznacz_rzad')} onPress={zaznacz} style={st.ikona} testID="wzor-zaznacz">
            <GlifZnacznika k={k} />
          </Pressable>
        )}
        {!s.word && p.naNotatka && (
          <Pressable accessibilityRole="button" accessibilityLabel={t('wzor.dodaj_notatke')} onPress={() => ustawNotatke(s.kierunek ? 'arkusz' : 'pasek')} style={st.ikona}>
            <SymbolSf nazwa="note.text.badge.plus" rozmiar={ROZMIAR_SYMBOLU} kolor={k.grafit} maxSkala={MAX_SKALA_TYTULOWA} />
          </Pressable>
        )}
        {!s.word && !ipad && narzedzie('zakreslacz', 'wzor.zakreslacz', 'wzor-zakreslacz', 'highlighter')}
        <PrzyciskSymbolu symbol="ellipsis" etykieta={t('wzor.menu_a11y')} onPress={() => ustawMenu('opcje')} testID="wzor-menu" />
      </View>
    </View>
  );

  const wzor = (
    <View style={st.wzor}>
      {pasekNawigacji}
      {ipad && !s.word && (
        // iPad (regular): stały pasek narzędzi pod paskiem nawigacji (W5a)
        <View style={st.pasekNarzedzi}>
          {narzedzie('zakreslacz', 'wzor.zakreslacz', 'wzor-zakreslacz', 'highlighter')}{narzedzie('pioro', 'wzor.pioro', 'wzor-pioro', 'pencil.tip')}{narzedzie('gumka', 'wzor.gumka', 'wzor-gumka', 'eraser')}{cofnij}
        </View>
      )}
      {s.word && <Text style={[st.tresc, st.informacja]} accessibilityRole="text">{t('wzor.word_podglad')}</Text>}
      {s.wskazowka && !bezWskazowki && !ustawiam && !tryb && notatka !== 'pasek' && podpowiedz !== 'widac' && (
        <Text style={[st.tresc, st.informacja]} testID="wzor-wskazowka-znacznika" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{t('wzor.wskazowka_znacznika')}</Text>
      )}
      {notatka === 'pasek' && (
        <View style={st.informacja} accessibilityRole="summary">
          <Text style={st.tresc}>{t('wzor.notatka_bez_znacznika')}</Text>
          <Text style={st.podpis}>{t('wzor.notatka_zaznacz')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('wzor.zaznacz_rzad')} testID="wzor-notatka-zaznacz" style={st.pozycja}
            onPress={() => { ustawNotatke('brak'); ustawNotatkaPo(true); zaznacz(); }}>
            <Text style={[st.tresc, st.pogrubiony]}>{t('wzor.zaznacz_rzad')}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t('wspolne.anuluj')} onPress={() => ustawNotatke('brak')} style={st.pozycja}>
            <Text style={st.tresc}>{t('wspolne.anuluj')}</Text>
          </Pressable>
        </View>
      )}
      {notatka === 'arkusz' && (
        <View style={st.informacja}>
          <Text style={st.tresc} accessibilityRole="header">{t('licznik.notatka')}</Text>
          <TextInput accessibilityLabel={t('licznik.notatka')} value={tekst} onChangeText={ustawTekst} testID="wzor-notatka-pole" multiline style={[st.tresc, st.pole]} />
          <Pressable accessibilityRole="button" accessibilityLabel={t('wspolne.zapisz')} style={st.pozycja}
            onPress={() => { if (tekst.trim()) p.naNotatka?.(tekst.trim()); ustawTekst(''); ustawNotatke('brak'); }}>
            <Text style={[st.tresc, st.pogrubiony]}>{t('wspolne.zapisz')}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t('wspolne.anuluj')} style={st.pozycja} onPress={() => {
            const zamknijNowa = () => { ustawTekst(''); ustawNotatke('brak'); };
            if (tekst.trim()) pytajOdrzucZmiany(t, 'nowy', zamknijNowa); else zamknijNowa(); // M1-121: wpisana nowa notatka nie znika bez pytania
          }}>
            <Text style={st.tresc}>{t('wspolne.anuluj')}</Text>
          </Pressable>
        </View>
      )}
      <ArkuszNotatekWzoru t={t} chipy={p.chipy} otwartyChip={p.otwartyChip} naChip={p.naChip} naZmienNotatke={p.naZmienNotatke} naUsunNotatke={p.naUsunNotatke} potwierdz={p.potwierdz} naBlad={() => ustawBlad(true)} />
      {(pytanie !== 'brak' || p.oczekujacePrzytrzymanie) && (
        <PytanieKierunku t={t} naWybor={(kier) => {
          const rodzaj = pytanie;
          ustawPytanie('brak');
          if (rodzaj === 'zaznacz') znacznikUstawiony(kier);
          else if (rodzaj === 'zmien') p.naZmienKierunek?.(kier);
          else { ustawUstawianie(true); p.naKierunekPrzytrzymania?.(kier); }
        }} naNieTeraz={() => { ustawPytanie('brak'); p.naNieTerazPrzytrzymania?.(); }} />
      )}
      <PasekZnacznika t={t} znacznik={p.znacznik ?? null} ustawianie={ustawianie} razemStron={p.razemStron ?? 0} naGotowe={() => ustawUstawianie(false)} naKrok={(d) => p.naKrokRzaduZnacznika?.(d)}
        naZmienKierunek={() => ustawPytanie('zmien')} naNastepnaStrona={() => { ustawUstawianie(true); p.naNastepnaStrona?.(); }} naPrzestaw={() => ustawUstawianie(true)} />
      {!s.word && <Text style={st.podpis} testID="wzor-zakreslenia">{t('wzor.zakreslenia', { count: s.zakreslenia })}</Text>}
      {tryb && !ipad && <Text style={st.podpis}>{t('wzor.zakreslacz_podpowiedz')}</Text>}
      <View style={[st.strona, ipad && !obok && st.stronaIpad]} testID="wzor-widok">
        {p.widok}
        {s.strona && (
          <Text style={st.plakietka} accessibilityLabel={t('wzor.strona_a11y', { n: s.strona.n, razem: s.strona.razem })} testID="wzor-strona">
            {t('wzor.strona_z', { n: s.strona.n, razem: s.strona.razem })}
          </Text>
        )}
        {podpowiedz === 'widac' && <Text role="status" accessibilityLiveRegion="polite" style={[st.plakietka, st.podpowiedz]}>{t('wzor.rysik_podpowiedz')}</Text>}
      </View>
    </View>
  );

  const licznik = (
    <LicznikWzoru t={t} licznik={s.licznik} jezyk={s.jezyk} obok={obok} szerokoscKolumny={s.uklad.kolumnaLicznika} blad={blad} naOferty={p.naOferty}
      naPlus={() => void licz(p.naPlus)} naMinus={() => void licz(p.naMinus)} />
  );

  return (
    <View style={[st.ekran, obok && st.obok]} onMagicTap={() => void licz(p.naPlus)}>{/* Magic Tap = +1 (design-spec :668, jak licznik) */}
      {wzor}
      {licznik}
      {menu === 'opcje' && (
        <Menu st={st} zamknij={() => ustawMenu('brak')}>
          <Pozycja st={st} tekst={t('wzor.obroc')} id="wzor-obroc" onPress={() => { ustawMenu('brak'); p.naObroc(); }} />
          <Pozycja st={st} tekst={t('wzor.zmien_nazwe')} id="wzor-zmien-nazwe" onPress={() => { ustawMenu('brak'); p.naZmienNazwe(); }} />
          <Pozycja st={st} tekst={t('wzor.usun')} id="wzor-usun" niszczaca onPress={() => {
            ustawMenu('brak');
            p.potwierdz(t('wzor.usun_tytul', { nazwa: s.nazwa }), t('wzor.usun_opis', { data: p.terminKosza ?? '' }), t('wzor.usun_potwierdz'), p.naUsun);
          }} />
        </Menu>
      )}
      {menu === 'wzory' && <MenuWzorow st={st} t={t} wzory={s.wzory} oczekujace={czekajace} wzorId={s.wzorId} zamknij={() => ustawMenu('brak')} naWybor={(id) => { ustawMenu('brak'); if (id !== s.wzorId) p.naPrzelacz(id); }}
        naUsunOczekujacy={(id) => { if (s.wzory.length < 2 && czekajace.length <= 1) ustawMenu('brak'); p.naUsunOczekujacy?.(id); }} />}
    </View>
  );
}

type Style = ReturnType<typeof style>;
function style(k: Kolory) {
  return StyleSheet.create({
    ekran: { flex: 1, backgroundColor: k.wzorRama }, // ZM-10: rama w barwie motywu (`wzorRama`), strona w oryginalnych kolorach pliku
    obok: { flexDirection: 'row' },
    wzor: { flex: 1 },
    pasek: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: odstep.s, minHeight: rozmiary.minimum, flexWrap: 'wrap' },
    pasekNarzedzi: { flexDirection: 'row', gap: odstep.s, paddingHorizontal: odstep.l, minHeight: rozmiary.minimum, alignItems: 'center' },
    grupa: { flexDirection: 'row', alignItems: 'center' },
    tytulPaska: { flex: 1, minWidth: 120 },
    przelacz: { minHeight: rozmiary.minimum, justifyContent: 'center' }, // cel dotyku przełącznika wzorów w tytule (M1-175, SP-06; TT-16)
    ikona: { minWidth: rozmiary.minimum, minHeight: rozmiary.minimum, alignItems: 'center', justifyContent: 'center', borderRadius: promien.przyciskDrugi },
    wybrane: { backgroundColor: k.papierGrupa, borderWidth: 2, borderColor: k.przyciskObrys, borderRadius: promien.pole }, // stan wybranego narzędzia niesie kształt, nie kolor (10 C, P-360)
    tytul: { ...typografia.instrukcja, color: k.grafit },
    tresc: { ...typografia.tresc, color: k.grafit },
    podpis: { ...typografia.podpis, color: k.olowek, paddingHorizontal: odstep.l },
    pogrubiony: { fontWeight: '700' },
    informacja: { padding: odstep.m, marginHorizontal: odstep.l, borderRadius: promien.grupa, backgroundColor: k.papierGrupa },
    strona: { flex: 1, backgroundColor: k.wzorRama },
    stronaIpad: { alignSelf: 'center', width: '100%', maxWidth: KOLUMNA_TRESCI_MAKS }, // kolumna strony iPada maks. 640 pt (W4b, design-spec:683); ta sama stała co kolumna treści G1 (Bezpieczny)
    podpowiedz: { top: odstep.m, bottom: undefined }, // makieta ipad-rysik: nad stroną, nie na plakietce strony
    plakietka: { ...typografia.podpis, color: k.grafit, alignSelf: 'center', position: 'absolute', bottom: odstep.m, paddingHorizontal: odstep.m, borderRadius: promien.grupa, backgroundColor: k.papier },
    menuTlo: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end' },
    menu: { maxHeight: '60%', margin: odstep.l, borderRadius: promien.grupa, backgroundColor: k.arkusz },
    pozycja: { minHeight: rozmiary.minimum, justifyContent: 'center', paddingHorizontal: odstep.l, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
    niszczaca: { color: k.blad },
    pole: { minHeight: rozmiary.minimum, borderRadius: promien.pole, backgroundColor: k.papier, padding: odstep.s },
  });
}
