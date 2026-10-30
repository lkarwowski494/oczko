/* P-307/09: liczba przy rzeczowniku liczącym („{{wartosc}} rows”, „{{rzedy}} of {{cel}} rows”, „{{limit}} free crafting days”) musi stać w kluczu liczby mnogiej
 * (`_one`/`_other` w en, formy CLDR w innych językach), inaczej w pl/ru/cs (i innych) odmiana wychodzi błędna. Tekst klucza liczby mnogiej może mieć
 * dalej sformatowane parametry (np. {{p}}); formę wybiera `count` podany przy wywołaniu. Skrót jednostki (h, min, MB) i „Row {{n}}” (numer, nie ilość) nie podlegają. */
import * as fs from 'fs';
import * as path from 'path';

const en = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'src/i18n/slowniki/en.json'), 'utf8')) as Record<string, unknown>;
const plaski = (o: Record<string, unknown>, p = ''): [string, string][] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' && v !== null ? plaski(v as Record<string, unknown>, p ? `${p}.${k}` : k) : [[p ? `${p}.${k}` : k, String(v)] as [string, string]]));
const FORMA = /_(zero|one|two|few|many|other)$/;
const RZECZOWNIK = '(?:rows?|stitch(?:es)?|days?|parts?|patterns?|photos?|projects?|items?|pages?|skeins?|balls?|yards?)';
// liczba z parametru (nie count) [„of” drugi parametr] [do dwóch przymiotników] rzeczownik liczący
const LICZBA_PRZY_RZECZOWNIKU = new RegExp(`\\{\\{\\s*(?!count\\b)\\w+\\s*\\}\\}(?:\\s+of\\s+\\{\\{\\s*\\w+\\s*\\}\\})?(?:\\s+(?:free|crafting|more|new)){0,2}\\s+${RZECZOWNIK}\\b`, 'i');

test('P-307: żaden klucz bez form liczby mnogiej nie ma {{liczby}} przy rzeczowniku liczącym', () => {
  const zle = plaski(en).filter(([k, v]) => !FORMA.test(k) && LICZBA_PRZY_RZECZOWNIKU.test(v)).map(([k]) => k);
  expect(zle).toEqual([]);
});

test('P-307: każdy klucz liczby mnogiej ma obie formy en (_one i _other), a zamiennik tej samej bazy nie istnieje bez form', () => {
  const klucze = plaski(en).map(([k]) => k);
  const bazy = new Set(klucze.filter((k) => FORMA.test(k)).map((k) => k.replace(FORMA, '')));
  const braki = [...bazy].filter((b) => !klucze.includes(`${b}_one`) || !klucze.includes(`${b}_other`));
  expect(braki).toEqual([]);
  expect([...bazy].filter((b) => klucze.includes(b))).toEqual([]);
});
