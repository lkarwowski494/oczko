// Korzeń nawigacji expo-router (P-114 Q1a, jak Trening; wiersz w ADR-0016): strażnik startu (ADR-0019) przed bazą, potem kontener zależności
// raz na proces i stos ekranów bez paska systemowego (pasek rysuje ekran według design-spec). Do kontenera nic nie jest pokazywane poza tłem
// papieru — pierwszy ekran to licznik (NFR-PIE-001); pętla nieudanych startów albo baza nie do otwarcia → ekran awaryjny.
import React, { useEffect, useState } from 'react';
import { AppState, Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import type { PowodTrybuAwaryjnego } from '../src/ekrany/TrybAwaryjny';
import { EkranAwaryjny } from '../src/kompozycja/EkranAwaryjny';
import { powodAwaryjny, rozpocznijStart, zapiszEtap, zapiszWyjscieDoTla } from '../src/kompozycja/start-aplikacji';
import { tAwaryjny } from '../src/kompozycja/jezyk-awaryjny';
import { DostawcaAplikacji, type Aplikacja } from '../src/kompozycja/Kontekst';
import { Bezpieczny } from '../src/kompozycja/Bezpieczny';
import { utworzKontener } from '../src/kompozycja/kontener';
import { kompozycjaLicznika } from '../src/kompozycja/licznik';
import { preferencje } from '../src/kompozycja/preferencje';
import { useKolory } from '../src/ekrany/motyw';
import { zainstalujObslugeBledow } from '../src/kompozycja/bledy-js';
import { paneleE2e } from '../src/platforma/tryb-e2e';
import { orientacjaEkranu } from '../src/domena/uklad';
import { SKLEP_LIMIT_MS } from '../src/konfiguracja';
import { wKolejce } from '../src/przypadki-uzycia/kolejka';
import { zapiszBlad } from '../src/dane/repozytoria/bledy';

// Globalna obsługa błędów JS (ADR-0018, P-194 Q4a): od startu procesu; zapis do `blad` dopiero po otwarciu bazy w starcie normalnym,
// w trybie awaryjnym bez zapisu (ADR-0019) — błąd zawsze idzie do poprzedniego handlera.
const obslugaBledow = typeof ErrorUtils === 'undefined' ? null : zainstalujObslugeBledow(ErrorUtils);
const IPAD = Platform.OS === 'ios' && Platform.isPad; // iPad: dowolna orientacja wszędzie (multitasking; P-218 Q3a)

type Faza = { rodzaj: 'czeka' } | { rodzaj: 'awaria-e2e' } | { rodzaj: 'awaryjny'; powod: PowodTrybuAwaryjnego } | { rodzaj: 'gotowe'; a: Aplikacja };

export default function Korzen(): React.ReactElement {
  const k = useKolory();
  const [faza, ustaw] = useState<Faza>({ rodzaj: 'czeka' });
  const [proba, ustawProbe] = useState(0); // „Spróbuj normalnie”: start normalny w tym samym procesie
  useEffect(() => {
    let koniecNasluchu: (() => void) | null = null;
    let koniecTla: (() => void) | null = null;
    let zamknijLicznik: (() => void) | null = null;
    let zywy = true;
    async function normalny(): Promise<void> {
      // P-271 (Trening L-029): wyjście do tła przed kamieniem nie jest awarią (start awaryjny i wymuszona awaria E2E nie słuchają — scen. 09).
      const tlo = AppState.addEventListener('change', (st) => { if (st === 'background') void zapiszWyjscieDoTla(); });
      koniecTla = () => tlo.remove();
      const w = await utworzKontener().catch(() => null);
      if (!zywy) return;
      if (!w || !w.ok) { ustaw({ rodzaj: 'awaryjny', powod: powodAwaryjny(w && !w.ok ? w.powod : 'zapis') }); return; } // bez zastępczej bazy (ADR-0019)
      zapiszEtap('kontener'); // P-271: diagnostyka etapu dla „Zgłoś problem”
      const p = preferencje();
      const koniecDostepu = w.wartosc.dostep.nasluchuj(); // KP-07: nasłuch transakcji od startu
      const koniecSieci = w.wartosc.wzor.k.obserwujSiec(w.wartosc.porty.siec); // ADR-0031 pkt 4: sieć wróciła → strony czekające w skrzynce zapisują się same
      koniecNasluchu = () => { koniecDostepu(); koniecSieci(); };
      // Limit dni liczony z bieżącym dostępem już przy pierwszym ekranie; sklep bez odpowiedzi w SKLEP_LIMIT_MS → pamięć offline (M1-022, P-396).
      await w.wartosc.dostep.odswiez(SKLEP_LIMIT_MS);
      if (!zywy) return;
      const z = w.wartosc.z;
      await p.wczytaj(z); // ADR-0029: preferencje urządzenia z bazy przed pierwszym ekranem licznika i narzędzi
      if (!zywy) return;
      obslugaBledow?.ustawZapis(async (b) => { await wKolejce(z.baza, () => zapiszBlad(z.baza, { czasMs: z.zegar.teraz().ms, kod: b.kod, szczegoly: { ramki: b.szczegoly.ramki, fatal: b.szczegoly.fatal ? 1 : 0 } })); });
      const licznik = kompozycjaLicznika(w.wartosc.z, w.wartosc.j, { wibracje: () => p.stan().wibracje, aplikacjaAktywna: () => AppState.currentState === 'active', ekranWlaczony: () => p.stan().ekranNieGasnie, icloud: w.wartosc.icloud?.sterownik, skrzynka: { start: () => w.wartosc.wzor.k.poStarcie(), migawka: () => w.wartosc.wzor.k.odswiezMigawke() } });
      zamknijLicznik = () => licznik.zamknij(); // odpięcie `Zegarek.odbieraj` przy zniszczeniu kontenera (ADR-0030 pkt 1)
      // M1-022: wynik sklepu po limicie (albo z nasłuchu KP-07) zmienia Pro → licznik przelicza limit dni bez ponownego startu.
      let proNaStarcie = w.wartosc.dostep.stan().pro;
      const koniecZmianDostepu = w.wartosc.dostep.naZmiane((st) => { if (st.pro !== proNaStarcie) { proNaStarcie = st.pro; void licznik.poZmianie().catch(() => undefined); } });
      const koniecNasluchuStartu = koniecNasluchu;
      koniecNasluchu = () => { koniecNasluchuStartu?.(); koniecZmianDostepu(); };
      ustaw({ rodzaj: 'gotowe', a: { kontener: w.wartosc, licznik, preferencje: p } });
    }
    async function start(): Promise<void> {
      if (proba > 0) { await normalny(); return; }
      const tryb = await rozpocznijStart();
      if (!zywy) return;
      if (tryb.tryb === 'awaryjny') { obslugaBledow?.ustawZapis(null); ustaw({ rodzaj: 'awaryjny', powod: tryb.powod }); }
      else if (tryb.tryb === 'awaria-e2e') ustaw({ rodzaj: 'awaria-e2e' });
      else await normalny();
    }
    // M1-007: wyjątek w starcie (strażnik, odczyt dostępu albo preferencji) → ekran awaryjny jak przy nieudanym kontenerze (ADR-0019), nie pusta plansza na zawsze.
    const uruchom = () => void start().catch(() => { if (zywy) ustaw({ rodzaj: 'awaryjny', powod: powodAwaryjny('zapis') }); });
    // ADR-0019: liczy się tylko start na pierwszym planie (intencja, CloudKit i zegarek budzą proces w tle).
    if (AppState.currentState === 'active') uruchom();
    else {
      const sub = AppState.addEventListener('change', (st) => { if (st === 'active') { sub.remove(); uruchom(); } });
      return () => { zywy = false; sub.remove(); koniecNasluchu?.(); koniecTla?.(); zamknijLicznik?.(); };
    }
    return () => { zywy = false; koniecNasluchu?.(); koniecTla?.(); zamknijLicznik?.(); };
  }, [proba]);
  if (faza.rodzaj === 'awaryjny') return <EkranAwaryjnyZJezykiem powod={faza.powod} naNormalnie={() => { ustaw({ rodzaj: 'czeka' }); ustawProbe((n) => n + 1); }} />;
  // Build E2E: znacznik po zapisie „start w toku” (scenariusz 09 czeka na niego, zanim zabije proces; E2E 40306542928).
  if (faza.rodzaj === 'awaria-e2e') return paneleE2e ? <paneleE2e.ZnacznikAwarii kolor={k.papier} /> : <View style={{ flex: 1, backgroundColor: k.papier }} />;
  if (faza.rodzaj !== 'gotowe') return <View style={{ flex: 1, backgroundColor: k.papier }} />;
  const a = faza.a;
  return (
    <DostawcaAplikacji wartosc={a}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: k.papier }, orientation: orientacjaEkranu('inny', IPAD) }}>
        {/* Orientacja deklarowana w nawigacji (P-221 Q3a, P-259 A): obrót tylko poza maską — start w pionie bez żądania obrotu (P-258). */}
        <Stack.Screen name="wzor" options={{ orientation: orientacjaEkranu('wzor', IPAD) }} />
        {/* Arkusze systemowe (design-spec „Komponenty”): historia, menu •••, formularze, karta ukończenia. */}
        <Stack.Screen name="historia" options={{ presentation: 'modal' }} />
        <Stack.Screen name="menu" options={{ presentation: 'modal' }} />
        <Stack.Screen name="formularz/[rodzaj]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="ukonczenie" options={{ presentation: 'modal', gestureEnabled: false }} />
        <Stack.Screen name="oferty" options={{ presentation: 'modal' }} />
        <Stack.Screen name="uczciwe-zasady" options={{ presentation: 'modal' }} />
        <Stack.Screen name="zglos" options={{ presentation: 'modal' }} />
        <Stack.Screen name="stan-danych" options={{ presentation: 'modal' }} />
        <Stack.Screen name="usun-wszystko" options={{ presentation: 'modal' }} />
        <Stack.Screen name="konflikt" options={{ presentation: 'modal' }} />
        <Stack.Screen name="sesja-korekta" options={{ presentation: 'modal' }} />
        <Stack.Screen name="wloczka" options={{ presentation: 'modal' }} />
        <Stack.Screen name="drut" options={{ presentation: 'modal' }} />
        <Stack.Screen name="zdjecie" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
    </DostawcaAplikacji>
  );
}

/** Ekran awaryjny ma własne t() (bez bazy i bez kontenera): słowniki z pakietu, język systemu. */
function EkranAwaryjnyZJezykiem(p: { powod: PowodTrybuAwaryjnego; naNormalnie(): void }): React.ReactElement {
  const k = useKolory();
  const [t, ustawT] = useState<Awaited<ReturnType<typeof tAwaryjny>> | null>(null);
  useEffect(() => { void tAwaryjny().then((x) => ustawT(() => x)); }, []);
  if (!t) return <View style={{ flex: 1, backgroundColor: k.papier }} />;
  return <Bezpieczny><EkranAwaryjny powod={p.powod} t={t} naNormalnie={p.naNormalnie} /></Bezpieczny>;
}
