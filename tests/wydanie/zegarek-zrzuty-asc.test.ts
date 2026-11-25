/* Wgranie zrzutów zegarka przez `scripts/asc/zrzuty.mjs --zegarek` (asc-zrzuty.yml, wejście `zegarek_z_przebiegu`; ZW1, KO-197, 2026-11-22).
 * Pytanie koordynatora: czy wgranie zegarka nie zdubluje 189 zrzutów iPhone’a? Skrypt wybiera grupę urządzeń z wymiarów pliku (App Asset Library, `appAssetLibraryRefData`) i pomija
 * każdą grupę lokalizacji, która ma już zrzuty (plan: `existing(locId, group)`), więc ponowne wgranie z samym zegarkiem dotyka tylko grupy zegarka.
 * Test uruchamia plan na atrapie danych referencyjnych (dwie grupy: iPhone 6.9″ i Apple Watch 416×496) oraz czyta kadry z katalogu w układzie artefaktu `zegarek-zrzuty`.
 * Uwaga nazwana: czy dane referencyjne Apple (`GET /v1/appAssetLibraryRefData`) mają specyfikację Apple Watch 416×496 bez alfy, wykaże dopiero dry-run `asc-zrzuty.yml`
 * (błąd planu „brak pasującej specyfikacji w danych Apple” zatrzymuje zapis przed jakimkolwiek wgraniem) — [DO USTALENIA] do pierwszego dry-runu. */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { kadr } from './zegarek-pomoc';

const korzen = path.join(__dirname, '..', '..');
const ZRZUTY = JSON.stringify(path.join(korzen, 'scripts/asc/zrzuty.mjs'));

/** Plan na atrapie: refData z grupami G-IPHONE (1320×2868) i G-WATCH (416×496); `existing` podaje liczbę zrzutów w grupie lokalizacji. */
function plan(opcje: { jezyki: string[]; ileIphone?: number; ileZegarek?: number; bezZegarkaWRef?: boolean; zrzutowZegarka?: number }) {
  const kod = `import * as Z from ${ZRZUTY};
    const f = (n, w, h) => ({ name: n, path: '/x/' + n, size: 1, width: w, height: h, alpha: false, sha: 'aabbccddeeff' });
    const jezyki = ${JSON.stringify(opcje.jezyki)};
    const zeg = Array.from({ length: ${opcje.zrzutowZegarka ?? 2} }, (_, i) => f('0' + (i + 1) + '-k.png', 416, 496));
    const ip = Array.from({ length: 7 }, (_, i) => f('0' + (i + 1) + '-e.png', 1320, 2868));
    const ref = { imageSpecs: [{ specId: 'S69', alphaAllowed: false, dimensions: { minWidth: 1320, maxWidth: 1320, minHeight: 2868, maxHeight: 2868 } }
      ${opcje.bezZegarkaWRef ? '' : ", { specId: 'SW', alphaAllowed: false, dimensions: { minWidth: 416, maxWidth: 416, minHeight: 496, maxHeight: 496 } }"}],
      placementTypes: [{ placementTypeId: 'APP_SCREENSHOT', specMappings: [{ specs: ['S69'], placementGroupId: 'G-IPHONE' }${opcje.bezZegarkaWRef ? '' : ", { specs: ['SW'], placementGroupId: 'G-WATCH' }"}] }] };
    const M = await import(${JSON.stringify(path.join(korzen, 'scripts/asc/metadane.mjs'))});
    const locsAsc = new Map(Object.values(Z.SHOT_LOCALES).flat().filter((l) => M.LOCALE_MAP[l]).map((l) => [M.LOCALE_MAP[l], 'ID-' + l]));
    const wywolania = [];
    const existing = async (locId, group) => { wywolania.push(group); return group === 'G-IPHONE' ? ${opcje.ileIphone ?? 0} : ${opcje.ileZegarek ?? 0}; };
    const shots = { iphone: new Map(jezyki.map((j) => [j, ip])), zegarek: new Map(jezyki.map((j) => [j, zeg])) };
    const p = await Z.plan({ shots, locs: locsAsc, refData: ref, existing });
    process.stdout.write(JSON.stringify({ rows: p.rows.map((r) => ({ zrodlo: r.source, jezyk: r.lang, locale: r.locale, grupa: r.group, akcja: r.action, powod: r.reason, plikow: r.files?.length ?? 0 })), errors: p.errors, wywolania }));`;
  return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', kod], { encoding: 'utf8' })) as {
    rows: Array<{ zrodlo: string; jezyk: string; locale: string; grupa: string; akcja: string; powod: string; plikow: number }>; errors: string[]; wywolania: string[];
  };
}

