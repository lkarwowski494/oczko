// Arkusze projektu i części (08 partia 5; design-spec „Projekt, części i kosz” → „Arkusze”, makiety fix5 `nowy-projekt`, `dodaj-czesc`, `dodaj-licznik`,
// `notatka`, `znaczenie`, `narzedzie`, `co-dalej`; P-183). Teksty z łatki 04 fix-5; walidacja reguł w domenie i przypadkach użycia, ekran pokazuje
// komunikat i nie woła zapisu z błędną wartością (jak Formularze.tsx). Wybór daty terminu: P-186.
import React, { useEffect, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Pressable, Text } from 'react-native';
import { Arkusz, Komunikat, KomunikatZapisu, Pole, Przycisk, Tresc, Wybor, liczbaZPola, style as styleArkusza, useZglosZmiane } from './Arkusz';
import { cel, odstep, useKolory } from './motyw';
import { PoleWyboru } from './ZnacznikRadio';
import { formatujLiczbe, parsujLiczbe } from '../i18n/format';
import { MM_NARZEDZIA_MIEJSCA } from '../konfiguracja';
import type { Tlumacz, WynikEkranu } from './wspolne';

export type Zapis<T> = (w: T) => Promise<WynikEkranu<unknown>>;
/** Wartości różne od tych z otwarcia arkusza („Discard changes?”, M1-audytor-generalny-020). */
type NaZmiane = { naZmiane?(zmieniony: boolean): void };
/** Nieudany zapis → komunikat „Couldn’t save…” (jak arkusz nazwy), wpisane dane zostają. */
export function useZapis(): [boolean, <T>(f: Zapis<T>, w: T) => void] {
  const [blad, ustaw] = useState(false);
  return [blad, (f, w) => { ustaw(false); void f(w).then((r) => { if (!r.ok) ustaw(true); }); }];
}
/** Cel opcjonalny: puste = brak, liczba ≥ 1, inaczej błąd (`'zly'`). */
const celZPola = (t: string): number | null | 'zly' => { if (t.trim() === '') return null; const n = liczbaZPola(t); return n === null || n < 1 ? 'zly' : n; };

/** Nowy projekt (F-14, U-5): pusta nazwa = projekt roboczy (P-126 (1b)), bez części = jedna część domyślna. */
export function FormularzNowegoProjektu(p: { t: Tlumacz; naZapisz: Zapis<{ nazwa: string; czesci: string[] }>; naAnuluj(): void } & NaZmiane): React.ReactElement {
  const { t } = p;
  const [nazwa, ustawNazwe] = useState('');
  const [czesci, ustawCzesci] = useState<string[]>([]);
  useZglosZmiane(p.naZmiane, nazwa !== '' || czesci.some((c) => c !== '')); // pusty wiersz części nic nie dodaje
  const [blad, zapisz] = useZapis();
  return (
    <Arkusz tytul={t('formularz.nowy_tytul')} formularz={{ t, zapisz: t('wspolne.dodaj'), naAnuluj: p.naAnuluj, naZapisz: () => zapisz(p.naZapisz, { nazwa: nazwa.trim(), czesci: czesci.map((c) => c.trim()).filter((c) => c !== '') }) }}>
      <Pole etykieta={t('formularz.nazwa_projekt')} wartosc={nazwa} naZmiane={ustawNazwe} testID="formularz-nazwa-projektu" />
      <Tresc podpis>{t('formularz.nowy_czesci')}</Tresc>
      {czesci.map((c, i) => (
        <Pole key={i} etykieta={t('formularz.nazwa_czesc_n', { n: i + 1 })} wartosc={c} naZmiane={(x) => ustawCzesci((l) => l.map((y, k) => (k === i ? x : y)))} testID="formularz-nazwa-czesci" />
      ))}
      <Przycisk tekst={t('projekt.dodaj_czesc')} onPress={() => ustawCzesci((l) => [...l, ''])} rodzaj="tekstowy" testID="formularz-dodaj-czesc" />
      <Tresc podpis>{t('formularz.nowy_czesci_opis')}</Tresc>
      {blad && <KomunikatZapisu t={t} />}
    </Arkusz>
  );
}

