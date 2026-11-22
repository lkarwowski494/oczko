// Trasa „/licencje”: ekran „Open source licenses” z Ustawień (M1-245, P-661); bez sieci, dane z modułu wygenerowanego w paczce.
import React from 'react';
import { useRouter } from 'expo-router';
import { Licencje } from '../src/ekrany/Licencje';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { Bezpieczny } from '../src/kompozycja/Bezpieczny';

export default function EkranLicencji(): React.ReactElement {
  const { kontener } = useAplikacja();
  const router = useRouter();
  return <Bezpieczny><Licencje t={kontener.j.t} naWstecz={() => router.back()} /></Bezpieczny>;
}
