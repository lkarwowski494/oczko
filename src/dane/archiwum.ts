// Archiwum `.oczko` (ADR-0004, dane.md „Kopie i eksport”): ZIP z manifest.json, oczko.db (VACUUM INTO) i pliki/<sha256>.<rozszerzenie>.
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22). ZIP i SHA-256 w TS (P-120 Q2a): src/dane/archiwum/.
import type { Powod, Wynik } from '../domena/bledy';
import type { ArchiwumSprawdzone, Katalogi, Licznosci, MagazynPlikow, Manifest, Migruj, PortArchiwum, PortBazy, RodzajKopiiPrzed, Zegar } from '../domena/porty';
import { ROZSZERZENIE_ARCHIWUM, WERSJA_FORMATU_ARCHIWUM, WERSJA_SCHEMATU, ZAPAS_MIEJSCA_EKSPORTU } from '../konfiguracja';
import { otworzPortExpo } from './baza/adapter-expo';
import { powodBledu } from './baza/bledy-sqlite';
import { kopiaBazy } from './baza/kopia';
import { scalZKopia, zastapZKopii } from './baza/przeniesienie';
import { sha256 } from './archiwum/sha256';
import { czytajKatalog, czytajWpis, wypakuj, zapiszZip } from './archiwum/zip';
import { istniejePlik, lista as listaPlikow, polacz, usunKatalog, usunPlik, utworzKatalog } from './pliki/system';
import { PLIK_BAZY } from './baza/sciezki';
import { sprawdzKopie } from './kopia-ratunkowa';
import { liczba, tekst, wiersze } from './repozytoria/wiersze';

const SHA = /^[0-9a-f]{64}$/;
const blad = (powod: Powod): { ok: false; powod: Powod } => ({ ok: false, powod });
const zapisNieudany = (e: unknown) => blad(powodBledu(e) === 'brak_miejsca' ? 'brak_miejsca' : 'zapis');

async function licznosci(port: PortBazy): Promise<Licznosci> {
  const w: Licznosci = {};
  for (const r of await wiersze(port.all("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"), 'licznosci')) {
    const t = tekst(r, 'name');
    const [n] = await wiersze(port.all(`SELECT count(*) AS n FROM "${t.replace(/"/g, '""')}"`), 'licznosci');
    w[t] = n ? liczba(n, 'n') : 0;
  }
  return w;
}
/** N12-12 (P-197): kopia VACUUM INTO zdrowa przed spakowaniem — integrity_check = ok i pusty foreign_key_check; osobne połączenie tylko do odczytu,
 *  bez kontroli wersji (tryb awaryjny eksportuje bazę nowszą). */
async function kopiaZdrowa(sciezka: string): Promise<boolean> {
  const port = otworzPortExpo(sciezka, { tylkoOdczyt: true });
  try {
    const [i] = await wiersze(port.all('PRAGMA integrity_check'), 'kopiaZdrowa');
    return !!i && tekst(i, 'integrity_check') === 'ok' && (await wiersze(port.all('PRAGMA foreign_key_check'), 'kopiaZdrowa')).length === 0;
  } finally { await port.zamknij(); }
}

async function licznosciPliku(sciezka: string): Promise<Licznosci> {
  const port = otworzPortExpo(sciezka, { tylkoOdczyt: true });
  try { return await licznosci(port); } finally { await port.zamknij(); }
}
/** `PRAGMA user_version` migawki, która trafia do archiwum (N12-07, dane.md): w trybie awaryjnym baza bywa niezmigrowana, więc nie stała aplikacji. */
async function wersjaPliku(sciezka: string): Promise<number> {
  const port = otworzPortExpo(sciezka, { tylkoOdczyt: true });
  try { const [v] = await wiersze(port.all('PRAGMA user_version'), 'wersjaPliku'); return v ? liczba(v, 'user_version') : 0; } finally { await port.zamknij(); }
}

