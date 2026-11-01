// Trasa „/historia”: arkusz historii bieżącego licznika (F-02, BR-LIC-003); „Undo” cofa ostatnią zmianę, która nie jest cofnięta (P-091 (3a), 07-jakosc-021); starszą pomyłkę poprawia wpisanie wartości (BR-LIC-003/S4).
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Historia, type WpisHistorii } from '../src/ekrany/Historia';
import { formatujGodzine } from '../src/i18n/format';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { cofnijOstatnie, cofnijSerie } from '../src/przypadki-uzycia/licznik';
import { historiaLicznika } from '../src/przypadki-uzycia/widok-licznika';

const OPIS = { zerowanie: 'historia.opis_zerowanie', wpisanie: 'historia.opis_wpisanie', cofniecie: 'historia.opis_cofniecie' } as const;

export default function EkranHistorii(): React.ReactElement {
  const { kontener, licznik } = useAplikacja();
  const router = useRouter();
  const { t, jezyk, zegar24h } = kontener.j;
  const [wpisy, ustaw] = useState<WpisHistorii[]>([]);
  const [licznikId, ustawId] = useState<string | null>(null);
  const wczytaj = useCallback(async () => {
    const w = await licznik.widok();
    ustawId(w?.licznikId ?? null);
    if (!w) { ustaw([]); return; }
    const h = await historiaLicznika(kontener.z, { licznikId: w.licznikId });
    const strefa = kontener.z.zegar.teraz().strefa;
    if (h.ok) ustaw(h.wartosc.map((x) => ({
      id: x.id, z: x.z, na: x.na, godzina: formatujGodzine(new Date(x.czasMs), jezyk(), { uses24h: zegar24h(), strefa }),
      opis: x.rodzaj in OPIS ? t(OPIS[x.rodzaj as keyof typeof OPIS]) : null,
      cofniety: x.cofniety, mozeCofnac: x.mozeCofnac,
      seria: x.seria && { ile: x.seria.ile, odZdarzeniaId: x.seria.odZdarzeniaId, czas: new Intl.NumberFormat(jezyk(), { style: 'unit', unit: 'second', unitDisplay: 'narrow' }).format(x.seria.sekundy) },
    })));
  }, [kontener, licznik, t, jezyk, zegar24h]);
  useEffect(() => { void wczytaj(); }, [wczytaj]);
  const poCofnieciu = async (r: { ok: boolean }) => { if (r.ok) { await licznik.poZmianie(); await wczytaj(); } };
  return (
    <Historia stan={{ wpisy }} t={t} naZamknij={() => router.back()}
      naCofnij={async () => { if (licznikId) await poCofnieciu(await cofnijOstatnie(kontener.z, { licznikId })); }}
      naCofnijSerie={async (odZdarzeniaId) => { if (licznikId) await poCofnieciu(await cofnijSerie(kontener.z, { licznikId, odZdarzeniaId })); }}
      naWpisz={() => router.replace({ pathname: '/formularz/[rodzaj]', params: { rodzaj: 'wpisz' } })} />
  );
}
