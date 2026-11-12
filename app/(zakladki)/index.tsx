// Trasa „/”: zakładka „Dziś” — pierwszy ekran po każdym zimnym starcie (ZM-18, P-563 (4a); NFR-PIE-001 po ER-68). Tu start danych (`przygotuj()`; błąd → ekran
// awaryjny ADR-0019), import pliku z zimnego startu (206), kamień milowy i korzeń cyklu życia (`Aplikacja`: KP-07, R-020, R-091, blokada wygaszania przy licznik/wzór
// na wierzchu, U11). Start nie otwiera sam licznika, wzoru ani listy: miejsce pracy prowadzi „Kontynuuj ›” (licznik albo wzór w tym samym powiększeniu, BR-PRJ-011 S1)
// albo „Wybierz projekt ›” (P-564, P-565). Okno „Uczciwe zasady” nie otwiera się na „Dziś” (ER-70) — zostaje na liście projektów.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, usePathname, useRouter } from 'expo-router';
import { Aplikacja } from '../../src/ekrany/Aplikacja';
import type { DaneDzis, KafelDzis } from '../../src/ekrany/Dzis';
import { StanWczytywania } from '../../src/ekrany/StanWczytywania';
import { useAplikacja } from '../../src/kompozycja/Kontekst';
import { Bezpieczny } from '../../src/kompozycja/Bezpieczny';
import { cyklAplikacji, oglos, systemAplikacji } from '../../src/kompozycja/system';
import { powodAwaryjny, zapiszKamien } from '../../src/kompozycja/start-aplikacji';
import { odbierzImportPliku, oznaczStartDanych } from '../../src/kompozycja/import-pliku';
import { wczytajDzis } from '../../src/kompozycja/dzis-odczyt';

