// Trasa „/zglos”: „Zgłoś problem” (F-57, ADR-0018, R-162, R-163): pełna diagnostyka na ekranie przed wysyłką, wyjście tylko arkuszem
// udostępniania. Bez nazw projektów i notatek (przygotujZgloszenie: liczności i kody błędów). Raporty MetricKit (moduł Swift ADR-0018): poza partią 4.
import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ZglosProblem, type PoleDiagnostyki } from '../src/ekrany/ZglosProblem';
import { useKolory } from '../src/ekrany/motyw';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { systemAplikacji } from '../src/kompozycja/system';
import { znacznikSynchronizacji, znacznikZegarka } from '../src/kompozycja/zgloszenie-diagnostyka';
import { przygotujZgloszenie } from '../src/przypadki-uzycia/zgloszenie';
import { zegarekOstatniaPartiaMs } from '../src/dane/repozytoria/ustawienia';

export default function EkranZgloszenia(): React.ReactElement {
  const { kontener } = useAplikacja();
  const router = useRouter();
  const k = useKolory();
  const [diag, ustaw] = useState<PoleDiagnostyki[] | null>(null);
  useEffect(() => {
    void Promise.all([przygotujZgloszenie(kontener.z), zegarekOstatniaPartiaMs(kontener.z.baza)]).then(([w, zegarekMs]) => {
      const c = Constants.platform?.ios;
      ustaw([
        { pole: 'wersja', wartosc: `${Constants.expoConfig?.version ?? '?'} (${Constants.expoConfig?.ios?.buildNumber ?? '?'})` },
        { pole: 'system', wartosc: `iOS ${String(Platform.Version)}` },
        { pole: 'model', wartosc: c?.model ?? Constants.deviceName ?? '?' },
        { pole: 'jezyk', wartosc: kontener.j.jezyk() }, // BR-DAN-010 (ER-45): język aplikacji w diagnostyce, też przy „Report a translation problem”
        { pole: 'synchronizacja', wartosc: znacznikSynchronizacji(kontener.z.synchronizacja ? kontener.z.synchronizacja.stan() : null) }, // P-383 B: znacznik techniczny po angielsku (podgląd = wysyłany plik)
        { pole: 'zegarek', wartosc: znacznikZegarka(zegarekMs) }, // BR-DAN-011: czas ostatniej partii (UTC) albo „none”
        { pole: 'bledy', wartosc: w.ok ? w.wartosc.tresc : '—' },
      ]);
    });
  }, [kontener]);
  if (!diag) return <View style={{ flex: 1, backgroundColor: k.arkusz }} />;
  return <ZglosProblem stan={{ diagnostyka: diag }} t={kontener.j.t} system={systemAplikacji} naAnuluj={() => router.back()} />;
}