/** Nowa część (BR-PRJ-001): nazwa wymagana (przycisk nieaktywny), cel opcjonalny. */
export function FormularzCzesci(p: { t: Tlumacz; naZapisz: Zapis<{ nazwa: string; cel: number | null }>; naAnuluj(): void } & NaZmiane): React.ReactElement {
  const { t } = p;
  const [nazwa, ustawNazwe] = useState('');
  const [cel, ustawCel] = useState('');
  useZglosZmiane(p.naZmiane, nazwa !== '' || cel !== '');
  const [zlyCel, ustawZlyCel] = useState(false);
  const [blad, zapisz] = useZapis();
  const naZapisz = () => {
    const c = celZPola(cel);
    if (c === 'zly') { ustawZlyCel(true); return; }
    ustawZlyCel(false);
    zapisz(p.naZapisz, { nazwa: nazwa.trim(), cel: c });
  };
  return (
    <Arkusz tytul={t('formularz.czesc_tytul')} formularz={{ t, zapisz: t('wspolne.dodaj'), naZapisz, naAnuluj: p.naAnuluj, wylaczony: nazwa.trim() === '' }}>
      <Pole etykieta={t('formularz.nazwa_czesc')} wartosc={nazwa} naZmiane={ustawNazwe} testID="formularz-nazwa-czesci" />
      <Pole etykieta={t('formularz.cel_opcjonalny')} wartosc={cel} naZmiane={ustawCel} liczbowe testID="formularz-cel-czesci" />
      <Tresc podpis>{t('formularz.nazwa_opis')}</Tresc>
      {zlyCel && <Komunikat tekst={t('formularz.przyp_blad')} />}
      {blad && <KomunikatZapisu t={t} />}
    </Arkusz>
  );
}

/** Nowy licznik (F-04, BR-LIC-006): część (domyślnie ostatniej pracy), rodzaj słowem pracy; pusta nazwa = nazwa rodzaju. */
export function FormularzLicznika(p: {
  t: Tlumacz; czesci: { id: string; nazwa: string }[]; domyslnaCzesc: string;
  naZapisz: Zapis<{ czescId: string; rodzaj: 'rzedy' | 'oczka'; nazwa: string }>; naAnuluj(): void;
} & NaZmiane): React.ReactElement {
  const { t } = p;
  const [nazwa, ustawNazwe] = useState('');
  const [czesc, ustawCzesc] = useState(p.domyslnaCzesc);
  const [rodzaj, ustawRodzaj] = useState<'rzedy' | 'oczka'>('rzedy');
  useZglosZmiane(p.naZmiane, nazwa !== '' || czesc !== p.domyslnaCzesc || rodzaj !== 'rzedy');
  const [blad, zapisz] = useZapis();
  return (
    <Arkusz tytul={t('formularz.licznik_tytul')} formularz={{ t, zapisz: t('wspolne.dodaj'), naAnuluj: p.naAnuluj, naZapisz: () => zapisz(p.naZapisz, { czescId: czesc, rodzaj, nazwa: nazwa.trim() }) }}>
      <Pole etykieta={t('formularz.licznik_nazwa')} wartosc={nazwa} naZmiane={ustawNazwe} testID="formularz-nazwa-licznika" />
      <Tresc podpis>{t('formularz.licznik_czesc')}</Tresc>
      <Wybor opcje={p.czesci.map((c) => ({ wartosc: c.id, tekst: c.nazwa }))} wybrana={czesc} naWybor={ustawCzesc} />
      <Tresc podpis>{t('formularz.licznik_rodzaj')}</Tresc>
      <Wybor<'rzedy' | 'oczka'> opcje={[{ wartosc: 'rzedy', tekst: t('formularz.rodzaj_rzedy'), testID: 'wybor-rodzaj-rzedy' }, { wartosc: 'oczka', tekst: t('formularz.rodzaj_oczka'), testID: 'wybor-rodzaj-oczka' }]} wybrana={rodzaj} naWybor={ustawRodzaj} />
      <Tresc podpis>{t('formularz.licznik_sekcje')}</Tresc>
      {blad && <KomunikatZapisu t={t} />}
    </Arkusz>
  );
}

