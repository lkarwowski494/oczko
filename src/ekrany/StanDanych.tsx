// Stan danych: synchronizacja iCloud i zegarek (F-58, BR-DAN-011). Sygnatura: propozycja 07 (E3, P-202), granice 05 (Z07-22).
// Liczbę zmian czekających pokazuje tylko zegarek (P-193). Zawsze mówi, że dane są zapisane na telefonie (bez straszenia utratą, design-spec „Głos”).
// iCloud (partia 7, design-spec „iCloud (I1a–I3)”, makieta fix7 `udostepnij-icloud.html`): przełącznik domyślnie wyłączony, stan (role=status),
// linia problemu z ikoną „!” albo „i” (nigdy sam kolor), wiersz liczników w konflikcie. Bez `icloud` (ZM-06, P-242) cały wiersz ukryty.
// Potwierdzenia włączenia i wyłączenia (alerty systemowe) robi kompozycja.
import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Arkusz, Przycisk, Tresc } from './Arkusz';
import { cel, odstep, typografia, useKolory } from './motyw';
import type { StanSynchronizacji } from '../domena/porty';
import type { Tlumacz } from './wspolne';

export type IcloudStanuDanych = {
  wlaczona: boolean;
  stan: StanSynchronizacji;
  przyczyna: 'brak_miejsca' | 'siec' | 'inny' | null;
  konflikty: number;
  niepelna: boolean;                   // rekord z iCloud w poczekalni ponad POCZEKALNIA_DNI (P-110 Q1a)
  synchronizuje?: boolean;             // wysyłka w toku → icloud.synchronizuje zamiast stan_danych.ostatnia (design-spec I1a–I3)
  niepelnaNowsza?: boolean;            // wśród nich rekord nowszej wersji aplikacji → icloud.niepelna_nowsza (design-spec I1a–I3)
  naPrzelacz(wlacz: boolean): void;
  naUstawienia(): void;                // „Open Settings” (ustawienia systemu)
  naZarzadzaj(): void;                 // „Manage storage”
  naKonflikty?(): void;
};
export type PropsStanuDanych = {
  stan: {
    synchronizacja: StanSynchronizacji;
    ostatniaUdana: string | null;     // sformatowana data i godzina
    czekaNaSiec: boolean;
    zegarek: { ostatniKontakt: string } | null;   // sformatowany czas ostatniej partii z zegarka; null = nigdy (BR-DAN-011/S3, P-193)
  };
  t: Tlumacz;
  naZamknij?(): void;
  icloud?: IcloudStanuDanych;
  kopie?: boolean;                      // P-339 (N-05-2): w Documents/Backup są kopie Oczka → cichy podpis stan_danych.kopie_opis; bez kopii nic nie jest pokazane
  panelE2e?: React.ReactNode;
};

function Problem({ ikona, naglowek, opis, przycisk }: { ikona: '!' | 'i'; naglowek: string; opis: string; przycisk?: { tekst: string; onPress(): void } }): React.ReactElement {
  const k = useKolory();
  return (
    <View style={{ flexDirection: 'row', gap: odstep.s, alignItems: 'flex-start' }}>
      <Text style={{ ...typografia.tresc, color: k.tekst, fontWeight: '700' }} importantForAccessibility="no" accessibilityElementsHidden>{ikona}</Text>
      <View style={{ flex: 1, gap: odstep.xs }}>
        <Text style={{ ...typografia.tresc, color: k.tekst, fontWeight: '600' }} testID="icloud-problem" accessibilityRole="text">{naglowek}</Text>
        <Text style={{ ...typografia.podpis, color: k.tekst2 }}>{opis}</Text>
        {przycisk && <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}><Przycisk tekst={przycisk.tekst} onPress={przycisk.onPress} rodzaj="tekstowy" /></View>}
      </View>
    </View>
  );
}

