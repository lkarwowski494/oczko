// Rodzina „siatka-petli” (druty: oczko prawe i lewe, ujęcia): rysunek liczony z danych karty (ADR-0022).
// Pętla = łańcuch Catmulla-Roma przez 7 węzłów (podstawa, szyjka, początek głowy, wierzchołek, …); podział na 5 części
// (platyna lewa, nóżka lewa, głowa, nóżka prawa, platyna prawa). Przeplot NIE jest wpisany: silnik wykrywa każde skrzyżowanie
// i przypisuje mu część „nad” z reguły; rysowanie kładzie na każdym skrzyżowaniu łatkę części „nad” (svg.ts). Globalna kolejność
// warstw nie istnieje, bo jedna część może być raz nad, raz pod tą samą inną częścią (drut przez głowę pętli; E2).
// Skrzyżowanie bez reguły = błąd rysunku.
//
// Reguły przeplotu na stronie prawej (oczko górne G przeciągnięte przez oczko dolne D; dla oczka prawego nowa pętla idzie
// spod spodu na wierzch, dla lewego odwrotnie):
//   platyna G × nóżka albo głowa D:  prawe → D na wierzchu;  lewe → G na wierzchu (dolna część nowej pętli leży po drugiej
//                         stronie starej pętli niż część nad przejściem; głowa występuje przy ujęciu, gdy głowy ujmowanych zachodzą na siebie)
//   nóżka G × głowa D:    prawe → G na wierzchu;  lewe → D na wierzchu
//   dwa oczka ujęte razem (ten sam rząd, wspólne dziecko): na wierzchu to z `na_wierzchu` operacji
import { catmullRom, odleglosc, probkuj, przeciecia, punktBeziera, type Bez, type P } from './geometria.ts';
import type { Czesc, Karta, Krok, Petla, RodzajCzesci, Rysunek, Skrzyzowanie, Strona } from './typy.ts';

/** Wymiary w jednostkach rysunku; jedno miejsce (konfiguracja rodziny). Uproszczenie ilustracyjne, nie pomiar dzianiny. */
export const WYMIAR = {
  kolumna: 20, // odstęp oczek w rzędzie
  rzad: 14, // odstęp rzędów
  wysokoscPetli: 1.75, // × rzad: zachodzenie pętli na rząd wyżej
  szyjka: 0.2, // × kolumna: półszerokość szyjki
  glowa: 0.34, // × kolumna: półszerokość głowy
  wysSzyjki: 0.28, // × wysokość pętli
  wysGlowy: 0.7, // × wysokość pętli: początek głowy
  przesuniecieUjecia: 0.42, // × kolumna: przesunięcie głów oczek ujmowanych ku dziecku
  glowaUjecia: 1.35, // × glowa: szerokość głowy oczka ujmowanego
  margines: 8,
  drutWysokosc: 0.82, // × wysokość pętli: przejście drutu przez głowę
  drutNachylenie: 0.18, // tangens nachylenia drutu
  drutZapas: 0.12, // × kolumna: drut wystaje poza głowy pętli (nie sięga głowy sąsiada)
  drutGrot: 0.12, // × kolumna: dodatkowa długość po stronie grotu
} as const;

const KOLEJNOSC: RodzajCzesci[] = ['platyna_l', 'noga_l', 'glowa', 'noga_p', 'platyna_p'];
const grupa = (r: RodzajCzesci): 'platyna' | 'noga' | 'glowa' => (r === 'glowa' ? 'glowa' : r.startsWith('platyna') ? 'platyna' : 'noga');

interface PetlaRob extends Petla {
  lewa: number; // granica wycinka z lewym sąsiadem (podstawa platyny)
  prawa: number;
  szer: number; // mnożnik szerokości szyjki
  glowaSzer: number; // mnożnik szerokości głowy (oczka ujmowane: głowa obejmuje obie nóżki dziecka)
  dxGlowy: number; // przesunięcie głowy (oczka ujmowane)
}

