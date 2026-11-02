// Formularze w arkuszach (prototyp.html:130–138; design-spec.md:45, :67): wpisanie wartości (F-45), powtórzenie (F-05), przypomnienie (F-06),
// korekta sesji (F-51), nazwa projektu i części, cel części. Sygnatury: propozycja 07 (E3), granice zatwierdzone przez 05 (Z07-22).
// Walidację reguł liczy domena (RD-12-W5, RD-13 przez `podglad`, BR-LIC-017/S7); ekran nie woła naZapisz z błędną wartością i pokazuje komunikat (rola alert).
// Pola liczbowe przed polem tekstowym, zapis przyciskiem arkusza (e2e/README.md zasada 6: bez chowania klawiatury liczbowej).
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Arkusz, Komunikat, KomunikatZapisu, Pole, Przycisk, Tresc, liczbaZPola, useZglosZmiane } from './Arkusz';
import { formatujLiczbe, parsujCalkowita } from '../i18n/format';
import type { Tlumacz, WynikEkranu } from './wspolne';

/** Wynik zapisu z przypadku użycia; nieudany → komunikat formularza (bez makiety, Z07-05), wpisane dane zostają w polach. */
async function zapiszZ<T>(f: () => Promise<WynikEkranu<T>>, naBlad: (powod: string) => void): Promise<void> {
  const w = await f();
  if (!w.ok) naBlad(w.powod);
}

export type PropsFormularzaWartosci = {
  stan: { obecna: number };
  t: Tlumacz;
  /** Język wpisu: separator tysięcy i cyfry regionu (BR-LIC-017, ER-43). */
  jezyk: string;
  /** Komunikat limitu dni (BR-ZAK-006) pokazywany, gdy wpisanie zaczynałoby dzień ponad limit (BR-LIC-017/S5). */
  tekstLimitu: string;
  naZapisz(wartosc: number): Promise<WynikEkranu<void>>;  // wpiszWartosc
  naAnuluj(): void;
  /** Wartości różne od tych z otwarcia arkusza („Discard changes?”, M1-020). */
  naZmiane?(zmieniony: boolean): void;
};
export function FormularzWartosci({ stan, t, jezyk, tekstLimitu, naZapisz, naAnuluj, naZmiane }: PropsFormularzaWartosci): React.ReactElement {
  const [tekst, ustaw] = useState(String(stan.obecna));
  useZglosZmiane(naZmiane, tekst !== String(stan.obecna));
  const [blad, ustawBlad] = useState<'wartosc' | 'limit' | null>(null);
  const n = parsujCalkowita(tekst, jezyk);
  const zapisz = () => {
    if (n === null) { ustawBlad('wartosc'); return; }
    ustawBlad(null);
    void zapiszZ(() => naZapisz(n), (powod) => ustawBlad(powod === 'limit' ? 'limit' : 'wartosc'));
  };
  return (
    <Arkusz tytul={t('formularz.wpisz_tytul')} formularz={{ t, naZapisz: zapisz, naAnuluj }}>
      <Tresc>{t('formularz.wpisz_opis')}</Tresc>
      <Pole etykieta={t('formularz.wpisz_pole')} wartosc={tekst} naZmiane={ustaw} liczbowe testID="wpisz-wartosc-pole" />
      {n !== null && <Tresc podpis>{t('formularz.wpisz_podglad', { n: n + 1 })}</Tresc>}
      {blad && <Komunikat tekst={blad === 'limit' ? tekstLimitu : t('licznik.wpisz_blad_format', { przyklad: formatujLiczbe(1000, jezyk) })} />}
    </Arkusz>
  );
}

export type PropsFormularzaPowtorzenia = {
  stan: { nazwa: string; dlugosc: number | null };
  t: Tlumacz;
  naZapisz(p: { nazwa: string; dlugosc: number }): Promise<WynikEkranu<void>>;
  naAnuluj(): void;
  naZmiane?(zmieniony: boolean): void;
};
export function FormularzPowtorzenia({ stan, t, naZapisz, naAnuluj, naZmiane }: PropsFormularzaPowtorzenia): React.ReactElement {
  const [tekst, ustaw] = useState(stan.dlugosc === null ? '' : String(stan.dlugosc));
  useZglosZmiane(naZmiane, tekst !== (stan.dlugosc === null ? '' : String(stan.dlugosc)));
  const [blad, ustawBlad] = useState(false);
  const zapisz = () => {
    const n = liczbaZPola(tekst);
    if (n === null || n < 1) { ustawBlad(true); return; } // RD-12-W5: długość ≥ 1
    ustawBlad(false);
    void zapiszZ(() => naZapisz({ nazwa: stan.nazwa, dlugosc: n }), () => ustawBlad(true));
  };
  return (
    <Arkusz tytul={t('formularz.powt_tytul')} formularz={{ t, naZapisz: zapisz, naAnuluj }}>
      <Pole etykieta={t('formularz.powt_pole')} wartosc={tekst} naZmiane={ustaw} liczbowe testID="powtorzenie-dlugosc-pole" />
      {blad && <Komunikat tekst={t('formularz.powt_blad')} />}
    </Arkusz>
  );
}

