// Drugi przegląd AI fali przekładu przez API (P-486, D-027): tryb `przeglad` w scripts/i18n/przeklad-api.mjs i przyjęcie poprawek
// scripts/i18n/przeklad-zastosuj-poprawki.mjs. Bez sieci — atrapa fetch. Testy przed kodem (kolejność P-486).
import { spawnSync, execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = join(__dirname, '../..');
const SCRIPT = join(ROOT, 'scripts/i18n/przeklad-api.mjs');
const ZASTOSUJ = join(ROOT, 'scripts/i18n/przeklad-zastosuj-poprawki.mjs');
const ZAKRES_PLIK = 'docs/lokalizacja/zakres-fali-2026-11-03.json';
const BEZ_KLUCZA: NodeJS.ProcessEnv = { ...process.env, ANTHROPIC_API_KEY: '' };
const json = (kod: string, plik = SCRIPT) => JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `import * as m from ${JSON.stringify(plik)}; ${kod}`], { encoding: 'utf8', cwd: ROOT }));
const SL = `JSON.parse((await import('node:fs')).readFileSync('docs/lokalizacja/slownik-terminow.json','utf8'))`;
const wyj = () => mkdtempSync(join(tmpdir(), 'przeglad-'));

describe('przeglad: plik zakresu fali (oczekujace.json jest po fali pusty)', () => {
  const zakres = JSON.parse(readFileSync(join(ROOT, ZAKRES_PLIK), 'utf8')) as { klucze: string[]; przetlumaczone_czesciowo: Record<string, string[]> };
  test('146 baz kluczy, bez duplikatów, każda istnieje w en.json; chronione pary tylko dla baz z zakresu', () => {
    expect(zakres.klucze).toHaveLength(146);
    expect(new Set(zakres.klucze).size).toBe(146);
    const r = json(`const p = m.zbierz(undefined, ${JSON.stringify(zakres.klucze)}); console.log(JSON.stringify(p.length))`);
    expect(r).toBe(146);
    for (const b of Object.keys(zakres.przetlumaczone_czesciowo)) expect(zakres.klucze).toContain(b);
  });
  test('zakres zawiera klucze wskazane w poleceniu: projekty.dni i klucze jednostek', () => {
    expect(zakres.klucze).toEqual(expect.arrayContaining(['projekty.dni', 'jednostka.m', 'jednostka.g_nazwa']));
  });
});