/** Buduje rysunek kroku karty. Dla fazy „tkanina” rysuje próbkę przed operacją, dla „wynik” — po niej. */
export function siatkaPetli(karta: Karta, krok: Krok): Rysunek {
  const rys = karta.rysunek;
  if (!rys || rys.rodzina !== 'siatka-petli') throw new Error(`karta ${karta.id}: rodzina inna niż siatka-petli`);
  if (!rys.probka || !rys.tlo) throw new Error(`karta ${karta.id}: siatka-petli wymaga probka i tlo (walidator: rysunek)`);
  const { kolumny: N, rzedy: R } = rys.probka;
  const tlo = rys.tlo;
  const op = rys.operacja;
  const W = WYMIAR.kolumna, H = WYMIAR.rzad;
  const bledy: string[] = [];
  const przed = krok.faza === 'tkanina' || krok.faza === 'wklucie';
  // `probka.rzedy` = rzędy tkaniny przed operacją (0..R−1); operacja tworzy rząd R (kontrakt 1.1, interpretacja roli 06)
  const doOperacji = przed ? R : R + 1; // liczba rysowanych rzędów
  const rzadOp = op ? R : -1;
  if (op && op.typ !== 'oczko' && op.typ !== 'scal') throw new Error(`karta ${karta.id}: operacja „${op.typ}” nierysowana (walidator: rysunek-nieobslugiwany)`);
  const zuzywa = op?.typ === 'scal' ? op.zuzywa : 1;
  const k0 = op?.kolumna ?? Math.floor((N - zuzywa) / 2);
  const petle: PetlaRob[] = [];
  const idP = (r: number, k: number) => `p${r}_${k}`;
  const scalenia: Rysunek['scalenia'] = [];
  const wycinek = (x: number) => ({ lewa: x - W / 2, prawa: x + W / 2, szer: 1, glowaSzer: 1, dxGlowy: 0 });

  for (let r = 0; r < doOperacji; r++) {
    if (r !== rzadOp || !op) {
      for (let k = 0; k < N; k++) {
        petle.push({ id: idP(r, k), rzad: r, kolumna: k, x: WYMIAR.margines + (k + 0.5) * W, typ: tlo, rodzice: r ? [idP(r - 1, k)] : [], nachylenie: 0, ...wycinek(WYMIAR.margines + (k + 0.5) * W) });
      }
      continue;
    }
    // rząd operacji
    const dolne = petle.filter((p) => p.rzad === r - 1);
    let k = 0;
    for (let j = 0; j < dolne.length; ) {
      if (j === k0) {
        const ujete = dolne.slice(j, j + zuzywa);
        const x = ujete.reduce((s, p) => s + p.x, 0) / ujete.length;
        const typ: Strona = op.strona;
        const dziecko: PetlaRob = { id: idP(r, k), rzad: r, kolumna: k, x, typ, rodzice: ujete.map((p) => p.id), nachylenie: 0, ...wycinek(x), lewa: ujete[0].lewa, prawa: ujete[ujete.length - 1].prawa };
        petle.push(dziecko);
        if (op.typ === 'scal') {
          const nad = op.na_wierzchu === 'lewe' ? ujete[0] : op.na_wierzchu === 'prawe' ? ujete[ujete.length - 1] : ujete[(ujete.length - 1) / 2];
          if (!nad) throw new Error(`karta ${karta.id}: na_wierzchu „srodkowe” wymaga nieparzystej liczby ujmowanych oczek`);
          scalenia.push({ dziecko: dziecko.id, nad: nad.id, pod: ujete.filter((p) => p !== nad).map((p) => p.id) });
          for (const p of ujete) {
            p.dxGlowy = ((x - p.x) / (W / 2)) * WYMIAR.przesuniecieUjecia * W; // proporcjonalnie do odległości od dziecka (k2tog: 0,42 kolumny)
            p.glowaSzer = WYMIAR.glowaUjecia;
          }
        }
        j += zuzywa;
      } else {
        petle.push({ id: idP(r, k), rzad: r, kolumna: k, x: dolne[j].x, typ: tlo, rodzice: [dolne[j].id], nachylenie: 0, ...wycinek(dolne[j].x) });
        j += 1;
      }
      k++;
    }
  }

  // Geometria: węzły każdego rzędu jednym łańcuchem (ciągłość nitki i stycznej w rzędzie z konstrukcji).
  const czesci: Czesc[] = [];
  const rzedy: string[][] = [];
  const L = WYMIAR.wysokoscPetli * H;
  const wysRys = (doOperacji - 1) * H + L + 2 * WYMIAR.margines;
  const Y = (y: number) => wysRys - WYMIAR.margines - y; // oś w dół jak w SVG
  for (let r = 0; r < doOperacji; r++) {
    const rzad = petle.filter((p) => p.rzad === r);
    const yb = r * H;
    const wezly: P[] = [];
    const granice: number[] = []; // indeksy węzłów będących granicami części
    rzad.forEach((p, i) => {
      const { lewa, prawa } = p;
      const n = WYMIAR.szyjka * W * p.szer, a = WYMIAR.glowa * W * p.glowaSzer, d = p.dxGlowy;
      const lok: P[] = [
        { x: lewa, y: yb },
        { x: p.x - n, y: yb + WYMIAR.wysSzyjki * L },
        { x: p.x - a + d, y: yb + WYMIAR.wysGlowy * L },
        { x: p.x + d, y: yb + L },
        { x: p.x + a + d, y: yb + WYMIAR.wysGlowy * L },
        { x: p.x + n, y: yb + WYMIAR.wysSzyjki * L },
        { x: prawa, y: yb },
      ];
      p.nachylenie = d;
      if (i > 0) lok.shift(); // wspólna podstawa z poprzednią pętlą
      const start = wezly.length - (i > 0 ? 1 : 0);
      wezly.push(...lok.map((q) => ({ x: q.x, y: Y(q.y) })));
      granice.push(start);
    });
    const seg = catmullRom(wezly);
    const ids: string[] = [];
    rzad.forEach((p, i) => {
      const s = granice[i]; // pętla zajmuje segmenty s..s+5
      const zakres: [RodzajCzesci, number, number][] = [
        ['platyna_l', s, s + 1],
        ['noga_l', s + 1, s + 2],
        ['glowa', s + 2, s + 4],
        ['noga_p', s + 4, s + 5],
        ['platyna_p', s + 5, s + 6],
      ];
      for (const [rodzaj, od, doo] of zakres) {
        const id = `${p.id}.${rodzaj}`;
        czesci.push({ id, petla: p.id, rodzaj, rzad: r, segmenty: seg.slice(od, doo) });
        ids.push(id);
      }
    });
    rzedy.push(ids);
  }

  const petla = new Map(petle.map((p) => [p.id, p]));
  const glowaPetli = (id: string): Bez[] | undefined => czesci.find((c) => c.id === `${id}.glowa`)?.segmenty;

  // Drut (faza „wklucie”): prosta przez głowy pętli z `petle`, grot według `krok.drut.grot`.
  const cele = krok.faza === 'wklucie' ? krok.petle.map((m) => idP(m.rzad, m.kolumna)) : [];
  for (const id of cele) if (!petla.has(id)) bledy.push(`wklucie: brak pętli ${id} w rysunku przed operacją`);
  if (cele.length && cele.every((id) => petla.has(id))) {
    const cp = cele.map((id) => petla.get(id)!);
    const r = cp[0].rzad;
    const y = Y(r * H + WYMIAR.drutWysokosc * L);
    const xs = cp.map((p) => p.x);
    const a = WYMIAR.glowa * W;
    const lewo = krok.drut?.grot === 'w_lewo';
    const x0 = Math.min(...xs) - a - WYMIAR.drutZapas * W - (lewo ? WYMIAR.drutGrot * W : 0);
    const x1 = Math.max(...xs) + a + WYMIAR.drutZapas * W + (lewo ? 0 : WYMIAR.drutGrot * W);
    const xm = (x0 + x1) / 2, k = WYMIAR.drutNachylenie;
    const A: P = { x: x0, y: y + k * (x0 - xm) }, B: P = { x: x1, y: y + k * (x1 - xm) };
    const [ogon, grot] = lewo ? [B, A] : [A, B];
    const odc: Bez = [ogon, { x: ogon.x + (grot.x - ogon.x) / 3, y: ogon.y + (grot.y - ogon.y) / 3 }, { x: ogon.x + (2 * (grot.x - ogon.x)) / 3, y: ogon.y + (2 * (grot.y - ogon.y)) / 3 }, grot];
    czesci.push({ id: 'drut', petla: 'drut', rodzaj: 'drut', rzad: r, segmenty: [odc] });
  }

  // Skrzyżowania i reguły przeplotu.
  const lamane = new Map(czesci.map((c) => [c.id, probkuj(c.segmenty)]));
  const konce = (c: Czesc): P[] => [c.segmenty[0][0], c.segmenty[c.segmenty.length - 1][3]];
  const skrzyzowania: Skrzyzowanie[] = [];
  const zDrutem: { drut: Czesc; czesc: Czesc; punkt: P }[] = [];
  for (let i = 0; i < czesci.length; i++) {
    for (let j = i + 1; j < czesci.length; j++) {
      const A = czesci[i], B = czesci[j];
      if (Math.abs(A.rzad - B.rzad) > 1) continue;
      const pkt = przeciecia(lamane.get(A.id)!, lamane.get(B.id)!, [...konce(A), ...konce(B)]);
      if (A.rodzaj === 'drut' || B.rodzaj === 'drut') {
        const [D, C] = A.rodzaj === 'drut' ? [A, B] : [B, A];
        if (!pkt.length) continue;
        if (!cele.includes(C.petla)) { bledy.push(`drut przecina ${C.id} — pętlę spoza „petle” kroku`); continue; }
        for (const punkt of pkt) zDrutem.push({ drut: D, czesc: C, punkt });
        continue;
      }
      for (const punkt of pkt) {
        const nad = regula(A, B, petla, scalenia);
        if (typeof nad !== 'string' || !nad.startsWith('p')) {
          bledy.push(`skrzyzowanie ${A.id} × ${B.id} w (${punkt.x.toFixed(1)}, ${punkt.y.toFixed(1)}): ${nad}`);
          continue;
        }
        skrzyzowania.push({ a: A.id, b: B.id, punkt, nad });
      }
    }
  }

  // Drut przez pętlę: na każdej pętli docelowej dokładnie 2 skrzyżowania. Kierunek „od_przodu” (drut wchodzi od strony patrzącego):
  // bliżej ogona drut na wierzchu, bliżej grotu pętla na wierzchu; „od_tylu” odwrotnie.
  for (const id of cele) {
    const drut = czesci.find((c) => c.id === 'drut');
    if (!drut) break;
    const ogon = drut.segmenty[0][0];
    const s = zDrutem.filter((x) => x.czesc.petla === id).sort((p, q) => odleglosc(p.punkt, ogon) - odleglosc(q.punkt, ogon));
    if (s.length !== 2) { bledy.push(`wklucie: drut przecina pętlę ${id} ${s.length} razy, oczekiwane 2 (przejście przez pętlę)`); continue; }
    skrzyzowania.push({ a: 'drut', b: s[0].czesc.id, punkt: s[0].punkt, nad: regulaDrutu(krok.kierunek, 0, s[0].czesc.id) });
    skrzyzowania.push({ a: 'drut', b: s[1].czesc.id, punkt: s[1].punkt, nad: regulaDrutu(krok.kierunek, 1, s[1].czesc.id) });
  }

  // Strzałka kroku: kotwice w układzie rysunku.
  let strzalka: Rysunek['strzalka'] = null;
  if (krok.strzalka) {
    const pkt = (k: string): P | null => {
      const drut = czesci.find((c) => c.id === 'drut');
      if (k === 'drut_prawy') return drut ? drut.segmenty[0][3] : null;
      const m = /^(glowa|nozka_lewa|nozka_prawa):(\d+):(\d+)$/.exec(k);
      if (!m) return null;
      const rodzaj = m[1] === 'glowa' ? 'glowa' : m[1] === 'nozka_lewa' ? 'noga_l' : 'noga_p';
      const c = czesci.find((x) => x.id === `${idP(Number(m[2]), Number(m[3]))}.${rodzaj}`);
      if (!c) return null;
      return rodzaj === 'glowa' ? c.segmenty[0][3] : punktBeziera(c.segmenty[0], 0.5);
    };
    const od = pkt(krok.strzalka.od), doo = pkt(krok.strzalka.do);
    if (!od) bledy.push(`strzałka: brak kotwicy „${krok.strzalka.od}” w fazie ${krok.faza}`);
    if (!doo) bledy.push(`strzałka: brak kotwicy „${krok.strzalka.do}” w fazie ${krok.faza}`);
    if (od && doo) strzalka = { od, do: doo };
  }

  const kolejnosc = czesci.map((c) => c.id);
  const wyroznione = krok.wyroznij.map((m) => idP(m.rzad, m.kolumna)).filter((id) => petla.has(id));
  for (const m of krok.wyroznij) if (!petla.has(idP(m.rzad, m.kolumna))) bledy.push(`wyroznij: brak pętli rząd ${m.rzad} kolumna ${m.kolumna} w fazie ${krok.faza}`);

  const szer = Math.max(...petle.map((p) => p.prawa), ...czesci.filter((c) => c.rodzaj === 'drut').map((c) => Math.max(c.segmenty[0][0].x, c.segmenty[0][3].x))) + WYMIAR.margines;
  const przesun = Math.min(0, ...czesci.filter((c) => c.rodzaj === 'drut').map((c) => Math.min(c.segmenty[0][0].x, c.segmenty[0][3].x) - WYMIAR.margines));
  if (przesun < 0) { // drut wystaje w lewo poza próbkę: przesunięcie całego rysunku
    const dx = -przesun;
    const t = (q: P): P => ({ x: q.x + dx, y: q.y });
    for (const c of czesci) c.segmenty = c.segmenty.map((b) => b.map(t) as Bez);
    for (const p of petle) p.x += dx;
    for (const s of skrzyzowania) s.punkt = t(s.punkt);
    if (strzalka) strzalka = { od: t(strzalka.od), do: t(strzalka.do) };
  }
  const nKrok = (karta.kroki ?? []).findIndex((k) => k.klucz === krok.klucz); // klucz `atlas.<id>.krokN` jest unikalny (walidator)
  return {
    szer: szer - przesun,
    wys: wysRys,
    petle: petle.map(({ lewa: _l, prawa: _p, szer: _s, glowaSzer: _g, dxGlowy: _d, ...p }) => p),
    czesci,
    kolejnosc,
    rzedy,
    skrzyzowania,
    wyroznione,
    scalenia,
    strzalka,
    numer: (karta.kroki?.length ?? 0) > 1 && nKrok >= 0 ? nKrok + 1 : null,
    bledy,
  };
}