describe('asc-zrzuty: zegarek jako osobna grupa urządzeń', () => {
  test('416×496 trafia do grupy zegarka, 1320×2868 do grupy iPhone’a; en = 4 lokalizacje ASC, pl = 1; po 2 kadry zegarka i 7 zrzutów iPhone’a na lokalizację', () => {
    const p = plan({ jezyki: ['en', 'pl'] });
    expect(p.errors).toEqual([]);
    const zegarek = p.rows.filter((r) => r.zrodlo === 'zegarek');
    expect(zegarek.map((r) => `${r.locale}|${r.grupa}|${r.akcja}|${r.plikow}`).sort()).toEqual(
      ['en-AU', 'en-CA', 'en-GB', 'en-US'].map((l) => `${l}|G-WATCH|wgraj|2`).concat(['pl|G-WATCH|wgraj|2']).sort());
    expect(p.rows.filter((r) => r.zrodlo === 'iphone').every((r) => r.grupa === 'G-IPHONE' && r.plikow === 7)).toBe(true);
  });

  test('IDEMPOTENCJA: iPhone ma już 7 zrzutów w grupie → wiersze iPhone’a „pomiń”, zegarek „wgraj”; skrypt nie dubluje iPhone’a ani nie zamienia (nigdy nie usuwa)', () => {
    const p = plan({ jezyki: ['en', 'pl'], ileIphone: 7, ileZegarek: 0 });
    for (const r of p.rows.filter((x) => x.zrodlo === 'iphone')) { expect(r.akcja).toBe('pomiń'); expect(r.powod).toMatch(/grupa ma już 7 zrzutów \(nic nie usuwam\)/); }
    for (const r of p.rows.filter((x) => x.zrodlo === 'zegarek')) { expect(r.akcja).toBe('wgraj'); expect(r.grupa).toBe('G-WATCH'); }
    expect(p.rows.filter((r) => r.akcja === 'wgraj').every((r) => r.zrodlo === 'zegarek')).toBe(true);
  });

  test('IDEMPOTENCJA: ponowny przebieg po wgraniu zegarka = wszystko „pomiń” (zegarek ma już 2 zrzuty, iPhone 7)', () => {
    const p = plan({ jezyki: ['en', 'pl'], ileIphone: 7, ileZegarek: 2 });
    expect(p.rows.filter((r) => r.akcja === 'wgraj')).toEqual([]);
    expect(p.rows.filter((r) => r.zrodlo === 'zegarek').every((r) => /grupa ma już 2 zrzutów \(nic nie usuwam\)/.test(r.powod))).toBe(true);
  });

  test('częściowy zapis zegarka (1 z 2) jest „pomiń” z ostrzeżeniem „niekompletna” (dokończ ręcznie), nie dopisuje kolejnych po cichu', () => {
    const p = plan({ jezyki: ['pl'], ileZegarek: 1 });
    const r = p.rows.find((x) => x.zrodlo === 'zegarek');
    expect(r?.akcja).toBe('pomiń');
    expect(r?.powod).toMatch(/niekompletna: 1 z 2 zrzutów/);
  });

  test('brak specyfikacji Apple Watch w danych referencyjnych API = błąd planu (zapis zablokowany), nie ciche pominięcie', () => {
    const p = plan({ jezyki: ['pl'], bezZegarkaWRef: true });
    expect(p.errors.some((e) => /zegarek\/pl\/01-k\.png: 416×496 — brak pasującej specyfikacji w danych Apple/.test(e))).toBe(true);
  });

  test('więcej niż 10 zrzutów zegarka na język = błąd planu (limit Apple 10 na rozmiar)', () => {
    const p = plan({ jezyki: ['pl'], zrzutowZegarka: 11 });
    expect(p.errors.some((e) => /zegarek\/pl: 11 zrzutów w grupie G-WATCH > limit 10/.test(e))).toBe(true);
  });
});

describe('asc-zrzuty: układ artefaktu `zegarek-zrzuty` (readShots / loadShots)', () => {
  test('<język>/NN-<kadr>.png 416×496 bez alfy z naszego workflowu jest czytany jako źródło „zegarek”, razem z iPhone’em, tylko dla wskazanych języków', () => {
    const k = fs.mkdtempSync(path.join(os.tmpdir(), 'oczko-asc-zegarek-'));
    const zeg = path.join(k, 'zegarek-zrzuty'); const ip = path.join(k, '6.9');
    for (const j of ['en', 'pl', 'de']) {
      fs.mkdirSync(path.join(zeg, j), { recursive: true }); fs.mkdirSync(path.join(ip, j), { recursive: true });
      ['01-licznik', '02-przypomnienie'].forEach((n, i) => fs.writeFileSync(path.join(zeg, j, `${n}.png`), kadr(416, 496, i + 1)));
      fs.writeFileSync(path.join(ip, j, '01-dzis.png'), kadr(32, 64, 1));
    }
    const kod = `import * as Z from ${ZRZUTY};
      const w = Z.loadShots({ iphone: ${JSON.stringify(ip)}, zegarek: ${JSON.stringify(zeg)}, jezyki: 'en,pl' });
      process.stdout.write(JSON.stringify({ problems: w.problems, zrodla: Object.keys(w.shots), zeg: [...w.shots.zegarek].map(([j, l]) => [j, l.map((x) => [x.name, x.width, x.height, x.alpha].join(':'))]) }));`;
    const w = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', kod], { encoding: 'utf8' }));
    expect(w.problems).toEqual([]);
    expect(w.zrodla).toEqual(['iphone', 'zegarek']);
    expect(w.zeg).toEqual([
      ['en', ['01-licznik.png:416:496:false', '02-przypomnienie.png:416:496:false']],
      ['pl', ['01-licznik.png:416:496:false', '02-przypomnienie.png:416:496:false']],
    ]);
  });
});
