// Port `Synchronizacja` na urządzeniu (moduly.md „Kontrakt partii 7”, ADR-0005): wybór adaptera — moduł Swift `OczkoIcloud` (CKSyncEngine)
// albo atrapa buildu E2E przy EXPO_PUBLIC_ICLOUD_FAKE=1 (P-230 Q1a). Zmienną czytają tylko ten plik, `icloud-atrapa.ts` i `tryb-e2e.ts`
// (kontrola ATRAPA-ICLOUD). Atrapa ładowana `require` w gałęzi warunku na zmiennej w tym samym module (P-238, P-242): bez EXPO_PUBLIC_ICLOUD_FAKE=1
// Metro wycina gałąź i atrapa nie trafia do bundla wydania (`npm run jakosc:slady-wydania`).
import { requireOptionalNativeModule } from 'expo-modules-core';
import type { PartiaIcloud, PortBazy, PotwierdzenieIcloud, StanSynchronizacji, StatusKonta, Synchronizacja, Zegar, ZdarzenieKonta, ZmianaDoWyslania } from '../domena/porty';
import { ICLOUD_W_1_0 } from '../konfiguracja';
import { kluczeZJson, potwierdzeniaZJson, rekordyZJson } from '../domena/icloud/odwzorowanie';

export type ModulAtrapyIcloud = typeof import('./icloud-atrapa');
// eslint-disable-next-line @typescript-eslint/no-require-imports -- ładowanie warunkowe (P-238, P-242), jak paneleE2e w tryb-e2e.ts
const atrapa: ModulAtrapyIcloud | null = process.env.EXPO_PUBLIC_ICLOUD_FAKE === '1' ? (require('./icloud-atrapa') as ModulAtrapyIcloud) : null;

/** Wiersz iCloud w Data and sync (P-242): bezpiecznik ZM-06 albo aktywna atrapa E2E; wydanie bez zmian do decyzji koordynatora. */
export const przelacznikIcloudWidoczny = (): boolean => ICLOUD_W_1_0 || atrapa !== null;

/** Licznik wysłanych rekordów i usunięcie strefy atrapy (panele `e2e-icloud-*`); null poza buildem E2E z atrapą. */
export type StanAtrapyIcloud = { wyslane: number; usuniete: boolean };
export type SilnikIcloud = Synchronizacja & { e2e: { stan(): StanAtrapyIcloud; obserwuj(fn: () => void): () => void } | null };

/** Most do modułu Swift `OczkoIcloud` (modules/oczko-icloud): JSON i base64 przez granicę; potwierdzenie partii po obsłudze w JS. */
export interface OczkoIcloudNatywny {
  statusKonta(): Promise<string>;
  uruchom(stanSilnika: string | null): Promise<void>;
  wyslij(zmianyJson: string): Promise<void>; // odrzucenie z `code`: 'brak_miejsca' | 'siec' | inne
  wylacz(): Promise<void>;
  usunStrefe(): Promise<void>;
  zakonczonoPartie(id: string, ok: boolean): void;
  addListener(nazwa: 'partia', fn: (e: { id: string; rekordy: string; usuniete: string; stanSilnika: string | null }) => void): { remove(): void };
  addListener(nazwa: 'wyslane', fn: (e: { id: string; wyslane: string; stanSilnika: string | null }) => void): { remove(): void };
  addListener(nazwa: 'konto', fn: (e: { zdarzenie: string }) => void): { remove(): void };
  addListener(nazwa: 'pobranie', fn: (e: { id: string; faza: string }) => void): { remove(): void }; // pełne pobranie strefy (ADR-0005 uzupełnienie 2026-11-03)
}

const STATUSY: readonly StatusKonta[] = ['dostepne', 'brak_konta', 'ograniczone', 'tymczasowo_niedostepne', 'nieznany'];
const KONTO: readonly ZdarzenieKonta[] = ['zalogowano', 'wylogowano', 'zmiana_konta'];
const FAZY = ['poczatek', 'koniec'] as const;
export function zBase64(t: string | null): Uint8Array | null {
  if (t === null) return null;
  const s = globalThis.atob(t);
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}
export function naBase64(b: Uint8Array | null): string | null {
  if (b === null) return null;
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return globalThis.btoa(s);
}

/** JSON z modułu Swift jako `unknown` (błąd składni → wyjątek: partia nieprzyjęta, stan silnika się nie przesuwa). */
function czytajJson(t: string): unknown {
  const v: unknown = JSON.parse(t);
  return v;
}

