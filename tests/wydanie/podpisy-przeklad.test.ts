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

/* ===== Naprawy po recenzji niezależnej BQ (docs/lokalizacja/bq-recenzja-podpisy.md @ 07346b98): 08-programista-001…005; test czerwony najpierw ===== */
describe('BQ 001: wznowienie po przekroczeniu czasu batcha krytyka', () => {
  /** Atrapa z przełącznikiem: batch krytyka „wisi”, dopóki `wisi2` = true; liczy POST-y. Wynik krytyka: de dostaje poprawkę. */
  const atrapaWisi = `const zadane = []; const calls = []; let nb = 0; let wisi2 = true;
    const odp = (k) => JSON.stringify(Object.fromEntries(JSON.parse(${J(EKRANY)}).map((e, i) => [e, 'T' + i + ' ' + k.replace(/[0-9]/g, 'x')])));
    const krytyk = (k) => JSON.stringify({ poprawki: k === 'de' ? [{ ekran: '02-licznik', tekst: 'Ein Tipp, eine Reihe mehr', powod: 'naturalniej' }] : [] });
    const rr = (b) => ({ ok: true, status: 200, json: async () => b, text: async () => (typeof b === 'string' ? b : JSON.stringify(b)) });
    const fakeFetch = async (url, init = {}) => { const p = new URL(url).pathname, met = init.method || 'GET'; calls.push(met + ' ' + p);
      if (p.endsWith('/count_tokens')) return rr({ input_tokens: 700 });
      if (p.endsWith('/messages/batches') && met === 'POST') { const rs = JSON.parse(init.body).requests; nb++; zadane.push(...rs.map((q) => ({ ...q, batch: nb }))); return rr({ id: 'msgbatch_B' + nb }); }
      const ms = p.match(/\\/v1\\/messages\\/batches\\/(msgbatch_B\\d)$/); if (ms) return rr({ processing_status: ms[1] === 'msgbatch_B2' && wisi2 ? 'in_progress' : 'ended', results_url: 'https://wyniki.test/' + ms[1], request_counts: {} });
      const mw = p.match(/^\\/(msgbatch_B\\d)$/); if (mw) { const n = Number(mw[1].slice(-1)); return rr(zadane.filter((q) => q.batch === n).map((q) => JSON.stringify({ custom_id: q.custom_id, result: { type: 'succeeded', message: { stop_reason: 'end_turn', content: [{ type: 'text', text: q.custom_id.startsWith('pk-') ? krytyk(q.custom_id.slice(3)) : odp(q.custom_id.slice(3)) }], usage: { input_tokens: 700, output_tokens: 300 } } } })).join('\\n')); }
      return { ok: false, status: 404, json: async () => ({}), text: async () => '' }; };`;
  test('przekroczenie czasu krytyka: komunikat podaje OBA identyfikatory (--wznow B1,B2); wznowienie nie wysyła nowego POST i nakłada krytyka na przekład z batcha 1', () => {
    const wyj = mkdtempSync(join(tmpdir(), 'pp-'));
    const r = run(`${atrapaWisi}
      const logs = []; const opcje = { fetchFn: fakeFetch, env: { ANTHROPIC_API_KEY: 'sk-ant-test-123' }, log: (x) => logs.push(String(x)), spij: async () => {}, dzis: '2026-11-16' };
      const k1 = await m.main(['--czekaj-min', '0', '--tylko', 'de,fr', '--wyjscie', ${JSON.stringify(wyj)}], opcje); const postyPo1 = calls.filter((c) => c.startsWith('POST /v1/messages/batches')).length;
      wisi2 = false; const logs1 = logs.splice(0);
      const k2 = await m.main(['--wznow', 'msgbatch_B1,msgbatch_B2', '--tylko', 'de,fr', '--wyjscie', ${JSON.stringify(wyj)}], opcje);
      console.log(JSON.stringify({ k1, k2, postyPo1, posty: calls.filter((c) => c.startsWith('POST /v1/messages/batches')).length, logs1 }))`);
    expect(r.k1).toBe(4); expect(r.logs1.join('\n')).toMatch(/--wznow msgbatch_B1,msgbatch_B2/); expect(r.postyPo1).toBe(2);
    expect(r.k2).toBe(0); expect(r.posty).toBe(2); // wznowienie bez nowego POST (żadnego drugiego płatnego batcha krytyka)
    const de = JSON.parse(readFileSync(join(wyj, 'de.json'), 'utf8'));
    expect(de.propozycja['02-licznik']).toBe('T1 de'); expect(de.wynik['02-licznik']).toBe('Ein Tipp, eine Reihe mehr'); expect(de.meta.batch1).toBe('msgbatch_B1'); expect(de.meta.batch2).toBe('msgbatch_B2');
  });
  test('identyfikator krytyka podany jako przekład (--wznow B2 przy przeklad+krytyk) → błąd konfiguracji z nazwą etapu, kod 2, bez POST; dwa identyfikatory przy etapie krytyk albo zły format → kod 2', () => {
    const wyj = mkdtempSync(join(tmpdir(), 'pp-'));
    const r = run(`${atrapaWisi}
      wisi2 = false; const logs = []; const opcje = { fetchFn: fakeFetch, env: { ANTHROPIC_API_KEY: 'sk-ant-test-123' }, log: (x) => logs.push(String(x)), spij: async () => {}, dzis: '2026-11-16' };
      await m.main(['--tylko', 'de', '--wyjscie', ${JSON.stringify(wyj + '/a')}], opcje); const postyPo = calls.filter((c) => c.startsWith('POST /v1/messages/batches')).length; logs.length = 0;
      const k1 = await m.main(['--wznow', 'msgbatch_B2', '--tylko', 'de', '--wyjscie', ${JSON.stringify(wyj + '/b')}], opcje);
      const l1 = logs.splice(0).join('\\n');
      const k2 = await m.main(['--etap', 'krytyk', '--wznow', 'msgbatch_B1,msgbatch_B2', '--tylko', 'de', '--wyjscie', ${JSON.stringify(wyj + '/c')}], opcje);
      const k3 = await m.main(['--wznow', 'zly', '--tylko', 'de', '--wyjscie', ${JSON.stringify(wyj + '/d')}], opcje);
      console.log(JSON.stringify({ k1, k2, k3, l1, posty: calls.filter((c) => c.startsWith('POST /v1/messages/batches')).length - postyPo }))`);
    expect(r.k1).toBe(2); expect(r.l1).toMatch(/krytyk/); expect(r.l1).toMatch(/przekład/); expect(r.k2).toBe(2); expect(r.k3).toBe(2); expect(r.posty).toBe(0);
  });
  test('budżet czasu: 2 × oczekiwanie < timeout-minutes zadania (inaczej GitHub zabija zadanie przed kodem 4); artefakt zawiera batch-id-*.txt; --wznow z przecinkiem tylko dla trybu podpisy', () => {
    const wf = read('.github/workflows/przeklad-tlumaczen.yml');
    const t = Number(wf.match(/timeout-minutes: (\d+)/)![1]);
    const c = run(`console.log(JSON.stringify(m.CZEKAJ_MIN))`);
    expect(2 * c).toBeLessThan(t);
    expect(wf).toMatch(/raport-podpisy\/batch-id-\*\.txt/);
    expect(wf).toMatch(/msgbatch_\[A-Za-z0-9\]\+\(,msgbatch_\[A-Za-z0-9\]\+\)\?/); // lista „B1,B2” — tylko gałąź podpisy
  });
});