describe('przeglad: żądanie do recenzenta', () => {
  const zad = (kod: string, klucze: string[]) => json(`const sl = ${SL}; const p = m.zbierz(undefined, ${JSON.stringify(klucze)});
    const obecne = Object.fromEntries(p.flatMap((x) => x.formy ? Object.keys(x.formy).map((c) => [x.klucz + '_' + c, 'OBECNY ' + x.klucz + ' ' + c]) : [[x.klucz, 'OBECNY ' + x.klucz]]));
    console.log(JSON.stringify(m.budujZadaniePrzegladu(${JSON.stringify(kod)}, p, sl, obecne)))`);
  test('treść: angielski oryginał, kontekst, obecny tekst języka, wycinek słownika; system każe zwracać tylko poprawki', () => {
    const z = zad('de', ['licznik.cofnij', 'projekty.dni']);
    const t = z.messages[0].content as string;
    expect(z.system).toMatch(/TYLKO poprawki|WYŁĄCZNIE poprawki/);
    expect(z.system).toMatch(/poprawki/);
    expect(t).toMatch(/Język docelowy: .*\(de\)/); expect(t).toContain('Słownik terminów:');
    expect(t).toContain('OBECNY licznik.cofnij'); expect(t).toContain('OBECNY projekty.dni one'); expect(t).toContain('OBECNY projekty.dni other');
    expect(t).toMatch(/crafting days left/); // en
    expect(t).toMatch(/Przycisk/); // kontekst
    expect(JSON.stringify(z)).not.toMatch(/sk-ant|api[_-]?key/i);
  });
  test('pozycje z formami niosą kategorie CLDR języka; pozycja nie wymusza przepisywania poprawnych tekstów', () => {
    const z = zad('pl', ['projekty.dni']);
    const t = z.messages[0].content as string;
    expect(t).toContain('"kategorie":["few","many","one","other"]');
    expect(z.system).toMatch(/nie przepisuj|Nie przepisuj/);
  });
  test('nacisk P-485: hu, vi, lv, el, sr, bg, ms dostają dodatkowe polecenie o słabej terminologii; de i cs nie', () => {
    for (const k of ['hu', 'vi', 'lv', 'el', 'sr', 'bg', 'ms']) expect(zad(k, ['licznik.cofnij']).messages[0].content).toMatch(/NACISK: terminologia/);
    for (const k of ['de', 'cs', 'fr']) expect(zad(k, ['licznik.cofnij']).messages[0].content).not.toMatch(/NACISK: terminologia/);
  });
  test('reguła projekty.dni (P-412): wszystkie języki dostają polecenie sprawdzenia, że forma idzie za {{limit}}, nie {{zostalo}}', () => {
    const t = zad('hu', ['projekty.dni']).messages[0].content as string;
    expect(t).toMatch(/projekty\.dni/); expect(t).toMatch(/\{\{limit\}\}/); expect(t).toMatch(/\{\{zostalo\}\}/);
    // bez klucza projekty.dni w zakresie polecenie nie jest dodawane
    expect(zad('hu', ['licznik.cofnij']).messages[0].content).not.toMatch(/Reguła projekty\.dni/);
  });
  test('klucze jednostek: glosariusz jednostek języka dołączony i polecenie sprawdzenia symbolu oraz nazwy pełnej', () => {
    const t = zad('de', ['jednostka.g', 'jednostka.g_nazwa']).messages[0].content as string;
    expect(t).toContain('Glosariusz jednostek'); expect(t).toContain('5 Gramm');
  });
});

describe('przeglad: ścieżka folderu kopii (M1-audytor-generalny-055)', () => {
  test('klucze z „<nazwa pod ikoną> › Backup” dostają polecenie zachowania ścieżki znak w znak; inne zakresy nie', () => {
    const z = json(`const sl = ${SL}; const p = m.zbierz(undefined, ['dane.zastapiono', 'licznik.cofnij']); const o = { 'dane.zastapiono': 'Masche › Backup', 'licznik.cofnij_one': 'a', 'licznik.cofnij_other': 'b' };
      console.log(JSON.stringify([m.budujZadaniePrzegladu('de', p, sl, o).messages[0].content, m.budujZadaniePrzegladu('de', p.filter((x) => x.klucz === 'licznik.cofnij'), sl, o).messages[0].content]))`);
    expect(z[0]).toMatch(/Ścieżka folderu kopii/); expect(z[0]).toMatch(/znak w znak/);
    expect(z[1]).not.toMatch(/Ścieżka folderu kopii/);
  });
});

