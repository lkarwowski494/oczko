/* Skrypty zrzutów zegarka (scripts/ci/zegarek-symulator.sh, zegarek-para.sh, zegarek-zrzuty.sh; ZW1, KO-197, 2026-11-22). Wzorzec: Trening (watch-simulator.sh, watch-pair.sh,
 * watch-screenshots.sh; testy tamtego repo na DRY_RUN i SIMCTL_LIST_JSON). Skrypty biegną na macOS z `xcrun simctl`; tu uruchamiamy je naprawdę na Linuksie z atrapami `xcrun`,
 * `plutil` i `defaults` w PATH, żeby sprawdzić przepływ sterowania: wybór zegarka, kolejność kandydatów na telefon, przekazanie stanu aplikacji (argumenty → preferencje),
 * GŁOŚNĄ porażkę, gdy kadr równa się ekranowi bez stanu albo poprzedniemu kadrowi, ponowienia uruchomienia i brak kanału alfa w wyniku.
 * Czego test NIE sprawdza: czy prawdziwy watchOS przyjmie argumenty uruchomienia i preferencje w kontenerze — to wykaże pierwszy przebieg macOS (obraz „bez stanu” i porównania kadrów
 * zatrzymają go z kodem 5 zamiast oddać puste kadry). */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { kadr } from './zegarek-pomoc';

const korzen = path.join(__dirname, '..', '..');
const skrypt = (n: string) => path.join(korzen, 'scripts/ci', n);
const BUNDLE = 'com.apps4brew.knitting.watchkitapp';
const KADRY = ['01-licznik', '02-przypomnienie', '03-zablokowany'];
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'oczko-zegarek-sh-'));

const LISTA = {
  devices: {
    'com.apple.CoreSimulator.SimRuntime.watchOS-26-0': [
      { udid: 'W-S10-42', name: 'Apple Watch Series 10 (42mm)' }, { udid: 'W-S10-46', name: 'Apple Watch Series 10 (46mm)' }, { udid: 'W-ULTRA', name: 'Apple Watch Ultra 3 (49mm)' }],
    'com.apple.CoreSimulator.SimRuntime.watchOS-26-4': [{ udid: 'W-S11-46', name: 'Apple Watch Series 11 (46mm)' }, { udid: 'W-S11-42', name: 'Apple Watch Series 11 (42mm)' }, { udid: 'W-SE3', name: 'Apple Watch SE 3 (44mm)' }],
    'com.apple.CoreSimulator.SimRuntime.iOS-18-6': [{ udid: 'P-18', name: 'iPhone 16' }],
    'com.apple.CoreSimulator.SimRuntime.iOS-26-4': [{ udid: 'P-264', name: 'iPhone 17 Pro' }, { udid: 'IPAD-264', name: 'iPad Pro 13-inch (M5)' }],
    'com.apple.CoreSimulator.SimRuntime.iOS-26-2': [{ udid: 'P-262', name: 'iPhone 17' }],
  },
};
const plikListy = () => { const k = tmp(); const f = path.join(k, 'lista.json'); fs.writeFileSync(f, JSON.stringify(LISTA)); return f; };

describe('składnia i spójność skryptów', () => {
  test.each(['zegarek-symulator.sh', 'zegarek-para.sh', 'zegarek-zrzuty.sh'])('%s: bash -n bez błędów, set -euo pipefail, bez sekretów i adresów', (n) => {
    expect(spawnSync('bash', ['-n', skrypt(n)], { encoding: 'utf8' }).status).toBe(0);
    const t = fs.readFileSync(skrypt(n), 'utf8');
    expect(t).toContain('set -euo pipefail');
    expect(t).not.toMatch(/ASC_|\.p8|EXPO_TOKEN|https?:\/\//);
  });
  test('zegarek-zrzuty.sh: zrzut `simctl io screenshot`, spłaszczenie alfy (splaszcz-png.mjs), obraz „bez stanu” i porównania kadrów, pliki NN-<kadr>.png', () => {
    const t = fs.readFileSync(skrypt('zegarek-zrzuty.sh'), 'utf8');
    expect(t).toContain('xcrun simctl io "$UDID" screenshot --type=png');
    expect(t).toContain('splaszcz-png.mjs');
    expect(t).toContain('bez-stanu.png');
    expect(t).toContain('PLIK="$OUT/$lang/$kadr.png"');
    expect(t).toContain('-oczko.zegarek.kontekst.v2');
    expect(t).toContain('oczko.zegarek.kontekst.v2 -data');
    expect(t).toMatch(/exit 5/); // stan nie dotarł do aplikacji: głośno
  });
});

describe('zegarek-symulator.sh: wybór symulatora (DRY_RUN, SIMCTL_LIST_JSON)', () => {
  const wybierz = (wzorzec?: string) => spawnSync('bash', [skrypt('zegarek-symulator.sh'), ...(wzorzec ? [wzorzec] : [])], { encoding: 'utf8', env: { ...process.env, DRY_RUN: '1', SIMCTL_LIST_JSON: plikListy() } });
  test('domyślnie Series 10/11/12 46 mm (416 × 496) z najnowszego watchOS, nie 42 mm i nie SE/Ultra', () => {
    const r = wybierz();
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('W-S11-46\n');
  });
  test('wzorzec z wejścia „urzadzenie”: Ultra 3 → jego identyfikator; puste = domyślny', () => {
    expect(wybierz('Apple Watch Ultra 3').stdout).toBe('W-ULTRA\n');
    expect(spawnSync('bash', [skrypt('zegarek-symulator.sh'), ''], { encoding: 'utf8', env: { ...process.env, DRY_RUN: '1', SIMCTL_LIST_JSON: plikListy() } }).stdout).toBe('W-S11-46\n');
  });
  test('brak zegarka pasującego do wzorca = błąd (nie cichy wybór innego rozmiaru: Apple wymaga jednego rozmiaru we wszystkich lokalizacjach)', () => {
    const r = wybierz('Apple Watch Series 99');
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/Brak symulatora watchOS pasującego do wzorca/);
    expect(r.stdout).toBe('');
  });
  test('na stdout TYLKO identyfikator (log CI jest publiczny)', () => {
    expect(wybierz().stdout.trim().split('\n')).toHaveLength(1);
  });
});