describe('BQ 002: poprawka krytyka odrzucona twardą kontrolą blokuje przyjęcie języka', () => {
  const przebieg = (krytykDe: string) => {
    const wyj = mkdtempSync(join(tmpdir(), 'pp-')), kopia = mkdtempSync(join(tmpdir(), 'pp-repo-'));
    mkdirSync(join(kopia, 'docs/wydanie/metadane'), { recursive: true }); cpSync(join(ROOT, PLIK), join(kopia, PLIK));
    const r = run(`const zadane = []; let nb = 0; const rr = (b) => ({ ok: true, status: 200, json: async () => b, text: async () => (typeof b === 'string' ? b : JSON.stringify(b)) });
      const odp = (k) => JSON.stringify(Object.fromEntries(JSON.parse(${J(EKRANY)}).map((e, i) => [e, 'T' + i + ' ' + k])));
      const krytyk = (k) => JSON.stringify({ poprawki: k === 'de' ? ${krytykDe} : [] });
      const fakeFetch = async (url, init = {}) => { const p = new URL(url).pathname, met = init.method || 'GET';
        if (p.endsWith('/count_tokens')) return rr({ input_tokens: 700 });
        if (p.endsWith('/messages/batches') && met === 'POST') { nb++; zadane.push(...JSON.parse(init.body).requests.map((q) => ({ ...q, batch: nb }))); return rr({ id: 'msgbatch_B' + nb }); }
        const ms = p.match(/\\/v1\\/messages\\/batches\\/(msgbatch_B\\d)$/); if (ms) return rr({ processing_status: 'ended', results_url: 'https://wyniki.test/' + ms[1], request_counts: {} });
        const mw = p.match(/^\\/(msgbatch_B\\d)$/); if (mw) { const n = Number(mw[1].slice(-1)); return rr(zadane.filter((q) => q.batch === n).map((q) => JSON.stringify({ custom_id: q.custom_id, result: { type: 'succeeded', message: { stop_reason: 'end_turn', content: [{ type: 'text', text: q.custom_id.startsWith('pk-') ? krytyk(q.custom_id.slice(3)) : odp(q.custom_id.slice(3)) }], usage: { input_tokens: 1, output_tokens: 1 } } } })).join('\\n')); }
        return { ok: false, status: 404, json: async () => ({}), text: async () => '' }; };
      const logs = []; const kod = await m.main(['--tylko', 'de,fr', '--wyjscie', ${JSON.stringify(wyj)}], { fetchFn: fakeFetch, env: { ANTHROPIC_API_KEY: 'sk-ant-test-123' }, log: (x) => logs.push(String(x)), spij: async () => {}, dzis: '2026-11-16' });
      const kp = m.przyjmij(['--raport', ${JSON.stringify(wyj)}, '--korzen', ${JSON.stringify(kopia)}], { log: (x) => logs.push(String(x)) }); console.log(JSON.stringify({ kod, kp, logs }))`);
    return { r, po: JSON.parse(readFileSync(join(kopia, PLIK), 'utf8')) };
  };
  test('poprawka za długa (41 znaków) → język NIE jest przyjęty (kod 1, plik bez zmian dla de, fr przyjęty); przebieg też zgłasza język', () => {
    const { r, po } = przebieg(JSON.stringify([{ ekran: '02-licznik', tekst: 'x'.repeat(41), powod: 'sens odwrócony względem źródła' }]));
    expect(r.kod).toBe(1); expect(r.kp).toBe(1); expect(r.logs.join('\n')).toMatch(/de: odrzucony.*krytyk/);
    expect(po.podpisy.de).toEqual(dane.podpisy.de); expect(po.status.de).toBe(dane.status.de);
    expect(po.podpisy.fr['01-dzis']).toBe('T0 fr'); expect(po.status.fr).toMatch(/\+ krytyk/);
  });
  test('poprawka „taka sama jak obecny” i duplikat ekranu NIE blokują (łagodne); brak powodu blokuje', () => {
    const lagodne = przebieg(JSON.stringify([{ ekran: '02-licznik', tekst: 'T1 de', powod: 'bez zmiany' }, { ekran: '03-wzor', tekst: 'Neu', powod: 'p' }, { ekran: '03-wzor', tekst: 'Neu2', powod: 'duplikat' }]));
    expect(lagodne.r.kp).toBe(0); expect(lagodne.po.podpisy.de['03-wzor']).toBe('Neu');
    const bez = przebieg(JSON.stringify([{ ekran: '02-licznik', tekst: 'Ein Tipp', powod: '' }]));
    expect(bez.r.kp).toBe(1); expect(bez.po.podpisy.de).toEqual(dane.podpisy.de);
  });
});

