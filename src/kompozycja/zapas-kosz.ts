// Potwierdzenie usunięcia włóczki albo narzędzia (P-209; design-spec:51 „Delete {object}”): tytuł z nazwą, opis z terminem kosza
// (dzień usunięcia + KOSZ_DNI, jak projekt), przycisk destrukcyjny; po usunięciu ogłoszenie VoiceOver i powrót. M1-006: nieudane usunięcie → `naBlad(powod)` (alert błędu zapisu), bez powrotu.
import type { Powod, Wynik } from '../domena/bledy';
import { dzienLokalny } from '../domena/postep';
import { KOSZ_DNI } from '../konfiguracja';
import { dodajDni } from '../przypadki-uzycia/daty';
import { krotkaData } from './projekt';
import { oglos } from './system';
import type { Kontener } from './kontener';

type Alert = (tytul: string, opis: string, przyciski: { text: string; style: 'cancel' | 'destructive'; onPress?: () => void }[]) => void;
export function potwierdzUsuniecie(k: Pick<Kontener, 'j' | 'z'>, o: { nazwa: string; przycisk: string; alert: Alert; usun(): Promise<Wynik<void>>; potem(): void; naBlad(powod: Powod): void }): void {
  const t = k.j.t, ch = k.z.zegar.teraz();
  const d = dzienLokalny(ch.ms, ch.strefa);
  const data = d.ok ? krotkaData(dodajDni(d.wartosc, KOSZ_DNI), k.j.jezyk()) : '';
  o.alert(t('usun.tytul', { nazwa: o.nazwa }), t('usun.projekt_opis', { data }), [
    { text: t('wspolne.anuluj'), style: 'cancel' },
    { text: o.przycisk, style: 'destructive', onPress: () => void o.usun().then((r) => { if (!r.ok) { o.naBlad(r.powod); return; } oglos(t('usun.ogloszenie', { nazwa: o.nazwa })); o.potem(); }) },
  ]);
}
