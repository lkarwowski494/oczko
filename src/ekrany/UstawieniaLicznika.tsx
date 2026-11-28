// Arkusz „Ustawienia licznika” (ZM-24 krok „+1/+2”, P-1102; ZM-25 „Podpowiedz, gdy zapomnę +1”, P-1103): otwierany z ••• licznika (`licznik-menu-ustawienia`).
// Krok to ustawienie licznika (`licznik.krok`); podpowiedź to preferencja urządzenia (próg w minutach albo `null` = wyłączona). Przełącznik domyślnie wyłączony,
// lista progu tylko przy włączonym, domyślny próg po włączeniu 10 min (parametr produktowy [OCENA], `PODPOWIEDZ_PROG_DOMYSLNY_MIN`).
import React, { useState } from 'react';
import { Switch, View } from 'react-native';
import { PODPOWIEDZ_PROGI_MIN, PODPOWIEDZ_PROG_DOMYSLNY_MIN } from '../konfiguracja';
import { Arkusz, KomunikatZapisu, Tresc, Wybor, useZglosZmiane } from './Arkusz';
import { WyborKroku } from './FormularzeProjektu';
import { odstep } from './motyw';
import type { Tlumacz } from './wspolne';

export type UstawieniaLicznikaZapis = { krok: 1 | 2; podpowiedzMin: number | null };
export type PropsUstawienLicznika = {
  t: Tlumacz; krok: 1 | 2; podpowiedzMin: number | null;
  naZapisz(u: UstawieniaLicznikaZapis): Promise<{ ok: boolean }> | void; naAnuluj(): void;
  naZmiane?(zmieniono: boolean): void;
};
export function UstawieniaLicznika(p: PropsUstawienLicznika): React.ReactElement {
  const { t } = p;
  const [krok, ustawKrok] = useState<1 | 2>(p.krok);
  const [prog, ustawProg] = useState<number | null>(p.podpowiedzMin);
  const [blad, ustawBlad] = useState(false);
  useZglosZmiane(p.naZmiane, krok !== p.krok || prog !== p.podpowiedzMin);
  const zapisz = async () => {
    const w = await p.naZapisz({ krok, podpowiedzMin: prog });
    if (w && !w.ok) ustawBlad(true);
    else if (blad) ustawBlad(false);
  };
  return (
    <Arkusz tytul={t('licznik.menu_ustawienia')} formularz={{ t, naZapisz: () => void zapisz(), naAnuluj: p.naAnuluj }}>
      <Tresc podpis>{t('formularz.krok')}</Tresc>
      <WyborKroku t={t} krok={krok} naWybor={ustawKrok} prefiks="ustawienia-licznika" />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: odstep.m }}>
        <Tresc>{t('formularz.podpowiedz_plus')}</Tresc>
        <Switch accessibilityRole="switch" accessibilityLabel={t('formularz.podpowiedz_plus')} accessibilityState={{ checked: prog !== null }} value={prog !== null}
          onValueChange={(wlaczone) => ustawProg(wlaczone ? PODPOWIEDZ_PROG_DOMYSLNY_MIN : null)} testID="ustawienia-licznika-podpowiedz" />
      </View>
      {prog !== null && (
        <>
          <Tresc podpis>{t('formularz.podpowiedz_prog')}</Tresc>
          <Wybor<string> wybrana={String(prog)} naWybor={(w) => ustawProg(Number(w))}
            opcje={PODPOWIEDZ_PROGI_MIN.map((m) => ({ wartosc: String(m), tekst: t('formularz.podpowiedz_minuty', { count: m }), testID: `ustawienia-licznika-prog-${m}` }))} />
        </>
      )}
      <Tresc podpis>{t('formularz.podpowiedz_opis')}</Tresc>
      {blad && <KomunikatZapisu t={t} />}
    </Arkusz>
  );
}