/** Notatka projektu (F-15, BR-PRJ-002/S2): pole wielowierszowe bez limitu i bez licznika znaków. */
export function FormularzNotatki(p: { t: Tlumacz; projekt: string; tekst: string; naZapisz: Zapis<string>; naAnuluj(): void } & NaZmiane): React.ReactElement {
  const { t } = p;
  const [tekst, ustaw] = useState(p.tekst);
  useZglosZmiane(p.naZmiane, tekst !== p.tekst);
  const [blad, zapisz] = useZapis();
  return (
    <Arkusz tytul={t('licznik.notatka')} formularz={{ t, naZapisz: () => zapisz(p.naZapisz, tekst), naAnuluj: p.naAnuluj }}>
      <Pole etykieta={t('formularz.notatka_pole', { projekt: p.projekt })} wartosc={tekst} naZmiane={ustaw} wielowierszowe testID="formularz-notatka" />
      <Tresc podpis>{t('formularz.notatka_opis')}</Tresc>
      {blad && <KomunikatZapisu t={t} />}
    </Arkusz>
  );
}

/** Znaczenie liczby (F-09, BR-LIC-012): przykłady na bieżącej wartości (skończone n → w robocie n + 1, P-161). */
export function FormularzZnaczenia(p: { t: Tlumacz; wartosc: number; znaczenie: 'skonczone' | 'w_trakcie'; naZapisz: Zapis<'skonczone' | 'w_trakcie'>; naAnuluj(): void } & NaZmiane): React.ReactElement {
  const { t } = p;
  const [z, ustaw] = useState(p.znaczenie);
  useZglosZmiane(p.naZmiane, z !== p.znaczenie);
  const [blad, zapisz] = useZapis();
  return (
    <Arkusz tytul={t('formularz.znaczenie_tytul')} formularz={{ t, naZapisz: () => zapisz(p.naZapisz, z), naAnuluj: p.naAnuluj }}>
      <Wybor<'skonczone' | 'w_trakcie'> wybrana={z} naWybor={ustaw} opcje={[
        { wartosc: 'skonczone', tekst: t('formularz.znaczenie_skonczone'), opis: t('formularz.znaczenie_skonczone_opis', { count: p.wartosc }), testID: 'wybor-znaczenie-skonczone' },
        { wartosc: 'w_trakcie', tekst: t('formularz.znaczenie_w_trakcie'), opis: t('formularz.znaczenie_w_trakcie_opis', { nastepny: p.wartosc + 1 }), testID: 'wybor-znaczenie-w-trakcie' },
      ]} />
      <Tresc podpis>{t('formularz.znaczenie_info')}</Tresc>
      {blad && <KomunikatZapisu t={t} />}
    </Arkusz>
  );
}

/** Rozmiar mm z pola w zapisie języka (P-097 (5a), `parsujLiczbe` jak drut w zapasie; M1-audytor-generalny-123); ≤ 0 albo nieliczba → null. */
const mmZPola = (t: string, jezyk: string): number | null => { const n = parsujLiczbe(t, jezyk); return n !== null && n > 0 ? n : null; };
/** Druty albo szydełko w mm (F-17, BR-PRJ-004; P-184): podgląd na żywo liczy domena (`podglad` = RD-11 / RD-19 z kompozycji). */
export function FormularzNarzedzia(p: {
  t: Tlumacz; jezyk: string; narzedzie: 'druty' | 'szydelko'; mm: number | null; podglad(mm: number, n: 'druty' | 'szydelko'): string;
  naZapisz: Zapis<{ narzedzie: 'druty' | 'szydelko'; mm: number | null }>; naAnuluj(): void;
} & NaZmiane): React.ReactElement {
  const { t } = p;
  const [n, ustawN] = useState(p.narzedzie);
  const mmZBazy = p.mm === null ? '' : formatujLiczbe(p.mm, p.jezyk, { maks: MM_NARZEDZIA_MIEJSCA });
  const [tekst, ustaw] = useState(mmZBazy);
  useZglosZmiane(p.naZmiane, n !== p.narzedzie || tekst !== mmZBazy);
  const [zly, ustawZly] = useState(false);
  const [blad, zapisz] = useZapis();
  const mm = p.mm !== null && tekst === mmZBazy ? p.mm : mmZPola(tekst, p.jezyk); // pole niezmienione: pełna liczba z bazy (jak FormularzDrutu)
  const naZapisz = () => { if (mm === null) { ustawZly(true); return; } ustawZly(false); zapisz(p.naZapisz, { narzedzie: n, mm }); };
  return (
    <Arkusz tytul={t('formularz.narzedzie_tytul')} formularz={{ t, naZapisz, naAnuluj: p.naAnuluj }}>
      <Wybor<'druty' | 'szydelko'> opcje={[{ wartosc: 'druty', tekst: t('projekt.druty'), testID: 'wybor-narzedzie-druty' }, { wartosc: 'szydelko', tekst: t('projekt.szydelko'), testID: 'wybor-narzedzie-szydelko' }]} wybrana={n} naWybor={ustawN} />
      <Pole etykieta={t('formularz.narzedzie_mm')} wartosc={tekst} naZmiane={ustaw} dziesietne testID="formularz-rozmiar-mm" />
      {mm !== null && <Tresc podpis>{t('formularz.narzedzie_podglad', { rozmiar: p.podglad(mm, n) })}</Tresc>}
      {zly && <Komunikat tekst={t('formularz.narzedzie_blad')} />}
      <Przycisk tekst={t('formularz.wyczysc')} onPress={() => { ustaw(''); ustawZly(false); zapisz(p.naZapisz, { narzedzie: n, mm: null }); }} rodzaj="tekstowy" testID="formularz-wyczysc" />
      {blad && <KomunikatZapisu t={t} />}
    </Arkusz>
  );
}

