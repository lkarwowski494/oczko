// Prototyp czystych funkcji 1.0.2 (rola 05 fix AR1, 2026-11-28; ADR-0035, ADR-0036). Wyrocznia dla 07 i 08: docs/architektura/wektory-1-0-2.json.
// Nie jest kodem aplikacji: 08 pisze odpowiedniki w src/domena (TS) i w pakiecie OczkoReguly/OczkoDziennik (Swift), te same wektory.
// Uruchomienie kontroli: node docs/architektura/eksperymenty/1-0-2/sprawdz.mjs (wynik: sprawdz.out).

export const ZRODLA_PRZESUWANE = ['ekran_blokady', 'zegarek']; // linie dziennika: zdarzenie jeszcze nie jest w bazie, więc rodzica wolno ustalić przy scaleniu
export const KROK_MAKS = 2; // licznik.krok CHECK (krok IN (1, 2)) — ADR-0036

/**
 * U2 (ADR-0035): rodzic linii ±1 z ekranu blokady albo zegarka przy scaleniu dziennika.
 * linia: { rodzaj, czasMs, zrodlo, rodzic: string | null }; glowy: głowy grafu licznika w bazie (wynik scal, z liniami partii);
 * poRodzicu: zdarzenia od rodzica (wyłącznie) do głowy (włącznie) — { rodzaj, czasMs }[] — albo null, gdy rodzic nie jest przodkiem głowy;
 * obcieto: przejście przerwane po DZIENNIK_PRZESUNIECIE_MAKS zdarzeniach.
 * Wynik: 'bez_zmian' (rodzic z linii), 'przesun' (rodzic = jedyna głowa), 'rozwidlenie' (rodzic z linii; scal pokaże konflikt, PU-099).
 */
export function przesuniecieRodzica({ linia, glowy, poRodzicu, obcieto }) {
  if (!ZRODLA_PRZESUWANE.includes(linia.zrodlo) || (linia.rodzaj !== 'plus' && linia.rodzaj !== 'minus')) return { decyzja: 'bez_zmian', rodzic: linia.rodzic };
  if (glowy.length === 0) return { decyzja: 'bez_zmian', rodzic: linia.rodzic }; // licznik bez zdarzeń: linia zaczyna historię
  if (glowy.length > 1) return { decyzja: 'rozwidlenie', rodzic: linia.rodzic }; // licznik już w konflikcie: nie zgadujemy, która głowa
  const glowa = glowy[0];
  if (linia.rodzic === glowa) return { decyzja: 'bez_zmian', rodzic: glowa };
  if (poRodzicu === null || obcieto) return { decyzja: 'rozwidlenie', rodzic: linia.rodzic };
  // Przemienne: ±1 (suma kroków; zejście poniżej 0 przycina scal, M-06). Nieprzemienne (wpisanie, zerowanie, cofnięcie, rozstrzygnięcie)
  // wolno ominąć tylko, gdy stało się nie później niż stuknięcie (czas zdarzenia), czyli linia i tak szła po nim.
  const zgodne = poRodzicu.every((e) => e.rodzaj === 'plus' || e.rodzaj === 'minus' || e.czasMs <= linia.czasMs);
  return zgodne ? { decyzja: 'przesun', rodzic: glowa } : { decyzja: 'rozwidlenie', rodzic: linia.rodzic };
}

/**
 * U6 (ADR-0036): stuknięcia z kroku. Zdarzenie `plus` dołącza do stuknięcia rodzica, gdy rodzic jest `plus` z tym samym czasMs, źródłem
 * i urządzeniem, stuknięcie rodzica ma < KROK_MAKS zdarzeń i rodzic nie ma innego dziecka w stuknięciu. Wejście w dowolnej kolejności.
 * Wynik: stuknięcia w kolejności (czasMs, id ostatniego) — { ids (od pierwszego), krok, czasMs, zrodlo }.
 */
export function stukniecia(zdarzenia) {
  const mapa = new Map(zdarzenia.map((z) => [z.id, z]));
  const grupa = new Map(); // id → tablica ids (wspólny obiekt)
  const zajety = new Set(); // rodzic, którego dziecko już dołączyło
  const kolejnosc = [...zdarzenia].sort((a, b) => a.czasMs - b.czasMs || glebokosc(a, mapa) - glebokosc(b, mapa) || (a.id < b.id ? -1 : 1));
  for (const z of kolejnosc) {
    const p = z.rodzice.length === 1 ? mapa.get(z.rodzice[0]) : undefined;
    const g = p && grupa.get(p.id);
    if (z.rodzaj === 'plus' && p && g && p.rodzaj === 'plus' && p.czasMs === z.czasMs && p.zrodlo === z.zrodlo && p.urzadzenie === z.urzadzenie
      && g.length < KROK_MAKS && g[g.length - 1] === p.id && !zajety.has(p.id)) {
      g.push(z.id); zajety.add(p.id); grupa.set(z.id, g);
    } else grupa.set(z.id, [z.id]);
  }
  const wynik = [...new Set(grupa.values())].map((ids) => {
    const ost = mapa.get(ids[ids.length - 1]);
    return { ids, krok: ids.length, czasMs: ost.czasMs, zrodlo: ost.zrodlo, rodzaj: ost.rodzaj };
  });
  return wynik.sort((a, b) => a.czasMs - b.czasMs || glebokosc(mapa.get(a.ids[0]), mapa) - glebokosc(mapa.get(b.ids[0]), mapa));
}
function glebokosc(z, mapa) { let d = 0; for (let x = z; x && x.rodzice.length; x = mapa.get(x.rodzice[0])) d += 1; return d; }

