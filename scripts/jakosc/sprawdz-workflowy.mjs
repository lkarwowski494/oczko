// Strażnik workflowów (ADR-0014, kontrola 05-9; P-089; strategia §5). Reguły:
//  SEKRET-BEZ-SRODOWISKA: każde `secrets.X` poza GITHUB_TOKEN tylko w zadaniu z `environment: release`; wyjątek P-463 (M1-010, jak Trening):
//    zadanie TYLKO CZYTAJĄCE z ASC z listy ASC_TYLKO_ODCZYT może użyć sekretów repozytorium ASC_* bez środowiska, o ile nie ma warunku trybu zapisu;
//    każde inne zadanie z ASC_* (testflight, asc-metadane, asc-zrzuty, asc-iap-localizations apply…) jest zapisujące i wymaga `environment: release`;
//    wyjątek P-474 (API_PRZEKLAD): zadanie `przeklad` w przeklad-tlumaczen.yml może użyć tylko sekretu ANTHROPIC_API_KEY bez środowiska (tylko workflow_dispatch);
//  ODCZYT-WYZWALACZ / ODCZYT-Z-ZAPISEM: zadanie z listy ASC_TYLKO_ODCZYT — jedyny wyzwalacz workflow_dispatch; skrypty scripts/asc/ w jego `run:` tylko z --dry-run (przegląd bezpieczeństwa 2026-11-03);
//  WYZWALACZ-Z-SEKRETAMI: workflow z takim zadaniem nie ma `pull_request`, `pull_request_target` ani `workflow_run`;
//  SZTUCZNY-SKLEP-W-WYDANIU: przełączniki testowe (`EXPO_PUBLIC_STORE_FAKE`, `_WATCH_FAKE`, `_ICLOUD_FAKE`, `_E2E`, `_WYMUS_AWARIE`, `_PSEUDO`) nie występują w workflowie z `environment: release`;
//  BRAK-WORKFLOWOW: katalog bez plików .yml to błąd (pusty zbiór to nie zaliczenie).
// Reguły JAK-10 przeniesione z tests/public-repo.test.ts 0.1.0 (F07-09, P-117 Q6a):
//  PULL-REQUEST-TARGET: wyzwalacz pull_request_target w żadnym workflowie (kod z PR z prawem zapisu i sekretami);
//  PERMISSIONS-KORZEN: `permissions` na poziomie workflowu z `contents: read` (minimalne uprawnienia);
//  TIMEOUT: każde zadanie ma `timeout-minutes` (domyślne 360 min to nie limit);
//  DANE-ZDARZEN-W-RUN: `${{ github.event.(inputs|pull_request|head_commit|issue|comment)… }}` ani `${{ github.head_ref }}` wprost w `run:` (przez env);
//  AKCJA-NIEPRZYPIETA: `uses:` spoza actions/* przypięte do 40-znakowego SHA.
// Wersje narzędzi (zasada wspólna 21, DS-07; 07-jakosc-005):
//  MAESTRO-WERSJA: krok z instalatorem get.maestro.mobile.dev ma `MAESTRO_VERSION` z dokładną wersją (nie `${{ vars.* }}`, która bywa pusta),
//  pada przy pustej zmiennej (`exit 1`, bez `unset`) i porównuje `maestro --version` z przypiętą.
// Wyjątki nazwane: scripts/jakosc/wyjatki.json („workflowy”). Użycie: node scripts/jakosc/sprawdz-workflowy.mjs [--katalog <korzeń>]
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

/** P-463 (M1-010): zadania tylko czytające z App Store Connect (GET, plan, --dry-run) — bez środowiska, sekrety repozytorium jak w Treningu.
 *  Domyślnie każde zadanie z ASC_* jest zapisujące; nowe zadanie czytające (np. `plan` z --dry-run) dopisuje się tu z uzasadnieniem. */
export const ASC_TYLKO_ODCZYT = [
  { plik: '.github/workflows/asc-kontrola.yml', zadanie: 'kontrola', dlaczego: 'workflow wielokrotnego użytku apps4brew-narzedzia przypięty do SHA, tylko GET, tylko workflow_dispatch' },
  { plik: '.github/workflows/asc-produkty.yml', zadanie: 'plan', dlaczego: 'plan produktów zakupów: scripts/asc/produkty.mjs --dry-run (tylko GET), tylko workflow_dispatch; zapis (--apply) w zadaniu apply z environment: release (P-467)' },
];
/** Zadania z kluczem API Anthropic (opłacane z kredytów właściciela) bez `environment`: P-474, jak Trening. Klucz nie daje dostępu do ASC ani repo;
 *  workflow ma tylko `workflow_dispatch`, `permissions: contents: read` (kontrola PERMISSIONS-KORZEN), wynik tylko jako artefakt. */
