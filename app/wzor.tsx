// Trasa „/wzor”: przeglądarka wzoru bieżącego projektu (design-spec „Wzór, rysik i iPad”; P-220 W1a–W9b; moduly.md „Kontrakt partii 6”).
// Bez wzoru: grupa „Add pattern” (W7a, subflow otworz-wzor-pdf). Widok strony = moduł natywny `oczko-wzor` (WidokWzoru); build bez modułu: pusta strona.
// Pasek licznika woła te same usługi co licznik (+1/−1), więc znacznik idzie z licznikiem (BR-WZR-003). Ostatni wzór w `ostatnie_miejsce` (P-246).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View, useWindowDimensions } from 'react-native';
import { Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import type { UchwytWidokuWzoru } from '../modules/oczko-wzor';
import { ukladOkna } from '../src/domena/uklad';
import { domyslnyRzadBazowy, gornaKrawedzNaNastepnejStronie, gornaKrawedzRzedu, rzadPoPrzeniesieniu } from '../src/domena/znacznik-wzoru';
import { narzedzieDlaKlasy, politykaPlotna, poDotyku, type Narzedzie } from '../src/domena/rysik';
import { ArkuszLinku, ArkuszNazwyWzoru, GrupaWzorow } from '../src/ekrany/WzorGrupa';
import { PrzegladarkaWzoru } from '../src/ekrany/WzorPrzegladarka';
import { tekstBleduZapisu } from '../src/ekrany/WzorLicznik';
import type { WynikEkranu } from '../src/ekrany/wspolne';
import type { Wynik } from '../src/domena/bledy';
import { StanWczytywania } from '../src/ekrany/StanWczytywania';
import { akcjeWzoru } from '../src/ekrany/WzorAkcje';
import { pytajOdrzucZmiany } from '../src/ekrany/pytanie-odrzucenia';
import { widokNatywnyWzoru } from '../src/ekrany/WzorWidokNatywny';
import { odstep, useKolory } from '../src/ekrany/motyw';
import { Bezpieczny } from '../src/kompozycja/Bezpieczny';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { zapisano, zglosBladZapisu } from '../src/kompozycja/po-zapisie';
import { oglos } from '../src/kompozycja/system';
import { krotkaData } from '../src/kompozycja/projekt';
import { dodajZrodlo, type ZrodloDodaniaTrasy } from '../src/kompozycja/wzor-import-trasy';
import { ostrzezenieMiejsca, wyjscieZWzoru } from '../src/kompozycja/wzor-rysunki';
import { paneleE2e, szerokoscOknaE2e } from '../src/platforma/tryb-e2e';
import { listaWzorow, wzorDoOtwarcia, zapamietajWzor, ustawZnacznik, zmienNazweWzoru } from '../src/przypadki-uzycia/wzor';
import { odzyskajRysunki, widokWzoru, type WidokWzoru } from '../src/przypadki-uzycia/wzor-widok';
import { zapamietajLicznik, type WidokLicznika } from '../src/przypadki-uzycia/widok-licznika';
import { KOSZ_DNI } from '../src/konfiguracja';

const RODZAJ: Record<string, 'wzor.rodzaj_pdf' | 'wzor.rodzaj_zdjecie' | 'wzor.rodzaj_strona' | 'wzor.rodzaj_word'> = { pdf: 'wzor.rodzaj_pdf', obraz: 'wzor.rodzaj_zdjecie', www: 'wzor.rodzaj_strona', word: 'wzor.rodzaj_word' };

export default function EkranWzoru(): React.ReactElement {
  const aplikacja = useAplikacja();
  const { kontener, licznik } = aplikacja;
  const router = useRouter();
  const navigation = useNavigation();
  const k = useKolory();
  const okno = useWindowDimensions();
  const szerokosc = szerokoscOknaE2e() ?? okno.width;
  const uklad = ukladOkna({ szerokosc, wysokosc: okno.height });
  const { id, dodaj: dodajParam } = useLocalSearchParams<{ id?: string; dodaj?: string }>();
  const { t } = kontener.j;
  const zw = kontener.wzor.z;
  const [lw, ustawLw] = useState<WidokLicznika | null>(null);
  const [wzory, ustawWzory] = useState<{ wzorId: string; nazwa: string }[] | null>(null);
  const [widok, ustawWidok] = useState<WidokWzoru | null>(null);
  const [narzedzie, ustawNarzedzie] = useState<Narzedzie>('brak');
  const [rysik, ustawRysik] = useState({ tylkoRysik: false });
  useEffect(() => { ustawNarzedzie((n) => narzedzieDlaKlasy(n, uklad.klasa)); }, [uklad.klasa]); // zmiana szerokości okna: wybrany Pen → Highlighter w compact (P-360, 10 C)
  const [strona, ustawStrone] = useState<{ n: number; razem: number } | null>(null);
  const [zakreslenia, ustawZakreslenia] = useState(0);
  const [cofnij, ustawCofnij] = useState(0);
  const [link, ustawLink] = useState(false);
  const [arkuszNazwy, ustawArkuszNazwy] = useState(false); // ••• → „Rename” (W1a)
  const poczatek = useRef<{ wzorId: string; strona: number; powiekszenie: number } | null>(null); // pozycja zapisana w chwili otwarcia wzoru (BR-PRJ-011 S1); powiększenie 0 = dopasowany
  const kolejkaKrokow = useRef<Promise<void>>(Promise.resolve()); // kroki rzędu znacznika jeden po drugim (każdy czyta świeży stan)
  const [przytrzymanie, ustawPrzytrzymanie] = useState<{ strona: number; y: number } | null>(null); // przytrzymanie bez znacznika czeka na kierunek (3a)
  const [otwartyChip, ustawOtwartyChip] = useState<number | null>(null); // rząd licznika chipu notatki otwartego stuknięciem (F-56)
  const [importWToku, ustawImport] = useState<string | null>(null); // W11: wiersz „import w toku” w czasie konwersji
  const [linkAdres, ustawLinkAdres] = useState(''); // adres wpisany w arkuszu linku; wraca do pola, gdy zlecenia „czeka na sieć” nie da się zapisać (ADR-0031 pkt 3)
  const [czekaSiec, ustawCzekaSiec] = useState(() => kontener.wzor.k.stan().czekaSiec); // strony WWW czekające na sieć (design-spec :660)
  useEffect(() => { const odswiez = () => ustawCzekaSiec(kontener.wzor.k.stan().czekaSiec); odswiez(); return kontener.wzor.k.naZmiane(odswiez); }, [kontener]);
  // Poz. 12 C: gdy strona przestaje czekać (zapisała się po powrocie sieci albo użytkowniczka ją usunęła), lista wzorów otwartego wzoru się odświeża — nowy wzór pojawia się
  // w ▾ bez ogłoszenia. Otwarty wzór zostaje ten sam; bez otwartego wzoru (grupa na ekranie projektu) nic się nie przełącza.
  const otwartyWzor = useRef<string | undefined>(undefined);
  const liczbaCzekajacych = useRef(czekaSiec.length);
  const [blad, ustawBlad] = useState(false); // M1-007: pierwszy odczyt bez widoku licznika albo z wyjątkiem → błąd z „Try again”, nie pusta plansza

  const katalogRysunkow = `${kontener.z.katalogi.tymczasowy}/rysunki-wzoru`;
  const wczytaj = useCallback(async (wybrany?: string) => {
    const w = await licznik.widok();
    ustawLw(w);
    if (!w) { ustawBlad(true); return; } // M1-007: widok licznika nieodczytany
    const l = await listaWzorow(zw, { projektId: w.projektId });
    ustawWzory(l.ok ? l.wartosc.map((x) => ({ wzorId: x.wzorId, nazwa: x.nazwa })) : []);
    const cel = wybrany ?? (await wzorDoOtwarcia(zw, { projektId: w.projektId }));
    const wzorId = typeof cel === 'string' ? cel : cel.ok ? cel.wartosc : null;
    if (!wzorId) { ustawWidok(null); return; }
    const v = await widokWzoru(zw, { wzorId, katalogOczekujacych: katalogRysunkow }); // M1-084: strona z plikiem oczekującym → ten plik
    if (v.ok && poczatek.current?.wzorId !== wzorId) { // wzór otwarty albo przełączony: zapisana pozycja tego wzoru, strona z poprzedniego wzoru nie przechodzi
      poczatek.current = { wzorId, strona: v.wartosc.miejsce?.strona ?? 0, powiekszenie: v.wartosc.miejsce?.powiekszenie ?? 0 };
      ustawStrone(null);
    }
    ustawWidok(v.ok ? v.wartosc : null);
    if (v.ok) await zapamietajWzor(zw, { licznikId: w.licznikId, wzorId });
  }, [licznik, zw, katalogRysunkow]);
  // Odzysk kresek zapisanych przy poprzednim zamknięciu ekranu (zdarzenie bez odbiorcy), potem wczytanie (przegląd 2026-10-26).
  const pierwszyOdczyt = useCallback(() => { void wczytaj(id).catch(() => ustawBlad(true)); }, [wczytaj, id]); // M1-007: wyjątek odczytu → stan błędu
  // M1-084: nieudany zapis rysunku → komunikat raz, do następnego udanego zapisu (zapis idzie po każdej przerwie w rysowaniu, alert przy każdej kresce
  // przerywałby pracę); plik oczekujący zostaje i wraca przy następnym otwarciu (`odzyskajRysunki`).
  const bladRysunku = useRef(false);
  const uchwytWidoku = useRef<UchwytWidokuWzoru | null>(null); // M1-112: zapis na żądanie przed decyzją „Wstecz”
  const poZapisieRysunku = useCallback((r: Wynik<unknown>, oczekujace = 0) => {
    if (r.ok) { if (oczekujace === 0) bladRysunku.current = false; return; }
    if (!bladRysunku.current) bladRysunku.current = zglosBladZapisu(aplikacja, r.powod, 'rysunek'); // M1-102: kreski czekają w pliku
  }, [aplikacja]);
  // M1-084 (DEC-31 a): widok natywny nie zapisał pliku rysunku (`onBladZapisu`), kreski czekają w jego pamięci → alert jak wyżej, „Wstecz” pyta,
  // gest wstecz wyłączony; `onRysunek` z `oczekujace` 0 zdejmuje blokadę. null = na tym ekranie nie było błędu natywnego (opcje ekranu bez zmian).
  const [niezapisane, ustawNiezapisane] = useState<boolean | null>(null);
  const miejsceSprawdzone = useRef(false); // DEC-31 b: raz na otwarcie ekranu, przy pierwszym wzorze
  useEffect(() => { void odzyskajRysunki(zw, { katalog: katalogRysunkow }).then(poZapisieRysunku).finally(pierwszyOdczyt); setRysikOtwarcie(); }, [pierwszyOdczyt, zw, katalogRysunkow, poZapisieRysunku]);
  useEffect(() => {
    if (czekaSiec.length < liczbaCzekajacych.current && otwartyWzor.current) void wczytaj(otwartyWzor.current);
    liczbaCzekajacych.current = czekaSiec.length;
  }, [czekaSiec, wczytaj]);
  const [dodano, ustawDodano] = useState(false); // „Add pattern” z ekranu projektu: źródło od razu, raz (W7a)
  useEffect(() => {
    if (!lw || dodano || !dodajParam || !['plik', 'skan', 'zdjecia', 'link'].includes(dodajParam)) return;
    ustawDodano(true);
    void dodaj(dodajParam as ZrodloDodaniaTrasy);
  }, [lw, dodano, dodajParam]);
  // Wyjście z ekranu wzoru: miejsce pracy wraca na licznik (pozycja wzoru zostaje); zamknięcie aplikacji na wzorze zostawia ekran wzoru, więc start otworzy wzór (07-jakosc-006).
  useEffect(() => {
    if (!widok || miejsceSprawdzone.current) return;
    miejsceSprawdzone.current = true;
    // M1-110: pokazane ostrzeżenie liczy się jak alert rysunku (do udanego zapisu) — `onBladZapisu` z kolejki widoku nie dokłada drugiego.
    void ostrzezenieMiejsca(zw.magazyn, t, () => !bladRysunku.current).then((p) => { if (p) bladRysunku.current = true; });
  }, [widok, zw, t]);
  useEffect(() => () => { const idLicznika = licznik.biezacy(); if (idLicznika) void zapamietajLicznik(kontener.z, { licznikId: idLicznika }); }, [licznik, kontener]);
  // M1-141 (08-programista-519, 04-studio-projektowe-530; DEC-31 a): przycisk „Back” i gest wstecz mają jedną ścieżkę wyjścia. M1-112: onBladZapisu z zapisu
  // przy wyjściu nie dokłada alertu do pytania (jeden alert, jak M1-110); bez pytania stan wraca. `zwolniony`: decyzja zapadła, kolejne usunięcie bez pytania.
  const zwolniony = useRef(false);
  const nowaNotatka = useRef(false); // arkusz nowej notatki z tekstem (WzorPrzegladarka) — gest pyta „Discard changes?” jak „Back”
  function wyjdzZWzoru(dokoncz: () => void): void {
    const byl = bladRysunku.current; const u = uchwytWidoku.current; bladRysunku.current = true;
    void wyjscieZWzoru(t, niezapisane === true, () => { zwolniony.current = true; dokoncz(); }, u ? () => u.zapiszRysunki() : null).then((pytal) => { if (!pytal) bladRysunku.current = byl; });
  }
  // Gest (i każde usunięcie ekranu z zewnątrz) zatrzymany, dopóki widać wzór: najpierw zapis kresek na żądanie, potem decyzja jak przy „Back” (native stack:
  // `preventNativeDismiss`; zachowanie gestu do sprawdzenia na urządzeniu). Gest dalej wyłączony przy znanych niezapisanych kreskach (M1-084).
  usePreventRemove(widok !== null, ({ data }) => {
    const dokoncz = () => navigation.dispatch(data.action);
    if (zwolniony.current) { dokoncz(); return; }
    if (nowaNotatka.current) pytajOdrzucZmiany(t, 'nowy', () => wyjdzZWzoru(dokoncz)); else wyjdzZWzoru(dokoncz);
  });
  function setRysikOtwarcie() { ustawRysik((s) => poDotyku(s, 'otwarcie')); }

  async function dodaj(zrodlo: ZrodloDodaniaTrasy): Promise<void> {
    if (!lw) return;
    await dodajZrodlo({ kontener, lw, dodajParam, wczytaj, wstecz: () => router.back(), ustawImport, ustawLink, ustawLinkAdres }, zrodlo);
  }
  /** M1-004: nieudany zapis +1/−1 z paska pod wzorem — haptyka `bladZapisu` (przy włączonych wibracjach) i jedno ogłoszenie tekstu alertu
   *  paska, jak na ekranie licznika; `limit` i `zablokowany` to nie błąd zapisu (bez zmian). Alert pod liczbą ustawia ekran (`blad`). */
  function bladLicznika(r: WynikEkranu<unknown>): void {
    if (r.ok || r.powod === 'limit' || r.powod === 'zablokowany') return;
    if (aplikacja.preferencje.stan().wibracje) kontener.porty.haptyka.zagraj('bladZapisu');
    oglos(tekstBleduZapisu(t));
  }

  // Dokument dla widoku natywnego: nowy obiekt tylko przy zmianie wzoru albo obrotów — +1 nie wysyła ponownie rysunków (przegląd 2026-10-26).
  otwartyWzor.current = widok?.wzorId;
  const obrotyKlucz = widok ? JSON.stringify(widok.obroty) : '';
  const dokument = useMemo(() => (widok && widok.plikPdf ? {
    wzorId: widok.wzorId, plikPdf: widok.plikPdf, rysunki: widok.rysunki,
    obroty: Object.entries(widok.obroty).map(([k, v]) => ({ strona: Number(k), kat: v })),
    startStrona: poczatek.current?.wzorId === widok.wzorId ? poczatek.current.strona : 0, startPowiekszenie: poczatek.current?.wzorId === widok.wzorId ? poczatek.current.powiekszenie : 0,
  } : null), [widok?.wzorId, widok?.plikPdf, obrotyKlucz]); // eslint-disable-line react-hooks/exhaustive-deps -- rysunki tylko przy zmianie wzoru
  if (link) return <Bezpieczny><ArkuszLinku t={t} poczatek={linkAdres} naAnuluj={() => { ustawLink(false); ustawLinkAdres(''); }} naWklej={() => kontener.wzor.platforma.wklej()} naZapisz={(adres) => { ustawLink(false); ustawLinkAdres(''); void dodaj({ rodzaj: 'adres', adres }); }} /></Bezpieczny>;
  if (!lw || !wzory) return <Bezpieczny><StanWczytywania wyjscie={{ rodzaj: 'wstecz', naWyjdz: () => router.back() }} stan={blad ? 'blad' : 'ladowanie'} t={t} przedrostek="wzor" naPonow={() => { ustawBlad(false); pierwszyOdczyt(); }} /></Bezpieczny>;
  if (arkuszNazwy && widok) return (
    <Bezpieczny><ArkuszNazwyWzoru t={t} nazwa={widok.nazwa} naAnuluj={() => ustawArkuszNazwy(false)}
      naZapisz={(n) => void zmienNazweWzoru(zw, { wzorId: widok.wzorId, nazwa: n }).then(async (r) => { if (zapisano(aplikacja, r)) { ustawArkuszNazwy(false); await wczytaj(widok.wzorId); } })} /></Bezpieczny> // M1-006: błąd → alert, arkusz zostaje
  );
  if (!widok) {
    return (
      <Bezpieczny>
        <View style={{ flex: 1, padding: odstep.l, backgroundColor: k.papier }}>
          <GrupaWzorow wzory={[]} oczekujace={[...(importWToku ? [{ id: 'import', nazwa: importWToku, stan: 'import' as const }] : []), ...czekaSiec.filter((x) => x.projektId === lw.projektId).map((x) => ({ id: x.id, nazwa: x.nazwa, stan: 'siec' as const }))]} skaner={kontener.wzor.platforma.skanerDostepny()} t={t} naOtworz={(w) => void wczytaj(w)} naDodaj={(z) => void dodaj(z)} naUsunOczekujacy={(zid) => void kontener.wzor.k.potwierdzBlad(zid)}
            panelE2e={paneleE2e ? <paneleE2e.PanelWzoru katalogTymczasowy={kontener.z.katalogi.tymczasowy} naDodaj={(w) => void dodaj({ rodzaj: 'gotowe', ...w })} /> : null} />
        </View>
      </Bezpieczny>
    );
  }
  const polityka = politykaPlotna({ narzedzie, tylkoRysik: rysik.tylkoRysik });
  const zn = widok.znacznik;
  const plikPdf = widok.plikPdf;
  const WYSOKOSC_RZEDU_DOMYSLNA = 0.02;
  const postaw = (w: { strona: number; y: number; rzadBazowy: number; kierunek: 1 | -1; wysokoscRzedu?: number }) => ustawZnacznik(zw, { wzorId: widok.wzorId, licznikId: lw.licznikId, ...w, wysokoscRzedu: w.wysokoscRzedu ?? zn?.wysokosc ?? WYSOKOSC_RZEDU_DOMYSLNA }).then((r) => { zapisano(aplikacja, r); return wczytaj(widok.wzorId); }); // M1-085: błąd → alert, znacznik wraca na zapisane miejsce
  const nastepnaStrona = zn ? (strona?.razem ?? 0) > zn.strona + 1 : false;
  const gdzieZnacznik = zn ? { strona: zn.strona, y: zn.y, rzadBazowy: Math.max(1, zn.rzad), kierunek: zn.kierunek } : null;
  const przejdzNaNastepna = () => { if (!zn || !gdzieZnacznik) return; ustawStrone(strona ? { ...strona, n: zn.strona + 2 } : null); void postaw({ ...gdzieZnacznik, strona: zn.strona + 1, y: gornaKrawedzNaNastepnejStronie(zn.kierunek, zn.wysokosc) }); };
  const chipy = widok.notatki;
  const natywny = widokNatywnyWzoru({ t, aplikacja, zw, widok, lw, dokument, uchwyt: uchwytWidoku, katalogRysunkow, strona, startStrona: poczatek.current?.strona ?? 0, nastepnaStrona, narzedzie, polityka, cofnij, uklad, tylkoRysik: rysik.tylkoRysik,
    bladRysunku, ustawOtwartyChip, ustawNiezapisane, ustawStrone, ustawZakreslenia, ustawNarzedzie, ustawRysik, ustawPrzytrzymanie, poZapisieRysunku, przejdzNaNastepna, postaw });
  const oczekujace = czekaSiec.filter((x) => x.projektId === lw.projektId).map((x) => ({ id: x.id, nazwa: x.nazwa }));
  const liczba = lw.znaczenie === 'w_trakcie' ? lw.wartosc + 1 : lw.wartosc;
  const strony = strona?.razem ?? 0;
  return (
    <Bezpieczny pelnaSzerokosc>
      {niezapisane !== null ? <Stack.Screen options={{ gestureEnabled: !niezapisane }} /> : null}
      <PrzegladarkaWzoru
        stan={{ nazwa: widok.nazwa, opis: t('wzor.wiersz_opis', { rodzaj: t(RODZAJ[widok.zrodlo] ?? 'wzor.rodzaj_pdf'), strony: t('wzor.strony', { count: strony }) }), czesc: lw.czesc.nazwa,
          wzory, oczekujace, wzorId: widok.wzorId, strona, zakreslenia, narzedzie, word: plikPdf === null, kierunek: zn?.kierunek ?? null, licznik: { liczba, dziergany: lw.wartosc + 1, znaczenie: lw.znaczenie }, uklad }}
        t={t} widok={natywny}
        terminKosza={krotkaData(dodajDni(zw.zegar.teraz().dzien, KOSZ_DNI), kontener.j.jezyk())}
        naWstecz={() => wyjdzZWzoru(() => router.back())}
        naNowaNotatka={(jest) => { nowaNotatka.current = jest; }}
        naPrzelacz={(w) => void wczytaj(w)}
        naUsunOczekujacy={(zid) => void kontener.wzor.k.potwierdzBlad(zid)}
        naNarzedzie={ustawNarzedzie}
        naCofnij={() => ustawCofnij((n) => n + 1)}
        chipy={chipy} otwartyChip={otwartyChip} naChip={ustawOtwartyChip} {...akcjeWzoru({ aplikacja, zw, widok, lw, strona, wczytaj })}
        naZaznaczRzad={(kierunek) => void postaw({ strona: strona ? strona.n - 1 : 0, y: gornaKrawedzRzedu(0.5, zn?.wysokosc ?? WYSOKOSC_RZEDU_DOMYSLNA), rzadBazowy: rzadPoPrzeniesieniu(zn, domyslnyRzadBazowy(lw.wartosc)), kierunek })}
        znacznik={zn ? { strona: zn.strona, rzad: zn.rzad, kierunek: zn.kierunek, pozaStrona: zn.pozaStrona, przedSchematem: zn.przedSchematem } : null} razemStron={strona?.razem}
        oczekujacePrzytrzymanie={przytrzymanie !== null}
        naKierunekPrzytrzymania={(kierunek) => { const g = przytrzymanie; ustawPrzytrzymanie(null); if (g) void postaw({ strona: g.strona, y: gornaKrawedzRzedu(g.y, WYSOKOSC_RZEDU_DOMYSLNA), rzadBazowy: rzadPoPrzeniesieniu(null, domyslnyRzadBazowy(lw.wartosc)), kierunek }); }}
        naZmienKierunek={(kierunek) => { if (gdzieZnacznik) void postaw({ ...gdzieZnacznik, kierunek }); }}
        naKrokRzaduZnacznika={(delta) => {
          kolejkaKrokow.current = kolejkaKrokow.current.then(async () => {
            const v = await widokWzoru(zw, { wzorId: widok.wzorId, katalogOczekujacych: katalogRysunkow });
            const z = v.ok ? v.wartosc.znacznik : null;
            if (z) await postaw({ strona: z.strona, y: z.y, kierunek: z.kierunek, rzadBazowy: Math.max(1, Math.max(1, z.rzad) + delta) });
          });
        }}
        naNastepnaStrona={przejdzNaNastepna}
        naZmienNazwe={() => ustawArkuszNazwy(true)}
        tylkoRysik={rysik.tylkoRysik}
        potwierdz={(tytul, opis, przycisk, f) => Alert.alert(tytul, opis, [{ text: t('wspolne.anuluj'), style: 'cancel' }, { text: przycisk, style: 'destructive', onPress: f }])}
        naPlus={async () => { const r = await licznik.uslugi.dodajRzad(); bladLicznika(r); await wczytaj(widok.wzorId); return r.ok ? { ok: true, wartosc: undefined } : r; }}
        naMinus={async () => { const r = licznik.dzialania.naMinus ? await licznik.dzialania.naMinus() : { ok: false as const, powod: 'zapis' as const }; bladLicznika(r); await wczytaj(widok.wzorId); return r; }}
      />
    </Bezpieczny>
  );
}
const dodajDni = (dzien: string, n: number): string => { const [r, m, d] = dzien.split('-').map(Number); return new Date(Date.UTC(r, m - 1, d + n)).toISOString().slice(0, 10); };
