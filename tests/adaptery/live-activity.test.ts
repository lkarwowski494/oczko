// Adaptery na module Swift OczkoDziennikPlus (ADR-0008; test roli 08 na atrapie modułu): stan v2 przechodzi do Swift jako JSON równy
// złotemu plikowi (ten sam, który dekoduje Swift, X-ST-01), dziennik czyta tekst przez moduł i zgłasza uszkodzone linie do `blad`.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { StanEkranuBlokady } from '../../src/domena/porty';
import { dziennikUrzadzenia } from '../../src/platforma/dziennik-plus';
import { liveActivity } from '../../src/platforma/live-activity';
import { zegarek } from '../../src/platforma/zegarek';
import { przygotuj } from '../dane/pomocnicze/srodowisko';

const KAT = join(__dirname, '../wspolne');
const stan = JSON.parse(readFileSync(join(KAT, 'stan-ekranu-blokady-typowy.json'), 'utf8')) as StanEkranuBlokady;
function atrapa(dostepne = true, rzuca = false) {
  const wywolania: [string, ...unknown[]][] = [];
  return {
    wywolania,
    liveDostepne: () => dostepne,
    liveStart: async (j: string, u: string) => { wywolania.push(['start', j, u]); if (rzuca) throw new Error('ActivityKit'); return 'a1'; },
    liveAktualizuj: async (j: string) => { wywolania.push(['aktualizuj', j]); if (rzuca) throw new Error('ActivityKit'); },
    liveZakoncz: async () => { wywolania.push(['zakoncz']); },
  };
}

describe('LiveActivity na module Swift', () => {
  test('start: JSON stanu = złoty plik v2 (bez wcięć), urządzenie w atrybutach → ok', async () => {
    const n = atrapa();
    expect(await liveActivity('iphone-test', n).start(stan)).toEqual({ ok: true, wartosc: undefined });
    expect(n.wywolania).toEqual([['start', JSON.stringify(JSON.parse(readFileSync(join(KAT, 'stan-ekranu-blokady-typowy.json'), 'utf8'))), 'iphone-test']]);
  });
  test('Live Activity wyłączone w systemie → niedozwolone_przejscie, bez wywołania startu; wyjątek modułu → zapis', async () => {
    const wyl = atrapa(false);
    expect(await liveActivity('u', wyl).start(stan)).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
    expect(wyl.wywolania).toEqual([]);
    expect(await liveActivity('u', atrapa(true, true)).start(stan)).toEqual({ ok: false, powod: 'zapis' });
  });
  test('aktualizuj przy błędzie modułu nie rzuca (dane już w bazie)', async () => {
    await expect(liveActivity('u', atrapa(true, true)).aktualizuj(stan)).resolves.toBeUndefined();
  });
});

describe('DziennikPlus na module Swift', () => {
  test('odczyt przez moduł: zdarzenia przyjęte, ucięty ogon do blad; skroc przekazany do modułu', async () => {
    const s = await przygotuj();
    const tekst = readFileSync(join(KAT, 'dziennik-plus-ucieta-linia.jsonl'), 'utf8');
    const skrocone: string[] = [];
    const d = dziennikUrzadzenia(s.baza, { odczytajTekst: async () => tekst, skroc: async (id) => { skrocone.push(id); } });
    expect((await d.odczytaj()).map((z) => z.id)).toEqual(['3f2b8d4e-5a6c-4b7d-8e9f-a0b1c2d3e4f5', '4a3c9e5f-6b7d-4c8e-9fa0-b1c2d3e4f5a6']);
    expect(await s.baza.all("SELECT kod FROM blad WHERE kod = 'dziennik_uszkodzona_linia'")).toEqual([{ kod: 'dziennik_uszkodzona_linia' }]);
    await d.skroc('4a3c9e5f-6b7d-4c8e-9fa0-b1c2d3e4f5a6');
    expect(skrocone).toEqual(['4a3c9e5f-6b7d-4c8e-9fa0-b1c2d3e4f5a6']);
  });
});

describe('Zegarek na module Swift', () => {
  test('wyslijStan: JSON stanu v2; odbieraj: linie z modułu → zdarzenia zegarka, zła linia pominięta; wyrejestrowanie', async () => {
    const wyslane: string[] = [];
    let fnModulu: ((e: { linie: string[] }) => void) | null = null;
    let usunieto = false;
    const z = zegarek({
      zegarekWyslij: async (j) => { wyslane.push(j); },
      addListener: (_n, fn) => { fnModulu = fn; return { remove: () => { usunieto = true; } }; },
    });
    await z.wyslijStan(stan);
    expect(wyslane).toEqual([JSON.stringify(stan)]);
    const odebrane: string[][] = [];
    const stop = z.odbieraj((zd) => odebrane.push(zd.map((x) => `${x.id}:${x.zrodlo}`)));
    const linia = { ...JSON.parse(readFileSync(join(KAT, 'dziennik-plus-poprawny.jsonl'), 'utf8').split('\n')[0] ?? '{}'), zrodlo: 'zegarek' };
    fnModulu!({ linie: [JSON.stringify(linia), '{"zla":'] });
    expect(odebrane).toEqual([[`${linia.id}:zegarek`]]);
    stop();
    expect(usunieto).toBe(true);
  });
});

describe('P-139: język aplikacji do Live Activity i zegarka (teksty natywne w języku aplikacji, nie systemu)', () => {
  test('start i aktualizuj przekazują bieżący język aplikacji (odczyt przy każdym wywołaniu); bez źródła języka → null (Swift: angielski, P-115)', async () => {
    const wywolania: unknown[][] = [];
    let jezyk = 'pl';
    const n = {
      liveDostepne: () => true,
      liveStart: async (...a: unknown[]) => { wywolania.push(['start', ...a]); return 'a1'; },
      liveAktualizuj: async (...a: unknown[]) => { wywolania.push(['aktualizuj', ...a]); },
      liveZakoncz: async () => undefined,
    };
    const la = liveActivity('iphone-test', n, () => jezyk);
    await la.start(stan);
    jezyk = 'pt-BR';
    await la.aktualizuj(stan);
    await liveActivity('iphone-test', n).aktualizuj(stan);
    expect(wywolania).toEqual([['start', JSON.stringify(stan), 'iphone-test', 'pl'], ['aktualizuj', JSON.stringify(stan), 'pt-BR'], ['aktualizuj', JSON.stringify(stan), null]]);
  });
  test('zegarek: wyslijStan przekazuje język obok stanu i potwierdzonych (klucz `jezyk` kontekstu)', async () => {
    const wyslane: unknown[][] = [];
    const z = zegarek({ zegarekWyslij: async (...a: unknown[]) => { wyslane.push(a); }, addListener: () => ({ remove() {} }) }, () => 'de');
    z.potwierdz(['z1']);
    await z.wyslijStan(stan);
    expect(wyslane).toEqual([[JSON.stringify(stan), ['z1'], 'de']]);
  });
});
