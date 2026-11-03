// Kontener zależności aplikacji na urządzeniu (08 partia 4, 3A): ścieżki danych (ADR-0001), baza (ADR-0019: bez zastępstwa w pamięci),
// porty platformy, i18n (ADR-0017). Jedyne miejsce, które składa adaptery; ekrany dostają gotowe usługi (moduly.md: ekrany → przypadki użycia).
import { Platform } from 'react-native';
import type { Wynik } from '../domena/bledy';
import type { Haptyka, EkranAktywny, Siec, Sklep } from '../domena/porty';
import { otworzPortExpo } from '../dane/baza/adapter-expo';
import { otworzBaze } from '../dane/baza/polaczenie';
import { sciezkiDanych } from '../dane/baza/sciezki';
import { migruj } from '../dane/migracje/migruj';
import { utworzMagazyn } from '../dane/pliki/magazyn';
import { utworzArchiwum } from '../dane/archiwum';
import { czasWTle } from '../platforma/czas-w-tle';
import type { ZaleznosciArchiwum } from '../przypadki-uzycia/zaleznosci';
import { czytajTekst, istniejePlik, katalogBiblioteki, katalogGrupyAplikacji, katalogPamieciPodrecznej, polacz, utworzKatalog, wolneMiejsce, zapiszTekst } from '../dane/pliki/system';
import { dostepPro, type DostepPro } from './dostep';
import { identyfikatorUrzadzenia, pamiecProWPliku } from './pliki-urzadzenia';
import { utworzI18n } from '../i18n/i18n';
import { ZASOBY, ZASOBY_PSEUDO } from '../i18n/slowniki';
import type { PreferencjaJezyka } from '../i18n/jezyki';
import { magazynJezyka } from '../przypadki-uzycia/jezyk';
import { dziennikUrzadzenia, skrotPliku } from '../platforma/dziennik-plus';
import { ekranAktywny } from '../platforma/ekran-aktywny';
import { haptyka } from '../platforma/haptyka';
import { identyfikatory } from '../platforma/identyfikatory';
import { liveActivity } from '../platforma/live-activity';
import { tagiSystemowe, zegar24h } from '../platforma/lokalizacja';
import { siecAplikacji } from '../platforma/siec';
import { sklepAplikacji } from '../platforma/sklep';
import { grupaAplikacjiE2e, oknoStraznikaS, paneleE2e, skrzynkaE2e, skrzynkaTestowa, trybIcloudE2e, ZEGAREK_SZTUCZNY, zegarAplikacji } from '../platforma/tryb-e2e';
import { przelacznikIcloudWidoczny, silnikIcloud, type SilnikIcloud } from '../platforma/icloud';
import { platformaWzoru, type PlatformaWzoru } from '../platforma/wzor';
import { skrzynkaWKatalogu } from '../platforma/skrzynka';
import { migawkaWKatalogu } from '../platforma/migawka';
import { GRUPA_APLIKACJI } from '../platforma/identyfikatory';
import { kompozycjaWzoru, type KompozycjaWzoru, type ZaleznosciKompozycjiWzoru } from './wzor';
import { sterownikSynchronizacji, type Sterownik } from '../przypadki-uzycia/synchronizacja';
import { zegarek } from '../platforma/zegarek';
import type { Tlumacz } from '../ekrany/wspolne';
import type { Jezyk, ZaleznosciKompozycji } from './licznik';
import { ustawKatalogTymczasowy } from './system';

export type ZaleznosciAplikacji = ZaleznosciKompozycji & ZaleznosciArchiwum;
export type Kontener = {
  z: ZaleznosciAplikacji;
  j: Jezyk & { naZmiane(f: (j: string) => void): () => void; preferencja(): PreferencjaJezyka; ustawJezyk(p: PreferencjaJezyka): Promise<void> };
  porty: { sklep: Sklep; ekranAktywny: EkranAktywny; haptyka: Haptyka; siec: Siec };
  dostep: DostepPro;
  katalogDanych: string;
  /** iCloud (partia 7): sterownik albo null, gdy silnika nie ma w buildzie; `widoczny` = wiersz w Data and sync (ZM-06, P-242). */
  /** Partia 6: wzory (konwersja, skaner), skrzynka importu i migawka w App Group, stan arkusza skrzynki. */
  wzor: { z: ZaleznosciKompozycjiWzoru; k: KompozycjaWzoru; platforma: PlatformaWzoru };
  icloud: { sterownik: Sterownik; widoczny: boolean; e2e: SilnikIcloud['e2e']; naPartie(f: () => void): () => void } | null;
};

