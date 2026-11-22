// E2E-A4 (P-358 opcja 1): scenariusz 04 nie zależy od prędkości stuknięć Maestro — dostaje okno strażnika serii 6 s przez argument startu
// `oczkoE2eOknoStraznika` (src/platforma/tryb-e2e.ts) i przed serią czeka dłużej niż okno, więc wcześniejsze +1 nie zlewają się z serią
// („Added 3 rows”, nie 5). Pułapka: bez argumentu albo z krótkim oczekiwaniem test jest czerwony.
import * as fs from 'fs';
import * as path from 'path';
import { YAML } from './maestro-runner';

const root = path.join(__dirname, '..', '..');
const plik = path.join(root, 'e2e/scenariusze/04-br-lic-002-s1-plus-minus-cofnij.yaml');
const README = fs.readFileSync(path.join(root, 'e2e/README.md'), 'utf8');
const dokumenty = YAML.parseAllDocuments(fs.readFileSync(plik, 'utf8')).map((d) => d.toJS() as unknown);
const polecenia = dokumenty[dokumenty.length - 1] as Array<Record<string, any>>; // eslint-disable-line @typescript-eslint/no-explicit-any -- struktura YAML scenariusza
const OKNO_S = 6;

test('scenariusz 04 przekazuje oczkoE2eOknoStraznika w launchApp (własny start, bo podprzepływ start-czysty nie zna argumentu)', () => {
  const starty = polecenia.filter((p) => p.launchApp && p.launchApp.clearState === true);
  expect(starty).toHaveLength(1);
  expect(String(starty[0].launchApp.arguments?.oczkoE2eOknoStraznika)).toBe(String(OKNO_S));
  // reszta argumentów startu jak w subflows/start-czysty.yaml: zegar i brak sieci
  expect(starty[0].launchApp.arguments).toMatchObject({ oczkoE2eTeraz: '2026-11-10T19:30:00', oczkoE2eSiec: 'brak' });
});

test('przed serią 3 stuknięć scenariusz czeka dłużej niż okno strażnika (poprzednie +1 poza serią)', () => {
  const i = polecenia.findIndex((p) => p.tapOn?.id === 'licznik-plus' && p.tapOn.repeat === 3);
  expect(i).toBeGreaterThan(0);
  const czekanie = polecenia[i - 1].extendedWaitUntil;
  expect(czekanie?.visible?.id).toBe('e2e-nigdy');
  expect(czekanie.timeout).toBeGreaterThan(OKNO_S * 1000);
});

test('argument jest opisany w e2e/README.md (tabela „Argumenty startu”)', () => {
  expect(README).toMatch(/\| `oczkoE2eOknoStraznika` \|/);
});
