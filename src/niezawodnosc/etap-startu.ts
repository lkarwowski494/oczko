// Etap ostatniego startu normalnego (P-271, jak Trening L-029 „bootphase”): mały plik JSON obok stanu startu (ADR-0019). Do „Zgłoś problem”
// w trybie awaryjnym: `poczatek` bez `kontener` = awaria przed otwarciem bazy lub w migracji; `kontener` bez `kamien` = po otwarciu bazy,
// przy pierwszym ekranie. Tylko etap i czas od początku startu (ms) — bez danych osobowych. Uszkodzony zapis = brak (nie blokuje startu).
const ETAPY = ['poczatek', 'kontener', 'kamien'] as const;
export type NazwaEtapu = (typeof ETAPY)[number];
export type EtapStartu = { etap: NazwaEtapu; ms: number };
const jestEtapem = (x: unknown): x is NazwaEtapu => ETAPY.some((e) => e === x);

export function odczytajEtap(tekst: unknown): EtapStartu | null {
  if (typeof tekst !== 'string') return null;
  try {
    const x: unknown = JSON.parse(tekst);
    if (typeof x !== 'object' || x === null || !('etap' in x) || !('ms' in x)) return null;
    const { etap, ms } = x;
    if (!jestEtapem(etap) || typeof ms !== 'number' || !Number.isInteger(ms) || ms < 0) return null;
    return { etap, ms };
  } catch {
    return null;
  }
}
/** Linia techniczna (bez t()), jak `safe_mode=… failed_starts=…`. */
export function opisEtapu(e: EtapStartu | null): string {
  return e ? `boot_phase=${e.etap} boot_ms=${e.ms}` : 'boot_phase=-';
}