describe('przeglad: odpowiedź recenzenta', () => {
  const poz = `[{ id: '1', klucz: 'a', tekst: 'Done {{n}}', kontekst: '' }, { id: '2', klucz: 'b', formy: { one: '{{count}} row', other: '{{count}} rows' }, kontekst: '' }, { id: '3', klucz: 'c', tekst: 'Plain', kontekst: '' }]`;
  const obecne = `{ a: 'Gotowe {{n}}', b_one: '{{count}} rząd', b_few: '{{count}} rzędy', b_many: '{{count}} rzędów', b_other: '{{count}} rzędu', c: 'Zwykły' }`;
  const parsuj = (odp: unknown, jako = 'JSON.stringify(odp)') => json(`const poz = ${poz}, odp = ${JSON.stringify(odp)}, obecne = ${obecne}; console.log(JSON.stringify(m.parsujPoprawki(${jako}, poz, 'pl', obecne)))`);
  test('przyjmuje poprawki z powodem (tekst i formy), także w bloku kodu; pusta lista poprawek jest poprawna', () => {
    const r = parsuj({ poprawki: [{ id: '1', tekst: 'Zrobione {{n}}', powod: 'naturalniej' }, { id: '2', tekst: { one: '{{count}} rządek', few: '{{count}} rządki', many: '{{count}} rządków', other: '{{count}} rządka' }, powod: 'termin' }] });
    expect(r.blad).toBeNull(); expect(r.odrzucone).toEqual([]);
    expect(r.poprawki.map((p: { klucz: string }) => p.klucz)).toEqual(['a', 'b']);
    expect(r.poprawki[0]).toMatchObject({ klucz: 'a', tekst: 'Zrobione {{n}}', powod: 'naturalniej', bylo: 'Gotowe {{n}}' });
    expect(r.poprawki[1].bylo).toMatchObject({ one: '{{count}} rząd' });
    const blok = parsuj({ poprawki: [{ id: '3', tekst: 'Prosty', powod: 'x' }] }, `'\`\`\`json\\n' + JSON.stringify(odp) + '\\n\`\`\`'`);
    expect(blok.poprawki).toHaveLength(1);
    const pusta = parsuj({ poprawki: [] });
    expect(pusta.blad).toBeNull(); expect(pusta.poprawki).toEqual([]);
  });
  test('odrzuca: nieznane id, brak powodu, ten sam tekst, zmienione parametry, złe kategorie, pusty tekst, duplikat id', () => {
    const r = parsuj({ poprawki: [
      { id: '99', tekst: 'x', powod: 'p' },
      { id: '3', tekst: 'Inny' },
      { id: '1', tekst: 'Gotowe {{n}}', powod: 'p' },
      { id: '1', tekst: 'Zrobione {{x}}', powod: 'p' },
      { id: '2', tekst: { one: 'a', other: 'b' }, powod: 'p' },
      { id: '3', tekst: '   ', powod: 'p' },
      { id: '3', tekst: 'Pierwszy', powod: 'p' },
      { id: '3', tekst: 'Drugi', powod: 'p' },
    ] });
    expect(r.poprawki.map((p: { tekst: string }) => p.tekst)).toEqual(['Pierwszy']);
    expect(r.odrzucone).toHaveLength(7);
    expect(r.odrzucone.map((o: { powod: string }) => o.powod).join('|')).toMatch(/nieznane id/);
  });
  test('brak obiektu JSON, zły kształt (bez pola poprawki) i niepoprawny JSON to błąd bez poprawek', () => {
    expect(parsuj('nie json' as unknown, 'odp').blad).toMatch(/brak obiektu JSON/);
    expect(parsuj({ cos: 1 }).blad).toMatch(/poprawki/);
    expect(parsuj('{ zepsute' as unknown, 'odp').blad).toBeTruthy();
  });
});

