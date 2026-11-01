// Trasa „/wloczka?id=…”: arkusz włóczki (P-191 P8a; BR-ZAP-001). Bez id — nowa włóczka; zapis przez kolejkę przypadków użycia, potem powrót.
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FormularzWloczki } from '../src/ekrany/Zapas';
import { GrupaZdjec, type Miniatura } from '../src/ekrany/Zdjecia';
import { wybieraczZdjec } from '../src/platforma/zdjecia';
import { zaleznosciObrazu } from '../src/kompozycja/obrazy-aplikacji';
import { zdjecieBezMetadanych } from '../src/kompozycja/zdjecie-bez-metadanych';
import { usunPlik } from '../src/dane/pliki/system';
import { dodajZdjecie, zdjecia } from '../src/przypadki-uzycia/zdjecia';
import { useKolory } from '../src/ekrany/motyw';
import { potwierdzUsuniecie } from '../src/kompozycja/zapas-kosz';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { imperialny } from '../src/kompozycja/miary';
import { bazowa, przeliczenie } from '../src/kompozycja/zapas';
import { formatujLiczbe } from '../src/i18n/format';
import { usunWloczke, wloczka, zapiszWloczke, type FormularzWloczki as Dane } from '../src/przypadki-uzycia/zapas';

export default function EkranWloczki(): React.ReactElement {
  const { kontener, preferencje } = useAplikacja();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const k = useKolory();
  const j = kontener.j;
  const [poczatek, ustaw] = useState<Dane | null | undefined>(id ? undefined : null);
  const [miniatury, ustawMiniatury] = useState<Miniatura[]>([]);
  const z = kontener.z;
  const wczytajZdjecia = useCallback(async () => {
    if (!id) return;
    const f = await zdjecia(z, { wloczkaId: id });
    if (f.ok) ustawMiniatury(f.wartosc.map((x) => ({ id: x.id, uri: `file://${z.magazyn.sciezka(x.sha256)}` })));
  }, [z, id]);
  useEffect(() => {
    if (!id) return;
    void wloczka(z, id).then((w) => { if (w.ok) ustaw(w.wartosc); else router.back(); });
    void wczytajZdjecia();
  }, [z, id, router, wczytajZdjecia]);
  // Zdjęcie etykiety (P-191 P9a) tylko przy edycji: wiersz zdjęcia potrzebuje id zapisanej włóczki. Podgląd i usuwanie — z ekranu projektu
  // (ta sama grupa); w arkuszu miniatura bez podglądu (odstępstwo do raportu).
  const wybierz = async (zrodlo: 'aparat' | 'biblioteka') => {
    if (!id) return;
    const r = await wybieraczZdjec().wybierz(zrodlo);
    if (r.rodzaj === 'zdjecie') { // P-219 (2A): bez metadanych i GPS przed zapisem
      const czysty = await zdjecieBezMetadanych(r.sciezka, zaleznosciObrazu(z.katalogi.tymczasowy, z.id.nowy)).catch(() => null);
      if (!czysty) { Alert.alert(j.t('licznik.blad_zapisu')); return; }
      const w = await dodajZdjecie(z, { cel: { wloczkaId: id }, plik: czysty });
      usunPlik(czysty.sciezka);
      if (w.ok) await wczytajZdjecia(); else Alert.alert(j.t('licznik.blad_zapisu'));
    }
    else if (r.rodzaj === 'brak_zgody') {
      Alert.alert(j.t('zdjecia.brak_aparatu_tytul'), j.t('zdjecia.brak_aparatu_opis'), [
        { text: j.t('wspolne.anuluj'), style: 'cancel' }, { text: j.t('zdjecia.otworz_ustawienia'), onPress: () => void Linking.openSettings() },
      ]);
    }
  };
  if (poczatek === undefined) return <View style={{ flex: 1, backgroundColor: k.arkusz }} />;
  return (
    <FormularzWloczki t={j.t} poczatek={poczatek} jednostki={imperialny(preferencje.stan().ukladMiar) ? 'imperialne' : 'metryczne'}
      przelicz={(x, u) => przeliczenie(x, u, j)} bazowa={(x, u) => bazowa(x, u, j.jezyk())} formatuj={(n) => formatujLiczbe(n, j.jezyk(), { maks: 2 })}
      naAnuluj={() => router.back()}
      naUsun={id && poczatek ? () => potwierdzUsuniecie(kontener, { nazwa: poczatek.nazwa, przycisk: j.t('usun.wloczka'), alert: Alert.alert,
        usun: () => usunWloczke(z, { wloczkaId: id }), potem: () => router.back() }) : undefined}
      zdjecia={id ? <GrupaZdjec t={j.t} miniatury={miniatury} naWybierz={(zr) => void wybierz(zr)} naOtworz={() => undefined}
        naglowek={j.t('zapas.zdjecie_etykiety')} testID="wloczka-zdjecia" /> : undefined}
      naZapisz={async (d) => {
        const w = await zapiszWloczke(kontener.z, { ...d, id });
        if (!w.ok) return { ok: false, powod: w.powod === 'bledne_dane' ? 'bledne_dane' : 'zapis' };
        router.back();
        return { ok: true, wartosc: undefined };
      }} />
  );
}
