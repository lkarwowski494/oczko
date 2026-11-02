// Adapter platformy wzoru (moduly.md „Kontrakt partii 6”: KonwersjaWzoru, SkanerStron, sprawdzPdf modułu oczko-wzor): JSON z mostu Swift → Wynik;
// powody spoza `Powod` → `zapis` (nic po cichu); brak modułu (build bez partii 6) → konwersja i skaner zwracają błąd, sprawdzPdf kontroluje nagłówek i %%EOF.
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { OczkoWzorNatywny } from '../../modules/oczko-wzor';
import { platformaWzoru } from '../../src/platforma/wzor';

const atrapa = (o: Partial<Record<keyof OczkoWzorNatywny, unknown>>): OczkoWzorNatywny => ({
  naPdf: jest.fn(async () => String(o.naPdf)), sprawdzPdf: jest.fn(async () => String(o.sprawdzPdf)),
  skanerDostepny: () => Boolean(o.skanerDostepny), skanuj: jest.fn(async () => String(o.skanuj)),
  wklej: jest.fn(async () => (o.wklej === undefined ? null : (o.wklej as string | null))), miniatura: jest.fn(async () => String(o.miniatura)),
});

test('naPdf: źródło jako JSON do Swift, wynik ok → ścieżka i strony; powód z kontraktu przechodzi', async () => {
  const n = atrapa({ naPdf: JSON.stringify({ ok: true, sciezka: '/tmp/a.pdf', strony: 3 }) });
  const p = platformaWzoru(n);
  expect(await p.naPdf({ rodzaj: 'adres', adres: 'https://example.org' })).toEqual({ ok: true, wartosc: { sciezka: '/tmp/a.pdf', strony: 3 } });
  expect(n.naPdf).toHaveBeenCalledWith(JSON.stringify({ rodzaj: 'adres', adres: 'https://example.org' }));
  expect(await platformaWzoru(atrapa({ naPdf: JSON.stringify({ ok: false, powod: 'odmowa' }) })).naPdf({ rodzaj: 'adres', adres: 'https://x.org' })).toEqual({ ok: false, powod: 'odmowa' });
});

test('E2-A3: przekroczenie czasu konwersji Worda (`przekroczono_czas`) przechodzi jako własny powód, nie jako zapis ani brak_sieci', async () => {
  expect(await platformaWzoru(atrapa({ naPdf: JSON.stringify({ ok: false, powod: 'przekroczono_czas' }) })).naPdf({ rodzaj: 'word', sciezka: '/a.docx' })).toEqual({ ok: false, powod: 'przekroczono_czas' });
});
test('nieznany powód albo zły JSON → zapis', async () => {
  expect(await platformaWzoru(atrapa({ naPdf: JSON.stringify({ ok: false, powod: 'cos' }) })).naPdf({ rodzaj: 'word', sciezka: '/a' })).toEqual({ ok: false, powod: 'zapis' });
  expect(await platformaWzoru(atrapa({ sprawdzPdf: '{nie json' })).sprawdzPdf('/a.pdf')).toEqual({ ok: false, powod: 'zapis' });
});

test('skaner: dostępność z modułu; wynik ze ścieżkami albo anulowano', async () => {
  const p = platformaWzoru(atrapa({ skanerDostepny: true, skanuj: JSON.stringify({ ok: true, sciezki: ['/s/1.jpg', '/s/2.jpg'] }) }));
  expect(p.skanerDostepny()).toBe(true);
  expect(await p.skanuj()).toEqual({ ok: true, wartosc: { sciezki: ['/s/1.jpg', '/s/2.jpg'] } });
  expect(await platformaWzoru(atrapa({ skanuj: JSON.stringify({ ok: false, powod: 'anulowano' }) })).skanuj()).toEqual({ ok: false, powod: 'anulowano' });
});

test('bez modułu natywnego: konwersja i skaner → zapis, skaner niedostępny; sprawdzPdf = kontrola nagłówka i końca', async () => {
  const p = platformaWzoru(null);
  expect(await p.naPdf({ rodzaj: 'obrazy', sciezki: ['/a.jpg'] })).toEqual({ ok: false, powod: 'zapis' });
  expect(p.skanerDostepny()).toBe(false);
  const k = mkdtempSync(join(tmpdir(), 'oczko-pdf-'));
  writeFileSync(join(k, 'dobry.pdf'), '%PDF-1.4\n1 0 obj << >> endobj\n%%EOF\n');
  writeFileSync(join(k, 'zly.pdf'), '%PDF-1.7\n\u0000ÿ');
  expect(await p.sprawdzPdf(join(k, 'dobry.pdf'))).toEqual({ ok: true, wartosc: { strony: 1 } });
  expect(await p.sprawdzPdf(join(k, 'zly.pdf'))).toEqual({ ok: false, powod: 'uszkodzony' });
});

// P-285 (1) B: „Paste” w arkuszu linku — schowek przez moduł oczko-wzor (UIPasteboard), bez nowej zależności; brak modułu albo pusty schowek → null.
test('wklej: tekst ze schowka; pusty schowek albo build bez modułu → null', async () => {
  expect(await platformaWzoru(atrapa({ wklej: 'https://example.org/wzor' })).wklej()).toBe('https://example.org/wzor');
  expect(await platformaWzoru(atrapa({ wklej: null })).wklej()).toBeNull();
  expect(await platformaWzoru(null).wklej()).toBeNull();
});
// Plan 1.1 pkt 7 (W8): miniatura pierwszej strony — PNG z PDFKit do pliku celu; błąd → powód; build bez modułu → zapis.
test('miniatura: PDF i cel do Swift, wynik ok albo powód; bez modułu → zapis', async () => {
  const n = atrapa({ miniatura: JSON.stringify({ ok: true }) });
  expect(await platformaWzoru(n).miniatura('/m/a.pdf', '/t/a.png')).toEqual({ ok: true, wartosc: undefined });
  expect(n.miniatura).toHaveBeenCalledWith('/m/a.pdf', '/t/a.png', 96);
  expect(await platformaWzoru(atrapa({ miniatura: JSON.stringify({ ok: false, powod: 'uszkodzony' }) })).miniatura('/a', '/b')).toEqual({ ok: false, powod: 'uszkodzony' });
  expect(await platformaWzoru(null).miniatura('/a', '/b')).toEqual({ ok: false, powod: 'zapis' });
});
