// granice.mjs — użycie: node granice.mjs <katalog-źródeł> [--domena domena] [--limit 20] [--repo <katalog repo = rodzic źródeł>]
// Reguły (moduly.md, ADR-0002, ADR-0003, ADR-0007, ADR-0008; fix 05 2026-10-25, Z07-16). Importy rozwiązuje kompilator TypeScript
// (`ts.resolveModuleName` z opcjami z tsconfig.json repo, z aliasami), z drzewa składni: import/export, `require(…)`, `import(…)`.
//   DOMENA        domena importuje (wartości) tylko z domeny i z `<źródła>/konfiguracja.ts`; `import type` wolno; import z wyrażenia = naruszenie
//   KONFIGURACJA  `<źródła>/konfiguracja.ts` niczego nie importuje (wartości)
//   SQLITE        `expo-sqlite` tylko w `<źródła>/dane/baza/`
//   EKRANY        `ekrany/` i `komponenty/` nie importują wartości z `dane/`
//   IOS           brak katalogu `ios/` w repo (CNG, ADR-0007)
//   SWIFT         brak `import SQLite3` w plikach .swift w `targets/` i `modules/` (ADR-0008)
//   ROZMIAR, CYKL plik ponad limit KB, cykl importów wartości
//   PUSTO         brak plików źródłowych albo brak katalogu domeny — kontrola nie może być zielona na pustym wejściu
// Kod wyjścia 1 przy naruszeniu.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { createRequire } from 'node:module';
const arg = process.argv.slice(2);
const opcja = (n, d) => (arg.includes(n) ? arg[arg.indexOf(n) + 1] : d);
const src = arg[0];
const root = resolve(src), repo = resolve(opcja('--repo', dirname(root)));
const dom = resolve(root, opcja('--domena', 'domena')) + sep, limitKB = Number(opcja('--limit', '20'));
const konfiguracja = join(root, 'konfiguracja.ts');
const ts = createRequire(join(process.cwd(), 'package.json'))('typescript');
const EXT = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];
const DOZWOLONE = /^$/; // pakiety dozwolone w domenie (czyste biblioteki z ADR), np. /^(date-fns|zod)(\/.*)?$/
const pomin = (p) => /\.(test|spec)\.|\.d\.ts$|__tests__|node_modules/.test(p);
const zbierz = (d, ok) => (existsSync(d) ? readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? (n === 'node_modules' ? [] : zbierz(p, ok)) : ok(n, p) ? [p] : []; }) : []);
const pliki = zbierz(root, (n, p) => EXT.some((e) => n.endsWith(e)) && !pomin(p));
let bledy = 0; const zgl = (s) => { console.log(s); bledy++; };

if (!pliki.length) zgl(`PUSTO ${src}: 0 plików źródłowych`);
if (!existsSync(dom)) zgl(`PUSTO brak katalogu domeny ${relative(repo, dom)}`);

// Opcje kompilatora z tsconfig.json repo (aliasy `paths`); bez pliku: alias `@/` = katalog źródeł.
let opcjeTs = { baseUrl: repo, paths: { '@/*': [relative(repo, root) + '/*'] }, moduleResolution: ts.ModuleResolutionKind.Node10, allowJs: true, resolveJsonModule: true };
const tsconfig = join(repo, 'tsconfig.json');
if (existsSync(tsconfig)) {
  const c = ts.readConfigFile(tsconfig, ts.sys.readFile);
  if (!c.error) opcjeTs = { ...opcjeTs, ...ts.parseJsonConfigFileContent(c.config, ts.sys, repo).options };
}
const rozwiaz = (spec, z) => ts.resolveModuleName(spec, z, opcjeTs, ts.sys).resolvedModule?.resolvedFileName;

