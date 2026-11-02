/* E2-137-S3 · przebieg #137 (07, 08, 17, 34): po akcji aplikacja pusta albo bez wyniku (zrzuty: ciemna plansza z hierarchią tylko z paska stanu; „Saved: 1 file” bez wyniku importu; menu zdjęcia bez miniatury).
 * Przyczyna (aplikacja czy opóźnienie maszyny) nieustalona — scenariusz daje dowód (zrzut po 20 s) i czeka dłużej, a końcowa asercja zostaje twarda. */
import * as fs from 'fs';
import * as path from 'path';
import { kroki, wczytaj } from './maestro-runner';

const KAT = path.join(__dirname, '..', '..', 'e2e/scenariusze');
type Krok = { nazwa: string; arg: any };
const lista = (plik: string): Krok[] => [...kroki(wczytaj(path.join(KAT, plik)).polecenia)].map(({ nazwa, arg }) => ({ nazwa, arg }));
const idy = (k: Krok): string[] => {
  const id = typeof k.arg === 'object' && k.arg ? (k.arg.id ?? k.arg.element?.id ?? k.arg.visible?.id ?? k.arg.when?.visible?.id ?? k.arg.when?.notVisible?.id) : undefined;
  return typeof id === 'string' ? id.split('|') : [];
};

describe('E2-137-S3 · dowód opóźnienia zamiast niemego timeoutu (07, 08, 17, 34)', () => {
  /** Wzorzec: czekanie opcjonalne ≤ 20 s → `runFlow when notVisible` ze zrzutem „opoznienie-*” i dłuższym czekaniem → twarda asercja. */
  const maDowod = (l: Krok[], id: string) => {
    const o = l.findIndex((k) => k.nazwa === 'extendedWaitUntil' && k.arg?.optional === true && idy(k).join('|') === id.split('|').join('|') && Number(k.arg?.timeout) <= 20000);
    if (o < 0) return false;
    const w = l[o + 1];
    const wn = l.slice(o + 1, o + 6);
    const zrzut = wn.find((k) => k.nazwa === 'takeScreenshot' && /^opoznienie-/.test(String(k.arg)));
    const dlugie = wn.find((k) => k.nazwa === 'extendedWaitUntil' && !k.arg?.optional && Number(k.arg?.timeout) >= 60000 && idy(k).join('|') === id);
    const twarda = l.slice(o + 1, o + 8).find((k) => k.nazwa === 'assertVisible' && idy(k).join('|') === id);
    return w?.nazwa === 'runFlow' && Boolean(zrzut && dlugie && twarda);
  };
  test.each([
    ['07-p-089-3a-uczciwe-zasady.yaml', 'projekty-lista'],
    ['17-br-prj-003-s1-zdjecie-etykiety.yaml', 'zdjecia-miniatura'],
    ['08-br-dan-006-s1-eksport-import.yaml', 'import-gotowy'],
    ['subflows/dodaj-czesc-cel.yaml', 'projekt-dodaj'],
  ])('%s: %s z dowodem opóźnienia', (p, id) => {
    expect(maDowod(lista(p), id)).toBe(true);
  });
});
