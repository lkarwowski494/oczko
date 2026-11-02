// Logika potoku TestFlight sprawdzalna na Linuksie (rola 10, build E2; ADR-0014, P-196 D3a, D5a): numer buildu, bramka „Jakość · iOS”,
// token i odpowiedzi App Store Connect API. Kroki macOS (archiwum, eksport, kontrola .ipa) sprawdza dopiero przebieg dowodowy `bez_wysylki`.
import { generateKeyPairSync, createPublicKey, verify } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../jakosc/jakosc-ios-pomoc';

// Jest nie ładuje .mjs (jak w tests/jakosc: skrypty przez node). Funkcja wołana w osobnym procesie, wynik albo błąd jako JSON;
// pierwszy argument „test” zajmuje argv[1], żeby moduł nie uruchomił swojego polecenia.
const MODUL = join(__dirname, '../../scripts/wydanie/testflight.mjs');
function wywolaj(fn: string, ...args: unknown[]): unknown {
  const kod = `import(process.argv[2]).then((m) => { try { console.log(JSON.stringify({ w: m[process.argv[3]](...JSON.parse(process.argv[4])) })); } catch (e) { console.log(JSON.stringify({ blad: e.message })); } });`;
  const wynik = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', kod, 'test', MODUL, fn, JSON.stringify(args)], { encoding: 'utf8' })) as { w?: unknown; blad?: string };
  if (wynik.blad !== undefined) throw new Error(wynik.blad);
  return wynik.w;
}
const numerBuildu = (a: object) => wywolaj('numerBuildu', a);
const ocenBramke = (r: object[], z: object) => wywolaj('ocenBramke', r, z);
const tokenAsc = (a: object) => wywolaj('tokenAsc', a) as string;
const najwyzszyNumer = (o: object) => wywolaj('najwyzszyNumer', o);
const stanPrzetwarzania = (o: object) => wywolaj('stanPrzetwarzania', o);

describe('numer buildu (ADR-0014: run_number × 10 + run_attempt + przesunięcie)', () => {
  test('pierwszy przebieg z przesunięciem 1000 daje 1011, więcej niż 1004 z 0.1.0', () => {
    expect(numerBuildu({ przebieg: 1, podejscie: 1, przesuniecie: 1000 })).toBe(1011);
  });
  test('ponowienie tego samego przebiegu daje nowy numer', () => {
    expect(numerBuildu({ przebieg: 7, podejscie: 2, przesuniecie: 1000 })).toBe(1072);
  });
  test('więcej niż 9 podejść nachodziłoby na następny przebieg — błąd', () => {
    expect(() => numerBuildu({ przebieg: 7, podejscie: 10, przesuniecie: 1000 })).toThrow(/podej/);
  });
  test('numer nie większy od ostatniego w App Store Connect — błąd z liczbami', () => {
    expect(() => numerBuildu({ przebieg: 1, podejscie: 1, przesuniecie: 1000, ostatni: 1011 })).toThrow(/1011/);
    expect(numerBuildu({ przebieg: 2, podejscie: 1, przesuniecie: 1000, ostatni: 1011 })).toBe(1021);
  });
});

