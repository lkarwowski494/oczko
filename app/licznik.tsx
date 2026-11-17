// Trasa „/licznik” (M3 p2, ZM-18): pełny ekran licznika bez zakładek (WD-1), otwierany z „Dziś” („Kontynuuj ›”, „Otwórz licznik ›”), z listy projektów
// i z ekranu projektu. Start danych i cykl życia (KP-07, R-020, R-091, blokada wygaszania) ma korzeń „Dziś” (app/(zakladki)/index.tsx) pod licznikiem w stosie.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { EkranLicznika } from '../src/ekrany/Aplikacja';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { Bezpieczny } from '../src/kompozycja/Bezpieczny';
import { oglos } from '../src/kompozycja/system';
import { nastepnaCzesc } from '../src/przypadki-uzycia/czesc';
import { SprawdzStopera, StoperLicznika } from '../src/kompozycja/StoperLicznika';
import { bezDiagnostykiLicznika, paneleE2e, ZEGAREK_SZTUCZNY } from '../src/platforma/tryb-e2e';

export default function EkranLicznikaTrasa(): React.ReactElement {
  const aplikacja = useAplikacja();
  const { kontener, licznik } = aplikacja;
  const router = useRouter();
  const diagnostykaWejsc = paneleE2e && !bezDiagnostykiLicznika() ? paneleE2e : null; // BX16 (scen. 122): argument E2E wyłącza panel wejść i jego haki (pomiar bez pracy panelu)
  const [wersja, ustawWersje] = useState(licznik.wersja());
  const [plusy, ustawPlusy] = useState(0); // P-191 P5a: linia „zapomniany stoper” liczona od nowa po każdym udanym +1
  // Build E2E (P-255 (c), NFR-WYD-001): czas od stuknięcia +1 do drugiej klatki po zapisie (nowa wartość na ekranie); w wydaniu bez pomiaru.
  const probki = useRef<number[]>([]);
  const [pomiar, ustawPomiar] = useState<readonly number[]>([]);
  const uslugi = useMemo(() => ({
    ...licznik.uslugi,
    dodajRzad: async () => {
      const t0 = paneleE2e ? performance.now() : 0;
      // BX22 (KO-143): panel wejść wstrzymuje render od `wejscie('plus')`; zwalniamy go po próbce (albo od razu przy błędzie/wyjątku), więc nie liczy się do p95 (scen. 31).
      const zwolnij = diagnostykaWejsc ? diagnostykaWejsc.wznowPowiadomienia : null;
      const w = await licznik.uslugi.dodajRzad().catch((e: unknown) => { zwolnij?.(); throw e; });
      if (w.ok) ustawPlusy((n) => n + 1);
      if (w.ok && paneleE2e) requestAnimationFrame(() => requestAnimationFrame(() => { probki.current.push(performance.now() - t0); ustawPomiar([...probki.current]); zwolnij?.(); }));
      else zwolnij?.();
      return w;
    },
  }), [licznik]);
  const [projektId, ustawProjekt] = useState<string | null>(null); // stoper sesji w pasku (P-191 P1a) — projekt bieżącego licznika
  // Pierwszy +1 na świeżej instalacji tworzy projekt roboczy bez zmiany `wersja` → odczyt także po +1, ale tylko bez projektu (P-262 (c), scenariusz 38).
  const plusyBezProjektu = projektId === null ? plusy : -1;
  useEffect(() => { void licznik.widok().then((w) => ustawProjekt(w ? w.projektId : null)); }, [wersja, licznik, plusyBezProjektu]);
  // Partia z iCloud (partia 7): stan ekranu blokady i licznik od nowa (np. linia konfliktu, P-220 I1a).
  useEffect(() => kontener.icloud?.naPartie(() => { void licznik.poZmianie().then(() => ustawWersje(licznik.wersja())); }), [kontener, licznik]);
  // M1-063 (MON-05): Pro nadane albo zdjęte poza ekranem ofert — kompozycja przeliczyła limit dni → ekran od nowa.
  useEffect(() => licznik.poDostepie(() => ustawWersje(licznik.wersja())), [licznik]);
  // +1 z zegarka scalone przy otwartej aplikacji (07-jakosc-005, ADR-0030): kompozycja podniosła `wersja` po COMMIT — ekran czyta stan od nowa.
  useEffect(() => licznik.poZegarku(() => ustawWersje(licznik.wersja())), [licznik]);
  useFocusEffect(useCallback(() => { ustawWersje(licznik.wersja()); }, [licznik]));
  // „Next part” (BR-LIC-011/S1, P-182 Q4a): następna część → jej licznik (ekran od nowa); ostatnia → arkusz „What’s next?”.
  async function naNastepnaCzesc(): Promise<void> {
    const id = licznik.biezacy();
    if (!id) return;
    const r = await nastepnaCzesc(kontener.z, { licznikId: id });
    if (!r.ok) return;
    if (r.wartosc.rodzaj === 'licznik') { await licznik.otworz(r.wartosc.licznikId); ustawWersje(licznik.wersja()); return; }
    router.push({ pathname: '/formularz/[rodzaj]', params: { rodzaj: 'co-dalej', czesc: r.wartosc.czescId } });
  }
  return (
    <Bezpieczny>
      <EkranLicznika
        key={wersja}
        porty={kontener.porty}
        uslugi={uslugi}
        oglos={oglos}
        t={kontener.j.t}
        poScaleniu={licznik.poScaleniu}
        diagnostyka={diagnostykaWejsc?.diagnostykaLicznika /* FX6b (P-909): liczniki wejść „+1”/„−1” i zapisów, tylko build E2E; bez nich z oczkoE2eBezDiagnostykiLicznika=1 */}
        jezyk={kontener.j.jezyk()}
        dzialania={{ ...licznik.dzialania, naWstecz: () => router.back(), naHistorie: () => router.push('/historia'), naMenu: () => router.push('/menu'), naOferty: () => router.push('/oferty'),
          // Akcje pod liczbą (P-580, P-581): „Wzór” zawsze (bez wzoru /wzor otwiera od razu menu źródeł, ZM-06 p3b), „Notatka” otwiera arkusz bez ekranu projektu, „Cel” — arkusz celu, przypomnienia i powtórzenia.
          naWzor: () => { paneleE2e?.zliczNawigacje('/wzor'); router.push('/wzor'); }, naCel: () => router.push({ pathname: '/menu', params: { arkusz: 'cel' } }),
          naNotatka: () => void licznik.widok().then((w) => { if (w) router.push({ pathname: '/formularz/[rodzaj]', params: { rodzaj: 'notatka', projekt: w.projektId } }); }),
          naProjekt: () => void licznik.widok().then((w) => { if (w) router.push({ pathname: '/projekt/[id]', params: { id: w.projektId } }); }),
          naNastepnaCzesc: () => void naNastepnaCzesc(), naKonflikt: () => router.push('/konflikt') }}
        stoper={projektId ? (
          <StoperLicznika z={kontener.z} j={kontener.j} zrodlo={aplikacja} projektId={projektId} oglos={oglos}
            poZmianie={async () => { await licznik.poZmianie(); ustawWersje(licznik.wersja()); }} />
        ) : null}
        sprawdzStopera={<>
          {projektId ? (
            <SprawdzStopera key={plusy} z={kontener.z} j={kontener.j} projektId={projektId}
              naKorekta={(sesja) => router.push({ pathname: '/sesja-korekta', params: { sesja, projekt: projektId } })} />
          ) : null}
          {paneleE2e ? <paneleE2e.PanelPomiaru probkiMs={pomiar} /> : null /* slot pod kreskami: Licznik.tsx przy limicie 20 KB (U8) */}
          {paneleE2e && ZEGAREK_SZTUCZNY ? <paneleE2e.PanelZegarka /> : null /* scen. 15: stan udawanego zegarka */}
          {paneleE2e ? <paneleE2e.PanelNawigacji /> : null /* BX-019: naciśnięcia „Wzór” i przemontowania tego ekranu (diagnostyka scen. 22) */}
          {diagnostykaWejsc ? <diagnostykaWejsc.PanelLicznika /> : null /* FX6b (P-909): wejścia „+1”/„−1”, zapisy i wartość ze stanu (diagnostyka scen. 69) */}
        </>}
      />
    </Bezpieczny>
  );
}