/** manifest.json z `unknown` (plik z zewnątrz): zły kształt → null (= „bledne_dane”), bez zgadywania pól. */
function parsujManifest(b: Uint8Array): Manifest | null {
  let v: unknown;
  try { v = JSON.parse(new TextDecoder().decode(b)); } catch { return null; }
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return null;
  if (!('format' in v) || v.format !== 'oczko') return null;
  if (!('wersja_formatu' in v) || typeof v.wersja_formatu !== 'number' || !('wersja_schematu' in v) || typeof v.wersja_schematu !== 'number') return null;
  if (!('aplikacja' in v) || typeof v.aplikacja !== 'string' || !('utworzono' in v) || typeof v.utworzono !== 'number') return null;
  if (!('licznosci' in v) || typeof v.licznosci !== 'object' || v.licznosci === null) return null;
  const licz: Licznosci = {};
  for (const [k, n] of Object.entries(v.licznosci)) { if (typeof n !== 'number') return null; licz[k] = n; }
  if (!('pliki' in v) || !Array.isArray(v.pliki)) return null;
  const pliki: Manifest['pliki'] = [];
  for (const p of v.pliki) {
    if (typeof p !== 'object' || p === null || !('sha256' in p) || typeof p.sha256 !== 'string' || !('bajty' in p) || typeof p.bajty !== 'number') return null;
    pliki.push({ sha256: p.sha256, bajty: p.bajty });
  }
  return { format: 'oczko', wersja_formatu: v.wersja_formatu, wersja_schematu: v.wersja_schematu, aplikacja: v.aplikacja, utworzono: v.utworzono, licznosci: licz, pliki };
}

/**
 * Nazwa nowego archiwum dnia (ADR-0032 pkt 6, przegląd M1-013): przyrostek o jeden większy od największego istniejącego tego dnia, nie pierwszy wolny.
 * Pierwsza wolna nazwa wypełniała lukę po kopii usuniętej przez pulę, więc najnowsza kopia wyglądała na starszą i znikała przy następnym sprzątaniu.
 */
export function nazwaArchiwum(istniejace: readonly string[], przedrostek: string, dzien: string): string {
  const baza = `${przedrostek}-${dzien}`;
  let maks = 0;
  for (const n of istniejace) {
    if (!n.startsWith(baza) || !n.endsWith(ROZSZERZENIE_ARCHIWUM)) continue;
    const reszta = n.slice(baza.length, n.length - ROZSZERZENIE_ARCHIWUM.length); // '' albo '-<n>'
    if (reszta === '') maks = Math.max(maks, 1);
    else if (/^-\d+$/.test(reszta)) maks = Math.max(maks, Number(reszta.slice(1)));
  }
  return maks === 0 ? `${przedrostek}-${dzien}${ROZSZERZENIE_ARCHIWUM}` : `${przedrostek}-${dzien}-${maks + 1}${ROZSZERZENIE_ARCHIWUM}`;
}

/** M1-113: wolne miejsce nieznane (`null`, platforma nie podała) nie jest brakiem miejsca — zapis idzie, a jego błąd ma własną ścieżkę (plik usunięty, `zapis`). */
const zaMaloMiejsca = (wolne: number | null, potrzebne: number): boolean => wolne !== null && wolne < potrzebne;

