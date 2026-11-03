// Trasa „/zdjecie?projekt=…&i=…”: podgląd zdjęć projektu na czarnym tle (P-191 P9a). Usunięcie po potwierdzeniu (alert systemowy, bez kosza);
// po usunięciu ostatniego zdjęcia powrót do projektu. „Share”: kopia bez metadanych i GPS w katalogu tymczasowym (P-219 2A), arkusz systemowy.
import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { PodgladZdjec, type Miniatura } from '../src/ekrany/Zdjecia';
import { alertBleduZapisu } from '../src/ekrany/blad-zapisu';
import { StanWczytywania } from '../src/ekrany/StanWczytywania';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { zapisano } from '../src/kompozycja/po-zapisie';
import { usunZdjecie, zdjecia } from '../src/przypadki-uzycia/zdjecia';
import { zaleznosciObrazu } from '../src/kompozycja/obrazy-aplikacji';
import { zdjecieBezMetadanych } from '../src/kompozycja/zdjecie-bez-metadanych';
import { usunPlik } from '../src/dane/pliki/system';
import { udostepnijPlik } from '../src/platforma/system-plikow-uzytkownika';

export default function EkranZdjecia(): React.ReactElement {
  const aplikacja = useAplikacja();
  const { kontener } = aplikacja;
  const { projekt, i } = useLocalSearchParams<{ projekt: string; i?: string }>();
  const router = useRouter();
  const z = kontener.z, t = kontener.j.t;
  const [lista, ustaw] = useState<(Miniatura & { sha: string })[] | null>(null);
  const [blad, ustawBlad] = useState(false); // M1-007: odczyt `{ ok: false }` albo wyjątek → błąd z „Try again” (wcześniej powrót bez słowa albo czarna plansza)
  const wczytaj = useCallback(async () => {
    const w = await zdjecia(z, { projektId: projekt }).catch(() => null);
    if (!w?.ok) { ustawBlad(true); return; }
    const l = w.wartosc.map((x) => ({ id: x.id, sha: x.sha256, uri: `file://${z.magazyn.sciezka(x.sha256)}` }));
    if (l.length === 0) { router.back(); return; }
    ustaw(l);
    ustawBlad(false);
  }, [z, projekt, router]);
  useFocusEffect(useCallback(() => { void wczytaj(); }, [wczytaj]));
  if (!lista) return <StanWczytywania wyjscie={{ rodzaj: 'zamknij', naWyjdz: () => router.back() }} tlo="czarne" stan={blad ? 'blad' : 'ladowanie'} t={t} przedrostek="zdjecie" naPonow={() => { ustawBlad(false); void wczytaj(); }} />;
  return (
    <PodgladZdjec t={t} zdjecia={lista} poczatek={Number(i ?? 0) || 0} naZamknij={() => router.back()}
      naUdostepnij={(id) => void (async () => {
        const sha = lista.find((x) => x.id === id)?.sha;
        if (!sha) return;
        const czysty = await zdjecieBezMetadanych(z.magazyn.sciezka(sha), zaleznosciObrazu(z.katalogi.tymczasowy, z.id.nowy)).catch(() => null);
        if (!czysty) { Alert.alert(...alertBleduZapisu(t, 'udostepnienie')); return; } // M1-120
        await udostepnijPlik(czysty.sciezka, 'image/jpeg');
        usunPlik(czysty.sciezka);
      })()}
      naUsun={(id) => void usunZdjecie(z, { zdjecieId: id }).then(async (r) => { if (zapisano(aplikacja, r)) await wczytaj(); })} // M1-006
      potwierdz={(tytul, opis, przycisk, f) => Alert.alert(tytul, opis, [{ text: t('wspolne.anuluj'), style: 'cancel' }, { text: przycisk, style: 'destructive', onPress: f }])} />
  );
}
