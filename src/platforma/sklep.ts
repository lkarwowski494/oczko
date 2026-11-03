// Adapter portu Sklep na expo-iap 5.8.1 (ADR-0010, P-036, wzór Treningu lib/store-native.ts): uprawnienia tylko z bieżących transakcji
// (getAvailablePurchases z onlyIncludeActiveItemsIOS = Transaction.currentEntitlements), karencja płatności z renewalInfoIOS albo — dla
// subskrypcji w karencji, której lista aktywnych nie zawiera — z subscriptionStatusIOS (P-103 (2a), KP-06). Dostępu adapter nie liczy (dostep.ts).
// Bez verifyPurchaseWithProvider i usług zewnętrznych (ADR-0010 „Brak żądań sieciowych poza StoreKit”). Sztuczny sklep: sklep-sztuczny.ts.
import type { Wynik } from '../domena/bledy';
import type { Produkt, Sklep, StatusZakupu, Transakcja } from '../domena/porty';
import { PRODUKT_DOZYWOTNI, PRODUKTY_PRO } from '../konfiguracja';
import { sklepSztuczny, type ZapisSklepu } from './sklep-sztuczny';

/** Podzbiór expo-iap używany przez adapter (typy paczki 5.8.1: build/index.d.ts, build/types.d.ts). */
export interface ModulIap {
  initConnection(): Promise<boolean>;
  fetchProducts(req: { skus: string[]; type: 'all' }): Promise<unknown[] | null | undefined>;
  requestPurchase(req: { request: { apple: { sku: string } }; type: 'subs' | 'in-app' }): Promise<unknown>;
  getAvailablePurchases(o: { onlyIncludeActiveItemsIOS: boolean }): Promise<unknown[]>;
  restorePurchases(): Promise<void>;
  finishTransaction(a: { purchase: unknown; isConsumable: boolean }): Promise<void>;
  purchaseUpdatedListener(l: (p: unknown) => void): { remove(): void };
  purchaseErrorListener(l: (e: unknown) => void): { remove(): void };
  subscriptionStatusIOS(sku: string): Promise<unknown[]>;
}

const liczba = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const pole = (o: unknown, k: string): unknown => (typeof o === 'object' && o !== null && k in o ? Reflect.get(o, k) : undefined);

/** Zakup ze StoreKit → Transakcja; obcy produkt albo subskrypcja bez daty końca → null (brak zostaje brakiem, nie „bez końca”). */
export function transakcjaZZakupu(p: unknown): Transakcja | null {
  const produkt = pole(p, 'productId');
  if (typeof produkt !== 'string' || !PRODUKTY_PRO.includes(produkt)) return null;
  const wygasa = produkt === PRODUKT_DOZYWOTNI ? null : liczba(pole(p, 'expirationDateIOS'));
  if (produkt !== PRODUKT_DOZYWOTNI && wygasa === null) return null;
  return { produkt, wygasa, odebrane: liczba(pole(p, 'revocationDateIOS')) !== null, karencjaDo: liczba(pole(pole(p, 'renewalInfoIOS'), 'gracePeriodExpirationDate')) };
}
/** Produkt ze StoreKit → Produkt; cena tylko `displayPrice` Apple (P-089 (1)); obcy identyfikator → null. */
export function produktZeSklepu(p: unknown): Produkt | null {
  const id = pole(p, 'id'), cena = pole(p, 'displayPrice'), jednostka = pole(p, 'subscriptionPeriodUnitIOS');
  if (typeof id !== 'string' || !PRODUKTY_PRO.includes(id) || typeof cena !== 'string' || !cena) return null;
  const okres = id === PRODUKT_DOZYWOTNI ? 'dozywotni' : jednostka === 'year' ? 'rok' : jednostka === 'month' ? 'miesiac' : null;
  return okres ? { id, cenaWyswietlana: cena, okres } : null;
}
/** Kod błędu expo-iap → status zakupu (anulowanie i oczekiwanie nie są błędem, MON-04). */
export function statusZBledu(e: unknown): StatusZakupu {
  const k = String(pole(e, 'code') ?? '');
  return k === 'user-cancelled' ? 'anulowany' : k === 'pending' || k === 'deferred-payment' ? 'oczekujacy' : 'blad';
}

