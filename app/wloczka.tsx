// Trasa „/wloczka?id=…”: arkusz włóczki (P-191 P8a; BR-ZAP-001). Bez id — nowa włóczka; zapis przez kolejkę przypadków użycia, potem powrót.
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FormularzWloczki } from '../src/ekrany/Zapas';
import { alertBleduZapisu } from '../src/ekrany/blad-zapisu';
import { GrupaZdjec, type Miniatura } from '../src/ekrany/Zdjecia';
import { wybieraczZdjec } from '../src/platforma/zdjecia';
import { zaleznosciObrazu } from '../src/kompozycja/obrazy-aplikacji';
import { zdjecieBezMetadanych } from '../src/kompozycja/zdjecie-bez-metadanych';
import { usunPlik } from '../src/dane/pliki/system';
import { dodajZdjecie, zdjecia } from '../src/przypadki-uzycia/zdjecia';
import { StanWczytywania } from '../src/ekrany/StanWczytywania';
import { potwierdzUsuniecie } from '../src/kompozycja/zapas-kosz';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { zglosBladZapisu } from '../src/kompozycja/po-zapisie';
import { useOdrzucZmiany } from '../src/kompozycja/odrzuc-zmiany';
import { imperialny } from '../src/kompozycja/miary';
import { bazowa, przeliczenie } from '../src/kompozycja/zapas';
import { formatujLiczbe } from '../src/i18n/format';
import { usunWloczke, wloczka, zapiszWloczke, type FormularzWloczki as Dane } from '../src/przypadki-uzycia/zapas';

export default function EkranWloczki(): React.ReactElement {
  const aplikacja = useAplikacja();
  const { kontener, preferencje } = aplikacja;
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const j = kontener.j;
  const [poczatek, ustaw] = useState<Dane | null | undefined>(id ? undefined : null);
  const [miniatury, ustawMiniatury] = useState<Miniatura[]>([]);
  const [blad, ustawBlad] = useState(false); // M1-007: odczyt `{ ok: false }` (inny niż brak włóczki) albo wyjątek → błąd z „Try again”, nie pusty arkusz
  const z = kontener.z;
  // M1-020: „Cancel” i przesunięcie arkusza w dół pytają „Discard changes?”, gdy formularz zgłosił zmianę; po zapisie i usunięciu wyjście bez pytania.
  const odrzuc = useOdrzucZmiany(j.t, id ? 'zmiany' : 'nowy', () => router.back());
  const wczytajZdjecia = useCallback(async () => {
    if (!id) return;
    const f = await zdjecia(z, { wloczkaId: id });
    if (f.ok) ustawMiniatury(f.wartosc.map((x) => ({ id: x.id, uri: `file://${z.magazyn.sciezka(x.sha256)}` })));
  }, [z, id]);
  const wczytaj = useCallback(async () => {
    if (!id) return;
    const w = await wloczka(z, id).catch(() => null);
    if (w?.ok) ustaw(w.wartosc);
    else if (w?.powod === 'bledne_dane') router.back(); // włóczki już nie ma (w koszu albo usunięta)
    else ustawBlad(true);
  }, [z, id, router]);
  useEffect(() => {
    if (!id) return;
    void wczytaj();
    void wczytajZdjecia();
  }, [id, wczytaj, wczytajZdjecia]);
  // Zdjęcie etykiety (P-191 P9a) tylko przy edycji: wiersz zdjęcia potrzebuje id zapisanej włóczki. Podgląd i usuwanie — z ekranu projektu
  // (ta sama grupa); w arkuszu miniatura bez podglądu (odstępstwo do raportu).
  const wybierz = async (zrodlo: 'aparat' | 'biblioteka') => {
    if (!id) return;
    const r = await wybieraczZdjec().wybierz(zrodlo);
    if (r.rodzaj === 'zdjecie') { // P-219 (2A): bez metadanych i GPS przed zapisem
      const czysty = await zdjecieBezMetadanych(r.sciezka, zaleznosciObrazu(z.katalogi.tymczasowy, z.id.nowy)).catch(() => null);
      if (!czysty) { Alert.alert(...alertBleduZapisu(j.t, 'formularz')); return; }
      const w = await dodajZdjecie(z, { cel: { wloczkaId: id }, plik: czysty });
      usunPlik(czysty.sciezka);
      if (w.ok) await wczytajZdjecia(); else Alert.alert(...alertBleduZapisu(j.t, 'formularz'));
    }
    else if (r.rodzaj === 'brak_zgody') {
      Alert.alert(j.t('zdjecia.brak_aparatu_tytul'), j.t('zdjecia.brak_aparatu_opis'), [
        { text: j.t('wspolne.anuluj'), style: 'cancel' }, { text: j.t('zdjecia.otworz_ustawienia'), onPress: () => void Linking.openSettings() },
      ]);
    }
  };
  if (poczatek === undefined) return <StanWczytywania wyjscie={{ rodzaj: 'zamknij', naWyjdz: () => router.back() }} tlo="arkusz" stan={blad ? 'blad' : 'ladowanie'} t={j.t} przedrostek="wloczka" naPonow={() => { ustawBlad(false); void wczytaj(); }} />;
  return (
    <FormularzWloczki t={j.t} poczatek={poczatek} jednostki={imperialny(preferencje.stan().ukladMiar) ? 'imperialne' : 'metryczne'}
      przelicz={(x, u) => przeliczenie(x, u, j)} bazowa={(x, u) => bazowa(x, u, j.jezyk())} formatuj={(n) => formatujLiczbe(n, j.jezyk(), { maks: 2 })}
      naAnuluj={odrzuc.anuluj} naZmiane={odrzuc.naZmiane}
      naUsun={id && poczatek ? () => potwierdzUsuniecie(kontener, { nazwa: poczatek.nazwa, przycisk: j.t('usun.wloczka'), alert: Alert.alert,
        usun: () => usunWloczke(z, { wloczkaId: id }), potem: () => { odrzuc.poZapisie(); router.back(); }, naBlad: (powod) => zglosBladZapisu(aplikacja, powod) }) : undefined} // M1-006
      zdjecia={id ? <GrupaZdjec t={j.t} miniatury={miniatury} naWybierz={(zr) => void wybierz(zr)} naOtworz={() => undefined}
        naglowek={j.t('zapas.zdjecie_etykiety')} testID="wloczka-zdjecia" /> : undefined}
      naZapisz={async (d) => {
        const w = await zapiszWloczke(kontener.z, { ...d, id });
        if (!w.ok) return { ok: false, powod: w.powod === 'bledne_dane' ? 'bledne_dane' : 'zapis' };
        odrzuc.poZapisie();
        router.back();
        return { ok: true, wartosc: undefined };
      }} />
  );
}
