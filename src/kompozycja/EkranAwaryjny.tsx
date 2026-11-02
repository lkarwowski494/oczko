// Ekran trybu awaryjnego w kompozycji (ADR-0019): „Zapisz kopię danych” (archiwum bez migracji, liczności, arkusz udostępniania poza E2E),
// „Spróbuj normalnie”, „Zgłoś problem” (diagnostyka ADR-0018, P-194 Q4a: podgląd i arkusz udostępniania bez zapisu do bazy). Panel SHA (bez t()) tylko w buildzie E2E — moduł z `paneleE2e` (P-238).
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { alertBleduZapisu } from '../ekrany/blad-zapisu';
import Constants from 'expo-constants';
import { TrybAwaryjny, type PowodTrybuAwaryjnego } from '../ekrany/TrybAwaryjny';
import { ZglosProblem, type PoleDiagnostyki } from '../ekrany/ZglosProblem';
import { systemAplikacji } from './system';
import { diagnostykaAwaryjna } from './zgloszenie-awaryjne';
import type { Tlumacz } from '../ekrany/wspolne';
import { E2E, paneleE2e } from '../platforma/tryb-e2e';
import { udostepnijPlik } from '../platforma/system-plikow-uzytkownika';
import { usunPlik } from '../dane/pliki/system';
import { licznosciTekst } from './dane';
import { sprobujNormalnieTeraz, trybAwaryjny } from './start-aplikacji';

export function EkranAwaryjny({ powod, t, naNormalnie }: { powod: PowodTrybuAwaryjnego; t: Tlumacz; naNormalnie(): void }): React.ReactElement {
  const a = useMemo(() => trybAwaryjny(), []);
  const [licznosci, ustawLicznosci] = useState<string | null>(null);
  const [sha, ustawSha] = useState<{ sha: string; walBajty: number } | null>(null);
  const [zgloszenie, ustawZgloszenie] = useState<PoleDiagnostyki[] | null>(null); // P-194 Q4a: podgląd przed udostępnieniem (F-57)
  useEffect(() => { if (E2E) void a.kopia.then(() => a.sha()).then(ustawSha); }, [a]);
  if (zgloszenie) return <ZglosProblem stan={{ diagnostyka: zgloszenie }} t={t} system={systemAplikacji} naAnuluj={() => ustawZgloszenie(null)} />;
  return (
    <TrybAwaryjny
      stan={{ powod, licznosciKopii: licznosci }}
      t={t}
      naZapiszKopie={() => { if (E2E) ustawSha(null); /* P-203, F07-19: panel ukryty, dopóki SHA po kopii się nie policzy */ void a.zapiszKopie().then(async (k) => {
        // ADR-0020 (3): baza się nie otwiera albo archiwum zawodzi (także `brak_miejsca`: archiwum liczy miejsce na bazę i wszystkie pliki magazynu,
        // a ZIP surowej kopii to tylko `.db`/`-wal`/`-shm`) → ZIP surowej kopii; plik tymczasowy usuwany po udostępnieniu.
        if (k === 'brak_miejsca' || !k) {
          const zip = await a.zipSurowej();
          if (!zip) { Alert.alert(...alertBleduZapisu(t, 'formularz')); return; } // M1-011, ADR-0020 (4): ZIP też się nie zapisał (zwykle brak miejsca) → komunikat
          if (!E2E) void udostepnijPlik(zip).finally(() => usunPlik(zip));
          return;
        }
        ustawLicznosci(licznosciTekst(k.licznosci, t));
        if (E2E) void a.sha().then(ustawSha); else void udostepnijPlik(k.sciezka);
      }); }}
      naSprobujNormalnie={() => void sprobujNormalnieTeraz().then(naNormalnie)}
      naZglosProblem={() => void diagnostykaAwaryjna({
        powod, nieudaneStarty: a.nieudaneStarty, etap: a.etapPoprzedniegoStartu, bledy: a.bledyZKopii,
        srodowisko: {
          wersja: `${Constants.expoConfig?.version ?? '?'} (${Constants.expoConfig?.ios?.buildNumber ?? '?'})`,
          system: `iOS ${String(Platform.Version)}`, model: Constants.platform?.ios?.model ?? Constants.deviceName ?? '?',
        },
      }).then(ustawZgloszenie)}
      panelE2e={paneleE2e ? <paneleE2e.PanelAwaryjny sha={sha && sha.sha ? sha : null} /> : null /* build E2E (P-238) */}
    />
  );
}
