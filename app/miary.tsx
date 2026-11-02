// Trasa „/miary”: Ustawienia › Units (ADR-0029, BR-KAL-003/S6). Wybór zapisany w `ustawienie.uklad_miar` (migawka zmienia się po COMMIT), potem powrót do Ustawień.
// Nieudany zapis: układ bez zmian, ekran zostaje i jest komunikat `licznik.blad_zapisu` (wpis w `blad` robi operacjaZapisu).
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { WyborMiar } from '../src/ekrany/Miary';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { Bezpieczny } from '../src/kompozycja/Bezpieczny';

export default function EkranMiar(): React.ReactElement {
  const { kontener, preferencje } = useAplikacja();
  const router = useRouter();
  const t = kontener.j.t;
  const [wybrany, ustaw] = useState(preferencje.stan().ukladMiar);
  return (
    <Bezpieczny>
      <WyborMiar t={t} wybrany={wybrany} naWstecz={() => router.back()}
        naWybierz={(p) => void preferencje.zapisz(kontener.z, { ukladMiar: p }).then((w) => {
          if (!w.ok) { Alert.alert(t('ustawienia.uklad_miar'), t('licznik.blad_zapisu')); return; }
          ustaw(p);
          router.back();
        })} />
    </Bezpieczny>
  );
}
