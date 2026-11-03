// Trasa „/historia”: arkusz historii bieżącego licznika (F-02, BR-LIC-003); „Undo” cofa ostatnią zmianę, która nie jest cofnięta (P-091 (3a), 07-jakosc-021); starszą pomyłkę poprawia wpisanie wartości (BR-LIC-003/S4).
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Historia, type WpisHistorii } from '../src/ekrany/Historia';
import { StanWczytywania } from '../src/ekrany/StanWczytywania';
import { formatujGodzine } from '../src/i18n/format';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { zapisano } from '../src/kompozycja/po-zapisie';
import type { Wynik } from '../src/domena/bledy';
import { cofnijOstatnie, cofnijSerie } from '../src/przypadki-uzycia/licznik';
import { historiaLicznika } from '../src/przypadki-uzycia/widok-licznika';

const OPIS = { zerowanie: 'historia.opis_zerowanie', wpisanie: 'historia.opis_wpisanie', cofniecie: 'historia.opis_cofniecie' } as const;

export default function EkranHistorii(): React.ReactElement {
  const aplikacja = useAplikacja();
  const { kontener, licznik } = aplikacja;
  const router = useRouter();
  const { t, jezyk, zegar24h } = kontener.j;
  const [wpisy, ustaw] = useState<WpisHistorii[] | null>(null); // M1-152: null = jeszcze nie wczytano („Loading…”), nie pusta historia
  const [blad, ustawBlad] = useState(false); // M1-152: odczyt `{ ok: false }` albo wyjątek → błąd z „Try again” i „Close” (arkusz, M1-094)
  const [licznikId, ustawId] = useState<string | null>(null);
  const wczytaj = useCallback(async () => {
    const w = await licznik.widok().catch(() => undefined);
    if (w === undefined) { ustawBlad(true); return; }
    ustawId(w?.licznikId ?? null);
    if (!w) { ustaw([]); ustawBlad(false); return; }
    const h = await historiaLicznika(kontener.z, { licznikId: w.licznikId }).catch(() => null);
    if (!h?.ok) { ustawBlad(true); return; }
    const strefa = kontener.z.zegar.teraz().strefa;
    ustawBlad(false);
    ustaw(h.wartosc.map((x) => ({
      id: x.id, z: x.z, na: x.na, godzina: formatujGodzine(new Date(x.czasMs), jezyk(), { uses24h: zegar24h(), strefa }),
      opis: x.rodzaj in OPIS ? t(OPIS[x.rodzaj as keyof typeof OPIS]) : null,
      cofniety: x.cofniety, mozeCofnac: x.mozeCofnac,
      seria: x.seria && { ile: x.seria.ile, odZdarzeniaId: x.seria.odZdarzeniaId, czas: new Intl.NumberFormat(jezyk(), { style: 'unit', unit: 'second', unitDisplay: 'narrow' }).format(x.seria.sekundy) },
    })));
  }, [kontener, licznik, t, jezyk, zegar24h]);
  useEffect(() => { void wczytaj(); }, [wczytaj]);
  const poCofnieciu = async (r: Wynik<unknown>) => { if (zapisano(aplikacja, r)) { await licznik.poZmianie(); await wczytaj(); } }; // M1-006: błąd zapisu → alert
  if (!wpisy) return <StanWczytywania wyjscie={{ rodzaj: 'zamknij', naWyjdz: () => router.back() }} tlo="arkusz" stan={blad ? 'blad' : 'ladowanie'} t={t} przedrostek="historia" naPonow={() => { ustawBlad(false); void wczytaj(); }} />;
  return (
    <Historia stan={{ wpisy }} t={t} naZamknij={() => router.back()}
      naCofnij={async () => { if (licznikId) await poCofnieciu(await cofnijOstatnie(kontener.z, { licznikId })); }}
      naCofnijSerie={async (odZdarzeniaId) => { if (licznikId) await poCofnieciu(await cofnijSerie(kontener.z, { licznikId, odZdarzeniaId, zrodlo: 'historia' })); }}
      naWpisz={() => router.replace({ pathname: '/formularz/[rodzaj]', params: { rodzaj: 'wpisz' } })} />
  );
}
