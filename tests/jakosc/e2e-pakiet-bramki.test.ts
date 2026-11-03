/* Kontrakt tagów pakietu bramki E2E (tag `podstawowy`; bramka TestFlight, P-091 9a) — M1-audytor-generalny-047, 07-jakosc-008.
 * DEC-08 (a) (wybór właściciela P-418, plan zatwierdzony P-430): scenariusze danych 10 (NFR-DAN-002), 11 (BR-DAN-001/S1) i 36 (BR-DAN-008/S1,
 * P-198 Q3a) w pakiecie podstawowym → 13 scenariuszy. Trwała kontrola (mechanizm 008: awans do bramki robiony ręcznie, bez listy):
 * scenariusz z ID blokera wydania (`docs/brd/README.md`, „Blokery wydania”) jest w pakiecie albo na liście wyjątków nazwanych niżej. */
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';

const root = path.join(__dirname, '..', '..');
const katalog = path.join(root, 'e2e/scenariusze');
const skrypt = path.join(root, 'scripts/ci/e2e-czesci.mjs');
const scenariusze = () => fs.readdirSync(katalog).filter(f => /^\d\d-.*\.yaml$/.test(f)).sort();
const tagi = (f: string): string[] => {
  const naglowek = fs.readFileSync(path.join(katalog, f), 'utf8').split(/^---$/m)[0];
  const blok = naglowek.match(/^tags:\n((?:[ \t]+- .*\n?)*)/m);
  return blok ? [...blok[1].matchAll(/^[ \t]+- (\S+)/gm)].map(m => m[1]) : [];
};
const wPakiecie = (f: string) => tagi(f).includes('podstawowy');

/** DEC-08 (a): 01–09 (P-091 9a), 33 (P-198 Q3a, P-255), 10, 11, 36 (DEC-08 a). */
const PAKIET_DEC08 = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '33', '36'];

