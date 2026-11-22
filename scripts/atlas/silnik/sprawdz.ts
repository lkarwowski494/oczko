// Sprawdzenie rysunku kroku (testy geometrii, ADR-0022 „Potwierdzenie”). Wzór: walidator kontraktu figur Treningu — kod błędu + konkretne
// miejsce, żeby poprawka (człowieka albo generatora danych) trafiła w punkt. Wynik pusty = rysunek poprawny.
import { odleglosc, probkuj, przeciecia } from './geometria.ts';
import { regula, regulaDrutu, siatkaPetli } from './siatka-petli.ts';
import { doSvg, kryje, latki, straznikLiter, type Paleta } from './svg.ts';
import type { Karta, Krok, Rysunek } from './typy.ts';

export interface Blad { kod: string; szczegol: string }

const kat = (ax: number, ay: number, bx: number, by: number) => Math.abs(Math.atan2(ax * by - ay * bx, ax * bx + ay * by));

/** Kontrast WCAG 2.x (stosunek luminancji) dwóch kolorów #RRGGBB. */
export function kontrast(a: string, b: string): number {
  const lum = (h: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

export function sprawdzRysunek(karta: Karta, krok: Krok, rys: Rysunek, palety: Paleta[]): Blad[] {
  const b: Blad[] = [];
  const dodaj = (kod: string, szczegol: string) => b.push({ kod, szczegol });
  for (const e of rys.bledy) dodaj('budowa', e);
  const czesc = new Map(rys.czesci.map((c) => [c.id, c]));
  const petla = new Map(rys.petle.map((p) => [p.id, p]));

  // 1. Ciągłość nitki: w każdym rzędzie koniec części = początek następnej, styczna bez załamania (< 1°).
  rys.rzedy.forEach((ids, r) => {
    for (let i = 0; i < ids.length - 1; i++) {
      const A = czesc.get(ids[i])!.segmenty, B = czesc.get(ids[i + 1])!.segmenty;
      const a = A[A.length - 1], c = B[0];
      if (odleglosc(a[3], c[0]) > 1e-6) dodaj('ciaglosc', `rząd ${r}: przerwa ${odleglosc(a[3], c[0]).toFixed(3)} między ${ids[i]} a ${ids[i + 1]}`);
      const k = kat(a[3].x - a[2].x, a[3].y - a[2].y, c[1].x - c[0].x, c[1].y - c[0].y);
      if (k > Math.PI / 180) dodaj('ciaglosc', `rząd ${r}: załamanie ${(k * 180 / Math.PI).toFixed(1)}° między ${ids[i]} a ${ids[i + 1]}`);
    }
  });

  // 2. Przeplot: (a) część „nad” każdego skrzyżowania zgodna z regułą liczoną od nowa; (b) w punkcie skrzyżowania ostatnia
  //    narysowana łatka należy do części „nad” (inna łatka położona później nie zasłania skrzyżowania).
  const drut = czesc.get('drut');
  for (const x of rys.skrzyzowania) {
    let oczek: string;
    if (x.a === 'drut' || x.b === 'drut') {
      const inna = x.a === 'drut' ? x.b : x.a;
      const petlaId = inna.split('.')[0];
      const ogon = drut!.segmenty[0][0];
      const tejPetli = rys.skrzyzowania.filter((y) => (y.a === 'drut' || y.b === 'drut') && (y.a === 'drut' ? y.b : y.a).startsWith(`${petlaId}.`)).sort((p, q) => odleglosc(p.punkt, ogon) - odleglosc(q.punkt, ogon));
      oczek = regulaDrutu(krok.kierunek, tejPetli.indexOf(x) === 0 ? 0 : 1, inna);
    } else oczek = regula(czesc.get(x.a)!, czesc.get(x.b)!, petla, rys.scalenia);
    if (x.nad !== oczek) dodaj('przeplot', `skrzyżowanie ${x.a} × ${x.b} w (${x.punkt.x.toFixed(1)}, ${x.punkt.y.toFixed(1)}): na wierzchu ${x.nad}, reguła daje ${oczek}`);
  }
  const lt = latki(rys);
  for (const c of lt.cykl) dodaj('przeplot', `skrzyżowania za blisko siebie (łatki zasłaniają się nawzajem): ${c}`);
  for (const x of rys.skrzyzowania) {
    const kryjace = lt.lista.filter((l) => kryje(l.lamana, x.punkt));
    const ostatnia = kryjace[kryjace.length - 1];
    if (!ostatnia || ostatnia.czesc !== x.nad) dodaj('przeplot', `w (${x.punkt.x.toFixed(1)}, ${x.punkt.y.toFixed(1)}) na wierzchu rysuje się ${ostatnia?.czesc ?? 'nic'}, ma ${x.nad}`);
  }

  // 3. Liczba oczek i topologia: rodzice w rzędzie niżej, każda pętla poniżej najwyższego rzędu ma dokładnie jedno dziecko.
  const op = karta.rysunek?.operacja;
  const N = karta.rysunek!.probka!.kolumny;
  const rzedy = Math.max(...rys.petle.map((p) => p.rzad)) + 1;
  for (let r = 0; r < rzedy; r++) {
    const ile = rys.petle.filter((p) => p.rzad === r).length;
    const opRzad = krok.faza !== 'tkanina' && krok.faza !== 'wklucie' && op && r === karta.rysunek!.probka!.rzedy;
    const oczekiwane = opRzad && op.typ === 'scal' ? N - op.zuzywa + 1 : N;
    if (ile !== oczekiwane) dodaj('liczba-oczek', `rząd ${r}: ${ile} oczek, oczekiwane ${oczekiwane}`);
  }
  for (const p of rys.petle) {
    for (const id of p.rodzice) if (petla.get(id)?.rzad !== p.rzad - 1) dodaj('topologia', `${p.id}: rodzic ${id} nie jest w rzędzie niżej`);
    if (p.rzad > 0 && p.rodzice.length === 0) dodaj('topologia', `${p.id}: brak rodzica`);
    if (p.rzad < rzedy - 1) {
      const dzieci = rys.petle.filter((q) => q.rodzice.includes(p.id));
      if (dzieci.length !== 1) dodaj('topologia', `${p.id}: ${dzieci.length} dzieci, oczekiwane 1`);
    }
  }

  // 4. Przeplot rzeczywisty: głowa każdego rodzica przecina obie nóżki dziecka (pętla jest przeciągnięta, nie tylko narysowana obok).
  for (const p of rys.petle) {
    for (const rid of p.rodzice) {
      const glowa = czesc.get(`${rid}.glowa`);
      if (!glowa) continue;
      for (const noga of ['noga_l', 'noga_p'] as const) {
        const n = czesc.get(`${p.id}.${noga}`)!;
        if (przeciecia(probkuj(glowa.segmenty), probkuj(n.segmenty)).length < 1) dodaj('obejmowanie', `głowa ${rid} nie obejmuje ${noga} pętli ${p.id}`);
      }
    }
  }

  // 5. Zgodność z twierdzeniami karty (wartości roli 06): bilans oczek i kierunek pochylenia ujęcia.
  if (krok.faza === 'wynik' && op?.typ === 'scal') {
    // silnik liczy bilans i pochylenie z operacji (odpowiedź na pytanie 06 nr 5); twierdzenie, jeśli karta je ma, musi się zgadzać
    const tw = karta.twierdzenia.map((t) => t.wartosc);
    const bilansTw = tw.find((w) => 'bilans' in w)?.bilans;
    const bilans = rys.petle.filter((p) => p.rzad === rzedy - 1).length - N;
    if (bilansTw !== undefined && bilans !== bilansTw) dodaj('twierdzenie', `bilans rysunku ${bilans}, twierdzenie ${bilansTw}`);
    const pochTw = tw.find((w) => 'pochylenie' in w)?.pochylenie;
    const s = rys.scalenia[0];
    const nach = s ? petla.get(s.nad)!.nachylenie : 0;
    const poch = nach > 0 ? 'prawo' : nach < 0 ? 'lewo' : op.na_wierzchu === 'srodkowe' ? 'srodek' : 'brak';
    if (pochTw !== undefined && poch !== pochTw) dodaj('twierdzenie', `pochylenie rysunku „${poch}” (pętla na wierzchu ${s?.nad}), twierdzenie „${pochTw}”`);
    // pętla na wierzchu naprawdę leży na wierzchu tam, gdzie krzyżuje się z ujmowaną
    if (s && !rys.skrzyzowania.some((x) => x.nad.startsWith(`${s.nad}.`) && s.pod.some((pid) => (x.nad === x.a ? x.b : x.a).startsWith(`${pid}.`)))) dodaj('przeplot', `ujęcie: brak skrzyżowania, na którym ${s.nad} leży na ${s.pod.join(', ')}`);
  }

  // 5a. Kierunek wkłucia z twierdzenia a strona pętli na rysunku — założenie silnika A-1 (nazwane, e2-moduly-dane.md §3): nowa pętla
  //     przechodzi przez starą przeciwnie do wkłucia, więc wkłucie „od_przodu” daje pętlę prawą, „od_tylu” lewą. Źródła 06 mówią
  //     o kierunku wkłucia (ATL-K-001, ATL-K-005), nie o kierunku przeciągania (odpowiedź 06 na Z-06-01).
  const kierTw = karta.twierdzenia.map((t) => t.wartosc).find((w) => 'kierunek' in w)?.kierunek;
  if (kierTw !== undefined && op && (op.typ === 'oczko' || op.typ === 'scal')) {
    const oczek = op.strona === 'prawe' ? 'od_przodu' : 'od_tylu';
    if (kierTw !== oczek) dodaj('twierdzenie', `pętla „${op.strona}” wymaga wkłucia „${oczek}” (A-1), twierdzenie „${kierTw}”`);
  }
  if (krok.kierunek && kierTw !== undefined && krok.kierunek !== kierTw) dodaj('twierdzenie', `kierunek kroku „${krok.kierunek}”, twierdzenie „${kierTw}”`);

  // 6. Wkłucie: drut przechodzi przez każdą pętlę z `petle` (2 skrzyżowania, jedno nad, jedno pod) i nie dotyka innych pętli (błędy budowy).
  if (krok.faza === 'wklucie') {
    for (const m of krok.petle) {
      const id = `p${m.rzad}_${m.kolumna}`;
      const s = rys.skrzyzowania.filter((x) => x.a === 'drut' && x.b.startsWith(`${id}.`));
      if (s.length !== 2 || s.filter((x) => x.nad === 'drut').length !== 1) dodaj('wklucie', `drut nie przechodzi przez pętlę ${id} (skrzyżowań ${s.length}, drut na wierzchu ${s.filter((x) => x.nad === 'drut').length} razy)`);
    }
    if (!rys.czesci.some((c) => c.rodzaj === 'drut')) dodaj('wklucie', 'brak drutu w fazie „wklucie”');
  }
  if (krok.strzalka && !rys.strzalka) dodaj('strzalka', 'strzałka kroku bez kotwic w rysunku');

  // 7. Wyróżnienie, strażnik liter i kontrast w każdej palecie.
  for (const m of krok.wyroznij) if (!petla.has(`p${m.rzad}_${m.kolumna}`)) dodaj('wyroznienie', `brak pętli rząd ${m.rzad} kolumna ${m.kolumna}`);
  for (const pal of palety) {
    for (const e of straznikLiter(doSvg(rys, pal))) dodaj('litery', e);
    const kn = kontrast(pal.nitka, pal.tlo), kw = kontrast(pal.nitka, pal.wyroznienie), kd = kontrast(pal.drut, pal.tlo);
    if (kn < 3) dodaj('kontrast', `nitka/tło ${kn.toFixed(2)} < 3`);
    if (kd < 3) dodaj('kontrast', `drut i strzałka/tło ${kd.toFixed(2)} < 3`);
    if (kw < 3) dodaj('kontrast', `nitka/wyróżnienie ${kw.toFixed(2)} < 3`);
  }
  return b;
}

/** Sprawdzenie kroku do walidatora kontraktu (`walidujKarte(k, { sprawdzKrok: sprawdzKrok(palety) })`). */
export const sprawdzKrok = (palety: Paleta[]) => (karta: Karta, krok: Krok): Blad[] => sprawdzRysunek(karta, krok, siatkaPetli(karta, krok), palety);
