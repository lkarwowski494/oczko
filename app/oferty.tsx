// Trasa „/oferty”: ekran ofert (F-35; KP-13: tylko z komunikatu limitu, z Ustawień i z okna „Uczciwe zasady”). Ceny ze sklepu (KP-09).
// Po zakupie albo przywróceniu: ponowna decyzja dostępu i przeładowanie licznika (limit znika przy Pro). Panel `e2e-sklep-wygas` tylko w buildzie E2E.
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Oferty, type KomunikatOfert, type ProduktyOfert } from '../src/ekrany/Oferty';
import { komunikatZakupu } from '../src/domena/dostep';
import { ADRESY, FAMILY_SHARING } from '../src/kompozycja/adresy';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { systemAplikacji } from '../src/kompozycja/system';
import { paneleE2e } from '../src/platforma/tryb-e2e';

export default function EkranOfert(): React.ReactElement {
  const { kontener, licznik } = useAplikacja();
  const router = useRouter();
  const { sklep } = kontener.porty;
  const [produkty, ustawProdukty] = useState<ProduktyOfert>({ rodzaj: 'ladowanie' });
  const [dostep, ustawDostep] = useState(kontener.dostep.stan());
  const [komunikat, ustawKomunikat] = useState<KomunikatOfert>(null);
  const czekaNaZatwierdzenie = useRef(false); // zakup oczekujący (Ask to Buy) w tej sesji ekranu; po restarcie nie jest pamiętany (design-spec 002)
  useEffect(() => kontener.dostep.naZmiane((s) => {
    ustawDostep(s);
    if (s.aktywne && czekaNaZatwierdzenie.current) { czekaNaZatwierdzenie.current = false; ustawKomunikat('pro_wlaczone'); } // P-330: zatwierdzone poza aplikacją, jednorazowo
  }), [kontener]);
  useEffect(() => {
    void sklep.produkty().then((p) => ustawProdukty(p.length ? { rodzaj: 'gotowe', produkty: p } : { rodzaj: 'brak-sieci' }), () => ustawProdukty({ rodzaj: 'brak-sieci' }));
  }, [sklep]);
  const poZmianie = async () => { await kontener.dostep.odswiez(); await licznik.poZmianie(); };
  async function kup(id: string): Promise<void> {
    ustawKomunikat(null); // linia znika przy następnej akcji
    const status = await sklep.kup(id).catch(() => 'blad' as const); // wyjątek adaptera = błąd sklepu lub sieci
    const k = komunikatZakupu(status); // sukces → bez linii (stan Pro), anulowany → null (bez komunikatu i bez sukcesu)
    czekaNaZatwierdzenie.current = k === 'czeka';
    if (k === 'czeka' || k === 'blad') ustawKomunikat(k);
    await poZmianie();
  }
  async function przywroc(): Promise<void> {
    ustawKomunikat(null);
    czekaNaZatwierdzenie.current = false;
    const w = await sklep.przywroc().catch(() => ({ ok: false as const }));
    if (!w.ok) { ustawKomunikat('przywroc_blad'); return; }
    await poZmianie();
    if (!kontener.dostep.stan().aktywne) ustawKomunikat('przywroc_nic'); // przywrócenie udane, ale Apple ID nie ma zakupu Pro
  }
  const wygas = 'wygas' in sklep && typeof sklep.wygas === 'function' ? (sklep.wygas as () => void) : null;
  return (
    <>
      <Oferty
        stan={{ produkty, aktywne: dostep.aktywne, familySharing: FAMILY_SHARING, komunikat }}
        t={kontener.j.t}
        adresy={{ polityka: ADRESY.polityka, warunki: ADRESY.warunki }}
        naKup={(id) => void kup(id)}
        naPrzywroc={() => void przywroc()}
        naZarzadzaj={() => systemAplikacji.zarzadzajSubskrypcja()}
        naOtworzAdres={(u) => systemAplikacji.otworzAdres(u)}
        naZamknij={() => router.back()}
      />
      {paneleE2e && wygas && <paneleE2e.PanelSklepu naWygas={() => { wygas(); void poZmianie(); }} /> /* build E2E (P-238) */}
    </>
  );
}
