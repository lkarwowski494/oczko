// Trasa „/wzor”: przeglądarka wzoru bieżącego projektu (design-spec „Wzór, rysik i iPad”; P-220 W1a–W9b; moduly.md „Kontrakt partii 6”).
// Bez wzoru: grupa „Add pattern” (W7a, subflow otworz-wzor-pdf). Widok strony = moduł natywny `oczko-wzor` (WidokWzoru); build bez modułu: pusta strona.
// Pasek licznika woła te same usługi co licznik (+1/−1), więc znacznik idzie z licznikiem (BR-WZR-003). Ostatni wzór w `ostatnie_miejsce` (P-246).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WidokWzoruNatywny } from '../modules/oczko-wzor';
import { rodzajPliku } from '../src/domena/rodzaj-pliku';
import { ukladOkna } from '../src/domena/uklad';
import { domyslnyRzadBazowy, gornaKrawedzNaNastepnejStronie, gornaKrawedzRzedu, krokZnacznika, rzadPoPrzeniesieniu } from '../src/domena/znacznik-wzoru';
import { narzedzieDlaKlasy, narzedzieRysika, politykaPlotna, poDotyku, poPierwszymRysiku, type Narzedzie } from '../src/domena/rysik';
import { ArkuszLinku, ArkuszNazwyWzoru, GrupaWzorow, type ZrodloDodaniaEkranu } from '../src/ekrany/WzorGrupa';
import { PrzegladarkaWzoru } from '../src/ekrany/WzorPrzegladarka';
import { tekstBleduZapisu } from '../src/ekrany/WzorLicznik';
import type { WynikEkranu } from '../src/ekrany/wspolne';
import { StanWczytywania } from '../src/ekrany/StanWczytywania';
import { useKolory } from '../src/ekrany/motyw';
import { Bezpieczny } from '../src/kompozycja/Bezpieczny';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { zapisano } from '../src/kompozycja/po-zapisie';
import { oglos } from '../src/kompozycja/system';
import { krotkaData } from '../src/kompozycja/projekt';
import { alertImportu, alertSkanu, nazwaDomyslna } from '../src/kompozycja/wzor-dodawanie';
import { wybierzPlikWzoru } from '../src/platforma/system-plikow-uzytkownika';
import { paneleE2e, szerokoscOknaE2e } from '../src/platforma/tryb-e2e';
import { wybieraczZdjec } from '../src/platforma/zdjecia';
import { dodajNotatkeWzoru, dodajWzor, listaWzorow, usunNotatkeWzoru, usunWzor, zmienNotatkeWzoru, wzorDoOtwarcia, zapamietajWzor, zapiszRysunek, ustawZnacznik, zmienNazweWzoru, type ZrodloDodania } from '../src/przypadki-uzycia/wzor';
import { odzyskajRysunki, ustawObrot, widokWzoru, type WidokWzoru } from '../src/przypadki-uzycia/wzor-widok';
import { zapamietajLicznik, type WidokLicznika } from '../src/przypadki-uzycia/widok-licznika';
import { zapamietajPozycjeWzoru } from '../src/przypadki-uzycia/wzor-miejsce';
import { KOSZ_DNI } from '../src/konfiguracja';

const RODZAJ: Record<string, 'wzor.rodzaj_pdf' | 'wzor.rodzaj_zdjecie' | 'wzor.rodzaj_strona' | 'wzor.rodzaj_word'> = { pdf: 'wzor.rodzaj_pdf', obraz: 'wzor.rodzaj_zdjecie', www: 'wzor.rodzaj_strona', word: 'wzor.rodzaj_word' };

