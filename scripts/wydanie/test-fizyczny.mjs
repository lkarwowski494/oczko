#!/usr/bin/env node
// Lista fizyczna właściciela: docs/wydanie/test-fizyczny.html z przypadków klasy F katalogu docs/jakosc/przypadki-uzycia.md (P-835, sesja BX 2026-11-15).
//   node scripts/wydanie/test-fizyczny.mjs           → zapisuje stronę
//   node scripts/wydanie/test-fizyczny.mjs --check   → kod 1, gdy strona różni się od katalogu (test tests/jakosc/przypadki-uzycia.test.ts)
// Wygląd: nagłówek i arkusz stylów (system „Dzianina”) brane dosłownie z docs/wydanie/instrukcja-testu-1171.html — jedno źródło stylu.
// Czas: SZACUNEK, nie pomiar — minuty kategorii (MIN_KAT, [OCENA]) + czekanie z kroku instrukcji (pole `czek`), każdy krok liczony raz.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const KATALOG = path.join(root, 'docs/jakosc/przypadki-uzycia.md');
const WZOR = path.join(root, 'docs/wydanie/instrukcja-testu-1171.html');
const WYJSCIE = path.join(root, 'docs/wydanie/test-fizyczny.html');
// Kolejność = kolejność pracy właściciela: instalacja, telefon w ręku, zegarek, iPad, na końcu to, co wymaga czekania albo drugiej osoby.
export const GRUPY = [
  ['TestFlight', 'Instalacja z TestFlight'], ['wibracje', 'Wibracje'], ['aparat', 'Aparat'], ['wrażenie', 'Wrażenie: czytelność, płynność, dźwięk'],
  ['ekran blokady', 'Ekran blokady'], ['zegarek', 'Apple Watch'], ['Pencil', 'Apple Pencil'], ['inne aplikacje', 'Inne aplikacje na urządzeniu'],
  ['system iOS', 'Ustawienia i zachowanie systemu'], ['sieć prawdziwa', 'Prawdziwa sieć'], ['sklep Apple', 'Zakup w piaskownicy Apple'],
];
export const MIN_KAT = { TestFlight: 5, wibracje: 1, aparat: 2, 'wrażenie': 2, 'ekran blokady': 3, zegarek: 3, Pencil: 2, 'inne aplikacje': 3, 'system iOS': 3, 'sieć prawdziwa': 2, 'sklep Apple': 4 };

export function przypadkiF(tekst) {
  const w = [];
  for (const l of tekst.split('\n')) {
    if (!/^\| PU-\d{3} \|/.test(l)) continue;
    const k = l.split('|').slice(1, -1).map((x) => x.trim());
    if (k[6] !== 'F') continue;
    const m = /^F: ([^—]+) — (.+)$/.exec(k[7]);
    if (!m) throw new Error(`${k[0]}: klasa F bez „F: <kategoria> — <powód>”`);
    w.push({ pu: k[0], cel: k[1], zrob: k[2], powinno: k[3], kroki: k[4] === '—' ? [] : k[4].split(',').map((x) => x.trim()), kat: m[1].trim(), powod: m[2].trim() });
  }
  return w;
}

