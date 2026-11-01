// Kontrakt mostu sieci JS ↔ Swift (statycznie, Swift nie kompiluje się w Linuksie; ADR-0031 pkt 1, K-17f): funkcja `siecStan` i zdarzenie `siecZmiana` modułu `oczko-wzor`
// są w TS (OczkoWzorNatywny) i w Swift (OczkoWzorModule); napisy stanu z funkcji Swift `stanSieci` = `StanSieci` z portu; mapowanie NWPath.Status ma jawny przypadek
// „nieznany” (brak odpowiedzi monitora) — kompilację i `swift test` sprawdza przebieg macOS.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { StanSieci } from '../../src/domena/porty';

const KORZEN = join(__dirname, '../..');
const czytaj = (p: string): string => readFileSync(join(KORZEN, p), 'utf8');
const ts = czytaj('modules/oczko-wzor/index.ts');
const modul = czytaj('modules/oczko-wzor/ios/OczkoWzorModule.swift');
const logika = czytaj('modules/oczko-wzor/Pakiet/Sources/OczkoWzorLogika/Siec.swift');
const monitor = czytaj('modules/oczko-wzor/ios/SiecMonitor.swift');
// Typ wymusza kompletność i brak nadmiarowych stanów: rozjazd z portem = błąd kompilacji testu.
const STANY: Record<StanSieci, true> = { jest: true, brak: true, nieznany: true };

test('moduł Swift: funkcja siecStan i zdarzenie siecZmiana (poza widokiem) zgodne z OczkoWzorNatywny w TS', () => {
  expect(ts).toMatch(/siecStan\(\): string;/);
  expect(ts).toMatch(/addListener\(nazwa: 'siecZmiana', fn: \(e: \{ stan: string \}\) => void\)/);
  const poza = modul.slice(0, modul.indexOf('View(WidokWzoru.self)'));
  expect(poza).toMatch(/Function\("siecStan"\)/);
  expect(poza).toMatch(/Events\("siecZmiana"\)/);
  expect(poza).toMatch(/sendEvent\("siecZmiana", \["stan": \w+\]\)/);
  expect(poza).toMatch(/OnStartObserving/);
  expect(poza).toMatch(/OnStopObserving/);
});
test('napisy stanu ze Swift (stanSieci) = StanSieci z portu', () => {
  const swift = [...logika.matchAll(/return "(\w+)"/g)].map((m) => m[1] ?? '').sort();
  expect(swift).toEqual(Object.keys(STANY).sort());
});
test('K-17f: mapowanie statusu ścieżki — satisfied → jest; unsatisfied i requiresConnection → brak; brak odpowiedzi (nil) → nieznany', () => {
  const przypadek = (re: RegExp): string => re.exec(logika)?.[1] ?? '';
  expect(przypadek(/case \.satisfied:\s*return "(\w+)"/)).toBe('jest');
  expect(przypadek(/case \.unsatisfied, \.requiresConnection:\s*return "(\w+)"/)).toBe('brak');
  expect(przypadek(/case nil:\s*return "(\w+)"/)).toBe('nieznany');
});
test('monitor: NWPathMonitor mapuje NWPath.Status na StatusSciezki, nieznane przyszłe statusy → brak odpowiedzi (nil); stan przez stanSieci', () => {
  expect(monitor).toMatch(/NWPathMonitor\(\)/);
  expect(monitor).toMatch(/case \.satisfied: return \.satisfied/);
  expect(monitor).toMatch(/case \.unsatisfied: return \.unsatisfied/);
  expect(monitor).toMatch(/case \.requiresConnection: return \.requiresConnection/);
  expect(monitor).toMatch(/@unknown default: return nil/);
  expect(monitor).toMatch(/stanSieci\(/);
});
