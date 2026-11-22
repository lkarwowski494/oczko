// Strona statyczna atlasu z tych samych kart (ADR-0025, P-095): /<tag>/ i /<tag>/<technika>/ tylko dla języków z `jezyki_gotowe`,
// pełna lista hreflang (każda wersja wymienia siebie i pozostałe) + x-default na stronę wyboru języka, mapa strony; bez stron
// pojedynczych skrótów. Tekst wyłącznie ze słowników `t()` danego języka — brak tekstu = błąd (nie publikujemy szablonu bez treści).
// SVG wstawiony do HTML bez zmian (jeden plik na wszystkie języki, P-192); motyw ciemny przez klasy ról i prefers-color-scheme.
import { siatkaPetli } from './siatka-petli.ts';
import { doSvg, type Paleta } from './svg.ts';
import type { Karta } from './typy.ts';

export interface WejscieStrony {
  adres: string; // bezwzględny adres strony z ukośnikiem na końcu; pusty = błąd (ADR-0025: domena do decyzji właściciela)
  karty: Karta[];
  teksty: Record<string, Record<string, string>>; // tag → klucz → tekst
  palety: { jasny: Paleta; ciemny: Paleta };
  odnosnikSklepu?: string; // adres w App Store (rola 10, [DO USTALENIA]); brak = bez odnośnika
}
export interface WynikStrony { pliki: Record<string, string>; bledy: string[] }

const slug = (id: string) => id.replace(/\./g, '-').replace(/_/g, '-');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function zbudujStrone(w: WejscieStrony): WynikStrony {
  const bledy: string[] = [];
  if (!/^https:\/\/[^/]+\/(.*\/)?$/.test(w.adres)) return { pliki: {}, bledy: [`adres strony „${w.adres}” nie jest bezwzględnym https z „/” na końcu (ATLAS_ADRES, decyzja właściciela)`] };
  // publikowane: bez haseł skrótów (P-095) i bez kart „po-generatorze” (P-200)
  const karty = w.karty.filter((k) => k.rodzaj !== 'skrot' && k.publikacja !== 'po-generatorze');
  const jezyki = [...new Set(karty.flatMap((k) => k.jezyki_gotowe))].sort();
  const t = (j: string, klucz: string): string => {
    const v = w.teksty[j]?.[klucz];
    if (v === undefined || v === '') { bledy.push(`brak tekstu „${klucz}” w języku ${j}`); return ''; }
    return v;
  };
  const alternatywy = (wersje: [string, string][], xDefault: string) =>
    [...wersje.map(([j, u]) => `<link rel="alternate" hreflang="${j}" href="${w.adres}${u}">`), `<link rel="alternate" hreflang="x-default" href="${w.adres}${xDefault}">`].join('\n');
  const css = (p: { jasny: Paleta; ciemny: Paleta }) =>
    `<style>body{margin:0 auto;max-width:44rem;padding:1rem;font:1rem/1.5 system-ui,sans-serif;background:${p.jasny.tlo};color:${p.jasny.nitka}}svg{width:100%;max-width:32rem;height:auto}` +
    `@media (prefers-color-scheme:dark){body{background:${p.ciemny.tlo};color:${p.ciemny.nitka}}.a-t{fill:${p.ciemny.tlo}}.a-o{stroke:${p.ciemny.tlo}}.a-n{stroke:${p.ciemny.nitka}}` +
    `.a-z{stroke:${p.ciemny.wyroznienie}}.a-d,.a-s{stroke:${p.ciemny.drut}}polygon.a-d,polygon.a-s{fill:${p.ciemny.drut}}path.a-k{stroke:${p.ciemny.nitka}}circle.a-k{fill:${p.ciemny.tlo};stroke:${p.ciemny.nitka}}}</style>`;
  const strona = (j: string, tytul: string, alt: string, tresc: string) =>
    `<!doctype html>\n<html lang="${j}">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${esc(tytul)}</title>\n${alt}\n${css(w.palety)}\n</head>\n<body>\n${tresc}\n</body>\n</html>\n`;
  const pliki: Record<string, string> = {};

  for (const k of karty) {
    const wersje: [string, string][] = k.jezyki_gotowe.slice().sort().map((j) => [j, `${j}/${slug(k.id)}/`]);
    for (const j of k.jezyki_gotowe) {
      const kroki = (k.kroki ?? []).map((krok) => {
        const svg = k.rysunek?.rodzina === 'siatka-petli' && krok.faza !== null ? doSvg(siatkaPetli(k, krok), w.palety.jasny) : '';
        const obraz = svg ? `<div role="img" aria-label="${esc(t(j, k.klucze.opis_alt ?? ''))}">${svg}</div>` : '';
        return `<figure>${obraz}<figcaption>${esc(t(j, krok.klucz))}</figcaption></figure>`;
      });
      const sk = k.terminy[j]?.[0]?.skrot;
      const skrot = sk ? ` <abbr>${esc(sk)}</abbr>` : '';
      const tabela = k.rodzaj === 'tabela'
        ? `<table><tbody>${(k.pozycje ?? []).map((id) => w.karty.find((x) => x.id === id)).filter((x): x is Karta => !!x).map((x) => `<tr><td>${esc(x.terminy[j]?.[0]?.skrot ?? '')}</td><td>${esc(t(j, x.klucze.nazwa))}</td></tr>`).join('')}</tbody></table>`
        : '';
      const sklep = w.odnosnikSklepu ? `<p><a href="${esc(w.odnosnikSklepu)}">${esc(t(j, 'atlas.strona.sklep'))}</a></p>` : '';
      const tresc = `<p><a href="${w.adres}${j}/">${esc(t(j, 'atlas.strona.spis'))}</a></p>\n<h1>${esc(t(j, k.klucze.nazwa))}${skrot}</h1>\n${k.klucze.podpis ? `<p>${esc(t(j, k.klucze.podpis))}</p>` : ''}\n${(k.klucze_dodatkowe ?? []).map((x) => `<p>${esc(t(j, x))}</p>`).join('')}${tabela}${kroki.join('\n')}\n${sklep}`;
      pliki[`${j}/${slug(k.id)}/index.html`] = strona(j, t(j, k.klucze.nazwa), alternatywy(wersje, ''), tresc);
    }
  }
  for (const j of jezyki) {
    const wJezyku = karty.filter((k) => k.jezyki_gotowe.includes(j));
    const lista = wJezyku.map((k) => `<li><a href="${w.adres}${j}/${slug(k.id)}/">${esc(t(j, k.klucze.nazwa))}</a></li>`).join('');
    pliki[`${j}/index.html`] = strona(j, t(j, 'atlas.strona.tytul'), alternatywy(jezyki.map((x) => [x, `${x}/`]), ''), `<h1>${esc(t(j, 'atlas.strona.tytul'))}</h1>\n<ul>${lista}</ul>`);
  }
  // x-default: wybór języka; nazwa języka w jego własnym słowniku
  const wybor = jezyki.map((j) => `<li><a href="${w.adres}${j}/" hreflang="${j}" lang="${j}">${esc(t(j, 'atlas.strona.jezyk'))}</a></li>`).join('');
  pliki['index.html'] = strona('en', 'Atlas', alternatywy(jezyki.map((x) => [x, `${x}/`]), ''), `<ul>${wybor}</ul>`);
  const adresy = Object.keys(pliki).map((p) => `${w.adres}${p.replace(/index\.html$/, '')}`).sort();
  pliki['sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${adresy.map((u) => `<url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`;
  return { pliki: bledy.length ? {} : pliki, bledy: [...new Set(bledy)] };
}
