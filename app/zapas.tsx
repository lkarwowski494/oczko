// Trasa „/zapas”: lista włóczek (P-191 P8a; BR-ZAP-001, BR-ZAP-004). Odświeżana po powrocie z arkusza włóczki; offline bez zmian (BR-ZAP-004 S2).
import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Zapas } from '../src/ekrany/Zapas';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { Bezpieczny } from '../src/kompozycja/Bezpieczny';
import { imperialny } from '../src/kompozycja/miary';
import { stanZapasu, type FiltrZapasu } from '../src/kompozycja/zapas';
import { zapasZDetalami, type WierszZapasu } from '../src/przypadki-uzycia/zapas';

export default function EkranZapasu(): React.ReactElement {
  const { kontener, preferencje } = useAplikacja();
  const router = useRouter();
  const [lista, ustawListe] = useState<WierszZapasu[]>([]);
  const [zapytanie, ustawZapytanie] = useState('');
  const [filtr, ustawFiltr] = useState<FiltrZapasu>('wszystkie');
  useFocusEffect(useCallback(() => { void zapasZDetalami(kontener.z).then((w) => { if (w.ok) ustawListe(w.wartosc); }); }, [kontener]));
  const stan = stanZapasu(lista, { zapytanie, filtr, imperialny: imperialny(preferencje.stan().ukladMiar), j: kontener.j });
  return (
    <Bezpieczny>
      <Zapas t={kontener.j.t} stan={stan} zapytanie={zapytanie} filtr={filtr} naSzukaj={ustawZapytanie} naFiltr={ustawFiltr}
        naDodaj={() => router.push('/wloczka')} naOtworz={(id) => router.push({ pathname: '/wloczka', params: { id } })} naWstecz={() => router.back()} />
    </Bezpieczny>
  );
}
