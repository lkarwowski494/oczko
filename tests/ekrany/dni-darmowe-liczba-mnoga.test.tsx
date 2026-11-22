// M1-audytor-generalny-019 (09-lokalizacja-002, P-307): w „Zostało {{zostalo}} z {{limit}} darmowych dni” rzeczownik stoi po {{limit}}, więc formę
// liczby mnogiej wybiera `count = limit`, nie `zostalo`. Lista projektów i Ustawienia na prawdziwym t() w pl, ru, lt, cs przy limit = 5 i
// zostalo ∈ {0, 1, 2, 5}: nigdy forma pojedyncza przy „z 5” (pl „darmowego dnia”, ru „бесплатного дня”, lt „nemokamos … dienos”).
import React from 'react';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react-native';
import { ListaProjektow } from '../../src/ekrany/ListaProjektow';
import { Ustawienia } from '../../src/ekrany/Ustawienia';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaSystemu, tekst } from './pomoc';

const tDla = async (jezyk: string): Promise<Tlumacz> =>
  (await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => [jezyk], zasoby: ZASOBY })).t;
const POJEDYNCZA: Record<string, RegExp | null> = { pl: /darmowego dnia/, ru: /бесплатного дня/, lt: /nemokamos rankdarbio dienos/, cs: null };
const ADRESY = { polityka: 'https://example.invalid/oczko/privacy', wsparcie: 'https://example.invalid/oczko/support', recenzja: 'https://apps.apple.com/app/id0000000000?action=write-review' };

describe.each(Object.keys(POJEDYNCZA))('M1-019 %s: „z 5” zawsze z formą liczby mnogiej dla 5', (jezyk) => {
  let t: Tlumacz;
  beforeAll(async () => { t = await tDla(jezyk); });
  test.each([0, 1, 2, 5])('zostalo = %i: lista projektów i Ustawienia = forma dla count 5', (zostalo) => {
    const dni = { zostalo, limit: 5, miesiac: 'M' };
    const oczekiwany = t('projekty.dni', { count: 5, zostalo, limit: 5, miesiac: 'M' });
    render(<ListaProjektow stan={{ wToku: [], ukonczone: [], zapytanie: '', dni }} t={t} naSzukaj={jest.fn()} naOtworz={jest.fn()} naNowy={jest.fn()} />);
    const lista = tekst(screen.getByTestId('projekty-dni-darmowe') as unknown as { children: unknown[] });
    screen.unmount();
    render(<Ustawienia stan={{ pro: null, dni, wibracje: true }} t={t} system={atrapaSystemu()} adresy={ADRESY} naOferty={jest.fn()} naWibracje={jest.fn()} naZglosProblem={jest.fn()} naStanDanych={jest.fn()} />);
    const ustawienia = tekst(screen.getByTestId('ustawienia-dni-darmowe') as unknown as { children: unknown[] });
    expect([lista, ustawienia]).toEqual([oczekiwany, oczekiwany]);
    const zla = POJEDYNCZA[jezyk];
    if (zla) expect([lista, ustawienia].filter((x) => zla.test(x))).toEqual([]);
  });
});

// M1-audytor-generalny-086 (09-lokalizacja-501, P-412 a): `count = limit` łamie zdanie tam, gdzie rzeczownik stoi przy {{zostalo}}
// (fr „Il reste 1 jours … sur 5”, bg „Остават 1”, es-419 „Quedan 1 de 5”, pt-PT „Restam 1 de 5”, sk „zostáva 2 z 5”). Do fali 09 języki niezweryfikowane
// nie miały przekładu `projekty.dni` (tekst z en); fala 2026-11-03 (P-474) dała im formy wg CLDR z regułą „forma za {{limit}}” (kontekst tłumacza,
// drugi przegląd AI P-486), a treść zdań blokuje tabela wektorów (projekty-dni-wektory-108.test.ts). Tu: widok pokazuje przekład swojego języka, nie tekst en.
const ZWERYFIKOWANE = ['pl', 'ru', 'lt', 'cs'];
const KLUCZ_DNI = /^projekty\.dni(_(zero|one|two|few|many|other))?$/;
const KORZEN = join(__dirname, '..', '..');
const plaskie = (o: Record<string, unknown>, p = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? plaskie(v as Record<string, unknown>, `${p}${k}.`) : [`${p}${k}`]));
const kluczeDni = (j: string) => plaskie((ZASOBY as Record<string, { translation: Record<string, unknown> }>)[j].translation).filter((k) => KLUCZ_DNI.test(k));
// Język z ustawienia aplikacji (preferencja), nie z systemu: tag systemowy `pt` trafia do pt-BR (jezyki.ts, dopasujTag).
const tWybrany = async (jezyk: string): Promise<Tlumacz> =>
  (await utworzI18n({ magazyn: { odczytaj: async () => jezyk, zapisz: async () => {} }, systemowe: () => [], zasoby: ZASOBY })).t;
