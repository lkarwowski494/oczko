// Trasa „/stan-danych”: stan danych z Ustawień (F-58, BR-DAN-011) jako arkusz: synchronizacja iCloud (partia 7: przełącznik przy
// `ICLOUD_W_1_0` albo atrapie E2E, P-242; stany, problemy, konflikty), zapis na telefonie i ostatni kontakt z zegarkiem (S3, P-193: bez liczby
// zmian — kolejka jest po stronie zegarka, ADR-0009; klucz `zegarek_ostatnia_partia_ms`, P-199 Q5a). Włączenie i wyłączenie przez alert systemowy.
import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { StanDanych, type IcloudStanuDanych } from '../src/ekrany/StanDanych';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { otworzUstawieniaSystemu } from '../src/kompozycja/system';
import { paneleE2e } from '../src/platforma/tryb-e2e';
import { icloudOstatniaUdanaMs, zegarekOstatniaPartiaMs } from '../src/dane/repozytoria/ustawienia';
import { licznikiWKonflikcie, najstarszyWPoczekalni, nowszaWersjaWPoczekalni, pierwszyLicznikWKonflikcie, stanBazy } from '../src/dane/repozytoria/icloud';
import { POCZEKALNIA_DNI } from '../src/konfiguracja';
import type { WidokSynchronizacji } from '../src/przypadki-uzycia/synchronizacja';

type DaneIcloud = { wlaczona: boolean; konflikty: number; niepelna: boolean; niepelnaNowsza: boolean };

export default function EkranStanuDanych(): React.ReactElement {
  const { kontener, licznik } = useAplikacja();
  const router = useRouter();
  const j = kontener.j;
  const t = j.t;
  const ic = kontener.icloud;
  const [kontaktMs, ustawKontakt] = useState<number | null>(null);
  const [udanaMs, ustawUdana] = useState<number | null>(null); // 015: czas ostatniej udanej synchronizacji iCloud (klucz stanu urządzenia)
  const [widok, ustawWidok] = useState<WidokSynchronizacji | null>(ic ? ic.sterownik.widok() : null);
  const [dane, ustawDane] = useState<DaneIcloud | null>(null);
  const [e2e, ustawE2e] = useState(ic?.e2e ? ic.e2e.stan() : null);
  const odswiez = useCallback(async () => {
    const b = kontener.z.baza;
    const s = await stanBazy(b);
    const najstarszy = await najstarszyWPoczekalni(b);
    const granica = kontener.z.zegar.teraz().ms - POCZEKALNIA_DNI * 86_400_000;
    ustawUdana(await icloudOstatniaUdanaMs(b));
    ustawDane({ wlaczona: s.wlaczona, konflikty: await licznikiWKonflikcie(b), niepelna: najstarszy !== null && najstarszy < granica, niepelnaNowsza: await nowszaWersjaWPoczekalni(b, granica) });
  }, [kontener]);
  useEffect(() => { void zegarekOstatniaPartiaMs(kontener.z.baza).then(ustawKontakt); }, [kontener]);
  useFocusEffect(useCallback(() => { void odswiez(); }, [odswiez]));
  useEffect(() => ic?.sterownik.obserwuj((w) => { ustawWidok(w); void odswiez(); }), [ic, odswiez]);
  useEffect(() => ic?.naPartie(() => void odswiez()), [ic, odswiez]);
  useEffect(() => (ic?.e2e ? ic.e2e.obserwuj(() => ustawE2e(ic.e2e ? ic.e2e.stan() : null)) : undefined), [ic]);

  const strefa = kontener.z.zegar.teraz().strefa;
  const zegarek = kontaktMs === null ? null : {
    ostatniKontakt: new Intl.DateTimeFormat(j.jezyk(), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: !j.zegar24h(), timeZone: strefa }).format(new Date(kontaktMs)),
  };
  const godzina = (ms: number) => new Intl.DateTimeFormat(j.jezyk(), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: !j.zegar24h(), timeZone: strefa }).format(new Date(ms));
  const naPrzelacz = (wlacz: boolean) => {
    if (!ic) return;
    if (wlacz) {
      Alert.alert(t('icloud.wlacz_tytul'), t('icloud.wlacz_opis'), [
        { text: t('wspolne.anuluj'), style: 'cancel' },
        { text: t('icloud.wlacz_potwierdz'), onPress: () => void ic.sterownik.wlacz().then(() => odswiez()) },
      ]);
    } else {
      Alert.alert(t('icloud.wylacz_tytul'), t('icloud.wylacz_opis'), [
        { text: t('wspolne.anuluj'), style: 'cancel' },
        { text: t('icloud.wylacz_potwierdz'), onPress: () => void ic.sterownik.wylacz().then(() => odswiez()) },
      ]);
    }
  };
  // Inne konto (ADR-0005, P-110 Q9a): alert z wyborem; wysyłka zatrzymana do decyzji.
  useEffect(() => {
    if (!ic || widok?.stan !== 'konto_zmienione') return;
    Alert.alert(t('icloud.konto_zmienione_tytul'), t('icloud.konto_zmienione_opis'), [
      { text: t('icloud.nie_synchronizuj'), style: 'cancel', onPress: () => void ic.sterownik.nieSynchronizuj().then(() => odswiez()) },
      { text: t('icloud.polacz'), onPress: () => void ic.sterownik.polacz().then(() => odswiez()) },
    ]);
  }, [ic, widok?.stan, t, odswiez]);

  // 019 (P-220 I1a): ekran wyboru działa na bieżącym liczniku, więc najpierw otwieramy licznik w konflikcie.
  const naKonflikty = () => void pierwszyLicznikWKonflikcie(kontener.z.baza).then(async (id) => {
    if (!id) return; // konflikt rozstrzygnięty w międzyczasie
    await licznik.otworz(id);
    router.push('/konflikt');
  });
  const synchronizacja = widok?.stan ?? 'wylaczona';
  const icloud: IcloudStanuDanych | undefined = ic && ic.widoczny && dane ? {
    wlaczona: dane.wlaczona, stan: synchronizacja, przyczyna: widok?.przyczyna ?? null, konflikty: dane.konflikty, niepelna: dane.niepelna, niepelnaNowsza: dane.niepelnaNowsza, synchronizuje: widok?.synchronizuje === true,
    naPrzelacz, naKonflikty, naUstawienia: otworzUstawieniaSystemu, naZarzadzaj: otworzUstawieniaSystemu, // „Manage storage”: bez publicznego adresu strony iCloud — Ustawienia
  } : undefined;
  const panelE2e = paneleE2e && e2e ? <paneleE2e.PanelIcloud wyslane={e2e.wyslane} usuniete={e2e.usuniete} /> : null;
  return <StanDanych stan={{ synchronizacja, ostatniaUdana: udanaMs === null ? null : godzina(udanaMs), czekaNaSiec: false, zegarek }} t={t} naZamknij={() => router.back()} icloud={icloud} panelE2e={panelE2e} />;
}
