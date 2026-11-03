/*
 * Workflow `asc-produkty` (rola 10, 2026-11-03, P-467): produkty zakupów (grupa „Oczko Pro”, 2 subskrypcje, zakup jednorazowy), ceny, Family Sharing i dostępność
 * zakłada skrypt scripts/asc/produkty.mjs, nie właściciel. Testy PRZED kodem (zasada wspólna 11): skrypt działa na atrapie serwera (tests/wydanie/asc-atrapa.mjs,
 * w procesie potomnym — skrypty są ESM); nic nie łączy się z Apple. Atrapa odzwierciedla odczytaną dokumentację, nie prawdziwy serwer (docs/wydanie/sklep.md „Produkty
 * zakupów przez API”): potwierdzi to dopiero pierwszy przebieg workflowu.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { execFileSync } from 'child_process';
import { YAML } from '../jakosc/maestro-runner';

const root = join(__dirname, '../..');
const read = (f: string) => readFileSync(join(root, f), 'utf8');
const json = (f: string) => JSON.parse(read(f)) as Record<string, any>; // dane z repo
const DRIVER = join(__dirname, 'asc-produkty-driver.mjs');
const BEZ_NADPISAN = { nadpisania: { nadpisaniaCen: {} } }; // czysty równoważnik Apple

type Akcja = { typ: string; klucz?: string; ile?: number | null; opis: string; nadpisania?: string[] };
type Krok = { code: number; akcje: Akcja[]; stop: string[]; nieodwracalne: string[]; zapisy: number; metody: string[]; log: string[] };
type Wynik = { kroki: Krok[]; stan: any; calls: { m: string; p: string; raw: string }[] };
function uruchom(sc: Record<string, unknown>): Wynik {
  return JSON.parse(execFileSync('node', [DRIVER, JSON.stringify(sc)], { encoding: 'utf8', maxBuffer: 1 << 26 }));
}
const typy = (k: Krok) => k.akcje.map((a) => a.typ).sort();
const ILE = (k: Krok, t: string) => k.akcje.filter((a) => a.typ === t).length;
const KRAJE = ['DEU', 'FRA', 'GBR', 'JPN', 'POL', 'USA'];

describe('plan na pustym App Store Connect', () => {
  const w = uruchom({ kroki: [{ apply: false }] });
  const k = w.kroki[0];
  test('tworzy 1 grupę, 2 subskrypcje, 1 zakup jednorazowy, ceny i dostępność dla trzech; Family Sharing jako NIEODWRACALNE', () => {
    expect(ILE(k, 'grupa:utworz')).toBe(1); expect(ILE(k, 'subskrypcja:utworz')).toBe(2); expect(ILE(k, 'iap:utworz')).toBe(1);
    expect(ILE(k, 'subskrypcja:ceny')).toBe(2); expect(ILE(k, 'iap:cena')).toBe(1);
    expect(ILE(k, 'subskrypcja:dostepnosc')).toBe(2); expect(ILE(k, 'iap:dostepnosc')).toBe(1);
    expect(k.nieodwracalne).toHaveLength(3);
    expect(k.log.some((l) => /NIEODWRACALNE/.test(l) && /oczko\.pro\.lifetime/.test(l))).toBe(true);
    expect(k.stop).toEqual([]); expect(k.code).toBe(0);
  });
  test('dry-run niczego nie zapisuje: tylko GET', () => {
    expect(k.zapisy).toBe(0); expect(k.metody).toEqual(['GET']);
  });
  test('log: bez tokenu, klucza i treści odpowiedzi API', () => {
    expect(k.log.join('\n')).not.toMatch(/TOKEN-TESTOWY|Bearer|ASC_KEY|PRIVATE KEY|eyJ/);
  });
});

describe('zapis na pustym serwerze i ponowny przebieg', () => {
  const w = uruchom({ kroki: [{ apply: true }, { apply: false }, { apply: true }] });
  const [z, plan2, z2] = w.kroki;
  test('zapis tworzy produkty z okresem, poziomem grupy i Family Sharing; typ Non-Consumable', () => {
    expect(z.code).toBe(0); expect(w.stan.grupy.map((g: any) => g.referenceName)).toEqual(['Oczko Pro']);
    const s = w.stan.subskrypcje; expect(s.map((x: any) => `${x.productId}:${x.okres}:${x.fs}:${x.poziom}`).sort()).toEqual(['oczko.pro.monthly:ONE_MONTH:true:1', 'oczko.pro.yearly:ONE_YEAR:true:1']);
    expect(w.stan.iap.map((x: any) => `${x.productId}:${x.typ}:${x.fs}`)).toEqual(['oczko.pro.lifetime:NON_CONSUMABLE:true']);
  });
  test('ceny subskrypcji: kraj bazowy USA 0,99 / 6,99 i równoważniki Apple we wszystkich pozostałych krajach', () => {
    for (const [pid, usa] of [['oczko.pro.monthly', 'USA:0.99'], ['oczko.pro.yearly', 'USA:6.99']]) {
      const id = w.stan.subskrypcje.find((x: any) => x.productId === pid).id;
      const c = w.stan.ceny.filter((x: any) => x.sub === id);
      expect(c.map((x: any) => x.kraj).sort()).toEqual(KRAJE); expect(c.find((x: any) => x.kraj === 'USA').punkt).toBe(usa);
      expect(c.find((x: any) => x.kraj === 'POL').punkt).toBe(pid.endsWith('monthly') ? 'POL:4.99' : 'POL:19.99'); // P-089/P-472: ręczna cena PL
      expect(c.find((x: any) => x.kraj === 'GBR').punkt).toBe(pid.endsWith('monthly') ? 'GBR:0.99' : 'GBR:6.99'); // P-089/P-472: ręczna cena GB
      expect(c.find((x: any) => x.kraj === 'DEU').punkt).toBe(pid.endsWith('monthly') ? 'DEU:0.99' : 'DEU:6.99'); // EUR i reszta: równoważnik Apple
    }
  });
  test('zakup jednorazowy: harmonogram z krajem bazowym USA, ceną 14,99 i dwiema cenami ręcznymi z P-089 (PL 59,99, GB 14,99); reszta automatycznie po stronie Apple', () => {
    expect(w.stan.harmonogramy).toHaveLength(1); const h = w.stan.harmonogramy[0];
    expect(h.baza).toBe('USA'); expect(h.reczne.map((x: any) => x.punkt).sort()).toEqual(['GBR:14.99', 'POL:59.99', 'USA:14.99']);
  });
  test('dostępność: wszystkie kraje i nowe kraje (availableInNewTerritories) dla trzech produktów', () => {
    expect(w.stan.dostSub).toHaveLength(2); expect(w.stan.dostIap).toHaveLength(1);
    for (const d of [...w.stan.dostSub, ...w.stan.dostIap]) { expect([...d.kraje].sort()).toEqual(KRAJE); expect(d.nowe).toBe(true); }
  });
  test('drugi przebieg na stanie po zapisie: plan bez żadnej zmiany, zapis bez żadnego żądania zapisu', () => {
    expect(plan2.akcje).toEqual([]); expect(plan2.stop).toEqual([]); expect(plan2.nieodwracalne).toEqual([]);
    expect(z2.zapisy).toBe(0); expect(z2.code).toBe(0);
  });
  test('nigdy DELETE (żądania zapisu to tylko POST i PATCH)', () => {
    expect(w.calls.map((c) => c.m).filter((m) => m !== 'GET')).not.toContain('DELETE');
    expect(new Set(w.calls.map((c) => c.m))).toEqual(new Set(['GET', 'POST']));
  });
});

describe('wykluczone terytorium China mainland (CHN) — 174 kraje wszędzie (P-479)', () => {
  const grupa = { id: 'GX', referenceName: 'Oczko Pro' };
  const miesieczna = { id: 'SX', grupa: 'GX', productId: 'oczko.pro.monthly', name: 'Oczko Pro Monthly', okres: 'ONE_MONTH', fs: true, poziom: 1 };
  const jakDostepnosc = (w: Wynik, kraje: (d: any) => string[]) => [...w.stan.dostSub, ...w.stan.dostIap].map((d: any) => kraje(d));
  test('atrapa zwraca CHN wśród terytoriów (sprawdzian testu): serwer ma 7, skrypt widzi 6', () => {
    const k = uruchom({ kroki: [{ apply: false }] }).kroki[0];
    expect(k.log.join('\n')).toMatch(/krajów w App Store Connect 6\b/); // bez CHN
    for (const t of ['subskrypcja:dostepnosc', 'iap:dostepnosc']) for (const a of k.akcje.filter((x) => x.typ === t)) expect(a.ile).toBe(6);
  });
  test('apply na pustym serwerze: ani dostępność, ani ceny nie zawierają CHN; availableInNewTerritories zostaje true', () => {
    const w = uruchom({ kroki: [{ apply: true }, { apply: false }] });
    expect(w.kroki[0].code).toBe(0); expect(w.stan.dostSub).toHaveLength(2); expect(w.stan.dostIap).toHaveLength(1);
    for (const kraje of jakDostepnosc(w, (d) => d.kraje)) { expect(kraje).not.toContain('CHN'); expect(kraje).toHaveLength(6); }
    for (const d of [...w.stan.dostSub, ...w.stan.dostIap]) expect(d.nowe).toBe(true);
    expect(w.stan.ceny.length).toBeGreaterThan(0); for (const c of w.stan.ceny) { expect(c.kraj).not.toBe('CHN'); expect(c.punkt).not.toMatch(/^CHN:/); }
    for (const h of w.stan.harmonogramy) for (const r of h.reczne) expect(r.kraj).not.toBe('CHN');
    expect(w.kroki[1].akcje).toEqual([]); expect(w.kroki[1].stop).toEqual([]); // drugi przebieg: nic do zrobienia
  });
  test('plan i log nie wymieniają CHN w żadnej pozycji dostępności ani cen (na pustym serwerze)', () => {
    const k = uruchom({ kroki: [{ apply: false }] }).kroki[0];
    expect(JSON.stringify(k.akcje)).not.toMatch(/CHN/); expect(k.log.join('\n')).not.toMatch(/CHN/);
  });
  test('istniejąca dostępność bez CHN (pełna, „nowe kraje” włączone) to nie „brak”: brak pozycji dostępności, brak STOP', () => {
    const stan = { grupy: [grupa], subskrypcje: [miesieczna], dostSub: [{ id: 'DA', sub: 'SX', nowe: true, kraje: KRAJE }] };
    const k = uruchom({ stan, kroki: [{ apply: false }] }).kroki[0];
    expect(k.akcje.some((a) => a.typ === 'subskrypcja:dostepnosc' && a.klucz === 'monthly')).toBe(false); expect(k.stop).toEqual([]);
  });
  test('CHN w dostępności istniejącego produktu → STOP-rozbieżność w planie; zapis niczego nie zmienia ani nie usuwa (skrypt nigdy nie usuwa)', () => {
    const stan = { grupy: [grupa], subskrypcje: [miesieczna], dostSub: [{ id: 'DA', sub: 'SX', nowe: true, kraje: [...KRAJE, 'CHN'] }] };
    const w = uruchom({ stan, kroki: [{ apply: false }, { apply: true }] });
    for (const k of w.kroki) { expect(k.stop).toHaveLength(1); expect(k.stop[0]).toMatch(/oczko\.pro\.monthly/); expect(k.stop[0]).toMatch(/CHN/); expect(k.code).toBe(1); }
    expect(w.kroki[1].zapisy).toBe(0); expect(w.calls.map((c) => c.m)).not.toContain('DELETE');
    expect(w.stan.dostSub).toHaveLength(1); expect(w.stan.dostSub[0].kraje).toContain('CHN'); expect(w.stan.subskrypcje).toHaveLength(1); expect(w.stan.iap).toHaveLength(0);
  });
  test('CHN w dostępności istniejącego zakupu jednorazowego → STOP-rozbieżność (jak dla subskrypcji)', () => {
    const stan = { iap: [{ id: 'IX', productId: 'oczko.pro.lifetime', name: 'Oczko Pro Lifetime', typ: 'NON_CONSUMABLE', fs: true }],
      harmonogramy: [{ id: 'PX', iap: 'IX', baza: 'USA', reczne: [{ kraj: 'USA', punkt: 'USA:14.99' }] }], dostIap: [{ id: 'IA', iap: 'IX', nowe: true, kraje: [...KRAJE, 'CHN'] }] };
    const k = uruchom({ stan, kroki: [{ apply: true }] });
    expect(k.kroki[0].stop.join(' ')).toMatch(/oczko\.pro\.lifetime.*CHN/); expect(k.kroki[0].zapisy).toBe(0); expect(k.stan.dostIap[0].kraje).toContain('CHN');
  });
});

describe('obrona w głąb (przegląd bezpieczeństwa 2026-11-03)', () => {
  test('dry-run używa klienta tylko do odczytu: POST/PATCH w trybie planu rzuca wyjątek, nawet gdyby kod planu próbował zapisu', () => {
    const kod = `import { makeClient } from ${JSON.stringify(join(root, 'scripts/asc/iap-localizations.mjs'))}; import * as P from ${JSON.stringify(join(root, 'scripts/asc/produkty.mjs'))};
      const k = P.tylkoOdczyt(makeClient({ fetchFn: async () => ({ ok: true, status: 200, json: async () => ({ data: [] }) }), token: 't' }));
      const wyn = []; for (const m of ['POST', 'PATCH', 'DELETE', 'GET']) { try { await k.call(m, '/v1/x', {}); wyn.push(m + ':ok'); } catch (e) { wyn.push(m + ':' + e.message.slice(0, 20)); } }
      process.stdout.write(JSON.stringify(wyn));`;
    const w = JSON.parse(execFileSync('node', ['--input-type=module', '-e', kod], { encoding: 'utf8' })) as string[];
    expect(w[0]).toMatch(/^POST:/); expect(w[0]).not.toContain('ok'); expect(w[1]).not.toContain('ok'); expect(w[2]).not.toContain('ok'); expect(w[3]).toBe('GET:ok');
  });
  test('klient nie wysyła tokenu na adres spoza api.appstoreconnect.apple.com (np. links.next z podstawionej odpowiedzi)', () => {
    const kod = `import { makeClient } from ${JSON.stringify(join(root, 'scripts/asc/iap-localizations.mjs'))};
      let wolano = 0; const k = makeClient({ fetchFn: async () => { wolano++; return { ok: true, status: 200, json: async () => ({ data: [] }) }; }, token: 't' });
      const w = []; for (const u of ['https://obcy.example/v1/x', 'http://api.appstoreconnect.apple.com/v1/x', 'https://api.appstoreconnect.apple.com.obcy.example/v1/x', 'https://api.appstoreconnect.apple.com/v1/x']) { try { await k.call('GET', u); w.push('ok'); } catch { w.push('odmowa'); } }
      process.stdout.write(JSON.stringify({ w, wolano }));`;
    expect(JSON.parse(execFileSync('node', ['--input-type=module', '-e', kod], { encoding: 'utf8' }))).toEqual({ w: ['odmowa', 'odmowa', 'odmowa', 'ok'], wolano: 1 });
  });
});

describe('STOP zamiast zmiany istniejącego produktu', () => {
  const grupa = { id: 'GX', referenceName: 'Oczko Pro' };
  const miesieczna = (x: object = {}) => ({ id: 'SX', grupa: 'GX', productId: 'oczko.pro.monthly', name: 'Oczko Pro Monthly', okres: 'ONE_MONTH', fs: true, poziom: 1, ...x });
  test('istniejąca subskrypcja o innym okresie → STOP w planie; zapis niczego nie zmienia (także innych produktów)', () => {
    const w = uruchom({ stan: { grupy: [grupa], subskrypcje: [miesieczna({ okres: 'ONE_YEAR' })] }, kroki: [{ apply: false }, { apply: true }] });
    for (const k of w.kroki) { expect(k.stop).toHaveLength(1); expect(k.stop[0]).toMatch(/oczko\.pro\.monthly/); expect(k.stop[0]).toMatch(/ONE_YEAR/); expect(k.code).toBe(1); }
    expect(w.kroki[1].zapisy).toBe(0); expect(w.stan.subskrypcje).toHaveLength(1); expect(w.stan.iap).toHaveLength(0);
  });
  test('istniejąca cena bazowa USA inna niż w planie → STOP; żadnego POST ani PATCH ceny', () => {
    const w = uruchom({
      stan: { grupy: [grupa], subskrypcje: [miesieczna()], ceny: [{ id: 'C1', sub: 'SX', kraj: 'USA', punkt: 'USA:1.99' }] },
      kroki: [{ apply: true }],
    });
    expect(w.kroki[0].stop.join(' ')).toMatch(/oczko\.pro\.monthly.*USA.*1\.99.*0\.99/); expect(w.kroki[0].code).toBe(1); expect(w.kroki[0].zapisy).toBe(0);
    expect(w.stan.ceny).toHaveLength(1);
  });
  test('istniejący zakup o innym typie (Consumable) → STOP', () => {
    const w = uruchom({ stan: { iap: [{ id: 'IX', productId: 'oczko.pro.lifetime', name: 'x', typ: 'CONSUMABLE', fs: false }] }, kroki: [{ apply: true }] });
    expect(w.kroki[0].stop.join(' ')).toMatch(/oczko\.pro\.lifetime.*CONSUMABLE/); expect(w.kroki[0].zapisy).toBe(0); expect(w.kroki[0].code).toBe(1);
  });
  test('istniejąca cena zakupu jednorazowego inna niż 14,99 → STOP', () => {
    const w = uruchom({
      stan: { iap: [{ id: 'IX', productId: 'oczko.pro.lifetime', name: 'x', typ: 'NON_CONSUMABLE', fs: true }], harmonogramy: [{ id: 'PX', iap: 'IX', baza: 'USA', reczne: [{ kraj: 'USA', punkt: 'USA:6.99' }] }] },
      kroki: [{ apply: true }],
    });
    expect(w.kroki[0].stop.join(' ')).toMatch(/oczko\.pro\.lifetime.*6\.99.*14\.99/); expect(w.kroki[0].zapisy).toBe(0);
  });
  test('Product ID istnieje pod inną nazwą referencyjną: nazwa nie jest zmieniana ani powielana (produkt znajdowany po Product ID)', () => {
    const w = uruchom({ stan: { grupy: [grupa], subskrypcje: [miesieczna({ name: 'Inna nazwa' })] }, kroki: [{ apply: true }] });
    expect(w.stan.subskrypcje.filter((x: any) => x.productId === 'oczko.pro.monthly')).toHaveLength(1);
    expect(w.stan.subskrypcje.find((x: any) => x.productId === 'oczko.pro.monthly').name).toBe('Inna nazwa');
  });
});

describe('wznowienie po przerwanym przebiegu i Family Sharing', () => {
  test('brakujące kraje i brakujące produkty są dokładane; istniejące ceny nietykane', () => {
    const stan = {
      grupy: [{ id: 'GX', referenceName: 'Oczko Pro' }],
      subskrypcje: [{ id: 'SX', grupa: 'GX', productId: 'oczko.pro.monthly', name: 'Oczko Pro Monthly', okres: 'ONE_MONTH', fs: true, poziom: 1 }],
      ceny: [{ id: 'C1', sub: 'SX', kraj: 'USA', punkt: 'USA:0.99' }, { id: 'C2', sub: 'SX', kraj: 'POL', punkt: 'POL:4.99' }], // PL zmieniona ręcznie: zostaje
    };
    const w = uruchom({ stan, kroki: [{ apply: true }, { apply: false }] });
    expect(w.stan.subskrypcje.map((x: any) => x.productId).sort()).toEqual(['oczko.pro.monthly', 'oczko.pro.yearly']);
    const c = w.stan.ceny.filter((x: any) => x.sub === 'SX');
    expect(c.map((x: any) => x.kraj).sort()).toEqual(KRAJE); expect(c.find((x: any) => x.kraj === 'POL').punkt).toBe('POL:4.99');
    expect(w.stan.ceny.filter((x: any) => x.id === 'C1' || x.id === 'C2')).toHaveLength(2);
    expect(w.kroki[1].akcje).toEqual([]);
    expect(w.kroki[0].code).toBe(0); expect(w.kroki[0].log.join('\n')).not.toMatch(/BŁĄD/); // żadnej próby ponownego dodania istniejącej ceny
  });
  test('niepełna dostępność istniejących produktów jest uzupełniana do wszystkich krajów; istniejący zakup bez dostępności dostaje ją; druga runda bez zmian', () => {
    const stan = {
      grupy: [{ id: 'GX', referenceName: 'Oczko Pro' }],
      subskrypcje: [{ id: 'SX', grupa: 'GX', productId: 'oczko.pro.monthly', name: 'Oczko Pro Monthly', okres: 'ONE_MONTH', fs: true, poziom: 1 }],
      dostSub: [{ id: 'DA', sub: 'SX', nowe: false, kraje: ['USA'] }],
      iap: [{ id: 'IX', productId: 'oczko.pro.lifetime', name: 'Oczko Pro Lifetime', typ: 'NON_CONSUMABLE', fs: true }],
      harmonogramy: [{ id: 'PX', iap: 'IX', baza: 'USA', reczne: [{ kraj: 'USA', punkt: 'USA:14.99' }] }],
    };
    const w = uruchom({ stan, kroki: [{ apply: false }, { apply: true }, { apply: false }] });
    expect(ILE(w.kroki[0], 'subskrypcja:dostepnosc')).toBe(2); // monthly (niepełna) + yearly (nowa)
    expect(w.kroki[0].akcje.find((a) => a.typ === 'subskrypcja:dostepnosc' && a.klucz === 'monthly')!.ile).toBe(5); // brakujące kraje (6 w atrapie, USA jest)
    expect(ILE(w.kroki[0], 'iap:dostepnosc')).toBe(1); expect(ILE(w.kroki[0], 'iap:cena')).toBe(1); // dokłada 2 ręczne ceny (PL, GB), cena bazowa nietknięta
    expect(w.kroki[0].akcje.find((x) => x.typ === 'iap:cena')!.ile).toBe(2);
    expect(w.kroki[1].code).toBe(0);
    const d = w.stan.dostSub.find((x: any) => x.sub === 'SX'); expect([...d.kraje].sort()).toEqual(KRAJE); expect(d.nowe).toBe(true);
    expect(w.stan.dostIap).toHaveLength(1); expect([...w.stan.dostIap[0].kraje].sort()).toEqual(KRAJE);
    expect(w.kroki[2].akcje).toEqual([]);
  });
  test('pełna lista krajów, ale „nowe kraje” wyłączone → dostępność jest poprawiana (kraje dodawane przez Apple w przyszłości)', () => {
    const stan = { grupy: [{ id: 'GX', referenceName: 'Oczko Pro' }], subskrypcje: [{ id: 'SX', grupa: 'GX', productId: 'oczko.pro.monthly', name: 'Oczko Pro Monthly', okres: 'ONE_MONTH', fs: true, poziom: 1 }],
      dostSub: [{ id: 'DA', sub: 'SX', nowe: false, kraje: KRAJE }] };
    const w = uruchom({ stan, kroki: [{ apply: false }, { apply: true }] });
    expect(w.kroki[0].akcje.find((a) => a.typ === 'subskrypcja:dostepnosc' && a.klucz === 'monthly')!.ile).toBe(0);
    expect(w.stan.dostSub.find((x: any) => x.sub === 'SX').nowe).toBe(true);
  });
  test('istniejący produkt bez Family Sharing: PATCH familySharable, w planie NIEODWRACALNE', () => {
    const stan = { grupy: [{ id: 'GX', referenceName: 'Oczko Pro' }], subskrypcje: [{ id: 'SX', grupa: 'GX', productId: 'oczko.pro.monthly', name: 'Oczko Pro Monthly', okres: 'ONE_MONTH', fs: false, poziom: 1 }] };
    const w = uruchom({ stan, kroki: [{ apply: false }, { apply: true }] });
    expect(ILE(w.kroki[0], 'subskrypcja:rodzina')).toBe(1); expect(w.kroki[0].nieodwracalne.join(' ')).toMatch(/oczko\.pro\.monthly/);
    expect(w.stan.subskrypcje.find((x: any) => x.productId === 'oczko.pro.monthly').fs).toBe(true);
    expect(w.calls.some((c) => c.m === 'PATCH')).toBe(true);
  });
  test('opcja bez Family Sharing: nowe produkty bez familySharable, żadnego PATCH, plan bez NIEODWRACALNE', () => {
    const w = uruchom({ kroki: [{ apply: false, opcje: { familySharing: false } }, { apply: true, opcje: { familySharing: false } }] });
    expect(w.kroki[0].nieodwracalne).toEqual([]); expect(w.stan.subskrypcje.every((x: any) => x.fs === false)).toBe(true); expect(w.stan.iap.every((x: any) => x.fs === false)).toBe(true);
    expect(w.calls.some((c) => c.m === 'PATCH')).toBe(false);
  });
});

describe('nadpisania cen w wybranych krajach (P-089, P-472: PL i GB jak Trening)', () => {
  test('dane: nadpisania z P-089/P-472 — PL 4,99 / 19,99 / 59,99 zł i GB 0,99 / 6,99 / 14,99 £ (EUR i reszta z przeliczenia Apple)', () => {
    expect(json('docs/wydanie/metadane/produkty.store.json').nadpisaniaCen).toEqual({ POL: { monthly: '4.99', yearly: '19.99', lifetime: '59.99' }, GBR: { monthly: '0.99', yearly: '6.99', lifetime: '14.99' } });
  });
  test('plan na pustym ASC pokazuje 2 nadpisania na produkt (kraj i cena) w pozycjach cen i w logu', () => {
    const k = uruchom({ kroki: [{ apply: false }] }).kroki[0];
    for (const a of k.akcje.filter((x) => x.typ === 'subskrypcja:ceny' || x.typ === 'iap:cena')) expect(a.nadpisania).toHaveLength(2);
    const m = k.akcje.find((x) => x.klucz === 'monthly' && x.typ === 'subskrypcja:ceny')!; expect(m.nadpisania).toEqual(['POL 4.99', 'GBR 0.99']);
    expect(k.log.join('\n')).toMatch(/nadpisania: POL 59\.99, GBR 14\.99/);
  });
  test('bez nadpisań (dane puste) kraje dostają równoważniki Apple', () => {
    const w = uruchom({ ...BEZ_NADPISAN, kroki: [{ apply: true }] });
    const mid = w.stan.subskrypcje.find((x: any) => x.productId === 'oczko.pro.monthly').id;
    expect(w.stan.ceny.find((c: any) => c.sub === mid && c.kraj === 'POL').punkt).toBe('POL:3.99'); expect(w.stan.harmonogramy[0].reczne).toEqual([{ kraj: 'USA', punkt: 'USA:14.99' }]);
  });
  test('nadpisanie POL: kraj dostaje wskazany poziom ceny zamiast równoważnika (subskrypcja i zakup jednorazowy)', () => {
    const w = uruchom({ nadpisania: { nadpisaniaCen: { POL: { monthly: '4.99', yearly: '19.99', lifetime: '59.99' } } }, kroki: [{ apply: true }, { apply: false }] });
    const pol = (pid: string) => w.stan.ceny.find((c: any) => c.sub === w.stan.subskrypcje.find((x: any) => x.productId === pid).id && c.kraj === 'POL').punkt;
    expect(pol('oczko.pro.monthly')).toBe('POL:4.99'); expect(pol('oczko.pro.yearly')).toBe('POL:19.99');
    expect(w.stan.harmonogramy[0].reczne.map((x: any) => x.kraj + ':' + x.punkt).sort()).toEqual(['POL:POL:59.99', 'USA:USA:14.99']);
    expect(w.kroki[1].akcje).toEqual([]);
  });
});

describe('zgodność Product ID i danych (jedno źródło prawdy)', () => {
  const ID = ['oczko.pro.monthly', 'oczko.pro.yearly', 'oczko.pro.lifetime'];
  const p = json('docs/wydanie/metadane/produkty.store.json');
  test('stała PRODUCTS (iap-localizations.mjs) = docs/monetyzacja.md = kod aplikacji = asc-kontrola.json; skrypt produkty.mjs nie powtarza literałów', () => {
    const kod = execFileSync('node', ['--input-type=module', '-e', `import { PRODUCTS, SUBSCRIPTION_GROUP_NAME } from ${JSON.stringify(join(root, 'scripts/asc/iap-localizations.mjs'))}; process.stdout.write(JSON.stringify({ p: PRODUCTS, g: SUBSCRIPTION_GROUP_NAME }));`], { encoding: 'utf8' });
    const w = JSON.parse(kod) as { p: Record<string, { productId: string; kind: string }>; g: string };
    expect(Object.values(w.p).map((x) => x.productId).sort()).toEqual([...ID].sort());
    const mon = read('docs/monetyzacja.md'); for (const id of ID) expect(mon).toContain(id);
    for (const id of ID) expect(read('src/konfiguracja.ts') + read('modules/oczko-reguly/stale.json')).toContain(id);
    expect(json('docs/wydanie/asc-kontrola.json').produkty.map((x: any) => x.productId).sort()).toEqual([...ID].sort());
    expect(read('scripts/asc/produkty.mjs')).not.toMatch(/oczko\.pro\.(monthly|yearly|lifetime)/);
    expect(w.g).toBe(p.produkty.group.referenceName); expect(mon).toMatch(/grupa „Oczko Pro”/);
  });
  test('produkty.store.json: okresy i ceny bazowe = docs/monetyzacja.md „Produkty” (0,99 mies., 6,99 rok, 14,99 dożywotni), bez ofert wprowadzających; Family Sharing TAK (P-466)', () => {
    const pr = p.produkty; const mon = read('docs/monetyzacja.md');
    expect(Object.keys(pr).sort()).toEqual(['group', 'lifetime', 'monthly', 'yearly']);
    expect([pr.monthly.okres, pr.monthly.cenaBazowa]).toEqual(['ONE_MONTH', '0.99']); expect([pr.yearly.okres, pr.yearly.cenaBazowa]).toEqual(['ONE_YEAR', '6.99']);
    expect([pr.lifetime.typ, pr.lifetime.cenaBazowa]).toEqual(['NON_CONSUMABLE', '14.99']);
    for (const c of ['0,99 USD', '6,99 USD', '14,99 USD']) expect(mon).toContain(c);
    expect(p.krajBazowy).toBe('USA'); expect(p.familySharing).toBe(true);
    expect(JSON.stringify(pr)).not.toMatch(/intro|oferta|offer|trial/i);
  });
});

describe('lokalizacje bez wyjątku właściciela (P-467)', () => {
  const kod = `import * as I from ${JSON.stringify(join(root, 'scripts/asc/iap-localizations.mjs'))};
    const p = JSON.parse(process.argv[1]);
    const ex = new Map([['en-US', { id: '1', name: 'Stare', description: 'd' }], ['de-DE', { id: '2', name: 'Obce', description: 'd' }]]);
    const pl = I.planObject({ key: 'monthly', translations: p.tlumaczenia, existing: ex, hasDescription: true });
    process.stdout.write(JSON.stringify({ items: pl.items.map(i => i.lang + ':' + i.action + ':' + (i.reason ?? '')), extra: pl.extra, owners: I.OWNER_LOCALES ?? null }));`;
  test('en-US i pl są w tlumaczenia (nie w „wpisaneRecznie”); en-US różniące się jest aktualizowane, pl (zaakceptowane, P-515) tworzone jak każdy język, obce nietykane', () => {
    const p = json('docs/wydanie/metadane/produkty.store.json');
    expect(p.wpisaneRecznie).toBeUndefined(); expect(Object.keys(p.tlumaczenia)).toHaveLength(35); // P-515: wszystkie języki aplikacji (komplet: tests/wydanie/produkty-przeklad.test.ts)
    expect(p.tlumaczenia.en.ascLocale).toBe('en-US'); expect(p.tlumaczenia.pl.ascLocale).toBe('pl'); expect(p.tlumaczenia.pl.czeka).toBeUndefined();
    const w = JSON.parse(execFileSync('node', ['--input-type=module', '-e', kod, JSON.stringify(p)], { encoding: 'utf8' }));
    expect(w.items.slice(0, 2)).toEqual(['en:zaktualizuj:', 'pl:utwórz:']);
    expect(w.items).toEqual(expect.arrayContaining(['de:zaktualizuj:', 'cs:utwórz:', 'nb:utwórz:', 'sl:pomiń:brak lokalizacji w App Store Connect', 'sr:pomiń:brak lokalizacji w App Store Connect']));
    expect(w.items.filter((i: string) => i.includes(':utwórz:'))).toHaveLength(27); // 28 lokalizacji ASC poza en-US (29 z metadanych minus sl = null), bez de-DE (istnieje)
    expect(w.extra).toEqual([]); expect(w.owners).toBeNull(); // OWNER_LOCALES usunięte
  });
  test('teksty en: limity Apple (nazwa ≤ 30, opis ≤ 45 znaków), bez cen i bez nazw innych aplikacji', () => {
    const en = json('docs/wydanie/metadane/produkty.store.json').tlumaczenia.en;
    for (const key of ['group', 'monthly', 'yearly', 'lifetime']) {
      expect([...en[key].name].length).toBeLessThanOrEqual(30);
      if (en[key].description) expect([...en[key].description].length).toBeLessThanOrEqual(45);
      expect(JSON.stringify(en[key])).not.toMatch(/\d[.,]\d\d|USD|\$/);
    }
  });
});

describe('workflow asc-produkty.yml (statycznie)', () => {
  type Job = { environment?: string; needs?: string | string[]; if?: string; 'runs-on'?: string; steps?: { if?: string; run?: string; env?: Record<string, string> }[] };
  const t = read('.github/workflows/asc-produkty.yml');
  const w = YAML.parse(t) as { on?: Record<string, any>; true?: Record<string, any>; jobs: Record<string, Job>; permissions?: Record<string, string> };
  const on = w.on ?? w.true ?? {};
  test('tylko ręcznie; contents: read; ubuntu; bez macOS, tokenów Expo i wyzwalaczy z PR', () => {
    expect(Object.keys(on)).toEqual(['workflow_dispatch']); expect(w.permissions?.contents).toBe('read');
    for (const j of Object.values(w.jobs)) expect(j['runs-on']).toBe('ubuntu-latest');
    expect(t).not.toMatch(/macos|EXPO_TOKEN|eas-cli|pull_request|schedule:/);
  });
  test('dwa zadania: plan (bez środowiska, tylko --dry-run) i apply (environment: release, po planie, --apply)', () => {
    expect(Object.keys(w.jobs).sort()).toEqual(['apply', 'plan']);
    expect(w.jobs.plan.environment).toBeUndefined(); expect(w.jobs.apply.environment).toBe('release');
    const run = (j: Job) => (j.steps ?? []).map((s) => s.run ?? '').join('\n');
    expect(run(w.jobs.plan)).toContain('--dry-run'); expect(run(w.jobs.plan)).not.toContain('--apply');
    expect(run(w.jobs.apply)).toContain('--apply'); expect([w.jobs.apply.needs].flat()).toContain('plan');
    expect(w.jobs.plan.if ?? '').not.toMatch(/apply/); expect(t).toMatch(/if: \$\{\{ inputs\.tryb == 'apply' \}\}/);
  });
  test('wejścia: tryb dry-run (domyślny) / apply; Family Sharing (domyślnie tak, P-466); dane wejściowe przez env, nie wprost w run', () => {
    expect(t).toMatch(/options: \[dry-run, apply\]\n\s+default: dry-run/); expect(t).toMatch(/family_sharing:/);
    for (const j of Object.values(w.jobs)) for (const s of j.steps ?? []) expect(s.run ?? '').not.toContain('${{ inputs.');
  });
  test('klucz .p8 tylko w RUNNER_TEMP, maskowany i usuwany zawsze (oba zadania)', () => {
    for (const j of Object.values(w.jobs)) {
      const tekst = JSON.stringify(j);
      expect(tekst).toContain('$RUNNER_TEMP/AuthKey.p8'); expect(tekst).toContain('::add-mask::$ASC_KEY_ID');
      const ost = (j.steps ?? []).at(-1)!; expect(ost.if).toBe('always()'); expect(ost.run).toBe('rm -f "$RUNNER_TEMP/AuthKey.p8"');
    }
  });
  test('strażnik workflowów: zadanie plan jest na liście czytających (P-463), apply nie; zapis do ASC tylko w release', () => {
    const s = read('scripts/jakosc/sprawdz-workflowy.mjs');
    expect(s).toContain("{ plik: '.github/workflows/asc-produkty.yml', zadanie: 'plan',"); expect(s).not.toContain("zadanie: 'apply'");
    execFileSync('node', [join(root, 'scripts/jakosc/sprawdz-workflowy.mjs')], { encoding: 'utf8' }); // kod 0 albo wyjątek
  });
  test('kolejność: asc-produkty przed asc-iap-localizations (komentarze obu workflowów i instrukcja właściciela)', () => {
    expect(t).toMatch(/asc-iap-localizations/); expect(read('.github/workflows/asc-iap-localizations.yml')).toMatch(/asc-produkty/);
    const k = read('docs/wydanie/kroki-wlasciciela-testflight.md'); expect(k).toMatch(/asc-produkty/); expect(k).toMatch(/## B2\./);
  });
  test('skrypty: tylko GET/POST/PATCH — w produkty.mjs nie ma wywołania DELETE', () => {
    expect(read('scripts/asc/produkty.mjs')).not.toMatch(/call\(\s*['"]DELETE['"]/);
  });
});
