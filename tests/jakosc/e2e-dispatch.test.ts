/* Ręczne uruchomienie pełnego pakietu E2E bez commita (P-299): `workflow_dispatch` z wejściem `znacznik` (domyślnie „[e2e-pelny]”),
 * a krok „Plan części” bierze treść z commita (push) albo z wejścia (ręcznie) — plan części i tak szuka tylko znacznika w COMMIT_MSG. */
import * as fs from 'fs';
import * as path from 'path';
import { parse, wyzwalacze, yamlKroki } from './jakosc-ios-pomoc';

const tekst = fs.readFileSync(path.join(__dirname, '..', '..', '.github/workflows/jakosc-ios.yml'), 'utf8');

test('P-299: workflow ma workflow_dispatch z wejściem `znacznik` (string, domyślnie [e2e-pelny])', () => {
  const on = wyzwalacze(tekst);
  expect(on).toHaveProperty('workflow_dispatch');
  const wd = on.workflow_dispatch as { inputs?: { znacznik?: { type?: string; default?: string } } } | null;
  expect(wd?.inputs?.znacznik).toMatchObject({ type: 'string', default: '[e2e-pelny]' });
});

test('P-299: krok „Plan części” — COMMIT_MSG z commita albo z wejścia `znacznik`', () => {
  const k = yamlKroki(parse(tekst), 'e2e').find((x) => x.name === 'Plan części');
  expect(k?.env?.COMMIT_MSG).toBe('${{ github.event.head_commit.message || inputs.znacznik }}');
});

test('P-299: push nadal uruchamia workflow (wyzwalacz push nietknięty)', () => {
  expect(wyzwalacze(tekst)).toHaveProperty('push.branches');
});