async function biezace(m: ModulIap, terazMs: () => number): Promise<Transakcja[]> {
  const lista = (await m.getAvailablePurchases({ onlyIncludeActiveItemsIOS: true })).map(transakcjaZZakupu).filter((t): t is Transakcja => t !== null);
  let bladStatusu: unknown = null;
  for (const sku of PRODUKTY_PRO.filter((s) => s !== PRODUKT_DOZYWOTNI)) {
    if (lista.some((t) => t.produkt === sku && t.wygasa !== null && t.wygasa > terazMs())) continue;
    try {
      for (const st of await m.subscriptionStatusIOS(sku)) {
        const g = liczba(pole(pole(st, 'renewalInfo'), 'gracePeriodExpirationDate'));
        if (g !== null && g > terazMs()) lista.push({ produkt: sku, wygasa: g, odebrane: pole(st, 'state') === 'revoked', karencjaDo: g });
      }
    } catch (e) { bladStatusu ??= e; }
  }
  if (bladStatusu !== null && lista.length === 0) throw bladStatusu; // nie wiemy, czy ktoś jest w karencji: odczyt nieudany, nie „brak Pro”
  return lista;
}

export function sklepIap(m: ModulIap, terazMs: () => number = Date.now): Sklep {
  let polaczenie: Promise<boolean> | null = null;
  const polacz = () => (polaczenie ??= m.initConnection().catch((e: unknown) => { polaczenie = null; throw e; }));
  // Anulowanie i oczekiwanie nie są błędem (MON-04): status wybiera komunikat (komunikatZakupu, P-135 Q3a).
  async function kup(id: string): Promise<StatusZakupu> {
    try {
      await polacz();
      const r = await m.requestPurchase({ request: { apple: { sku: id } }, type: id === PRODUKT_DOZYWOTNI ? 'in-app' : 'subs' });
      for (const p of Array.isArray(r) ? r : r ? [r] : []) await m.finishTransaction({ purchase: p, isConsumable: false }).catch(() => undefined);
      return 'sukces';
    } catch (e) {
      return statusZBledu(e);
    }
  }
  return {
    async produkty() {
      await polacz();
      return ((await m.fetchProducts({ skus: [...PRODUKTY_PRO], type: 'all' })) ?? []).map(produktZeSklepu).filter((p): p is Produkt => p !== null);
    },
    kup,
    async przywroc(): Promise<Wynik<void>> {
      try { await polacz(); await m.restorePurchases(); return { ok: true, wartosc: undefined }; } catch { return { ok: false, powod: 'zapis' }; }
    },
    async transakcje() { await polacz(); return biezace(m, terazMs); },
    obserwuj(fn) {
      let subskrypcje: { remove(): void }[] = [];
      let wylaczone = false;
      void polacz().then(() => {
        if (wylaczone) return;
        subskrypcje = [
          m.purchaseUpdatedListener((p) => { void m.finishTransaction({ purchase: p, isConsumable: false }).catch(() => undefined).finally(fn); }),
          m.purchaseErrorListener(() => fn()),
        ];
      }, () => undefined);
      return () => { wylaczone = true; subskrypcje.forEach((s) => s.remove()); subskrypcje = []; };
    },
  };
}

/** Sklep aplikacji: sztuczny w buildzie E2E (`EXPO_PUBLIC_STORE_FAKE=1`, e2e/README.md), inaczej expo-iap ładowane leniwie. */
export function sklepAplikacji(zapisE2e?: ZapisSklepu, terazMs?: () => number): Sklep {
  if (process.env.EXPO_PUBLIC_STORE_FAKE === '1') return sklepSztuczny(terazMs, zapisE2e);
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- leniwie: w testach i bez modułu natywnego pakiet nie jest ładowany
  const m: ModulIap = require('expo-iap');
  return sklepIap(m);
}
