// Adapter Sklep na expo-iap 5.8.1 (ADR-0010, P-103, KP-06; test roli 08 na atrapie modułu zgodnej z typami paczki): mapowanie zakupów
// i produktów, karencja płatności (także subskrypcja w karencji spoza listy aktywnych), błąd odczytu ≠ brak Pro, statusy zakupu.
import { produktZeSklepu, sklepIap, statusZBledu, transakcjaZZakupu, type ModulIap } from '../../src/platforma/sklep';
import { sklepSztuczny } from '../../src/platforma/sklep-sztuczny';

const TERAZ = 1_800_000_000_000;
function atrapa(o: { zakupy?: unknown[]; statusy?: Record<string, unknown[] | Error>; zakup?: unknown } = {}): ModulIap {
  return {
    initConnection: async () => true,
    fetchProducts: async () => [
      { id: 'oczko.pro.monthly', displayPrice: '0,99 zł', subscriptionPeriodUnitIOS: 'month' },
      { id: 'oczko.pro.yearly', displayPrice: '6,99 zł', subscriptionPeriodUnitIOS: 'year' },
      { id: 'oczko.pro.lifetime', displayPrice: '14,99 zł' },
      { id: 'obcy.produkt', displayPrice: '1 zł' },
    ],
    requestPurchase: async () => { if (o.zakup instanceof Error) throw o.zakup; return o.zakup ?? { productId: 'oczko.pro.lifetime' }; },
    getAvailablePurchases: async () => o.zakupy ?? [],
    restorePurchases: async () => undefined,
    finishTransaction: async () => undefined,
    purchaseUpdatedListener: () => ({ remove: () => undefined }),
    purchaseErrorListener: () => ({ remove: () => undefined }),
    subscriptionStatusIOS: async (sku) => { const s = o.statusy?.[sku]; if (s instanceof Error) throw s; return s ?? []; },
  };
}
const blad = (code: string) => Object.assign(new Error(code), { code });

describe('mapowanie StoreKit → porty', () => {
  test('zakupy: dożywotni bez końca, subskrypcja z wygasa i karencjaDo z renewalInfoIOS, zwrot = odebrane; obcy i subskrypcja bez daty → null', () => {
    expect(transakcjaZZakupu({ productId: 'oczko.pro.lifetime' })).toEqual({ produkt: 'oczko.pro.lifetime', wygasa: null, odebrane: false, karencjaDo: null });
    expect(transakcjaZZakupu({ productId: 'oczko.pro.monthly', expirationDateIOS: TERAZ, renewalInfoIOS: { gracePeriodExpirationDate: TERAZ + 5 } }))
      .toEqual({ produkt: 'oczko.pro.monthly', wygasa: TERAZ, odebrane: false, karencjaDo: TERAZ + 5 });
    expect(transakcjaZZakupu({ productId: 'oczko.pro.yearly', expirationDateIOS: TERAZ, revocationDateIOS: TERAZ - 1, renewalInfoIOS: { gracePeriodExpirationDate: null } }))
      .toEqual({ produkt: 'oczko.pro.yearly', wygasa: TERAZ, odebrane: true, karencjaDo: null });
    expect([transakcjaZZakupu({ productId: 'obcy' }), transakcjaZZakupu({ productId: 'oczko.pro.monthly' }), transakcjaZZakupu(null)]).toEqual([null, null, null]);
  });
  test('produkty: cena tylko displayPrice, okres z jednostki, obce pominięte', async () => {
    expect(await sklepIap(atrapa()).produkty()).toEqual([
      { id: 'oczko.pro.monthly', cenaWyswietlana: '0,99 zł', okres: 'miesiac' },
      { id: 'oczko.pro.yearly', cenaWyswietlana: '6,99 zł', okres: 'rok' },
      { id: 'oczko.pro.lifetime', cenaWyswietlana: '14,99 zł', okres: 'dozywotni' },
    ]);
    expect(produktZeSklepu({ id: 'oczko.pro.monthly', displayPrice: '' })).toBeNull();
  });
  test('statusy zakupu: anulowanie i oczekiwanie nie są błędem (MON-04)', () => {
    expect(['user-cancelled', 'pending', 'deferred-payment', 'network-error'].map((k) => statusZBledu(blad(k)))).toEqual(['anulowany', 'oczekujacy', 'oczekujacy', 'blad']);
  });
});

describe('transakcje: karencja płatności (P-103 (2a)) i błąd odczytu', () => {
  test('subskrypcja w karencji spoza listy aktywnych → transakcja z karencjaDo z subscriptionStatusIOS', async () => {
    const s = sklepIap(atrapa({ statusy: { 'oczko.pro.monthly': [{ state: 'inGracePeriod', renewalInfo: { gracePeriodExpirationDate: TERAZ + 3 } }] } }), () => TERAZ);
    expect(await s.transakcje()).toEqual([{ produkt: 'oczko.pro.monthly', wygasa: TERAZ + 3, odebrane: false, karencjaDo: TERAZ + 3 }]);
  });
  test('błąd zapytania o status: z innymi uprawnieniami → lista bez karencji; bez żadnych → wyjątek (odczyt nieudany, nie „brak Pro”)', async () => {
    const zDozywotnim = sklepIap(atrapa({ zakupy: [{ productId: 'oczko.pro.lifetime' }], statusy: { 'oczko.pro.monthly': new Error('sieć') } }), () => TERAZ);
    expect((await zDozywotnim.transakcje()).map((t) => t.produkt)).toEqual(['oczko.pro.lifetime']);
    await expect(sklepIap(atrapa({ statusy: { 'oczko.pro.yearly': new Error('sieć') } }), () => TERAZ).transakcje()).rejects.toThrow('sieć');
  });
  // 08 partia 4 (P-135 Q3a): kup zwraca StatusZakupu (bez kupZeStatusem) — te same przypadki, asercja na statusie.
  test('kup: sukces → sukces; anulowanie → anulowany (nie błąd)', async () => {
    expect(await sklepIap(atrapa()).kup('oczko.pro.lifetime')).toBe('sukces');
    expect(await sklepIap(atrapa({ zakup: blad('user-cancelled') })).kup('oczko.pro.monthly')).toBe('anulowany');
  });
});

test('sztuczny sklep (build E2E): zakup bez okna Apple, „wygaś dostęp” kończy uprawnienia teraz, obserwatorzy powiadomieni', async () => {
  let teraz = TERAZ;
  const s = sklepSztuczny(() => teraz);
  let powiadomienia = 0;
  s.obserwuj(() => { powiadomienia += 1; });
  expect(await s.kup('oczko.pro.yearly')).toBe('sukces'); // P-135 Q3a: status zamiast Wynik
  expect(await s.transakcje()).toEqual([{ produkt: 'oczko.pro.yearly', wygasa: TERAZ + 30 * 86_400_000, odebrane: false, karencjaDo: null }]);
  teraz += 1000;
  s.wygas();
  expect((await s.transakcje())[0]?.wygasa).toBe(TERAZ + 1000);
  expect(powiadomienia).toBe(2);
});
