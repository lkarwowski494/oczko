// Test narzędzi czasu (główny zestaw): wyrocznia niezależna od `przesuniecieMin` — nazwa przesunięcia z Intl
// (`timeZoneName: 'longOffset'`, np. „GMT+02:00”) zamiast arytmetyki na częściach daty; daty przejść Warszawy
// z rozporządzenia UE (ostatnia niedziela marca i października, 01:00 UTC).
import { przesuniecieMin, przejsciaCzasu } from './czas';
import { STREFY_TESTOWE } from './strefy';

/** Przesunięcie w minutach odczytane z nazwy strefy Intl („GMT”, „GMT+05:30”, „GMT-11:00”). */
function przesuniecieZNazwy(strefa: string, ms: number): number {
  const czesc = new Intl.DateTimeFormat('en-US', { timeZone: strefa, timeZoneName: 'longOffset' })
    .formatToParts(new Date(ms))
    .find((p) => p.type === 'timeZoneName');
  if (!czesc) throw new Error(`brak timeZoneName dla ${strefa}`);
  if (czesc.value === 'GMT') return 0;
  const m = /^GMT([+-])(\d{2}):(\d{2})$/.exec(czesc.value);
  if (!m) throw new Error(`nieznany format przesunięcia: ${czesc.value}`);
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

const MIN = 60_000;

describe('R-133 DS-09 narzędzia czasu (tests/narzedzia/czas.ts)', () => {
  test('R-133 lista stref DS-09: 8 stref, bez powtórzeń', () => {
    expect([...STREFY_TESTOWE].sort()).toEqual(
      ['Asia/Kolkata', 'Asia/Tokyo', 'America/Los_Angeles', 'Australia/Lord_Howe', 'Europe/Warsaw', 'Pacific/Kiritimati', 'Pacific/Pago_Pago', 'UTC'].sort(),
    );
  });

  test('R-133 Europe/Warsaw 2026: dwa przejścia, 2026-03-29T01:00Z (+60 → +120) i 2026-10-25T01:00Z (+120 → +60)', () => {
    expect(przejsciaCzasu('Europe/Warsaw', 2026)).toEqual([
      { utc: '2026-03-29T01:00:00.000Z', przedMin: 60, poMin: 120 },
      { utc: '2026-10-25T01:00:00.000Z', przedMin: 120, poMin: 60 },
    ]);
  });

  test('R-133 Europe/Warsaw 2026: przesunięcia przy przejściach zgodne z nazwą strefy Intl (longOffset)', () => {
    for (const iso of ['2026-03-29T01:00:00.000Z', '2026-10-25T01:00:00.000Z']) {
      const t = Date.parse(iso);
      expect(przesuniecieMin('Europe/Warsaw', t - 1000)).toBe(przesuniecieZNazwy('Europe/Warsaw', t - 1000));
      expect(przesuniecieMin('Europe/Warsaw', t)).toBe(przesuniecieZNazwy('Europe/Warsaw', t));
      expect(przesuniecieZNazwy('Europe/Warsaw', t - 1000)).not.toBe(przesuniecieZNazwy('Europe/Warsaw', t));
    }
  });

  test('R-133 Asia/Kolkata: 0 przejść w 2026 i 2027, przesunięcie +330 min', () => {
    expect(przejsciaCzasu('Asia/Kolkata', 2026)).toEqual([]);
    expect(przejsciaCzasu('Asia/Kolkata', 2027)).toEqual([]);
    expect(przesuniecieMin('Asia/Kolkata', Date.UTC(2026, 6, 1))).toBe(330);
    expect(przesuniecieZNazwy('Asia/Kolkata', Date.UTC(2026, 6, 1))).toBe(330);
  });

  test('R-133 Australia/Lord_Howe 2026: dwa przejścia o 30 min (+660 ↔ +630)', () => {
    const p = przejsciaCzasu('Australia/Lord_Howe', 2026);
    expect(p).toHaveLength(2);
    for (const x of p) expect(Math.abs(x.poMin - x.przedMin)).toBe(30);
    expect(p.map((x) => [x.przedMin, x.poMin])).toEqual([
      [660, 630],
      [630, 660],
    ]);
  });

  test('R-133 strefy bez czasu letniego (UTC, Kiritimati +14, Pago_Pago −11, Tokio +9): 0 przejść', () => {
    for (const [s, p] of [['UTC', 0], ['Pacific/Kiritimati', 840], ['Pacific/Pago_Pago', -660], ['Asia/Tokyo', 540]] as const) {
      expect(przejsciaCzasu(s, 2026)).toEqual([]);
      expect(przesuniecieMin(s, Date.UTC(2026, 0, 15))).toBe(p);
      expect(przesuniecieZNazwy(s, Date.UTC(2026, 0, 15))).toBe(p);
    }
  });

  test('R-133 każda strefa DS-09, lata 2026–2027: przejście = pierwsza minuta nowego przesunięcia (wyrocznia longOffset)', () => {
    let przejsc = 0;
    for (const s of STREFY_TESTOWE)
      for (const rok of [2026, 2027])
        for (const x of przejsciaCzasu(s, rok)) {
          const t = Date.parse(x.utc);
          expect(x.przedMin).not.toBe(x.poMin);
          expect(przesuniecieZNazwy(s, t - MIN)).toBe(x.przedMin);
          expect(przesuniecieZNazwy(s, t)).toBe(x.poMin);
          przejsc += 1;
        }
    expect(przejsc).toBe(12); // Warszawa, Los Angeles, Lord Howe: po 2 w roku × 2 lata
  });

  test('R-133 przesuniecieMin zgodne z longOffset na siatce godzinowej (Warszawa, Lord Howe, Los Angeles, 2026)', () => {
    for (const s of ['Europe/Warsaw', 'Australia/Lord_Howe', 'America/Los_Angeles'])
      for (let t = Date.UTC(2026, 0, 1); t < Date.UTC(2027, 0, 1); t += 7 * 3_600_000 + 13 * MIN)
        expect(przesuniecieMin(s, t)).toBe(przesuniecieZNazwy(s, t));
  });
});