/** Importy pliku z drzewa składni: { spec | null (wyrażenie), tylkoTyp }. */
function importy(p, tekst) {
  const sf = ts.createSourceFile(p, tekst, ts.ScriptTarget.Latest, true, p.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out = [];
  const odwiedz = (w) => {
    if (ts.isImportDeclaration(w) && ts.isStringLiteral(w.moduleSpecifier)) {
      const k = w.importClause;
      const tylkoTyp = Boolean(k && (k.isTypeOnly || (!k.name && k.namedBindings && ts.isNamedImports(k.namedBindings) && k.namedBindings.elements.length > 0 && k.namedBindings.elements.every((e) => e.isTypeOnly))));
      out.push({ spec: w.moduleSpecifier.text, tylkoTyp });
    } else if (ts.isExportDeclaration(w) && w.moduleSpecifier && ts.isStringLiteral(w.moduleSpecifier)) {
      out.push({ spec: w.moduleSpecifier.text, tylkoTyp: w.isTypeOnly });
    } else if (ts.isImportEqualsDeclaration(w) && ts.isExternalModuleReference(w.moduleReference) && ts.isStringLiteral(w.moduleReference.expression)) {
      out.push({ spec: w.moduleReference.expression.text, tylkoTyp: w.isTypeOnly });
    } else if (ts.isCallExpression(w) && (w.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(w.expression) && w.expression.text === 'require'))) {
      const a = w.arguments[0];
      out.push({ spec: a && (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a)) ? a.text : null, tylkoTyp: false });
    }
    ts.forEachChild(w, odwiedz);
  };
  odwiedz(sf);
  return out;
}

const pod = (p, kat) => p.startsWith(join(root, kat) + sep);
const graf = new Map();
for (const p of pliki) {
  const tekst = readFileSync(p, 'utf8'), rel = relative(root, p), kb = Buffer.byteLength(tekst) / 1024;
  // ARCH-04: pliki generowane (pierwsza linia „// Wygenerowane:”, np. kopia migracji SQL w sql.ts) nie podlegają limitowi rozmiaru (fix-7 05).
  if (kb > limitKB && !tekst.startsWith('// Wygenerowane:')) zgl(`ROZMIAR ${rel}: ${kb.toFixed(1)} KB > ${limitKB} KB`);
  const krawedzie = [];
  for (const { spec, tylkoTyp } of importy(p, tekst)) {
    if (spec === null) { if (p.startsWith(dom) || p === konfiguracja) zgl(`DOMENA ${rel}: import z wyrażenia (nie da się sprawdzić granicy)`); continue; }
    const r = rozwiaz(spec, p);
    const cel = r && !r.includes(`${sep}node_modules${sep}`) && resolve(r).startsWith(repo + sep) ? resolve(r) : null;
    const pakiet = !cel && !spec.startsWith('.') ? spec : null;
    if (tylkoTyp) continue;
    if (cel) krawedzie.push(cel);
    if (p.startsWith(dom) && !(cel && (cel.startsWith(dom) || cel === konfiguracja)) && !(pakiet && DOZWOLONE.test(pakiet))) zgl(`DOMENA ${rel} importuje '${spec}'`);
    if (p === konfiguracja) zgl(`KONFIGURACJA ${rel} importuje '${spec}' (konfiguracja.ts niczego nie importuje)`);
    if (/^expo-sqlite(\/|$)/.test(spec) && !pod(p, join('dane', 'baza'))) zgl(`SQLITE ${rel} importuje '${spec}' poza dane/baza (ADR-0002)`);
    if ((pod(p, 'ekrany') || pod(p, 'komponenty')) && cel && pod(cel, 'dane')) zgl(`EKRANY ${rel} importuje '${spec}' z dane/ (moduly.md: ekrany → przypadki użycia)`);
  }
  graf.set(p, krawedzie);
}
if (existsSync(join(repo, 'ios'))) zgl('IOS katalog ios/ w repo (ADR-0007: tylko expo prebuild)');
for (const s of ['targets', 'modules'].flatMap((k) => zbierz(join(repo, k), (n) => n.endsWith('.swift')))) {
  if (/^\s*import\s+SQLite3\b/m.test(readFileSync(s, 'utf8'))) zgl(`SWIFT ${relative(repo, s)}: import SQLite3 (ADR-0008)`);
}
const stan = new Map(), sciezka = [], cykle = new Set();
const dfs = (u) => {
  stan.set(u, 1); sciezka.push(u);
  for (const v of graf.get(u) ?? []) {
    if (stan.get(v) === 1) cykle.add(sciezka.slice(sciezka.indexOf(v)).concat(v).map((x) => relative(root, x)).join(' -> '));
    else if (!stan.has(v) && graf.has(v)) dfs(v);
  }
  sciezka.pop(); stan.set(u, 2);
};
for (const p of pliki) if (!stan.has(p)) dfs(p);
for (const c of cykle) zgl(`CYKL ${c}`);
console.log(bledy ? `${bledy} naruszeń w ${pliki.length} plikach` : `OK: ${pliki.length} plików, bez naruszeń`);
process.exit(bledy ? 1 : 0);
