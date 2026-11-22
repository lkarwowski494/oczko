// M1-audytor-generalny-058 (12-niezawodnosc-006, NIE-08/NIE-06; DEC-19 = a, P-418): ramki stosu JS zapisane w `blad.szczegoly`
// (src/kompozycja/bledy-js.ts) trafiają do „Zgłoś problem” — zwykłego (przygotujZgloszenie) i z trybu awaryjnego (diagnostykaAwaryjna,
// odczyt z kopii surowej w start-aplikacji.ts) — jako „plik:linia:kolumna” pod kodem `js_*`. Bez treści komunikatu, nazw projektów
// i notatek (NFR-PRY-001, NIE-09): szczegóły innych kodów (np. tekst zatrutej linii dziennika) nie wychodzą; ramka spoza formatu odpada.
// Wyrocznia: ADR-0018 („Mapy źródeł Hermesa dla każdego buildu … żeby ramki dało się odczytać”), decyzja DEC-19 (a).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { zapiszBlad } from '../../src/dane/repozytoria/bledy';
import { zainstalujObslugeBledow, type WpisBledu } from '../../src/kompozycja/bledy-js';
import { diagnostykaAwaryjna } from '../../src/kompozycja/zgloszenie-awaryjne';
import { przygotujZgloszenie } from '../../src/przypadki-uzycia/zgloszenie';
import { zycie } from '../dane/pomocnicze/dane-wejsciowe';
import { przygotuj, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';

const DANE_UZYTKOWNICZKI = /Projekt \d|ujmowanie co 4|warkocz|Merino|Alpaka|Przód/;
// Stos Hermesa z buildu wydania: komunikat (pierwsza linia) niesie dane użytkowniczki, ramki — ścieżkę kontenera i nazwy funkcji.
function bladHermesa(): TypeError {
  const e = new TypeError("Cannot read property 'warkocz' of undefined (Projekt 1, Merino)");
  e.stack = [
    "TypeError: Cannot read property 'warkocz' of undefined (Projekt 1, Merino)",
    '    at zapiszNotatke (address at /private/var/containers/Bundle/Application/0A1B/Oczko.app/main.jsbundle:1:123456)',
    '    at map (native)',
    '    at anonymous (address at /private/var/containers/Bundle/Application/0A1B/Oczko.app/main.jsbundle:1:98765)',
  ].join('\n');
  return e;
}
const RAMKI = '  at main.jsbundle:1:123456\n  at main.jsbundle:1:98765';

test('M1-058: zwykłe „Zgłoś problem” — wpis js_* niesie ramki z `szczegoly`; brak nazw projektów, notatek i treści komunikatu', async () => {
  const s = await przygotuj();
  const pliki = { pdf: wlozPlik(s.magazyn, 'a', 'pdf'), rys: wlozPlik(s.magazyn, 'b', 'pkdrawing'), jpg: wlozPlik(s.magazyn, 'c', 'jpg') };
  await wykonaj(s.baza, zycie(pliki));
  // Szczegóły innego kodu z treścią użytkowniczki (zatruta linia dziennika, ADR-0008 (3)) — nie mogą wyjść w zgłoszeniu.
  await zapiszBlad(s.baza, { czasMs: s.zegar.teraz().ms, kod: 'dziennik_uszkodzona_linia', szczegoly: { tekst: '{"notatka":"warkocz","projekt":"Projekt 1"}' } });
  // Ten sam zapis co app/_layout.tsx: globalny handler → zapiszBlad z { ramki, fatal: 0|1 }.
  const zapisy: Promise<void>[] = [];
  const rn = { h: (_e: unknown, _f?: boolean) => undefined, getGlobalHandler() { return this.h; }, setGlobalHandler(h: (e: unknown, f?: boolean) => void) { this.h = h; } };
  zainstalujObslugeBledow(rn).ustawZapis(async (b: WpisBledu) => {
    const p = zapiszBlad(s.baza, { czasMs: s.zegar.teraz().ms + 1000, kod: b.kod, szczegoly: { ramki: b.szczegoly.ramki, fatal: b.szczegoly.fatal ? 1 : 0 } }).then(() => undefined);
    zapisy.push(p);
    await p;
  });
  rn.h(bladHermesa(), true);
  await Promise.all(zapisy);

  const w = await przygotujZgloszenie(s.z);
  if (!w.ok) throw new Error(w.powod);
  const t = w.wartosc.tresc;
  expect(t).toContain(`T10:00:01.000Z js_TypeError\n${RAMKI}`);
  expect(t).toMatch(/\d{2}\.\d{3}Z dziennik_uszkodzona_linia$/m); // kod bez szczegółów
  expect(t).not.toMatch(DANE_UZYTKOWNICZKI);
  expect(t).not.toMatch(/Cannot read|zapiszNotatke|private\/var|0A1B/);
});

test('M1-058: tryb awaryjny — ramki z `szczegoly` kopii pod kodem js_*; szczegóły innych kodów i ramki spoza formatu odpadają', async () => {
  const d = await diagnostykaAwaryjna({
    powod: 'petla-startow', nieudaneStarty: async () => 2, srodowisko: { wersja: '1.0.0 (7)', system: 'iOS 26.1', model: 'iPhone17,1' },
    bledy: async () => [
      { czasMs: Date.UTC(2026, 9, 26, 12), kod: 'js_TypeError', szczegoly: JSON.stringify({ ramki: ['main.jsbundle:1:123456', 'Projekt 1 warkocz:1:2', 'main.jsbundle:1:98765'], fatal: 1 }) },
      { czasMs: Date.UTC(2026, 9, 26, 11), kod: 'dziennik_uszkodzona_linia', szczegoly: JSON.stringify({ tekst: 'Merino', ramki: ['notatka.js:1:2'] }) },
      { czasMs: Date.UTC(2026, 9, 26, 10), kod: 'js_RangeError', szczegoly: 'nie-json' },
    ],
  });
  expect(d.find((x) => x.pole === 'bledy')?.wartosc).toBe([
    'safe_mode=petla-startow failed_starts=2',
    'errors:',
    `2026-10-26T12:00:00.000Z js_TypeError\n${RAMKI}`,
    '2026-10-26T11:00:00.000Z dziennik_uszkodzona_linia',
    '2026-10-26T10:00:00.000Z js_RangeError',
  ].join('\n'));
});

test('M1-058: oba odczyty `blad` do zgłoszenia (zwykły i z kopii surowej) biorą `szczegoly`', () => {
  const KORZEN = join(__dirname, '../..');
  for (const p of ['src/przypadki-uzycia/zgloszenie.ts', 'src/kompozycja/start-aplikacji.ts']) {
    const zrodlo = readFileSync(join(KORZEN, p), 'utf8');
    expect({ p, szczegoly: /SELECT czas_ms, kod, szczegoly FROM blad ORDER BY id DESC LIMIT \?/.test(zrodlo) }).toEqual({ p, szczegoly: true });
  }
});