/** Która część jest na wierzchu na skrzyżowaniu (id) albo opis braku reguły. Eksport dla testów i walidatora. */
export function regula(A: Czesc, B: Czesc, petla: Map<string, Petla>, scalenia: Rysunek['scalenia']): string {
  if (A.petla === B.petla) return 'pętla przecina samą siebie';
  const pa = petla.get(A.petla)!, pb = petla.get(B.petla)!;
  if (pa.rzad === pb.rzad) {
    const s = scalenia.find((x) => [x.nad, ...x.pod].includes(pa.id) && [x.nad, ...x.pod].includes(pb.id));
    if (!s) return 'skrzyżowanie w rzędzie poza ujęciem';
    if (s.nad === pa.id) return A.id;
    if (s.nad === pb.id) return B.id;
    return 'ujęcie: żadna z pętli nie jest na wierzchu';
  }
  const [G, D, cG, cD] = pa.rzad > pb.rzad ? [pa, pb, A, B] : [pb, pa, B, A];
  if (!G.rodzice.includes(D.id)) return 'skrzyżowanie pętli bez przeplotu (nie rodzic–dziecko)';
  const gg = grupa(cG.rodzaj), gd = grupa(cD.rodzaj);
  const prawe = G.typ === 'prawe';
  if (gg === 'platyna' && (gd === 'noga' || gd === 'glowa')) return prawe ? cD.id : cG.id;
  if (gg === 'noga' && gd === 'glowa') return prawe ? cG.id : cD.id;
  return `brak reguły dla ${gg} (rząd ${G.rzad}) × ${gd} (rząd ${D.rzad})`;
}

/** Reguła drutu: dla pętli docelowej 2 skrzyżowania posortowane od ogona; „od_przodu” → bliżej ogona drut nad, bliżej grotu pętla nad. */
export function regulaDrutu(kierunek: Krok['kierunek'], odOgona: 0 | 1, czesc: string): string {
  return (kierunek === 'od_przodu') === (odOgona === 0) ? 'drut' : czesc;
}

export { KOLEJNOSC };