describe('przeglad: szacunek i CLI', () => {
  test('--tryb przeglad --szacuj: 33 języki × 146 pozycji, bez klucza API, wynik tylko w katalogu raportu; Opus high w pułapie 30 USD', () => {
    const w = wyj();
    const s = spawnSync(process.execPath, [SCRIPT, '--tryb', 'przeglad', '--szacuj', '--model', 'opus', '--wysilek', 'high', '--zakres', ZAKRES_PLIK, '--pomin', 'pl', '--wyjscie', w], { encoding: 'utf8', env: BEZ_KLUCZA, cwd: ROOT });
    expect(s.status).toBe(0); expect(s.stdout).toMatch(/33 języków × 146 pozycji/); expect(s.stdout).toMatch(/przegląd/i);
    const sz = JSON.parse(readFileSync(join(w, 'szacunek.json'), 'utf8'));
    expect(sz.tryb).toBe('przeglad'); expect(sz.pozycji).toBe(146); expect(sz.wiersze).toHaveLength(33);
    expect(sz.koszt_wg_modelu['claude-opus-5-5']).toBeLessThan(30); expect(sz.koszt_wg_modelu['claude-opus-5-5']).toBeGreaterThan(1);
  });
  test('szacunek przeglądu rośnie z wysiłkiem; wejście większe niż w przekładzie (en + obecny tekst)', () => {
    const koszt = (tryb: string, wysilek: string) => {
      const d = wyj(); const s = spawnSync(process.execPath, [SCRIPT, '--tryb', tryb, '--szacuj', '--model', 'opus', '--wysilek', wysilek, '--zakres', ZAKRES_PLIK, '--pomin', 'pl', '--wyjscie', d], { encoding: 'utf8', env: BEZ_KLUCZA, cwd: ROOT });
      expect(s.status).toBe(0); return JSON.parse(readFileSync(join(d, 'szacunek.json'), 'utf8'));
    };
    expect(koszt('przeglad', 'low').koszt_usd).toBeLessThan(koszt('przeglad', 'high').koszt_usd);
    expect(koszt('przeglad', 'high').tokeny_we).toBeGreaterThan(koszt('przeklad', 'high').tokeny_we);
  });
  test('stop powyżej limitu bez zgody (kod 3) także w trybie przeglad; zła wartość --tryb to kod 2', () => {
    const s = spawnSync(process.execPath, [SCRIPT, '--tryb', 'przeglad', '--szacuj', '--model', 'opus', '--zakres', ZAKRES_PLIK, '--pomin', 'pl', '--wyjscie', wyj()], { encoding: 'utf8', env: { ...BEZ_KLUCZA, PRZEKLAD_LIMIT_USD: '0.01' }, cwd: ROOT });
    expect(s.status).toBe(3); expect(s.stdout).toMatch(/STOP/);
    expect(spawnSync(process.execPath, [SCRIPT, '--tryb', 'zly', '--szacuj', '--wyjscie', wyj()], { encoding: 'utf8', env: BEZ_KLUCZA, cwd: ROOT }).status).toBe(2);
  });
  test('przeglad bez --zakres to kod 2 (bez zakresu recenzent dostałby cały słownik, 600+ pozycji, poza ustaleniem P-486)', () => {
    const s = spawnSync(process.execPath, [SCRIPT, '--tryb', 'przeglad', '--szacuj', '--wyjscie', wyj()], { encoding: 'utf8', env: BEZ_KLUCZA, cwd: ROOT });
    expect(s.status).toBe(2); expect(s.stdout).toMatch(/--zakres/);
  });
  test('--zastosuj nie łączy się z trybem przeglad (poprawki nakłada osobny skrypt)', () => {
    const s = spawnSync(process.execPath, [SCRIPT, '--tryb', 'przeglad', '--zastosuj', '--zakres', ZAKRES_PLIK, '--wyjscie', wyj()], { encoding: 'utf8', env: BEZ_KLUCZA, cwd: ROOT });
    expect(s.status).toBe(2);
  });
});

