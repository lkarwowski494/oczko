// Trasa „/narzedzia”: zakładka „Tools” (P-191 P7a; wejście `nav-narzedzia` z paska listy projektów, P-215 (2)). Liczby zapasu i narzędzi
// odświeżane przy każdym wejściu na ekran.
import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Narzedzia } from '../src/ekrany/Narzedzia';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { Bezpieczny } from '../src/kompozycja/Bezpieczny';
import { narzedzia, zapasZDetalami } from '../src/przypadki-uzycia/zapas';

export default function EkranNarzedzi(): React.ReactElement {
  const { kontener } = useAplikacja();
  const router = useRouter();
  const [stan, ustaw] = useState({ wloczki: 0, druty: 0 });
  useFocusEffect(useCallback(() => {
    void Promise.all([zapasZDetalami(kontener.z), narzedzia(kontener.z)]).then(([w, n]) => {
      ustaw({ wloczki: w.ok ? w.wartosc.length : 0, druty: n.ok ? n.wartosc.length : 0 });
    });
  }, [kontener]));
  return (
    <Bezpieczny>
      <Narzedzia stan={stan} t={kontener.j.t} naWloczki={() => router.push('/zapas')} naDruty={() => router.push('/druty')} naProbke={() => router.push('/probka')} naWstecz={() => router.back()} />
    </Bezpieczny>
  );
}
