// P-085: nazwy źródeł wiedzy tylko na ekranie Ustawienia → „Źródła wiedzy”. Skrypt: scripts/sprawdz-nazwy-zrodel.mjs.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = join(__dirname, '..', '..');
const skrypt = join(root, 'scripts', 'sprawdz-nazwy-zrodel.mjs');
const lista = join(root, 'docs', 'tresci', 'nazwy-zrodel.json');
const uruchom = (...cele: string[]) => {
  const r = spawnSync(process.execPath, [skrypt, '--lista', lista, ...cele], { cwd: root, encoding: 'utf8' });
  return { kod: r.status, wyjscie: r.stdout + r.stderr };
};
const slownik = (o: unknown) => {
  const d = mkdtempSync(join(tmpdir(), 'zrodla-'));
  writeFileSync(join(d, 'en.json'), JSON.stringify(o));
  return d;
};

describe('nazwy źródeł wiedzy w tekstach interfejsu (P-085)', () => {
  it('słowniki aplikacji i teksty systemowe nie zawierają nazw źródeł poza ekranem „Źródła wiedzy”', () => {
    const r = uruchom('src/i18n/slowniki', 'locales');
    expect(r.wyjscie).toMatch(/naruszenia: 0/);
    expect(r.kod).toBe(0);
  });
  it('nazwa źródła w treści funkcji: naruszenie z kluczem, kod 1', () => {
    const r = uruchom(slownik({ obliczenia: { uwaga: 'According to CYC, this is category 4.' } }));
    expect(r.wyjscie).toMatch(/obliczenia\.uwaga/);
    expect(r.kod).toBe(1);
  });
  it('linia wymagana warunkami użycia (P-112 (2), klucz zrodla.linia_standardow): dozwolona', () => {
    const r = uruchom(slownik({ zrodla: { linia_standardow: "Source: Craft Yarn Council's www.YarnStandards.com" } }));
    expect(r.kod).toBe(0);
  });
  it('F07-14 (P-108, P-112 (2)): inny klucz ekranu „Źródła wiedzy” z nazwą źródła — naruszenie (ekran ma tylko zdanie ogólne i linię warunków użycia)', () => {
    for (const o of [{ zrodla: { zdanie: 'Based on TKGA handbooks.' } }, { zrodla: { ksiazki: { a: 'Handbook 44' } } }, { ustawienia: { zrodla_wiedzy: { przedze: 'Craft Yarn Council, Standards & Guidelines' } } }]) {
      const r = uruchom(slownik(o));
      expect({ o, kod: r.kod }).toEqual({ o, kod: 1 });
    }
  });
  it('słowo zawierające skrót (np. „bicycle”) nie jest naruszeniem', () => {
    const r = uruchom(slownik({ a: { b: 'Knit a bicycle cover.' } }));
    expect(r.kod).toBe(0);
  });
});
