// Trasa „/oferty”: ekran ofert (F-35; KP-13: tylko z komunikatu limitu, z Ustawień i z okna „Uczciwe zasady”). Ceny ze sklepu (KP-09).
// Po zakupie albo przywróceniu: ponowna decyzja dostępu i przeładowanie licznika (limit znika przy Pro). Panel `e2e-sklep-wygas` tylko w buildzie E2E.
import React, { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Oferty, type KomunikatOfert, type ProduktyOfert } from '../src/ekrany/Oferty';
import { komunikatZakupu } from '../src/domena/dostep';
import { ADRESY, FAMILY_SHARING } from '../src/kompozycja/adresy';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { systemAplikacji } from '../src/kompozycja/system';
import { paneleE2e } from '../src/platforma/tryb-e2e';

export default function EkranOfert(): React.ReactElement {
  const { kontener, licznik } = useAplikacja();
  const router = useRouter();
  const { skad } = useLocalSearchParams<{ skad?: string }>();
  const { sklep } = kontener.porty;
  const [produkty, ustawProdukty] = useState<ProduktyOfert>({ rodzaj: 'ladowanie' });
  const [dostep, ustawDostep] = useState(kontener.dostep.stan());
  const [komunikat, ustawKomunikat] = useState<KomunikatOfert>(null);
  const [oczekujacy, ustawOczekujacy] = useState(false); // zakup czeka na zatwierdzenie (Ask to Buy): blokuje „kup”, dopóki Pro się nie włączy
  const zakupWToku = useRef(false); // strażnik: drugie stuknięcie „kup” przed odpowiedzią sklepu jest ignorowane
  const czekaNaZatwierdzenie = useRef(false); // zakup oczekujący (Ask to Buy) w tej sesji ekranu; po restarcie nie jest pamiętany (design-spec 002)
  useEffect(() => kontener.dostep.naZmiane((s) => {
    ustawDostep(s);
    if (s.aktywne && czekaNaZatwierdzenie.current) { czekaNaZatwierdzenie.current = false; ustawOczekujacy(false); ustawKomunikat('pro_wlaczone'); } // P-330: zatwierdzone poza aplikacją, jednorazowo
  }), [kontener]);
  useEffect(() => {
    void sklep.produkty().then((p) => ustawProdukty(p.length ? { rodzaj: 'gotowe', produkty: p } : { rodzaj: 'brak-sieci' }), () => ustawProdukty({ rodzaj: 'brak-sieci' }));
  }, [sklep]);
  const poZmianie = async () => { await kontener.dostep.odswiez(); await licznik.poZmianie(); };
  async function kup(id: string): Promise<void> {
    if (zakupWToku.current || czekaNaZatwierdzenie.current) return; // przegląd P1-2: jedno żądanie zakupu naraz, bez drugiego Ask to Buy
    zakupWToku.current = true;
    ustawKomunikat(null); // linia znika przy następnej akcji
    try {
      const status = await sklep.kup(id).catch(() => 'blad' as const); // wyjątek adaptera = błąd sklepu lub sieci
      const k = komunikatZakupu(status); // sukces → bez linii (stan Pro), anulowany → null (bez komunikatu i bez sukcesu)
      czekaNaZatwierdzenie.current = k === 'czeka';
      ustawOczekujacy(k === 'czeka');
      if (k === 'blad') ustawKomunikat(k);
      await poZmianie();
    } finally { zakupWToku.current = false; }
  }
  async function przywroc(): Promise<void> {
    ustawKomunikat(null); // oczekujący zakup (flaga i blokada „kup”) zostaje: przywrócenie go nie unieważnia (przegląd P1-1)
    const w = await sklep.przywroc().catch(() => ({ ok: false as const }));
    if (!w.ok) { ustawKomunikat('przywroc_blad'); return; }
    await poZmianie();
    if (!kontener.dostep.stan().aktywne && !czekaNaZatwierdzenie.current) ustawKomunikat('przywroc_nic'); // przywrócenie udane, ale Apple ID nie ma zakupu Pro
  }
  const wygas = 'wygas' in sklep && typeof sklep.wygas === 'function' ? (sklep.wygas as () => void) : null;
  return (
    <>
      <Oferty
        stan={{ produkty, aktywne: dostep.aktywne, familySharing: FAMILY_SHARING, komunikat: komunikat ?? (oczekujacy ? 'czeka' : null), oczekujacy }}
        t={kontener.j.t}
        adresy={{ polityka: ADRESY.polityka, warunki: ADRESY.warunki }}
        naKup={(id) => void kup(id)}
        naPrzywroc={() => void przywroc()}
        naZarzadzaj={() => systemAplikacji.zarzadzajSubskrypcja()}
        naOtworzAdres={(u) => systemAplikacji.otworzAdres(u)}
        // E2-137-A2 (scen. 07): oferty otwarte z okna „Uczciwe zasady” (`replace`, modal na modal) kończą jawnie na liście projektów, nie przez `back()` po zamianie modalu.
        naZamknij={() => (skad === 'uczciwe-zasady' ? router.dismissTo('/projekty') : router.back())}
      />
      {paneleE2e && wygas && <paneleE2e.PanelSklepu naWygas={() => { wygas(); void poZmianie(); }} /> /* build E2E (P-238) */}
    </>
  );
}
