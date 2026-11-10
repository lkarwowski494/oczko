// Trasa „/przewodnik” (KO-027, P-686): przewodnik po funkcjach z „Dziś” (symbol z podpisem obok zębatki) i z Ustawień; wypchnięty na stos, bez zakładek.
// Przeczytane z `ustawienie.przewodnik_przeczytane` (P-688, P-690); „Pokaż” (P-687, P-691): zakładka → zamknięcie stosu i przejście (Trening `app/guide.tsx:21`),
// inny ekran → push (wstecz wraca do przewodnika), Ustawienia → dismissTo (Q-001); licznik, wzór i projekt z ostatniego miejsca pracy, bez niego trasa zapasowa z treści 04.
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Przewodnik } from '../src/ekrany/Przewodnik';
import { alertBleduZapisu } from '../src/ekrany/blad-zapisu';
import { celPokaz, type FunkcjaPrzewodnika, type KrokPrzewodnika } from '../src/domena/przewodnik';
import { LIMIT_DNI_W_MIESIACU } from '../src/konfiguracja';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { Bezpieczny } from '../src/kompozycja/Bezpieczny';
import { oznaczPrzeczytana, przeczytanePrzewodnika } from '../src/przypadki-uzycia/przewodnik';

export default function EkranPrzewodnika(): React.ReactElement {
  const { kontener, licznik } = useAplikacja();
  const router = useRouter();
  const t = kontener.j.t;
  const [przeczytane, ustawPrzeczytane] = useState<readonly string[]>([]);
  const [otwarta, ustawOtwarta] = useState<string | null>(null);
  useEffect(() => { // przeczytane zmienia tylko ten ekran — odczyt raz przy otwarciu
    void przeczytanePrzewodnika(kontener.z).then((w) => { if (w.ok) ustawPrzeczytane(w.wartosc); });
  }, [kontener]);

  function naRozwin(id: string | null): void {
    ustawOtwarta(id);
    if (id === null || przeczytane.includes(id)) return;
    void oznaczPrzeczytana(kontener.z, id).then((w) => { if (w.ok) ustawPrzeczytane(w.wartosc); else Alert.alert(...alertBleduZapisu(t, 'ustawienia')); });
  }

  async function naPokaz(c: KrokPrzewodnika | FunkcjaPrzewodnika): Promise<void> {
    if (c.trasa === null) return;
    const licznikId = licznik.biezacy();
    const w = licznikId === null ? null : await licznik.widok();
    const cel = celPokaz({ trasa: c.trasa, zapas: c.zapas }, { licznikId, projektId: w?.projektId ?? null });
    if (cel.rodzaj === 'zakladka') {
      if (router.canDismiss()) router.dismissAll();
      router.navigate(cel.sciezka);
    } else if (cel.sciezka === '/projekt/[id]' && cel.id !== undefined) router.push({ pathname: cel.sciezka, params: { id: cel.id } });
    else if (cel.sciezka === '/ustawienia') router.dismissTo(cel.sciezka); // Q-001: przewodnik z Ustawień → wraca do istniejącej trasy, bez drugiej kopii na stosie (z „Dziś” stos jej nie ma, więc trafia na stos)
    else router.push(cel.sciezka);
  }

  return (
    <Bezpieczny>
      <Przewodnik t={t} jezyk={kontener.j.jezyk()} przeczytane={przeczytane} parametry={{ limit: LIMIT_DNI_W_MIESIACU }} otwarta={otwarta}
        naRozwin={naRozwin} naPokaz={(c) => void naPokaz(c)} naWstecz={() => router.back()} />
    </Bezpieczny>
  );
}
