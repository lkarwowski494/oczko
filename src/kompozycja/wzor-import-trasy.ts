// Dodawanie wzoru na trasie „/wzor” (app/wzor.tsx): źródło (plik, skan, zdjęcia, adres, panel E2E) → `dodajWzor`; strona WWW bez sieci czeka w skrzynce.
// Wydzielone z trasy bez zmiany zachowania (M1-audytor-generalny-106, DEC-30 a: trasy poniżej 20 KB). Teksty i alerty: `wzor-dodawanie.ts`.
import { Alert, Linking } from 'react-native';
import { rodzajPliku } from '../domena/rodzaj-pliku';
import type { ZrodloDodaniaEkranu } from '../ekrany/WzorGrupa';
import type { WidokLicznika } from '../przypadki-uzycia/widok-licznika';
import { dodajWzor, type ZrodloDodania } from '../przypadki-uzycia/wzor';
import { wybierzPlikWzoru } from '../platforma/system-plikow-uzytkownika';
import { wybieraczZdjec } from '../platforma/zdjecia';
import type { Kontener } from './kontener';
import { krotkaData } from './projekt';
import { alertImportu, alertSkanu, nazwaDomyslna } from './wzor-dodawanie';

export type ZrodloDodaniaTrasy = ZrodloDodaniaEkranu | { rodzaj: 'adres'; adres: string } | { rodzaj: 'gotowe'; nazwa: string; zrodlo: ZrodloDodania };

/** Stan i odczyt ekranu, których potrzebuje dodawanie: setery stanu trasy, odświeżenie widoku i powrót z trasy z parametrem `dodaj`. */
export type KontekstDodania = {
  kontener: Kontener;
  lw: WidokLicznika;
  dodajParam: string | undefined;
  wczytaj: (wybrany?: string) => Promise<void>;
  wstecz: () => void;
  ustawImport: (nazwa: string | null) => void;
  ustawLink: (otwarty: boolean) => void;
  ustawLinkAdres: (adres: string) => void;
};

export function pokazAlertImportu(a: { tytul: string; opis: string } | null, t: Kontener['j']['t']): void {
  if (a) Alert.alert(a.tytul, a.opis || undefined, [{ text: t('wspolne.ok') }]);
}

export async function dodajZrodlo(c: KontekstDodania, zrodlo: ZrodloDodaniaTrasy): Promise<void> {
  const { kontener, lw } = c;
  const zw = kontener.wzor.z;
  const { t } = kontener.j;
  const pokaz = (a: { tytul: string; opis: string } | null) => pokazAlertImportu(a, t);
  const data = krotkaData(zw.zegar.teraz().dzien, kontener.j.jezyk());
  let z: ZrodloDodania | null = null, nazwa = '', plik = '';
  if (typeof zrodlo === 'object') {
    if (zrodlo.rodzaj === 'adres') { z = { rodzaj: 'adres', adres: zrodlo.adres }; nazwa = nazwaDomyslna(zrodlo, t, data); plik = nazwa; }
    else { z = zrodlo.zrodlo; nazwa = zrodlo.nazwa; } // źródło złożone przez panel buildu E2E (tryb-e2e.ts, P-238)
  } else if (zrodlo === 'link') { c.ustawLink(true); return; }
  else if (zrodlo === 'plik') {
    const p = await wybierzPlikWzoru();
    if (!p) return;
    const rodzaj = rodzajPliku(p.nazwa, p.typ); // jedna reguła rozszerzeń (ADR-0031 pkt 5): Word = .docx, .doc → „can’t add this type”
    if (rodzaj !== 'pdf' && rodzaj !== 'word') { pokaz(alertImportu('bledne_dane', p.nazwa, t)); return; }
    z = { rodzaj, plik: { id: p.nazwa, nazwa: p.nazwa, sciezka: p.sciezka, typ: p.typ } };
    nazwa = nazwaDomyslna({ rodzaj: 'plik', nazwa: p.nazwa }, t, data); plik = p.nazwa;
  } else if (zrodlo === 'skan') {
    const s = await kontener.wzor.platforma.skanuj();
    if (!s.ok) { // W11 :664: brak aparatu → „Open Settings” / „Cancel”
      const a = alertSkanu(s.powod, t);
      if (a?.ustawienia) Alert.alert(a.tytul, a.opis, [{ text: t('wspolne.anuluj'), style: 'cancel' }, { text: t('zdjecia.otworz_ustawienia'), onPress: () => void Linking.openSettings() }]);
      else pokaz(a);
      return;
    }
    z = { rodzaj: 'obrazy', sciezki: s.wartosc.sciezki }; nazwa = nazwaDomyslna({ rodzaj: 'skan' }, t, data);
  } else {
    const s = await wybieraczZdjec().wybierzStrony();
    if (s.rodzaj !== 'zdjecia') { if (s.rodzaj === 'blad') pokaz(alertImportu('zapis', '', t)); return; }
    z = { rodzaj: 'obrazy', sciezki: s.sciezki }; nazwa = nazwaDomyslna({ rodzaj: 'zdjecia' }, t, data);
  }
  if (!z) return;
  c.ustawImport(nazwa);
  const r = await dodajWzor(zw, { projektId: lw.projektId, nazwa, zrodlo: z }).finally(() => c.ustawImport(null));
  if (r.ok) { await kontener.wzor.k.odswiezMigawke(); await c.wczytaj(r.wartosc.wzorId); }
  else if (r.powod === 'brak_sieci' && z.rodzaj === 'adres') await zapiszCzekanieNaSiec(c, z.adres, nazwa, lw.projektId);
  else pokaz(alertImportu(r.powod, plik, t));
}

/**
 * Strona WWW bez sieci (BR-WZR-007 S3, ADR-0031 pkt 3): zlecenie do skrzynki (zapis sam po powrocie sieci), wiersz „czeka na sieć”, bez pustego wzoru. Z ekranu projektu
 * („Add pattern”, parametr `dodaj`) wracamy tam, gdzie wiersz widać; przy błędzie zapisu alert i arkusz linku z wpisanym adresem.
 */
export async function zapiszCzekanieNaSiec(c: KontekstDodania, adres: string, nazwa: string, projektId: string): Promise<void> {
  const w = await c.kontener.wzor.k.czekajNaSiec({ projektId, adres, nazwa });
  if (w.ok) { if (c.dodajParam) c.wstecz(); return; }
  pokazAlertImportu(alertImportu(w.powod, '', c.kontener.j.t), c.kontener.j.t);
  c.ustawLinkAdres(adres);
  c.ustawLink(true);
}
