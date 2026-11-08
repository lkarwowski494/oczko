// Port Haptyka = wzorce z tokenów 04 (NZ-08-P3-05 (b), P-135 Q4a): jedna metoda `zagraj(w: WzorzecHaptyki)`, WzorzecHaptyki = klucze
// docs/design/tokeny.json → „haptyka” (bez `_zasada`). Test oczekujący roli 05 (fix-4): czerwony na asercji do wdrożenia przez 08
// (partia 4, razem z adapterem src/platforma/haptyka.ts); sygnatura: „Kontrakt partii 4” w moduly.md. Wyrocznia: tokeny 04 (styl na wzorzec).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { haptyka } from '../../src/platforma/haptyka';

// M3 p1 (P-553): tokeny haptyki Dzianiny mają inne klucze niż poprzedni system (rzad, przypomnienie, celCzesci, cofniecie, blokada, bladZapisu, stoperStart); port domeny zachowuje
// dotychczasowe nazwy wzorców, a ich styl w adapterze zmieni partia p3a razem z licznikiem (Dzianina: przypomnienie = notificationWarning, blokada = selection, bez „piątej kreski”).
// Tu: każdy wzorzec portu ma token Dzianiny albo jest nazwanym wyjątkiem (piataKreska — usunięta z systemu, bo kresek już nie ma, P-552).
const tokeny = JSON.parse(readFileSync(join(__dirname, '../../docs/design/tokeny.json'), 'utf8')).haptyka as Record<string, string>;
const TOKEN_PORTU: Record<string, string | null> = {
  plus: 'rzad', piataKreska: null, rzadZInstrukcja: 'przypomnienie', minus: 'cofniecie', blokadaStukniecie: 'blokada', bladZapisu: 'bladZapisu', stoperStart: 'stoperStart',
};
const wzorce = Object.keys(TOKEN_PORTU);
/** Oczekiwane wywołania modułu (impact: styl UIImpactFeedbackGenerator, notification: typ UINotificationFeedbackGenerator) z tekstu tokenu. */
const OCZEKIWANE: Record<string, string[]> = {
  plus: ['impact:light'], piataKreska: ['impact:medium'], rzadZInstrukcja: ['impact:medium', 'impact:medium'], minus: ['impact:soft'],
  blokadaStukniecie: ['impact:rigid'], bladZapisu: ['notification:error'],
  stoperStart: ['impact:light'], // M1-107 (04-studio-projektowe-511): start stopera, „haptyka lekka” (design-spec, „Stoper na liczniku”)
};

describe('P-135 Q4a Haptyka.zagraj z wzorcami tokenów 04', () => {
  test('P-135 / M3 p1: wzorce portu = oczekiwania w teście; każdy ma token Dzianiny (poza piataKreska), a tokeny Dzianiny bez wzorca portu to tylko celCzesci (nowy, p3a)', () => {
    expect([...wzorce].sort()).toEqual(Object.keys(OCZEKIWANE).sort());
    const klucze = Object.keys(tokeny).filter((k) => !k.startsWith('_'));
    for (const t of Object.values(TOKEN_PORTU)) if (t !== null) expect(klucze).toContain(t);
    expect(klucze.filter((k) => !Object.values(TOKEN_PORTU).includes(k))).toEqual(['celCzesci']);
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