export function utworzArchiwum(z: { baza: PortBazy; magazyn: MagazynPlikow; zegar: Zegar; katalogi: Katalogi; migruj: Migruj; aplikacja: string; skrot?: (sciezka: string) => Promise<string> }): PortArchiwum {
  async function potrzebneMiejsce(): Promise<number> {
    const [s] = await wiersze(z.baza.all('SELECT (SELECT page_count FROM pragma_page_count()) * (SELECT page_size FROM pragma_page_size()) AS bajty'), 'miejsce');
    const [p] = await wiersze(z.baza.all('SELECT coalesce(sum(bajty), 0) AS bajty FROM plik'), 'miejsce');
    return ((s ? liczba(s, 'bajty') : 0) + (p ? liczba(p, 'bajty') : 0)) * ZAPAS_MIEJSCA_EKSPORTU;
  }

  const archiwum: PortArchiwum = {
    /** VACUUM INTO + pliki + manifest; przed zapisem sprawdzenie miejsca, po błędzie żaden plik nie zostaje w katalogu docelowym. */
    async zapisz(katalogDocelowy, opcje) {
      if (zaMaloMiejsca(await z.magazyn.wolneMiejsce(), await potrzebneMiejsce())) return blad('brak_miejsca'); // ADR-0004, ŚU-17
      const teraz = z.zegar.teraz();
      const baza = polacz(z.katalogi.tymczasowy, `eksport-${teraz.ms}.db`);
      const przedrostek = opcje?.przedrostek ?? 'oczko';
      let cel: string | null = null; // ustawiany dopiero na nazwę, która nie istnieje — tylko taki plik wolno usunąć po błędzie
      try {
        utworzKatalog(katalogDocelowy); // Documents/Backup powstaje przy pierwszej kopii (idempotentnie); błąd → 'zapis' poniżej
        let nowy = polacz(katalogDocelowy, nazwaArchiwum(listaPlikow(katalogDocelowy), przedrostek, teraz.dzien)); // ADR-0032 pkt 6: przyrostek rośnie
        for (let i = 2; istniejePlik(nowy); i++) nowy = polacz(katalogDocelowy, `${przedrostek}-${teraz.dzien}-${i}${ROZSZERZENIE_ARCHIWUM}`); // nigdy nie nadpisuje
        cel = nowy;
        const k = await kopiaBazy(z.baza, baza);
        if (!k.ok) return k;
        if (!(await kopiaZdrowa(baza))) return blad('uszkodzony'); // nie udostępniamy uszkodzonej kopii jako zapasowej (N12-12)
        const pliki = (await wiersze(z.baza.all('SELECT sha256, rozszerzenie, bajty FROM plik ORDER BY sha256'), 'eksport'))
          .map((r) => ({ sha256: tekst(r, 'sha256'), rozszerzenie: tekst(r, 'rozszerzenie'), bajty: liczba(r, 'bajty') }));
        const manifest: Manifest = {
          format: 'oczko', wersja_formatu: WERSJA_FORMATU_ARCHIWUM, wersja_schematu: await wersjaPliku(baza), aplikacja: z.aplikacja, utworzono: teraz.ms,
          licznosci: await licznosciPliku(baza), // liczności z migawki, która trafia do archiwum
          pliki: pliki.map((p) => ({ sha256: p.sha256, bajty: p.bajty })),
        };
        const zip = zapiszZip(cel, [
          { nazwa: 'manifest.json', dane: new TextEncoder().encode(JSON.stringify(manifest)) },
          { nazwa: PLIK_BAZY, plik: baza },
          ...pliki.map((p) => ({ nazwa: `pliki/${p.sha256}.${p.rozszerzenie}`, plik: z.magazyn.sciezka(p.sha256) })),
        ]);
        if (!zip.ok) return zip; // za_duze (bez ZIP64, ADR-0016): plik archiwum nie powstał albo został usunięty
        return { ok: true, wartosc: { sciezka: cel, manifest } };
      } catch (e) {
        if (cel !== null) usunPlik(cel);
        return zapisNieudany(e);
      } finally {
        usunPlik(baza);
      }
    },

    /** Manifest, wersje, miejsce, SHA-256 i CRC w katalogu tymczasowym; baza bez zmian. Plik obcy → `bledne_dane`, zły skrót → `uszkodzony`. */
    async sprawdz(sciezka) {
      const kat = istniejePlik(sciezka) ? czytajKatalog(sciezka) : null;
      if (!kat) return blad('bledne_dane');
      const wpisManifestu = kat.find((w) => w.nazwa === 'manifest.json');
      const surowy = wpisManifestu ? czytajWpis(sciezka, wpisManifestu) : null;
      const manifest = surowy ? parsujManifest(surowy) : null;
      if (!manifest) return blad('bledne_dane');
      if (manifest.wersja_formatu > WERSJA_FORMATU_ARCHIWUM || manifest.wersja_schematu > WERSJA_SCHEMATU) return blad('wersja_nowsza'); // bez zapisu (ŚU-10)
      const wpisBazy = kat.find((w) => w.nazwa === PLIK_BAZY);
      if (!wpisBazy) return blad('bledne_dane');
      const wpisyPlikow = kat.filter((w) => w.nazwa.startsWith('pliki/'));
      const rozmiarDanych = kat.reduce((s, w) => s + w.rozmiar, 0);
      if (zaMaloMiejsca(await z.magazyn.wolneMiejsce(), rozmiarDanych * ZAPAS_MIEJSCA_EKSPORTU)) return blad('brak_miejsca');
      const katalog = polacz(z.katalogi.tymczasowy, `import-${z.zegar.teraz().ms}`);
      try {
        utworzKatalog(polacz(katalog, 'pliki'));
        if (!wypakuj(sciezka, wpisBazy, polacz(katalog, PLIK_BAZY))) return odrzuc(katalog, 'uszkodzony');
        const zManifestu = new Set(manifest.pliki.map((p) => `${p.sha256}:${p.bajty}`));
        const wArchiwum = new Set<string>();
        for (const w of wpisyPlikow) {
          const m = /^pliki\/([0-9a-f]{64})\.([A-Za-z0-9]+)$/.exec(w.nazwa);
          if (!m || !SHA.test(m[1])) return odrzuc(katalog, 'uszkodzony');
          const plik = polacz(katalog, w.nazwa);
          if (z.skrot) { // P-130: na urządzeniu natywny SHA-256 strumieniowo po rozpakowaniu; w TS w trakcie rozpakowania
            if (!wypakuj(sciezka, w, plik) || (await z.skrot(plik)) !== m[1]) return odrzuc(katalog, 'uszkodzony'); // R-067
          } else {
            const s = sha256();
            if (!wypakuj(sciezka, w, plik, (b) => s.dodaj(b)) || s.wynik() !== m[1]) return odrzuc(katalog, 'uszkodzony'); // R-067
          }
          wArchiwum.add(`${m[1]}:${w.rozmiar}`);
        }
        if (zManifestu.size !== wArchiwum.size || [...zManifestu].some((p) => !wArchiwum.has(p))) return odrzuc(katalog, 'uszkodzony');
        const baza = await sprawdzKopie(polacz(katalog, PLIK_BAZY));
        if (!baza.ok) return odrzuc(katalog, baza.powod);
        return { ok: true, wartosc: { manifest, katalog } };
      } catch (e) {
        return odrzuc(katalog, powodBledu(e) === 'brak_miejsca' ? 'brak_miejsca' : 'zapis');
      }
    },

    /** Kopia bezpieczeństwa (ADR-0028, P-328): pełne archiwum `.oczko` (baza + pliki + manifest) w Documents/Backup, widoczne w Plikach; nie nadpisuje. */
    async kopiaPrzed(rodzaj: RodzajKopiiPrzed = 'importem') {
      const k = await archiwum.zapisz(z.katalogi.kopiePrzed, { przedrostek: `oczko-przed-${rodzaj}` });
      return k.ok ? { ok: true, wartosc: { sciezka: k.wartosc.sciezka } } : k;
    },

    /** Migracja kopii tym samym runnerem → pliki do magazynu → dane (zastąp albo scal) w kolejce portu; katalog tymczasowy usuwany na końcu. */
    async wczytaj(a: ArchiwumSprawdzone, tryb, sygnal) {
      const db = polacz(a.katalog, PLIK_BAZY);
      try {
        const port = otworzPortExpo(db);
        try {
          const m = await z.migruj(port);
          if (!m.ok) return m;
        } finally {
          await port.zamknij();
        }
        for (const nazwa of plikiKatalogu(a)) {
          const r = await z.magazyn.zapisz(polacz(a.katalog, 'pliki', nazwa), nazwa.slice(nazwa.indexOf('.') + 1));
          if (!r.ok) return r;
        }
        if (tryb === 'zastap') await zastapZKopii(z.baza, db, sygnal);
        else await scalZKopia(z.baza, db, z.zegar.teraz().ms, sygnal);
        return { ok: true, wartosc: { licznosci: await licznosci(z.baza) } };
      } catch (e) {
        return zapisNieudany(e);
      } finally {
        usunKatalog(a.katalog);
      }
    },
  };
  return archiwum;

  function plikiKatalogu(a: ArchiwumSprawdzone): string[] {
    return a.manifest.pliki.map((p) => {
      const n = listaPlikow(polacz(a.katalog, 'pliki')).find((x) => x.startsWith(`${p.sha256}.`));
      if (!n) throw new Error(`archiwum: brak pliku ${p.sha256} po sprawdzeniu`); // stan niemożliwy: sprawdz porównał zbiory
      return n;
    });
  }
}
function odrzuc(katalog: string, powod: Powod): { ok: false; powod: Powod } {
  usunKatalog(katalog);
  return blad(powod);
}
