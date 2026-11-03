#!/usr/bin/env node
// Przyjęcie artefaktu `raport-metadane` (scripts/i18n/przeklad-metadane.mjs, P-501) do repozytorium: <kod ASC>.store.json w docs/wydanie/metadane/ + przeklad-stan.json.
// Przed zapisem pełna kontrola wpisu (limity Apple, struktura opisu, liczby i zakazane słowa ze źródła, adresy apps4brew, title = nazwy.store.json). Poprawki krytyka nakładane po kontroli każdej z osobna.
// --przepakuj: słowa kluczowe pakowane ponownie wg bieżących reguł z tego, co raport zachował (przyjęte, potem pominięte w kolejności; surowa lista modelu nie jest w raporcie) — po poprawce reguły pakowania, bez nowego przebiegu API (P-510).
// Lokalizacja z błędem w raporcie albo z nieprawidłowym wpisem NIE jest zapisywana (kod 1), reszta tak. Nie dotyka en.store.json ani nazwy.store.json; nic nie wysyła.
// Użycie: node scripts/i18n/przeklad-metadane-przyjmij.mjs --raport <katalog artefaktu> [--korzen <repo>] [--bez-krytyka] [--przepakuj] [--nadpisz] [<kod ASC>…]   (bez kodów: wszystkie <kod>.json z raportu)
// Kody wyjścia: 0 ok, 1 lokalizacja odrzucona, 2 konfiguracja (zły kod, istniejący plik bez --nadpisz, brak raportu).
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOKALIZACJE, MET, wczytajKontekst, zloz, sprawdzWpis, pakujSlowa } from './przeklad-metadane.mjs';

export function przyjmij(argv, { log = console.log } = {}) {
  const o = { raport: null, korzen: fileURLToPath(new URL('../..', import.meta.url)), bezKrytyka: false, przepakuj: false, nadpisz: false, kody: [] };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === '--raport') o.raport = argv[++i]; else if (x === '--korzen') o.korzen = argv[++i]; else if (x === '--bez-krytyka') o.bezKrytyka = true; else if (x === '--przepakuj') o.przepakuj = true; else if (x === '--nadpisz') o.nadpisz = true;
    else if (x.startsWith('--')) { log(`BŁĄD: nieznany argument ${x}`); return 2; } else o.kody.push(x);
  }
  if (!o.raport || !existsSync(o.raport)) { log('BŁĄD: podaj --raport <katalog artefaktu raport-metadane>'); return 2; }
  const kody = o.kody.length ? o.kody : readdirSync(o.raport).filter((f) => /\.json$/.test(f) && f !== 'szacunek.json').map((f) => f.replace(/\.json$/, '')).filter((k) => LOKALIZACJE.includes(k));
  const zle = kody.filter((k) => !LOKALIZACJE.includes(k));
  if (zle.length) { log(`BŁĄD: kody spoza listy ${LOKALIZACJE.length} lokalizacji do uzupełnienia: ${zle.join(', ')} (en-* i nazwy: osobne pliki)`); return 2; }
  const met = join(resolve(o.korzen), MET), istnieje = kody.filter((k) => existsSync(join(met, `${k}.store.json`)));
  if (istnieje.length && !o.nadpisz) { log(`BŁĄD: pliki już istnieją (${istnieje.join(', ')}); użyj --nadpisz po decyzji`); return 2; }
  const ctx = wczytajKontekst(resolve(o.korzen)), stanPlik = join(met, 'przeklad-stan.json');
  const stan = existsSync(stanPlik) ? JSON.parse(readFileSync(stanPlik, 'utf8')) : { wymagane: LOKALIZACJE, przyjete: {}, oczekujace: [...LOKALIZACJE] };
  let kod = 0;
  for (const k of kody) {
    const f = join(o.raport, `${k}.json`);
    if (!existsSync(f)) { log(`${k}: brak ${f}`); kod = 1; continue; }
    const r = JSON.parse(readFileSync(f, 'utf8')), p = r.propozycja;
    if (r.blad || !p || !p.subtitle || !p.promoText || !p.description || !p.slowa?.length) { log(`${k}: odrzucona — ${r.blad ?? 'brak pól propozycji'}${r.odrzucone?.length ? ` (odrzucone pola: ${r.odrzucone.map((x) => `${x.pole}: ${x.powod}`).join(' | ')})` : ''}`); kod = 1; continue; }
    if (o.przepakuj && !ctx.stale[k] && p.pominiete?.length) {
      const sl = pakujSlowa([...p.slowa, ...p.pominiete.map((x) => x.slowo)], { tytul: ctx.nazwy[k].title, podtytul: p.subtitle });
      if (sl.slowa.length) { p.slowa = sl.slowa; p.bajty = sl.bajty; p.pominiete = sl.pominiete; }
    }
    const poprawki = o.bezKrytyka ? [] : (r.krytyk?.poprawki ?? []), wpis = zloz(k, ctx, p, poprawki), problemy = sprawdzWpis(k, wpis.apple.info[k], ctx);
    if (problemy.length) { log(`${k}: odrzucona — ${problemy.join(' | ')}`); kod = 1; continue; }
    writeFileSync(join(met, `${k}.store.json`), JSON.stringify(wpis, null, 2) + '\n');
    stan.przyjete[k] = { data: new Date().toISOString().slice(0, 10), partia: r.meta?.batch1 ?? null, model: r.meta?.model ?? null, poprawek_krytyka: poprawki.length };
    log(`${k}: przyjęta (${poprawki.length} poprawek krytyka, słów ${wpis.apple.info[k].keywords.length})`);
  }
  stan.wymagane = LOKALIZACJE; stan.oczekujace = LOKALIZACJE.filter((k) => !(k in stan.przyjete));
  writeFileSync(stanPlik, JSON.stringify(stan, null, 2) + '\n');
  log(`stan: przyjęte ${Object.keys(stan.przyjete).length}, oczekujące ${stan.oczekujace.length}`);
  return kod;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) process.exitCode = przyjmij(process.argv.slice(2));
