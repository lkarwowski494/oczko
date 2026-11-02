// Scalenie dziennika +1 z ekranu blokady (ADR-0008, scal M-02, Z07-11): idempotentne po UUID, potem `skroc`.
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22).
// ADR-0008 (3): linia bez licznika w bazie → `blad`, reszta partii zapisana; bez rodzica → poczekalnia; skrócenie do ostatniej przetworzonej.
// ADR-0008 (6): strażnik nie jest wołany ponownie; dzień limitu = `dzien` linii z `pro` z linii (P-111 (2), niepewność na korzyść użytkowniczki).
import type { Wynik } from '../domena/bledy';
import { startDnia, wolaStraznika } from '../domena/limit';
import type { PortBazy, WynikPartii, ZdarzenieWejsciowe } from '../domena/porty';
import { PARTIA_SYNCHRONIZACJI } from '../konfiguracja';
import { zapiszBladW } from '../dane/repozytoria/bledy';
import { zapiszUstawienie } from '../dane/repozytoria/ustawienia';
import {
  dniLimituMiesiaca, dopiszZdarzenie, ostatniPlusPrzed, poczekalnia, stanLicznika, trescZdarzenia, zapiszDzienLimitu, zapiszOstatniaPrace, zdarzenie,
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
  // ADR-0009 (2026-10-26) pkt 3: id linii z zegarka, które po COMMIT są w `zdarzenie` albo odrzucone na stałe; poczekalnia — nie.
  const potwierdz = (l: ZdarzenieWejsciowe) => { if (l.zrodlo === 'zegarek' && !w.potwierdzone.includes(l.id)) w.potwierdzone.push(l.id); };
  for (const l of linie) {
    const s = await stanLicznika(tx, l.licznikId);
    if (!s) { // zatruta linia (R-021): licznika nie ma w bazie
      await zapiszBladW(tx, { czasMs: terazMs, kod: 'dziennik_brak_licznika', szczegoly: { zdarzenie: l.id, licznik: l.licznikId } });
      w.pominieto += 1;
      potwierdz(l);
      continue;
    }
    const byl = await trescZdarzenia(tx, l.id);
    if (byl) { // powtórzone dostarczenie (M-02) albo kolizja id (M-14)
      if (byl.licznikId !== l.licznikId || byl.rodzaj !== l.rodzaj || JSON.stringify(byl.rodzice) !== JSON.stringify(l.rodzice)) {
        await zapiszBladW(tx, { czasMs: terazMs, kod: 'dziennik_kolizja_id', szczegoly: { zdarzenie: l.id } });
      }
      potwierdz(l); // kolizja to też odrzucenie na stałe: ponowienie z zegarka dałoby ten sam wynik
      continue;
    }
    const rodzice = await Promise.all(l.rodzice.map((r) => zdarzenie(tx, r)));
    if (rodzice.some((r) => r === null)) { // rodzic jeszcze nie dotarł: poczekalnia (ADR-0005, P-110 Q1a)
      await poczekalnia(tx, { id: l.id, dane: JSON.stringify(l), powod: 'brak_rodzica', zrodlo: l.zrodlo, terazMs });
      continue;
    }
    const przed = rodzice[0]?.wartoscPo ?? 0;
    await dopiszZdarzenie(tx, {
      id: l.id, licznikId: l.licznikId, rodzaj: l.rodzaj, wartosc: null, wartoscPo: Math.max(0, przed + (l.rodzaj === 'plus' ? 1 : -1)),
      rodzice: l.rodzice, cofa: [], zrodlo: l.zrodlo, urzadzenie: l.urzadzenie, czasMs: l.czasMs, strefa: l.strefa, dzien: l.dzien,
    });
    if (wolaStraznika({ rodzaj: l.rodzaj })) {
      const start = startDnia({
        dni: await dniLimituMiesiaca(tx, l.dzien.slice(0, 7)), dzis: l.dzien, teraz: l.czasMs,
        ostatniPlus: await ostatniPlusPrzed(tx, dodajDni(l.dzien, -2), l.czasMs), pro: l.pro, limit: BEZ_LIMITU,
      });
      if (start.zapis) await zapiszDzienLimitu(tx, { dzien: start.zapis.data, pro: start.zapis.pro, zaczetoMs: l.czasMs, zdarzenieId: l.id });
    }
    await zapiszOstatniaPrace(tx, s.projektId, l.czasMs);
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
  if (!linie.length) return { ok: true, wartosc: suma };
  try {
    for (let i = 0; i < linie.length; i += PARTIA_SYNCHRONIZACJI) {
      const czesc = await z.baza.transakcja((tx) => scalLinie(tx, linie.slice(i, i + PARTIA_SYNCHRONIZACJI), terazMs));
      suma.scalono += czesc.scalono;
      suma.pominieto += czesc.pominieto;
      for (const id of czesc.potwierdzone) if (!suma.potwierdzone.includes(id)) suma.potwierdzone.push(id);
    }
  } catch (e) {
    return blad(czyBladDanych(e) ? 'bledne_dane' : 'zapis'); // nic nie skracamy: linie zostają do następnego scalenia (zabicie procesu, NFR-DAN-002)
  }
  // Po COMMIT ostatniej partii, do ostatniej przetworzonej linii (ADR-0008 (3)). Nieudane skrócenie (M1-024: np. brak miejsca na plik
  // tymczasowy; natywnie plik zostaje bez zmian) nie cofa scalenia: linie zostają do następnego razu, ponowne scalenie ich nie dubluje (R-022).
  await z.dziennik.skroc(linie[linie.length - 1].id).catch(() => undefined);
  return { ok: true, wartosc: suma };
}

/** `pominieto`: linie bez licznika w bazie (zatruta linia, R-021) — wpis w `blad`, reszta scalona. `potwierdzone`: dla `Zegarek.potwierdz` przed `odswiezEkranBlokady`. */
export function scalDziennik(z: ZaleznosciDziennika): Promise<Wynik<WynikPartii>> {
  return wKolejce(z.baza, () => scalDziennikWKolejce(z));
}
