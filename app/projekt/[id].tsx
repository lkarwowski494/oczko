// Trasa „/projekt/[id]”: ekran projektu (A5 partii 5; design-spec „Ekran projektu”, P-183 3a). Wejście: nazwa projektu na liczniku, lista projektów.
// Potwierdzenia „Make another” i „Delete …” to alerty systemowe (design-spec „Usuwanie”, słownik „Delete {object}”); termin w treści = dzień
// usunięcia + KOSZ_DNI. Po zapisie: ekran blokady i licznik (`poZmianie` / `poUsunieciu`, C2), ogłoszenie VoiceOver, model od nowa.
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useFocusEffect, useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { Projekt } from '../../src/ekrany/Projekt';
import { GrupaZdjec, type Miniatura } from '../../src/ekrany/Zdjecia';
import { zaleznosciObrazu } from '../../src/kompozycja/obrazy-aplikacji';
import { zdjecieBezMetadanych } from '../../src/kompozycja/zdjecie-bez-metadanych';
import { usunPlik } from '../../src/dane/pliki/system';
import { GrupaWzorow } from '../../src/ekrany/WzorGrupa';
import { ArkuszFilmu, DodajFilm, WierszFilmu, type FilmProjektu } from '../../src/ekrany/WzorFilm';
import { filmProjektu } from '../../src/przypadki-uzycia/film';
import { miniaturyWzorow } from '../../src/kompozycja/miniatury';
import { useStanSieci } from '../../src/kompozycja/stan-sieci';
import { listaWzorow, type WzorNaLiscie } from '../../src/przypadki-uzycia/wzor';
import { paneleE2e } from '../../src/platforma/tryb-e2e';
import { wybieraczZdjec } from '../../src/platforma/zdjecia';
import { dodajZdjecie, zdjecia } from '../../src/przypadki-uzycia/zdjecia';
import { StanWczytywania } from '../../src/ekrany/StanWczytywania';
import { dzienLokalny } from '../../src/domena/postep';
import { KOSZ_DNI } from '../../src/konfiguracja';
import { useAplikacja } from '../../src/kompozycja/Kontekst';
import { Bezpieczny } from '../../src/kompozycja/Bezpieczny';
import { krotkaData, stanProjektu } from '../../src/kompozycja/projekt';
import { projektyDoSkrzynki } from '../../src/kompozycja/projekty';
import { SkrzynkaNaEkranie } from '../../src/kompozycja/SkrzynkaNaEkranie';
import { oglos, systemAplikacji } from '../../src/kompozycja/system';
import { dodajDni } from '../../src/przypadki-uzycia/daty';
import { usunCzesc, usunLicznik, usunProjekt, wznowProjekt, zmienDateUkonczenia, zrobPonownie } from '../../src/przypadki-uzycia/projekt';
import { widokProjektu, type WidokProjektu } from '../../src/przypadki-uzycia/widok-projektu';

