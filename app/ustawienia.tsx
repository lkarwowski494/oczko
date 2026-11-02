// Trasa „/ustawienia” (BR-ZAK-004, BR-ZAK-006/S5, S7, KP-13, F-48, BR-DAN-006, BR-DAN-009). Dni darmowe z modelu listy projektów.
// Eksport → arkusz udostępniania; import → wybór pliku, liczności przed decyzją, „scal” albo „zastąp” (P-091 (6a)); wynik w treści ekranu.
// Panele `e2e-*` tylko w buildzie E2E (bez t(), e2e/README.md).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Import } from '../src/ekrany/Dane';
import { Ustawienia } from '../src/ekrany/Ustawienia';
import { Tresc } from '../src/ekrany/Arkusz';
import type { DniNaLiscie } from '../src/ekrany/ListaProjektow';
import type { Licznosci, Manifest, TrybImportu } from '../src/domena/porty';
import { ADRESY } from '../src/kompozycja/adresy';
import { licznosciTekst, wynikScalenia } from '../src/kompozycja/dane';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { Bezpieczny } from '../src/kompozycja/Bezpieczny';
import { stanListy } from '../src/kompozycja/projekty';
import { systemAplikacji } from '../src/kompozycja/system';
import { E2E, paneleE2e } from '../src/platforma/tryb-e2e';
import { udostepnijPlik, wybierzArchiwum } from '../src/platforma/system-plikow-uzytkownika';
import { eksportuj, importuj } from '../src/przypadki-uzycia/archiwum';
import { widokProjektow } from '../src/przypadki-uzycia/widok-projektow';
import { stanBazy } from '../src/dane/repozytoria/icloud';
import { nazwaPliku } from '../src/dane/pliki/system';

type Dane =
  | { rodzaj: 'eksport'; licznosci: string }
  | { rodzaj: 'wybor'; plik: string; licznosci: string }
  | { rodzaj: 'wynik'; tekst: string }
  | { rodzaj: 'zastapiono'; kopia: string }
  | { rodzaj: 'blad' }
  | null;

