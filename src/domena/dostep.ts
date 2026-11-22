// Dostęp do Pro z bieżących uprawnień (kontrakt płatności). Wzorzec: docs/monetyzacja/dostep.mjs; wyrocznia: wektory-dostepu.json.
// Czysta funkcja: adapter sklepu (ADR-0010) zamienia transakcje na `Uprawnienie[]`, a pamięć zapisuje jako JSON (`odczytajPamiec`).
import { BladDanych } from './bledy';
import { OKNO_OFFLINE_PRO_MS } from '../konfiguracja';

export type Uprawnienie = { produkt: string; wygasa: number | null; odebrane: boolean; karencjaDo?: number | null }; // karencjaDo: P-103 (2a), = Transakcja w porty.ts
export type Odczyt = { zrodlo: 'sklep'; uprawnienia: Uprawnienie[] } | { zrodlo: 'blad' };
export type Pamiec = { produkty: string[]; wygasa: number | null } | null;
export type DecyzjaDostepu = { dostep: boolean; powod: 'sklep' | 'pamiec' | 'brak'; pamiec: Pamiec };

/** Koniec uprawnienia: późniejsza z dat `wygasa` i `karencjaDo` (P-103 (2a)); dożywotni (null) bez zmian. */
function koniec(u: Uprawnienie): number | null {
  if (u.wygasa === null) return null;
  return typeof u.karencjaDo === 'number' ? Math.max(u.wygasa, u.karencjaDo) : u.wygasa;
}
/** Pamięć ważna w chwili `teraz`, z oknem offline; koniec wyłączny (W-20b). */
function pamiecWazna(wygasa: number | null, teraz: number): boolean {
  return wygasa === null || teraz < wygasa + OKNO_OFFLINE_PRO_MS;
}

export function decyzja(o: Odczyt, p: Pamiec, teraz: number, odblokowuja: readonly string[]): DecyzjaDostepu {
  if (o.zrodlo === 'sklep') {
    // Sklep jest źródłem prawdy: zwrot albo odebranie zabiera dostęp, nawet gdy pamięć mówi inaczej (KP-06).
    const wazne = o.uprawnienia.filter((u) => {
      const k = koniec(u);
      return !u.odebrane && odblokowuja.includes(u.produkt) && (k === null || k > teraz);
    });
    if (wazne.length === 0) return { dostep: false, powod: 'brak', pamiec: null };
    const konce = wazne.map(koniec);
    const wygasa = konce.some((k) => k === null) ? null : Math.max(...konce.filter((k): k is number => k !== null));
    return { dostep: true, powod: 'sklep', pamiec: { produkty: wazne.map((u) => u.produkt), wygasa } };
  }
  // Błąd odczytu to nie brak zakupu: ostatni znany stan do końca opłaconego okresu i okna offline (P-103 (3a)).
  const ok = p !== null && p.produkty.length > 0 && pamiecWazna(p.wygasa, teraz);
  return { dostep: ok, powod: ok ? 'pamiec' : 'brak', pamiec: p };
}

/** Pamięć podręczna z zapisu JSON; każdy zły kształt (także brak klucza `wygasa`, P-07) → null (nie „Pro bez końca”). */
export function odczytajPamiec(tekst: unknown): Pamiec {
  if (typeof tekst !== 'string') return null;
  let x: unknown;
  try {
    x = JSON.parse(tekst);
  } catch {
    return null;
  }
  if (typeof x !== 'object' || x === null || !('produkty' in x) || !('wygasa' in x)) return null;
  const { produkty, wygasa } = x;
  if (!Array.isArray(produkty)) return null;
  const lista: string[] = [];
  for (const p of produkty) {
    if (typeof p !== 'string') return null;
    lista.push(p);
  }
  if (wygasa !== null && !(typeof wygasa === 'number' && Number.isFinite(wygasa))) return null;
  return { produkty: lista, wygasa };
}

export type StatusZakupu = 'sukces' | 'oczekujacy' | 'anulowany' | 'blad';
export type KomunikatZakupu = 'sukces' | 'czeka' | 'blad' | null;
const KOMUNIKATY: Record<StatusZakupu, KomunikatZakupu> = { sukces: 'sukces', oczekujacy: 'czeka', anulowany: null, blad: 'blad' };
function czyStatus(s: string): s is StatusZakupu {
  return Object.hasOwn(KOMUNIKATY, s);
}
/** Komunikat po zakupie (MON-04, Z07-08 R-111; wektory K-*): oczekujący to „czeka”, anulowany bez komunikatu; nieznany status → BladDanych. */
export function komunikatZakupu(status: string): KomunikatZakupu {
  if (!czyStatus(status)) throw new BladDanych(`komunikatZakupu: nieznany status ${status}`);
  return KOMUNIKATY[status];
}
