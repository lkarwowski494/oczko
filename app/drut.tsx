// Trasa „/drut?id=…”: arkusz drutu albo szydełka (P-191 P8a; BR-ZAP-003). Bez id — nowe narzędzie.
import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FormularzDrutu, type DaneDrutu } from '../src/ekrany/Zapas';
import { StanWczytywania } from '../src/ekrany/StanWczytywania';
import { potwierdzUsuniecie } from '../src/kompozycja/zapas-kosz';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { zglosBladZapisu } from '../src/kompozycja/po-zapisie';
import { useOdrzucZmiany } from '../src/kompozycja/odrzuc-zmiany';
import { bazowa, podgladRozmiaru, stanDrutow } from '../src/kompozycja/zapas';
import { formatujLiczbe } from '../src/i18n/format';
import { MM_NARZEDZIA_MIEJSCA } from '../src/konfiguracja';
import { narzedzia, usunNarzedzie, zapiszNarzedzie } from '../src/przypadki-uzycia/zapas';

export default function EkranDrutu(): React.ReactElement {
  const aplikacja = useAplikacja();
  const { kontener } = aplikacja;
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const j = kontener.j;
  const [poczatek, ustaw] = useState<DaneDrutu | null | undefined>(id ? undefined : null);
  const [blad, ustawBlad] = useState(false); // M1-007: odczyt `{ ok: false }` albo wyjątek → błąd z „Try again” (wcześniej powrót bez słowa albo pusty arkusz)
  const wczytaj = useCallback(async () => {
    if (!id) return;
    const w = await narzedzia(kontener.z).catch(() => null);
    if (!w?.ok) { ustawBlad(true); return; }
    const n = w.wartosc.find((x) => x.id === id);
    if (n) ustaw(n); else router.back(); // narzędzia już nie ma (np. usunięte gdzie indziej)
  }, [kontener, id, router]);
  useEffect(() => { void wczytaj(); }, [wczytaj]);
  // M1-020: „Cancel” i przesunięcie arkusza w dół pytają „Discard changes?”, gdy formularz zgłosił zmianę; po zapisie i usunięciu wyjście bez pytania.
  const odrzuc = useOdrzucZmiany(j.t, id ? 'zmiany' : 'nowy', () => router.back());
  if (poczatek === undefined) return <StanWczytywania tlo="arkusz" stan={blad ? 'blad' : 'ladowanie'} t={j.t} przedrostek="drut" naPonow={() => { ustawBlad(false); void wczytaj(); }} />;
  return (
    <FormularzDrutu t={j.t} poczatek={poczatek} podglad={(x, r) => podgladRozmiaru(x, r, j)} parsuj={(x) => bazowa(x, 'm', j.jezyk())}
      formatuj={(n) => formatujLiczbe(n, j.jezyk(), { maks: MM_NARZEDZIA_MIEJSCA })} naAnuluj={odrzuc.anuluj} naZmiane={odrzuc.naZmiane}
      naUsun={id && poczatek ? () => {
        const w = stanDrutow([{ id, ...poczatek }], j).grupy[0]?.wiersze[0];
        potwierdzUsuniecie(kontener, { nazwa: w?.rozmiar || w?.opis || j.t('druty.inne'), przycisk: j.t('usun.narzedzie'), alert: Alert.alert,
          usun: () => usunNarzedzie(kontener.z, { narzedzieId: id }), potem: () => { odrzuc.poZapisie(); router.back(); }, naBlad: (powod) => zglosBladZapisu(aplikacja, powod) }); // M1-006
      } : undefined}
      naZapisz={async (d) => {
        const w = await zapiszNarzedzie(kontener.z, { ...d, id });
        if (!w.ok) return { ok: false, powod: w.powod === 'bledne_dane' ? 'bledne_dane' : 'zapis' };
        odrzuc.poZapisie();
        router.back();
        return { ok: true, wartosc: undefined };
      }} />
  );
}
