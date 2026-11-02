#!/usr/bin/env node
// Logika potoku TestFlight (rola 10, build E2 2026-10-26; ADR-0014, P-196 D3a, D5a) — czyste funkcje z testem (tests/wydanie/potok-testflight.test.ts)
// i cienkie polecenia dla .github/workflows/testflight.yml. Wzór: Trening testflight.yml i scripts/ci/bramka-e2e.sh (tam bash, tu Node, żeby
// bramkę i numer dało się sprawdzić na Linuksie).
//   node scripts/wydanie/testflight.mjs numer                         → CFBundleVersion (env: GITHUB_RUN_NUMBER, GITHUB_RUN_ATTEMPT, PRZESUNIECIE, OSTATNI)
//   node scripts/wydanie/testflight.mjs bramka <właściciel/repo> <sha> → czeka na zielony „Jakość · iOS” tego commitu (env: GH_TOKEN); run=<id> do GITHUB_OUTPUT
//   node scripts/wydanie/testflight.mjs ostatni-build <bundleId>       → najwyższy numer buildu aplikacji w App Store Connect (0, gdy brak)
//   node scripts/wydanie/testflight.mjs czekaj-na-build <bundleId> <numer> [minuty] → czeka na processingState VALID (FAILED/INVALID = kod 1)
// App Store Connect: env ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH (plik .p8 w RUNNER_TEMP). Identyfikatory klucza nigdy nie trafiają na wyjście.
// API (odczyt 2026-10-26, developer.apple.com/documentation/appstoreconnectapi): GET /v1/apps filter[bundleId]; GET /v1/builds filter[app],
// filter[version], sort=-version; processingState: PROCESSING | FAILED | INVALID | VALID; token ES256, aud „appstoreconnect-v1”,
// „Tokens that expire more than 20 minutes into the future are not valid”.
import { readFileSync, appendFileSync } from 'node:fs';
import { createPrivateKey, sign } from 'node:crypto';
import { fileURLToPath } from 'node:url';

/** ADR-0014: run_number × 10 + run_attempt + przesunięcie; ponowienie przebiegu daje nowy numer. */
export function numerBuildu({ przebieg, podejscie, przesuniecie, ostatni = 0 }) {
  for (const [n, v] of Object.entries({ przebieg, podejscie, przesuniecie })) if (!Number.isInteger(v) || v < 0) throw new Error(`numer buildu: ${n} = ${v}`);
  if (podejscie < 1 || podejscie > 9) throw new Error(`numer buildu: podejście ${podejscie} poza 1–9 (nachodzi na numer następnego przebiegu)`);
  const numer = przebieg * 10 + podejscie + przesuniecie;
  if (numer <= ostatni) throw new Error(`numer buildu ${numer} nie jest większy od ostatniego w App Store Connect (${ostatni}) — podnieś zmienną PRZESUNIECIE`);
  return numer;
}

// Nazwy zadań z `.github/workflows/jakosc-ios.yml` (M1-003): e2e z macierzy „e2e (część N, urządzenie)”; bramkę daje iPhone. Zadania
// informacyjne = te z `continue-on-error` w workflowie (eksperymenty wzoru, e2e iPad) — API zwraca dla nich `failure`, a przebieg i tak
// jest zielony. Rozjazd z workflowem łapie test kontraktu w tests/wydanie/potok-testflight.test.ts (czyta macierz i continue-on-error).
const E2E = /^e2e \(część \d+, iphone\)$/;
const INFORMACYJNE = [/^eksperymenty-wzoru$/, /^e2e \(część \d+, ipad\)$/];
/** Bramka D5a: zielony przebieg „Jakość · iOS” na commicie, w którym KAŻDE zadanie poza informacyjnymi ma success albo skipped i jest
 *  co najmniej jedno zielone zadanie e2e iPhone'a (pakiet pełny ma continue-on-error, więc sam wynik przebiegu nie wystarcza). */
export function ocenBramke(przebiegi, zadaniaPrzebiegu) {
  let czekaj, czerwony;
  for (const r of przebiegi) {
    if (r.status !== 'completed') { czekaj ??= r.id; continue; }
    if (r.conclusion !== 'success') { czerwony ??= { przebieg: r.id, powod: `wynik ${r.conclusion}` }; continue; }
    const z = zadaniaPrzebiegu[r.id] ?? [];
    const zle = z.filter((j) => !INFORMACYJNE.some((r) => r.test(j.name)) && !['success', 'skipped'].includes(j.conclusion)).map((j) => `${j.name}: ${j.conclusion}`);
    if (!z.some((j) => E2E.test(j.name) && j.conclusion === 'success')) zle.push('brak zielonego zadania e2e');
    if (!zle.length) return { wynik: 'ok', przebieg: r.id };
    czerwony ??= { przebieg: r.id, powod: zle.join('; ') };
  }
  if (czekaj !== undefined) return { wynik: 'czekaj', przebieg: czekaj };
  if (czerwony) return { wynik: 'czerwony', ...czerwony };
  return { wynik: 'brak' };
}

const b64 = (x) => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url');
/** Token App Store Connect API (ES256, ważny 15 min). */
export function tokenAsc({ kid, iss, pem, teraz = Math.floor(Date.now() / 1000) }) {
  const tresc = `${b64({ alg: 'ES256', kid, typ: 'JWT' })}.${b64({ iss, iat: teraz, exp: teraz + 15 * 60, aud: 'appstoreconnect-v1' })}`;
  const podpis = sign('sha256', Buffer.from(tresc), { key: createPrivateKey(pem), dsaEncoding: 'ieee-p1363' });
  return `${tresc}.${podpis.toString('base64url')}`;
}
export const najwyzszyNumer = (odp) => Math.max(0, ...(odp.data ?? []).map((b) => Number.parseInt(b.attributes?.version ?? '0', 10) || 0));
export function stanPrzetwarzania(odp) {
  const s = odp.data?.[0]?.attributes?.processingState;
  if (s === 'VALID') return 'gotowe';
  if (s === 'FAILED' || s === 'INVALID') return `blad:${s}`;
  return 'czekaj';
}

