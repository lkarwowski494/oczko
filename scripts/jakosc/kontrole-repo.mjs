// Kontrole repo roli 07 (docs/jakosc/strategia.md §10: kontrole 05-8, 12, P-089). Każda reguła ma w tests/jakosc/kontrole-repo.test.ts
// przypadek dobry i plik-pułapkę, na którym pada. Kod 0.1.0 (src/core, src/components, src/screens, lib) był poza zakresem (wyjątek DS-13);
// rola 08 usunęła go w partii porządkowej (P-099 D1a), a `app` (korzeń expo-router) jest w zakresie (P-114 Q4a). Tryb `--stary` usunięty (P-117 Q5a):
// sprawdzał katalogi, których już nie ma, i raportował „0 naruszeń”; w zamian STARY-KOD-WRACA — katalogi 0.1.0 nie mogą wrócić.
// Użycie: node scripts/jakosc/kontrole-repo.mjs [--katalog <korzeń>]   (kod 0 = brak naruszeń, 1 = naruszenia, 2 = zły korzeń)
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const korzen = arg('--katalog') ?? process.cwd();

// Zakres: cały kod aplikacji, nie lista podkatalogów — nowy katalog w `src/` trafia do kontroli sam (M1-audytor-generalny-148, zasada wspólna 21).
export const NOWY_KOD = ['src', 'app', 'modules', 'targets'];
export const STARY_KOD = ['src/core', 'src/components', 'src/screens', 'lib']; // katalogi 0.1.0: nie mogą wrócić (STARY-KOD-WRACA)
const TEST = /(^|\/)(__tests__|tests?)\/|\.(test|spec)\.[jt]sx?$/;
const EXT = /\.(ts|tsx|js|jsx|mjs|swift|json)$/;