describe('zegarek-para.sh: kolejność kandydatów na telefon (DRY_RUN)', () => {
  const kandydaci = (lista = plikListy()) => spawnSync('bash', [skrypt('zegarek-para.sh'), 'W-S11-46'], { encoding: 'utf8', env: { ...process.env, DRY_RUN: '1', SIMCTL_LIST_JSON: lista } });
  test('iPhone’y od najnowszego iOS; iPady pomijane', () => {
    const r = kandydaci();
    expect(r.status).toBe(0);
    expect(r.stdout.trim().split('\n')).toEqual(['P-264', 'P-262', 'P-18']);
  });
  test('brak symulatora iPhone’a = błąd ::error::', () => {
    const k = tmp(); const f = path.join(k, 'l.json');
    fs.writeFileSync(f, JSON.stringify({ devices: { 'com.apple.CoreSimulator.SimRuntime.watchOS-26-4': [{ udid: 'W', name: 'Apple Watch Series 11 (46mm)' }] } }));
    const r = kandydaci(f);
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/::error::Brak symulatora iPhone/);
  });
  test('bez argumentu = błąd (nie parowanie „czegokolwiek”)', () => {
    expect(spawnSync('bash', [skrypt('zegarek-para.sh')], { encoding: 'utf8', env: { ...process.env, DRY_RUN: '1' } }).status).not.toBe(0);
  });
});