describe('bramka: zielony „Jakość · iOS” na tym commicie (D5a)', () => {
  const run = (id: number, status: string, conclusion: string | null) => ({ id, status, conclusion });
  const job = (name: string, conclusion: string) => ({ name, conclusion });
  const zadaniaOk = [job('swift-test', 'success'), job('build', 'success'), job('e2e (część 1, iphone)', 'success'), job('e2e (część 3, iphone)', 'skipped')];

  test('zielony przebieg z zielonymi zadaniami: ok', () => {
    expect(ocenBramke([run(5, 'completed', 'success')], { 5: zadaniaOk })).toEqual({ wynik: 'ok', przebieg: 5 });
  });
  test('przebieg zielony, ale e2e czerwone pod continue-on-error ([e2e-pelny]): nie ok', () => {
    const z = [...zadaniaOk, job('e2e (część 2, iphone)', 'failure')];
    expect(ocenBramke([run(5, 'completed', 'success')], { 5: z })).toMatchObject({ wynik: 'czerwony', przebieg: 5 });
  });
  test('przebieg bez zadań e2e (np. tylko swift-test): nie ok', () => {
    expect(ocenBramke([run(5, 'completed', 'success')], { 5: [job('build', 'success')] })).toMatchObject({ wynik: 'czerwony' });
  });
  test('trwający przebieg: czekaj; brak przebiegu: brak; czerwony: czerwony', () => {
    expect(ocenBramke([run(6, 'in_progress', null)], {})).toEqual({ wynik: 'czekaj', przebieg: 6 });
    expect(ocenBramke([], {})).toEqual({ wynik: 'brak' });
    expect(ocenBramke([run(4, 'completed', 'failure')], {})).toMatchObject({ wynik: 'czerwony', przebieg: 4 });
  });
  test('jeden zielony wystarcza obok starszego czerwonego (ponowienie ręczne, P-091 10a)', () => {
    expect(ocenBramke([run(4, 'completed', 'failure'), run(5, 'completed', 'success')], { 5: zadaniaOk })).toEqual({ wynik: 'ok', przebieg: 5 });
  });
});

// M1-audytor-generalny-003 (07-jakosc-001): nazwy zadań z workflowu, nie wymyślone. Zadania `jakosc-ios.yml` rozwinięte z macierzy
// (nazwa z szablonu `name`, wykluczenia `exclude`) i z flagą `continue-on-error` (stała albo wyrażenie po `matrix.urzadzenie`).
type ZadanieWf = { name?: string; 'continue-on-error'?: unknown; strategy?: { matrix?: Record<string, unknown> } };
function zadaniaJakosciIos(): { name: string; informacyjne: boolean }[] {
  const wf = parse(readFileSync(join(__dirname, '../../.github/workflows/jakosc-ios.yml'), 'utf8')) as unknown as { jobs: Record<string, ZadanieWf> };
  return Object.entries(wf.jobs).flatMap(([id, j]) => {
    const m = j.strategy?.matrix;
    if (!m) return [{ name: j.name ?? id, informacyjne: j['continue-on-error'] === true }];
    const { exclude = [], include, ...osie } = m as { exclude?: Record<string, unknown>[]; include?: unknown };
    if (include) throw new Error(`${id}: matrix.include nieobsługiwane w teście kontraktu`);
    let kombinacje: Record<string, unknown>[] = [{}];
    for (const [k, wartosci] of Object.entries(osie)) kombinacje = kombinacje.flatMap((c) => (wartosci as unknown[]).map((v) => ({ ...c, [k]: v })));
    kombinacje = kombinacje.filter((c) => !exclude.some((e) => Object.entries(e).every(([k, v]) => c[k] === v)));
    return kombinacje.map((c) => {
      const name = (j.name ?? id).replace(/\$\{\{\s*matrix\.(\w+)\s*\}\}/g, (_x, k: string) => String(c[k]));
      const coe = j['continue-on-error'];
      const wyr = typeof coe === 'string' ? /^\$\{\{\s*matrix\.(\w+) == '(\w+)'\s*\}\}$/.exec(coe) : null;
      if (typeof coe === 'string' && !wyr) throw new Error(`${id}: continue-on-error „${coe}” nieobsługiwane w teście kontraktu`);
      return { name, informacyjne: coe === true || (wyr !== null && c[wyr[1]] === wyr[2]) };
    });
  });
}

