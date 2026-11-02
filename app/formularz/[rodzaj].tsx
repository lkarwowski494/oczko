// Trasa „/formularz/[rodzaj]”: formularze menu ••• w arkuszu (prototyp.html:130–138). Po udanym zapisie: ekran blokady, przeładowanie licznika, powrót.
// Partia 5: arkusze projektu (`nowy-projekt`, `czesc`, `licznik`, `notatka`, `narzedzie` z parametrem `projekt`), `znaczenie` (licznik bieżący)
// i „What’s next?” (`co-dalej`, parametr `czesc`) — FormularzeProjektu.tsx, design-spec „Arkusze” (04 fix-5).
import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { FormularzCelu, FormularzNazwy, FormularzPowtorzenia, FormularzPrzypomnienia, FormularzWartosci, ListaPrzypomnien } from '../../src/ekrany/Formularze';
import { StanWczytywania } from '../../src/ekrany/StanWczytywania';
import type { WynikEkranu } from '../../src/ekrany/wspolne';
import { planPrzypomnien } from '../../src/domena/przypomnienia';
import { LIMIT_DNI_W_MIESIACU } from '../../src/konfiguracja';
import { useAplikacja } from '../../src/kompozycja/Kontekst';
import { miesiac } from '../../src/kompozycja/licznik';
import { oglos } from '../../src/kompozycja/system';
import { CoDalej, FormularzWloczekProjektu, FormularzTerminu, FormularzCzesci, FormularzLicznika, FormularzNarzedzia, FormularzNotatki, FormularzNowegoProjektu, FormularzZnaczenia } from '../../src/ekrany/FormularzeProjektu';
import { podgladRozmiaru } from '../../src/kompozycja/projekt';
import { dodajPrzypomnienie, nastepnaCzesc, nazwijCzesc, ustawCel, ustawPowtorzenie, ustawZnaczenie, usunPrzypomnienie, zmienPrzypomnienie, type NastepnaCzesc } from '../../src/przypadki-uzycia/czesc';
import { dodajLicznik } from '../../src/przypadki-uzycia/licznik';
import { dodajCzescPara, dodajCzescProjektu, nazwijProjekt, ustawDrut, ustawTermin, utworzProjekt, zapiszNotatke } from '../../src/przypadki-uzycia/projekt';
import { przypiszWloczki, wyborWloczek, type WyborWloczek } from '../../src/przypadki-uzycia/zapas';
import { podgladTerminu, widokProjektu, type WidokProjektu } from '../../src/przypadki-uzycia/widok-projektu';
import type { WidokLicznika } from '../../src/przypadki-uzycia/widok-licznika';

