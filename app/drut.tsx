// Trasa „/drut?id=…”: arkusz drutu albo szydełka (P-191 P8a; BR-ZAP-003). Bez id — nowe narzędzie.
import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FormularzDrutu, type DaneDrutu } from '../src/ekrany/Zapas';
import { useKolory } from '../src/ekrany/motyw';
import { potwierdzUsuniecie } from '../src/kompozycja/zapas-kosz';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { zglosBladZapisu } from '../src/kompozycja/po-zapisie';
import { bazowa, podgladRozmiaru, stanDrutow } from '../src/kompozycja/zapas';
import { formatujLiczbe } from '../src/i18n/format';
import { narzedzia, usunNarzedzie, zapiszNarzedzie } from '../src/przypadki-uzycia/zapas';

export default function EkranDrutu(): React.ReactElement {
  const aplikacja = useAplikacja();
  const { kontener } = aplikacja;
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const k = useKolory();
  const j = kontener.j;
  const [poczatek, ustaw] = useState<DaneDrutu | null | undefined>(id ? undefined : null);
  useEffect(() => {
    if (!id) return;
    void narzedzia(kontener.z).then((w) => { const n = w.ok ? w.wartosc.find((x) => x.id === id) : undefined; if (n) ustaw(n); else router.back(); });
  }, [kontener, id, router]);
  if (poczatek === undefined) return <View style={{ flex: 1, backgroundColor: k.arkusz }} />;
  return (
    <FormularzDrutu t={j.t} poczatek={poczatek} podglad={(x, r) => podgladRozmiaru(x, r, j)} parsuj={(x) => bazowa(x, 'm', j.jezyk())}
      formatuj={(n) => formatujLiczbe(n, j.jezyk(), { maks: 2 })} naAnuluj={() => router.back()}
      naUsun={id && poczatek ? () => {
        const w = stanDrutow([{ id, ...poczatek }], j).grupy[0]?.wiersze[0];
        potwierdzUsuniecie(kontener, { nazwa: w?.rozmiar || w?.opis || j.t('druty.inne'), przycisk: j.t('usun.narzedzie'), alert: Alert.alert,
          usun: () => usunNarzedzie(kontener.z, { narzedzieId: id }), potem: () => router.back(), naBlad: (powod) => zglosBladZapisu(aplikacja, powod) }); // M1-006
      } : undefined}
      naZapisz={async (d) => {
        const w = await zapiszNarzedzie(kontener.z, { ...d, id });
        if (!w.ok) return { ok: false, powod: w.powod === 'bledne_dane' ? 'bledne_dane' : 'zapis' };
        router.back();
        return { ok: true, wartosc: undefined };
      }} />
  );
}
