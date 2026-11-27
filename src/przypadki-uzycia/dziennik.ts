// Scalenie dziennika +1 z ekranu blokady (ADR-0008, scal M-02, Z07-11): idempotentne po UUID, potem `skroc`.
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22).
// ADR-0008 (3): linia bez licznika w bazie → `blad`, reszta partii zapisana; bez rodzica → poczekalnia; skrócenie do ostatniej przetworzonej.
// ADR-0008 (6): strażnik nie jest wołany ponownie; dzień limitu = `dzien` linii z `pro` z linii (P-111 (2), niepewność na korzyść użytkowniczki).
import type { Wynik } from '../domena/bledy';
import { startDnia, wolaStraznika } from '../domena/limit';
import type { PortBazy, WynikPartii, ZdarzenieWejsciowe } from '../domena/porty';
import { PARTIA_SYNCHRONIZACJI, POCZEKALNIA_EKRANU_MS } from '../konfiguracja';
import { parsujDziennik } from '../dane/dziennik';
import { zapiszBladW } from '../dane/repozytoria/bledy';
import { zapiszUstawienie } from '../dane/repozytoria/ustawienia';
import {
  dniLimituMiesiaca, dopiszZdarzenie, ostatniPlusPrzed, poczekalnia, poczekalniaEkranu, przyszloPoczekalni, rodzicZastapiony, stanLicznika, trescZdarzenia, usunZPoczekalni, zapiszDzienLimitu, zapiszOstatniaPrace, zdarzenie,
} from '../dane/repozytoria/liczniki';
import { dodajDni } from './daty';
import { wKolejce } from './kolejka';
import { przeliczLicznik } from '../dane/repozytoria/przelicz';
import { blad, czyBladDanych } from './zapis';
import type { ZaleznosciDziennika } from './zaleznosci';

const BEZ_LIMITU = Number.MAX_SAFE_INTEGER; // scalenie niczego nie odrzuca z powodu limitu (L-16); liczy tylko, czy dzień się zaczął (L-04)

async function scalLinie(tx: PortBazy, linie: readonly ZdarzenieWejsciowe[], terazMs: number): Promise<WynikPartii> {
  const w: WynikPartii = { scalono: 0, pominieto: 0, potwierdzone: [] };
  const dotkniete = new Set<string>();
  const ostatnie = new Map<string, string>(); // licznik → ostatnie zdarzenie dopisane w tej partii (głowa w bazie przelicza się dopiero po pętli)
  // ADR-0009 (2026-10-26) pkt 3: id linii z zegarka, które po COMMIT są w `zdarzenie` albo odrzucone na stałe; poczekalnia — nie.
  const potwierdz = (l: ZdarzenieWejsciowe) => { if (l.zrodlo === 'zegarek' && !w.potwierdzone.includes(l.id)) w.potwierdzone.push(l.id); };
  for (const l of linie) {
    const s = await stanLicznika(tx, l.licznikId);
    if (!s) { // zatruta linia (R-021): licznika nie ma w bazie
      await zapiszBladW(tx, { czasMs: terazMs, kod: 'dziennik_brak_licznika', szczegoly: { zdarzenie: l.id, licznik: l.licznikId } });
      w.pominieto += 1;
      potwierdz(l);
      await usunZPoczekalni(tx, l.id);
      continue;
    }
    const byl = await trescZdarzenia(tx, l.id);
    if (byl) { // powtórzone dostarczenie (M-02) albo kolizja id (M-14)
      // Linia z ekranu blokady mogła dostać innego rodzica po progu poczekalni (P-1080): jej rodzice nie są kolizją id.
      const innyRodzic = JSON.stringify(byl.rodzice) !== JSON.stringify(l.rodzice) && !(l.zrodlo === 'ekran_blokady' && await rodzicZastapiony(tx, l.id));
      if (byl.licznikId !== l.licznikId || byl.rodzaj !== l.rodzaj || innyRodzic) {
        await zapiszBladW(tx, { czasMs: terazMs, kod: 'dziennik_kolizja_id', szczegoly: { zdarzenie: l.id } });
      }
      potwierdz(l); // kolizja to też odrzucenie na stałe: ponowienie z zegarka dałoby ten sam wynik
      await usunZPoczekalni(tx, l.id); // ta sama linia czekała w poczekalni (EB1): już w `zdarzenie`
      continue;
    }
    let lRodzice = l.rodzice;
    let rodzice = await Promise.all(lRodzice.map((r) => zdarzenie(tx, r)));
    if (rodzice.some((r) => r === null)) { // rodzic jeszcze nie dotarł: poczekalnia (ADR-0005, P-110 Q1a)
      // EB1 (P-1079): linia z ekranu blokady czeka najwyżej POCZEKALNIA_EKRANU_MS (24 h od pierwszego przyjścia; jeden powrót z tła to 2 scalenia, więc nie liczymy wywołań); potem dołącza do bieżącej głowy licznika, żeby rząd policzony
      // na ekranie blokady nie zniknął na stałe (wartość = głowa + 1; konflikt z rozwidleniem pokazuje scal jak dla każdej innej linii).
      const przyszlo = l.zrodlo === 'ekran_blokady' ? await przyszloPoczekalni(tx, l.id) : null;
      if (przyszlo === null || terazMs - przyszlo < POCZEKALNIA_EKRANU_MS) {
        await poczekalnia(tx, { id: l.id, dane: JSON.stringify(l), powod: 'brak_rodzica', zrodlo: l.zrodlo, terazMs });
        continue;
      }
      const glowaTeraz = ostatnie.get(l.licznikId) ?? s.glowa; // P1-1 recenzji: kolejna osierocona linia w partii idzie za poprzednią, nie za tą samą głową
      lRodzice = glowaTeraz ? [glowaTeraz] : [];
      rodzice = await Promise.all(lRodzice.map((r) => zdarzenie(tx, r)));
      if (rodzice.some((r) => r === null)) { // głowa licznika nieznana zdarzeniom: nie zgadujemy, zostaje w poczekalni
        await poczekalnia(tx, { id: l.id, dane: JSON.stringify(l), powod: 'brak_rodzica', zrodlo: l.zrodlo, terazMs });
        continue;
      }
      await zapiszBladW(tx, { czasMs: terazMs, kod: 'dziennik_rodzic_zastapiony', szczegoly: { zdarzenie: l.id, licznik: l.licznikId } });
    }
    const przed = rodzice[0]?.wartoscPo ?? 0;
    await dopiszZdarzenie(tx, {
      id: l.id, licznikId: l.licznikId, rodzaj: l.rodzaj, wartosc: null, wartoscPo: Math.max(0, przed + (l.rodzaj === 'plus' ? 1 : -1)),
      rodzice: lRodzice, cofa: [], zrodlo: l.zrodlo, urzadzenie: l.urzadzenie, czasMs: l.czasMs, strefa: l.strefa, dzien: l.dzien,
    });
    if (wolaStraznika({ rodzaj: l.rodzaj })) {
      const start = startDnia({
        dni: await dniLimituMiesiaca(tx, l.dzien.slice(0, 7)), dzis: l.dzien, teraz: l.czasMs,
        ostatniPlus: await ostatniPlusPrzed(tx, dodajDni(l.dzien, -2), l.czasMs), pro: l.pro, limit: BEZ_LIMITU,
      });
      if (start.zapis) await zapiszDzienLimitu(tx, { dzien: start.zapis.data, pro: start.zapis.pro, zaczetoMs: l.czasMs, zdarzenieId: l.id });
    }
    await zapiszOstatniaPrace(tx, s.projektId, l.czasMs);
    await usunZPoczekalni(tx, l.id);
    ostatnie.set(l.licznikId, l.id);
    dotkniete.add(l.licznikId);
    w.scalono += 1;
    potwierdz(l);
  }
  for (const id of dotkniete) await przeliczLicznik(tx, id, terazMs);
  // F-58 „ostatni kontakt z zegarkiem” (P-199 Q5a, dane.md): czas odbioru partii z linią zegarka (także samych powtórzeń), w tej transakcji.
  if (linie.some((l) => l.zrodlo === 'zegarek')) await zapiszUstawienie(tx, 'zegarek_ostatnia_partia_ms', terazMs, terazMs);
  return w;
}

