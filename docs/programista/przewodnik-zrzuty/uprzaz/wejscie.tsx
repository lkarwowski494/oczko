(globalThis as any).jest = { fn: (f?: any) => f ?? (() => undefined) };
import React from 'react';
import { AccessibilityInfo, AppRegistry, View } from 'react-native';
(AccessibilityInfo as any).isDarkerSystemColorsEnabled ??= async () => false; // tylko iOS; web: brak „Zwiększ kontrast”
import { utworzI18n } from '../../../../../../home/user/oczko/src/i18n/i18n';
import { ZASOBY } from '../../../../../../home/user/oczko/src/i18n/slowniki';
import { Przewodnik } from '../../../../../../home/user/oczko/src/ekrany/Przewodnik';
import { Dzis } from '../../../../../../home/user/oczko/src/ekrany/Dzis';
import { Ustawienia } from '../../../../../../home/user/oczko/src/ekrany/Ustawienia';
import { stanLicznika, atrapaHaptyki, atrapaSystemu, plusOk } from '../../../../../../home/user/oczko/tests/ekrany/pomoc';

const q = new URLSearchParams(location.search);
const ekran = q.get('ekran') ?? 'przewodnik';
const jezyk = q.get('jezyk') ?? 'pl';
const nic = () => undefined;
async function start() {
  const j = await utworzI18n({ magazyn: { odczytaj: async () => jezyk, zapisz: async () => undefined }, systemowe: () => [jezyk], zasoby: ZASOBY as never });
  const t = j.t as never;
  let el: React.ReactElement;
  if (ekran === 'dzis') {
    el = <Dzis stan={stanLicznika({ projekt: jezyk === 'pl' ? 'Sweter Mgła' : 'Mist Sweater', czesc: jezyk === 'pl' ? 'Lewy rękaw' : 'Left sleeve', skonczone: 42, dziergany: 43, cel: 96 })} dane={null} t={t} oglos={nic} haptyka={atrapaHaptyki()}
      naPlus={async () => plusOk(43)} naCofnijSerie={nic} naOferty={nic} naKontynuuj={nic} naWybierzProjekt={nic} naUstawienia={nic} naPrzewodnik={nic} />;
  } else if (ekran === 'ustawienia') {
    el = <Ustawienia stan={{ pro: null, dni: null, wibracje: true }} t={t} system={atrapaSystemu()} adresy={{ polityka: '', wsparcie: '', recenzja: '' }}
      naOferty={nic} naWibracje={nic} naZglosProblem={nic} naStanDanych={nic} naZrodla={nic} naLicencje={nic} przewodnik={{ postep: { n: 3, m: 42 }, naPrzewodnik: nic }} naWstecz={nic} />;
  } else {
    el = <Przewodnik t={t} jezyk={jezyk} przeczytane={['kontynuuj', 'plus', 'cel']} parametry={{ limit: 5 }} otwarta={q.get('otwarta') ?? 'cel'} naRozwin={nic} naPokaz={nic} naWstecz={nic} />;
  }
  AppRegistry.registerComponent('U', () => () => <View style={{ flex: 1 }}>{el}</View>);
  AppRegistry.runApplication('U', { rootTag: document.getElementById('root') });
  (window as any).gotowe = true;
}
void start();