export type PlanPrzypomnieniaEkranu = { tekst: string; od: number; co: number; razy: number };
export type PropsFormularzaPrzypomnienia = {
  stan: { tekst: string; od: number | null; co: number | null; razy: number | null };
  t: Tlumacz;
  /** Edycja istniejącego przypomnienia (07-jakosc-011): tytuł `przyp.edytuj_tytul` i wiersz „Delete reminder” na końcu; bez tego — dodawanie. */
  naUsun?(): void;
  /** Podgląd rzędów z domeny (RD-13, `przypomnienia.ts`); ekran tylko pokazuje i dołącza do etykiety „Save reminder”. */
  podglad(plan: PlanPrzypomnieniaEkranu): WynikEkranu<number[]>;
  naZapisz(plan: PlanPrzypomnieniaEkranu): Promise<WynikEkranu<void>>;
  naAnuluj(): void;
  naZmiane?(zmieniony: boolean): void;
};
const naPole = (n: number | null) => (n === null ? '' : String(n));
export function FormularzPrzypomnienia({ stan, t, naUsun, podglad, naZapisz, naAnuluj, naZmiane }: PropsFormularzaPrzypomnienia): React.ReactElement {
  const [tekst, ustawTekst] = useState(stan.tekst);
  const [od, ustawOd] = useState(naPole(stan.od));
  const [co, ustawCo] = useState(naPole(stan.co));
  const [razy, ustawRazy] = useState(naPole(stan.razy));
  useZglosZmiane(naZmiane, tekst !== stan.tekst || od !== naPole(stan.od) || co !== naPole(stan.co) || razy !== naPole(stan.razy));
  const [blad, ustawBlad] = useState<'od' | 'plan' | null>(null);
  // Brak pola = NaN (nie zgadywany rząd, OP-06): domena odrzuca plan, podgląd pusty.
  const plan: PlanPrzypomnieniaEkranu = { tekst: tekst.trim(), od: liczbaZPola(od) ?? NaN, co: liczbaZPola(co) ?? NaN, razy: liczbaZPola(razy) ?? NaN };
  const p = podglad(plan);
  const rzedy = p.ok && p.wartosc.length > 0 ? p.wartosc.join(', ') : null;
  const zapisz = () => {
    if (!Number.isFinite(plan.od) || plan.od < 1) { ustawBlad('od'); return; }
    if (!rzedy || plan.razy < 1) { ustawBlad('plan'); return; }
    ustawBlad(null);
    void zapiszZ(() => naZapisz(plan), () => ustawBlad('plan'));
  };
  return (
    <Arkusz tytul={t(naUsun ? 'przyp.edytuj_tytul' : 'formularz.przyp_tytul')} testID={naUsun ? 'przyp-edycja' : undefined} formularz={{ t, naZapisz: zapisz, naAnuluj, zapisz: t('formularz.przyp_zapisz'), testZapisz: 'przypomnienie-zapisz', zapiszA11y: rzedy ? t('formularz.przyp_zapisz_a11y', { rzedy }) : t('formularz.przyp_zapisz') }}>
      <Tresc>{t('formularz.przyp_opis')}</Tresc>
      <Pole etykieta={t('formularz.przyp_od')} wartosc={od} naZmiane={ustawOd} liczbowe testID="przypomnienie-od-rzedu" />
      <Pole etykieta={t('formularz.przyp_co')} wartosc={co} naZmiane={ustawCo} liczbowe testID="przypomnienie-co-ile" />
      <Pole etykieta={t('formularz.przyp_razy')} wartosc={razy} naZmiane={ustawRazy} liczbowe testID="przypomnienie-ile-razy" />
      <Pole etykieta={t('formularz.przyp_tekst')} wartosc={tekst} naZmiane={ustawTekst} testID="przypomnienie-co-robic" />
      {rzedy && <Tresc podpis testID="przypomnienie-podglad">{t('formularz.przyp_podglad', { rzedy })}</Tresc>}
      {blad && <Komunikat tekst={t(blad === 'od' ? 'formularz.przyp_blad_od' : 'formularz.przyp_blad')} />}
      {naUsun && <Przycisk tekst={t('przyp.usun')} onPress={naUsun} testID="przypomnienie-usun" />}
    </Arkusz>
  );
}
export type PropsListyPrzypomnien = {
  t: Tlumacz;
  /** `opis` = druga linia wiersza (`przyp.wiersz_*`); pusta instrukcja → wiersz ma tylko opis. */
  elementy: { id: string; tekst: string; opis: string }[];
  naWybor(id: string): void;
  naDodaj(): void;
  naZamknij(): void;
};
/** Lista przypomnień licznika (07-jakosc-011, F-06; makieta 04 `przyp-lista`): Close / tytuł / Add, wiersz = instrukcja + druga linia, stuknięcie otwiera edycję. */
export function ListaPrzypomnien({ t, elementy, naWybor, naDodaj, naZamknij }: PropsListyPrzypomnien): React.ReactElement {
  return (
    <Arkusz tytul={t('przyp.tytul')} testID="przyp-lista" formularz={{ t, naZapisz: naDodaj, naAnuluj: naZamknij, anuluj: t('wspolne.zamknij'), zapisz: t('wspolne.dodaj'), testZapisz: 'przypomnienia-dodaj' }}>
      {elementy.map((e) => (
        <Pressable key={e.id} accessibilityRole="button" accessibilityLabel={t('przyp.wiersz_a11y', { tekst: e.tekst, opis: e.opis })} onPress={() => naWybor(e.id)}
          testID={`przypomnienie-wiersz-${e.id}`} style={{ minHeight: 44, justifyContent: 'center' }}>
          {e.tekst !== '' && <Tresc>{e.tekst}</Tresc>}
          <Tresc podpis>{e.opis}</Tresc>
        </Pressable>
      ))}
      <Tresc podpis>{t('przyp.lista_opis')}</Tresc>
    </Arkusz>
  );
}

