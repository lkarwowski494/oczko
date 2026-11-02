// Trasa „/dni”: ekran „History” (F-59; BR-DNI-001–003; P-191 P6a) — kalendarz miesiąca, wybrany dzień (domyślnie dziś), tydzień i miesiąc.
// Zmiana miesiąca strzałką przenosi wybór na 1. dzień miesiąca albo dziś w bieżącym; projekt dnia otwiera ekran projektu (BR-DNI-002).
import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { HistoriaDni, type StanHistorii } from '../src/ekrany/HistoriaDni';
import { StanWczytywania } from '../src/ekrany/StanWczytywania';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { Bezpieczny } from '../src/kompozycja/Bezpieczny';
import { stanHistorii } from '../src/kompozycja/historia';
import { widokHistorii } from '../src/przypadki-uzycia/historia';

const przesun = (miesiac: string, o: number): string => {
  const d = new Date(Date.UTC(Number(miesiac.slice(0, 4)), Number(miesiac.slice(5, 7)) - 1 + o, 1));
  return d.toISOString().slice(0, 7);
};

export default function EkranHistoriiDni(): React.ReactElement {
  const { kontener } = useAplikacja();
  const router = useRouter();
  const dzis = kontener.z.zegar.teraz().dzien;
  const [wybor, ustawWybor] = useState({ miesiac: dzis.slice(0, 7), dzien: dzis });
  const [stan, ustaw] = useState<StanHistorii | null>(null);
  const [blad, ustawBlad] = useState(false); // M1-007: odczyt `{ ok: false }` albo wyjątek → błąd z „Try again”, nie pusta plansza
  const wczytaj = useCallback(async () => {
    const w = await widokHistorii(kontener.z, wybor).catch(() => null);
    if (!w?.ok) { ustawBlad(true); return; }
    const ch = kontener.z.zegar.teraz();
    ustaw(stanHistorii(w.wartosc, { j: kontener.j, miesiac: wybor.miesiac, wybrany: wybor.dzien, dzis, terazMs: ch.ms, strefa: ch.strefa }));
    ustawBlad(false);
  }, [kontener, wybor, dzis]);
  useFocusEffect(useCallback(() => { void wczytaj(); }, [wczytaj]));
  if (!stan) return <Bezpieczny><StanWczytywania stan={blad ? 'blad' : 'ladowanie'} t={kontener.j.t} przedrostek="dni" naPonow={() => { ustawBlad(false); void wczytaj(); }} /></Bezpieczny>;
  const miesiac = (o: number) => { const m = przesun(wybor.miesiac, o); ustawWybor({ miesiac: m, dzien: m === dzis.slice(0, 7) ? dzis : `${m}-01` }); };
  return (
    <Bezpieczny>
      <HistoriaDni stan={stan} t={kontener.j.t} naWstecz={() => router.back()}
        naWybierz={(d) => ustawWybor((w) => ({ ...w, dzien: d }))} naPoprzedni={() => miesiac(-1)} naNastepny={() => miesiac(1)}
        naProjekt={(id) => router.push({ pathname: '/projekt/[id]', params: { id } })} />
    </Bezpieczny>
  );
}
