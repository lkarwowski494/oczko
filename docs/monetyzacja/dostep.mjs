// Wzorzec logiki dostępu do Pro (rola 02, kontrakt płatności, 2026-10-22). Port 1:1 wzorca z modułu `storekit-expo`
// biblioteki `prompts` @97ec212 na JavaScript, żeby wektory dało się sprawdzić w Node bez kompilacji.
// Rola 08 przepisuje go na TypeScript w kodzie aplikacji; wektory w `wektory-dostepu.json` zostają kontraktem.
// Czysta funkcja: bez importów biblioteki płatności. Adapter (biblioteka z ADR roli 05) zamienia zweryfikowane
// transakcje sklepu na `Uprawnienie[]`, a pamięć podręczną zapisuje jako JSON.

import { BladDanych } from './limit.mjs';

/** @typedef {{ produkt: string, wygasa: number | null, odebrane: boolean, karencjaDo?: number | null }} Uprawnienie  wygasa: ms; null = bez końca; karencjaDo: koniec karencji płatności (Billing Grace Period, adapter z `renewalInfo.gracePeriodExpirationDate`; P-103 (2a)) */
/** @typedef {{ zrodlo: 'sklep', uprawnienia: Uprawnienie[] } | { zrodlo: 'blad' }} Odczyt  blad: brak sieci, sklep niedostępny */
/** @typedef {{ produkty: string[], wygasa: number | null } | null} Pamiec  ostatni udany odczyt sklepu */

/** Produkty, które odblokowują Pro (kontrakt płatności, model V4, P-057): dożywotni i dwie subskrypcje odnawiane; ID tymczasowe do konfiguracji App Store Connect (P-038, OP-24). */
export const ODBLOKOWUJA = Object.freeze(['oczko.pro.lifetime', 'oczko.pro.monthly', 'oczko.pro.yearly']);

/** Okno offline (P-103 (3a), jak Trening `OFFLINE_GRACE_DAYS = 7`): przy błędzie odczytu sklepu pamięć subskrypcji działa jeszcze 7 dni po `wygasa`
 * (odnowienie niepobrane bez sieci, zegar w przód). Wyjątek nazwany od MON-08; udany odczyt sklepu zawsze rozstrzyga (zwrot zabiera od razu). */
export const LASKA_OFFLINE_MS = 7 * 24 * 60 * 60 * 1000;

/** Koniec uprawnienia: późniejsza z dat `wygasa` i `karencjaDo` (P-103 (2a), Trening `entitlementEnd`); dożywotni (null) bez zmian. */
const koniec = (u) => (u.wygasa === null ? null : Math.max(u.wygasa, typeof u.karencjaDo === 'number' ? u.karencjaDo : -Infinity));
/** Pamięć (ostatni znany stan) ważna w chwili `teraz`, z oknem offline; koniec wyłączny. */
const pamiecWazna = (wygasa, teraz) => wygasa === null || teraz < wygasa + LASKA_OFFLINE_MS;

/**
 * @param {Odczyt} odczyt
 * @param {Pamiec} pamiec
 * @param {number} teraz
 * @param {readonly string[]} odblokowuja
 * @returns {{ dostep: boolean, powod: 'sklep' | 'pamiec' | 'brak', pamiec: Pamiec }}
 */
export function decyzja(odczyt, pamiec, teraz, odblokowuja) {
  if (odczyt.zrodlo === 'sklep') {
    // Sklep jest źródłem prawdy: zwrot albo odebranie zabiera dostęp, nawet gdy pamięć mówi inaczej.
    const wazne = odczyt.uprawnienia.filter((u) => !u.odebrane && odblokowuja.includes(u.produkt) && (koniec(u) === null || koniec(u) > teraz));
    const nowa = wazne.length
      ? { produkty: wazne.map((u) => u.produkt), wygasa: wazne.some((u) => koniec(u) === null) ? null : Math.max(...wazne.map(koniec)) }
      : null;
    return { dostep: nowa !== null, powod: nowa ? 'sklep' : 'brak', pamiec: nowa };
  }
  // Błąd odczytu to nie brak zakupu: ostatni znany stan do końca opłaconego okresu i okna offline (P-103 (3a)).
  const ok = pamiec !== null && pamiec.produkty.length > 0 && pamiecWazna(pamiec.wygasa, teraz);
  return { dostep: ok, powod: ok ? 'pamiec' : 'brak', pamiec };
}

/** @param {unknown} tekst @returns {Pamiec} */
export function odczytajPamiec(tekst) {
  if (typeof tekst !== 'string') return null;
  let x;
  try { x = JSON.parse(tekst); } catch { return null; }
  if (typeof x !== 'object' || x === null) return null;
  const produkty = Reflect.get(x, 'produkty');
  const wygasa = Reflect.get(x, 'wygasa');
  if (!Array.isArray(produkty) || !produkty.every((p) => typeof p === 'string')) return null;
  if (wygasa !== null && !(typeof wygasa === 'number' && Number.isFinite(wygasa))) return null;
  return { produkty, wygasa };
}

/** Komunikat po zakupie (MON-04, Z07-08 R-111): oczekujący (Ask to Buy, odroczona płatność) to „czeka”, nie błąd — dostęp przyjdzie z nasłuchu (KP-07);
 * anulowany nie pokazuje nic (bez fałszywego sukcesu). @param {'sukces' | 'oczekujacy' | 'anulowany' | 'blad'} status */
const KOMUNIKATY = { sukces: 'sukces', oczekujacy: 'czeka', anulowany: null, blad: 'blad' };
export function komunikatZakupu(status) {
  if (!Object.hasOwn(KOMUNIKATY, status)) throw new BladDanych(`komunikatZakupu: nieznany status ${status}`);
  return KOMUNIKATY[status];
}

/**
 * Pro na zegarku (ADR-0009 D, P-103 (4a), R-031): Pro, gdy którekolwiek źródło je potwierdza.
 * Kontekst z telefonu `{ zrodlo: 'telefon', pro, wygasa }` jak pamięć (null = dożywotni, okno offline); `pro: false` nigdy nie daje Pro.
 * StoreKit zegarka `{ zrodlo: 'zegarek', uprawnienia }` jak odczyt sklepu (`decyzja`).
 * @param {Array<{ zrodlo: 'telefon', pro: boolean, wygasa: number | null } | { zrodlo: 'zegarek', uprawnienia: Uprawnienie[] }>} zrodla
 * @param {number} teraz
 */
export function proZegarka(zrodla, teraz) {
  if (!Array.isArray(zrodla) || !Number.isFinite(teraz)) throw new BladDanych('proZegarka: złe dane wejściowe');
  return zrodla.map((z) => {
    if (z?.zrodlo === 'telefon') {
      if (typeof z.pro !== 'boolean' || !(z.wygasa === null || Number.isFinite(z.wygasa))) throw new BladDanych('proZegarka: zły kontekst telefonu');
      return z.pro && pamiecWazna(z.wygasa, teraz);
    }
    if (z?.zrodlo === 'zegarek' && Array.isArray(z.uprawnienia)) return decyzja({ zrodlo: 'sklep', uprawnienia: z.uprawnienia }, null, teraz, ODBLOKOWUJA).dostep;
    throw new BladDanych('proZegarka: nieznane źródło');
  }).some(Boolean);
}
