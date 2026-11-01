// Przypadki użycia projektu, części i kosza (moduly.md „Projekt”, ADR-0013, P-026, P-047 (7), P-072 (8a)).
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22).
import type { Powod, Wynik } from '../domena/bledy';
import { przejdzProjekt, type ZdarzenieProjektu } from '../domena/maszyny/projekt';
import { STANY, type NarzedzieProjektu } from '../domena/stany';
import { chwilaOPorze } from '../domena/postep';
import type { PortBazy } from '../domena/porty';
import { stanProjektu, ustawUsuniecie, usunietoMs, zapiszStanProjektu, type TabelaKosza } from '../dane/repozytoria/projekty-zapis';
import { liczba, liczbaLubNull, tekst, tekstLubNull, wiersze } from '../dane/repozytoria/wiersze';
import { jestDniem } from './daty';
import { OK, blad, operacjaZapisu } from './zapis';
import { scalDziennikWKolejce } from './dziennik';
import { wKolejce } from './kolejka';
import type { Zaleznosci, ZaleznosciArchiwum } from './zaleznosci';

export type NowyProjekt = { projektId: string; czesci: { czescId: string; nazwa: string; licznikId: string }[] };
const niepusta = (t: string): boolean => typeof t === 'string' && t.trim().length > 0;

async function dodajCzesc(tx: PortBazy, z: Zaleznosci, w: { projektId: string; nazwa: string; cel: number | null; paraZ: string | null; terazMs: number }): Promise<{ czescId: string; licznikId: string }> {
  const czescId = z.id.nowy(), licznikId = z.id.nowy();
  await tx.run(
    `INSERT INTO czesc (id, projekt_id, nazwa, kolejnosc, cel_rzedow, para_z, zmieniono_ms)
     VALUES (?, ?, ?, (SELECT coalesce(max(kolejnosc), 0) + 1 FROM czesc WHERE projekt_id = ?), ?, ?, ?)`,
    [czescId, w.projektId, w.nazwa.trim(), w.projektId, w.cel, w.paraZ, w.terazMs],
  );
  await tx.run('INSERT INTO licznik (id, czesc_id, kolejnosc, zmieniono_ms) VALUES (?, ?, 1, ?)', [licznikId, czescId, w.terazMs]);
  return { czescId, licznikId };
}

/**
 * Projekt z częściami; każda część dostaje licznik rzędów (BR-PRJ-001). Bez części: jedna część o nazwie projektu. Pusta nazwa (arkusz
 * „New project”, design-spec) = projekt roboczy jak po pierwszym +1: `nienazwany`, nazwa zapasowa = dzień startu (P-126 (1b), dane.md).
 */
export function utworzProjekt(z: Zaleznosci, w: { nazwa: string; czesci: string[] }): Promise<Wynik<NowyProjekt>> {
  if (typeof w.nazwa !== 'string' || !w.czesci.every(niepusta)) return Promise.resolve(blad('bledne_dane'));
  return operacjaZapisu(z, 'utworzProjekt', async (tx, teraz, chwila) => {
    const projektId = z.id.nowy();
    const roboczy = !niepusta(w.nazwa);
    const nazwaProjektu = roboczy ? chwila.dzien : w.nazwa.trim();
    await tx.run('INSERT INTO projekt (id, nazwa, nienazwany, utworzono_ms, zmieniono_ms, ostatnia_praca_ms) VALUES (?, ?, ?, ?, ?, ?)', [projektId, nazwaProjektu, roboczy ? 1 : 0, teraz, teraz, teraz]);
    const czesci: NowyProjekt['czesci'] = [];
    for (const nazwa of w.czesci.length ? w.czesci : [nazwaProjektu]) czesci.push({ nazwa: nazwa.trim(), ...(await dodajCzesc(tx, z, { projektId, nazwa, cel: null, paraZ: null, terazMs: teraz })) });
    return { ok: true, wartosc: { projektId, czesci } };
  });
}
/** Nadanie albo zmiana nazwy: zmiana jednej kolumny (UPDATE), nigdy REPLACE — części, liczniki i historia zostają (ADR-0002). */
export function nazwijProjekt(z: Zaleznosci, w: { projektId: string; nazwa: string }): Promise<Wynik<void>> {
  if (!niepusta(w.nazwa)) return Promise.resolve(blad('bledne_dane'));
  return operacjaZapisu(z, 'nazwijProjekt', async (tx, teraz) => {
    const r = await tx.run('UPDATE projekt SET nazwa = ?, nienazwany = 0, zmieniono_ms = ? WHERE id = ?', [w.nazwa.trim(), teraz, w.projektId]); // jedną instrukcją (P-126 (1b))
    return r.zmiany === 1 ? OK : blad('bledne_dane');
  });
}
export function zapiszNotatke(z: Zaleznosci, w: { projektId: string; tekst: string }): Promise<Wynik<void>> {
  return operacjaZapisu(z, 'zapiszNotatke', async (tx, teraz) => {
    const r = await tx.run('UPDATE projekt SET notatka = ?, zmieniono_ms = ? WHERE id = ?', [w.tekst, teraz, w.projektId]);
    return r.zmiany === 1 ? OK : blad('bledne_dane');
  });
}

