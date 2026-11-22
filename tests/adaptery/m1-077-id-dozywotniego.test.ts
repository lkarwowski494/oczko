// M1-audytor-generalny-077 (02-monetyzacja-004, MON-12): rola produktu Pro (dożywotni czy subskrypcja) wynika tylko z modułu konfiguracji.
// Konfiguracja z innym ID dożywotniego (bez końcówki „.lifetime”): adapter expo-iap daje Transakcję bez końca (`wygasa: null`), produkt
// z okresem `dozywotni` i zakup typu `in-app`, a stan dostępu — `aktywne.rodzaj` = `dozywotni`. Kontrola statyczna: poza konfiguracją
// i sztucznym sklepem w `src` nie ma literału ID produktu Pro.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { dostepPro } from '../../src/kompozycja/dostep';
import { produktZeSklepu, sklepIap, transakcjaZZakupu, type ModulIap } from '../../src/platforma/sklep';

jest.mock('../../src/konfiguracja', () => {
  const k = jest.requireActual<Record<string, unknown>>('../../src/konfiguracja');
  return { ...k, PRODUKT_DOZYWOTNI: 'pl.przyklad.pro.na-zawsze', PRODUKTY_PRO: ['pl.przyklad.pro.na-zawsze', 'pl.przyklad.pro.miesiac', 'pl.przyklad.pro.rok'] };
});

const TERAZ = 1_800_000_000_000;

test('M1-077: inne ID dożywotniego w konfiguracji → Transakcja bez końca i produkt „dozywotni”', () => {
  expect(transakcjaZZakupu({ productId: 'pl.przyklad.pro.na-zawsze' })).toEqual({ produkt: 'pl.przyklad.pro.na-zawsze', wygasa: null, odebrane: false, karencjaDo: null });
  expect(produktZeSklepu({ id: 'pl.przyklad.pro.na-zawsze', displayPrice: '14,99 zł' })).toEqual({ id: 'pl.przyklad.pro.na-zawsze', cenaWyswietlana: '14,99 zł', okres: 'dozywotni' });
});

test('M1-077: zakup dożywotniego z konfiguracji idzie jako „in-app”, a stan dostępu ma aktywne.rodzaj = dozywotni', async () => {
  const typy: string[] = [];
  const m: ModulIap = {
    initConnection: async () => true,
    fetchProducts: async () => [],
    requestPurchase: async (r) => { typy.push(r.type); return { productId: r.request.apple.sku }; },
    getAvailablePurchases: async () => [{ productId: 'pl.przyklad.pro.na-zawsze' }],
    restorePurchases: async () => undefined,
    finishTransaction: async () => undefined,
    purchaseUpdatedListener: () => ({ remove: () => undefined }),
    purchaseErrorListener: () => ({ remove: () => undefined }),
    subscriptionStatusIOS: async () => [],
  };
  const sklep = sklepIap(m, () => TERAZ);
  expect(await sklep.kup('pl.przyklad.pro.na-zawsze')).toBe('sukces');
  expect(typy).toEqual(['in-app']);
  const dostep = dostepPro(sklep, { czytaj: async () => null, zapisz: async () => undefined }, () => TERAZ);
  const st = await dostep.odswiez();
  expect(st).toMatchObject({ pro: true, wygasa: null, aktywne: { rodzaj: 'dozywotni' } });
});

test('M1-077: grep „oczko.pro.” w src poza konfiguracją i sztucznym sklepem → 0 trafień', () => {
  const korzen = join(__dirname, '..', '..');
  let wynik = '';
  try {
    wynik = execFileSync('grep', ['-rn', 'oczko\\.pro\\.', 'src'], { cwd: korzen, encoding: 'utf8' });
  } catch (e) {
    if ((e as { status?: number }).status !== 1) throw e; // 1 = brak trafień
  }
  const poza = wynik.split('\n').filter((l) => l && !l.startsWith('src/konfiguracja.ts:') && !l.startsWith('src/platforma/sklep-sztuczny.ts:'));
  expect(poza).toEqual([]);
});