/** Błąd otwarcia bazy albo plików → `powod` dla ekranu awaryjnego (ADR-0019, krok 3C); nic nie jest zastępowane po cichu. */
export async function utworzKontener(): Promise<Wynik<Kontener>> {
  const s = sciezkiDanych(katalogBiblioteki());
  const katalogDanych = s.baza.slice(0, s.baza.lastIndexOf('/'));
  const tymczasowy = polacz(katalogDanych, 'tmp');
  for (const k of [katalogDanych, s.pliki, s.kopie, tymczasowy]) utworzKatalog(k);
  ustawKatalogTymczasowy(tymczasowy);
  const b = await otworzBaze(s.baza, (p) => otworzPortExpo(p), wolneMiejsce); // M1-157: wolne miejsce rozstrzyga `zapis` vs `brak_miejsca`
  if (!b.ok) return b;
  const baza = b.wartosc;
  const zegar = zegarAplikacji();
  // Język (F-36, P-190): preferencja w `ustawienie.jezyk` (stan urządzenia, dane.md), odczyt przed pierwszym ekranem; pseudo en-XA tylko z EXPO_PUBLIC_PSEUDO=1 (M1-051).
  const i18n = await utworzI18n({ magazyn: magazynJezyka({ baza, zegar }), systemowe: tagiSystemowe, zasoby: ZASOBY, pseudo: ZASOBY_PSEUDO });
  const jezyk = () => i18n.jezyk();
  const id = await identyfikatorUrzadzenia(katalogDanych, () => identyfikatory.nowy());
  // Zakupy sztucznego sklepu buildu E2E w pliku (e2e/README.md); w buildzie wydania sztuczny sklep nie istnieje (sprawdz-ipa).
  const plikSklepu = polacz(katalogDanych, 'sklep-e2e.json');
  const zakupyE2e = istniejePlik(plikSklepu) ? await czytajTekst(plikSklepu) : null;
  const sklep = sklepAplikacji({ czytaj: () => zakupyE2e, zapisz: (t) => zapiszTekst(plikSklepu, t) }, () => zegar.teraz().ms);
  const dostep = dostepPro(sklep, pamiecProWPliku(katalogDanych), () => zegar.teraz().ms); // pamięć uprawnień Pro (KP-06): plik obok bazy
  const z0: ZaleznosciKompozycji = {
    baza, zegar, id: identyfikatory, urzadzenie: id, rodzajUrzadzenia: Platform.OS === 'ios' && Platform.isPad ? 'ipad' : 'iphone', // P-247 U6a
    straznikOknoS: oknoStraznikaS(), // okno strażnika serii RD-17: 2 s; w buildzie E2E z `oczkoE2eOknoStraznika` (E2E-A4)
    pro: () => dostep.stan().pro, // ADR-0010: decyzja ze sklepu, przy błędzie pamięć KP-06 z oknem offline
    // magazyn: SHA-256 natywnie (P-130, M1-017), nie TS na wątku JS
    magazyn: utworzMagazyn(s.pliki, { skrot: skrotPliku }), katalogi: { kopie: s.kopie, kopiePrzed: s.kopiePrzed, tymczasowy, podreczny: katalogPamieciPodrecznej() },
    dziennik: dziennikUrzadzenia(baza),
    migruj: (p) => migruj(p, { katalogKopii: s.kopie, teraz: () => zegar.teraz().ms }),
    liveActivity: liveActivity(id, undefined, jezyk),
    zegarek: ZEGAREK_SZTUCZNY && paneleE2e ? paneleE2e.zegarekSztuczny : zegarek(undefined, jezyk), // udawany zegarek E2E (e2e/README.md:37)
  };
  // iCloud (partia 7): silnik (moduł Swift albo atrapa E2E) i sterownik na czas procesu; start po danych startu (kompozycja licznika).
  const plikIcloud = polacz(katalogDanych, 'icloud-atrapa.json');
  const stanIcloudE2e = istniejePlik(plikIcloud) ? await czytajTekst(plikIcloud) : null; // tylko atrapa E2E czyta ten plik
  const silnik = silnikIcloud({ tryb: trybIcloudE2e(), baza, zegar, plik: { czytaj: () => stanIcloudE2e, zapisz: (t) => zapiszTekst(plikIcloud, t) } });
  const poPartii = new Set<() => void>();
  const icloud = silnik ? {
    sterownik: sterownikSynchronizacji({ ...z0, synchronizacja: silnik, magazyn: z0.magazyn }, () => { for (const f of poPartii) f(); }),
    widoczny: przelacznikIcloudWidoczny(), e2e: silnik.e2e,
    naPartie: (f: () => void) => { poPartii.add(f); return () => { poPartii.delete(f); }; },
  } : null;
  const z: ZaleznosciAplikacji = {
    ...z0, czasWTle: czasWTle(), ...(silnik ? { synchronizacja: silnik } : {}),
    archiwum: utworzArchiwum({ baza, magazyn: z0.magazyn, zegar, katalogi: z0.katalogi, migruj: z0.migruj, aplikacja: 'oczko', skrot: skrotPliku }),
  };
  // Partia 6: App Group (ADR-0011 fix-7) — skrzynka rozszerzenia i migawka projektów; bez grupy w podpisie (build symulatora) obie są puste,
  // poza E2E ze zleceniem testowym: katalog zastępczy w danych aplikacji (P-266, tryb-e2e.ts).
  const grupa = grupaAplikacjiE2e(katalogGrupyAplikacji(GRUPA_APLIKACJI), katalogDanych);
  if (grupa) utworzKatalog(grupa); // katalog zastępczy E2E może jeszcze nie istnieć (kontener grupy istnieje zawsze; idempotentne)
  const platforma = platformaWzoru();
  const zWzoru: ZaleznosciKompozycjiWzoru = { ...z, konwersja: platforma, skrzynka: skrzynkaWKatalogu(grupa, () => zegar.teraz().ms), migawka: migawkaWKatalogu(grupa, () => zegar.teraz().ms), jezyk };
  const wzor = { z: zWzoru, platforma, k: kompozycjaWzoru(zWzoru, { grupa, zlecenieE2e: skrzynkaE2e() && skrzynkaTestowa ? skrzynkaTestowa.wlozZlecenieTestowe : null }) };
  const t: Tlumacz = (k, p) => i18n.t(k, p);
  return {
    ok: true,
    wartosc: {
      z,
      j: { t, jezyk, zegar24h, naZmiane: (f) => i18n.naZmiane(f), preferencja: () => i18n.preferencja(), ustawJezyk: (p) => i18n.ustawJezyk(p) },
      porty: { sklep, ekranAktywny: ekranAktywny(), haptyka: haptyka(), siec: siecAplikacji() },
      dostep, katalogDanych, icloud, wzor,
    },
  };
}
