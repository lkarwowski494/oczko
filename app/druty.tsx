// Trasa „/druty”: druty i szydełka (P-191 P8a; BR-ZAP-003, RD-11, RD-19). Odświeżana po powrocie z arkusza.
import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ListaDrutow } from '../src/ekrany/Zapas';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { Bezpieczny } from '../src/kompozycja/Bezpieczny';
import { StanWczytywania } from '../src/ekrany/StanWczytywania';
import { stanDrutow, type StanDrutow } from '../src/kompozycja/zapas';
import { narzedzia } from '../src/przypadki-uzycia/zapas';

export default function EkranDrutow(): React.ReactElement {
  const { kontener } = useAplikacja();
  const router = useRouter();
  const [stan, ustaw] = useState<StanDrutow | null>(null); // M1-152: null = jeszcze nie wczytano („Loading…”), nie „druty.pusto”
  const [blad, ustawBlad] = useState(false); // M1-152: odczyt `{ ok: false }` albo wyjątek → błąd z „Try again” i „Back”
  const wczytaj = useCallback(async () => {
    const w = await narzedzia(kontener.z).catch(() => null);
    if (!w?.ok) { ustawBlad(true); return; }
    ustaw(stanDrutow(w.wartosc, kontener.j));
    ustawBlad(false);
  }, [kontener]);
  useFocusEffect(useCallback(() => { void wczytaj(); }, [wczytaj]));
  if (!stan) return <Bezpieczny><StanWczytywania wyjscie={{ rodzaj: 'wstecz', naWyjdz: () => router.back() }} stan={blad ? 'blad' : 'ladowanie'} t={kontener.j.t} przedrostek="druty" naPonow={() => { ustawBlad(false); void wczytaj(); }} /></Bezpieczny>;
  return (
    <Bezpieczny>
      <ListaDrutow t={kontener.j.t} stan={stan} naDodaj={() => router.push('/drut')} naOtworz={(id) => router.push({ pathname: '/drut', params: { id } })} naWstecz={() => router.back()} />
    </Bezpieczny>
  );
}