// Reguły: id, opis, wzorzec (na tekście z ujednoliconymi białymi znakami), pliki (regex ścieżki względnej), wolno (regex ścieżek dozwolonych).
export const REGULY = [
  { id: 'OR-REPLACE', opis: 'INSERT OR REPLACE kasuje dzieci przy ON DELETE CASCADE; tylko UPSERT (zasada wspólna 10, dane.md)', wzorzec: /\bOR\s+REPLACE\b/i },
  { id: 'EXCLUSIVE-TX', opis: 'withExclusiveTransactionAsync otwiera drugie połączenie bez foreign_keys (ADR-0002)', wzorzec: /withExclusiveTransactionAsync/ },
  { id: 'BAZA-W-PAMIECI', opis: 'baza w pamięci poza testami gubi dane (rola 12)', wzorzec: /:memory:|createInMemoryDatabase/, wolno: /^src\/dane\/baza\/adapter-node\.ts$/ },
  { id: 'KOPIA-SAMEGO-DB', opis: 'kopia samego pliku .db przy WAL gubi dane; tylko VACUUM INTO (ADR-0020)', wzorzec: /copy\w*\s*\([^)]*\.db\b|\.db['"`]\s*,\s*[^)]*copy/i },
  { id: 'VACUUM-RATUNEK', opis: 'VACUUM/REINDEX na bazie głównej w kodzie ratunkowym (rola 12)', wzorzec: /\b(VACUUM|REINDEX)\b(?!\s+INTO)/i, pliki: /(ratunk|awaryj)/i },
  { id: 'STARY-PLIK-0-1-0', opis: 'nowa wersja nie dotyka Library/SQLite/oczko.db (P-070, ADR-0015)', wzorzec: /Library\/SQLite/ },
  { id: 'SQLITE3-SWIFT', opis: 'Swift nie importuje SQLite3 (ADR-0008)', wzorzec: /^\s*import\s+SQLite3\b/m, pliki: /\.swift$/ },
  { id: 'SZTUCZNY-SKLEP', opis: 'przełącznik sztucznego sklepu tylko w adapterze sklepu (wzór Treningu lib/products.ts); w buildzie wydania sprawdza scripts/wydanie/kontrola-ipa.sh', wzorzec: /EXPO_PUBLIC_STORE_FAKE/, wolno: /^src\/platforma\/sklep[^/]*\.ts$/ },
  { id: 'TRYB-E2E', opis: 'przełączniki buildu E2E (e2e/README.md) tylko w jednym module platformy; w buildzie wydania sprawdza scripts/wydanie/kontrola-ipa.sh', wzorzec: /EXPO_PUBLIC_(E2E|WATCH_FAKE)\b/, wolno: /^src\/platforma\/tryb-e2e\.ts$/ },
  { id: 'ATRAPA-ICLOUD', opis: 'atrapa silnika iCloud tylko w wyborze adaptera, atrapie i trybie E2E (P-230, moduly.md „Atrapa silnika w E2E”); w wydaniu sprawdza sprawdz-workflowy', wzorzec: /EXPO_PUBLIC_ICLOUD_FAKE/, wolno: /^src\/platforma\/(icloud|icloud-atrapa|tryb-e2e)\.ts$/ },
  { id: 'WYMUSZONA-AWARIA', opis: 'przełącznik wymuszonej awarii tylko w konfiguracji testowej (rola 12)', wzorzec: /EXPO_PUBLIC_WYMUS_AWARIE/, wolno: /^src\/platforma\/straznik-startu[^/]*\.ts$/ },
  { id: 'CENY-W-KODZIE', opis: 'ceny tylko ze StoreKit (displayPrice), bez cen wpisanych w kod (P-089 (1))', wzorzec: /[$€£]\s?\d+[.,]\d{2}(?!\d)|(?<![\d.,])\d+[.,]\d{2}\s?(zł|€|£|USD|EUR|PLN|GBP)(?![A-Za-z])|(?<![A-Za-z])(USD|EUR|PLN|GBP)\s?\d+[.,]\d{2}(?!\d)/, wolno: /^src\/platforma\/sklep-sztuczny\.ts$/, pliki: /\.(ts|tsx|js|jsx)$/ },
];

// Reguły na plikach konfiguracji (package.json, app.json).
const SDK_AWARII = /^(@sentry\/|sentry-|@bugsnag\/|bugsnag|@datadog\/|@react-native-firebase\/crashlytics|instabug|@embrace-io\/)/;
// BR-ZAK-002, KP-11, NFR-KOS-001: bez analityki, reklam i śledzenia (koszt 0 zł, brak sieci poza Apple).
const SDK_SLEDZENIA = /^(@react-native-firebase\/(analytics|app)|firebase|@segment\/|mixpanel|@amplitude\/|amplitude|react-native-appsflyer|react-native-adjust|react-native-branch|react-native-google-mobile-ads|expo-ads-|react-native-fbsdk|@datadog\/|posthog|expo-tracking-transparency|@sentry\/)/;
const DZWIEK = /^(expo-av|expo-audio|react-native-sound|react-native-track-player)$/; // BR-LIC-005: haptyka bez dźwięku (moduly.md, port Haptyka)
const PRZYPIETE = ['expo-iap', '@bacons/apple-targets', '@testing-library/react-native', 'eslint', '@typescript-eslint/parser', 'yaml'];

function pliki(katalog) {
  const wynik = [];
  if (!existsSync(katalog)) return wynik;
  if (statSync(katalog).isFile()) return [katalog];
  for (const n of readdirSync(katalog)) {
    if (n === 'node_modules' || n.startsWith('.')) continue;
    const p = join(katalog, n);
    if (statSync(p).isDirectory()) wynik.push(...pliki(p));
    else if (EXT.test(n)) wynik.push(p);
  }
  return wynik;
}
const rel = (p) => relative(korzen, p).split(sep).join('/');
function sledzone(k) {
  if (existsSync(join(k, '.git'))) {
    try { return execFileSync('git', ['ls-files'], { cwd: k, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\n').filter(Boolean); } catch { /* bez git: przegląd katalogu */ }
  }
  const wynik = [];
  (function skan(d) { for (const n of readdirSync(d)) { if (n === 'node_modules' || n === '.git') continue; const p = join(d, n); if (statSync(p).isDirectory()) skan(p); else wynik.push(relative(k, p).split(sep).join('/')); } })(k);
  return wynik;
}

export function sprawdz(korzenKatalog, zakres) {
  const naruszenia = [];
  for (const k of STARY_KOD) if (existsSync(join(korzenKatalog, k))) naruszenia.push(`STARY-KOD-WRACA ${k} — kod 0.1.0 usunięty (P-099 D1a); nowy kod tylko w ${NOWY_KOD.join(', ')} (P-117 Q5a)`);
  const wyjatkiPlik = join(korzenKatalog, 'scripts/jakosc/wyjatki.json');
  const wyjatki = existsSync(wyjatkiPlik) ? JSON.parse(readFileSync(wyjatkiPlik, 'utf8')).kontrole ?? [] : [];
  const zwolniony = (r, p) => wyjatki.some((w) => w.regula === r && w.plik === p);
  for (const kat of zakres) {
    for (const p of pliki(join(korzenKatalog, kat))) {
      const r = relative(korzenKatalog, p).split(sep).join('/');
      if (TEST.test(r)) continue;
      const tekst = readFileSync(p, 'utf8').replace(/[ ​⁠﻿]/g, ' ');
      for (const reg of REGULY) {
        if (reg.pliki && !reg.pliki.test(r)) continue;
        if (reg.wolno && reg.wolno.test(r)) continue;
        const m = tekst.match(reg.wzorzec);
        if (m && !zwolniony(reg.id, r)) {
          const linia = tekst.slice(0, m.index).split('\n').length;
          naruszenia.push(`${reg.id} ${r}:${linia} — ${reg.opis}`);
        }
      }
    }
  }
  // PLIK-SEKRETU (F07-09, z tests/public-repo.test.ts 0.1.0; JAK-10, zasada wspólna 14): w plikach śledzonych przez git (bez git: wszystkie pliki)
  // nie ma kluczy, certyfikatów, profili, .ipa ani .env, a pliki tekstowe nie zawierają bloku klucza prywatnego.
  for (const r of sledzone(korzenKatalog)) {
    if (/\.(p8|p12|mobileprovision|cer|keystore|jks|ipa)$/i.test(r) || /(^|\/)\.env(\..+)?$/.test(r)) { naruszenia.push(`PLIK-SEKRETU ${r} — klucz, certyfikat, profil, .ipa albo .env w repo publicznym`); continue; }
    if (/\.(ts|tsx|js|mjs|cjs|json|md|yml|yaml|html|txt|pem|key)$/i.test(r) && r !== 'scripts/jakosc/kontrole-repo.mjs') {
      const p = join(korzenKatalog, r);
      if (existsSync(p) && statSync(p).isFile() && /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(readFileSync(p, 'utf8'))) naruszenia.push(`PLIK-SEKRETU ${r} — blok klucza prywatnego`);
    }
  }
  const pkgPlik = join(korzenKatalog, 'package.json');
  if (existsSync(pkgPlik)) {
    const pkg = JSON.parse(readFileSync(pkgPlik, 'utf8'));
    const zal = { ...pkg.dependencies, ...pkg.devDependencies };
    // ADR-0016 „Potwierdzenie”: każda zależność runtime ma wiersz w tabeli „Decyzja” (P-099, P-117 Q4a: `dependencies` po nazwie; wersje do partii 2–3, P-114 Q6a).
    const runtime = Object.keys(pkg.dependencies ?? {});
    if (runtime.length) {
      const adrKat = join(korzenKatalog, 'docs/adr');
      const adr = existsSync(adrKat) ? readdirSync(adrKat).find((n) => /^0016-.*\.md$/.test(n)) : null;
      if (!adr) naruszenia.push('ZALEZNOSC-BEZ-ADR package.json — brak docs/adr/0016-*.md z tabelą zależności');
      else {
        const tekst = readFileSync(join(adrKat, adr), 'utf8');
        const decyzja = tekst.slice(tekst.indexOf('## Decyzja'), tekst.indexOf('\n## ', tekst.indexOf('## Decyzja') + 1) >>> 0);
        const wTabeli = new Set(decyzja.split('\n').filter((l) => l.startsWith('| ')).flatMap((l) => [...l.split('|')[1].matchAll(/`(@?[a-z0-9][\w.-]*(?:\/[\w.-]+)?)`/g)].map((m) => m[1])));
        for (const n of runtime) if (!wTabeli.has(n)) naruszenia.push(`ZALEZNOSC-BEZ-ADR package.json: ${n} — brak wiersza w tabeli ADR-0016 (${adr}); nowa zależność = nowy wiersz (rola 05/08)`);
      }
    }
    for (const [n, v] of Object.entries(zal)) {
      if (n === 'expo-updates') naruszenia.push(`EXPO-UPDATES package.json — bez OTA (ADR-0021)`);
      if (SDK_AWARII.test(n)) naruszenia.push(`SDK-AWARII package.json: ${n} — sygnał bez SDK (ADR-0018)`);
      if (SDK_SLEDZENIA.test(n)) naruszenia.push(`SDK-SLEDZENIA package.json: ${n} — bez analityki, reklam i śledzenia (BR-ZAK-002, KP-11)`);
      if (DZWIEK.test(n)) naruszenia.push(`DZWIEK package.json: ${n} — aplikacja nie odtwarza dźwięku (BR-LIC-005)`);
      if (PRZYPIETE.includes(n) && !/^\d+\.\d+\.\d+$/.test(v)) naruszenia.push(`PRZYPIECIE package.json: ${n}@${v} — wersja dokładna (ADR-0016)`);
    }
  }
  const appPlik = join(korzenKatalog, 'app.json');
  if (existsSync(appPlik)) {
    const app = JSON.parse(readFileSync(appPlik, 'utf8'));
    if (app.expo?.ios?.privacyManifests?.NSPrivacyTracking !== false) naruszenia.push('SLEDZENIE app.json: ios.privacyManifests.NSPrivacyTracking musi być false (BR-ZAK-002, KP-11)');
    if (app.expo?.updates && app.expo.updates.enabled !== false) naruszenia.push('EXPO-UPDATES app.json: sekcja updates włączona — bez OTA (ADR-0021)');
  }
  const manifest = join(korzenKatalog, 'docs/jakosc/migracje-wydane.json');
  if (existsSync(manifest)) {
    for (const { plik, sha256 } of JSON.parse(readFileSync(manifest, 'utf8')).migracje ?? []) {
      const p = join(korzenKatalog, plik);
      if (!existsSync(p)) { naruszenia.push(`MIGRACJA-WYDANA ${plik} — plik wydanej migracji usunięty`); continue; }
      const h = createHash('sha256').update(readFileSync(p)).digest('hex');
      if (h !== sha256) naruszenia.push(`MIGRACJA-WYDANA ${plik} — zmieniona po wydaniu (SHA-256 ${h.slice(0, 12)}… ≠ ${sha256.slice(0, 12)}…); nowa zmiana = nowa migracja`);
    }
  }
  return naruszenia;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!existsSync(join(korzen, 'package.json'))) { console.log(`BŁĄD ${korzen}: brak package.json — zły korzeń repo`); process.exit(2); }
  const naruszenia = sprawdz(korzen, NOWY_KOD);
  for (const n of naruszenia) console.log(n);
  console.log(`nowy kod: naruszeń ${naruszenia.length}`);
  process.exit(naruszenia.length ? 1 : 0);
}