describe('BQ 003: status po samym etapie krytyk nie twierdzi „przekład API”', () => {
  test('raport z etap=krytyk → status zachowuje poprzednie pochodzenie i dopisuje „krytyk API (<model>, <data>)”', () => {
    const wyj = mkdtempSync(join(tmpdir(), 'pp-')), kopia = mkdtempSync(join(tmpdir(), 'pp-repo-'));
    mkdirSync(join(kopia, 'docs/wydanie/metadane'), { recursive: true }); cpSync(join(ROOT, PLIK), join(kopia, PLIK));
    const r = run(`const zadane = []; const rr = (b) => ({ ok: true, status: 200, json: async () => b, text: async () => (typeof b === 'string' ? b : JSON.stringify(b)) });
      const fakeFetch = async (url, init = {}) => { const p = new URL(url).pathname, met = init.method || 'GET';
        if (p.endsWith('/messages/batches') && met === 'POST') { zadane.push(...JSON.parse(init.body).requests); return rr({ id: 'msgbatch_B1' }); }
        if (/\\/messages\\/batches\\/msgbatch_B1$/.test(p)) return rr({ processing_status: 'ended', results_url: 'https://wyniki.test/msgbatch_B1', request_counts: {} });
        if (p === '/msgbatch_B1') return rr(zadane.map((q) => JSON.stringify({ custom_id: q.custom_id, result: { type: 'succeeded', message: { stop_reason: 'end_turn', content: [{ type: 'text', text: '{"poprawki":[]}' }], usage: { input_tokens: 1, output_tokens: 1 } } } })).join('\\n'));
        return { ok: false, status: 404, json: async () => ({}), text: async () => '' }; };
      const logs = []; const kod = await m.main(['--etap', 'krytyk', '--tylko', 'cs', '--wyjscie', ${JSON.stringify(wyj)}], { fetchFn: fakeFetch, env: { ANTHROPIC_API_KEY: 'sk-ant-test-123' }, log: (x) => logs.push(String(x)), spij: async () => {}, dzis: '2026-11-16' });
      const kp = m.przyjmij(['--raport', ${JSON.stringify(wyj)}, '--korzen', ${JSON.stringify(kopia)}], { log: (x) => logs.push(String(x)) }); console.log(JSON.stringify({ kod, kp }))`);
    expect(r).toEqual({ kod: 0, kp: 0 });
    const po = JSON.parse(readFileSync(join(kopia, PLIK), 'utf8'));
    expect(po.status.cs).not.toMatch(/^przekład API/); expect(po.status.cs).toMatch(/sesja AW, 2026-11-12, P-771/);
    expect(po.status.cs).toMatch(/krytyk API \(claude-opus-5-5, 2026-11-16\)/); expect(po.status.cs).toMatch(/\[DO PRZEGLĄDU\] przegląd człowieka według progu$/);
    expect(po.podpisy.cs).toEqual(dane.podpisy.cs);
  });
});