/** Adapter modułu Swift; `natywny` wstrzykiwany w testach. Kod błędu wysyłki przechodzi jako `kod` (sterownik: przyczyna stanu `blad`). */
export function silnikNatywny(natywny: OczkoIcloudNatywny): SilnikIcloud {
  let stan: StanSynchronizacji = 'wylaczona';
  const pod = <T>(nazwa: 'partia' | 'wyslane' | 'konto' | 'pobranie', fn: (e: T) => void): (() => void) => {
    const s = (natywny.addListener as (n: string, f: (e: T) => void) => { remove(): void })(nazwa, fn);
    return () => s.remove();
  };
  return {
    async wlacz() { stan = 'aktywna'; return { ok: true, wartosc: undefined }; },
    async wylacz() { stan = 'wylaczona'; await natywny.wylacz(); },
    stan: () => stan,
    async statusKonta() { const s = await natywny.statusKonta(); return STATUSY.find((x) => x === s) ?? 'nieznany'; },
    async uruchom(st) { stan = 'aktywna'; await natywny.uruchom(naBase64(st)); },
    async wyslij(zmiany: readonly ZmianaDoWyslania[]) {
      try { await natywny.wyslij(JSON.stringify(zmiany)); } catch (e) {
        const kod: unknown = typeof e === 'object' && e !== null ? Reflect.get(e, 'code') : null;
        stan = 'blad';
        throw { kod: kod === 'brak_miejsca' || kod === 'siec' ? kod : 'inny' };
      }
    },
    odbieraj(fn: (p: PartiaIcloud) => Promise<void>) {
      return pod<{ id: string; rekordy: string; usuniete: string; stanSilnika: string | null }>('partia', (e) => {
        // JSON z granicy: z `unknown`, zły element odrzucony (rekord spoza kontraktu nie wchodzi do bazy); zły JSON → partia nieprzyjęta
        const p = (async () => fn({ rekordy: rekordyZJson(czytajJson(e.rekordy)).rekordy, usuniete: kluczeZJson(czytajJson(e.usuniete)), stanSilnika: zBase64(e.stanSilnika) }))();
        void p.then(() => natywny.zakonczonoPartie(e.id, true), () => natywny.zakonczonoPartie(e.id, false)); // Swift czeka na wynik przed potwierdzeniem silnikowi
      });
    },
    wyslane(fn: (p: PotwierdzenieIcloud) => Promise<void>) {
      return pod<{ id: string; wyslane: string; stanSilnika: string | null }>('wyslane', (e) => {
        const p = (async () => fn({ wyslane: potwierdzeniaZJson(czytajJson(e.wyslane)), stanSilnika: zBase64(e.stanSilnika) }))();
        void p.then(() => natywny.zakonczonoPartie(e.id, true), () => natywny.zakonczonoPartie(e.id, false));
      });
    },
    pobieranie(fn: (faza: 'poczatek' | 'koniec') => Promise<void>) {
      return pod<{ id: string; faza: string }>('pobranie', (e) => {
        const faza = FAZY.find((x) => x === e.faza);
        if (!faza) { natywny.zakonczonoPartie(e.id, false); return; } // nieznana faza z granicy: nic nie zmienia
        void fn(faza).then(() => natywny.zakonczonoPartie(e.id, true), () => natywny.zakonczonoPartie(e.id, false));
      });
    },
    zdarzeniaKonta(fn) { return pod<{ zdarzenie: string }>('konto', (e) => { const z = KONTO.find((x) => x === e.zdarzenie); if (z) fn(z); }); },
    async usunStrefe() {
      try { await natywny.usunStrefe(); return { ok: true, wartosc: undefined }; } catch { return { ok: false, powod: 'zapis' }; }
    },
    e2e: null,
  };
}

/**
 * Silnik iCloud aplikacji: atrapa (build E2E z EXPO_PUBLIC_ICLOUD_FAKE=1; `tryb` = argument `oczkoE2eIcloud`), moduł Swift, albo null,
 * gdy modułu nie ma w buildzie (przed oknem maszyn) — wtedy synchronizacji nie ma i przełącznik nic nie robi poza komunikatem 04.
 */
export function silnikIcloud(o: { tryb: string | null; baza: PortBazy; zegar: Zegar; plik: { czytaj(): string | null; zapisz(t: string): void } }): SilnikIcloud | null {
  if (atrapa) return atrapa.atrapaIcloud(o);
  const n = requireOptionalNativeModule<OczkoIcloudNatywny>('OczkoIcloud');
  return n ? silnikNatywny(n) : null;
}