/** Środowisko z atrapami `xcrun`, `plutil`, `defaults`: aplikacja „czyta” stan z argumentów uruchomienia (jeśli ARGUMENTY=tak) i/lub z zapisanych preferencji (PREFERENCJE=tak). */
function srodowisko(opcje: { jezyki: string[]; argumenty: boolean; preferencje: boolean; identyczne?: [string, string]; uruchomienieNiepowodzen?: number; bezAplikacjiPoPorazce?: boolean }) {
  const k = tmp(); const bin = path.join(k, 'bin'); const obrazy = path.join(k, 'obrazy'); const out = path.join(k, 'wyjscie', 'zegarek-zrzuty');
  const app = path.join(k, 'OczkoZegarek.app'); const kontener = path.join(k, 'kontener');
  for (const d of [bin, obrazy, app, kontener]) fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(app, 'Info.plist'), 'x');
  const stany = `${out}.stany`;
  // obrazy: każdy stan inny (RGBA, jak z `simctl io`; skrypt ma je spłaszczyć), „bez stanu” = ekran „Otwórz Oczko na iPhonie”
  fs.writeFileSync(path.join(obrazy, 'bez-stanu.png'), kadr(416, 496, 99, 0, true));
  let n = 0;
  for (const j of opcje.jezyki) for (const kd of KADRY) fs.writeFileSync(path.join(obrazy, `${j}-${kd}.png`), kadr(416, 496, ++n, 0, true));
  if (opcje.identyczne) { const [a, b] = opcje.identyczne; fs.copyFileSync(path.join(obrazy, `${a}.png`), path.join(obrazy, `${b}.png`)); }
  const atrapa = (nazwa: string, tresc: string) => fs.writeFileSync(path.join(bin, nazwa), `#!/bin/bash\n${tresc}\n`, { mode: 0o755 });
  atrapa('plutil', `echo "${BUNDLE}"`);
  atrapa('defaults', 'echo "$*" >> "$STUB_DEFAULTS_LOG"; [ "$1" = write ] || exit 1; case "$3" in oczko.zegarek.kontekst.v2) echo "$5" > "$STUB_PREFERENCJE_HEX" ;; esac');
  atrapa('xcrun', `
shift  # simctl
cmd="$1"; shift
echo "$cmd $*" >> "$STUB_LOG"
case "$cmd" in
  install) exit 0 ;;
  terminate) exit 0 ;;
  get_app_container) [ -f "$STUB_BRAK_APLIKACJI" ] && exit 1; echo "$STUB_KONTENER"; exit 0 ;;
  launch)
    # licznik porażek: pierwsze STUB_PORAZKI uruchomień się nie udają
    n=$(cat "$STUB_LICZNIK" 2>/dev/null || echo 0)
    if [ "$n" -lt "$STUB_PORAZKI" ]; then echo $((n + 1)) > "$STUB_LICZNIK"; [ "$STUB_USUN_APLIKACJE" = tak ] && touch "$STUB_BRAK_APLIKACJI"; exit 1; fi
    shift 2; printf '%s' "$*" > "$STUB_OSTATNIE"; exit 0 ;;
  io)
    plik="\${@: -1}"
    hex=""
    if [ "$ARGUMENTY" = tak ]; then hex=$(sed -n 's/.*-oczko.zegarek.kontekst.v2 <\\([0-9a-f]*\\)>.*/\\1/p' "$STUB_OSTATNIE"); fi
    if [ -z "$hex" ] && [ "$PREFERENCJE" = tak ] && [ -s "$STUB_PREFERENCJE_HEX" ]; then hex=$(cat "$STUB_PREFERENCJE_HEX"); fi
    if [ -z "$hex" ]; then cp "$STUB_OBRAZY/bez-stanu.png" "$plik"; exit 0; fi
    f=$(grep -l -x -F -- "$hex" "$STUB_STANY"/*.hex | head -1)
    [ -n "$f" ] || { echo "atrapa: nieznany stan" >&2; exit 1; }
    cp "$STUB_OBRAZY/$(basename "$f" .hex).png" "$plik"; exit 0 ;;
esac`);
  const env = {
    ...process.env, PATH: `${bin}:${process.env.PATH}`, PROB: '3', PRZERWA: '0', CZEKAJ: '0',
    STUB_LOG: path.join(k, 'xcrun.log'), STUB_DEFAULTS_LOG: path.join(k, 'defaults.log'), STUB_OSTATNIE: path.join(k, 'ostatnie'), STUB_PREFERENCJE_HEX: path.join(k, 'pref.hex'),
    STUB_LICZNIK: path.join(k, 'licznik'), STUB_PORAZKI: String(opcje.uruchomienieNiepowodzen ?? 0), STUB_USUN_APLIKACJE: opcje.bezAplikacjiPoPorazce ? 'tak' : 'nie',
    STUB_BRAK_APLIKACJI: path.join(k, 'brak-aplikacji'), STUB_KONTENER: kontener, STUB_OBRAZY: obrazy, STUB_STANY: stany,
    ARGUMENTY: opcje.argumenty ? 'tak' : 'nie', PREFERENCJE: opcje.preferencje ? 'tak' : 'nie',
  };
  for (const f of ['xcrun.log', 'defaults.log']) fs.writeFileSync(path.join(k, f), '');
  const uruchom = (jezyki: string) => spawnSync('bash', [skrypt('zegarek-zrzuty.sh'), 'UDID-ZEGARKA', app, out, jezyki, '2026-11-22'], { encoding: 'utf8', env, cwd: korzen });
  const log = (n: string) => fs.readFileSync(path.join(k, n), 'utf8');
  return { out, uruchom, log, stany };
}
const komplet = (out: string, jezyki: string) => spawnSync(process.execPath, [skrypt('zegarek-kadry.mjs'), 'komplet', out, jezyki, '416x496'], { encoding: 'utf8', cwd: korzen });

