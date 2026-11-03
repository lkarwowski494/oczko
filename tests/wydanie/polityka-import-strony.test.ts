// M1-audytor-generalny-072 (10-wydanie-006; 5.1.1(i)): import strony WWW jest w 1.0 (menu „Add pattern” → „Web page link…”, udostępnienie linku z Safari),
// a aplikacja otwiera wtedy wskazaną stronę w WKWebView bez ciasteczek użytkownika (modules/oczko-wzor/ios/KonwersjaNaPdf.swift, `.nonPersistent()`)
// i zapisuje ją jako PDF z adresem (src/przypadki-uzycia/wzor.ts). Polityka prywatności mówi o tym w obu językach.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const html = readFileSync(join(__dirname, '../../site/privacy.html'), 'utf8');
const sekcja = (jezyk: 'pl' | 'en') => /<section lang="(pl|en)"[^>]*>[\s\S]*?<\/section>/g[Symbol.match](html)?.find((s) => s.startsWith(`<section lang="${jezyk}"`)) ?? '';

test.each([
  ['pl', /strony WWW[^<]*raz otwiera tę stronę[^<]*bez Twoich ciasteczek[^<]*jako PDF[^<]*adres IP[^<]*Do twórcy aplikacji nic nie trafia/],
  ['en', /web page link[^<]*opens that page once[^<]*without your cookies[^<]*as a PDF[^<]*IP address[^<]*Nothing is sent to the developer/],
] as const)('polityka (%s): import strony WWW — jedno pobranie wskazanej strony, bez ciasteczek, PDF na urządzeniu, nic do twórcy', (jezyk, wzor) => {
  expect(sekcja(jezyk)).toMatch(wzor);
});