/** „What’s next?” (BR-LIC-011/S1, P-182 Q4a): ostatnia część skończona — druga taka sama (para, BR-PRJ-014) albo nowa część. */
export function CoDalej(p: { t: Tlumacz; czesc: string; projekt: string; celDrugiej: number | null; naDruga(): void; naNowa(): void; naNieTeraz(): void }): React.ReactElement {
  const { t } = p;
  const st = styleArkusza(useKolory());
  const wybor = (tekst: string, opis: string, f: () => void, testID: string) => (
    <Pressable accessibilityRole="button" accessibilityLabel={`${tekst}. ${opis}`} onPress={f} style={st.drugi} testID={testID}>
      <Text style={st.drugiTekst}>{tekst}</Text>
      <Text style={st.podpis}>{opis}</Text>
    </Pressable>
  );
  return (
    <Arkusz tytul={t('czesc.co_dalej_tytul')} przyciski={<Przycisk tekst={t('wspolne.nie_teraz')} onPress={p.naNieTeraz} rodzaj="tekstowy" testID="arkusz-zamknij" />}>
      <Tresc>{t('czesc.co_dalej_opis', { czesc: p.czesc, projekt: p.projekt })}</Tresc>
      {wybor(t('czesc.druga_taka_sama', { czesc: p.czesc }), p.celDrugiej === null ? t('czesc.druga_bez_celu') : t('czesc.druga_opis', { count: p.celDrugiej }), p.naDruga, 'co-dalej-druga')}
      {wybor(t('czesc.nowa'), t('czesc.nowa_opis'), p.naNowa, 'co-dalej-nowa')}
    </Arkusz>
  );
}

const dzienZDaty = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dataZDnia = (dzien: string): Date => { const [r, m, d] = dzien.split('-').map(Number); return new Date(r, m - 1, d, 12); }; // południe: bez przeskoku doby przy DST
/**
 * Termin „Done by” (F-61, BR-DNI-005; design-spec arkusz terminu): systemowy wybór daty inline (P-186, `@react-native-community/datetimepicker`),
 * od dziś; podgląd celu na dziś liczy domena (`podglad` → RD-15: liczba rzędów albo null bez celów części); „No date” zapisuje brak terminu.
 */