/** RD-17 na stuknięciach (ADR-0036): seria = `seria` stuknięć w oknie; liczba rzędów w banerze = suma kroków; cofnięcie obejmuje wszystkie ids. */
export function serieStukniec(st, { seria, oknoS }) {
  const okno = oknoS * 1000, wynik = [];
  for (const zr of [...new Set(st.map((s) => s.zrodlo))]) {
    const l = st.filter((s) => s.zrodlo === zr && s.rodzaj === 'plus').sort((a, b) => a.czasMs - b.czasMs);
    let pocz = 0;
    for (let i = 1; i <= l.length; i += 1) {
      if (i < l.length && l[i].czasMs - l[i - 1].czasMs <= okno) continue;
      const ciag = l.slice(pocz, i);
      if (ciag.some((_, k) => k + seria - 1 < ciag.length && ciag[k + seria - 1].czasMs - ciag[k].czasMs <= okno)) {
        wynik.push({ zrodlo: zr, stukniecia: ciag.length, rzedy: ciag.reduce((s, x) => s + x.krok, 0), ids: ciag.flatMap((x) => x.ids) });
      }
      pocz = i;
    }
  }
  return wynik;
}

/** „Cofnij” z historii (ADR-0036): cel = ostatnie stuknięcie z niecofniętym zdarzeniem; cofa jego niecofnięte zdarzenia. odNajnowszego: zdarzenia od głowy. */
export function celCofnieciaStukniecia(odNajnowszego, st) {
  const cofniete = new Set(odNajnowszego.filter((z) => z.rodzaj === 'cofniecie').flatMap((z) => z.cofa));
  const grupaZ = new Map(st.flatMap((s) => s.ids.map((id) => [id, s])));
  for (const z of odNajnowszego) {
    if (z.rodzaj === 'cofniecie' || cofniete.has(z.id)) continue;
    const s = grupaZ.get(z.id);
    const ids = (s ? s.ids : [z.id]).filter((id) => !cofniete.has(id));
    return { cofa: ids, przedId: ids[0] }; // wartość cofnięcia = wartość po rodzicu zdarzenia `przedId` (historia liniowa, licznik.ts wartoscPrzed)
  }
  return null;
}

/** Sygnały przy skoku (ADR-0036; F-08/BR-LIC-011, RD-12): cel części przekroczony w (przed, po]; koniec powtórzenia, gdy w (przed, po] jest wielokrotność d. */
export function sygnalySkoku(przed, po, { cel, dlugosc }) {
  return {
    celCzesci: cel !== null && przed < cel && cel <= po,
    koniecPowtorzenia: dlugosc !== null && po > przed && Math.floor(po / dlugosc) > Math.floor(przed / dlugosc),
  };
}

/** RD-13 W20–W25 przy skoku (jak src/domena/przypomnienia.ts przypomnienieWpisania(przed + 1, po + 1)) — dla haptyki zegarka (Swift). */
export function przypomnienieSkoku(przed, po, plan) {
  if (po <= przed) return null;
  const a = przed + 1, b = po + 1, ostatni = plan.od + (plan.razy - 1) * plan.co, gorny = Math.min(b, ostatni);
  if (plan.razy < 1 || gorny < plan.od) return null;
  const r = gorny - ((gorny - plan.od) % plan.co);
  return r > a ? r : null;
}

/**
 * Intencja / zegarek (Swift `stuknij`, ADR-0008 (1), U4 ADR-0035, U6 ADR-0036) — model stanu bez dni limitu: limit podaje test (`limitOdmawia`).
 * stan: { wartosc, glowa, dzien, dzienDozwolony, zablokowany, ostatniPlusMs }. Zwraca { wynik, linie, stan }.
 */
export function stuknijKrok(rodzaj, krok, stan, { teraz, dzis, ids, limitOdmawia = false }) {
  if (stan.zablokowany) return { wynik: 'zablokowany', linie: [], stan };
  if (rodzaj === 'minus') {
    if (stan.wartosc === 0) return { wynik: 'bezZmiany', linie: [], stan };
    const l = { id: ids[0], rodzaj: 'minus', rodzice: stan.glowa ? [stan.glowa] : [], czasMs: teraz, dzien: dzis };
    // U4: −1 to korekta — nie zaczyna dnia, nie zmienia `dzien` ani `dzienDozwolony` (inaczej Live Activity w stanie limitu pokazałaby znów „+1”).
    return { wynik: 'zapisz', linie: [l], stan: { ...stan, wartosc: stan.wartosc - 1, glowa: l.id } };
  }
  if (!Number.isInteger(krok) || krok < 1 || krok > KROK_MAKS) return { wynik: 'bledne_dane', linie: [], stan };
  if ((dzis === stan.dzien && !stan.dzienDozwolony) || limitOdmawia) return { wynik: 'limit', linie: [], stan }; // decyzja raz, dla pierwszego zdarzenia
  const linie = [];
  let glowa = stan.glowa;
  for (let k = 0; k < krok; k += 1) { linie.push({ id: ids[k], rodzaj: 'plus', rodzice: glowa ? [glowa] : [], czasMs: teraz, dzien: dzis }); glowa = ids[k]; }
  return { wynik: 'zapisz', linie, stan: { ...stan, wartosc: stan.wartosc + krok, glowa, ostatniPlusMs: teraz, dzien: dzis, dzienDozwolony: true } };
}
