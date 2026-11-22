// Status zakupu w porcie Sklep (NZ-08-P3-05 (a), P-135 Q3a; KP-*: komunikatZakupu w src/domena/dostep.ts): `kup` zwraca StatusZakupu
// zamiast Wynik<void>, bo anulowanie i oczekiwanie nie są błędem (MON-04) i wybierają inny komunikat. Test oczekujący roli 05 (fix-4):
// czerwony na asercji do wdrożenia przez 08 (partia 4, razem z adapterem i sztucznym sklepem); sygnatura: „Kontrakt partii 4” w moduly.md.
import { komunikatZakupu } from '../../src/domena/dostep';
import { sklepIap, type ModulIap } from '../../src/platforma/sklep';
import { sklepSztuczny } from '../../src/platforma/sklep-sztuczny';

const blad = (code: string) => Object.assign(new Error(code), { code });
function atrapa(zakup?: unknown): ModulIap {
  const nic = { remove: () => undefined };
  return {
    initConnection: async () => true, fetchProducts: async () => [], getAvailablePurchases: async () => [], restorePurchases: async () => undefined,
    requestPurchase: async () => { if (zakup instanceof Error) throw zakup; return { productId: 'oczko.pro.lifetime' }; },
    finishTransaction: async () => undefined, purchaseUpdatedListener: () => nic, purchaseErrorListener: () => nic, subscriptionStatusIOS: async () => [],
  };
}

describe('P-135 Q3a Sklep.kup → StatusZakupu', () => {
  test.each([
    ['sukces', undefined],
    ['anulowany', blad('user-cancelled')],
    ['oczekujacy', blad('deferred-payment')],
    ['blad', blad('network-error')],
  ] as const)('P-135 KP-13: kup przy %s zwraca status, który przyjmuje komunikatZakupu', async (status, zakup) => {
    const s = await sklepIap(atrapa(zakup)).kup('oczko.pro.lifetime');
    expect(s).toBe(status);
    expect(() => komunikatZakupu(s as unknown as string)).not.toThrow();
  });

  test('P-135: sztuczny sklep buildu E2E zwraca ten sam typ (sukces)', async () => {
    expect(await sklepSztuczny(() => 0).kup('oczko.pro.lifetime')).toBe('sukces');
  });
});
