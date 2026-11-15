/*
 * Podpisy zrzutów sklepu przez API (BO, rola 09; wzór: produkty-przeklad.test.ts, P-515, i metadane P-501): moduł scripts/i18n/przeklad-podpisy.mjs,
 * tryb `podpisy` w przeklad-tlumaczen.yml. Dane: docs/wydanie/metadane/podpisy-zrzutow.json (7 podpisów na język, ≤ maxZnakow = 40; 27 języków ze sklepową
 * lokalizacją; en i pl poza przekładem — czekają na akceptację właściciela). Dwa etapy jak metadane: przekład → krytyk w świeżym kontekście.
 * Testy PRZED kodem; bez sieci (atrapa fetch); marki tylko przez haszowaną listę repo (P-107), więc w teście wstrzykiwany jest syntetyczny skrót.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = join(__dirname, '../..');
const MOD = join(ROOT, 'scripts/i18n/przeklad-podpisy.mjs');
const PLIK = 'docs/wydanie/metadane/podpisy-zrzutow.json';
const read = (f: string) => readFileSync(join(ROOT, f), 'utf8');
const dane = JSON.parse(read(PLIK)) as Record<string, any>;
const EKRANY = dane.ekrany as string[];
const BEZ_SKLEPU = ['bg', 'et', 'lt', 'lv', 'sl', 'sr'];

function run(kod: string, env: NodeJS.ProcessEnv = {}) {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', `import * as m from ${JSON.stringify(MOD)}; ${kod}`], { encoding: 'utf8', env: { ...process.env, ANTHROPIC_API_KEY: '', ...env }, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`proces: ${r.status}\n${r.stderr}\n${r.stdout.slice(-500)}`);
  return JSON.parse(r.stdout.trim().split('\n').at(-1)!);
}
const J = (x: unknown) => JSON.stringify(JSON.stringify(x));

describe('moduł przekładu (scripts/i18n/przeklad-podpisy.mjs): zakres i żądania', () => {
  test('języki do przekładu: 27 ze sklepową lokalizacją (bez en, pl i sześciu bez lokalizacji sklepu); zgodne z plikiem danych', () => {
    const r = run(`console.log(JSON.stringify({ j: m.JEZYKI_PRZEKLADU, plik: m.PLIK }))`);
    expect(r.j).toHaveLength(27); expect(r.plik).toBe(PLIK);
    for (const k of ['en', 'pl', ...BEZ_SKLEPU]) expect(r.j).not.toContain(k);
    for (const k of r.j) expect(Object.keys(dane.podpisy[k])).toEqual(EKRANY);
    for (const k of BEZ_SKLEPU) expect(Object.keys(dane.podpisy[k])).toHaveLength(0);
  });
  test('żądanie przekładu (de): źródło en (nie pl), kontekst pliku i ekranów, słownik aplikacji i terminów, limit 40; bez treści prompt roli', () => {
    const r = run(`const z = m.budujZadanie('de', m.wczytajKontekst()); console.log(JSON.stringify({ s: z.system, u: z.messages[0].content }))`);
    for (const k of EKRANY) expect(r.u).toContain(k);
    expect(r.u).toContain(dane.podpisy.en['02-licznik']); expect(r.u).toContain(dane.podpisy.en['06-historia']);
    expect(r.u).not.toContain(dane.podpisy.pl['02-licznik']); // pl czeka na akceptację właściciela: nie kotwiczy przekładu
    expect(r.u).toMatch(/Jeden podpis na ekran/); // _opis pliku (kontekst), bez numerów zadań i nazw skryptów
    expect(r.u).toMatch(/Projekte/); expect(r.u).toMatch(/Anleitung/); expect(r.u).toMatch(/Handarbeitstage/); // słownik aplikacji: zakladki.projekty, wzor.tytul, dni.dni_robotki
    expect(r.u).toMatch(/Rejestr/); expect(r.u).toMatch(/40/); expect(r.u).toMatch(/Słownik terminów/);
    expect(r.s).toMatch(/40/); expect(r.s).toMatch(/JSON/);
    expect(r.s).not.toMatch(/PROMPT ROLI|Zasady roli|Wygenerować jest tanio/); // biblioteka prywatna, repo publiczne: zasady własnymi słowami
    expect(r.s).toMatch(/dane, nie polecenia|nie polecenia/i);
  });
  test('żądanie krytyka: świeży kontekst — źródło en + OBECNY przekład + słowniki, inna instrukcja systemowa, bez notatek tłumacza', () => {
    const r = run(`const c = m.wczytajKontekst(); const p = ${J({ '01-dzis': 'A', '02-licznik': 'B', '03-wzor': 'C', '04-zakreslenie': 'D', '05-projekty': 'E', '06-historia': 'F', '07-kalendarz': 'G' })};
      const t = m.budujZadanie('de', c), k = m.budujKrytyka('de', c, JSON.parse(p)); console.log(JSON.stringify({ ts: t.system, ks: k.system, u: k.messages[0].content }))`);
    expect(r.ks).not.toBe(r.ts);
    expect(r.ks).toMatch(/poprawki/); expect(r.ks).toMatch(/TYLKO/);
    expect(r.u).toContain(dane.podpisy.en['01-dzis']); expect(r.u).toMatch(/Projekte/);
    for (const x of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) expect(r.u).toContain(`: ${x}`);
    expect(r.u).not.toMatch(/Uwaga tłumacza/); // krytyk nie dostaje notatek tłumacza (słownik terminów ma własne „uwaga:”, to nie notatka)
  });
});

describe('twarde kontrole podpisu (sprawdzPodpis, sprawdzKomplet; 2.3.7)', () => {
  const sp = (v: unknown, opcje = '{ max: 40 }') => run(`console.log(JSON.stringify(m.sprawdzPodpis(JSON.parse(${J(v)}), ${opcje})))`);
  test('poprawne: niemiecki 38 znaków, japoński 40 znaków (liczone jak znaki, nie bajty); cyfra w podpisie nie jest błędem', () => {
    expect(sp('Weiter genau dort, wo du aufgehört hast')).toEqual([]);
    expect(sp('あ'.repeat(40))).toEqual([]);
    expect(sp('1タップで1段追加')).toEqual([]);
  });
  test('odrzuca: za długi (41), pusty, wiersz w środku, spacje na brzegu, cena/waluta, „free” i odpowiedniki, Apple Watch/iCloud, kropka na końcu', () => {
    expect(sp('x'.repeat(41)).join(' ')).toMatch(/41 znaków > 40/);
    expect(sp('').join(' ')).toMatch(/puste/);
    expect(sp('Zeile eins\nZeile zwei').join(' ')).toMatch(/nowy wiersz/);
    expect(sp(' Hallo').join(' ')).toMatch(/spacje/);
    for (const t of ['Nur €4,99 im Monat', 'Only $9 a month', '월 9,900원', 'Gratis testen', 'Free forever', 'Kostenlos zählen', 'Gratuit pour toujours', 'Darmowy licznik', 'Бесплатно навсегда', '無料で使える', 'Ücretsiz sayaç', 'Mit Apple Watch', 'Sync über iCloud'])
      expect([t, sp(t).length > 0]).toEqual([t, true]);
  });
  test('marka z haszowanej listy repo (P-107): wstrzyknięty skrót nazwy odrzuca podpis, bez niego przechodzi', () => {
    const r = run(`const sk = m.skrotyMarek ? m.skrotyMarek({ nazwy: ['testmarka'] }) : null;
      console.log(JSON.stringify({ z: m.sprawdzPodpis('Importuj z Testmarka', { max: 40, skroty: sk }), bez: m.sprawdzPodpis('Importuj z Testmarka', { max: 40 }) }))`);
    expect(r.z.join(' ')).toMatch(/marka/); expect(r.bez).toEqual([]);
  });
  test('komplet: wszystkie 7 ekranów, bez powtórzeń w języku; wskazuje pole', () => {
    const ok = Object.fromEntries(EKRANY.map((e, i) => [e, `Podpis numer ${'abcdefg'[i]}`]));
    const zle = { ...ok, '02-licznik': ok['01-dzis'], '05-projekty': 'x'.repeat(41) } as Record<string, string>; delete zle['07-kalendarz'];
    const r = run(`const c = m.wczytajKontekst(); console.log(JSON.stringify({ ok: m.sprawdzKomplet(JSON.parse(${J(ok)}), c), zle: m.sprawdzKomplet(JSON.parse(${J(zle)}), c) }))`);
    expect(r.ok).toEqual([]);
    const pola = r.zle.map((x: any) => x.pole).sort();
    expect(pola).toEqual(expect.arrayContaining(['02-licznik', '05-projekty', '07-kalendarz']));
  });
});

describe('odpowiedzi modelu: parsuj (przekład) i parsujKrytyka', () => {
  const ok = { '01-dzis': 'Weiter dort, wo du aufgehört hast', '02-licznik': 'Einmal tippen, eine Reihe mehr', '03-wzor': 'Die Anleitung direkt am Zähler', '04-zakreslenie': 'Markieren und schreiben', '05-projekty': 'Alle Projekte an einem Ort', '06-historia': 'Jede Änderung mit Uhrzeit', '07-kalendarz': 'Deine Handarbeitstage im Kalender' };
  const wynik = (kod: string) => run(`const c = m.wczytajKontekst(); console.log(JSON.stringify(${kod}))`);
  test('parsuj: poprawna odpowiedź (także w bloku ```json i z polem uwaga) → propozycja 7 ekranów; kropka na końcu zdjęta', () => {
    const r = wynik(`{ a: m.parsuj(${J({ ...ok, uwaga: '' })}, 'de', c), b: m.parsuj('\`\`\`json\\n' + ${J({ ...ok, '01-dzis': 'Weiter dort, wo du aufgehört hast.', uwaga: 'termin X' })} + '\\n\`\`\`', 'de', c) }`);
    expect(r.a.blad).toBeNull(); expect(r.a.odrzucone).toEqual([]); expect(Object.keys(r.a.propozycja)).toEqual(EKRANY);
    expect(r.b.propozycja['01-dzis']).toBe('Weiter dort, wo du aufgehört hast'); expect(r.b.uwaga).toBe('termin X');
  });
  test('parsuj: odrzuca cały język przy jednym złym podpisie (za długi, brak ekranu, powtórzenie, cena); brak JSON → błąd', () => {
    const zle = { ...ok, '02-licznik': 'x'.repeat(41), '03-wzor': ok['01-dzis'], '04-zakreslenie': 'Nur €1 im Monat' } as Record<string, string>; delete zle['07-kalendarz'];
    const r = wynik(`{ zle: m.parsuj(${J(zle)}, 'de', c), puste: m.parsuj('bez json', 'de', c) }`);
    expect(r.zle.propozycja).toBeNull();
    expect(r.zle.odrzucone.map((x: any) => x.pole).sort()).toEqual(expect.arrayContaining(['02-licznik', '03-wzor', '04-zakreslenie', '07-kalendarz']));
    expect(r.puste.blad).toMatch(/JSON/);
  });
  test('parsujKrytyka: przyjmuje poprawki z powodem; odrzuca nieznany ekran, brak powodu, ten sam tekst, za długi, cenę, duplikat ekranu, powtórzenie innego podpisu', () => {
    const odp = { poprawki: [
      { ekran: '02-licznik', tekst: 'Ein Tipp, eine Reihe mehr', powod: 'naturalniej' },
      { ekran: '99-nie', tekst: 'x', powod: 'x' },
      { ekran: '03-wzor', tekst: 'Neu', powod: '' },
      { ekran: '04-zakreslenie', tekst: ok['04-zakreslenie'], powod: 'bez zmiany' },
      { ekran: '05-projekty', tekst: 'x'.repeat(41), powod: 'za długi' },
      { ekran: '06-historia', tekst: 'Gratis Verlauf', powod: 'free' },
      { ekran: '02-licznik', tekst: 'Zweiter Versuch', powod: 'duplikat' },
      { ekran: '01-dzis', tekst: ok['07-kalendarz'], powod: 'powtórzenie innego podpisu' },
    ] };
    const r = wynik(`m.parsujKrytyka(${J(odp)}, c, JSON.parse(${J(ok)}))`);
    expect(r.blad).toBeNull();
    expect(r.poprawki).toEqual([{ ekran: '02-licznik', tekst: 'Ein Tipp, eine Reihe mehr', powod: 'naturalniej' }]);
    expect(r.odrzucone).toHaveLength(7);
  });
  test('parsujKrytyka: brak listy „poprawki” → błąd; pusta lista → brak poprawek; zastosuj nakłada poprawki na kopię, kolejność ekranów zachowana', () => {
    const r = wynik(`{ b: m.parsujKrytyka('{}', c, JSON.parse(${J(ok)})), p: m.parsujKrytyka('{"poprawki":[]}', c, JSON.parse(${J(ok)})),
      z: m.zastosuj(JSON.parse(${J(ok)}), [{ ekran: '03-wzor', tekst: 'Neu', powod: 'p' }]) }`);
    expect(r.b.blad).toMatch(/poprawki/); expect(r.p.blad).toBeNull(); expect(r.p.poprawki).toEqual([]);
    expect(Object.keys(r.z)).toEqual(EKRANY); expect(r.z['03-wzor']).toBe('Neu'); expect(r.z['01-dzis']).toBe(ok['01-dzis']);
  });
});

describe('szacunek, koszt i pełny przebieg na atrapie', () => {
  test('szacunek bez klucza: kod 0, 27 języków × dwa etapy, koszt > 0, limit 2 → 2; limit kosztu z workflowu (zgoda) → kod 3 bez --zgoda-koszt', () => {
    const wyj = mkdtempSync(join(tmpdir(), 'pp-'));
    const r = run(`const logs = []; const kod = await m.main(['--szacuj', '--wyjscie', ${JSON.stringify(wyj)}], { env: {}, log: (x) => logs.push(String(x)) });
      const k2 = await m.main(['--szacuj', '--limit', '2', '--wyjscie', ${JSON.stringify(wyj + '/2')}], { env: {}, log: () => {} });
      const k3 = await m.main(['--szacuj', '--wyjscie', ${JSON.stringify(wyj + '/3')}], { env: { PRZEKLAD_LIMIT_USD: '0.0001' }, log: (x) => logs.push(String(x)) });
      const k4 = await m.main(['--szacuj', '--etap', 'przeklad', '--wyjscie', ${JSON.stringify(wyj + '/4')}], { env: {}, log: () => {} }); console.log(JSON.stringify({ kod, k2, k3, k4, logs }))`);
    expect(r.kod).toBe(0); expect(r.k2).toBe(0); expect(r.k3).toBe(3); expect(r.k4).toBe(0);
    expect(r.logs.join('\n')).toMatch(/27 języków/); expect(r.logs.join('\n')).toMatch(/STOP/);
    const s = JSON.parse(readFileSync(join(wyj, 'szacunek.json'), 'utf8')); expect(s.jezykow).toBe(27); expect(s.koszt_usd).toBeGreaterThan(0); expect(s.etapy).toEqual(['przeklad', 'krytyk']);
    expect(JSON.parse(readFileSync(join(wyj, '2', 'szacunek.json'), 'utf8')).jezykow).toBe(2);
    expect(JSON.parse(readFileSync(join(wyj, '4', 'szacunek.json'), 'utf8')).koszt_usd).toBeLessThan(s.koszt_usd);
  });

  /** Atrapa API: batch 1 = przekład (custom_id pp-<kod>), batch 2 = krytyk (pk-<kod>); `wadliwy` zwraca dla jednego języka za długi podpis. */
  const atrapa = (wadliwy = '') => `const zadane = []; const calls = []; let nb = 0;
    const odp = (k) => { const j = k.replace(/[0-9]/g, 'x'); return JSON.stringify(Object.fromEntries(JSON.parse(${J(EKRANY)}).map((e, i) => [e, (k === ${JSON.stringify(wadliwy)} && i === 1 ? 'x'.repeat(41) : 'T' + i + ' ' + j)]))); };
    const krytyk = (k) => JSON.stringify({ poprawki: k === 'de' ? [{ ekran: '02-licznik', tekst: 'Ein Tipp, eine Reihe mehr', powod: 'naturalniej' }] : [] });
    const rr = (b) => ({ ok: true, status: 200, json: async () => b, text: async () => (typeof b === 'string' ? b : JSON.stringify(b)) });
    const fakeFetch = async (url, init = {}) => { const p = new URL(url).pathname, met = init.method || 'GET'; calls.push(met + ' ' + p);
      if (p.endsWith('/count_tokens')) return rr({ input_tokens: 700 });
      if (p.endsWith('/messages/batches') && met === 'POST') { const rs = JSON.parse(init.body).requests; nb++; zadane.push(...rs.map((q) => ({ ...q, batch: nb }))); return rr({ id: 'msgbatch_B' + nb }); }
      const ms = p.match(/\\/v1\\/messages\\/batches\\/(msgbatch_B\\d)$/); if (ms) return rr({ processing_status: 'ended', results_url: 'https://wyniki.test/' + ms[1], request_counts: {} });
      const mw = p.match(/^\\/(msgbatch_B\\d)$/); if (mw) { const n = Number(mw[1].slice(-1)); return rr(zadane.filter((q) => q.batch === n).map((q) => JSON.stringify({ custom_id: q.custom_id, result: { type: 'succeeded', message: { stop_reason: 'end_turn', content: [{ type: 'text', text: q.custom_id.startsWith('pk-') ? krytyk(q.custom_id.slice(3)) : odp(q.custom_id.slice(3)) }], usage: { input_tokens: 700, output_tokens: 300 } } } })).join('\\n')); }
      return { ok: false, status: 404, json: async () => ({}), text: async () => '' }; };`;

  test('pełny przebieg: dwa batche (przekład, krytyk), Opus high, wynik <kod>.json z propozycją, krytykiem i wynikiem; klucz nie trafia do logu; plik danych w repo nietknięty', () => {
    const wyj = mkdtempSync(join(tmpdir(), 'pp-')), przed = read(PLIK);
    const r = run(`${atrapa()}
      const logs = []; const kod = await m.main(['--wyjscie', ${JSON.stringify(wyj)}], { fetchFn: fakeFetch, env: { ANTHROPIC_API_KEY: 'sk-ant-test-123' }, log: (x) => logs.push(String(x)), spij: async () => {}, dzis: '2026-11-16' });
      console.log(JSON.stringify({ kod, logs, n1: zadane.filter((q) => q.batch === 1).length, n2: zadane.filter((q) => q.batch === 2).length, model: zadane[0].params.model, effort: zadane[0].params.output_config?.effort,
        modelK: zadane.at(-1).params.model, posty: calls.filter((c) => c.startsWith('POST /v1/messages/batches')).length, ids: zadane.map((q) => q.custom_id) }))`);
    expect(r.kod).toBe(0); expect(r.n1).toBe(27); expect(r.n2).toBe(27); expect(r.posty).toBe(2);
    expect(r.model).toBe('claude-opus-5-5'); expect(r.effort).toBe('high'); expect(r.modelK).toBe('claude-opus-5-5');
    expect(r.logs.join('\n')).not.toMatch(/sk-ant-test/);
    const de = JSON.parse(readFileSync(join(wyj, 'de.json'), 'utf8'));
    expect(de.jezyk).toBe('de'); expect(de.ascLocale).toBe('de-DE'); expect(Object.keys(de.propozycja)).toEqual(EKRANY);
    expect(de.krytyk.poprawki).toHaveLength(1); expect(de.wynik['02-licznik']).toBe('Ein Tipp, eine Reihe mehr'); expect(de.propozycja['02-licznik']).toBe('T1 de');
    expect(de.meta).toMatchObject({ model: 'claude-opus-5-5', wysilek: 'high', data: '2026-11-16' });
    expect(existsSync(join(wyj, 'batch-id-1.txt'))).toBe(true); expect(existsSync(join(wyj, 'batch-id-2.txt'))).toBe(true); expect(existsSync(join(wyj, 'podsumowanie.md'))).toBe(true);
    expect(read(PLIK)).toBe(przed); // main niczego nie zapisuje do repozytorium
  });

  test('język z odrzuconym podpisem (za długi) nie idzie do krytyka, kod 1, raport wskazuje pole; pozostałe języki przechodzą', () => {
    const wyj = mkdtempSync(join(tmpdir(), 'pp-'));
    const r = run(`${atrapa('fi')}
      const logs = []; const kod = await m.main(['--wyjscie', ${JSON.stringify(wyj)}], { fetchFn: fakeFetch, env: { ANTHROPIC_API_KEY: 'sk-ant-test-123' }, log: (x) => logs.push(String(x)), spij: async () => {}, dzis: '2026-11-16' });
      console.log(JSON.stringify({ kod, n2: zadane.filter((q) => q.batch === 2).map((q) => q.custom_id), logs }))`);
    expect(r.kod).toBe(1); expect(r.n2).toHaveLength(26); expect(r.n2).not.toContain('pk-fi'); expect(r.logs.join('\n')).toMatch(/fi/);
    const fi = JSON.parse(readFileSync(join(wyj, 'fi.json'), 'utf8'));
    expect(fi.propozycja).toBeNull(); expect(fi.odrzucone.map((x: any) => x.pole)).toContain('02-licznik'); expect(fi.krytyk).toBeNull();
  });

  test('przyjęcie: kopia pliku — 27 języków z nowym tekstem i statusem „przekład API (<model>, <data>) + krytyk; [DO PRZEGLĄDU] …”; en, pl, 6 języków bez sklepu i reszta pliku bez zmian', () => {
    const wyj = mkdtempSync(join(tmpdir(), 'pp-')), kopia = mkdtempSync(join(tmpdir(), 'pp-repo-'));
    mkdirSync(join(kopia, 'docs/wydanie/metadane'), { recursive: true }); cpSync(join(ROOT, PLIK), join(kopia, PLIK));
    const r = run(`${atrapa()}
      const logs = []; const kod = await m.main(['--wyjscie', ${JSON.stringify(wyj)}], { fetchFn: fakeFetch, env: { ANTHROPIC_API_KEY: 'sk-ant-test-123' }, log: () => {}, spij: async () => {}, dzis: '2026-11-16' });
      const kp = m.przyjmij(['--raport', ${JSON.stringify(wyj)}, '--korzen', ${JSON.stringify(kopia)}], { log: (x) => logs.push(String(x)) }); console.log(JSON.stringify({ kod, kp, logs }))`);
    expect(r.kod).toBe(0); expect(r.kp).toBe(0);
    const po = JSON.parse(readFileSync(join(kopia, PLIK), 'utf8'));
    expect(Object.keys(po.podpisy)).toEqual(Object.keys(dane.podpisy)); expect(Object.keys(po.status)).toEqual(Object.keys(dane.status));
    expect(po.podpisy.en).toEqual(dane.podpisy.en); expect(po.podpisy.pl).toEqual(dane.podpisy.pl); expect(po.status.en).toBe(dane.status.en); expect(po.status.pl).toBe(dane.status.pl);
    for (const k of BEZ_SKLEPU) { expect(po.podpisy[k]).toEqual(dane.podpisy[k]); expect(po.status[k]).toBe(dane.status[k]); }
    expect(Object.keys(po.podpisy.de)).toEqual(EKRANY); expect(po.podpisy.de['01-dzis']).toBe('T0 de'); expect(po.podpisy.de['02-licznik']).toBe('Ein Tipp, eine Reihe mehr');
    expect(po.podpisy.ja['03-wzor']).toBe('T2 ja'); expect(po.podpisy['pt-BR']['01-dzis']).toBe('T0 pt-BR');
    expect(po.status.de).toBe('przekład API (claude-opus-5-5, 2026-11-16) + krytyk; [DO PRZEGLĄDU] przegląd człowieka według progu');
    const zmienione = Object.keys(po.podpisy).filter((k) => JSON.stringify(po.podpisy[k]) !== JSON.stringify(dane.podpisy[k]));
    expect(zmienione).toHaveLength(27);
    const { podpisy: _a, status: _b, ...resztaPo } = po; const { podpisy: _c, status: _d, ...resztaPrzed } = dane; expect(resztaPo).toEqual(resztaPrzed);
  });

  test('przyjęcie odrzuca raport z błędem, bez krytyka, z za długim podpisem albo en/pl (kody 1/1/1/2) i nie zmienia pliku', () => {
    const wyj = mkdtempSync(join(tmpdir(), 'pp-')), kopia = mkdtempSync(join(tmpdir(), 'pp-repo-'));
    mkdirSync(join(kopia, 'docs/wydanie/metadane'), { recursive: true }); cpSync(join(ROOT, PLIK), join(kopia, PLIK));
    const pelny = Object.fromEntries(EKRANY.map((e, i) => [e, `Ein Podpis ${'abcdefg'[i]}`]));
    const meta = { model: 'claude-opus-5-5', wysilek: 'high', data: '2026-11-16' };
    writeFileSync(join(wyj, 'de.json'), JSON.stringify({ jezyk: 'de', blad: 'odpowiedź ucięta', propozycja: null, odrzucone: [], krytyk: null, wynik: null, meta }));
    writeFileSync(join(wyj, 'fr.json'), JSON.stringify({ jezyk: 'fr', blad: null, propozycja: pelny, odrzucone: [], krytyk: null, wynik: pelny, meta }));
    writeFileSync(join(wyj, 'it.json'), JSON.stringify({ jezyk: 'it', blad: null, propozycja: pelny, odrzucone: [], krytyk: { blad: null, poprawki: [], odrzucone: [] }, wynik: { ...pelny, '01-dzis': 'x'.repeat(41) }, meta }));
    const r = run(`const l = []; const g = (a) => m.przyjmij(['--raport', ${JSON.stringify(wyj)}, '--korzen', ${JSON.stringify(kopia)}, ...a], { log: (x) => l.push(String(x)) });
      console.log(JSON.stringify({ de: g(['de']), fr: g(['fr']), it: g(['it']), en: g(['en']), l }))`);
    expect(r).toMatchObject({ de: 1, fr: 1, it: 1, en: 2 });
    expect(r.l.join('\n')).toMatch(/de: odrzucony/); expect(r.l.join('\n')).toMatch(/fr: odrzucony.*krytyk/); expect(r.l.join('\n')).toMatch(/it: odrzucony.*41 znaków/);
    expect(readFileSync(join(kopia, PLIK), 'utf8')).toBe(read(PLIK));
  });
});

