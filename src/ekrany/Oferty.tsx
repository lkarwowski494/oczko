// Ekran ofert Oczko Pro w „Dzianinie” (M3 p7: karta z miesiącem dni, cztery kafle P-563 (11)(12), plany z ceną w Bree; kroki i model bez zmian). Pierwotnie (F-35; design-spec.md:56, :68, :77–80; ekrany.html `oferty`; KP-03, KP-04, KP-08, KP-09, KP-14; P-089 (1)).
// Sygnatura: propozycja 07 (E3), granice zatwierdzone przez 05 (Z07-22). Ceny wyłącznie z `Produkt.cenaWyswietlana` (StoreKit displayPrice);
// w kodzie i tłumaczeniach żadnej kwoty (KP-09, P-089 (1), R-118). Plany: rola radio + selected; Privacy Policy i Terms of Use: linki.
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { Produkt } from '../domena/porty';
import { LIMIT_DNI_W_MIESIACU } from '../konfiguracja';
import { Arkusz, Komunikat, Przycisk, Tresc } from './Arkusz';
import { cel, MAX_SKALA_TYTULOWA, odstep, promien, PROG_KATEGORII_DOSTEPNOSCI, ROZMIAR_SYMBOLU_TRESCI, typografia, typografiaDzianiny, useKolory } from './motyw';
import { IkonaDnia } from './IkonaDnia';
import { SymbolSf, type NazwaSymbolu } from './SymbolSf';
import type { Tlumacz } from './wspolne';
import type { Klucz } from '../i18n/typy';

export type ProduktyOfert = { rodzaj: 'gotowe'; produkty: Produkt[] } | { rodzaj: 'ladowanie' } | { rodzaj: 'brak-sieci' };
/** Linia nad przyciskiem zakupu (KP-07, design-spec 002): neutralna „i” (`role=status`) albo błąd „!” (`role=alert`), zawsze z tekstem. */
export type KomunikatOfert = 'czeka' | 'blad' | 'przywroc_nic' | 'przywroc_blad' | 'pro_wlaczone' | null;
/** `subskrypcja` przy dożywotnim (M1-091, KP-14): ważna subskrypcja trwa obok zakupu dożywotniego (odnawia się, dopóki osoba jej nie anuluje). */
export type AktywnePro = { rodzaj: 'subskrypcja'; produkt: string } | { rodzaj: 'dozywotni'; subskrypcja?: string } | null;
/** „Manage subscription” (KP-14, design-spec „aktywna subskrypcja”): póki trwa subskrypcja — także obok dożywotniego (M1-091, KP-03). */
export const trwaSubskrypcja = (a: AktywnePro): boolean => a?.rodzaj === 'subskrypcja' || (a?.rodzaj === 'dozywotni' && a.subskrypcja !== undefined);
export type PropsOfert = {
  stan: { produkty: ProduktyOfert; aktywne: AktywnePro; familySharing: boolean; komunikat?: KomunikatOfert; oczekujacy?: boolean }; // oczekujacy: zakup czeka na zatwierdzenie — „kup” nieaktywny, nawet gdy linia pokazuje inny komunikat
  t: Tlumacz;
  adresy: { polityka: string; warunki: string };   // z konfiguracji (KP-04); Terms of Use = standardowa EULA Apple
  naKup(produkt: string): void;
  naPrzywroc(): void;                              // tylko po stuknięciu (KP-08)
  naZarzadzaj(): void;                             // showManageSubscriptions (KP-14)
  naOtworzAdres(url: string): void;
  naZamknij(): void;
};

const KOLEJNOSC: Produkt['okres'][] = ['miesiac', 'rok', 'dozywotni'];
const TESTID = { miesiac: 'oferty-plan-miesieczny', rok: 'oferty-plan-roczny', dozywotni: 'oferty-plan-dozywotni' } as const;
function opisPlanu(p: Produkt, t: Tlumacz): { nazwa: string; cena: string; podpis: string } {
  if (p.okres === 'miesiac') return { nazwa: t('oferty.miesieczny'), cena: t('oferty.cena_miesiac', { cena: p.cenaWyswietlana }), podpis: t('oferty.odnawianie_miesiac') };
  if (p.okres === 'rok') return { nazwa: t('oferty.roczny'), cena: t('oferty.cena_rok', { cena: p.cenaWyswietlana }), podpis: t('oferty.odnawianie_rok') };
  return { nazwa: t('oferty.dozywotni'), cena: t('oferty.cena_raz', { cena: p.cenaWyswietlana }), podpis: t('oferty.raz') };
}

