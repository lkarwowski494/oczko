// Trasa „/jezyk”: Ustawienia › Język (F-36, BR-ZAK-004, P-190). Wybór zapisany w `ustawienie.jezyk` przed zmianą języka (ADR-0017, P-075 (3b)),
// działa od razu (kontekst przerenderowuje ekrany) i wraca do Ustawień. Nieudany zapis: język bez zmian, ekran zostaje (wpis w `blad` robi operacjaZapisu).
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { WyborJezyka } from '../src/ekrany/Jezyk';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { Bezpieczny } from '../src/kompozycja/Bezpieczny';
import { otworzUstawieniaSystemu } from '../src/kompozycja/system';

export default function EkranJezyka(): React.ReactElement {
  const { kontener } = useAplikacja();
  const router = useRouter();
  const [wybrany, ustaw] = useState(kontener.j.preferencja());
  return (
    <Bezpieczny>
      <WyborJezyka t={kontener.j.t} wybrany={wybrany} naWstecz={() => router.back()} naUstawieniaIos={otworzUstawieniaSystemu}
        naWybierz={(p) => void kontener.j.ustawJezyk(p).then(() => { ustaw(p); router.back(); }, () => undefined)} />
    </Bezpieczny>
  );
}