export default function EkranWzoru(): React.ReactElement {
  const aplikacja = useAplikacja();
  const { kontener, licznik } = aplikacja;
  const router = useRouter();
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

  const wczytaj = useCallback(async (wybrany?: string) => {
    const w = await licznik.widok();
    ustawLw(w);
    if (!w) { ustawBlad(true); return; } // M1-007: widok licznika nieodczytany
    const l = await listaWzorow(zw, { projektId: w.projektId });
    ustawWzory(l.ok ? l.wartosc.map((x) => ({ wzorId: x.wzorId, nazwa: x.nazwa })) : []);
    const cel = wybrany ?? (await wzorDoOtwarcia(zw, { projektId: w.projektId }));
    const wzorId = typeof cel === 'string' ? cel : cel.ok ? cel.wartosc : null;
    if (!wzorId) { ustawWidok(null); return; }
    const v = await widokWzoru(zw, { wzorId });
    if (v.ok && poczatek.current?.wzorId !== wzorId) { // wzór otwarty albo przełączony: zapisana pozycja tego wzoru, strona z poprzedniego wzoru nie przechodzi
      poczatek.current = { wzorId, strona: v.wartosc.miejsce?.strona ?? 0, powiekszenie: v.wartosc.miejsce?.powiekszenie ?? 0 };
      ustawStrone(null);
    }
    ustawWidok(v.ok ? v.wartosc : null);
    if (v.ok) await zapamietajWzor(zw, { licznikId: w.licznikId, wzorId });
  }, [licznik, zw]);
  const katalogRysunkow = `${kontener.z.katalogi.tymczasowy}/rysunki-wzoru`;
  // Odzysk kresek zapisanych przy poprzednim zamknięciu ekranu (zdarzenie bez odbiorcy), potem wczytanie (przegląd 2026-10-26).
  const pierwszyOdczyt = useCallback(() => { void wczytaj(id).catch(() => ustawBlad(true)); }, [wczytaj, id]); // M1-007: wyjątek odczytu → stan błędu
  useEffect(() => { void odzyskajRysunki(zw, { katalog: katalogRysunkow }).finally(pierwszyOdczyt); setRysikOtwarcie(); }, [pierwszyOdczyt, zw, katalogRysunkow]);
  useEffect(() => {
    if (czekaSiec.length < liczbaCzekajacych.current && otwartyWzor.current) void wczytaj(otwartyWzor.current);
    liczbaCzekajacych.current = czekaSiec.length;
  }, [czekaSiec, wczytaj]);
  const [dodano, ustawDodano] = useState(false); // „Add pattern” z ekranu projektu: źródło od razu, raz (W7a)
  useEffect(() => {
    if (!lw || dodano || !dodajParam || !['plik', 'skan', 'zdjecia', 'link'].includes(dodajParam)) return;
    ustawDodano(true);
    void dodaj(dodajParam as ZrodloDodaniaEkranu);
  }, [lw, dodano, dodajParam]);
  // Wyjście z ekranu wzoru: miejsce pracy wraca na licznik (pozycja wzoru zostaje); zamknięcie aplikacji na wzorze zostawia ekran wzoru, więc start otworzy wzór (07-jakosc-006).
  useEffect(() => () => { const idLicznika = licznik.biezacy(); if (idLicznika) void zapamietajLicznik(kontener.z, { licznikId: idLicznika }); }, [licznik, kontener]);
  function setRysikOtwarcie() { ustawRysik((s) => poDotyku(s, 'otwarcie')); }

  async function dodaj(zrodlo: ZrodloDodaniaEkranu | { rodzaj: 'adres'; adres: string } | { rodzaj: 'gotowe'; nazwa: string; zrodlo: ZrodloDodania }): Promise<void> {
    if (!lw) return;
    const data = krotkaData(zw.zegar.teraz().dzien, kontener.j.jezyk());
    let z: ZrodloDodania | null = null, nazwa = '', plik = '';
    if (typeof zrodlo === 'object') {
      if (zrodlo.rodzaj === 'adres') { z = { rodzaj: 'adres', adres: zrodlo.adres }; nazwa = nazwaDomyslna(zrodlo, t, data); plik = nazwa; }
      else { z = zrodlo.zrodlo; nazwa = zrodlo.nazwa; } // źródło złożone przez panel buildu E2E (tryb-e2e.ts, P-238)
    } else if (zrodlo === 'link') { ustawLink(true); return; }
    else if (zrodlo === 'plik') {
      const p = await wybierzPlikWzoru();
      if (!p) return;
      const rodzaj = rodzajPliku(p.nazwa, p.typ); // jedna reguła rozszerzeń (ADR-0031 pkt 5): Word = .docx, .doc → „can’t add this type”
      if (rodzaj !== 'pdf' && rodzaj !== 'word') { pokaz(alertImportu('bledne_dane', p.nazwa, t)); return; }
      z = { rodzaj, plik: { id: p.nazwa, nazwa: p.nazwa, sciezka: p.sciezka, typ: p.typ } };
      nazwa = nazwaDomyslna({ rodzaj: 'plik', nazwa: p.nazwa }, t, data); plik = p.nazwa;
    } else if (zrodlo === 'skan') {
      const s = await kontener.wzor.platforma.skanuj();
      if (!s.ok) { // W11 :664: brak aparatu → „Open Settings” / „Cancel”
        const a = alertSkanu(s.powod, t);
        if (a?.ustawienia) Alert.alert(a.tytul, a.opis, [{ text: t('wspolne.anuluj'), style: 'cancel' }, { text: t('zdjecia.otworz_ustawienia'), onPress: () => void Linking.openSettings() }]);
        else pokaz(a);
        return;
      }
      z = { rodzaj: 'obrazy', sciezki: s.wartosc.sciezki }; nazwa = nazwaDomyslna({ rodzaj: 'skan' }, t, data);
    } else {
      const s = await wybieraczZdjec().wybierzStrony();
      if (s.rodzaj !== 'zdjecia') { if (s.rodzaj === 'blad') pokaz(alertImportu('zapis', '', t)); return; }
      z = { rodzaj: 'obrazy', sciezki: s.sciezki }; nazwa = nazwaDomyslna({ rodzaj: 'zdjecia' }, t, data);
    }
    if (!z) return;
    ustawImport(nazwa);
    const r = await dodajWzor(zw, { projektId: lw.projektId, nazwa, zrodlo: z }).finally(() => ustawImport(null));
    if (r.ok) { await kontener.wzor.k.odswiezMigawke(); await wczytaj(r.wartosc.wzorId); }
    else if (r.powod === 'brak_sieci' && z.rodzaj === 'adres') await zapiszCzekanieNaSiec(z.adres, nazwa, lw.projektId);
    else pokaz(alertImportu(r.powod, plik, t));
  }
  /**
   * Strona WWW bez sieci (BR-WZR-007 S3, ADR-0031 pkt 3): zlecenie do skrzynki (zapis sam po powrocie sieci), wiersz „czeka na sieć”, bez pustego wzoru. Z ekranu projektu
   * („Add pattern”, parametr `dodaj`) wracamy tam, gdzie wiersz widać; przy błędzie zapisu alert i arkusz linku z wpisanym adresem.
   */
  async function zapiszCzekanieNaSiec(adres: string, nazwa: string, projektId: string): Promise<void> {
    const w = await kontener.wzor.k.czekajNaSiec({ projektId, adres, nazwa });
    if (w.ok) { if (dodajParam) router.back(); return; }
    pokaz(alertImportu(w.powod, '', t));
    ustawLinkAdres(adres);
    ustawLink(true);
  }
  function pokaz(a: { tytul: string; opis: string } | null): void {
    if (a) Alert.alert(a.tytul, a.opis || undefined, [{ text: t('wspolne.ok') }]);
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
  if (!lw || !wzory) return <Bezpieczny><StanWczytywania stan={blad ? 'blad' : 'ladowanie'} t={t} przedrostek="wzor" naPonow={() => { ustawBlad(false); pierwszyOdczyt(); }} /></Bezpieczny>;
  if (arkuszNazwy && widok) return (
    <Bezpieczny><ArkuszNazwyWzoru t={t} nazwa={widok.nazwa} naAnuluj={() => ustawArkuszNazwy(false)}
      naZapisz={(n) => void zmienNazweWzoru(zw, { wzorId: widok.wzorId, nazwa: n }).then(async (r) => { if (zapisano(aplikacja, r)) { ustawArkuszNazwy(false); await wczytaj(widok.wzorId); } })} /></Bezpieczny> // M1-006: błąd → alert, arkusz zostaje
  );
  if (!widok) {
    return (
      <Bezpieczny>
        <View style={{ flex: 1, padding: 16, backgroundColor: k.papier }}>
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
  const postaw = (w: { strona: number; y: number; rzadBazowy: number; kierunek: 1 | -1; wysokoscRzedu?: number }) => ustawZnacznik(zw, { wzorId: widok.wzorId, licznikId: lw.licznikId, ...w, wysokoscRzedu: w.wysokoscRzedu ?? zn?.wysokosc ?? WYSOKOSC_RZEDU_DOMYSLNA }).then(() => wczytaj(widok.wzorId));
  const nastepnaStrona = zn ? (strona?.razem ?? 0) > zn.strona + 1 : false;
  const gdzieZnacznik = zn ? { strona: zn.strona, y: zn.y, rzadBazowy: Math.max(1, zn.rzad), kierunek: zn.kierunek } : null;
  const przejdzNaNastepna = () => { if (!zn || !gdzieZnacznik) return; ustawStrone(strona ? { ...strona, n: zn.strona + 2 } : null); void postaw({ ...gdzieZnacznik, strona: zn.strona + 1, y: gornaKrawedzNaNastepnejStronie(zn.kierunek, zn.wysokosc) }); };
  const chipy = widok.notatki;
  const notatkiNatywne = chipy.map((c) => {
    const etykieta = c.notatki.length > 1 ? t('wzor.notatki_wiele', { count: c.notatki.length }) : t('wzor.notatka_chip', { n: c.rzadWzoru, tekst: c.notatki[0]?.tekst ?? '' });
    return { id: String(c.rzad), strona: c.strona, y: c.y, wysokosc: c.wysokosc, etykieta, a11y: t('wzor.notatka_chip_a11y', { n: c.rzadWzoru, tekst: c.notatki.length > 1 ? etykieta : (c.notatki[0]?.tekst ?? '') }) };
  });
  const natywny = WidokWzoruNatywny && dokument ? (
    <WidokWzoruNatywny style={{ flex: 1 }} testID="wzor-pdf" dokument={dokument} katalogRysunkow={katalogRysunkow} strona={strona ? strona.n - 1 : (poczatek.current?.strona ?? 0)} narzedzie={narzedzie} narzedzieRysika={narzedzieRysika(uklad.klasa)} polityka={polityka} cofnij={cofnij} notatki={notatkiNatywne}
      onNotatka={(e) => ustawOtwartyChip(Number(e.nativeEvent.id))}
      onZnacznik={(e) => { const n = e.nativeEvent; if (zn && n.wzorId === widok.wzorId) void postaw({ strona: n.strona, y: n.y, wysokoscRzedu: n.wysokosc, rzadBazowy: Math.max(1, zn.rzad), kierunek: zn.kierunek }); }}
      onZnacznikKrok={(e) => { const n = e.nativeEvent; const k = zn && n.wzorId === widok.wzorId ? krokZnacznika(zn, n.delta) : null; if (zn && k) void postaw({ strona: zn.strona, y: k.y, rzadBazowy: k.rzadBazowy, kierunek: zn.kierunek }); }}
      onNastepnaStrona={przejdzNaNastepna}
      znacznik={zn ? { strona: zn.strona, y: zn.y, wysokosc: zn.wysokosc, pozaStrona: zn.pozaStrona, przedSchematem: zn.przedSchematem, kierunek: zn.kierunek,
        napis: zn.pozaStrona ? t('wzor.etykieta_koniec', { n: zn.rzad }) : `${t('wzor.znacznik_napis', { n: Math.max(1, zn.rzad) })} ${zn.kierunek === -1 ? '↑' : '↓'}`,
        akcjaNastepnaStrona: zn.pozaStrona && nastepnaStrona ? t('wzor.nastepna_strona_a11y') : '',
        etykieta: t(zn.kierunek === -1 ? 'wzor.znacznik_a11y_gora' : 'wzor.znacznik_a11y_dol', { n: Math.max(1, zn.rzad) }) } : null}
      onRysunek={(e) => void zapiszRysunek(zw, { wzorId: e.nativeEvent.wzorId, strona: e.nativeEvent.strona, plikTymczasowy: e.nativeEvent.plikTymczasowy })} // wzorId ze zdarzenia: kreski starego wzoru po przełączeniu trafiają do niego
      onStrona={(e) => { ustawStrone({ n: e.nativeEvent.strona + 1, razem: e.nativeEvent.stron }); void zapamietajPozycjeWzoru(zw, { licznikId: lw.licznikId, wzorId: widok.wzorId, strona: e.nativeEvent.strona }); }} // zapis pozycji: nieudany zostaje we wpisie błędów (operacjaZapisu), wzór dalej działa
      onPowiekszenie={(e) => { if (e.nativeEvent.wzorId === widok.wzorId) void zapamietajPozycjeWzoru(zw, { licznikId: lw.licznikId, wzorId: widok.wzorId, powiekszenie: e.nativeEvent.powiekszenie }); }}
      onPierwszyRysik={() => { const po = poPierwszymRysiku({ narzedzie, tylkoRysik: rysik.tylkoRysik }, uklad.klasa); ustawNarzedzie(po.narzedzie); ustawRysik({ tylkoRysik: po.tylkoRysik }); }} // P-327 (a), P-360: bez narzędzia Pen (compact: Highlighter)
      onZakreslenia={(e) => ustawZakreslenia(e.nativeEvent.liczba)}
      onStukniecie={(e) => { // przytrzymanie: pas staje w tym miejscu, rząd zostaje (S3); pierwszy znacznik pyta o kierunek (3a) i bierze rząd w robocie (S2)
        const n = e.nativeEvent;
        if (n.wzorId !== widok.wzorId) return;
        if (zn) void postaw({ strona: n.strona, y: gornaKrawedzRzedu(n.y, zn.wysokosc), rzadBazowy: rzadPoPrzeniesieniu(zn, domyslnyRzadBazowy(lw.wartosc)), kierunek: zn.kierunek });
        else ustawPrzytrzymanie({ strona: n.strona, y: n.y });
      }} />
  ) : <View style={{ flex: 1 }} />;
  const oczekujace = czekaSiec.filter((x) => x.projektId === lw.projektId).map((x) => ({ id: x.id, nazwa: x.nazwa }));
  const liczba = lw.znaczenie === 'w_trakcie' ? lw.wartosc + 1 : lw.wartosc;
  const strony = strona?.razem ?? 0;
  return (
    <Bezpieczny pelnaSzerokosc>
      <PrzegladarkaWzoru
        stan={{ nazwa: widok.nazwa, opis: t('wzor.wiersz_opis', { rodzaj: t(RODZAJ[widok.zrodlo] ?? 'wzor.rodzaj_pdf'), strony: t('wzor.strony', { count: strony }) }), czesc: lw.czesc.nazwa,
          wzory, oczekujace, wzorId: widok.wzorId, strona, zakreslenia, narzedzie, word: plikPdf === null, kierunek: zn?.kierunek ?? null, licznik: { liczba, dziergany: lw.wartosc + 1, znaczenie: lw.znaczenie }, uklad }}
        t={t} widok={natywny}
        terminKosza={krotkaData(dodajDni(zw.zegar.teraz().dzien, KOSZ_DNI), kontener.j.jezyk())}
        naWstecz={() => router.back()}
        naPrzelacz={(w) => void wczytaj(w)}
        naUsunOczekujacy={(zid) => void kontener.wzor.k.potwierdzBlad(zid)}
        naNarzedzie={ustawNarzedzie}
        naCofnij={() => ustawCofnij((n) => n + 1)}
        chipy={chipy} otwartyChip={otwartyChip} naChip={ustawOtwartyChip}
        naZmienNotatke={async (id, nowa) => { const r = await zmienNotatkeWzoru(zw, { wzorId: widok.wzorId, notatkaId: id, tekst: nowa }); if (r.ok) await wczytaj(widok.wzorId); return r.ok; }}
        naUsunNotatke={async (id) => { const r = await usunNotatkeWzoru(zw, { wzorId: widok.wzorId, notatkaId: id }); if (r.ok) await wczytaj(widok.wzorId); return r.ok; }}
        naZaznaczRzad={(kierunek) => void postaw({ strona: strona ? strona.n - 1 : 0, y: gornaKrawedzRzedu(0.5, zn?.wysokosc ?? WYSOKOSC_RZEDU_DOMYSLNA), rzadBazowy: rzadPoPrzeniesieniu(zn, domyslnyRzadBazowy(lw.wartosc)), kierunek })}
        znacznik={zn ? { strona: zn.strona, rzad: zn.rzad, kierunek: zn.kierunek, pozaStrona: zn.pozaStrona, przedSchematem: zn.przedSchematem } : null} razemStron={strona?.razem}
        oczekujacePrzytrzymanie={przytrzymanie !== null}
        naKierunekPrzytrzymania={(kierunek) => { const g = przytrzymanie; ustawPrzytrzymanie(null); if (g) void postaw({ strona: g.strona, y: gornaKrawedzRzedu(g.y, WYSOKOSC_RZEDU_DOMYSLNA), rzadBazowy: rzadPoPrzeniesieniu(null, domyslnyRzadBazowy(lw.wartosc)), kierunek }); }}
        naZmienKierunek={(kierunek) => { if (gdzieZnacznik) void postaw({ ...gdzieZnacznik, kierunek }); }}
        naKrokRzaduZnacznika={(delta) => {
          kolejkaKrokow.current = kolejkaKrokow.current.then(async () => {
            const v = await widokWzoru(zw, { wzorId: widok.wzorId });
            const z = v.ok ? v.wartosc.znacznik : null;
            if (z) await postaw({ strona: z.strona, y: z.y, kierunek: z.kierunek, rzadBazowy: Math.max(1, Math.max(1, z.rzad) + delta) });
          });
        }}
        naNastepnaStrona={przejdzNaNastepna}
        naNotatka={(tekst) => void dodajNotatkeWzoru(zw, { wzorId: widok.wzorId, rzad: zn?.rzad ?? lw.wartosc + 1, tekst }).then((r) => { zapisano(aplikacja, r); })} // M1-006
        naObroc={() => void ustawObrot(zw, { wzorId: widok.wzorId, strona: strona ? strona.n - 1 : 0, kat: (((widok.obroty[strona ? strona.n - 1 : 0] ?? 0) + 90) % 360) as 0 | 90 | 180 | 270 }).then(async (r) => { if (zapisano(aplikacja, r)) await wczytaj(widok.wzorId); })} // M1-006
        naZmienNazwe={() => ustawArkuszNazwy(true)}
        tylkoRysik={rysik.tylkoRysik}
        naUsun={() => void usunWzor(zw, { wzorId: widok.wzorId }).then(async (r) => { if (zapisano(aplikacja, r)) { await kontener.wzor.k.odswiezMigawke(); await wczytaj(); } })}
        potwierdz={(tytul, opis, przycisk, f) => Alert.alert(tytul, opis, [{ text: t('wspolne.anuluj'), style: 'cancel' }, { text: przycisk, style: 'destructive', onPress: f }])}
        naPlus={async () => { const r = await licznik.uslugi.dodajRzad(); bladLicznika(r); await wczytaj(widok.wzorId); return r.ok ? { ok: true, wartosc: undefined } : r; }}
        naMinus={async () => { const r = licznik.dzialania.naMinus ? await licznik.dzialania.naMinus() : { ok: false as const, powod: 'zapis' as const }; bladLicznika(r); await wczytaj(widok.wzorId); return r; }}
      />
    </Bezpieczny>
  );
}
const dodajDni = (dzien: string, n: number): string => { const [r, m, d] = dzien.split('-').map(Number); return new Date(Date.UTC(r, m - 1, d + n)).toISOString().slice(0, 10); };