export default function EkranDzis(): React.ReactElement {
  const { kontener, licznik, naAwarie } = useAplikacja();
  const router = useRouter();
  // U11, M1-audytor-generalny-059: „Dziś” zostaje zamontowane pod licznikiem i wzorem (stos nad zakładkami) — ekran nie gaśnie tylko z licznikiem albo wzorem na wierzchu.
  const sciezka = usePathname();
  const naWierzchu = sciezka === '/licznik' || sciezka === '/wzor';
  const [gotowe, ustawGotowe] = useState(false);
  const [wersja, ustawWersje] = useState(licznik.wersja());
  const [dane, ustawDane] = useState<DaneDzis | null>(null);
  const [plusy, ustawPlusy] = useState(0);
  const [fokus, ustawFokus] = useState(0); // M1-audytor-generalny-240: każdy powrót na „Dziś” czyta dane ponownie (+1 na liczniku nie zmienia `wersja`)
  const uslugi = useMemo(() => ({
    ...licznik.uslugi,
    dodajRzad: async () => {
      const w = await licznik.uslugi.dodajRzad(); // „+1” karty = ten sam przypadek użycia co licznik (ZM-18, ER-68)
      if (w.ok) ustawPlusy((n) => n + 1); // tydzień, pas „dziś” i miejsce po +1
      return w;
    },
  }), [licznik]);
  useEffect(() => {
    let zywy = true;
    void licznik.przygotuj().then((w) => {
      if (!zywy) return;
      if (!w.ok) { naAwarie(powodAwaryjny(w.powod)); return; } // migracja albo baza: ekran awaryjny korzenia, nic po cichu (ADR-0019, M1-074)
      ustawGotowe(true);
      oznaczStartDanych(); // przegląd 206: plik po tej chwili idzie od razu do Ustawień
      const plikImportu = odbierzImportPliku(); // M1-audytor-generalny-206: plik .oczko z zimnego startu — import dopiero po starcie danych
      if (plikImportu !== null) router.push({ pathname: '/ustawienia', params: { import: plikImportu } });
    }, () => { if (zywy) naAwarie(powodAwaryjny('zapis')); }); // M1-007: wyjątek startu danych → ekran awaryjny (ADR-0019), nie pusta plansza
    return () => { zywy = false; };
  }, [licznik, router, kontener, naAwarie]);
  // ADR-0019: kamień milowy po zatwierdzeniu renderu pierwszego ekranu (efekt po narysowaniu).
  useEffect(() => { if (gotowe) void zapiszKamien(); }, [gotowe]);
  useEffect(() => kontener.icloud?.naPartie(() => { void licznik.poZmianie().then(() => ustawWersje(licznik.wersja())); }), [kontener, licznik]);
  useEffect(() => licznik.poDostepie(() => ustawWersje(licznik.wersja())), [licznik]);
  useEffect(() => licznik.poZegarku(() => ustawWersje(licznik.wersja())), [licznik]);
  useFocusEffect(useCallback(() => { ustawWersje(licznik.wersja()); ustawFokus((n) => n + 1); }, [licznik]));
  // Dane spoza karty (tydzień, wolne dni, miejsce, „co dalej”) — tylko istniejące odczyty; błąd odczytu = karta bez tych części (dane null), licznik działa.
  useEffect(() => {
    if (!gotowe) return;
    let zywy = true;
    void wczytajDzis(kontener, licznik).then((d) => { if (zywy) ustawDane(d); }, () => undefined);
    return () => { zywy = false; };
  }, [gotowe, wersja, plusy, fokus, kontener, licznik]);
  // 07-jakosc-001: wyjątek odczytu miejsca = jak błąd odczytu (`m.ok` fałsz): domyślnie licznik, nigdy cisza po stuknięciu.
  const miejsceAlboBlad = (): ReturnType<typeof licznik.miejsce> => licznik.miejsce().catch(() => ({ ok: false as const, powod: 'zapis' as const }));
  async function naKontynuuj(): Promise<void> {
    const m = await miejsceAlboBlad();
    if (m.ok && m.wartosc === 'lista') { router.navigate('/projekty'); return; }
    router.push('/licznik');
    if (m.ok && m.wartosc === 'wzor') router.push('/wzor'); // praca skończyła się na wzorze: licznik pod spodem, „wstecz” wraca na licznik (07-jakosc-006)
  }
  // P-588: „Dodaj wzór” → menu źródeł bieżącego projektu (trasa „/wzor” z `zrodla`, licznik pod spodem, „wstecz” wraca na licznik); bez bieżącego projektu → Projekty.
  async function naDodajWzor(): Promise<void> {
    const m = await miejsceAlboBlad();
    if (!licznik.biezacy() || (m.ok && m.wartosc === 'lista')) { router.navigate('/projekty'); return; }
    router.push('/licznik');
    router.push({ pathname: '/wzor', params: { zrodla: '1' } });
  }
  const naKafel = (x: KafelDzis) => {
    if (x === 'nowy-projekt') router.push({ pathname: '/formularz/[rodzaj]', params: { rodzaj: 'nowy-projekt' } });
    else if (x === 'dodaj-wzor') void naDodajWzor();
    else if (x === 'wloczka') router.navigate('/narzedzia');
    else router.push('/probka');
  };
  if (!gotowe) return <StanWczytywania stan="ladowanie" t={kontener.j.t} przedrostek="licznik" naPonow={() => undefined} />;
  return (
    <Bezpieczny>
      <Aplikacja
        key={wersja}
        naWierzchu={naWierzchu}
        dzisNaWierzchu={sciezka === '/'}
        porty={kontener.porty}
        uslugi={uslugi}
        cykl={cyklAplikacji}
        system={systemAplikacji}
        oglos={oglos}
        t={kontener.j.t}
        jezyk={kontener.j.jezyk()}
        dane={dane}
        dzialania={{ ...licznik.dzialania, naOferty: () => router.push('/oferty') }}
        dzis={{ naKontynuuj: () => void naKontynuuj(), naWybierzProjekt: () => router.navigate('/projekty'), naUstawienia: () => router.push('/ustawienia'), naPrzewodnik: () => router.push('/przewodnik'), naKafel }}
      />
    </Bezpieczny>
  );
}
