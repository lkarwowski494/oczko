// MS1 (KO-245): krokMaks i liveKoniecPoMs w Swift pochodzą z generatora Stale.swift (jedno źródło: KROK_MAKS, LIVE_KONIEC_PO_MS), nie z ręcznych kopii (P-1124, P-1127).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LIVE_KONIEC_PO_MS } from '../../src/konfiguracja';
import { KROK_MAKS } from '../../src/domena/stukniecia';

const KORZEN = join(__dirname, '../..');
const czytaj = (p: string): string => readFileSync(join(KORZEN, p), 'utf8');

describe('stałe 1.0.2 w Swift z generatora', () => {
  it('stale.json ma krokMaks = KROK_MAKS i liveKoniecPoMs = LIVE_KONIEC_PO_MS', () => {
    const stale: unknown = JSON.parse(czytaj('modules/oczko-reguly/stale.json'));
    expect(stale).toMatchObject({ krokMaks: KROK_MAKS, liveKoniecPoMs: LIVE_KONIEC_PO_MS });
  });
  it('Stale.swift niesie obie stałe z wartościami ze źródła', () => {
    const swift = czytaj('modules/oczko-reguly/Sources/OczkoReguly/Stale.swift');
    expect(swift).toContain(`public static let krokMaks: Int = ${KROK_MAKS}`);
    expect(swift).toContain(`public static let liveKoniecPoMs: Int64 = ${LIVE_KONIEC_PO_MS}`);
  });
  it('kod Swift nie ma już ręcznych kopii literałów', () => {
    expect(czytaj('modules/oczko-reguly/Sources/OczkoReguly/Stan.swift')).not.toMatch(/public let krokMaks = \d/);
    expect(czytaj('modules/oczko-reguly/Sources/OczkoReguly/Aktywnosc.swift')).not.toMatch(/public let liveKoniecPoMs: Int64 = \d/);
  });
});
