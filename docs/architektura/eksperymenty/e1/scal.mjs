// Prototyp czystej funkcji domeny (ADR-0005, 0008, 0009; fix 05 2026-10-25, Z07-13): scalanie zdarzeń licznika z wielu źródeł.
// Zdarzenie: { id, licznik, rodzaj: plus|minus|wpisanie|zerowanie|cofniecie|rozstrzygniecie, wartosc?, rodzice: [id], cofa? }
// rodzice = ostatnie zdarzenia, które źródło znało (jak commit w git). Rozwidlenie = praca równoległa; łączy je tylko rozstrzygniecie.
// Wynik: zgodny | konflikt (pary głowa–wartość) | czeka (brakujący rodzice) | blad (powód; dane, których nie da się scalić bez zgadywania).
// Iteracyjnie (kolejność topologiczna Kahna), bez rekurencji: 150 000 zdarzeń mieści się w stosie (R-036).
const RODZAJE = new Set(['plus', 'minus', 'wpisanie', 'zerowanie', 'cofniecie', 'rozstrzygniecie']);
const USTAWIA = new Set(['wpisanie', 'cofniecie', 'rozstrzygniecie']);
const tresc = (z) => JSON.stringify([z.licznik ?? null, z.rodzaj, z.wartosc ?? null, z.rodzice, z.cofa ?? []]);
const blad = (powod, id) => ({ stan: 'blad', powod, id });

export function scal(zdarzenia) {
  const mapa = new Map();
  const kolizje = [];
  for (const z of zdarzenia) {
    const byl = mapa.get(z.id);
    if (!byl) mapa.set(z.id, z);                                 // idempotencja: duplikaty dostarczeń (M-02)
    else if (tresc(byl) !== tresc(z)) kolizje.push(z.id);         // to samo id, inna treść (M-14)
  }
  // Kolejność kontroli jest stała, a wybrane id najmniejsze, więc wynik nie zależy od kolejności wejścia.
  const pierwszy = (ids) => [...ids].sort()[0];
  if (kolizje.length) return blad('kolizja_id', pierwszy(kolizje));
  const wszystkie = [...mapa.values()];
  const nieznane = wszystkie.filter((z) => !RODZAJE.has(z.rodzaj)).map((z) => z.id);
  if (nieznane.length) return blad('nieznany_rodzaj', pierwszy(nieznane));             // M-15
  // Niezmiennik schemat.sql (zdarzenie, CHECK): ustawienie niesie nieujemną liczbę całkowitą, ±1 i zerowanie nie niosą wartości.
  // Rekord z synchronizacji albo importu może go łamać, więc wynik, nie wyjątek (P-118 W1, Q1a).
  const zle = wszystkie.filter((z) => (USTAWIA.has(z.rodzaj) ? !(Number.isInteger(z.wartosc) && z.wartosc >= 0) : z.wartosc !== undefined && z.wartosc !== null)).map((z) => z.id);
  if (zle.length) return blad('zla_wartosc', pierwszy(zle));                               // M-18–M-20
  const wiele = wszystkie.filter((z) => z.rodzaj !== 'rozstrzygniecie' && z.rodzice.length > 1).map((z) => z.id);
  if (wiele.length) return blad('wiele_rodzicow', pierwszy(wiele));                    // M-09
  const brakujacy = new Set(wszystkie.flatMap((z) => z.rodzice.filter((r) => !mapa.has(r))));
  if (brakujacy.size) return { stan: 'czeka', brakujacy: [...brakujacy].sort() };       // M-03; poczekalnia: ADR-0005
  const dzieci = new Map(wszystkie.map((z) => [z.id, []]));
  const wejscia = new Map(wszystkie.map((z) => [z.id, new Set(z.rodzice).size]));
  for (const z of wszystkie) for (const r of new Set(z.rodzice)) dzieci.get(r).push(z.id);
  const wartosc = new Map();
  const kolejka = wszystkie.filter((z) => wejscia.get(z.id) === 0).map((z) => z.id);
  for (let i = 0; i < kolejka.length; i++) {
    const z = mapa.get(kolejka[i]);
    let w;
    if (USTAWIA.has(z.rodzaj)) w = z.wartosc;
    else if (z.rodzaj === 'zerowanie') w = 0;
    else w = Math.max(0, (z.rodzice.length ? wartosc.get(z.rodzice[0]) : 0) + (z.rodzaj === 'plus' ? 1 : -1));
    wartosc.set(z.id, w);
    for (const d of dzieci.get(z.id)) { wejscia.set(d, wejscia.get(d) - 1); if (wejscia.get(d) === 0) kolejka.push(d); }
  }
  if (kolejka.length < wszystkie.length) return blad('cykl', pierwszy(wszystkie.filter((z) => !wartosc.has(z.id)).map((z) => z.id))); // M-12, M-13
  const glowy = wszystkie.filter((z) => dzieci.get(z.id).length === 0).map((z) => z.id).sort();
  if (glowy.length <= 1) return { stan: 'zgodny', wartosc: glowy.length ? wartosc.get(glowy[0]) : 0, glowy };
  return { stan: 'konflikt', glowy, kandydaci: glowy.map((g) => ({ glowa: g, wartosc: wartosc.get(g) })) }; // NFR-DAN-003: pokaż, nie zgaduj
}