describe('przeglad: przebieg (main) z atrapą fetch', () => {
  const przebieg = (w: string, odpowiedz: string, dodatkowe = '') => json(`const wyslane = [];
    const zakres = JSON.parse((await import('node:fs')).readFileSync(${JSON.stringify(ZAKRES_PLIK)}, 'utf8')).klucze;
    const poz = m.zbierz(undefined, zakres);
    const fs = await import('node:fs');
    const obecne = (k) => m.splaszcz(JSON.parse(fs.readFileSync('src/i18n/slowniki/' + k + '.json', 'utf8')));
    const fetchFn = async (url, opcje) => {
      const u = new URL(url); wyslane.push({ metoda: opcje.method, sciezka: u.pathname, klucz: opcje.headers['x-api-key'], cialo: opcje.body ?? '' });
      const ok = (d) => ({ ok: true, json: async () => d, text: async () => d });
      if (u.pathname.endsWith('/count_tokens')) return ok({ input_tokens: 5000 });
      if (opcje.method === 'POST') return ok({ id: 'msgbatch_pg1' });
      if (u.pathname.endsWith('msgbatch_pg1')) return ok({ processing_status: 'ended', results_url: 'https://api.anthropic.com/v1/messages/batches/msgbatch_pg1/results' });
      const linie = ['bg', 'cs'].map((k) => JSON.stringify({ custom_id: 'pg-' + k, result: { type: 'succeeded', message: { stop_reason: 'end_turn', content: [{ type: 'text', text: ${odpowiedz} }], usage: { input_tokens: 4000, output_tokens: 900 } } } }));
      return ok(linie.join('\\n'));
    };
    const log = [];
    const kod = await m.main(['--tryb', 'przeglad', '--limit', '2', '--model', 'opus', '--wysilek', 'high', '--zakres', ${JSON.stringify(ZAKRES_PLIK)}, '--pomin', 'pl', '--wyjscie', ${JSON.stringify(w)}], { fetchFn, env: { ANTHROPIC_API_KEY: 'sk-ant-testowy' }, log: (x) => log.push(x), spij: async () => {} });
    ${dodatkowe}
    console.log(JSON.stringify({ kod, log, wyslane: wyslane.map((x) => ({ ...x, cialo: x.cialo.length > 5000 ? JSON.parse(x.cialo) : x.cialo })), nadmiar: JSON.stringify(log).includes('sk-ant') }))`);
  test('batch: custom_id pg-<kod>, effort high, żądanie z obecnym tekstem; wynik = <kod>.json z poprawkami, podsumowanie, słowniki nietknięte; klucz tylko w nagłówku', () => {
    const w = wyj(), slowniki = readdirSync(join(ROOT, 'src/i18n/slowniki')).sort();
    const stan = readFileSync(join(ROOT, 'src/i18n/slowniki/bg.json'), 'utf8');
    const r = przebieg(w, `(() => { const p = poz.find((x) => !x.formy); return JSON.stringify({ poprawki: [{ id: p.id, tekst: obecne('bg')[p.klucz] + ' ', powod: 'test' }] }); })()`);
    expect(r.kod).toBe(0); expect(r.nadmiar).toBe(false);
    expect(r.wyslane.every((x: { klucz: string }) => x.klucz === 'sk-ant-testowy')).toBe(true);
    const post = r.wyslane.find((x: { metoda: string; sciezka: string }) => x.metoda === 'POST' && x.sciezka.endsWith('/batches'));
    expect(post).toBeTruthy();
    const zadania = post.cialo.requests;
    expect(zadania.map((z: { custom_id: string }) => z.custom_id)).toEqual(['pg-bg', 'pg-cs']);
    expect(zadania[0].params.output_config.effort).toBe('high'); expect(zadania[0].params.model).toBe('claude-opus-5-5');
    expect(zadania[0].params.messages[0].content).toMatch(/Poprawki|poprawki/);
    expect(readdirSync(w).sort()).toEqual(expect.arrayContaining(['bg.json', 'cs.json', 'batch-id.txt', 'podsumowanie.md', 'szacunek.json']));
    const bg = JSON.parse(readFileSync(join(w, 'bg.json'), 'utf8'));
    expect(bg.jezyk).toBe('bg'); expect(bg.pozycji).toBe(146); expect(Array.isArray(bg.poprawki)).toBe(true); expect(bg.uzycie.output_tokens).toBe(900);
    expect(bg.slownik).toBeUndefined(); // przegląd nie niesie słownika, tylko poprawki
    expect(readFileSync(join(w, 'podsumowanie.md'), 'utf8')).toMatch(/przegląd/i);
    expect(readdirSync(join(ROOT, 'src/i18n/slowniki')).sort()).toEqual(slowniki);
    expect(readFileSync(join(ROOT, 'src/i18n/slowniki/bg.json'), 'utf8')).toBe(stan);
  });
  test('pusta lista poprawek to kod 0; odpowiedź bez obiektu JSON to błąd języka i kod 1', () => {
    expect(przebieg(wyj(), `'{"poprawki":[]}'`).kod).toBe(0);
    const w = wyj(); const r = przebieg(w, `'brak json'`);
    expect(r.kod).toBe(1); expect(JSON.parse(readFileSync(join(w, 'bg.json'), 'utf8')).blad).toMatch(/brak obiektu JSON/);
  });
  test('brak obecnego tekstu któregoś klucza z zakresu w słowniku języka to kod 2 przed wysłaniem czegokolwiek', () => {
    const korzen = mkdtempSync(join(tmpdir(), 'przeglad-korzen-'));
    mkdirSync(join(korzen, 'src/i18n'), { recursive: true }); mkdirSync(join(korzen, 'docs'), { recursive: true });
    cpSync(join(ROOT, 'src/i18n/slowniki'), join(korzen, 'src/i18n/slowniki'), { recursive: true });
    cpSync(join(ROOT, 'docs/lokalizacja'), join(korzen, 'docs/lokalizacja'), { recursive: true });
    const sl = JSON.parse(readFileSync(join(korzen, 'src/i18n/slowniki/bg.json'), 'utf8')); delete sl.projekty.dni_one;
    writeFileSync(join(korzen, 'src/i18n/slowniki/bg.json'), JSON.stringify(sl));
    const r = json(`const wyslane = []; const log = [];
      const kod = await m.main(['--tryb', 'przeglad', '--pomin', 'pl', '--limit', '1', '--zakres', ${JSON.stringify(ZAKRES_PLIK)}, '--wyjscie', ${JSON.stringify(join(korzen, 'wyj'))}], { fetchFn: async (u) => { wyslane.push(u); throw new Error('nie wolno'); }, env: { ANTHROPIC_API_KEY: 'sk-ant-t' }, root: ${JSON.stringify(korzen)}, log: (x) => log.push(x), spij: async () => {} });
      console.log(JSON.stringify({ kod, log, wyslane }))`);
    expect(r.kod).toBe(2); expect(r.wyslane).toEqual([]); expect(r.log.join('\n')).toMatch(/projekty\.dni/);
  });
});

