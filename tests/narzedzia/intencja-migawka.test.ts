// X-DZ-10 (ADR-0008 (4)): nazwa typu LiveActivityIntent i jego parametru są zamrożone — Live Activity uruchomiona przez starszą wersję
// woła intencję po aktualizacji aplikacji. Zmiana poniższej migawki = zmiana kontraktu (05), nie poprawka testu.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PLIK = join(__dirname, '../../targets/widget/_shared/Stuknij.swift');
test('migawka: struct OczkoStuknij: LiveActivityIntent, parametr `rodzaj: String`, inicjator init(rodzaj:)', () => {
  const kod = readFileSync(PLIK, 'utf8');
  const deklaracje = [
    /^struct OczkoStuknij: LiveActivityIntent \{$/m,
    /^ {2}@Parameter\(title: "Kind"\)\n {2}var rodzaj: String$/m,
    /^ {2}init\(rodzaj: String\) \{/m,
  ];
  expect(deklaracje.map((d) => d.test(kod))).toEqual([true, true, true]);
  expect([...kod.matchAll(/^struct \w+: LiveActivityIntent/gm)].length).toBe(1); // jeden typ intencji
});
