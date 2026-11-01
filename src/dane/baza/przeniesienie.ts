// Przeniesienie danych z kopii bazy (ten sam schemat) do bazy głównej przez port i kolejkę — nigdy podmiana pliku (ADR-0020 (5), R-088):
// „zastąp” (import, przywrócenie kopii) i „scal” po UUID (import, ADR-0004, dane.md „Import”, P-091 (6a), ER-42).
// Kopia dołączana `ATTACH` przed transakcją (w transakcji ATTACH jest niedozwolony), odłączana po niej; klucze obce odroczone do COMMIT.
import type { PortBazy, SygnalCzasu } from '../../domena/porty';
import { zapiszBladW } from '../repozytoria/bledy';
import { przeliczLicznik } from '../repozytoria/przelicz';
import { tekst, wiersze } from '../repozytoria/wiersze';

/** Rodzice przed dziećmi (wstawianie); usuwanie w odwrotnej kolejności (RESTRICT do `plik` działa od razu, także przy odroczonych kluczach). */
const TABELE = ['plik', 'projekt', 'czesc', 'licznik', 'zdarzenie', 'notatka_rzedu', 'przypomnienie', 'sesja', 'wzor', 'rysunek', 'wloczka', 'narzedzie',
  'projekt_wloczka', 'zdjecie', 'obliczenie', 'dzien_limitu', 'poczekalnia', 'ustawienie'] as const;
/** Klucze stanu urządzenia: przy imporcie pomijane (dane.md „Klucze tabeli ustawienie”). */
const KLUCZE_URZADZENIA = "('ostatnie_miejsce', 'ostatni_start_ms', 'icloud_uzytkownik', 'ostatnia_prosba_o_ocene', 'jezyk', 'zegarek_ostatnia_partia_ms')";

async function kolumny(tx: PortBazy, tabela: string): Promise<string[]> {
  return (await wiersze(tx.all(`SELECT name FROM pragma_table_info('${tabela}')`), 'kolumny')).map((r) => tekst(r, 'name'));
}
/** Kolumny bieżącej tabeli, które ma też tabela w kopii: starszy plik bez nowszej kolumny (P-334 `odjeto_motki`) daje w niej NULL/domyślną, nie błąd importu. */
async function kolumnyKopii(tx: PortBazy, tabela: string): Promise<string[]> {
  const sa = new Set((await wiersze(tx.all(`SELECT name FROM pragma_table_info('${tabela}', 'kopia')`), 'kolumny')).map((r) => tekst(r, 'name')));
  return (await kolumny(tx, tabela)).filter((c) => sa.has(c));
}
async function sprawdzTabele(tx: PortBazy): Promise<void> {
  const glowne = (await wiersze(tx.all("SELECT name FROM main.sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"), 'tabele')).map((r) => tekst(r, 'name'));
  const znane: readonly string[] = [...TABELE, 'blad', 'synchronizacja', 'zmiana_icloud']; // stan urządzenia: nie przenoszony (fix-7, ADR-0005)
  const nowe = glowne.filter((t) => !znane.includes(t));
  if (nowe.length) throw new Error(`przeniesienie: tabele bez reguły przeniesienia: ${nowe.join(', ')}`); // nowa tabela = decyzja, nie pominięcie
}
/** Transakcja, która przed każdą instrukcją sprawdza sygnał czasu w tle; po wygaśnięciu wyjątek → ROLLBACK (ADR-0002 (7)). */
function pilnowana(tx: PortBazy, sygnal: SygnalCzasu | undefined): PortBazy {
  if (!sygnal) return tx;
  const sprawdz = () => { if (sygnal.wygaslo()) throw new Error('czas w tle wygasł: transakcja wycofana (ADR-0002 (7))'); };
  const t: PortBazy = {
    run: (sql, p) => { sprawdz(); return tx.run(sql, p); },
    all: (sql, p) => { sprawdz(); return tx.all(sql, p); },
    transakcja: (f) => f(t),
  };
  return t;
}
/** ATTACH → jedna transakcja → DETACH; wołający trzyma całość w jednej pozycji kolejki przypadków użycia (ADR-0020 (5′)). */
async function zKopia<T>(baza: PortBazy, sciezkaKopii: string, fn: (tx: PortBazy) => Promise<T>, sygnal?: SygnalCzasu): Promise<T> {
  await baza.run('ATTACH DATABASE ? AS kopia', [sciezkaKopii]);
  try {
    return await baza.transakcja(async (surowa) => {
      const tx = pilnowana(surowa, sygnal);
      await tx.run('PRAGMA defer_foreign_keys = ON'); // w transakcji: sprawdzenie kluczy przy COMMIT (dzieci i rodzice w dowolnej kolejności)
      await sprawdzTabele(tx);
      return fn(tx);
    });
  } finally {
    await baza.run('DETACH DATABASE kopia');
  }
}

/** „Zastąp”: dane z kopii zamiast bieżących, w jednej transakcji; `blad` i klucze stanu urządzenia zostają. */
export function zastapZKopii(baza: PortBazy, sciezkaKopii: string, sygnal?: SygnalCzasu): Promise<void> {
  return zKopia(baza, sciezkaKopii, async (tx) => {
    for (const t of [...TABELE].reverse()) await tx.run(t === 'ustawienie' ? `DELETE FROM main.ustawienie WHERE klucz NOT IN ${KLUCZE_URZADZENIA}` : `DELETE FROM main.${t}`);
    for (const t of TABELE) {
      const k = (await kolumnyKopii(tx, t)).join(', ');
      await tx.run(`INSERT INTO main.${t} (${k}) SELECT ${k} FROM kopia.${t}${t === 'ustawienie' ? ` WHERE klucz NOT IN ${KLUCZE_URZADZENIA}` : ''}`);
    }
  }, sygnal);
}