describe('BQ 004: kontrole zależne od języka (fałszywe alarmy) i luki „free”', () => {
  const sp = (v: string, jezyk: string) => run(`console.log(JSON.stringify(m.sprawdzPodpis(JSON.parse(${J(v)}), { max: 40, jezyk: ${JSON.stringify(jezyk)} })))`);
  test('fałszywe alarmy: fr „pris” (wzięty) i ms „siri” (seria) przechodzą; „pris” (cena) w sv/da/nb dalej odrzucone', () => {
    expect(sp('Tout est pris en compte', 'fr')).toEqual([]);
    expect(sp('Siri projek anda', 'ms')).toEqual([]);
    for (const j of ['sv', 'da', 'nb']) expect([j, sp('Bra pris för alla', j).length > 0]).toEqual([j, true]);
    expect(sp('Fråga Siri om hjälp', 'sv').length).toBeGreaterThan(0); // Siri jako marka poza ms
  });
  test('luki: cs/sk bezplatný, fi maksuton, sv/nb kostnadsfri, nl kosteloos, ja 無償, pt preço — odrzucone', () => {
    for (const [j, t] of [['cs', 'Bezplatný počítadlo'], ['sk', 'Bezplatná aplikácia'], ['fi', 'Maksuton laskuri'], ['sv', 'Kostnadsfri räknare'], ['nb', 'Kostnadsfri teller'], ['nl', 'Kosteloos tellen'], ['ja', '無償で使える'], ['pt', 'Sem preço escondido']])
      expect([j, sp(t, j).length > 0]).toEqual([j, true]);
  });
});

describe('BQ 005: --limit niepoprawny → błąd konfiguracji', () => {
  test('„dwa”, 0, -1, 1.5 → kod 2 (nie 27 języków); „2” działa', () => {
    const wyj = mkdtempSync(join(tmpdir(), 'pp-'));
    const r = run(`const k = {}; for (const v of ['dwa', '0', '-1', '1.5', '2']) k[v] = await m.main(['--szacuj', '--limit', v, '--wyjscie', ${JSON.stringify(wyj)} + '/' + v.replace(/[^0-9a-z]/g, '_')], { env: {}, log: () => {} }); console.log(JSON.stringify(k))`);
    expect(r).toEqual({ dwa: 2, '0': 2, '-1': 2, '1.5': 2, '2': 0 });
  });
});

/* ===== KO-063 / P-823: „tap” jak w aplikacji (przebieg dowodowy 43698042593: cs „dotyk” zamiast „klepnutí”, krytyk nie wyłapał); test czerwony najpierw ===== */
describe('KO-063: słowo „tap” oddane jak w aplikacji (słownik w żądaniu przekładu i krytyka + reguła)', () => {
  const zadania = (kod: string) => run(`const c = m.wczytajKontekst(); const p = JSON.parse(${J(dane.podpisy.en)}); const t = m.budujZadanie(${JSON.stringify(kod)}, c), k = m.budujKrytyka(${JSON.stringify(kod)}, c, p); console.log(JSON.stringify({ ts: t.system, tu: t.messages[0].content, ks: k.system, ku: k.messages[0].content }))`);
  test('cs: oba żądania zawierają wiersze słownika aplikacji z „tap” (klepněte…, Klepnutím…), de: tippen…; ja: タップ', () => {
    const cs = zadania('cs');
    for (const u of [cs.tu, cs.ku]) { expect(u).toMatch(/tap when row/); expect(u).toMatch(/klepněte po dokončení/); expect(u).toMatch(/Klepnutím na řadu/); }
    expect(zadania('de').tu).toMatch(/tippen, wenn Reihe/); expect(zadania('ja').tu).toMatch(/タップ/);
  });
  test('instrukcje (przekład i krytyk) mają regułę: „tap” tak jak w słowniku aplikacji, bez synonimu', () => {
    const cs = zadania('cs');
    expect(cs.ts).toMatch(/„tap”[^.]*słownik/); expect(cs.ts).toMatch(/synonim/);
    expect(cs.ks).toMatch(/„tap”[^.]*słownik/);
  });
});
