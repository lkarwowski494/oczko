// Trasa „/konflikt”: arkusz wyboru wersji licznika w konflikcie iCloud (partia 7, P-220 I1a, scenariusz 49). Wybory liczy kompozycja przy
// pokazaniu (kandydaci obejmują +1 zrobione w konflikcie, N5); po wyborze licznik przeładowuje się po powrocie (wersja kompozycji).
import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { IcloudKonflikt } from '../src/ekrany/IcloudKonflikt';
import { StanWczytywania } from '../src/ekrany/StanWczytywania';
import { alertBleduZapisu } from '../src/ekrany/blad-zapisu';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import type { WyborKonfliktu } from '../src/kompozycja/licznik';

export default function EkranKonfliktu(): React.ReactElement {
  const { kontener, licznik } = useAplikacja();
  const router = useRouter();
  const t = kontener.j.t;
  const [stan, ustaw] = useState<{ nazwa: string; wybory: WyborKonfliktu[] } | null>(null);
  const [blad, ustawBlad] = useState(false); // M1-007: brak widoku licznika (odczyt nieudany) albo wyjątek → błąd z „Try again”, nie pusty arkusz
  const wczytaj = useCallback(async () => {
    const w = await licznik.widok().catch(() => null);
    const wybory = w ? await licznik.konflikt.kandydaci().catch(() => null) : null;
    if (!w || !wybory) { ustawBlad(true); return; }
    if (wybory.length < 2) { router.back(); return; } // konflikt rozstrzygnięty gdzie indziej
    ustaw({ nazwa: w.nazwa || w.czesc.nazwa || licznik.nazwaProjektu(w), wybory });
  }, [licznik, router]);
  useEffect(() => { void wczytaj(); }, [wczytaj]);
  if (!stan) return <StanWczytywania stan={blad ? 'blad' : 'ladowanie'} t={t} przedrostek="konflikt" naPonow={() => { ustawBlad(false); void wczytaj(); }} />;
  return (
    <IcloudKonflikt t={t} licznik={stan.nazwa} wybory={stan.wybory} naZamknij={() => router.back()}
      naWybor={(glowa) => void licznik.konflikt.wybierz(glowa).then((r) => { if (!r.ok) Alert.alert(...alertBleduZapisu(t, 'formularz')); router.back(); })} />
  );
}