/** Klucz główny i kolumna czasu zmiany encji (wygrywa nowsza `zmieniono_ms`); bez czasu zmiany: tylko dopisanie brakujących wierszy. */
const ENCJE: Record<string, { klucz: string; czas: boolean; pomin?: string[] }> = {
  projekt: { klucz: 'id', czas: true }, czesc: { klucz: 'id', czas: true },
  licznik: { klucz: 'id', czas: true, pomin: ['wartosc', 'glowa', 'konflikt'] }, // pamięć podręczna: liczona od nowa przez scal
  notatka_rzedu: { klucz: 'id', czas: true }, przypomnienie: { klucz: 'id', czas: true }, wzor: { klucz: 'id', czas: true },
  rysunek: { klucz: 'wzor_id, strona', czas: true }, wloczka: { klucz: 'id', czas: true }, narzedzie: { klucz: 'id', czas: true },
  projekt_wloczka: { klucz: 'projekt_id, wloczka_id', czas: true },
  plik: { klucz: 'sha256', czas: false }, zdarzenie: { klucz: 'id', czas: false }, sesja: { klucz: 'id', czas: true }, // sesja: zmieniono_ms od łatki L2 (fix-7)
  zdjecie: { klucz: 'id', czas: false }, obliczenie: { klucz: 'id', czas: false },
};

/**
 * „Scal” po UUID: encje według `zmieniono_ms`, zdarzenia dopisywane (ten sam id = jedno zdarzenie; inna treść → `blad`, M-14), dni limitu
 * instrukcją `zapis-dnia-limitu.sql` (pro = OR, L-20), okno „Uczciwe zasady” OR (KP-16); potem `scal` nad zdarzeniami każdego licznika z kopii
 * (rozbieżna gałąź = konflikt jak przy iCloud, M-04; drugi import tego samego pliku nic nie zmienia, M-16). Zwraca liczniki w konflikcie.
 */
export function scalZKopia(baza: PortBazy, sciezkaKopii: string, terazMs: number, sygnal?: SygnalCzasu): Promise<number> {
  return zKopia(baza, sciezkaKopii, async (tx) => {
    const kolizje = await wiersze(tx.all(
      `SELECT k.id FROM kopia.zdarzenie k JOIN main.zdarzenie m ON m.id = k.id
        WHERE m.licznik_id <> k.licznik_id OR m.rodzaj <> k.rodzaj OR m.wartosc IS NOT k.wartosc OR m.rodzice <> k.rodzice OR m.cofa <> k.cofa`), 'scal');
    for (const r of kolizje) await zapiszBladW(tx, { czasMs: terazMs, kod: 'import_kolizja_id', szczegoly: { zdarzenie: tekst(r, 'id') } });
    for (const t of TABELE) {
      const e = ENCJE[t];
      if (!e) continue;
      const wszystkie = await kolumnyKopii(tx, t); // tylko kolumny obecne w kopii: brakująca nie nadpisuje lokalnej wartości NULL-em
      const k = wszystkie.join(', ');
      const klucz = e.klucz.split(', ');
      const zmiany = wszystkie.filter((c) => !klucz.includes(c) && !(e.pomin ?? []).includes(c)).map((c) => `${c} = excluded.${c}`).join(', ');
      const naKonflikt = e.czas && zmiany ? `ON CONFLICT (${e.klucz}) DO UPDATE SET ${zmiany} WHERE excluded.zmieniono_ms > main.${t}.zmieniono_ms` : 'ON CONFLICT DO NOTHING';
      await tx.run(`INSERT INTO main.${t} (${k}) SELECT ${k} FROM kopia.${t} WHERE true ${naKonflikt}`);
    }
    await tx.run(
      `INSERT INTO main.dzien_limitu (dzien, pro, zaczeto_ms, zdarzenie_id) SELECT dzien, pro, zaczeto_ms, zdarzenie_id FROM kopia.dzien_limitu WHERE true
       ON CONFLICT (dzien) DO UPDATE SET
         pro = max(main.dzien_limitu.pro, excluded.pro),
         zdarzenie_id = CASE WHEN excluded.zaczeto_ms < main.dzien_limitu.zaczeto_ms THEN excluded.zdarzenie_id ELSE main.dzien_limitu.zdarzenie_id END,
         zaczeto_ms = min(main.dzien_limitu.zaczeto_ms, excluded.zaczeto_ms)`);
    await tx.run(
      `INSERT INTO main.ustawienie (klucz, wartosc, zmieniono_ms) SELECT klucz, wartosc, zmieniono_ms FROM kopia.ustawienie
        WHERE klucz = 'okno_uczciwe_zasady_widziane' AND wartosc = 'true' ON CONFLICT (klucz) DO UPDATE SET wartosc = 'true'`);
    let konflikty = 0;
    for (const r of await wiersze(tx.all('SELECT DISTINCT licznik_id FROM kopia.zdarzenie'), 'scal')) {
      if ((await przeliczLicznik(tx, tekst(r, 'licznik_id'), terazMs)) === 'konflikt') konflikty += 1;
    }
    return konflikty;
  }, sygnal);
}