/** Bez kolejki: wołają ją pozycje kolejki (scalDziennik, naPierwszyPlan, start, eksport). */
export async function scalDziennikWKolejce(z: ZaleznosciDziennika): Promise<Wynik<WynikPartii>> {
  const terazMs = z.zegar.teraz().ms;
  const linie = await z.dziennik.odczytaj(); // przed transakcją: w transakcji nie czeka się na nic poza bazą (ADR-0002)
  const suma: WynikPartii = { scalono: 0, pominieto: 0, potwierdzone: [] };
  // EB1 (P-1079): wpisy poczekalni z ekranu blokady ponawiane przy każdym scaleniu, po liniach z pliku (rodzic mógł dojść w tym samym pliku),
  // w kolejności czasu linii; linia już obecna w pliku nie jest przetwarzana drugi raz.
  const wPlikuId = new Set(linie.map((l) => l.id));
  let czekajace: ZdarzenieWejsciowe[] = [];
  try {
    czekajace = (await poczekalniaEkranu(z.baza)).filter((c) => !wPlikuId.has(c.id)).flatMap((c) => parsujDziennik(c.dane).zdarzenia).sort((a, b) => a.czasMs - b.czasMs || (a.id < b.id ? -1 : 1));
  } catch {
    return blad('zapis'); // nic nie skracamy
  }
  if (!linie.length && !czekajace.length) return { ok: true, wartosc: suma };
  const doScalenia = [...linie, ...czekajace];
  try {
    for (let i = 0; i < doScalenia.length; i += PARTIA_SYNCHRONIZACJI) {
      const czesc = await z.baza.transakcja((tx) => scalLinie(tx, doScalenia.slice(i, i + PARTIA_SYNCHRONIZACJI), terazMs));
      suma.scalono += czesc.scalono;
      suma.pominieto += czesc.pominieto;
      for (const id of czesc.potwierdzone) if (!suma.potwierdzone.includes(id)) suma.potwierdzone.push(id);
    }
  } catch (e) {
    return blad(czyBladDanych(e) ? 'bledne_dane' : 'zapis'); // nic nie skracamy: linie zostają do następnego scalenia (zabicie procesu, NFR-DAN-002)
  }
  // Po COMMIT ostatniej partii, do ostatniej przetworzonej linii (ADR-0008 (3)). Nieudane skrócenie (M1-024: np. brak miejsca na plik
  // tymczasowy; natywnie plik zostaje bez zmian) nie cofa scalenia: linie zostają do następnego razu, ponowne scalenie ich nie dubluje (R-022).
  if (linie.length) await z.dziennik.skroc(linie[linie.length - 1].id).catch(() => undefined);
  return { ok: true, wartosc: suma };
}

/** `pominieto`: linie bez licznika w bazie (zatruta linia, R-021) — wpis w `blad`, reszta scalona. `potwierdzone`: dla `Zegarek.potwierdz` przed `odswiezEkranBlokady`. */
export function scalDziennik(z: ZaleznosciDziennika): Promise<Wynik<WynikPartii>> {
  return wKolejce(z.baza, () => scalDziennikWKolejce(z));
}