export function FormularzTerminu(p: {
  t: Tlumacz; dzis: string; termin: string | null; jezyk: string; podglad(dzien: string): Promise<number | null>;
  naZapisz: Zapis<string | null>; naAnuluj(): void;
} & NaZmiane): React.ReactElement {
  const { t } = p;
  const [dzien, ustawDzien] = useState(p.termin ?? p.dzis);
  useZglosZmiane(p.naZmiane, dzien !== (p.termin ?? p.dzis));
  const [cel, ustawCel] = useState<number | null | undefined>(undefined);
  const [blad, zapisz] = useZapis();
  const { podglad } = p;
  useEffect(() => {
    let zywy = true;
    void podglad(dzien).then((c) => { if (zywy) ustawCel(c); });
    return () => { zywy = false; };
  }, [dzien, podglad]);
  return (
    <Arkusz tytul={t('formularz.termin_tytul')} formularz={{ t, naZapisz: () => zapisz(p.naZapisz, dzien), naAnuluj: p.naAnuluj }}>
      <DateTimePicker value={dataZDnia(dzien)} mode="date" display="inline" locale={p.jezyk} minimumDate={dataZDnia(p.dzis)} testID="formularz-termin-data"
        accessibilityLabel={t('formularz.termin_tytul')} onValueChange={(_e, d) => ustawDzien(dzienZDaty(d))} />
      {cel !== undefined && <Tresc podpis>{cel === null ? t('formularz.termin_bez_celow') : t('formularz.termin_podglad', { count: cel })}</Tresc>}
      <Przycisk tekst={t('formularz.termin_brak')} onPress={() => zapisz(p.naZapisz, null)} rodzaj="tekstowy" testID="formularz-termin-brak" />
      {blad && <KomunikatZapisu t={t} />}
    </Arkusz>
  );
}

/**
 * Włóczki projektu (F-37, BR-ZAP-002; design-spec „Partia 8” 001): zapas jako wiersze z polem wyboru (kwadrat ze znakiem ✓, `checkbox`; stan niesie znak, nie kolor),
 * druga linia „{n} skeins in your stash”; włóczka z zapasem 0 też jest do wyboru. Nowo dodana włóczka (po powrocie z „Add yarn”) jest od razu zaznaczona.
 */
export function FormularzWloczekProjektu(p: {
  t: Tlumacz; zapas: { id: string; nazwa: string; motki: number }[]; poczatkowe: string[]; naZapisz: Zapis<string[]>; naAnuluj(): void; naDodajWloczke(): void;
} & NaZmiane): React.ReactElement {
  const { t } = p;
  const k = useKolory();
  const st = styleArkusza(k);
  const [wybrane, ustaw] = useState<string[]>(p.poczatkowe);
  // Zbiór wybranych inny niż przy otwarciu (także włóczka dodana w międzyczasie i od razu zaznaczona).
  useZglosZmiane(p.naZmiane, wybrane.length !== p.poczatkowe.length || wybrane.some((id) => !p.poczatkowe.includes(id)));
  const [znane, ustawZnane] = useState<string[]>(p.zapas.map((x) => x.id));
  const [blad, zapisz] = useZapis();
  useEffect(() => { // włóczka dodana w międzyczasie: zaznaczona, o ile nie było jej na liście przy otwarciu
    const nowe = p.zapas.map((x) => x.id).filter((id) => !znane.includes(id));
    if (nowe.length > 0) { ustawZnane((z) => [...z, ...nowe]); ustaw((w) => [...w, ...nowe]); }
  }, [p.zapas, znane]);
  const przelacz = (id: string) => ustaw((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  return (
    <Arkusz tytul={t('formularz.wloczka_tytul')} testID="wloczka-wybor"
      formularz={{ t, naAnuluj: p.naAnuluj, naZapisz: () => zapisz(p.naZapisz, wybrane), wylaczony: p.zapas.length === 0 }}>
      <Tresc podpis>{t('formularz.wloczka_opis')}</Tresc>
      {p.zapas.length === 0 ? <Tresc testID="wloczka-pusto">{t('formularz.wloczka_pusto')}</Tresc> : p.zapas.map((x) => {
        const zazn = wybrane.includes(x.id);
        return (
          <Pressable key={x.id} accessibilityRole="checkbox" accessibilityState={{ checked: zazn }} accessibilityLabel={t('formularz.wloczka_wiersz_a11y', { nazwa: x.nazwa, count: x.motki })}
            onPress={() => przelacz(x.id)} style={st.wierszWyboru} testID={`wloczka-wybor-${x.id}`}>
            <PoleWyboru zaznaczone={zazn} />
            <Text style={{ flex: 1, color: k.grafit }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{x.nazwa}{'\n'}{t('ukonczenie.w_zapasie', { count: x.motki })}</Text>
          </Pressable>
        );
      })}
      <Przycisk tekst={t('zapas.dodaj')} onPress={p.naDodajWloczke} rodzaj="tekstowy" testID="wloczka-dodaj" />
      {blad && <KomunikatZapisu t={t} />}
    </Arkusz>
  );
}