describe('przeglad: przyjęcie poprawek (przeklad-zastosuj-poprawki.mjs)', () => {
  const nalozenie = (aktualny: object, poprawki: object[], opcje: object = {}) => json(
    `const en = ${JSON.stringify({ 'a.b': 'Done {{n}}', 'c.d_one': '{{count}} row', 'c.d_other': '{{count}} rows', 'e.f': 'Yarn' })};
     console.log(JSON.stringify(await m.nalozPoprawki(${JSON.stringify(aktualny)}, ${JSON.stringify(poprawki)}, Object.assign({ kod: 'de', en, slownik: ${SL}, chronione: {}, kolejnosc: new Map() }, ${JSON.stringify(opcje)}))))`, ZASTOSUJ);
  const aktualny = { 'a.b': 'Fertig {{n}}', 'c.d_one': '{{count}} Reihe', 'c.d_other': '{{count}} Reihen', 'e.f': 'Wolle' };
  test('nakłada poprawkę tekstu i form (formy zastępowane razem), reszta słownika i kolejność kluczy bez zmian', () => {
    const r = nalozenie(aktualny, [{ klucz: 'a.b', tekst: 'Erledigt {{n}}', powod: 'p' }, { klucz: 'c.d', tekst: { one: '{{count}} Runde', other: '{{count}} Runden' }, powod: 'p' }]);
    expect(r.przyjete.map((x: { klucz: string }) => x.klucz)).toEqual(['a.b', 'c.d']); expect(r.odrzucone).toEqual([]);
    expect(r.wynik).toEqual({ 'a.b': 'Erledigt {{n}}', 'c.d_one': '{{count}} Runde', 'c.d_other': '{{count}} Runden', 'e.f': 'Wolle' });
    expect(Object.keys(r.wynik)).toEqual(Object.keys(aktualny));
  });
  test('odrzuca poprawkę ze zmienionym parametrem (sprawdz-i18n) i nie rusza słownika', () => {
    const r = nalozenie(aktualny, [{ klucz: 'a.b', tekst: 'Erledigt {{x}}', powod: 'p' }]);
    expect(r.przyjete).toEqual([]); expect(r.odrzucone[0].powod).toMatch(/parametry/); expect(r.wynik).toEqual(aktualny);
  });
  test('odrzuca poprawkę z terminem zakazanym przez słownik terminów (slownik.mjs, straznik): de „row” → „Zeile” zamiast „Reihe”', () => {
    const r = json(`const a = await m.nalozPoprawki({ 'a.b': 'Fertig' }, [{ klucz: 'a.b', tekst: 'Neue Zeile', powod: 'p' }], { kod: 'de', en: { 'a.b': 'New row' }, slownik: ${SL}, chronione: {}, kolejnosc: new Map() });
      console.log(JSON.stringify({ przyjete: a.przyjete.length, odrzucone: a.odrzucone, wynik: a.wynik }))`, ZASTOSUJ);
    expect(r.przyjete).toBe(0); expect(r.odrzucone[0].powod).toMatch(/termin zakazany/); expect(r.wynik).toEqual({ 'a.b': 'Fertig' });
  });
  test('pomija pary (język, baza) z przetlumaczone_czesciowo, ten sam tekst i klucze spoza słownika', () => {
    const r = nalozenie(aktualny, [{ klucz: 'a.b', tekst: 'Erledigt {{n}}', powod: 'p' }, { klucz: 'e.f', tekst: 'Wolle', powod: 'p' }, { klucz: 'x.y', tekst: 'Zzz', powod: 'p' }], { chronione: { 'a.b': ['de'] } });
    expect(r.przyjete).toEqual([]); expect(r.wynik).toEqual(aktualny);
    expect(r.odrzucone.map((x: { klucz: string; powod: string }) => `${x.klucz}:${x.powod.split(' ')[0]}`)).toEqual(['a.b:chroniona', 'e.f:bez', 'x.y:klucz']);
  });
  test('jedna zła poprawka nie blokuje pozostałych (każda oceniana osobno)', () => {
    const r = nalozenie(aktualny, [{ klucz: 'a.b', tekst: 'Erledigt {{x}}', powod: 'p' }, { klucz: 'e.f', tekst: 'Garn', powod: 'p' }]);
    expect(r.przyjete.map((x: { klucz: string }) => x.klucz)).toEqual(['e.f']); expect(r.wynik['e.f']).toBe('Garn'); expect(r.wynik['a.b']).toBe('Fertig {{n}}');
  });
  test('CLI: --sucho nic nie zapisuje, bez --sucho zapisuje słownik i raport przyjęcia; wyjście ≠ 0 tylko przy błędzie konfiguracji', () => {
    const korzen = mkdtempSync(join(tmpdir(), 'przeglad-zast-'));
    mkdirSync(join(korzen, 'src/i18n'), { recursive: true });
    cpSync(join(ROOT, 'src/i18n/slowniki'), join(korzen, 'src/i18n/slowniki'), { recursive: true });
    cpSync(join(ROOT, 'docs/lokalizacja'), join(korzen, 'docs/lokalizacja'), { recursive: true });
    const raport = join(korzen, 'raport-przegladu'); mkdirSync(raport);
    const de = JSON.parse(readFileSync(join(korzen, 'src/i18n/slowniki/de.json'), 'utf8')); const stary = de.wspolne.ladowanie;
    writeFileSync(join(raport, 'de.json'), JSON.stringify({ jezyk: 'de', poprawki: [{ klucz: 'wspolne.ladowanie', tekst: stary + ' …', powod: 'test' }], odrzucone: [], blad: null }));
    const uruchom = (...a: string[]) => spawnSync(process.execPath, [ZASTOSUJ, '--korzen', korzen, '--raport', raport, '--zakres', join(korzen, ZAKRES_PLIK), ...a, 'de'], { encoding: 'utf8', cwd: ROOT });
    const sucho = uruchom('--sucho');
    expect(sucho.status).toBe(0); expect(sucho.stdout).toMatch(/przyjęte: 1/);
    expect(JSON.parse(readFileSync(join(korzen, 'src/i18n/slowniki/de.json'), 'utf8')).wspolne.ladowanie).toBe(stary);
    const zapis = uruchom();
    expect(zapis.status).toBe(0);
    expect(JSON.parse(readFileSync(join(korzen, 'src/i18n/slowniki/de.json'), 'utf8')).wspolne.ladowanie).toBe(stary + ' …');
    expect(existsSync(join(raport, 'przyjecie-de.json'))).toBe(true);
    expect(spawnSync(process.execPath, [ZASTOSUJ, '--korzen', korzen], { encoding: 'utf8', cwd: ROOT }).status).toBe(2);
  });
});