export type PropsKorektySesji = {
  stan: { startMs: number; koniecMs: number; terazMs: number; przerwyMs: number; doSprawdzenia: number | null; czasInnychMs: number };
  t: Tlumacz;
  formatuj: { dataGodzina(ms: number): string; czas(ms: number): string };
  naZapisz(z: { startMs: number; koniecMs: number }): Promise<WynikEkranu<void>>;
  naAnuluj(): void;
  naZmiane?(zmieniony: boolean): void;
};
/**
 * Korekta sesji (F-51, BR-PRJ-013; makieta 04 fix-6 `sesja-korekta`, P-191 P4a–P5a): wiersze Start / End z systemowym wyborem daty i godziny
 * (koło; koniec nie później niż teraz), podgląd na żywo, linia „do sprawdzenia” i — przy przerwach — zdanie, że korekta liczy od startu
 * do końca (P-195 Q2a). Koniec przed początkiem: komunikat, Save nieaktywny (BR-PRJ-013 S3).
 */
export function KorektaSesji({ stan: s, t, formatuj, naZapisz, naAnuluj, naZmiane }: PropsKorektySesji): React.ReactElement {
  const [startMs, ustawStart] = useState(s.startMs);
  const [koniecMs, ustawKoniec] = useState(s.koniecMs);
  useZglosZmiane(naZmiane, startMs !== s.startMs || koniecMs !== s.koniecMs);
  const [otwarte, ustawOtwarte] = useState<'start' | 'koniec' | null>(null);
  const [bladZapisu, ustawBladZapisu] = useState(false);
  const zly = koniecMs < startMs;
  const wiersz = (pole: 'start' | 'koniec', ms: number, ustaw: (v: number) => void) => (
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel={`${t(pole === 'start' ? 'formularz.sesja_start' : 'formularz.sesja_koniec')}, ${formatuj.dataGodzina(ms)}`}
        onPress={() => ustawOtwarte(otwarte === pole ? null : pole)} testID={`formularz-sesja-${pole}`} style={{ minHeight: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tresc>{t(pole === 'start' ? 'formularz.sesja_start' : 'formularz.sesja_koniec')}</Tresc>
        <Tresc podpis>{formatuj.dataGodzina(ms)}</Tresc>
      </Pressable>
      {otwarte === pole && (
        <DateTimePicker value={new Date(ms)} mode="datetime" display="spinner" maximumDate={new Date(s.terazMs)} testID={`formularz-sesja-${pole}-wybor`}
          onValueChange={(_e, d) => ustaw(d.getTime())} />
      )}
    </View>
  );
  return (
    <Arkusz tytul={t('formularz.sesja_tytul')} testID="sesja-korekta" formularz={{ t, wylaczony: zly, naAnuluj, naZapisz: () => { if (!zly) void zapiszZ(() => naZapisz({ startMs, koniecMs }), () => ustawBladZapisu(true)); } }}>
      {s.doSprawdzenia !== null && <Tresc>{t('formularz.sesja_sprawdz', { count: s.doSprawdzenia })}</Tresc>}
      {wiersz('start', startMs, ustawStart)}
      {wiersz('koniec', koniecMs, ustawKoniec)}
      {zly ? <Komunikat tekst={t('formularz.sesja_blad')} /> : (
        <>
          <Tresc podpis>{t('formularz.sesja_trwanie', { czas: formatuj.czas(koniecMs - startMs) })}</Tresc>
          <Tresc podpis>{t('formularz.sesja_projekt', { czas: formatuj.czas(s.czasInnychMs + koniecMs - startMs) })}</Tresc>
        </>
      )}
      {s.przerwyMs > 0 && <Tresc podpis>{t('formularz.sesja_przerwy', { czas: formatuj.czas(s.przerwyMs) })}</Tresc>}
      {bladZapisu && <Komunikat tekst={t('dane.blad')} />}
    </Arkusz>
  );
}

/** Nazwa projektu i części (prototyp.html:130); pusta nazwa projektu roboczego zostawia go nienazwanym (design-spec „Arkusz nazwy”). */
export type PropsFormularzaNazwy = {
  stan: { projekt: string; czesc: string };
  t: Tlumacz;
  naZapisz(n: { projekt: string; czesc: string }): Promise<WynikEkranu<void>>;
  naAnuluj(): void;
  naZmiane?(zmieniony: boolean): void;
};
export function FormularzNazwy({ stan, t, naZapisz, naAnuluj, naZmiane }: PropsFormularzaNazwy): React.ReactElement {
  const [projekt, ustawProjekt] = useState(stan.projekt);
  const [czesc, ustawCzesc] = useState(stan.czesc);
  useZglosZmiane(naZmiane, projekt !== stan.projekt || czesc !== stan.czesc);
  const [blad, ustawBlad] = useState(false);
  const zapisz = () => void zapiszZ(() => naZapisz({ projekt: projekt.trim(), czesc: czesc.trim() }), () => ustawBlad(true));
  return (
    <Arkusz tytul={t('formularz.nazwa_tytul')} formularz={{ t, naZapisz: zapisz, naAnuluj }}>
      <Pole etykieta={t('formularz.nazwa_czesc')} wartosc={czesc} naZmiane={ustawCzesc} />
      <Pole etykieta={t('formularz.nazwa_projekt')} wartosc={projekt} naZmiane={ustawProjekt} testID="formularz-nazwa-projektu" />
      <Tresc podpis>{t('formularz.nazwa_opis')}</Tresc>
      {blad && <KomunikatZapisu t={t} />}
    </Arkusz>
  );
}

/** Cel części (prototyp.html:131, U-8): liczba rzędów ≥ 1 albo puste pole = bez celu. */
export type PropsFormularzaCelu = {
  stan: { cel: number | null };
  t: Tlumacz;
  naZapisz(cel: number | null): Promise<WynikEkranu<void>>;
  naAnuluj(): void;
  naZmiane?(zmieniony: boolean): void;
};
export function FormularzCelu({ stan, t, naZapisz, naAnuluj, naZmiane }: PropsFormularzaCelu): React.ReactElement {
  const [tekst, ustaw] = useState(naPole(stan.cel));
  useZglosZmiane(naZmiane, tekst !== naPole(stan.cel));
  const [blad, ustawBlad] = useState(false);
  const zapisz = () => {
    const n = tekst.trim() === '' ? null : liczbaZPola(tekst);
    if (n === 0 || (n === null && tekst.trim() !== '')) { ustawBlad(true); return; }
    ustawBlad(false);
    void zapiszZ(() => naZapisz(n), () => ustawBlad(true));
  };
  return (
    <Arkusz tytul={t('formularz.cel_tytul')} formularz={{ t, naZapisz: zapisz, naAnuluj }}>
      <Pole etykieta={t('formularz.cel_pole')} wartosc={tekst} naZmiane={ustaw} liczbowe />
      {blad && <Komunikat tekst={t('formularz.przyp_blad')} />}
    </Arkusz>
  );
}
