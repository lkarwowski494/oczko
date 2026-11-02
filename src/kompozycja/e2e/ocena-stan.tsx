// Hak E2E „prośba o ocenę” (F-64, 07-jakosc-033 B): panel `e2e-ocena-stan` z liczbą wywołań `portOceny.popros` i ostatnim adresem otwartym przez
// `systemAplikacji.otworzAdres` (e2e/README.md). Tylko liczy i przepuszcza — zachowanie wywołań bez zmian. Bez t(), jak pozostałe panele E2E;
// ładowany wyłącznie przez `paneleE2e` (P-238), więc poza buildem E2E nie trafia do bundla. Stan w pamięci procesu (restart aplikacji zeruje).
import React, { useSyncExternalStore } from 'react';
import { Text } from 'react-native';
import type { PortOceny } from '../../przypadki-uzycia/ocena';

type StanOceny = { prosby: number; adres: string | null };
let stan: StanOceny = { prosby: 0, adres: null };
const sluchacze = new Set<() => void>();
const zmien = (z: Partial<StanOceny>): void => { stan = { ...stan, ...z }; sluchacze.forEach((f) => f()); };
const subskrybuj = (f: () => void): (() => void) => { sluchacze.add(f); return () => { sluchacze.delete(f); }; };

export const zapamietajAdres = (url: string): void => zmien({ adres: url });
/** Port oceny z licznikiem wywołań `popros` (liczy przed wywołaniem systemu: wyjątek = prośby nie było, ale wywołanie było). */
export const zliczajProsby = (port: PortOceny): PortOceny => ({ ...port, popros: () => { zmien({ prosby: stan.prosby + 1 }); return port.popros(); } });

export function PanelOceny(): React.ReactElement {
  const s = useSyncExternalStore(subskrybuj, () => stan);
  return <Text testID="e2e-ocena-stan">{`rating requests: ${s.prosby} · last address: ${s.adres ?? 'none'}`}</Text>;
}