type Zapis = { ok: true; wartosc?: unknown } | { ok: false; powod: string };
export default function EkranFormularza(): React.ReactElement {
  const { kontener, licznik } = useAplikacja();
  const { rodzaj, projekt: projektId, czesc: czescParam, otworz, przypomnienie: przypomnienieId } = useLocalSearchParams<{ rodzaj: string; projekt?: string; czesc?: string; otworz?: string; przypomnienie?: string }>();
  const router = useRouter();
  const [w, ustaw] = useState<WidokLicznika | null | undefined>(undefined); // M1-007: undefined = jeszcze nie odczytany, null = brak widoku albo błąd odczytu
  const [wp, ustawWp] = useState<WidokProjektu | null>(null);
  const [koniec, ustawKoniec] = useState<Extract<NastepnaCzesc, { rodzaj: 'koniec' }> | null>(null);
  const [wybor, ustawWybor] = useState<WyborWloczek | null>(null);
  const [blad, ustawBlad] = useState(false); // M1-007: odczyt zapasu, projektu albo części `{ ok: false }` albo wyjątek → błąd z „Try again”, nie pusty arkusz
  const [proba, ustawProbe] = useState(0); // M1-007: „Try again” czyta wszystko od nowa
  useEffect(() => { void licznik.widok().then(ustaw, () => ustaw(null)); }, [licznik, proba]);
  useFocusEffect(useCallback(() => { // zapas odświeżany po powrocie z „Add yarn” (07-jakosc-001)
    if (rodzaj === 'wloczki' && projektId) void wyborWloczek(kontener.z, { projektId }).then((r) => { if (r.ok) ustawWybor(r.wartosc); else ustawBlad(true); }, () => ustawBlad(true));
  }, [kontener, rodzaj, projektId, proba]));
  useEffect(() => { if (projektId) void widokProjektu(kontener.z, { projektId }).then((r) => { if (r.ok) ustawWp(r.wartosc); else ustawBlad(true); }, () => ustawBlad(true)); }, [kontener, projektId, proba]);
  useEffect(() => {
    const id = licznik.biezacy();
    if (rodzaj === 'co-dalej' && id) {
      void nastepnaCzesc(kontener.z, { licznikId: id }).then((r) => { if (!r.ok) ustawBlad(true); else if (r.wartosc.rodzaj === 'koniec') ustawKoniec(r.wartosc); }, () => ustawBlad(true));
    }
  }, [kontener, licznik, rodzaj, proba]);
  const z = kontener.z, t = kontener.j.t;
  const anuluj = () => router.back();
  const pusty = (bladOdczytu: boolean) => (
    <StanWczytywania tlo="arkusz" stan={bladOdczytu ? 'blad' : 'ladowanie'} t={t} przedrostek="formularz" naPonow={() => { ustawBlad(false); ustaw(undefined); ustawProbe((n) => n + 1); }} />
  );
  // Podgląd celu w arkuszu terminu (RD-15): liczba rzędów na dziś; „osiągnięty” = 0; bez celów części = null.
  const podgladCelu = useCallback(async (d: string): Promise<number | null> => {
    const r = projektId ? await podgladTerminu(kontener.z, { projektId, terminDzien: d }) : null;
    if (!r?.ok || r.wartosc === null) return null;
    return r.wartosc.rodzaj === 'cel' ? r.wartosc.rzedy : r.wartosc.rodzaj === 'po_terminie' ? r.wartosc.zostalo : 0;
  }, [kontener, projektId]);
  /** Po zapisie w projekcie: ekran blokady i licznik od nowa, powrót do ekranu projektu (albo licznik nowej części, gdy `otworz`). */
  async function wProjekcie(f: () => Promise<Zapis>, nowyLicznik?: (r: unknown) => string | undefined): Promise<WynikEkranu<void>> {
    const r = await f();
    if (!r.ok) return { ok: false, powod: 'zapis' };
    const id = nowyLicznik?.(r.wartosc);
    if (id) { await licznik.otworz(id); router.dismissTo('/'); } else { await licznik.poZmianie(); router.back(); }
    return { ok: true, wartosc: undefined };
  }
  const idLicznika = (x: unknown): string | undefined => (typeof x === 'object' && x !== null && 'licznikId' in x && typeof x.licznikId === 'string' ? x.licznikId : undefined);
  switch (rodzaj) {
    case 'wloczki':
      if (!wybor || !projektId) return pusty(blad || !projektId);
      return <FormularzWloczekProjektu t={t} zapas={wybor.zapas} poczatkowe={wybor.wybrane} naAnuluj={anuluj} naDodajWloczke={() => router.push('/wloczka')}
        naZapisz={async (ids) => { const r = await przypiszWloczki(z, { projektId, wloczkaIds: ids }); if (!r.ok) return { ok: false, powod: 'zapis' }; router.back(); return { ok: true, wartosc: undefined }; }} />;
    case 'nowy-projekt':
      return <FormularzNowegoProjektu t={t} naAnuluj={anuluj} naZapisz={(n) => wProjekcie(() => utworzProjekt(z, n), (x) => {
        const c = typeof x === 'object' && x !== null && 'czesci' in x && Array.isArray(x.czesci) ? x.czesci[0] : undefined;
        return idLicznika(c); // nowy projekt otwiera licznik pierwszej części (BR-PRJ-001, U-5)
      })} />;
    case 'co-dalej':
      if (!koniec) return pusty(blad);
      return <CoDalej t={t} czesc={koniec.czesc} projekt={koniec.projekt} celDrugiej={koniec.celDrugiej} naNieTeraz={anuluj}
        naDruga={() => void wProjekcie(() => dodajCzescPara(z, { czescId: koniec.czescId, nazwa: koniec.czesc }), idLicznika)}
        naNowa={() => router.replace({ pathname: '/formularz/[rodzaj]', params: { rodzaj: 'czesc', projekt: w?.projektId ?? '', otworz: '1' } })} />;
  }
  if (projektId && ['czesc', 'licznik', 'notatka', 'narzedzie', 'termin'].includes(rodzaj)) {
    if (!wp) return pusty(blad);
    const nazwa = wp.nienazwany ? (w ? licznik.nazwaProjektu(w) : wp.nazwa) : wp.nazwa;
    switch (rodzaj) {
      case 'czesc':
        return <FormularzCzesci t={t} naAnuluj={anuluj} naZapisz={(c) => wProjekcie(() => dodajCzescProjektu(z, { projektId: wp.id, ...c }), otworz ? idLicznika : undefined)} />;
      case 'licznik':
        return <FormularzLicznika t={t} naAnuluj={anuluj} czesci={wp.czesci.map((c) => ({ id: c.id, nazwa: c.nazwa }))}
          domyslnaCzesc={czescParam ?? (w && w.projektId === wp.id ? w.czescId : wp.czesci[0]?.id ?? '')}
          naZapisz={(l) => wProjekcie(() => dodajLicznik(z, { czescId: l.czescId, rodzaj: l.rodzaj, nazwa: l.nazwa }))} />;
      case 'notatka':
        return <FormularzNotatki t={t} naAnuluj={anuluj} projekt={nazwa} tekst={wp.notatka} naZapisz={(tekst) => wProjekcie(() => zapiszNotatke(z, { projektId: wp.id, tekst }))} />;
      case 'narzedzie':
        return <FormularzNarzedzia t={t} naAnuluj={anuluj} narzedzie={wp.narzedzie} mm={wp.drutMm}
          podglad={(mm, n) => podgladRozmiaru(mm, n, kontener.j)}
          naZapisz={(d) => wProjekcie(() => ustawDrut(z, { projektId: wp.id, drutMm: d.mm, narzedzie: d.narzedzie }))} />;
      case 'termin':
        return <FormularzTerminu t={t} naAnuluj={anuluj} dzis={z.zegar.teraz().dzien} termin={wp.terminDzien} jezyk={kontener.j.jezyk()}
          podglad={podgladCelu}
          naZapisz={(d) => wProjekcie(() => ustawTermin(z, { projektId: wp.id, terminDzien: d }))} />;
    }
  }
  if (!w) return pusty(w === null); // M1-007: null = widok licznika nieodczytany
  async function zapisz(f: () => Promise<Zapis>): Promise<WynikEkranu<void>> {
    const r = await f();
    if (!r.ok) return { ok: false, powod: r.powod === 'limit' ? 'limit' : 'zapis' }; // limit dni: formularz wartości pokazuje komunikat limitu (07-jakosc-024)
    await licznik.poZmianie();
    router.back();
    return { ok: true, wartosc: undefined };
  }
  switch (rodzaj) {
    case 'nazwa':
      return <FormularzNazwy t={t} naAnuluj={anuluj} stan={{ projekt: w.projekt.nienazwany ? '' : w.projekt.nazwa, czesc: w.projekt.nienazwany ? '' : w.czesc.nazwa }}
        naZapisz={(n) => zapisz(async () => {
          // Pusta nazwa projektu roboczego: zostaje nienazwany, nic nie znika (design-spec „Arkusz nazwy”).
          if (n.projekt) { const r = await nazwijProjekt(z, { projektId: w.projektId, nazwa: n.projekt }); if (!r.ok) return r; }
          if (n.czesc && n.czesc !== w.czesc.nazwa) return nazwijCzesc(z, { czescId: w.czescId, nazwa: n.czesc });
          return { ok: true };
        })} />;
    case 'cel':
      return <FormularzCelu t={t} naAnuluj={anuluj} stan={{ cel: w.czesc.cel }} naZapisz={(cel) => zapisz(() => ustawCel(z, { czescId: w.czescId, cel }))} />;
    case 'wpisz':
      return <FormularzWartosci t={t} naAnuluj={anuluj} stan={{ obecna: w.wartosc }} jezyk={kontener.j.jezyk()}
        tekstLimitu={t('limit.arkusz_dni', { count: LIMIT_DNI_W_MIESIACU, limit: LIMIT_DNI_W_MIESIACU, miesiac: miesiac(w.dzis, kontener.j.jezyk()), data: miesiac(w.wznowienie, kontener.j.jezyk(), true) })} naZapisz={async (v) => {
          const r = await licznik.wpisz(v); // zapis, odświeżenie i sygnał wejścia w rząd z instrukcją (S4)
          if (!r.ok) return { ok: false, powod: r.powod === 'limit' ? 'limit' : 'zapis' };
          const wej = r.wartosc.wejscieWPrzypomnienie;
          if (wej) {
            if (r.wartosc.wibracje) kontener.porty.haptyka.zagraj('rzadZInstrukcja');
            oglos(t('licznik.wejscie_w_przypomnienie', { n: wej.rzad, tekst: wej.tekst, ktory: wej.ktory, razy: wej.razy }));
          }
          router.back();
          return { ok: true, wartosc: undefined };
        }} />;
    case 'powtorzenie':
      return <FormularzPowtorzenia t={t} naAnuluj={anuluj} stan={{ nazwa: w.nazwa || w.czesc.nazwa, dlugosc: w.powtorzenie?.dlugosc ?? null }}
        naZapisz={(p) => zapisz(() => ustawPowtorzenie(z, { licznikId: w.licznikId, dlugosc: p.dlugosc }))} />;
    case 'znaczenie':
      return <FormularzZnaczenia t={t} naAnuluj={anuluj} wartosc={w.wartosc} znaczenie={w.znaczenie} naZapisz={(zn) => zapisz(() => ustawZnaczenie(z, { licznikId: w.licznikId, znaczenie: zn }))} />;
    case 'przypomnienie':
      return <FormularzPrzypomnienia t={t} naAnuluj={anuluj} stan={{ tekst: '', od: null, co: null, razy: null }}
        podglad={(p) => { const r = planPrzypomnien(p); return r.ok ? r : { ok: false, powod: 'bledne_dane' }; }}
        naZapisz={(p) => zapisz(() => dodajPrzypomnienie(z, { licznikId: w.licznikId, ...p }))} />;
    case 'przypomnienia':
      return <ListaPrzypomnien t={t} naZamknij={anuluj}
        elementy={w.plany.map((p) => ({ id: p.id, tekst: p.tekst, opis: t('przyp.wiersz', { count: p.co, od: p.od, razy: p.razy }) }))}
        naWybor={(id) => router.replace({ pathname: '/formularz/[rodzaj]', params: { rodzaj: 'przypomnienie-edycja', przypomnienie: id } })}
        naDodaj={() => router.replace({ pathname: '/formularz/[rodzaj]', params: { rodzaj: 'przypomnienie' } })} />;
    case 'przypomnienie-edycja': {
      const p = w.plany.find((x) => x.id === przypomnienieId);
      if (!p) return pusty(true);
      return <FormularzPrzypomnienia t={t} naAnuluj={anuluj} stan={{ tekst: p.tekst, od: p.od, co: p.co, razy: p.razy }}
        podglad={(plan) => { const r = planPrzypomnien(plan); return r.ok ? r : { ok: false, powod: 'bledne_dane' }; }}
        naZapisz={(plan) => zapisz(() => zmienPrzypomnienie(z, { id: p.id, ...plan }))}
        naUsun={() => Alert.alert(t('przyp.usun_tytul'), t('przyp.usun_opis', { tekst: p.tekst }), [
          { text: t('wspolne.anuluj'), style: 'cancel' },
          { text: t('przyp.usun'), style: 'destructive', onPress: () => void zapisz(() => usunPrzypomnienie(z, { id: p.id })) },
        ])} />;
    }
    default:
      return pusty(true); // M1-007: nieznany rodzaj formularza — błąd z wyjściem, nie pusty arkusz
  }
}
