// Trasa „/uczciwe-zasady”: okno P-089 (3a). Każde zamknięcie (przycisk, link do planów, gest) zapisuje „widziane” (jak Trening markFairRulesSeen).
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { OknoUczciweZasady } from '../src/ekrany/InformacjePro';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { oznaczOknoWidziane } from '../src/przypadki-uzycia/informacje-pro';

export default function EkranUczciweZasady(): React.ReactElement {
  const { kontener } = useAplikacja();
  const router = useRouter();
  useEffect(() => () => { void oznaczOknoWidziane(kontener.z); }, [kontener]); // gest w dół też zamyka = widziane
  return <OknoUczciweZasady t={kontener.j.t} naZamknij={() => router.back()} naPlany={() => router.replace({ pathname: '/oferty', params: { skad: 'uczciwe-zasady' } })} /* E2-137-A2: oferty wiedzą, że przyszły z okna, i kończą jawnie na liście */ />;
}
