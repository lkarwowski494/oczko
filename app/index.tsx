// Trasa „/”: ekran licznika (pierwszy ekran, NFR-PIE-001; powrót do miejsca F-49). Gdy zapamiętane miejsce jest w koszu, lista projektów (moduly.md:238).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, usePathname, useRouter } from 'expo-router';
import { Aplikacja } from '../src/ekrany/Aplikacja';
import { useKolory } from '../src/ekrany/motyw';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { Bezpieczny } from '../src/kompozycja/Bezpieczny';
import { cyklAplikacji, oglos, systemAplikacji } from '../src/kompozycja/system';
import { nastepnaCzesc } from '../src/przypadki-uzycia/czesc';
import { SprawdzStopera, StoperLicznika } from '../src/kompozycja/StoperLicznika';
import { powodAwaryjny, zapiszKamien } from '../src/kompozycja/start-aplikacji';
import { listaWzorow } from '../src/przypadki-uzycia/wzor';
import { paneleE2e, ZEGAREK_SZTUCZNY } from '../src/platforma/tryb-e2e';

export default function EkranLicznika(): React.ReactElement {
  const aplikacja = useAplikacja();
  const { kontener, licznik, naAwarie } = aplikacja;
  const router = useRouter();
  const k = useKolory();
  // U11, M1-audytor-generalny-059: licznik zostaje zamontowany pod listą projektów, Ustawieniami i Narzędziami (`router.push`), więc blokada
  // wygaszania zależy od trasy na wierzchu: licznik albo wzór (także otwarty z projektu; P-284 (2)).
  const sciezka = usePathname();
  const naWierzchu = sciezka === '/' || sciezka === '/wzor';
  const [gotowe, ustawGotowe] = useState(false);
  const [wersja, ustawWersje] = useState(licznik.wersja());
  const [plusy, ustawPlusy] = useState(0); // P-191 P5a: linia „zapomniany stoper” liczona od nowa po każdym udanym +1
  // Build E2E (P-255 (c), NFR-WYD-001): czas od stuknięcia +1 do drugiej klatki po zapisie (nowa wartość na ekranie); w wydaniu bez pomiaru.
  const probki = useRef<number[]>([]);
  const [pomiar, ustawPomiar] = useState<readonly number[]>([]);
  const uslugi = useMemo(() => ({
    ...licznik.uslugi,
    dodajRzad: async () => {
      const t0 = paneleE2e ? performance.now() : 0;
      const w = await licznik.uslugi.dodajRzad();
      if (w.ok) ustawPlusy((n) => n + 1);
      if (w.ok && paneleE2e) requestAnimationFrame(() => requestAnimationFrame(() => { probki.current.push(performance.now() - t0); ustawPomiar([...probki.current]); }));
      return w;
    },
  }), [licznik]);
  const [projektId, ustawProjekt] = useState<string | null>(null); // stoper sesji w pasku (P-191 P1a) — projekt bieżącego licznika
  // Pierwszy +1 na świeżej instalacji tworzy projekt roboczy bez zmiany `wersja` → odczyt także po +1, ale tylko bez projektu (P-262 (c), scenariusz 38).
  const plusyBezProjektu = projektId === null ? plusy : -1;
  useEffect(() => { if (gotowe) void licznik.widok().then((w) => ustawProjekt(w ? w.projektId : null)); }, [gotowe, wersja, licznik, plusyBezProjektu]);
  const [maWzor, ustawMaWzor] = useState(false); // ikona „Pattern” tylko z wzorem (P-220 W2a)
  useFocusEffect(useCallback(() => { if (projektId) void listaWzorow(kontener.z, { projektId }).then((l) => ustawMaWzor(l.ok && l.wartosc.length > 0)); else ustawMaWzor(false); }, [projektId, kontener]));
  // Partia z iCloud (partia 7): stan ekranu blokady i licznik od nowa (np. linia konfliktu, P-220 I1a).
  useEffect(() => kontener.icloud?.naPartie(() => { void licznik.poZmianie().then(() => ustawWersje(licznik.wersja())); }), [kontener, licznik]);
  // +1 z zegarka scalone przy otwartej aplikacji (07-jakosc-005, ADR-0030): kompozycja podniosła `wersja` po COMMIT — ekran czyta stan od nowa.
  useEffect(() => licznik.poZegarku(() => ustawWersje(licznik.wersja())), [licznik]);
  useEffect(() => {
    let zywy = true;
    void licznik.przygotuj().then((w) => {
      if (!zywy) return;
      if (!w.ok) { naAwarie(powodAwaryjny(w.powod)); return; } // migracja albo baza: ekran awaryjny korzenia, nic po cichu (ADR-0019, M1-074)
      ustawGotowe(true);
      if (w.ok && w.wartosc.cel === 'lista') router.push('/projekty');
      if (w.ok && w.wartosc.cel === 'wzor') router.push('/wzor'); // praca skończyła się na wzorze: licznik zostaje pod spodem, „wstecz” wraca na licznik (07-jakosc-006)
      // Okno „Uczciwe zasady” nie otwiera się na liczniku (BR-ZAK-006, ER-46, O-05, 07-jakosc-022): pierwsze miejsce to lista projektów (app/projekty.tsx).
    }, () => { if (zywy) naAwarie(powodAwaryjny('zapis')); }); // M1-007: wyjątek startu danych jak `{ ok: false }` — ekran awaryjny (ADR-0019), nie pusta plansza
    return () => { zywy = false; };
  }, [licznik, router, kontener, naAwarie]);
  // ADR-0019: kamień milowy po zatwierdzeniu renderu licznika (efekt po narysowaniu); wyjątek w renderze pierwszego ekranu → bez kamienia (rola 12 E2).
  useEffect(() => { if (gotowe) void zapiszKamien(); }, [gotowe]);
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
  if (!gotowe) return <View style={{ flex: 1, backgroundColor: k.papier }} />;
  return (
    <Bezpieczny>
      <Aplikacja
        key={wersja}
        naWierzchu={naWierzchu}
        porty={kontener.porty}
        uslugi={uslugi}
        cykl={cyklAplikacji}
        system={systemAplikacji}
        oglos={oglos}
        t={kontener.j.t}
        dzialania={{ ...licznik.dzialania, naProjekty: () => router.push('/projekty'), naHistorie: () => router.push('/historia'), naWzor: maWzor ? () => router.push('/wzor') : undefined, naMenu: () => router.push('/menu'), naOferty: () => router.push('/oferty'),
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
        </>}
      />
    </Bezpieczny>
  );
}