/** ID blokerów wydania z BRD; zakres „BR-KAL-001–BR-KAL-008” rozwinięty. */
function blokeryBrd(): Set<string> {
  const tekst = fs.readFileSync(path.join(root, 'docs/brd/README.md'), 'utf8');
  const sekcja = tekst.split(/^## Blokery wydania$/m)[1]?.split(/^## /m)[0] ?? '';
  const ids = new Set<string>();
  for (const m of sekcja.matchAll(/\b(BR|NFR)-([A-Z]{3})-(\d{3})(?:–\1-\2-(\d{3}))?/g)) {
    const od = Number(m[3]), doN = m[4] ? Number(m[4]) : od;
    for (let i = od; i <= doN; i++) ids.add(`${m[1]}-${m[2]}-${String(i).padStart(3, '0')}`);
  }
  return ids;
}
const idBlokera = (tag: string) => tag.replace(/-S\d+$/, '');

/** Wyjątki nazwane: scenariusz blokera poza pakietem. Awans do bramki = osobna decyzja po pierwszym zielonym przebiegu (zasada roli 07 nr 8,
 * P-198 Q3a); DEC-08 (a) objęła tylko 10, 11 i 36. iPad: osobny pakiet (P-225 Q1a). Nowy scenariusz blokera bez tagu czerwieni ten test,
 * dopóki ktoś nie dopisze go tu z powodem albo nie nada mu tagu `podstawowy`. */
const INFORMACYJNY = 'informacyjny; awans do `podstawowy` = osobna decyzja po pierwszym zielonym (zasada roli 07 nr 8), poza DEC-08 (a)';
const IPAD = 'pakiet iPada (tag `ipad`, P-225 Q1a), poza pakietem iPhone\'a';
const WYJATKI: Record<string, string> = {
  '12-br-zak-006-s4-bez-oferty-w-pracy.yaml': INFORMACYJNY,
  '21-br-wzr-001-s1-pdf-z-plikow.yaml': INFORMACYJNY,
  '22-br-wzr-002-s1-zdjecie-strony.yaml': INFORMACYJNY,
  '23-br-wzr-005-s1-poziomo-na-stojaku.yaml': INFORMACYJNY,
  '24-br-wzr-007-s1-strona-www-bez-sieci.yaml': INFORMACYJNY,
  '25-br-wzr-007-s2-plik-word.yaml': INFORMACYJNY,
  '26-br-wzr-008-s1-zakreslenie.yaml': INFORMACYJNY,
  '27-br-wzr-008-s3-przewijanie-bez-zakreslacza.yaml': INFORMACYJNY,
  '41-br-kal-003-s1-probka-w-calach.yaml': INFORMACYJNY,
  '44-br-wzr-005-s2-ipad-poziomo-pionowo.yaml': IPAD,
  '45-br-wzr-005-s3-obrot-strona-licznik.yaml': INFORMACYJNY,
  '46-br-wzr-005-s4-waskie-okno.yaml': IPAD,
  '47-br-wzr-008-s4-ipad-bez-rysika.yaml': IPAD,
  '48-br-dan-002-s3-icloud-wylaczony.yaml': INFORMACYJNY,
  '49-nfr-dan-003-konflikt-icloud.yaml': INFORMACYJNY,
  '62-br-wzr-003-s1-znacznik-idzie-z-licznikiem.yaml': INFORMACYJNY,
  '66-br-dan-006-s3-zastap-kopia-przed.yaml': INFORMACYJNY,
  '68-br-zak-004-s1-polityka-prywatnosci-w-ustawieniach.yaml': INFORMACYJNY, // 07 dla 002 (P-435), nowy
};

describe('kontrakt pakietu bramki E2E (M1-audytor-generalny-047; 07-jakosc-008; DEC-08 a)', () => {
  test('DEC-08 (a): tag `podstawowy` mają dokładnie 01–11, 33 i 36 (13 scenariuszy)', () => {
    const pakiet = scenariusze().filter(wPakiecie).map(f => f.slice(0, 2));
    expect(pakiet).toEqual(PAKIET_DEC08);
  });

  test('plan części (`e2e-czesci.mjs plan-podstawowy`, ten sam co `--plan`) ma w bramce 13 scenariuszy, w tym 10, 11 i 36', () => {
    const plan = JSON.parse(execFileSync('node', [skrypt, 'plan-podstawowy'], { encoding: 'utf8', env: { ...process.env, ONLY: '', PAKIET: '', COMMIT_MSG: '' } })) as { files: string[]; osobne: string[] }[];
    const pliki = plan.flatMap(c => [...c.files, ...c.osobne]).map(f => f.slice(0, 2)).sort();
    expect(pliki).toEqual(PAKIET_DEC08);
  });

  test('scenariusze danych 10, 11, 36 nie są ponawiane (tag `stan-licznika`, P-091 9a)', () => {
    for (const nr of ['10', '11', '36']) {
      const f = scenariusze().find(s => s.startsWith(`${nr}-`))!;
      expect({ f, stanLicznika: tagi(f).includes('stan-licznika') }).toEqual({ f, stanLicznika: true });
    }
  });

  test('BRD „Blokery wydania”: scenariusz z ID blokera jest w pakiecie albo w wyjątkach nazwanych', () => {
    const blokery = blokeryBrd();
    expect(blokery.has('NFR-DAN-002')).toBe(true); /* lista nie jest pusta: pusta sekcja nie może dać zielonego */
    expect(blokery.has('BR-DAN-001')).toBe(true);
    expect(blokery.has('BR-KAL-008')).toBe(true); /* zakres rozwinięty */
    const bezBramki = scenariusze()
      .filter(f => tagi(f).some(t => blokery.has(idBlokera(t))))
      .filter(f => !wPakiecie(f) && !(f in WYJATKI));
    expect(bezBramki).toEqual([]);
  });

  test('wyjątki nie są martwe: każdy istnieje, niesie ID blokera, jest poza pakietem i ma powód', () => {
    const blokery = blokeryBrd(); const pliki = new Set(scenariusze());
    for (const [f, powod] of Object.entries(WYJATKI)) {
      const stan = { f, istnieje: pliki.has(f), bloker: pliki.has(f) && tagi(f).some(t => blokery.has(idBlokera(t))), poza: pliki.has(f) && !wPakiecie(f), powod: powod.length > 20 };
      expect(stan).toEqual({ f, istnieje: true, bloker: true, poza: true, powod: true });
    }
  });
});