describe('zegarek-zrzuty.sh na atrapach xcrun/plutil/defaults', () => {
  test('stan przekazany argumentami uruchomienia: komplet 2 języków × 3 kadry, RGB bez alfy 416×496, bez zapisu preferencji, kod 0', () => {
    const s = srodowisko({ jezyki: ['en', 'pl'], argumenty: true, preferencje: false });
    const r = s.uruchom('en,pl');
    expect(r.stderr).toBe('');
    expect(r.stdout).toMatch(/Zrzuty zegarka: 6 plików, języków: 2, metoda przekazania stanu: argumenty/);
    expect(r.status).toBe(0);
    expect(komplet(s.out, 'en,pl').status).toBe(0); // układ NN-<kadr>.png, jeden rozmiar, BEZ alfy mimo RGBA z atrapy simctl
    expect(s.log('defaults.log')).toBe('');
    expect(s.log('xcrun.log')).toMatch(/launch UDID-ZEGARKA com\.apps4brew\.knitting\.watchkitapp -oczko\.zegarek\.jezyk\.v1 pl -oczko\.zegarek\.kontekst\.v2 <[0-9a-f]+>/);
    expect(s.log('xcrun.log')).toMatch(/io UDID-ZEGARKA screenshot --type=png /);
  });

  test('argumenty ignorowane, preferencje działają: przejście na zapis preferencji (defaults write -data), komplet OK, w logu ostrzeżenie', () => {
    const s = srodowisko({ jezyki: ['en', 'pl'], argumenty: false, preferencje: true });
    const r = s.uruchom('en,pl');
    expect(r.stdout).toMatch(/::warning::Argumenty uruchomienia nie przekazały stanu/);
    expect(r.stdout).toMatch(/metoda przekazania stanu: preferencje/);
    expect(r.status).toBe(0);
    expect(komplet(s.out, 'en,pl').status).toBe(0);
    const d = s.log('defaults.log');
    expect(d).toMatch(/write .*\/Library\/Preferences\/com\.apps4brew\.knitting\.watchkitapp oczko\.zegarek\.kontekst\.v2 -data [0-9a-f]+/);
    expect(d).toMatch(/oczko\.zegarek\.jezyk\.v1 -string (en|pl)/);
  });

  test('GŁOŚNA PORAŻKA: żadna metoda nie przekazuje stanu (kadr = ekran „Otwórz Oczko na iPhonie”) → kod 5, nie puste kadry', () => {
    const s = srodowisko({ jezyki: ['en'], argumenty: false, preferencje: false });
    const r = s.uruchom('en');
    expect(r.status).toBe(5);
    expect(r.stdout).toMatch(/::error::Kadr en\/01-licznik jest taki sam jak ekran bez stanu/);
  });

  test('GŁOŚNA PORAŻKA: dwa kadry tego samego języka identyczne (stan nie zmienia ekranu) → kod 5', () => {
    const s = srodowisko({ jezyki: ['en'], argumenty: true, preferencje: false, identyczne: ['en-01-licznik', 'en-02-przypomnienie'] });
    const r = s.uruchom('en');
    expect(r.status).toBe(5);
    expect(r.stdout).toMatch(/::error::Kadr en\/02-przypomnienie jest taki sam jak wcześniejszy kadr tego języka/);
  });

  test('uruchomienie ponawiane (PROB): 2 porażki, potem sukces = kod 0; po porażce, gdy aplikacji nie ma, ponowna instalacja (L-064 Treningu)', () => {
    const s = srodowisko({ jezyki: ['pl'], argumenty: true, preferencje: false, uruchomienieNiepowodzen: 2, bezAplikacjiPoPorazce: true });
    const r = s.uruchom('pl');
    expect(r.stdout).toMatch(/::warning::Uruchomienie aplikacji zegarka nie powiodło się \(próba 1 z 3\)/);
    expect(r.stdout).toMatch(/::warning::Aplikacji nie ma już na zegarku — instaluję ponownie/);
    expect(r.status).toBe(0);
    expect((s.log('xcrun.log').match(/^install /gm) ?? []).length).toBeGreaterThanOrEqual(2); // pierwsza instalacja + ponowna
  });

  test('uruchomienie nigdy się nie udaje = kod 4 z komunikatem (po PROB próbach), bez zrzutów', () => {
    const s = srodowisko({ jezyki: ['pl'], argumenty: true, preferencje: false, uruchomienieNiepowodzen: 99 });
    const r = s.uruchom('pl');
    expect(r.status).toBe(4);
    expect(r.stdout).toMatch(/::error::Aplikacja zegarka nie uruchomiła się po 3 próbach/);
  });

  test('zła lista języków (język bez lokalizacji sklepu) = kod 2 przed jakimkolwiek wywołaniem simctl', () => {
    const s = srodowisko({ jezyki: ['en'], argumenty: true, preferencje: false });
    const r = s.uruchom('en,bg');
    expect(r.status).toBe(2);
    expect(s.log('xcrun.log')).toBe('');
  });

  test('ostrzeżenie o danych zastępczych (język bez własnych danych pokazowych) trafia do logu jako ::warning::', () => {
    const s = srodowisko({ jezyki: ['en', 'de'], argumenty: true, preferencje: false });
    const r = s.uruchom('en,de');
    expect(r.stdout).toMatch(/::warning::de: dane pokazowe w języku angielskim/);
    expect(r.status).toBe(0);
  });
});