const LINIE = {
  czeka: { klucz: 'oferty.czeka', id: 'oferty-czeka', blad: false }, blad: { klucz: 'oferty.blad_zakupu', id: 'oferty-blad', blad: true },
  przywroc_nic: { klucz: 'oferty.przywracanie_nic', id: 'oferty-przywroc-nic', blad: false }, przywroc_blad: { klucz: 'oferty.przywracanie_blad', id: 'oferty-przywroc-blad', blad: true },
  pro_wlaczone: { klucz: 'oferty.pro_wlaczone', id: 'oferty-pro-wlaczone', blad: false },
} as const;
function LiniaKomunikatu({ rodzaj, t }: { rodzaj: Exclude<KomunikatOfert, null>; t: Tlumacz }): React.ReactElement {
  const k = useKolory();
  const l = LINIE[rodzaj];
  const tekst = t(l.klucz);
  return (
    <View testID={l.id}>
      {l.blad
        ? <Komunikat tekst={tekst} znak />
        : (
          <View style={{ flexDirection: 'row', gap: odstep.s }} accessible accessibilityRole="text" accessibilityLiveRegion="polite" accessibilityLabel={tekst}>
            <Text style={{ ...typografia.podpis, color: k.akcentTekst }} importantForAccessibility="no" accessibilityElementsHidden>ⓘ</Text>
            <Text style={{ ...typografia.podpis, color: k.tekst, flex: 1 }}>{tekst}</Text>
          </View>
        )}
    </View>
  );
}

// Kafle „co daje zakup” (P-558, P-563 (11)(12), raport 02 `02-monetyzacja-2026-11-08`): tylko to, co Pro faktycznie zmienia (limit dni, `src/domena/limit.ts:70`), albo jawnie to, co zostaje bez Pro.
// Kafel „rodzina” tylko przy Family Sharing (ujawnienie 7). Ikona kafla 1 własna (nie kalendarz zakładki Historia, 02-monetyzacja-004), pozostałe SF Symbols.
const LICZBA_DNI_W_ILUSTRACJI = 30; // ilustracja „każdy dzień” (nie dane): pełny miesiąc dni dzierganych; kolumny: 15, przy dużym tekście 10 (ekrany.html `.of-mies`)
type Kafel = { id: string; tytul: Klucz; opis: Klucz; symbol: NazwaSymbolu | null; tylkoRodzina?: true };
const KAFLE: readonly Kafel[] = [
  { id: 'dzien', tytul: 'oferty.kafel_dzien_tytul', opis: 'oferty.kafel_dzien_opis', symbol: null },
  { id: 'urzadzenia', tytul: 'oferty.kafel_urzadzenia_tytul', opis: 'oferty.kafel_urzadzenia_opis', symbol: 'applewatch' },
  { id: 'rodzina', tytul: 'oferty.kafel_rodzina_tytul', opis: 'oferty.kafel_rodzina_opis', symbol: 'person.2', tylkoRodzina: true },
  { id: 'dane', tytul: 'oferty.kafel_dane_tytul', opis: 'oferty.kafel_dane_opis', symbol: 'checkmark.shield' },
];