import { sesjeProjektu, type SesjaNaEkranie } from '../../src/przypadki-uzycia/sesja';
import { stanCzasu } from '../../src/kompozycja/sesje';
export default function EkranProjektu(): React.ReactElement {
  const { kontener, licznik } = useAplikacja();
  const siec = useStanSieci(kontener.porty.siec); // ADR-0031: film otwiera się według stanu sieci z portu (BR-WZR-007 S4)
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const naWierzchu = useIsFocused(); // arkusz skrzynki tylko na ekranie na wierzchu stosu
  const [w, ustaw] = useState<WidokProjektu | null>(null);
  const [blad, ustawBlad] = useState(false); // E2-137-A1: pierwszy odczyt się nie udał (wyjątek albo wynik inny niż „brak projektu”) — błąd z ponowieniem zamiast pustej planszy
  const [start] = useState(() => performance.now()); // E2-137-A1, build E2E: czas od zamontowania ekranu do pierwszych danych (panel `e2e-pomiar-ladowania`)
  const [ladowanieMs, ustawLadowanieMs] = useState<number | null>(null);
  const [edycja, ustawEdycje] = useState(false);
  const [sesje, ustawSesje] = useState<SesjaNaEkranie[]>([]); // grupa „Time” (P-191 P4a)
  const [miniatury, ustawMiniatury] = useState<Miniatura[]>([]); // grupa „Photos” (P-191 P9a)
  const [wzory, ustawWzory] = useState<WzorNaLiscie[]>([]); // grupa „Pattern(s)” (partia 6, W8)
  const [film, ustawFilm] = useState<FilmProjektu | null>(null); // wiersz „Video” (W8, P-276)
  const [obrazyWzorow, ustawObrazyWzorow] = useState<Record<string, string>>({}); // miniatury pierwszej strony (W8, plan 1.1 pkt 7)
  const [arkuszFilmu, ustawArkuszFilmu] = useState(false); // „Add video link” / „Change link”
  const z = kontener.z, j = kontener.j, t = j.t;
  const wczytaj = useCallback(async () => {
    const r = await widokProjektu(z, { projektId: id }).catch(() => null);
    if (r?.ok) {
      ustaw(r.wartosc);
      ustawBlad(false);
      ustawLadowanieMs((ms) => ms ?? Math.round(performance.now() - start));
    } else if (r?.powod === 'bledne_dane') router.replace('/projekty'); // projekt w koszu albo nieistniejący
    else { ustawBlad(true); return; } // wyjątek odczytu albo inny błąd: ekran błędu z ponowieniem (jeśli są już dane, zostają na ekranie)
    const s = await sesjeProjektu(z, { projektId: id });
    if (s.ok) ustawSesje(s.wartosc);
    const f = await zdjecia(z, { projektId: id });
    if (f.ok) ustawMiniatury(f.wartosc.map((x) => ({ id: x.id, uri: `file://${z.magazyn.sciezka(x.sha256)}` })));
    const lw = await listaWzorow(z, { projektId: id });
    if (lw.ok) ustawWzory(lw.wartosc);
    void miniaturyWzorow(z, (pdf, cel) => kontener.wzor.platforma.miniatura(pdf, cel), { projektId: id }).then(ustawObrazyWzorow); // bez czekania: wiersze od razu, obraz po wygenerowaniu
    const fp = await filmProjektu(z, { projektId: id });
    if (fp.ok) ustawFilm(fp.wartosc);
  }, [z, id, router, kontener, start]);
  useFocusEffect(useCallback(() => { void wczytaj(); }, [wczytaj]));
  useEffect(() => kontener.wzor.k.naZmiane(() => { void wczytaj(); }), [kontener, wczytaj]); // skrzynka zmieniła stan (ponowienie po sieci, usunięcie wiersza) → wiersze wzorów od razu (ADR-0031 pkt 4)
  if (!w) {
    return (
      <Bezpieczny>
        <StanWczytywania stan={blad ? 'blad' : 'ladowanie'} t={t} przedrostek="projekt" naPonow={() => { ustawBlad(false); void wczytaj(); }} />
      </Bezpieczny>
    );
  }
  if (arkuszFilmu) { // P-276: „Change link” = arkusz wypełniony, Save zastępuje (jeden film na projekt, P-218 (4))
    return (
      <Bezpieczny>
        <ArkuszFilmu t={t} poczatek={film} naAnuluj={() => ustawArkuszFilmu(false)}
          naZapisz={(f) => void kontener.wzor.k.zapiszFilm(w.id, f).then(async (r) => { if (r.ok) { ustawArkuszFilmu(false); await wczytaj(); } })} />
      </Bezpieczny>
    );
  }
  const ch = z.zegar.teraz();
  const stan = { ...stanProjektu(w, { j, terazMs: ch.ms, strefa: ch.strefa }), czas: stanCzasu(sesje, j) };
  const doDnia = () => { const d = dzienLokalny(ch.ms, ch.strefa); return d.ok ? krotkaData(dodajDni(d.wartosc, KOSZ_DNI), j.jezyk()) : ''; };
  const otworzLicznik = (licznikId: string) => void licznik.otworz(licznikId).then(() => router.navigate('/'));
  const formularz = (rodzaj: string, extra: Record<string, string> = {}) => router.push({ pathname: '/formularz/[rodzaj]', params: { rodzaj, projekt: w.id, ...extra } });
  const potwierdz = (tytul: string, opis: string, przycisk: string, f: () => Promise<void>, destrukcyjny = true) =>
    Alert.alert(tytul, opis, [{ text: t('wspolne.anuluj'), style: 'cancel' }, { text: przycisk, style: destrukcyjny ? 'destructive' : 'default', onPress: () => void f() }]);
  const poUsunieciu = async (nazwa: string) => { await licznik.poUsunieciu(w.id); oglos(t('usun.ogloszenie', { nazwa })); await wczytaj(); };
  const czesc = (cid: string) => w.czesci.find((c) => c.id === cid);
  // P-219 (2A): każde zdjęcie przekodowane bez metadanych i GPS, zanim trafi do magazynu.
  const dodajPlik = async (sciezka: string) => {
    const czysty = await zdjecieBezMetadanych(sciezka, zaleznosciObrazu(z.katalogi.tymczasowy, z.id.nowy)).catch(() => null);
    if (!czysty) { Alert.alert(t('licznik.blad_zapisu')); return; }
    const r = await dodajZdjecie(z, { cel: { projektId: w.id }, plik: czysty });
    usunPlik(czysty.sciezka);
    if (r.ok) await wczytaj(); else Alert.alert(t('licznik.blad_zapisu'));
  };
  const wybierzZdjecie = async (zrodlo: 'aparat' | 'biblioteka') => {
    const r = await wybieraczZdjec().wybierz(zrodlo);
    if (r.rodzaj === 'zdjecie') await dodajPlik(r.sciezka);
    else if (r.rodzaj === 'brak_zgody') {
      Alert.alert(t('zdjecia.brak_aparatu_tytul'), t('zdjecia.brak_aparatu_opis'), [
        { text: t('wspolne.anuluj'), style: 'cancel' }, { text: t('zdjecia.otworz_ustawienia'), onPress: () => void Linking.openSettings() },
      ]);
    } else if (r.rodzaj === 'blad') Alert.alert(t('licznik.blad_zapisu'));
  };
  const grupaZdjec = (
    <GrupaZdjec t={t} miniatury={miniatury} naWybierz={(zr) => void wybierzZdjecie(zr)}
      naOtworz={(i) => router.push({ pathname: '/zdjecie', params: { projekt: w.id, i: String(i) } })}
      panelE2e={paneleE2e ? <paneleE2e.PanelZdjecia katalogTymczasowy={z.katalogi.tymczasowy} naPlik={(p) => void dodajPlik(p)} /> : undefined} />
  );
  // Partia 6 (W8): wzór otwiera się z licznikiem projektu (pasek licznika pod wzorem); dodanie przez trasę /wzor (te same źródła W7a).
  const doWzoru = async (params: Record<string, string>) => {
    const ids = w.czesci.flatMap((c) => c.liczniki).map((x) => x.id);
    const biezacy = licznik.biezacy();
    const l = biezacy && ids.includes(biezacy) ? biezacy : ids[0]; // bieżący licznik projektu zostaje (przegląd 2026-10-26)
    if (!l) return;
    if (l !== biezacy) await licznik.otworz(l);
    router.push({ pathname: '/wzor', params });
  };
  const RODZ = { pdf: 'wzor.rodzaj_pdf', obraz: 'wzor.rodzaj_zdjecie', www: 'wzor.rodzaj_strona', word: 'wzor.rodzaj_word' } as const;
  const opisWzoru = (x: WzorNaLiscie) => { // „PDF · 6 pages” (W8); liczba stron z importu, P-252 — bez niej sam rodzaj
    const rodzaj = t(RODZ[x.zrodlo as keyof typeof RODZ] ?? 'wzor.rodzaj_pdf');
    return x.strony ? t('wzor.wiersz_opis', { rodzaj, strony: t('wzor.strony', { count: x.strony }) }) : rodzaj;
  };
  const grupaWzorow = (
    <GrupaWzorow t={t} wzory={wzory.map((x) => ({ wzorId: x.wzorId, nazwa: x.nazwa, opis: opisWzoru(x), miniatura: obrazyWzorow[x.wzorId] }))}
      oczekujace={kontener.wzor.k.stan().czekaSiec.filter((x) => x.projektId === w.id).map((x) => ({ id: x.id, nazwa: x.nazwa, stan: 'siec' as const }))}
      skaner={kontener.wzor.platforma.skanerDostepny()} naOtworz={(wid) => void doWzoru({ id: wid })} naDodaj={(zr) => void doWzoru({ dodaj: zr })}
      naUsunOczekujacy={(zid) => void kontener.wzor.k.potwierdzBlad(zid).then(wczytaj)}
      film={film
        ? <WierszFilmu film={film} siec={siec} t={t} system={systemAplikacji}
            naZmien={() => ustawArkuszFilmu(true)} naUsun={() => void kontener.wzor.k.usunFilm(w.id).then(wczytaj)} />
        : <DodajFilm t={t} naDodaj={() => ustawArkuszFilmu(true)} />} />
  );
  const licznikW = (lid: string) => stan.czesci.flatMap((c) => c.liczniki ?? []).find((l) => l.id === lid);
  return (
    <Bezpieczny>
      <Projekt
        stan={stan} t={t} edycja={edycja} zdjecia={grupaZdjec} wzory={grupaWzorow}
        naSesje={() => router.push({ pathname: '/sesje', params: { projekt: w.id } })}
        naProbka={() => router.push({ pathname: '/probka', params: { projekt: w.id } })}
        naWstecz={() => (router.canGoBack() ? router.back() : router.replace('/projekty'))}
        naOtworzCzesc={(cid) => { const l = czesc(cid)?.liczniki[0]; if (l) otworzLicznik(l.id); }}
        naOtworzLicznik={otworzLicznik}
        naDodajCzesc={() => formularz('czesc')} naDodajLicznik={() => formularz('licznik')}
        naNotatka={() => formularz('notatka')} naNarzedzie={() => formularz('narzedzie')} naTermin={() => formularz('termin')} naWloczka={() => formularz('wloczki')}
        naEdytuj={() => ustawEdycje(true)} naKoniecEdycji={() => ustawEdycje(false)}
        naDataUkonczenia={(dzien) => void zmienDateUkonczenia(z, { projektId: w.id, ukonczonoDzien: dzien }).then(async (r) => { if (r.ok) await wczytaj(); })}
        naWznow={() => void wznowProjekt(z, { projektId: w.id }).then(async (r) => {
          if (!r.ok) return;
          await licznik.poZmianie();
          oglos(t('projekt.wznowiono', { nazwa: stan.nazwa }));
          await wczytaj();
        })}
        naZrobTakaSama={() => potwierdz(t('projekt.kopia_tytul', { nazwa: stan.nazwa }), t('projekt.kopia_opis'), t('projekt.kopia_potwierdz'), async () => {
          const r = await zrobPonownie(z, { projektId: w.id }); // nazwa kopii = nazwa oryginału (04-fix5-N1, decyzja 08 w raporcie)
          if (r.ok) router.replace({ pathname: '/projekt/[id]', params: { id: r.wartosc.projektId } });
        }, false)}
        naUsunProjekt={() => potwierdz(t('usun.tytul', { nazwa: stan.nazwa }), t('usun.projekt_opis', { data: doDnia() }), t('usun.projekt'), async () => {
          const r = await usunProjekt(z, { projektId: w.id });
          if (!r.ok) return;
          await licznik.poUsunieciu(w.id);
          oglos(t('usun.ogloszenie', { nazwa: stan.nazwa }));
          router.replace('/projekty');
        })}
        naUsunCzesc={(cid) => {
          const c = czesc(cid);
          if (!c) return;
          potwierdz(t('usun.tytul', { nazwa: c.nazwa }), t('usun.czesc_opis', { count: c.liczniki.length, data: doDnia() }), t('usun.czesc'), async () => {
            if ((await usunCzesc(z, { czescId: cid })).ok) await poUsunieciu(c.nazwa);
          });
        }}
        naUsunLicznik={(lid) => {
          const nazwa = licznikW(lid)?.nazwa ?? '';
          potwierdz(t('usun.tytul', { nazwa }), t('usun.licznik_opis', { data: doDnia() }), t('usun.licznik'), async () => {
            if ((await usunLicznik(z, { licznikId: lid })).ok) await poUsunieciu(nazwa);
          });
        }}
      />
      {/* R2 (design-spec :775): arkusz skrzynki także na ekranie projektu (nie nad licznikiem, P-046) */}
      <SkrzynkaNaEkranie wz={kontener.wzor.k} t={t} aktywny={naWierzchu} projekty={() => projektyDoSkrzynki(z, j)} naPoWyborze={() => void wczytaj()} />
      {paneleE2e && ladowanieMs !== null ? <paneleE2e.PanelPomiaruLadowania ms={ladowanieMs} /> : null /* build E2E (E2-137-A1): ms do pierwszych danych */}
    </Bezpieczny>
  );
}