export default function EkranUstawien(): React.ReactElement {
  const { kontener, licznik, preferencje } = useAplikacja();
  const router = useRouter();
  const t = kontener.j.t;
  const z = kontener.z;
  const [dni, ustawDni] = useState<DniNaLiscie>(null);
  const [pref, ustawPref] = useState(preferencje.stan()); // migawka preferencji urządzenia (ADR-0029); zapis w bazie, przełącznik wraca przy błędzie
  const [dostep, ustawDostep] = useState(kontener.dostep.stan());
  const [dane, ustawDane] = useState<Dane>(null);
  const [ostatniEksport, ustawOstatni] = useState<string | null>(null);
  const [icloudWlaczona, ustawIcloud] = useState(false); // partia 7: „Replace” przy włączonej synchronizacji najpierw prosi o wyłączenie
  const wybor = useRef<((t: TrybImportu | 'anuluj') => void) | null>(null);
  const { import: plikImportu } = useLocalSearchParams<{ import?: string }>(); // plik `.oczko` otwarty z Plików (ADR-0004, +native-intent)

  useFocusEffect(useCallback(() => {
    const koniec = kontener.dostep.naZmiane(ustawDostep);
    if (kontener.icloud) void stanBazy(z.baza).then((s) => ustawIcloud(s.wlaczona));
    void widokProjektow(z).then((w) => {
      const ch = z.zegar.teraz();
      if (w.ok) ustawDni(stanListy(w.wartosc, { zapytanie: '', j: kontener.j, terazMs: ch.ms, strefa: ch.strefa }).dni);
    });
    return koniec;
  }, [kontener, z]));

  /** ADR-0029: zapis w bazie przez kolejkę; migawka zmienia się po COMMIT, błąd = przełącznik wraca i komunikat `licznik.blad_zapisu`. */
  async function zapiszPreferencje(zmiana: Parameters<typeof preferencje.zapisz>[1]): Promise<void> {
    const w = await preferencje.zapisz(z, zmiana);
    if (!w.ok) Alert.alert(t('ustawienia.tytul'), t('licznik.blad_zapisu'));
    ustawPref({ ...preferencje.stan() });
  }
  async function eksport(): Promise<string | null> {
    const w = await eksportuj(z, { katalogDocelowy: z.katalogi.tymczasowy });
    if (!w.ok) { ustawDane({ rodzaj: 'blad' }); return null; }
    ustawOstatni(w.wartosc.sciezka);
    ustawDane({ rodzaj: 'eksport', licznosci: licznosciTekst(w.wartosc.manifest.licznosci, t) });
    return w.wartosc.sciezka;
  }
  async function licznosciBazy(): Promise<Licznosci> {
    const [r] = await z.baza.all<{ p: number }>('SELECT count(*) AS p FROM projekt');
    return { projekt: r?.p ?? 0 };
  }
  async function importZ(sciezka: string) {
    const pomiar = paneleE2e; // E2-137-A3: czas do „import-gotowy” w panelu `e2e-pomiar-operacji` (tylko build E2E)
    pomiar?.poczatekOperacji('import');
    let w: Awaited<ReturnType<typeof importuj>>;
    let przed: Licznosci;
    try {
      przed = await licznosciBazy();
      w = await importuj(z, {
        sciezka,
        wybierz: (m: Manifest) => new Promise((r) => {
          wybor.current = r;
          pomiar?.koniecOperacji('import', true);
          ustawDane({ rodzaj: 'wybor', plik: sciezka.slice(sciezka.lastIndexOf('/') + 1), licznosci: licznosciTekst(m.licznosci, t) });
        }),
      });
    } catch {
      // Wyjątek spoza `Wynik` (baza, system plików, czas w tle): bez tego import kończył się odrzuconą obietnicą i ekranem bez żadnego stanu (E2-137-A3, DEV-10).
      wybor.current = null;
      pomiar?.koniecOperacji('import', false);
      ustawDane({ rodzaj: 'blad' });
      return;
    }
    wybor.current = null;
    pomiar?.koniecOperacji('import', w.ok); // przed wyborem: błąd sprawdzenia; po wyborze pierwszy koniec („gotowy”) zostaje
    if (!w.ok && w.powod === 'bledne_dane') { // F-32 (07-jakosc-031): obcy plik albo plik bez manifestu Oczka — mówimy wprost, bez „That didn't work”
      ustawDane(null);
      Alert.alert(t('import.nie_rozpoznano_tytul'), t('import.nie_rozpoznano_opis'));
      return;
    }
    if (!w.ok) { ustawDane({ rodzaj: 'blad' }); return; }
    if (w.wartosc.tryb === 'anulowano') { ustawDane(null); return; }
    if (w.wartosc.tryb === 'zastap') licznik.zresetuj(); else await licznik.poZmianie();
    if (w.wartosc.tryb === 'zastap' && w.wartosc.kopiaPrzed) { ustawDane({ rodzaj: 'zastapiono', kopia: nazwaPliku(w.wartosc.kopiaPrzed) }); return; } // ADR-0028: nazwa kopii z Plików, nie „Merged”
    ustawDane({ rodzaj: 'wynik', tekst: wynikScalenia(przed, w.wartosc.licznosci, t) });
  }
  useEffect(() => { if (plikImportu) void importZ(plikImportu); }, [plikImportu]); // eslint-disable-line react-hooks/exhaustive-deps -- raz na otwarty plik
  const zamknijDane = () => { wybor.current?.('anuluj'); ustawDane(null); };
  // „Replace” przy włączonym iCloud (ADR-0005, design-spec icloud.zastap_wylacz): najpierw wyłączenie; przypadek użycia i tak odmawia.
  const naZastap = () => {
    if (!icloudWlaczona) { wybor.current?.('zastap'); return; }
    Alert.alert(t('icloud.zastap_wylacz'), t('icloud.zastap_wylacz_opis'), [
      { text: t('wspolne.anuluj'), style: 'cancel' },
      { text: t('icloud.do_ustawien'), onPress: () => { zamknijDane(); router.push('/stan-danych'); } },
    ]);
  };

  const wynikDanych = dane === null ? null
    : dane.rodzaj === 'eksport' ? <View testID="eksport-wynik"><Tresc>{t('dane.eksport_gotowy_tytul')}</Tresc><Tresc testID="eksport-licznosci">{dane.licznosci}</Tresc></View>
    : dane.rodzaj === 'blad' ? <Tresc>{t('dane.blad')}</Tresc>
    : dane.rodzaj === 'zastapiono' ? <Import wbudowany t={t} stan={{ rodzaj: 'zastapiono', kopia: dane.kopia }} naZastap={naZastap} naScal={() => undefined} naAnuluj={zamknijDane} />
    : <Import wbudowany t={t} stan={dane.rodzaj === 'wybor' ? { rodzaj: 'wybor', plik: dane.plik, licznosci: dane.licznosci } : { rodzaj: 'wybor', plik: '' }}
        wynik={dane.rodzaj === 'wynik' ? dane.tekst : undefined}
        naScal={() => wybor.current?.('scal')} naZastap={naZastap} naAnuluj={zamknijDane} />;

  // Build E2E (P-238): panel z modułu ładowanego warunkowo; SHA pary `.db` + `-wal` liczy panel przy każdym wejściu (P-203).
  const panelE2e = paneleE2e
    ? <paneleE2e.PanelUstawien katalogDanych={kontener.katalogDanych} ostatniEksport={ostatniEksport} naImportuj={(p) => void importZ(p)} />
    : null;

  return (
    <Bezpieczny>
      <Ustawienia
        stan={{ pro: dostep.aktywne, dni: dostep.pro ? null : dni, wibracje: pref.wibracje }}
        t={t}
        system={systemAplikacji}
        adresy={{ polityka: ADRESY.polityka, recenzja: ADRESY.recenzja }}
        naOferty={() => router.push('/oferty')}
        naWstecz={() => router.back()}
        naWibracje={(w) => void zapiszPreferencje({ wibracje: w })}
        preferencje={{ ekranNieGasnie: pref.ekranNieGasnie, ukladMiar: pref.ukladMiar, naEkranNieGasnie: (w) => void zapiszPreferencje({ ekranNieGasnie: w }), naMiary: () => router.push('/miary') }}
        naZglosProblem={() => router.push('/zglos')}
        jezyk={{ stan: { wartosc: kontener.j.preferencja(), jezyk: kontener.j.jezyk() }, naJezyk: () => router.push('/jezyk'), naZglosTlumaczenie: () => router.push('/zglos') }}
        naZrodla={() => router.push('/zrodla')}
        naStanDanych={() => router.push('/stan-danych')}
        dane={{
          naEksport: () => void eksport().then((s) => { if (s && !E2E) void udostepnijPlik(s); }),
          naImport: () => void wybierzArchiwum().then((p) => { if (p) void importZ(p); }),
          naUsunWszystko: () => router.push('/usun-wszystko'), // arkusz potwierdzenia (P-266 (3))
        }}
        wynikDanych={wynikDanych}
        panelE2e={panelE2e}
      />
    </Bezpieczny>
  );
}