function przejscie(z: Zaleznosci, projektId: string, zd: ZdarzenieProjektu): Promise<Wynik<void>> {
  return operacjaZapisu(z, `projekt_${zd}`, async (tx, teraz, chwila) => {
    const p = await stanProjektu(tx, projektId);
    if (!p) return blad('bledne_dane');
    const nowy = przejdzProjekt(p, zd, teraz);
    if (!nowy.ok) return nowy;
    await zapiszStanProjektu(tx, projektId, nowy.wartosc, teraz, zd === 'ukoncz' ? chwila.dzien : undefined);
    return OK;
  });
}
export const zakonczProjekt = (z: Zaleznosci, w: { projektId: string }): Promise<Wynik<void>> => przejscie(z, w.projektId, 'ukoncz');
export const wznowProjekt = (z: Zaleznosci, w: { projektId: string }): Promise<Wynik<void>> => przejscie(z, w.projektId, 'wznow');
export const usunProjekt = (z: Zaleznosci, w: { projektId: string }): Promise<Wynik<void>> => przejscie(z, w.projektId, 'usun');
export const przywrocProjekt = (z: Zaleznosci, w: { projektId: string }): Promise<Wynik<void>> => przejscie(z, w.projektId, 'przywroc');

/**
 * Data ukończenia wybrana na ekranie (tylko dzień, 04 fix-2): `ukonczono_dzien` = dzień, `ukonczono_ms` = ta sama pora lokalna co dotychczas
 * w strefie z `Zegar` (P-137, aneks 05 fix-4: luka DST → przesunięcie, pora podwójna → wcześniejsza), nie później niż teraz.
 */
export function zmienDateUkonczenia(z: Zaleznosci, w: { projektId: string; ukonczonoDzien: string }): Promise<Wynik<void>> {
  if (!jestDniem(w.ukonczonoDzien)) return Promise.resolve(blad('bledne_dane'));
  return operacjaZapisu(z, 'zmienDateUkonczenia', async (tx, teraz, chwila) => {
    const p = await stanProjektu(tx, w.projektId);
    if (!p) return blad('bledne_dane');
    if (p.stan !== 'ukonczony' || p.usunietoMs !== null || p.ukonczonoMs === null) return blad('niedozwolone_przejscie');
    const ms = chwilaOPorze({ dzien: w.ukonczonoDzien, wzorMs: p.ukonczonoMs, strefa: chwila.strefa });
    if (!ms.ok) return ms;
    await zapiszStanProjektu(tx, w.projektId, { ...p, ukonczonoMs: Math.min(ms.wartosc, teraz) }, teraz, w.ukonczonoDzien);
    return OK;
  });
}

