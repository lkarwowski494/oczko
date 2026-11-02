// „Discard changes?” w arkuszach formularzy (M1-audytor-generalny-020, 04-studio-projektowe-004; design-spec aneks M2 p2, DEC-28 a; wzorzec Treningu
// `confirmDiscard`): gdy wartości różnią się od tych z otwarcia arkusza, „Cancel” i systemowe przesunięcie arkusza w dół pytają; bez zmian arkusz
// zamyka się od razu. Gest zostaje włączony (SP-15): `usePreventRemove` zatrzymuje usunięcie ekranu (native stack: `preventNativeDismiss`),
// a „Discard changes” kończy je akcją z gestu. Po udanym zapisie trasa woła `poZapisie()` przed `router.back()`, więc wyjście idzie bez pytania.
import { useRef, useState } from 'react';
import { useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { pytajOdrzucZmiany, type OpisOdrzucenia } from '../ekrany/pytanie-odrzucenia';
import type { Tlumacz } from '../ekrany/wspolne';

export type { OpisOdrzucenia };

export type OdrzucZmiany = {
  /** Formularz zgłasza, czy jego wartości różnią się od tych z otwarcia arkusza. */
  naZmiane(zmieniony: boolean): void;
  /** „Cancel” w nagłówku arkusza: bez zmian — wyjście od razu, ze zmianami — pytanie. */
  anuluj(): void;
  /** Po udanym zapisie, przed wyjściem z arkusza: następne usunięcie ekranu bez pytania. */
  poZapisie(): void;
};

export function useOdrzucZmiany(t: Tlumacz, opis: OpisOdrzucenia, wyjdz: () => void): OdrzucZmiany {
  const [zmieniony, naZmiane] = useState(false);
  const zwolniony = useRef(false);
  const navigation = useNavigation();
  const pytaj = (odrzuc: () => void) => pytajOdrzucZmiany(t, opis, () => { zwolniony.current = true; odrzuc(); });
  usePreventRemove(zmieniony, ({ data }) => {
    if (zwolniony.current) navigation.dispatch(data.action);
    else pytaj(() => navigation.dispatch(data.action));
  });
  return {
    naZmiane,
    anuluj: () => { if (zmieniony) pytaj(wyjdz); else wyjdz(); },
    poZapisie: () => { zwolniony.current = true; },
  };
}