// Tag systemowy → słownik: pt-PT (region PT) trafia do słownika `pt` (Portugalia); pozostałe tagi = słownik o tej nazwie.
const TAGI_SYSTEMOWE: Array<[string, string]> = [['fr', 'fr'], ['bg', 'bg'], ['es-419', 'es-419'], ['pt-PT', 'pt'], ['sk', 'sk']];

describe('M1-086: projekty.dni po fali 2026-11-03 — każdy język pokazuje przekład swojego języka (nie tekst en)', () => {
  let tEn: Tlumacz;
  beforeAll(async () => { tEn = await tDla('en'); });

  describe.each(TAGI_SYSTEMOWE)('%s (tag systemu, słownik %s)', (tag, slownik) => {
    let t: Tlumacz, tSlownika: Tlumacz;
    beforeAll(async () => { t = await tDla(tag); tSlownika = await tWybrany(slownik); });
    test.each([0, 1, 2, 5])('zostalo = %i, limit = 5: lista projektów i Ustawienia = t() tego języka z count = limit, różne od tekstu en', (zostalo) => {
      const dni = { zostalo, limit: 5, miesiac: 'M' };
      const en = tEn('projekty.dni', { count: 5, zostalo, limit: 5, miesiac: 'M' });
      const oczekiwany = tSlownika('projekty.dni', { count: 5, zostalo, limit: 5, miesiac: 'M' });
      expect(oczekiwany).not.toBe(en);
      render(<ListaProjektow stan={{ wToku: [], ukonczone: [], zapytanie: '', dni }} t={t} naSzukaj={jest.fn()} naOtworz={jest.fn()} naNowy={jest.fn()} />);
      const lista = tekst(screen.getByTestId('projekty-dni-darmowe') as unknown as { children: unknown[] });
      screen.unmount();
      render(<Ustawienia stan={{ pro: null, dni, wibracje: true }} t={t} system={atrapaSystemu()} adresy={ADRESY} naOferty={jest.fn()} naWibracje={jest.fn()} naZglosProblem={jest.fn()} naStanDanych={jest.fn()} />);
      const ustawienia = tekst(screen.getByTestId('ustawienia-dni-darmowe') as unknown as { children: unknown[] });
      expect([lista, ustawienia]).toEqual([oczekiwany, oczekiwany]);
    });
  });

  const SLOWNIKI = readdirSync(join(KORZEN, 'src', 'i18n', 'slowniki'))
    .filter((f) => f.endsWith('.json') && !f.includes('.kontekst.'))
    .map((f) => f.slice(0, -'.json'.length));
  test('słowniki w src/i18n/slowniki = ZASOBY (pętla niżej obejmuje wszystkie języki)', () => {
    expect([...SLOWNIKI].sort()).toEqual(Object.keys(ZASOBY).sort());
  });
  const NIEZWERYFIKOWANE = SLOWNIKI.filter((j) => j !== 'en' && j !== 'en-XA' && !ZWERYFIKOWANE.includes(j));
  test.each(NIEZWERYFIKOWANE)('%s: słownik ma projekty.dni* (z _other), t() przy zostalo ∈ {0, 1, 2, 5} to przekład: bez {{…}}, z liczbą dni, limitem i miesiącem, nie tekst en', async (jezyk) => {
    const klucze = kluczeDni(jezyk);
    expect(klucze.length).toBeGreaterThan(0);
    expect(klucze.some((k) => k === 'projekty.dni' || k.endsWith('_other'))).toBe(true);
    const t = await tWybrany(jezyk);
    for (const zostalo of [0, 1, 2, 5]) {
      const p = { count: 5, zostalo, limit: 5, miesiac: 'M' };
      const tekstJezyka = t('projekty.dni', p);
      expect(tekstJezyka).not.toBe(tEn('projekty.dni', p));
      expect(tekstJezyka).not.toMatch(/\{\{|\}\}/);
      expect([tekstJezyka.includes(String(zostalo)), tekstJezyka.includes('5'), tekstJezyka.includes('M')]).toEqual([true, true, true]);
    }
  });

  test('zakres fali 2026-11-03: projekty.dni z przetlumaczone_czesciowo = pl, ru, lt, cs (zweryfikowane P-412 a, nietknięte), nie na liście oczekujących, P-412 w odwołaniach; zweryfikowane mają formy', () => {
    const czytaj = (p: string) => JSON.parse(readFileSync(join(KORZEN, 'docs', 'lokalizacja', p), 'utf8')) as {
      odwolania: string[]; klucze: string[]; przetlumaczone_czesciowo: Record<string, string[] | undefined>;
    };
    const zakres = czytaj('zakres-fali-2026-11-03.json'), ocz = czytaj('oczekujace.json');
    expect(zakres.klucze).toContain('projekty.dni');
    expect(ocz.klucze).not.toContain('projekty.dni');
    expect([...(zakres.przetlumaczone_czesciowo['projekty.dni'] ?? [])].sort()).toEqual([...ZWERYFIKOWANE].sort());
    expect(ocz.odwolania).toContain('P-412');
    expect(ZWERYFIKOWANE.filter((j) => kluczeDni(j).length === 0)).toEqual([]);
  });
});
