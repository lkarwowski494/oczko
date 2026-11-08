// Trasa „/narzedzia”: zakładka „Tools” (P-191 P7a; wejście `nav-narzedzia` z paska listy projektów, P-215 (2)). Liczby zapasu i narzędzi
// odświeżane przy każdym wejściu na ekran.
import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Narzedzia } from '../../src/ekrany/Narzedzia';
import { useAplikacja } from '../../src/kompozycja/Kontekst';
import { Bezpieczny } from '../../src/kompozycja/Bezpieczny';
import { StanWczytywania } from '../../src/ekrany/StanWczytywania';
import { narzedzia, zapasZDetalami } from '../../src/przypadki-uzycia/zapas';

export default function EkranNarzedzi(): React.ReactElement {
  const { kontener } = useAplikacja();
  const router = useRouter();
  const [stan, ustaw] = useState<{ wloczki: number; druty: number } | null>(null); // M1-152: null = jeszcze nie wczytano; nieudany odczyt to błąd, nie „0” (DEV-07)
  const [blad, ustawBlad] = useState(false);
  const wczytaj = useCallback(async () => {
    const r = await Promise.all([zapasZDetalami(kontener.z), narzedzia(kontener.z)]).catch(() => null);
    if (!r || !r[0].ok || !r[1].ok) { ustawBlad(true); return; }
    ustaw({ wloczki: r[0].wartosc.length, druty: r[1].wartosc.length });
    ustawBlad(false);
  }, [kontener]);
  useFocusEffect(useCallback(() => { void wczytaj(); }, [wczytaj]));
  if (!stan) return <Bezpieczny><StanWczytywania wyjscie={{ rodzaj: 'wstecz', naWyjdz: () => router.back() }} stan={blad ? 'blad' : 'ladowanie'} t={kontener.j.t} przedrostek="narzedzia" naPonow={() => { ustawBlad(false); void wczytaj(); }} /></Bezpieczny>;
  return (
    <Bezpieczny>
      <Narzedzia stan={stan} t={kontener.j.t} naWloczki={() => router.push('/zapas')} naDruty={() => router.push('/druty')} naProbke={() => router.push('/probka')} naWstecz={() => router.back()} />
    </Bezpieczny>
  );
}
