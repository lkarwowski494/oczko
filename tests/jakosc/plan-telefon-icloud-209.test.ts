// M1-audytor-generalny-209 (07-jakosc-003, JAK-15): plan testu na telefonie nie może kazać włączać „Sync with iCloud”, którego build
// TestFlight nie ma. Przy `ICLOUD_W_1_0 = false` (P-458) blok F jest „nie dotyczy w 1.0”, a TT-08 to warunek włączenia flagi (ZM-06),
// nie bramka 1.0 — w planie na telefon i w strategii §8. Test idzie za flagą: po jej włączeniu wymaga z powrotem kroków iCloud.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ICLOUD_W_1_0 } from '../../src/konfiguracja';

const czytaj = (p: string) => readFileSync(join(__dirname, '../..', p), 'utf8');
const plan = czytaj('docs/jakosc/testflight-na-urzadzeniu.md');
const strategia = czytaj('docs/jakosc/strategia.md');
const blokF = plan.slice(plan.indexOf('## F. iCloud'), plan.indexOf('\n## ', plan.indexOf('## F. iCloud') + 1));
const wierszTT08 = (tekst: string) => tekst.split('\n').find((l) => /^\| TT-08\b/.test(l)) ?? '';

test('209: blok F planu na telefon istnieje (kontrola wycinka)', () => {
  expect(blokF.startsWith('## F. iCloud')).toBe(true);
  expect(blokF.length).toBeGreaterThan(100);
});

if (!ICLOUD_W_1_0) {
  test('209: przy ICLOUD_W_1_0 = false plan nie twierdzi, że build TestFlight ma przełącznik iCloud, i nie każe go włączać', () => {
    expect(plan).not.toMatch(/Build TestFlight ma przełącznik/);
    expect(plan).not.toMatch(/ICLOUD_W_1_0 = true w buildzie TestFlight/);
    expect(blokF).not.toMatch(/Włącz „Sync with iCloud”/);
    expect(blokF).toMatch(/nie dotyczy w 1\.0/i);
    expect(blokF).toMatch(/P-458/);
  });
  test('209: TT-08 opisany jako warunek włączenia flagi ICLOUD_W_1_0, nie bramka 1.0 (plan i strategia §8)', () => {
    for (const wiersz of [wierszTT08(blokF), wierszTT08(strategia)]) {
      expect(wiersz).toMatch(/warunek włączenia/);
      expect(wiersz).toMatch(/ICLOUD_W_1_0/);
      expect(wiersz).not.toMatch(/ukryt[ya] w 1\.0/);
    }
  });
} else {
  test('209: przy ICLOUD_W_1_0 = true blok F każe włączyć „Sync with iCloud” (TT-08)', () => {
    expect(blokF).toMatch(/Włącz „Sync with iCloud”/);
  });
}