describe('workflow przeklad-tlumaczen.yml: tryb podpisy (BO) w istniejącym pliku (P-472)', () => {
  const wf = read('.github/workflows/przeklad-tlumaczen.yml');
  test('tryb podpisy → scripts/i18n/przeklad-podpisy.mjs, artefakt raport-podpisy 7 dni; etap i tylko jak dla metadanych; klucz API nadal w jednym kroku', () => {
    expect(wf).toMatch(/options: \[przeklad, przeglad, zwrotny, metadane, produkty, podpisy\]/);
    expect((wf.match(/SKRYPT=scripts\/i18n\/przeklad-podpisy\.mjs; ZAKRES=-; WYJ=raport-podpisy/g) ?? []).length).toBe(2);
    expect(wf).toMatch(/if: always\(\) && inputs\.tryb == 'podpisy'[\s\S]*?name: raport-podpisy[\s\S]*?retention-days: 7/);
    expect(wf).toMatch(/WEJ_TRYB" = "podpisy" \]; then WYJ=raport-podpisy/); // podsumowanie w logu przebiegu
    expect((wf.match(/\[ "\$WEJ_TRYB" = "metadane" \] \|\| \[ "\$WEJ_TRYB" = "podpisy" \]/g) ?? []).length).toBe(2); // --etap także dla podpisów
    expect((wf.match(/secrets\.ANTHROPIC_API_KEY/g) ?? []).length).toBe(1);
  });
});
