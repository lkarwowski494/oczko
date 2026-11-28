// ZM-24 (U6, ADR-0036 kontrakt Swift pkt 5, P-1097): reguła przypomnienia przy skoku „+2” (wektory PS-01…PS-07 roli 05,
// docs/architektura/wektory-1-0-2.json) jest tą samą regułą co RD-13 W20–W25 w TS: przypomnienieSkoku(przed, po) = przypomnienieWpisania(przed + 1, po + 1).
// Zielony od razu (kontrola krzyżowa wyroczni dla haptyki zegarka 08-B, jak docs/architektura/eksperymenty/1-0-2/sprawdz.mjs:101); strażnik regresji TS.
import wektory from '../../docs/architektura/wektory-1-0-2.json';
import { przypomnienieWpisania } from '../../src/domena/przypomnienia';

type PS = { id: string; opis: string; przed: number; po: number; plan: { od: number; co: number; razy: number }; oczekiwane: { rzad: number | null } };
const V = (wektory as unknown as { przypomnienie_skoku: PS[] }).przypomnienie_skoku;

describe('ZM-24 PS: przypomnienie przy skoku = RD-13 przy wpisaniu (przed+1, po+1)', () => {
  test('liczność PS-01…PS-07', () => expect(V.map((w) => w.id)).toEqual(['PS-01', 'PS-02', 'PS-03', 'PS-04', 'PS-05', 'PS-06', 'PS-07']));
  test.each(V.map((w) => [w.id, w.opis, w] as const))('ZM-24 %s: %s', (_id, _o, w) => {
    expect(przypomnienieWpisania(w.przed + 1, w.po + 1, w.plan)).toEqual({ ok: true, wartosc: w.oczekiwane.rzad });
  });
});
