/* BX9 / BX-034 (P-891): scenariusz PU-066 stuka i przytrzymuje punkt ekranu (`tapOn: { point }`, `longPressOn: { point }`) — Maestro 2.12.1 (przypięty w jakosc-ios.yml)
 * zna ten klucz (maestro-orchestra YamlFluentCommand.kt tagu cli-2.12.1: `point` → TapOnPointV2Command; z `longPressOn` → longPress = true; odczyt 2026-11-16).
 * Kontrola statyczna ma go przepuszczać; interpreter na atrapie nie modeluje punktów, więc scenariusz z `point` nie jest tam uruchamiany (jawny błąd, nie ciche pominięcie). */
import { problemySkladni, wczytaj, Runner, type EkranTestowy } from './maestro-runner';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

const scenariusz = (tresc: string) => {
  const plik = path.join(os.tmpdir(), `bx9-punkt-${process.pid}.yaml`);
  fs.writeFileSync(plik, tresc);
  return plik;
};

describe('BX-034 · `point` w tapOn i longPressOn', () => {
  test('kontrola składni przepuszcza `point` (tapOn i longPressOn)', () => {
    const s = wczytaj(scenariusz('appId: x\n---\n- tapOn: { point: "50%, 40%" }\n- assertVisible: "a"\n- longPressOn: { point: "50%, 25%" }\n- assertVisible: "b"\n'));
    expect(problemySkladni(s)).toEqual([]);
  });
  test('interpreter na atrapie zgłasza jawnie, że punktów ekranu nie modeluje (nie stuka po cichu w nic)', async () => {
    const ekran = { elementy: () => [] } as unknown as EkranTestowy;
    const r = new Runner('bx9', ekran);
    await expect(r.krok({ tapOn: { point: '50%, 40%' } }, '/x/p.yaml', {})).rejects.toThrow(/nie modeluje punktów/);
  });
});
