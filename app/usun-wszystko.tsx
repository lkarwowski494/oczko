// Trasa „/usun-wszystko”: arkusz „Delete all data” (BR-DAN-009, P-229, P-266 (3)). Przełącznik iCloud tylko przy włączonej synchronizacji;
// po usunięciu silnik wyłączony (L1: skrzynka pusta), strefa iCloud tylko na życzenie, licznik od nowa i powrót do listy projektów.
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArkuszUsunWszystko } from '../src/ekrany/UsunWszystko';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { Bezpieczny } from '../src/kompozycja/Bezpieczny';
import { usunWszystkieDane } from '../src/przypadki-uzycia/projekt';
import { stanBazy } from '../src/dane/repozytoria/icloud';

export default function EkranUsunWszystko(): React.ReactElement {
  const { kontener, licznik } = useAplikacja();
  const router = useRouter();
  const z = kontener.z;
  const [icloudWlaczona, ustawIcloud] = useState(false);
  const [blad, ustawBlad] = useState(false);
  useEffect(() => { if (kontener.icloud) void stanBazy(z.baza).then((s) => ustawIcloud(s.wlaczona)); }, [kontener, z]);
  async function usun(takzeZIcloud: boolean): Promise<void> {
    const w = await usunWszystkieDane(z);
    if (!w.ok) {
      if ('etap' in w) Alert.alert(kontener.j.t('ustawienia.usun_wszystko'), kontener.j.t('ustawienia.usun_kopia_blad'), [{ text: kontener.j.t('wspolne.ok') }]); // ADR-0028: kopia się nie zapisała, dane nietknięte
      else ustawBlad(true);
      return;
    }
    if (kontener.icloud) {
      await kontener.icloud.sterownik.wylacz();
      if (takzeZIcloud) await kontener.icloud.sterownik.usunZIcloud();
    }
    licznik.zresetuj();
    router.dismissTo('/projekty');
  }
  return (
    <Bezpieczny>
      <ArkuszUsunWszystko t={kontener.j.t} icloudWlaczona={icloudWlaczona} blad={blad} naUsun={(x) => void usun(x)} naZamknij={() => router.back()} />
    </Bezpieczny>
  );
}
