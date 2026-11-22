// Kontrakt synchronizacji iCloud w domenie: kopia docs/architektura/icloud-tabele.json (domena nie czyta plików; równość pilnuje
// tests/domena/icloud/icloud-odwzorowanie.test.ts). Kolejność = kolejność stosowania partii (rodzice przed dziećmi; moduly.md „Kontrakt partii 7”).
export type ScalanieIcloud = 'zmieniono_ms' | 'tylko_dopisywane' | 'dni_limitu' | 'ustawienie_or';
export type TabelaIcloud = {
  tabela: string; typ: string; klucz: readonly string[]; scalanie: ScalanieIcloud;
  pomin: readonly string[];               // kolumny liczone u odbiorcy (licznik: wartosc, glowa, konflikt przez scal)
  zasob: boolean;                         // plik jako CKAsset w polu `dane`
  tylkoKlucze: readonly string[] | null;  // ustawienie: synchronizowane tylko te klucze (wyzwalacze i odbiór)
};

const t = (tabela: string, typ: string, klucz: readonly string[], scalanie: ScalanieIcloud, inne: Partial<TabelaIcloud> = {}): TabelaIcloud =>
  ({ tabela, typ, klucz, scalanie, pomin: [], zasob: false, tylkoKlucze: null, ...inne });

export const TABELE_ICLOUD: readonly TabelaIcloud[] = [
  t('plik', 'Plik', ['sha256'], 'tylko_dopisywane', { zasob: true }),
  t('projekt', 'Projekt', ['id'], 'zmieniono_ms'),
  t('czesc', 'Czesc', ['id'], 'zmieniono_ms'),
  t('licznik', 'Licznik', ['id'], 'zmieniono_ms', { pomin: ['wartosc', 'glowa', 'konflikt'] }),
  t('zdarzenie', 'Zdarzenie', ['id'], 'tylko_dopisywane'),
  t('notatka_rzedu', 'NotatkaRzedu', ['id'], 'zmieniono_ms'),
  t('przypomnienie', 'Przypomnienie', ['id'], 'zmieniono_ms'),
  t('sesja', 'Sesja', ['id'], 'zmieniono_ms'),
  t('wzor', 'Wzor', ['id'], 'zmieniono_ms'),
  t('rysunek', 'Rysunek', ['wzor_id', 'strona'], 'zmieniono_ms'),
  t('wloczka', 'Wloczka', ['id'], 'zmieniono_ms'),
  t('narzedzie', 'Narzedzie', ['id'], 'zmieniono_ms'),
  t('projekt_wloczka', 'ProjektWloczka', ['projekt_id', 'wloczka_id'], 'zmieniono_ms'),
  t('zdjecie', 'Zdjecie', ['id'], 'tylko_dopisywane'),
  t('obliczenie', 'Obliczenie', ['id'], 'tylko_dopisywane'),
  t('dzien_limitu', 'DzienLimitu', ['dzien'], 'dni_limitu'),
  t('ustawienie', 'Ustawienie', ['klucz'], 'ustawienie_or', { tylkoKlucze: ['okno_uczciwe_zasady_widziane'] }),
];

const WG_NAZWY = new Map(TABELE_ICLOUD.map((x) => [x.tabela, x]));
/** Tabela synchronizowana o tej nazwie; null dla tabel lokalnych i nieznanych (rekord z sieci nie wybiera dowolnej tabeli). */
export const tabelaIcloud = (encja: string): TabelaIcloud | null => WG_NAZWY.get(encja) ?? null;
