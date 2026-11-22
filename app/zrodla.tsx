// Trasa „/zrodla”: ekran „Źródła wiedzy” z Ustawień (BR-KAL-008, design-spec „Ekran «Źródła wiedzy»”); bez sieci.
import React from 'react';
import { useRouter } from 'expo-router';
import { ZrodlaWiedzy } from '../src/ekrany/ZrodlaWiedzy';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { Bezpieczny } from '../src/kompozycja/Bezpieczny';

export default function EkranZrodel(): React.ReactElement {
  const { kontener } = useAplikacja();
  const router = useRouter();
  return <Bezpieczny><ZrodlaWiedzy t={kontener.j.t} naWstecz={() => router.back()} /></Bezpieczny>;
}
