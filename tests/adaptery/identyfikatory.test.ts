// Adapter Identyfikatory (port domeny, UUID v4) na expo-crypto `randomUUID` (ADR-0016; test roli 08, partia 3): format i unikalność.
// W Jest expo-crypto = node:crypto (tests/narzedzia/expo-crypto-node.ts); na urządzeniu ten sam kontrakt („V4 UUID spec (RFC4122)”, typy pakietu 57.0.4).
import { identyfikatory } from '../../src/platforma/identyfikatory';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test('Identyfikatory.nowy(): UUID v4 małymi literami, 1000 wywołań bez powtórzeń', () => {
  const id = Array.from({ length: 1000 }, () => identyfikatory.nowy());
  expect(id.filter((i) => !UUID_V4.test(i))).toEqual([]);
  expect(new Set(id).size).toBe(1000);
});