describe('bramka na nazwach zadań z jakosc-ios.yml (M1-003, kontrakt)', () => {
  const zadania = zadaniaJakosciIos();
  const run = { id: 9, status: 'completed', conclusion: 'success' };
  test('workflow ma zadania e2e iPhone 1–3, iPad 1 (informacyjnie) i eksperymenty-wzoru (informacyjnie)', () => {
    expect(zadania.filter((z) => z.name.startsWith('e2e')).map((z) => `${z.name}${z.informacyjne ? ' [inf]' : ''}`).sort()).toEqual(
      ['e2e (część 1, ipad) [inf]', 'e2e (część 1, iphone)', 'e2e (część 2, iphone)', 'e2e (część 3, iphone)']);
    expect(zadania.find((z) => z.name === 'eksperymenty-wzoru')?.informacyjne).toBe(true);
  });
  test('wszystkie wymagane zielone, informacyjne (iPad, eksperymenty) z failure pod continue-on-error → ok', () => {
    const z = zadania.map((j) => ({ name: j.name, conclusion: j.informacyjne ? 'failure' : 'success' }));
    expect(ocenBramke([run], { 9: z })).toEqual({ wynik: 'ok', przebieg: 9 });
  });
  test('czerwony iPhone (część 2) → czerwony z nazwą zadania', () => {
    const z = zadania.map((j) => ({ name: j.name, conclusion: j.name === 'e2e (część 2, iphone)' ? 'failure' : 'success' }));
    expect(ocenBramke([run], { 9: z })).toMatchObject({ wynik: 'czerwony', powod: expect.stringContaining('e2e (część 2, iphone): failure') });
  });
  test('każde wymagane zadanie z failure → czerwony (bramka nie pomija niczego poza continue-on-error)', () => {
    for (const w of zadania.filter((j) => !j.informacyjne)) {
      const z = zadania.map((j) => ({ name: j.name, conclusion: j === w ? 'failure' : 'success' }));
      expect([w.name, ocenBramke([run], { 9: z })]).toMatchObject([w.name, { wynik: 'czerwony' }]);
    }
  });
  test('tylko iPad e2e zielony (iPhone pominięte) → czerwony: brak zielonego zadania e2e iPhone', () => {
    const z = zadania.map((j) => ({ name: j.name, conclusion: /iphone/.test(j.name) ? 'skipped' : 'success' }));
    expect(ocenBramke([run], { 9: z })).toMatchObject({ wynik: 'czerwony', powod: expect.stringContaining('brak zielonego zadania e2e') });
  });
});

describe('App Store Connect API', () => {
  test('token ES256: nagłówek z kid, aud appstoreconnect-v1, ważność ≤ 20 min, podpis weryfikowalny', () => {
    const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    const t = tokenAsc({ kid: 'KID0000000', iss: '00000000-0000-0000-0000-000000000000', pem, teraz: 1_800_000_000 });
    const [h, p, s] = t.split('.');
    const dek = (x: string) => JSON.parse(Buffer.from(x, 'base64url').toString());
    expect(dek(h)).toEqual({ alg: 'ES256', kid: 'KID0000000', typ: 'JWT' });
    expect(dek(p)).toMatchObject({ aud: 'appstoreconnect-v1', iat: 1_800_000_000 });
    expect(dek(p).exp - dek(p).iat).toBeLessThanOrEqual(20 * 60);
    const ok = verify('sha256', Buffer.from(`${h}.${p}`), { key: createPublicKey(privateKey), dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url'));
    expect(ok).toBe(true);
  });
  test('najwyższy numer buildu z odpowiedzi /v1/builds (pusta lista = 0)', () => {
    expect(najwyzszyNumer({ data: [{ attributes: { version: '1004' } }] })).toBe(1004);
    expect(najwyzszyNumer({ data: [] })).toBe(0);
  });
  test('stan przetwarzania: VALID gotowe, FAILED/INVALID błąd, PROCESSING albo brak — czekaj', () => {
    expect(stanPrzetwarzania({ data: [{ attributes: { processingState: 'VALID' } }] })).toBe('gotowe');
    expect(stanPrzetwarzania({ data: [{ attributes: { processingState: 'INVALID' } }] })).toBe('blad:INVALID');
    expect(stanPrzetwarzania({ data: [{ attributes: { processingState: 'FAILED' } }] })).toBe('blad:FAILED');
    expect(stanPrzetwarzania({ data: [{ attributes: { processingState: 'PROCESSING' } }] })).toBe('czekaj');
    expect(stanPrzetwarzania({ data: [] })).toBe('czekaj');
  });
});