export function zbuduj() {
  const wzor = fs.readFileSync(WZOR, 'utf8');
  const koniecStylu = wzor.indexOf('</style>');
  if (koniecStylu < 0) throw new Error('wzór bez </style>');
  const glowa = wzor.slice(0, koniecStylu + '</style>'.length).replace(/<title>[^<]*<\/title>/, '<title>Test fizyczny Oczka</title>');
  const i = wzor.indexOf('var DANE = ');
  const instrukcja = Object.fromEntries(JSON.parse(wzor.slice(i + 11, wzor.indexOf('\n', i)).replace(/;\s*$/, '')).kroki.map((k) => [k.id, k]));
  const f = przypadkiF(fs.readFileSync(KATALOG, 'utf8'));
  const nieznane = f.filter((p) => !(p.kat in MIN_KAT)).map((p) => `${p.pu}: ${p.kat}`);
  if (nieznane.length) throw new Error(`kategoria spoza listy: ${nieznane.join('; ')}`);
  const policzone = new Set();
  const kroki = f.map((p) => {
    let czek = 0;
    for (const id of p.kroki) if (!policzone.has(id)) { policzone.add(id); czek += instrukcja[id]?.czek ?? 0; }
    const urz = p.kat === 'zegarek' ? 'Watch + iPhone' : p.kat === 'Pencil' ? 'iPad' : (instrukcja[p.kroki[0]]?.urz ?? 'iPhone');
    return { pu: p.pu, kat: p.kat, urz, min: MIN_KAT[p.kat], czek, cel: p.cel, zrob: p.zrob, powinno: p.powinno, powod: p.powod, kroki: p.kroki };
  });
  const dane = { grupy: GRUPY.filter(([k]) => kroki.some((x) => x.kat === k)).map(([k, t]) => ({ kat: k, tytul: t })), kroki };
  const min = kroki.reduce((a, k) => a + k.min, 0), czek = kroki.reduce((a, k) => a + k.czek, 0);
  const cialo = `
<main class="str">
  <header class="glowa">
    <span class="etykieta">Oczko · test fizyczny · iPhone, Apple Watch, iPad</span>
    <h1>Test fizyczny Oczka</h1>
    <p class="pod">Tylko to, czego automat nie sprawdzi: instalacja z TestFlight, prawdziwy zegarek, wibracje, aparat, ekran blokady, zakup w piaskownicy i ocena okiem. Wszystko inne sprawdza zestaw przypadków użycia po każdym buildzie. Razem ${kroki.length} ${kroki.length === 1 ? 'pozycja' : 'pozycji'}, ok. ${min} min pracy${czek ? ` i ok. ${czek} min czekania` : ''} (szacunek).</p>
  </header>

  <div class="pole">
    <label for="build">Numer buildu, który testujesz (z TestFlight)</label>
    <input type="text" id="build" inputmode="numeric" autocomplete="off" value="">
  </div>

  <section class="zanim" aria-labelledby="h-zanim">
    <h2 id="h-zanim">Zanim zaczniesz</h2>
    <details class="blok" open>
      <summary>Jak czytać tę listę</summary>
      <div class="blok-tresc">
        <ul>
          <li>Napisy Oczka są po polsku; angielski odpowiednik stoi w nawiasie.</li>
          <li>Przy każdej pozycji zaznacz „Tak”, „Nie” albo „Pomiń”. W uwadze wpisz, co było inaczej.</li>
          <li>Numer PU prowadzi do katalogu przypadków użycia (<code>docs/jakosc/przypadki-uzycia.md</code>); numer T, Z albo G to krok dotychczasowej instrukcji testu.</li>
          <li>Na końcu stuknij „Kopiuj wynik” i wklej wiadomość koordynatorowi.</li>
        </ul>
      </div>
    </details>
  </section>

  <div id="lista"></div>

  <section class="wynik" aria-labelledby="h-wynik" id="wynik">
    <h2 id="h-wynik">Wynik dla koordynatora</h2>
    <p class="pod male" id="wynik-opis"></p>
    <div class="rzad">
      <button type="button" class="btn" id="kopiuj">Kopiuj wynik</button>
      <button type="button" class="btn drugi" id="pokaz">Pokaż tekst</button>
    </div>
    <p class="komunikat" id="komunikat" role="status" aria-live="polite"></p>
    <label for="tekst-wyniku" class="pod male" hidden id="et-tekst">Tekst wiadomości (zaznacz i skopiuj, jeśli przycisk nie zadziałał)</label>
    <textarea id="tekst-wyniku" readonly hidden></textarea>
    <div class="rzad">
      <button type="button" class="btn niszcz" id="wyczysc">Wyczyść zaznaczenia</button>
      <button type="button" class="btn niszcz" id="wyczysc-tak" hidden>Tak, wyczyść</button>
    </div>
  </section>
</main>

<div class="pasek" role="region" aria-label="Postęp">
  <div class="pasek-w">
    <div class="postep">
      <div class="postep-tekst" id="postep-tekst"></div>
      <div class="belka" aria-hidden="true"><i class="t" id="b-t"></i><i class="n" id="b-n"></i><i class="p" id="b-p"></i></div>
    </div>
    <button type="button" class="btn drugi" id="dalej">Dalej ↓</button>
    <button type="button" class="btn" id="kopiuj2">Kopiuj</button>
  </div>
</div>

<script>
(function () {
  var DANE = ${JSON.stringify(dane)};
  var KLUCZ = 'oczko-test-fizyczny', WYB = { tak: 'tak', nie: 'NIE', pomin: 'pominięte' };
  var stan = { build: '', odp: {} };
  try { var z = JSON.parse(localStorage.getItem(KLUCZ) || 'null'); if (z && z.odp) stan = z; } catch (e) { }
  function zapisz() { try { localStorage.setItem(KLUCZ, JSON.stringify(stan)); } catch (e) { } }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmt(t) { return esc(t).replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>').replace(/⟦([^⟧]*)⟧/g, '<span class="en">(„$1”)</span>'); }
  function urzKlasa(u) { return /iPad/.test(u) ? 'ipad' : /Watch/.test(u) ? 'watch' : ''; }
  function czas(min) { if (min < 60) return 'ok. ' + min + ' min'; var h = Math.floor(min / 60), m = min % 60; return 'ok. ' + h + ' h' + (m ? ' ' + m + ' min' : ''); }
  function rysujKrok(k) {
    var o = stan.odp[k.pu] || {};
    var h = '<article class="krok" id="k-' + k.pu + '" data-id="' + k.pu + '"' + (o.w ? ' data-stan="' + o.w + '"' : '') + '>';
    h += '<div class="krok-glowa"><span class="id">' + k.pu + '</span><span class="chip ' + urzKlasa(k.urz) + '">' + esc(k.urz) + '</span>';
    if (k.kroki.length) h += '<span class="chip">' + esc(k.kroki.join(', ')) + '</span>';
    h += '<span class="czas">' + k.min + ' min' + (k.czek ? ' + ' + k.czek + ' min czekania' : '') + '</span></div>';
    h += '<p class="temat">' + fmt(k.cel) + '</p>';
    h += '<h4>Zrób</h4><p>' + fmt(k.zrob) + '</p>';
    h += '<h4>Powinno być</h4><p class="powinno">' + fmt(k.powinno) + '</p>';
    h += '<details><summary>Dlaczego ręcznie</summary><p>' + fmt(k.powod) + '</p></details>';
    h += '<div class="odp" role="group" aria-label="Wynik ' + k.pu + '">';
    [['tak', 'Tak'], ['nie', 'Nie'], ['pomin', 'Pomiń']].forEach(function (p) { h += '<button type="button" data-w="' + p[0] + '" aria-pressed="' + (o.w === p[0]) + '">' + p[1] + '</button>'; });
    h += '</div><div class="pole uwaga-pole"><label for="u-' + k.pu + '">Uwaga do ' + k.pu + '</label>';
    h += '<textarea id="u-' + k.pu + '" rows="1" placeholder="co jest inaczej albo powód pominięcia">' + esc(o.u || '') + '</textarea></div>';
    return h + '</article>';
  }
  function rysuj() {
    var h = '';
    DANE.grupy.forEach(function (g) {
      var kr = DANE.kroki.filter(function (k) { return k.kat === g.kat; });
      var m = kr.reduce(function (a, k) { return a + k.min + k.czek; }, 0);
      h += '<section class="sekcja"><div class="sekcja-glowa"><h3>' + esc(g.tytul) + '</h3><span class="pod male">' + kr.length + (kr.length === 1 ? ' pozycja' : ' poz.') + ' · ' + czas(m) + '</span></div>';
      h += kr.map(rysujKrok).join('') + '</section>';
    });
    document.getElementById('lista').innerHTML = h;
    postep();
  }
  function postep() {
    var n = DANE.kroki.length, l = { tak: 0, nie: 0, pomin: 0 };
    DANE.kroki.forEach(function (k) { var o = stan.odp[k.pu]; if (o && o.w) l[o.w]++; });
    var z = l.tak + l.nie + l.pomin;
    document.getElementById('postep-tekst').textContent = z + ' z ' + n + (l.nie ? ' · nie: ' + l.nie : '');
    document.getElementById('b-t').style.width = (100 * l.tak / n) + '%';
    document.getElementById('b-n').style.width = (100 * l.nie / n) + '%';
    document.getElementById('b-p').style.width = (100 * l.pomin / n) + '%';
    document.getElementById('wynik-opis').textContent = 'Zaznaczone ' + z + ' z ' + n + '. Wiadomość zawiera tylko numery pozycji, wynik i Twoje uwagi.';
  }
  function tekstWyniku() {
    var czesci = [], brak = [];
    DANE.kroki.forEach(function (k) {
      var o = stan.odp[k.pu] || {};
      if (!o.w) { brak.push(k.pu); return; }
      var u = (o.u || '').replace(/\\s+/g, ' ').trim();
      czesci.push(k.pu + ' ' + WYB[o.w] + (u ? ' — ' + u : ''));
    });
    var d = new Date(), dz = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    var w = 'Test fizyczny Oczka · build ' + ((stan.build || '').trim() || '?') + ' · ' + dz + '\\n' + (czesci.length ? czesci.join('; ') : 'Brak zaznaczonych pozycji.');
    if (brak.length) w += '\\nBez odpowiedzi (' + brak.length + '): ' + brak.join(', ');
    return w;
  }
  function pokazTekst(t) { var ta = document.getElementById('tekst-wyniku'); ta.value = t; ta.hidden = false; document.getElementById('et-tekst').hidden = false; return ta; }
  function kopiuj() {
    var t = tekstWyniku(), kom = document.getElementById('komunikat');
    function zapas() { var ta = pokazTekst(t); ta.focus(); ta.select(); kom.textContent = 'Tekst jest zaznaczony poniżej — skopiuj go ręcznie.'; }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { pokazTekst(t); kom.textContent = 'Skopiowano. Wklej wiadomość koordynatorowi.'; }, zapas);
      else zapas();
    } catch (e) { zapas(); }
    document.getElementById('wynik').scrollIntoView({ block: 'start' });
  }
  var lista = document.getElementById('lista');
  lista.addEventListener('click', function (e) {
    var b = e.target.closest('.odp button'); if (!b) return;
    var art = b.closest('article.krok'), id = art.dataset.id, w = b.dataset.w, o = stan.odp[id] || (stan.odp[id] = {});
    o.w = o.w === w ? '' : w;
    if (o.w) art.dataset.stan = o.w; else art.removeAttribute('data-stan');
    art.querySelectorAll('.odp button').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.w === o.w)); });
    zapisz(); postep();
  });
  lista.addEventListener('input', function (e) {
    if (e.target.tagName !== 'TEXTAREA') return;
    var id = e.target.closest('article.krok').dataset.id; (stan.odp[id] || (stan.odp[id] = {})).u = e.target.value; zapisz();
  });
  var build = document.getElementById('build'); build.value = stan.build || '';
  build.addEventListener('input', function () { stan.build = build.value; zapisz(); });
  document.getElementById('kopiuj').addEventListener('click', kopiuj);
  document.getElementById('kopiuj2').addEventListener('click', kopiuj);
  document.getElementById('pokaz').addEventListener('click', function () { pokazTekst(tekstWyniku()); });
  document.getElementById('dalej').addEventListener('click', function () {
    var k = DANE.kroki.filter(function (x) { return !(stan.odp[x.pu] || {}).w; })[0];
    (k ? document.getElementById('k-' + k.pu) : document.getElementById('wynik')).scrollIntoView({ block: 'start', behavior: 'smooth' });
  });
  var wyczysc = document.getElementById('wyczysc'), tak = document.getElementById('wyczysc-tak');
  wyczysc.addEventListener('click', function () { tak.hidden = !tak.hidden; });
  tak.addEventListener('click', function () { stan.odp = {}; zapisz(); tak.hidden = true; rysuj(); document.getElementById('komunikat').textContent = 'Zaznaczenia wyczyszczone.'; });
  rysuj();
})();
</script>
`;
  return { html: glowa + '\n' + cialo, kroki, min, czek };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { html, kroki, min, czek } = zbuduj();
  if (process.argv.includes('--check')) {
    const jest = fs.existsSync(WYJSCIE) ? fs.readFileSync(WYJSCIE, 'utf8') : '';
    if (jest !== html) { console.error('docs/wydanie/test-fizyczny.html różni się od katalogu — uruchom: node scripts/wydanie/test-fizyczny.mjs'); process.exit(1); }
    console.log(`test-fizyczny.html zgodny z katalogiem (${kroki.length} pozycji)`);
  } else {
    fs.writeFileSync(WYJSCIE, html);
    console.log(`test-fizyczny.html: ${kroki.length} pozycji klasy F, ok. ${min} min pracy + ${czek} min czekania (szacunek)`);
  }
}
