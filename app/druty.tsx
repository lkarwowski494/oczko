// Trasa „/druty”: druty i szydełka (P-191 P8a; BR-ZAP-003, RD-11, RD-19). Odświeżana po powrocie z arkusza.
import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ListaDrutow } from '../src/ekrany/Zapas';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { Bezpieczny } from '../src/kompozycja/Bezpieczny';
import { stanDrutow, type StanDrutow } from '../src/kompozycja/zapas';
import { narzedzia } from '../src/przypadki-uzycia/zapas';

export default function EkranDrutow(): React.ReactElement {
  const { kontener } = useAplikacja();
  const router = useRouter();
  const [stan, ustaw] = useState<StanDrutow>({ grupy: [] });
  useFocusEffect(useCallback(() => { void narzedzia(kontener.z).then((w) => { if (w.ok) ustaw(stanDrutow(w.wartosc, kontener.j)); }); }, [kontener]));
  return (
    <Bezpieczny>
      <ListaDrutow t={kontener.j.t} stan={stan} naDodaj={() => router.push('/drut')} naOtworz={(id) => router.push({ pathname: '/drut', params: { id } })} naWstecz={() => router.back()} />
    </Bezpieczny>
  );
}