/** Kosz części i licznika (BR-DAN-008/S3, S4): ten sam termin KOSZ_DNI co projekt; ponowne usunięcie nie przesuwa terminu. */
function kosz(z: Zaleznosci, tabela: TabelaKosza, id: string, usun: boolean): Promise<Wynik<void>> {
  return operacjaZapisu(z, `${usun ? 'usun' : 'przywroc'}_${tabela}`, async (tx, teraz) => {
    const s = await usunietoMs(tx, tabela, id);
    if (!s.jest) return blad('bledne_dane');
    if (usun === (s.usunietoMs !== null)) return blad('niedozwolone_przejscie');
    await ustawUsuniecie(tx, tabela, id, usun ? teraz : null, teraz);
    return OK;
  });
}
export const usunLicznik = (z: Zaleznosci, w: { licznikId: string }): Promise<Wynik<void>> => kosz(z, 'licznik', w.licznikId, true);
export const przywrocLicznik = (z: Zaleznosci, w: { licznikId: string }): Promise<Wynik<void>> => kosz(z, 'licznik', w.licznikId, false);
export const usunCzesc = (z: Zaleznosci, w: { czescId: string }): Promise<Wynik<void>> => kosz(z, 'czesc', w.czescId, true);
export const przywrocCzesc = (z: Zaleznosci, w: { czescId: string }): Promise<Wynik<void>> => kosz(z, 'czesc', w.czescId, false);