export function StanDanych({ stan: s, t, naZamknij, icloud: i, kopie, panelE2e }: PropsStanuDanych): React.ReactElement {
  const k = useKolory();
  const st = StyleSheet.create({ wiersz: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: odstep.s, minHeight: cel.minimum } });
  if (!i) {
    return (
      <Arkusz tytul={t('stan_danych.tytul')} przyciski={naZamknij ? <Przycisk tekst={t('wspolne.zamknij')} onPress={naZamknij} rodzaj="tekstowy" testID="arkusz-zamknij" /> : null}>
        <Tresc>{t(s.synchronizacja === 'wylaczona' ? 'stan_danych.wylaczona' : 'stan_danych.aktywna')}</Tresc>
        {s.ostatniaUdana && <Tresc podpis>{t('stan_danych.ostatnia', { data: s.ostatniaUdana })}</Tresc>}
        {s.czekaNaSiec && <Tresc>{t('stan_danych.czeka')}</Tresc>}
        <Tresc>{t('stan_danych.zapisane')}</Tresc>
        {s.zegarek && <Tresc podpis>{t('stan_danych.zegarek_kontakt', { data: s.zegarek.ostatniKontakt })}</Tresc>}
        {kopie && <Tresc podpis testID="stan-danych-kopie">{t('stan_danych.kopie_opis')}</Tresc>}
        {panelE2e}
      </Arkusz>
    );
  }
  const czeka = s.czekaNaSiec || (i.stan === 'blad' && i.przyczyna === 'siec');
  return (
    <Arkusz tytul={t('stan_danych.tytul')} przyciski={naZamknij ? <Przycisk tekst={t('wspolne.zamknij')} onPress={naZamknij} rodzaj="tekstowy" testID="arkusz-zamknij" /> : null}>
      <View style={st.wiersz}>
        <Text style={{ ...typografia.tresc, color: k.tekst, flex: 1 }} importantForAccessibility="no" accessibilityElementsHidden>{t('icloud.przelacznik')}</Text>
        <Switch accessibilityRole="switch" accessibilityLabel={t('icloud.przelacznik')} accessibilityState={{ checked: i.wlaczona }} value={i.wlaczona}
          onValueChange={i.naPrzelacz} testID="icloud-przelacznik" />
      </View>
      <Tresc podpis>{t('icloud.opis')}</Tresc>
      <View accessibilityRole="summary" accessibilityLiveRegion="polite" testID="icloud-stan" style={{ gap: odstep.xs }}>
        {i.wlaczona && !czeka && i.stan === 'aktywna' && <Tresc>{t('stan_danych.aktywna')}</Tresc>}
        {!i.wlaczona && <Tresc>{t('stan_danych.wylaczona')}</Tresc>}
        {i.wlaczona && czeka && <Tresc>{t('stan_danych.czeka')}</Tresc>}
        {i.wlaczona && !czeka && i.synchronizuje && <Tresc podpis>{t('icloud.synchronizuje')}</Tresc>}
        {i.wlaczona && !i.synchronizuje && s.ostatniaUdana && <Tresc podpis>{t('stan_danych.ostatnia', { data: s.ostatniaUdana })}</Tresc>}
        <Tresc>{t('stan_danych.zapisane')}</Tresc>
        {s.zegarek && <Tresc podpis>{t('stan_danych.zegarek_kontakt', { data: s.zegarek.ostatniKontakt })}</Tresc>}
      </View>
      {i.stan === 'brak_konta' && <Problem ikona="!" naglowek={t('icloud.brak_konta')} opis={t('icloud.brak_konta_opis')} przycisk={{ tekst: t('icloud.ustawienia'), onPress: i.naUstawienia }} />}
      {i.stan === 'blad' && i.przyczyna === 'brak_miejsca' && <Problem ikona="!" naglowek={t('icloud.brak_miejsca')} opis={t('icloud.brak_miejsca_opis')} przycisk={{ tekst: t('icloud.zarzadzaj'), onPress: i.naZarzadzaj }} />}
      {i.niepelna && <Problem ikona="i" naglowek={t('icloud.niepelna')} opis={t(i.niepelnaNowsza ? 'icloud.niepelna_nowsza' : 'icloud.niepelna_opis')} />}
      {i.konflikty > 0 && (
        <View testID="icloud-konflikty">
          {i.naKonflikty ? <Przycisk tekst={t('icloud.konflikty', { count: i.konflikty })} onPress={i.naKonflikty} rodzaj="tekstowy" /> : <Tresc>{t('icloud.konflikty', { count: i.konflikty })}</Tresc>}
        </View>
      )}
      {kopie && <Tresc podpis testID="stan-danych-kopie">{t('stan_danych.kopie_opis')}</Tresc>}
      {panelE2e}
    </Arkusz>
  );
}