export const API_PRZEKLAD = [
  { plik: '.github/workflows/przeklad-tlumaczen.yml', zadanie: 'przeklad', sekret: 'ANTHROPIC_API_KEY', dlaczego: 'przekład fali 09 przez Message Batches, limit 6 USD na przebieg (P-144), tylko workflow_dispatch (P-474)' },
];
const TRYB_ZAPISU = /\b(apply|zapis|upload|wyslij|push)\b/i;
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };

export function sprawdzWorkflowy(korzen) {
  const kat = join(korzen, '.github/workflows');
  const naruszenia = [];
  const pliki = existsSync(kat) ? readdirSync(kat).filter((n) => /\.ya?ml$/.test(n)) : [];
  if (!pliki.length) return [`BRAK-WORKFLOWOW ${kat}`];
  const wyjPlik = join(korzen, 'scripts/jakosc/wyjatki.json');
  const wyjatki = existsSync(wyjPlik) ? JSON.parse(readFileSync(wyjPlik, 'utf8')).workflowy ?? [] : [];
  for (const n of pliki) {
    const rel = `.github/workflows/${n}`;
    const tekst = readFileSync(join(kat, n), 'utf8');
    let wf;
    try { wf = parse(tekst); } catch (e) { naruszenia.push(`YAML ${rel}: ${e.message.split('\n')[0]}`); continue; }
    const on = wf?.on ?? wf?.true ?? {}; // YAML 1.1 czyta `on` jako true
    const wyzwalacze = typeof on === 'string' ? [on] : Array.isArray(on) ? on : Object.keys(on ?? {});
    const zgl = (regula, opis) => { if (!wyjatki.some((w) => w.regula === regula && w.plik === rel)) naruszenia.push(`${regula} ${rel}: ${opis}`); };
    if (wyzwalacze.includes('pull_request_target')) zgl('PULL-REQUEST-TARGET', 'wyzwalacz pull_request_target');
    if (wf?.permissions?.contents !== 'read' && !(wf?.permissions && typeof wf.permissions === 'object' && Object.keys(wf.permissions).length === 0)) zgl('PERMISSIONS-KORZEN', 'brak `permissions: contents: read` na poziomie workflowu');
    const DANE_ZDARZEN = /\$\{\{\s*github\.(event\.(inputs|pull_request|head_commit|issue|comment)|head_ref)\b/;
    for (const [id, job] of Object.entries(wf?.jobs ?? {})) {
      if (job?.uses) { if (!/@[0-9a-f]{40}$/.test(job.uses) && !job.uses.startsWith('./')) zgl('AKCJA-NIEPRZYPIETA', `zadanie ${id}: ${job.uses}`); continue; } // workflow wielokrotnego użytku
      if (job?.['timeout-minutes'] === undefined) zgl('TIMEOUT', `zadanie ${id} bez timeout-minutes`);
      for (const [i, krok] of (job?.steps ?? []).entries()) {
        if (typeof krok?.run === 'string' && DANE_ZDARZEN.test(krok.run)) zgl('DANE-ZDARZEN-W-RUN', `zadanie ${id}, krok ${i + 1}: dane zdarzenia wprost w run: (przekaż przez env)`);
        if (typeof krok?.run === 'string' && krok.run.includes('get.maestro.mobile.dev')) {
          const v = krok.env?.MAESTRO_VERSION ?? job?.env?.MAESTRO_VERSION ?? wf?.env?.MAESTRO_VERSION;
          if (typeof v !== 'string' || !/^\d+\.\d+\.\d+$/.test(v)) zgl('MAESTRO-WERSJA', `zadanie ${id}, krok ${i + 1}: MAESTRO_VERSION nie jest dokładną wersją (${v ?? 'brak'}); pusta = najnowsza bez commita`);
          if (!/\[ -n "\$MAESTRO_VERSION" \] \|\| \{[^}]*exit 1/.test(krok.run) || /unset MAESTRO_VERSION/.test(krok.run)) zgl('MAESTRO-WERSJA', `zadanie ${id}, krok ${i + 1}: pusta MAESTRO_VERSION nie kończy kroku błędem`);
          if (!/--version[\s\S]*grep -q\w* "\$MAESTRO_VERSION"/.test(krok.run)) zgl('MAESTRO-WERSJA', `zadanie ${id}, krok ${i + 1}: brak porównania maestro --version z MAESTRO_VERSION`);
        }
        if (typeof krok?.uses === 'string' && !krok.uses.startsWith('actions/') && !krok.uses.startsWith('./') && !/@[0-9a-f]{40}$/.test(krok.uses)) zgl('AKCJA-NIEPRZYPIETA', `zadanie ${id}, krok ${i + 1}: ${krok.uses}`);
      }
    }
    let zSekretami = false, wydanie = false;
    for (const [id, job] of Object.entries(wf?.jobs ?? {})) {
      const env = typeof job?.environment === 'string' ? job.environment : job?.environment?.name;
      const tekstJob = JSON.stringify(job);
      const sekrety = [...tekstJob.matchAll(/secrets\.([A-Za-z0-9_]+)/g)].map((m) => m[1]).filter((s) => s !== 'GITHUB_TOKEN');
      // Inne sposoby sięgnięcia po sekrety (nie wyglądają jak `secrets.X`): `secrets['X']`, `toJSON(secrets)`, `secrets: inherit` — liczone jak sekret spoza listy ASC_*.
      if (/secrets\s*\[|toJSON\(\s*secrets/.test(tekstJob) || job?.secrets === 'inherit') sekrety.push('(sekrety niejawnie)');
      if (env === 'release') wydanie = true;
      if (sekrety.length) {
        zSekretami = true;
        const czytajace = ASC_TYLKO_ODCZYT.some((o) => o.plik === rel && o.zadanie === id) && sekrety.every((s) => s.startsWith('ASC_'))
          && !TRYB_ZAPISU.test(String(job?.if ?? ''));
        const przeklad = API_PRZEKLAD.some((o) => o.plik === rel && o.zadanie === id) && sekrety.every((s) => s === API_PRZEKLAD[0].sekret);
        if (env !== 'release' && !czytajace && !przeklad) zgl('SEKRET-BEZ-SRODOWISKA', `zadanie ${id} używa ${[...new Set(sekrety)].join(', ')} bez environment: release (zapis do ASC i inne sekrety tylko w release, P-463)`);
      }
    }
    if (/secrets\.(?!GITHUB_TOKEN)/.test(JSON.stringify(wf?.env ?? {}))) { zSekretami = true; zgl('SEKRET-BEZ-SRODOWISKA', 'sekret w env na poziomie workflowu'); }
    // Zadanie z listy czytających zwalnia z `environment`, więc: workflow ma tylko `workflow_dispatch`, a każdy skrypt scripts/asc/ w jego `run:` ma `--dry-run` i nie ma `--apply`.
    for (const o of API_PRZEKLAD.filter((x) => x.plik === rel)) {
      if (wyzwalacze.length !== 1 || wyzwalacze[0] !== 'workflow_dispatch') zgl('ODCZYT-WYZWALACZ', `workflow z zadaniem ${o.zadanie} (klucz API) ma wyzwalacze ${wyzwalacze.join(', ')} (dozwolony tylko workflow_dispatch)`);
    }
    for (const o of ASC_TYLKO_ODCZYT.filter((x) => x.plik === rel)) {
      if (wyzwalacze.length !== 1 || wyzwalacze[0] !== 'workflow_dispatch') zgl('ODCZYT-WYZWALACZ', `workflow z zadaniem czytającym ${o.zadanie} ma wyzwalacze ${wyzwalacze.join(', ')} (dozwolony tylko workflow_dispatch)`);
      for (const [i, krok] of (wf?.jobs?.[o.zadanie]?.steps ?? []).entries()) {
        const r = String(krok?.run ?? '');
        if (r.includes('scripts/asc/') && (!/--dry-run\b/.test(r) || /--apply\b/.test(r))) zgl('ODCZYT-Z-ZAPISEM', `zadanie ${o.zadanie}, krok ${i + 1}: skrypt scripts/asc/ w zadaniu czytającym musi mieć --dry-run i nie może mieć --apply`);
      }
    }
    if (zSekretami) for (const w of ['pull_request', 'pull_request_target', 'workflow_run']) if (wyzwalacze.includes(w)) zgl('WYZWALACZ-Z-SEKRETAMI', `wyzwalacz ${w} w workflowie z sekretami`);
    const testowe = tekst.match(/EXPO_PUBLIC_(STORE_FAKE|WATCH_FAKE|ICLOUD_FAKE|E2E|WYMUS_AWARIE|PSEUDO)\b/g);
    if (wydanie && testowe) zgl('SZTUCZNY-SKLEP-W-WYDANIU', `przełączniki testowe w workflowie wydania: ${[...new Set(testowe)].join(', ')}`);
  }
  return naruszenia;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const naruszenia = sprawdzWorkflowy(arg('--katalog') ?? process.cwd());
  for (const n of naruszenia) console.log(n);
  console.log(`workflowy: naruszeń ${naruszenia.length}`);
  process.exit(naruszenia.length ? 1 : 0);
}