/** „Zrób taką samą” (F-20): części (z celem i parą `para_z` przepisaną na nowe części, P-199 Q2a) i przypomnienia skopiowane, liczniki 0, `kopia_z` = oryginał; oryginał bez zmian. */
export function zrobPonownie(z: Zaleznosci, w: { projektId: string }): Promise<Wynik<{ projektId: string }>> {
  return operacjaZapisu(z, 'zrobPonownie', async (tx, teraz, chwila) => {
    const [p] = await wiersze(tx.all('SELECT nazwa, nienazwany, narzedzie, drut_mm, usunieto_ms FROM projekt WHERE id = ?', [w.projektId]), 'zrobPonownie');
    if (!p) return blad('bledne_dane');
    if (liczbaLubNull(p, 'usunieto_ms') !== null) return blad('niedozwolone_przejscie');
    const projektId = z.id.nowy();
    // Z projektu roboczego powstaje roboczy z własną datą startu jako nazwą zapasową (dane.md, P-126 (1b)).
    const roboczy = liczba(p, 'nienazwany') === 1;
    // P-195 Q4a (BR-PRJ-007): narzędzie i rozmiar z oryginału; bez stanu (wartości, historii, sesji, dat, zdjęć, notatki, terminu).
    await tx.run('INSERT INTO projekt (id, nazwa, nienazwany, narzedzie, drut_mm, kopia_z, utworzono_ms, zmieniono_ms, ostatnia_praca_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [projektId, roboczy ? chwila.dzien : tekst(p, 'nazwa'), roboczy ? 1 : 0, tekst(p, 'narzedzie'), liczbaLubNull(p, 'drut_mm'), w.projektId, teraz, teraz, teraz]);
    const czesci = await wiersze(tx.all('SELECT id, nazwa, kolejnosc, cel_rzedow, para_z FROM czesc WHERE projekt_id = ? AND usunieto_ms IS NULL ORDER BY kolejnosc', [w.projektId]), 'zrobPonownie');
    const noweId = new Map<string, string>(); // część oryginału → część kopii (para wskazuje część kopii, nie oryginału)
    for (const c of czesci) {
      const czescId = z.id.nowy();
      noweId.set(tekst(c, 'id'), czescId);
      await tx.run('INSERT INTO czesc (id, projekt_id, nazwa, kolejnosc, cel_rzedow, zmieniono_ms) VALUES (?, ?, ?, ?, ?, ?)', [czescId, projektId, tekst(c, 'nazwa'), liczba(c, 'kolejnosc'), liczbaLubNull(c, 'cel_rzedow'), teraz]);
      const liczniki = await wiersze(tx.all(
        'SELECT id, nazwa, rodzaj, znaczenie, dlugosc_powtorzenia, kolejnosc FROM licznik WHERE czesc_id = ? AND usunieto_ms IS NULL ORDER BY kolejnosc', [tekst(c, 'id')]), 'zrobPonownie');
      for (const l of liczniki) {
        const licznikId = z.id.nowy();
        await tx.run(
          'INSERT INTO licznik (id, czesc_id, nazwa, rodzaj, znaczenie, dlugosc_powtorzenia, kolejnosc, zmieniono_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [licznikId, czescId, tekst(l, 'nazwa'), tekst(l, 'rodzaj'), tekst(l, 'znaczenie'), liczbaLubNull(l, 'dlugosc_powtorzenia'), liczba(l, 'kolejnosc'), teraz],
        );
        for (const r of await wiersze(tx.all('SELECT od_rzedu, co_n, razy, tekst FROM przypomnienie WHERE licznik_id = ?', [tekst(l, 'id')]), 'zrobPonownie')) {
          await tx.run('INSERT INTO przypomnienie (id, licznik_id, od_rzedu, co_n, razy, tekst, zmieniono_ms) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [z.id.nowy(), licznikId, liczba(r, 'od_rzedu'), liczba(r, 'co_n'), liczba(r, 'razy'), tekst(r, 'tekst'), teraz]);
        }
      }
    }
    for (const c of czesci) {
      const para = tekstLubNull(c, 'para_z'), nowa = para === null ? undefined : noweId.get(para);
      if (nowa) await tx.run('UPDATE czesc SET para_z = ? WHERE id = ?', [nowa, noweId.get(tekst(c, 'id'))]); // para z częścią spoza kopii (w koszu) — bez pary
    }
    return { ok: true, wartosc: { projektId } };
  });
}
/** Druga część pary (bliźniak, BR-PRJ-014): `para_z` bez własnego celu — cel liczą widoki z rzędów pierwszej (`celZPary`, S1, S3; P-199 Q2a). */
export function dodajCzescPara(z: Zaleznosci, w: { czescId: string; nazwa: string }): Promise<Wynik<{ czescId: string; licznikId: string }>> {
  if (!niepusta(w.nazwa)) return Promise.resolve(blad('bledne_dane'));
  return operacjaZapisu(z, 'dodajCzescPara', async (tx, teraz) => {
    const [c] = await wiersze(tx.all('SELECT projekt_id, usunieto_ms FROM czesc WHERE id = ?', [w.czescId]), 'dodajCzescPara');
    if (!c) return blad('bledne_dane');
    if (liczbaLubNull(c, 'usunieto_ms') !== null) return blad('niedozwolone_przejscie');
    const nowa = await dodajCzesc(tx, z, { projektId: tekst(c, 'projekt_id'), nazwa: w.nazwa, cel: null, paraZ: w.czescId, terazMs: teraz });
    return { ok: true, wartosc: nowa };
  });
}

/** Kolejność usuwania przy „Usuń wszystkie dane”: dzieci przed rodzicami (RESTRICT do `plik` działa od razu, także przy odroczonych kluczach). */
const KOLEJNOSC_USUWANIA = ['zdjecie', 'rysunek', 'wzor', 'projekt_wloczka', 'obliczenie', 'sesja', 'przypomnienie', 'notatka_rzedu', 'zdarzenie', 'licznik', 'czesc', 'projekt', 'wloczka', 'narzedzie', 'plik', 'dzien_limitu', 'poczekalnia', 'ustawienie', 'blad', 'zmiana_icloud'];
/** Stan iCloud urządzenia: wiersz zostaje, synchronizacja wyłączona przed usuwaniem, żeby wyzwalacze nie wysłały usunięć do iCloud (ADR-0005, fix-7). */
const STAN_SYNCHRONIZACJI = 'synchronizacja';
/** Niepowodzenie przed jakąkolwiek zmianą: kopia bezpieczeństwa się nie zapisała (ADR-0028, P-328); ekran mówi to innym tekstem niż błąd usuwania. */
export type BladKopiiPrzedUsunieciem = { ok: false; powod: Powod; etap: 'kopia' };
/**
 * „Usuń wszystkie dane” (F-34, P-110 Q3a, P-328): najpierw pełna kopia (archiwum `.oczko` w Documents/Backup, ADR-0028; dziennik +1 scalony do bazy,
 * jak przy eksporcie), potem wszystkie tabele lokalnie (także dni limitu, dane.md) i pliki z magazynu po COMMIT; synchronizacja wyłączona.
 * Nieudana kopia przerywa usunięcie bez zmiany. Stuknięcie +1 między kopią a usunięciem nie wchodzi do kopii (okno rzędu ms po potwierdzeniu: teoretyczne).
 */
export async function usunWszystkieDane(z: ZaleznosciArchiwum): Promise<Wynik<void> | BladKopiiPrzedUsunieciem> {
  const kopia = await z.czasWTle.chron('usuniecie', () => wKolejce(z.baza, async () => {
    const d = await scalDziennikWKolejce(z);
    if (!d.ok) return d;
    return z.archiwum.kopiaPrzed('usunieciem');
  }));
  if (!kopia.ok) return { ok: false, powod: kopia.powod, etap: 'kopia' };
  const pliki: string[] = [];
  const w = await operacjaZapisu(z, 'usunWszystkieDane', async (tx) => {
    const tabele = (await wiersze(tx.all("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"), 'usunWszystkieDane')).map((r) => tekst(r, 'name'));
    const nieznane = tabele.filter((t) => !KOLEJNOSC_USUWANIA.includes(t) && t !== STAN_SYNCHRONIZACJI);
    if (nieznane.length) throw new Error(`usunWszystkieDane: tabele bez miejsca w kolejności: ${nieznane.join(', ')}`); // nowa tabela = decyzja, nie pominięcie
    if (tabele.includes(STAN_SYNCHRONIZACJI)) await tx.run('UPDATE synchronizacja SET wlaczona = 0, wejscie = 0, stan_silnika = NULL WHERE id = 1'); // przed DELETE
    for (const r of await wiersze(tx.all('SELECT sha256 FROM plik'), 'usunWszystkieDane')) pliki.push(tekst(r, 'sha256'));
    for (const t of KOLEJNOSC_USUWANIA) if (tabele.includes(t)) await tx.run(`DELETE FROM ${t}`);
    return OK;
  });
  if (!w.ok) return w;
  for (const h of pliki) await z.magazyn.usun(h); // po COMMIT: plik bez odwołań (ADR-0001)
  if (z.synchronizacja) await z.synchronizacja.wylacz(); // „Usuń też z iCloud” to osobna opcja (P-110 Q3a)
  return OK;
}

/** Nowa część z licznikiem rzędów na końcu kolejności (BR-PRJ-001, U-5); cel w rzędach albo brak. Sygnatura 08 (P-182 Q3a, przegląd 05). */
export function dodajCzescProjektu(z: Zaleznosci, w: { projektId: string; nazwa: string; cel: number | null }): Promise<Wynik<{ czescId: string; licznikId: string }>> {
  if (!niepusta(w.nazwa) || (w.cel !== null && !(Number.isInteger(w.cel) && w.cel >= 1))) return Promise.resolve(blad('bledne_dane'));
  return operacjaZapisu(z, 'dodajCzescProjektu', async (tx, teraz) => {
    const [p] = await wiersze(tx.all('SELECT usunieto_ms FROM projekt WHERE id = ?', [w.projektId]), 'dodajCzescProjektu');
    if (!p) return blad('bledne_dane');
    if (liczbaLubNull(p, 'usunieto_ms') !== null) return blad('niedozwolone_przejscie');
    return { ok: true, wartosc: await dodajCzesc(tx, z, { projektId: w.projektId, nazwa: w.nazwa, cel: w.cel, paraZ: null, terazMs: teraz }) };
  });
}
/** Jedna kolumna projektu (UPDATE, ADR-0002); `ostatnia_praca_ms` bez zmian — praca to rzędy, nie ustawienia (BR-PRJ-016). */
function zmienProjekt(z: Zaleznosci, operacja: string, projektId: string, kolumna: 'termin_dzien', wartosc: string | null): Promise<Wynik<void>> {
  return operacjaZapisu(z, operacja, async (tx, teraz) => {
    const r = await tx.run(`UPDATE projekt SET ${kolumna} = ?, zmieniono_ms = ? WHERE id = ? AND usunieto_ms IS NULL`, [wartosc, teraz, projektId]); // kolumna z zamkniętej listy
    return r.zmiany === 1 ? OK : blad('bledne_dane');
  });
}
/** Próbka projektu (U-10): `projekt.probka` JSON {oczka, na_cm}; inne klucze zostają; `null` usuwa oczka i podstawę. */
export function ustawProbke(z: Zaleznosci, w: { projektId: string; probka: { oczka: number; naCm: 10 | 10.16 } | null }): Promise<Wynik<void>> {
  const p = w.probka;
  if (p !== null && (!(Number.isFinite(p.oczka) && p.oczka > 0) || (p.naCm !== 10 && p.naCm !== 10.16))) return Promise.resolve(blad('bledne_dane'));
  return operacjaZapisu(z, 'ustawProbke', async (tx, teraz) => {
    const r = p === null
      ? await tx.run("UPDATE projekt SET probka = json_remove(probka, '$.oczka', '$.na_cm'), zmieniono_ms = ? WHERE id = ? AND usunieto_ms IS NULL", [teraz, w.projektId])
      : await tx.run("UPDATE projekt SET probka = json_set(probka, '$.oczka', ?, '$.na_cm', ?), zmieniono_ms = ? WHERE id = ? AND usunieto_ms IS NULL", [p.oczka, p.naCm, teraz, w.projektId]);
    return r.zmiany === 1 ? OK : blad('bledne_dane');
  });
}
/**
 * Drut albo szydełko w milimetrach (BR-PRJ-004, F-17; P-184); `null` = brak danych (nie zgadywany rozmiar). Numer US liczy domena przy
 * wyświetleniu (RD-11 druty, RD-19 szydełko). Obie kolumny jedną instrukcją.
 */
export function ustawDrut(z: Zaleznosci, w: { projektId: string; drutMm: number | null; narzedzie: NarzedzieProjektu }): Promise<Wynik<void>> {
  if (w.drutMm !== null && !(Number.isFinite(w.drutMm) && w.drutMm > 0)) return Promise.resolve(blad('bledne_dane'));
  if (!STANY['projekt.narzedzie'].some((n) => n === w.narzedzie)) return Promise.resolve(blad('bledne_dane'));
  return operacjaZapisu(z, 'ustawDrut', async (tx, teraz) => {
    const r = await tx.run('UPDATE projekt SET drut_mm = ?, narzedzie = ?, zmieniono_ms = ? WHERE id = ? AND usunieto_ms IS NULL', [w.drutMm, w.narzedzie, teraz, w.projektId]);
    return r.zmiany === 1 ? OK : blad('bledne_dane');
  });
}
/** Termin „Gotowe do” (BR-DNI-005, F-61, U-6): dzień RRRR-MM-DD albo `null` (bez terminu nic się nie pokazuje). */
export function ustawTermin(z: Zaleznosci, w: { projektId: string; terminDzien: string | null }): Promise<Wynik<void>> {
  if (w.terminDzien !== null && !jestDniem(w.terminDzien)) return Promise.resolve(blad('bledne_dane'));
  return zmienProjekt(z, 'ustawTermin', w.projektId, 'termin_dzien', w.terminDzien);
}
