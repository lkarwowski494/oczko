// 07-jakosc-017 (F-55, K-17b, K-17c, K-17e; ADR-0031 pkt 3–4; BR-WZR-007 S3): strona WWW dodana z aplikacji bez sieci czeka w skrzynce (nie znika, nie powstaje
// pusty wzór), wiersz „czeka na sieć” przeżywa restart, a zdarzenie portu Siec → „jest” (po SIEC_PONOWIENIE_MS) kończy import jako wzór i czyści skrzynkę.
// Baza i skrzynka prawdziwe; konwersja to atrapa portu (granica platformy), planista opóźnienia wstrzyknięty (bez fałszywych timerów).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Siec, StanSieci } from '../../src/domena/porty';
import { SIEC_PONOWIENIE_MS } from '../../src/konfiguracja';
import { kompozycjaWzoru } from '../../src/kompozycja/wzor';
import { migawkaWKatalogu } from '../../src/platforma/migawka';
import { skrzynkaWKatalogu } from '../../src/platforma/skrzynka';
import { projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { czasWTle, ile, jeden, katalogTymczasowy, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';

const ADRES = 'https://example.org/wzory/czapka';
const PDF_ZE_STRONY = Buffer.from('%PDF-1.7\n% strona WWW\n%%EOF\n');

function atrapaSieci() {
  const sluchacze = new Set<(s: StanSieci) => void>();
  const siec: Siec = { stan: () => 'brak', obserwuj: (fn) => { sluchacze.add(fn); return () => { sluchacze.delete(fn); }; } };
  return { siec, emit: (s: StanSieci) => { for (const f of [...sluchacze]) f(s); }, sluchacze };
}
function planista() {
  const zadania: { fn: () => void; ms: number; anulowane: boolean }[] = [];
  return { planuj: (fn: () => void, ms: number) => { const z = { fn, ms, anulowane: false }; zadania.push(z); return () => { z.anulowane = true; }; }, zadania,
    uruchom: () => { for (const z of zadania.splice(0)) if (!z.anulowane) z.fn(); } };
}
async function srodowisko(o: { grupa?: string } = {}) {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Czapka')]);
  const grupa = o.grupa ?? katalogTymczasowy('oczko-grupa-');
  const stan = { siec: true };
  const naPdf = jest.fn(async () => {
    if (stan.siec) return { ok: false as const, powod: 'brak_sieci' as const };
    const sciezka = join(katalogTymczasowy('oczko-konwersja-'), 'strona.pdf');
    writeFileSync(sciezka, PDF_ZE_STRONY);
    return { ok: true as const, wartosc: { sciezka, strony: 2 } };
  });
  const konwersja = { naPdf, sprawdzPdf: jest.fn(async () => ({ ok: true as const, wartosc: { strony: 2 } })) };
  const z = { ...s.z, konwersja, czasWTle, skrzynka: skrzynkaWKatalogu(grupa, () => s.zegar.teraz().ms), migawka: migawkaWKatalogu(grupa, () => s.zegar.teraz().ms), jezyk: () => 'en' };
  const k = kompozycjaWzoru(z, { grupa, zlecenieE2e: null });
  return { s, grupa, k, z, stan, naPdf, wlaczSiec: () => { stan.siec = false; } };
}

test('K-17b: strona z aplikacji bez sieci → zlecenie „adres” w skrzynce z projektem, wiersz „czeka na sieć”, brak pustego wzoru', async () => {
  const { s, k, z } = await srodowisko();
  const zmiany = jest.fn();
  k.naZmiane(zmiany);
  expect(await k.czekajNaSiec({ projektId: 'p1', adres: ADRES, nazwa: 'example.org' })).toEqual({ ok: true, wartosc: undefined });
  expect(k.stan().czekaSiec).toEqual([expect.objectContaining({ rodzaj: 'adres', adres: ADRES, projektId: 'p1', nazwa: 'example.org' })]);
  expect(zmiany).toHaveBeenCalled();
  expect(await z.skrzynka.pobierz()).toHaveLength(1);
  expect(await ile(s.baza, 'wzor')).toBe(0);
});
test('K-17b: błąd zapisu zlecenia (brak App Group) → błąd `zapis`, stan „czeka na sieć” bez zmian', async () => {
  const { s, z } = await srodowisko();
  const k = kompozycjaWzoru({ ...z, skrzynka: skrzynkaWKatalogu(null, () => s.zegar.teraz().ms) }, { grupa: null, zlecenieE2e: null });
  expect(await k.czekajNaSiec({ projektId: 'p1', adres: ADRES, nazwa: 'example.org' })).toEqual({ ok: false, powod: 'zapis' });
  expect(k.stan().czekaSiec).toEqual([]);
});
test('K-17e: po restarcie aplikacji (nowa kompozycja na tej samej skrzynce) zlecenie nadal czeka na sieć — jest w skrzynce, nie w pamięci', async () => {
  const a = await srodowisko();
  await a.k.czekajNaSiec({ projektId: 'p1', adres: ADRES, nazwa: 'example.org' });
  const po = kompozycjaWzoru(a.z, { grupa: a.grupa, zlecenieE2e: null });
  expect(po.stan().czekaSiec).toEqual([]); // świeży proces: stan w pamięci pusty
  await po.poStarcie(); // start: przetworzenie skrzynki, sieci nadal brak
  expect(po.stan().czekaSiec).toEqual([expect.objectContaining({ adres: ADRES, projektId: 'p1' })]);
  expect(await ile(a.s.baza, 'wzor')).toBe(0);
});
test('K-17c: zdarzenie Siec → „jest” po SIEC_PONOWIENIE_MS przetwarza skrzynkę: wzór www w projekcie, skrzynka pusta, wiersz znika', async () => {
  const { s, k, z, wlaczSiec } = await srodowisko();
  const { siec, emit } = atrapaSieci();
  const p = planista();
  const odepnij = k.obserwujSiec(siec, p.planuj);
  await k.czekajNaSiec({ projektId: 'p1', adres: ADRES, nazwa: 'example.org' });
  emit('brak');
  expect(p.zadania).toHaveLength(0); // „brak” niczego nie planuje
  wlaczSiec();
  emit('jest');
  expect(p.zadania.map((x) => x.ms)).toEqual([SIEC_PONOWIENIE_MS]);
  p.uruchom();
  await k.poStarcie(); // czeka na przetwarzanie w toku (wspólny `wToku`), jeśli już ruszyło
  expect(await jeden(s.baza, 'SELECT projekt_id, zrodlo, adres FROM wzor')).toEqual({ projekt_id: 'p1', zrodlo: 'www', adres: ADRES });
  expect(await z.skrzynka.pobierz()).toEqual([]);
  expect(k.stan().czekaSiec).toEqual([]);
  odepnij();
});
test('K-17c: „jest” bez zleceń czekających na sieć nic nie przetwarza (nie pokazuje ponownie arkusza „Not now”); szybkie „jest” po „jest” liczy się raz', async () => {
  const { k, naPdf } = await srodowisko();
  const { siec, emit } = atrapaSieci();
  const p = planista();
  k.obserwujSiec(siec, p.planuj);
  emit('jest'); emit('jest');
  expect(p.zadania.filter((x) => !x.anulowane)).toHaveLength(1); // drugi emit anuluje pierwsze zadanie
  p.uruchom();
  await k.poStarcie();
  expect(naPdf).not.toHaveBeenCalled();
  expect(k.stan().czekaSiec).toEqual([]);
});
test('K-17c: odpięcie nasłuchu anuluje zaplanowane ponowienie i zwalnia port', async () => {
  const { k } = await srodowisko();
  const { siec, emit, sluchacze } = atrapaSieci();
  const p = planista();
  const odepnij = k.obserwujSiec(siec, p.planuj);
  emit('jest');
  odepnij();
  expect(sluchacze.size).toBe(0);
  expect(p.zadania.every((x) => x.anulowane)).toBe(true);
});
test('K-17c: ponowienie, gdy sieć wciąż zawodzi (brak_sieci z konwersji), zostawia zlecenie na liście oczekujących — nic nie ginie', async () => {
  const { s, k, z } = await srodowisko();
  const { siec, emit } = atrapaSieci();
  const p = planista();
  k.obserwujSiec(siec, p.planuj);
  await k.czekajNaSiec({ projektId: 'p1', adres: ADRES, nazwa: 'example.org' });
  emit('jest');
  p.uruchom();
  await k.poStarcie();
  expect(await z.skrzynka.pobierz()).toHaveLength(1);
  expect(k.stan().czekaSiec).toHaveLength(1);
  expect(await ile(s.baza, 'wzor')).toBe(0);
});

// Podpięcie w korzeniu aplikacji (app/_layout.tsx) sprawdzane statycznie — layout renderuje się dopiero z gotowym kontenerem i modułami natywnymi.
// Nasłuch portu Siec startuje razem z kontenerem i jest zwalniany przy sprzątaniu efektu (jak nasłuch transakcji dostępu).
test('K-17c: korzeń aplikacji podpina nasłuch sieci kontenera (porty.siec) i zwalnia go w sprzątaniu efektu', () => {
  const layout = readFileSync(join(__dirname, '../../app/_layout.tsx'), 'utf8');
  expect(layout).toMatch(/const koniecSieci = w\.wartosc\.wzor\.k\.obserwujSiec\(w\.wartosc\.porty\.siec\)/);
  expect(layout).toMatch(/koniecNasluchu = \(\) => \{ koniecDostepu\(\); koniecSieci\(\); \}/);
});

// Przegląd subagenta (ścieżka wrażliwa: skrzynka importu), poprawki 07-jakosc-017.
test('przegląd P1: ponowienie po sieci nie gubi z „czeka na sieć” zlecenia bez projektu, wybranego w arkuszu (zostaje w skrzynce, nie jest importowane)', async () => {
  const { s, k, z } = await srodowisko();
  await z.skrzynka.dodaj({ rodzaj: 'adres', adres: ADRES, nazwa: 'bez-projektu', projektId: null });
  await k.czekajNaSiec({ projektId: 'p1', adres: `${ADRES}2`, nazwa: 'z-projektem' }); // coś czeka, więc ponowienie ma sens
  await k.poStarcie(); // bez-projektu → arkusz wyboru
  expect(k.stan().doWyboru.map((x) => x.nazwa)).toEqual(['bez-projektu']);
  await k.wybierzProjekt('p1'); // konwersja: brak sieci → zlecenie czeka
  expect(k.stan().czekaSiec.map((x) => x.nazwa).sort()).toEqual(['bez-projektu', 'z-projektem']);
  await k.ponowPoSieci();
  expect(k.stan().czekaSiec.map((x) => x.nazwa).sort()).toEqual(['bez-projektu', 'z-projektem']);
  expect(await z.skrzynka.pobierz()).toHaveLength(2);
  expect(await ile(s.baza, 'wzor')).toBe(0);
});
test('przegląd P1: ponowienie po sieci nie zastępuje świeżą listą nieodebranego błędu zlecenia bez projektu', async () => {
  const { k, z, naPdf } = await srodowisko();
  await z.skrzynka.dodaj({ rodzaj: 'adres', adres: ADRES, nazwa: 'bez-projektu', projektId: null });
  await k.czekajNaSiec({ projektId: 'p1', adres: `${ADRES}2`, nazwa: 'z-projektem' });
  await k.poStarcie();
  naPdf.mockResolvedValueOnce({ ok: false as never, powod: 'bledne_dane' as never }); // pierwsza konwersja (wybór projektu) kończy błędem trwałym
  await k.wybierzProjekt('p1');
  expect(k.stan().bledy.map((b) => b.zlecenie.nazwa)).toEqual(['bez-projektu']);
  await k.ponowPoSieci();
  expect(k.stan().bledy.map((b) => b.zlecenie.nazwa)).toEqual(['bez-projektu']);
});
test('przegląd P1: czekajNaSiec w trakcie przetwarzania skrzynki nie ginie (wiersz zostaje, jedno zlecenie, brak błędu zapisu)', async () => {
  const { k, z, naPdf } = await srodowisko();
  await k.czekajNaSiec({ projektId: 'p1', adres: `${ADRES}1`, nazwa: 'stare' });
  let zwolnij: () => void = () => undefined;
  const brama = new Promise<void>((r) => { zwolnij = r; });
  naPdf.mockImplementationOnce(async () => { await brama; return { ok: false as const, powod: 'brak_sieci' as const }; });
  const przetwarzanie = k.poStarcie(); // konwersja „starego” zawisła na bramie
  const nowe = k.czekajNaSiec({ projektId: 'p1', adres: `${ADRES}2`, nazwa: 'nowe' });
  zwolnij();
  expect(await nowe).toEqual({ ok: true, wartosc: undefined });
  await przetwarzanie;
  expect(k.stan().czekaSiec.map((x) => x.nazwa).sort()).toEqual(['nowe', 'stare']);
  expect(await z.skrzynka.pobierz()).toHaveLength(2);
});