const spij = (s) => new Promise((r) => setTimeout(r, s * 1000));
async function json(url, naglowki) {
  const odp = await fetch(url, { headers: naglowki });
  if (!odp.ok) throw new Error(`${new URL(url).pathname}: HTTP ${odp.status}`); // bez treści odpowiedzi i nagłówków (token)
  return odp.json();
}
function asc() {
  const { ASC_KEY_ID: kid, ASC_ISSUER_ID: iss, ASC_KEY_PATH: plik } = process.env;
  if (!kid || !iss || !plik) throw new Error('brak ASC_KEY_ID, ASC_ISSUER_ID albo ASC_KEY_PATH');
  const pem = readFileSync(plik, 'utf8');
  return (sciezka) => json(`https://api.appstoreconnect.apple.com${sciezka}`, { Authorization: `Bearer ${tokenAsc({ kid, iss, pem })}` });
}
async function idAplikacji(get, bundleId) {
  const odp = await get(`/v1/apps?filter[bundleId]=${encodeURIComponent(bundleId)}&fields[apps]=bundleId&limit=1`);
  const id = odp.data?.[0]?.id;
  if (!id) throw new Error(`brak aplikacji ${bundleId} w App Store Connect`);
  return id;
}

async function main([cmd, ...a]) {
  const env = process.env;
  if (cmd === 'numer') {
    console.log(numerBuildu({ przebieg: Number(env.GITHUB_RUN_NUMBER), podejscie: Number(env.GITHUB_RUN_ATTEMPT), przesuniecie: Number(env.PRZESUNIECIE ?? '1000'), ostatni: Number(env.OSTATNI ?? '0') }));
  } else if (cmd === 'bramka') {
    const [repo, sha] = a;
    const gh = (s) => json(`https://api.github.com/repos/${repo}${s}`, { Authorization: `Bearer ${env.GH_TOKEN}`, Accept: 'application/vnd.github+json' });
    const [okres, cierpliwosc, limit] = [Number(env.BRAMKA_POLL_SEC ?? 60), Number(env.BRAMKA_GRACE_POLLS ?? 5), Number(env.BRAMKA_MAX_POLLS ?? 150)];
    for (let n = 1; ; n++) {
      const przebiegi = (await gh(`/actions/workflows/jakosc-ios.yml/runs?head_sha=${sha}&per_page=100`)).workflow_runs ?? [];
      const zadania = {};
      for (const r of przebiegi.filter((r) => r.status === 'completed' && r.conclusion === 'success')) zadania[r.id] = (await gh(`/actions/runs/${r.id}/jobs?per_page=100`)).jobs ?? [];
      const w = ocenBramke(przebiegi, zadania);
      if (w.wynik === 'ok') {
        console.log(`Bramka: zielony „Jakość · iOS” #${w.przebieg} na ${sha.slice(0, 7)}`);
        if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `run=${w.przebieg}\n`);
        return 0;
      }
      if (w.wynik === 'czerwony') { console.log(`::error::Bramka: „Jakość · iOS” #${w.przebieg} na ${sha.slice(0, 7)} nie jest zielony (${w.powod}). Popraw albo ponów ręcznie (P-091 10a) i uruchom TestFlight ponownie.`); return 1; }
      if (w.wynik === 'czekaj' && n >= limit) { console.log(`::error::Bramka: limit czekania — przebieg #${w.przebieg} nadal trwa.`); return 1; }
      if (w.wynik === 'brak' && n >= cierpliwosc) { console.log(`::error::Bramka: brak przebiegu „Jakość · iOS” na ${sha.slice(0, 7)} (sam commit dokumentacji go nie uruchamia). Wybierz commit z zielonym przebiegiem. Przebieg dowodowy: bez_wysylki; awaria maszyny: pomin_bramke_e2e + powod.`); return 1; }
      console.log(`Bramka: ${w.wynik === 'czekaj' ? `czekam na #${w.przebieg}` : 'brak przebiegu'} (sprawdzenie ${n})`);
      await spij(okres);
    }
  } else if (cmd === 'ostatni-build') {
    const get = asc();
    const app = await idAplikacji(get, a[0]);
    console.log(najwyzszyNumer(await get(`/v1/builds?filter[app]=${app}&sort=-version&fields[builds]=version&limit=1`)));
  } else if (cmd === 'czekaj-na-build') {
    const [bundleId, numer, minuty = '60'] = a;
    const get = asc();
    const app = await idAplikacji(get, bundleId);
    const koniec = Date.now() + Number(minuty) * 60_000;
    for (;;) {
      const s = stanPrzetwarzania(await get(`/v1/builds?filter[app]=${app}&filter[version]=${encodeURIComponent(numer)}&fields[builds]=processingState&limit=1`));
      if (s === 'gotowe') { console.log(`Build ${numer}: VALID`); return 0; }
      if (s.startsWith('blad:')) { console.log(`::error::Build ${numer}: processingState ${s.slice(5)}`); return 1; }
      if (Date.now() > koniec) { console.log(`::error::Build ${numer}: brak VALID po ${minuty} min (sprawdź App Store Connect → TestFlight)`); return 1; }
      console.log(`Build ${numer}: przetwarzanie trwa`);
      await spij(60);
    }
  } else {
    console.error('użycie: w nagłówku pliku');
    return 2;
  }
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((k) => process.exit(k), (e) => { console.log(`::error::${e.message}`); process.exit(1); });
}
