// Trasa „/konflikt”: arkusz wyboru wersji licznika w konflikcie iCloud (partia 7, P-220 I1a, scenariusz 49). Wybory liczy kompozycja przy
// pokazaniu (kandydaci obejmują +1 zrobione w konflikcie, N5); po wyborze licznik przeładowuje się po powrocie (wersja kompozycji).
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { IcloudKonflikt } from '../src/ekrany/IcloudKonflikt';
import { alertBleduZapisu } from '../src/ekrany/blad-zapisu';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import type { WyborKonfliktu } from '../src/kompozycja/licznik';

export default function EkranKonfliktu(): React.ReactElement | null {
  const { kontener, licznik } = useAplikacja();
  const router = useRouter();
  const t = kontener.j.t;
  const [stan, ustaw] = useState<{ nazwa: string; wybory: WyborKonfliktu[] } | null>(null);
  useEffect(() => {
    void (async () => {
      const w = await licznik.widok();
      const wybory = await licznik.konflikt.kandydaci();
      if (!w || wybory.length < 2) { router.back(); return; } // konflikt rozstrzygnięty gdzie indziej
      ustaw({ nazwa: w.nazwa || w.czesc.nazwa || licznik.nazwaProjektu(w), wybory });
    })();
  }, [licznik, router]);
  if (!stan) return null;
  return (
    <IcloudKonflikt t={t} licznik={stan.nazwa} wybory={stan.wybory} naZamknij={() => router.back()}
      naWybor={(glowa) => void licznik.konflikt.wybierz(glowa).then((r) => { if (!r.ok) Alert.alert(...alertBleduZapisu(t, 'formularz')); router.back(); })} />
  );
}