export function Oferty({ stan: s, t, adresy, naKup, naPrzywroc, naZarzadzaj, naOtworzAdres, naZamknij }: PropsOfert): React.ReactElement {
  const k = useKolory();
  const duzyTekst = useWindowDimensions().fontScale >= PROG_KATEGORII_DOSTEPNOSCI;
  // KP-03: aktywna subskrypcja nie jest oferowana ponownie; dożywotni — brak planów.
  const plany = s.produkty.rodzaj === 'gotowe' && s.aktywne?.rodzaj !== 'dozywotni'
    ? KOLEJNOSC.map((o) => (s.produkty as { produkty: Produkt[] }).produkty.find((p) => p.okres === o)).filter((p): p is Produkt => !!p && !(s.aktywne?.rodzaj === 'subskrypcja' && s.aktywne.produkt === p.id))
    : [];
  const domyslny = plany.find((p) => p.okres === 'rok') ?? plany[0];
  const [wybrany, wybierz] = useState<string | null>(null);
  const plan = plany.find((p) => p.id === wybrany) ?? domyslny;
  const st = StyleSheet.create({
    karta: { backgroundColor: k.karta, borderRadius: promien.karta, padding: odstep.l, gap: odstep.m },
    kartaTekst: { ...typografiaDzianiny.tresc, color: k.kartaTekst2 },
    miesiac: { flexDirection: 'row', flexWrap: 'wrap', gap: odstep.xs },
    dzien: { aspectRatio: 1, borderRadius: odstep.xs, backgroundColor: k.akcent, width: duzyTekst ? '9%' : '5.9%' },
    kafle: { flexDirection: duzyTekst ? 'column' : 'row', flexWrap: 'wrap', gap: odstep.m },
    kafel: { backgroundColor: k.powierzchnia, borderRadius: promien.kafel, padding: odstep.m, gap: odstep.s, ...(duzyTekst ? { flexDirection: 'row', alignItems: 'flex-start' } : { width: '48%', flexGrow: 1, minHeight: cel.plus * 1.5 }) },
    ikona: { width: cel.minimum, height: cel.minimum, borderRadius: promien.przycisk, backgroundColor: k.ikonaTlo, alignItems: 'center', justifyContent: 'center' },
    kafelTytul: { ...typografiaDzianiny.tresc, color: k.tekst, fontWeight: '700' },
    kafelOpis: { ...typografiaDzianiny.mala, color: k.tekst2 },
    sekcja: { ...typografiaDzianiny.tresc, color: k.tekst, fontWeight: '700' },
    plan: { minHeight: cel.plus, padding: odstep.m, borderRadius: promien.kafel, borderWidth: 2, backgroundColor: k.powierzchnia, flexDirection: duzyTekst ? 'column' : 'row', gap: odstep.m, alignItems: duzyTekst ? 'flex-start' : 'center' },
    znacznik: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: k.tekst2, alignItems: 'center', justifyContent: 'center' },
    znacznikWybrany: { borderWidth: 0, backgroundColor: k.przycisk },
    planTekst: { flex: 1, gap: odstep.xs },
    cena: { ...typografiaDzianiny.tytul, color: k.tekst },
    podpis: { ...typografiaDzianiny.mala, color: k.tekst2 },
    bez: { ...typografiaDzianiny.tresc2, color: k.tekst2 },
    wierszTekstowych: { flexDirection: duzyTekst ? 'column' : 'row', justifyContent: 'space-between', gap: odstep.s },
  });
  return (
    <Arkusz tytul={t('oferty.tytul')} testID="oferty-ekran" zamknij={{ etykieta: t('wspolne.zamknij'), naZamknij, testID: 'oferty-zamknij' }} przyciski={
      <>
        {s.komunikat && <LiniaKomunikatu rodzaj={s.komunikat} t={t} />}
        {plan && (s.oczekujacy || s.komunikat === 'czeka'
          ? <Przycisk tekst={t('oferty.czeka_przycisk')} onPress={() => undefined} rodzaj="glowny" wylaczony testID="oferty-kup" />
          : <Przycisk tekst={t('oferty.kup', { plan: opisPlanu(plan, t).nazwa })} onPress={() => naKup(plan.id)} rodzaj="glowny" testID="oferty-kup" />)}
        {trwaSubskrypcja(s.aktywne) && <Przycisk tekst={t('oferty.zarzadzaj')} onPress={naZarzadzaj} />}
        <View style={st.wierszTekstowych}>
          <Przycisk tekst={t('oferty.przywroc')} onPress={naPrzywroc} rodzaj="tekstowy" testID="oferty-przywroc" />
          <Przycisk tekst={t('wspolne.nie_teraz')} onPress={naZamknij} rodzaj="tekstowy" testID="oferty-nie-teraz" />
        </View>
      </>
    }>
      {/* Karta „Oczko Pro” (P-557): tytuł zostaje w nagłówku arkusza (jeden „Oczko Pro” dla VoiceOver), w karcie opis i miesiąc dni dzierganych — ilustracja, nie dane. */}
      <View style={st.karta} testID="oferty-karta">
        <Text style={st.kartaTekst}>{t('oferty.opis')}</Text>
        <View style={st.miesiac} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID="oferty-miesiac">
          {Array.from({ length: LICZBA_DNI_W_ILUSTRACJI }, (_, i) => <View key={i} style={st.dzien} testID="oferty-miesiac-dzien" />)}
        </View>
      </View>
      {s.aktywne && <Tresc testID="oferty-stan-pro">{t('oferty.masz_pro')}</Tresc>}
      <View style={st.kafle}>
        {KAFLE.filter((x) => !x.tylkoRodzina || s.familySharing).map((x) => (
          <View key={x.id} style={st.kafel} testID={`oferty-kafel-${x.id}`} accessible accessibilityLabel={`${t(x.tytul)}. ${t(x.opis)}`}>
            <View style={st.ikona}>
              {x.symbol
                ? <SymbolSf nazwa={x.symbol} rozmiar={ROZMIAR_SYMBOLU_TRESCI} kolor={k.ikona} maxSkala={MAX_SKALA_TYTULOWA} />
                : <IkonaDnia rozmiar={ROZMIAR_SYMBOLU_TRESCI + 4} kolor={k.ikona} testID="oferty-ikona-dzien" />}
            </View>
            <View style={{ flex: duzyTekst ? 1 : undefined, gap: odstep.xs }}>
              <Text style={st.kafelTytul}>{t(x.tytul)}</Text>
              <Text style={st.kafelOpis}>{t(x.opis)}</Text>
            </View>
          </View>
        ))}
      </View>
      {s.produkty.rodzaj === 'ladowanie' && <Tresc podpis>{t('oferty.ladowanie')}</Tresc>}
      {s.produkty.rodzaj === 'brak-sieci' && <Tresc podpis>{t('oferty.brak_sieci')}</Tresc>}
      {plany.length > 0 && (
        <>
          <Text style={st.sekcja} accessibilityRole="header">{t('oferty.plany')}</Text>
          <View accessibilityRole="radiogroup" accessibilityLabel={t('oferty.plany')} style={{ gap: odstep.s }}>
            {plany.map((p) => {
              const o = opisPlanu(p, t);
              const zaznaczony = p.id === plan?.id;
              return (
                <Pressable key={p.id} accessibilityRole="radio" accessibilityState={{ selected: zaznaczony }} accessibilityLabel={p.okres === 'dozywotni' && s.aktywne?.rodzaj === 'subskrypcja' ? `${o.nazwa} · ${o.cena}. ${o.podpis} ${t('oferty.dozywotni_przy_subskrypcji')}` : `${o.nazwa} · ${o.cena}. ${o.podpis}`}
                  onPress={() => wybierz(p.id)} testID={TESTID[p.okres]}
                  style={[st.plan, { borderColor: zaznaczony ? k.akcentTekst : 'transparent' }]}>
                  {/* Zaznaczenie nie tylko kolorem: wypełniony znacznik z ptaszkiem (design-spec „Stany”). */}
                  <View style={[st.znacznik, zaznaczony && st.znacznikWybrany]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    {zaznaczony && <SymbolSf nazwa="checkmark" rozmiar={ROZMIAR_SYMBOLU_TRESCI} kolor={k.przyciskTekst} maxSkala={MAX_SKALA_TYTULOWA} waga="bold" />}
                  </View>
                  <View style={st.planTekst}>
                    <Text style={[typografiaDzianiny.tresc, { color: k.tekst, fontWeight: '700' }]} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{o.nazwa}</Text>
                    {/* Cena ze sklepu największym elementem planu, także przy AX5 (MS-02, KP-09; 3.1.2 strona subskrypcji Apple). */}
                    <Text style={st.cena} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{o.cena}</Text>
                    <Text style={st.podpis}>{o.podpis}</Text>
                    {/* KP-03 pełne (M1-014, P-403): dożywotni nie anuluje subskrypcji — informacja przy planie (też w etykiecie przycisku: VoiceOver czyta tylko ją), „Manage subscription” w przyciskach.
                        M1-092 (MON-10, SP-18): etykieta niesie też podpis planu (odnowienie albo „Pay once”), w kolejności wizualnej. */}
                    {p.okres === 'dozywotni' && s.aktywne?.rodzaj === 'subskrypcja' && <Text style={st.podpis}>{t('oferty.dozywotni_przy_subskrypcji')}</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
      <Text style={st.bez}>{t('oferty.bez_pro', { count: LIMIT_DNI_W_MIESIACU, limit: LIMIT_DNI_W_MIESIACU })}</Text>
      <View style={{ flexDirection: 'row', gap: odstep.l, flexWrap: 'wrap' }}>
        <Przycisk tekst={t('oferty.polityka')} onPress={() => naOtworzAdres(adresy.polityka)} rodzaj="tekstowy" rola="link" />
        <Przycisk tekst={t('oferty.warunki')} onPress={() => naOtworzAdres(adresy.warunki)} rodzaj="tekstowy" rola="link" />
      </View>
    </Arkusz>
  );
}
