// Port Haptyka = wzorce z tokenów 04 (NZ-08-P3-05 (b), P-135 Q4a): jedna metoda `zagraj(w: WzorzecHaptyki)`, WzorzecHaptyki = klucze
// docs/design/tokeny.json → „haptyka” (bez `_zasada`). Test oczekujący roli 05 (fix-4): czerwony na asercji do wdrożenia przez 08
// (partia 4, razem z adapterem src/platforma/haptyka.ts); sygnatura: „Kontrakt partii 4” w moduly.md. Wyrocznia: tokeny 04 (styl na wzorzec).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { haptyka } from '../../src/platforma/haptyka';

const tokeny = JSON.parse(readFileSync(join(__dirname, '../../docs/design/tokeny.json'), 'utf8')).haptyka as Record<string, string>;
const wzorce = Object.keys(tokeny).filter((k) => !k.startsWith('_'));
/** Oczekiwane wywołania modułu (impact: styl UIImpactFeedbackGenerator, notification: typ UINotificationFeedbackGenerator) z tekstu tokenu. */
const OCZEKIWANE: Record<string, string[]> = {
  plus: ['impact:light'], piataKreska: ['impact:medium'], rzadZInstrukcja: ['impact:medium', 'impact:medium'], minus: ['impact:soft'],
  blokadaStukniecie: ['impact:rigid'], bladZapisu: ['notification:error'],
  stoperStart: ['impact:light'], // M1-107 (04-studio-projektowe-511): start stopera, „haptyka lekka” (design-spec, „Stoper na liczniku”)
};

describe('P-135 Q4a Haptyka.zagraj z wzorcami tokenów 04', () => {
  test('[ZIELONY-OK: wyrocznia zgodna z tokenami] P-135: tokeny 04 mają 7 wzorców (M1-107: + stoperStart), każdy z oczekiwaniem w teście', () => {
    expect([...wzorce].sort()).toEqual(Object.keys(OCZEKIWANE).sort());
  });

  test.each(wzorce)('P-135 F-48: zagraj(%s) woła moduł jak w tokenie 04', async (w) => {
    const wywolania: string[] = [];
    const modul = {
      impactAsync: async (s: string) => { wywolania.push(`impact:${s}`); },
      notificationAsync: async (t: string) => { wywolania.push(`notification:${t}`); },
    };
    const h = haptyka(modul as never, async () => undefined) as unknown as Record<string, unknown>;
    expect(typeof h.zagraj).toBe('function');
    (h.zagraj as (w: string) => void)(w);
    await new Promise((r) => setImmediate(r));
    expect(wywolania).toEqual(OCZEKIWANE[w]);
  });
});
