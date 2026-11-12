// 07-jakosc-003 (opcja A, zgoda właściciela 12.11 ok. 09:05 UTC, `docs/decyzje.md`): oczekiwanie na `wzor-widok` po imporcie Worda w scen. 25 i 53
// musi być dłuższe niż limit konwersji w aplikacji (60 s, `KonwersjaNaPdf.swift:10`), inaczej scenariusz pada przed limitem, a nie przy awarii.
// Oczekiwanie po restarcie (odczyt zapisanego stanu, bez konwersji) zostaje 30 s.
import { readFileSync } from 'node:fs';

const LIMIT_APLIKACJI_MS = 60_000; // KonwersjaNaPdf.swift:10 (`limitCzasuS`)
const swift = readFileSync('modules/oczko-wzor/ios/KonwersjaNaPdf.swift', 'utf8');

function czasy(plik: string): { nr: number; ms: number; poRestarcie: boolean }[] {
  const wiersze = readFileSync(`e2e/scenariusze/${plik}`, 'utf8').split('\n');
  const wynik: { nr: number; ms: number; poRestarcie: boolean }[] = [];
  let restart = false;
  wiersze.forEach((w, i) => {
    if (w.includes('subflows/restart.yaml')) restart = true;
    const m = /extendedWaitUntil: \{ visible: \{ id: "wzor-widok" \}, timeout: (\d+) \}/.exec(w);
    if (m?.[1]) wynik.push({ nr: i + 1, ms: Number(m[1]), poRestarcie: restart });
  });
  return wynik;
}

test('limit konwersji w aplikacji to 60 s (podstawa progu scenariuszy)', () => {
  expect(swift).toMatch(/limitCzasuS: TimeInterval = 60\b/);
});
test.each(['25-br-wzr-007-s2-plik-word.yaml', '53-p-282-word-tabela-obraz.yaml'])('%s: oczekiwanie na wzor-widok po imporcie Worda > limit aplikacji', (plik) => {
  const po = czasy(plik).filter((c) => !c.poRestarcie);
  expect(po.length).toBeGreaterThan(0);
  for (const c of po) expect({ nr: c.nr, wiekszeNizLimit: c.ms > LIMIT_APLIKACJI_MS }).toEqual({ nr: c.nr, wiekszeNizLimit: true });
});
