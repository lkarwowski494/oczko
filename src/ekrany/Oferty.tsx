// Ekran ofert Oczko Pro (F-35; design-spec.md:56, :68, :77–80; ekrany.html `oferty`; KP-03, KP-04, KP-08, KP-09, KP-14; P-089 (1)).
// Sygnatura: propozycja 07 (E3), granice zatwierdzone przez 05 (Z07-22). Ceny wyłącznie z `Produkt.cenaWyswietlana` (StoreKit displayPrice);
// w kodzie i tłumaczeniach żadnej kwoty (KP-09, P-089 (1), R-118). Plany: rola radio + selected; Privacy Policy i Terms of Use: linki.
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Produkt } from '../domena/porty';
import { LIMIT_DNI_W_MIESIACU } from '../konfiguracja';
import { Arkusz, Komunikat, Przycisk, Tresc } from './Arkusz';
import { cel, odstep, promien, typografia, useKolory } from './motyw';
import type { Tlumacz } from './wspolne';

export type ProduktyOfert = { rodzaj: 'gotowe'; produkty: Produkt[] } | { rodzaj: 'ladowanie' } | { rodzaj: 'brak-sieci' };
/** Linia nad przyciskiem zakupu (KP-07, design-spec 002): neutralna „i” (`role=status`) albo błąd „!” (`role=alert`), zawsze z tekstem. */
export type KomunikatOfert = 'czeka' | 'blad' | 'przywroc_nic' | 'przywroc_blad' | 'pro_wlaczone' | null;
export type AktywnePro = { rodzaj: 'subskrypcja'; produkt: string } | { rodzaj: 'dozywotni' } | null;
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
            <Text style={{ ...typografia.podpis, color: k.grafit }} importantForAccessibility="no" accessibilityElementsHidden>ⓘ</Text>
            <Text style={{ ...typografia.podpis, color: k.grafit, flex: 1 }}>{tekst}</Text>
          </View>
        )}
    </View>
  );
}

export function Oferty({ stan: s, t, adresy, naKup, naPrzywroc, naZarzadzaj, naOtworzAdres, naZamknij }: PropsOfert): React.ReactElement {
  const k = useKolory();
  // KP-03: aktywna subskrypcja nie jest oferowana ponownie; dożywotni — brak planów.
  const plany = s.produkty.rodzaj === 'gotowe' && s.aktywne?.rodzaj !== 'dozywotni'
    ? KOLEJNOSC.map((o) => (s.produkty as { produkty: Produkt[] }).produkty.find((p) => p.okres === o)).filter((p): p is Produkt => !!p && !(s.aktywne?.rodzaj === 'subskrypcja' && s.aktywne.produkt === p.id))
    : [];
  const domyslny = plany.find((p) => p.okres === 'rok') ?? plany[0];
  const [wybrany, wybierz] = useState<string | null>(null);
  const plan = plany.find((p) => p.id === wybrany) ?? domyslny;
  return (
    <Arkusz tytul={t('oferty.tytul')} testID="oferty-ekran" zamknij={{ etykieta: t('wspolne.zamknij'), naZamknij, testID: 'oferty-zamknij' }} przyciski={
      <>
        {s.komunikat && <LiniaKomunikatu rodzaj={s.komunikat} t={t} />}
        {plan && (s.oczekujacy || s.komunikat === 'czeka'
          ? <Przycisk tekst={t('oferty.czeka_przycisk')} onPress={() => undefined} rodzaj="glowny" wylaczony testID="oferty-kup" />
          : <Przycisk tekst={t('oferty.kup', { plan: opisPlanu(plan, t).nazwa })} onPress={() => naKup(plan.id)} rodzaj="glowny" testID="oferty-kup" />)}
        {s.aktywne?.rodzaj === 'subskrypcja' && <Przycisk tekst={t('oferty.zarzadzaj')} onPress={naZarzadzaj} />}
        <Przycisk tekst={t('oferty.przywroc')} onPress={naPrzywroc} rodzaj="tekstowy" testID="oferty-przywroc" />
        <Przycisk tekst={t('wspolne.nie_teraz')} onPress={naZamknij} rodzaj="tekstowy" testID="oferty-nie-teraz" />
      </>
    }>
      <Tresc>{t('oferty.opis')}</Tresc>
      {s.aktywne && <Tresc testID="oferty-stan-pro">{t('oferty.masz_pro')}</Tresc>}
      {s.produkty.rodzaj === 'ladowanie' && <Tresc podpis>{t('oferty.ladowanie')}</Tresc>}
      {s.produkty.rodzaj === 'brak-sieci' && <Tresc podpis>{t('oferty.brak_sieci')}</Tresc>}
      {plany.length > 0 && (
        <View accessibilityRole="radiogroup" accessibilityLabel={t('oferty.plany')} style={{ gap: odstep.s }}>
          {plany.map((p) => {
            const o = opisPlanu(p, t);
            const zaznaczony = p.id === plan?.id;
            return (
              <Pressable key={p.id} accessibilityRole="radio" accessibilityState={{ selected: zaznaczony }} accessibilityLabel={`${o.nazwa} · ${o.cena}`}
                onPress={() => wybierz(p.id)} testID={TESTID[p.okres]}
                style={{ minHeight: cel.minimum, padding: odstep.m, borderRadius: promien.grupa, borderWidth: 2, borderColor: zaznaczony ? k.przyciskObrys : k.linia, backgroundColor: k.papierGrupa }}>
                <Text style={{ ...typografia.tresc, color: k.grafit, fontWeight: '700' }}>{`${o.nazwa} · ${o.cena}`}</Text>
                <Text style={{ ...typografia.podpis, color: k.olowek }}>{o.podpis}</Text>
                {/* KP-03 pełne (M1-014, P-403): dożywotni nie anuluje subskrypcji — informacja przy planie, „Manage subscription” w przyciskach. */}
                {p.okres === 'dozywotni' && s.aktywne?.rodzaj === 'subskrypcja' && <Text style={{ ...typografia.podpis, color: k.olowek }}>{t('oferty.dozywotni_przy_subskrypcji')}</Text>}
              </Pressable>
            );
          })}
        </View>
      )}
      <Tresc podpis>{[t('oferty.bez_pro', { count: LIMIT_DNI_W_MIESIACU, limit: LIMIT_DNI_W_MIESIACU }), s.familySharing ? t('oferty.rodzina') : null].filter(Boolean).join(' ')}</Tresc>
      <View style={{ flexDirection: 'row', gap: odstep.l, flexWrap: 'wrap' }}>
        <Przycisk tekst={t('oferty.polityka')} onPress={() => naOtworzAdres(adresy.polityka)} rodzaj="tekstowy" rola="link" />
        <Przycisk tekst={t('oferty.warunki')} onPress={() => naOtworzAdres(adresy.warunki)} rodzaj="tekstowy" rola="link" />
      </View>
    </Arkusz>
  );
}
