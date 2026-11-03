// Widok strony wzoru (moduł natywny `oczko-wzor`, WidokWzoruNatywny) z obsługą jego zdarzeń: znacznik rzędu, rysunki, notatki, strona i powiększenie.
// Wydzielone z trasy `app/wzor.tsx` bez zmiany zachowania (M1-audytor-generalny-106, DEC-30 a: trasy poniżej 20 KB). Funkcja zwraca element (nie komponent),
// więc drzewo renderowania trasy jest to samo; stan i odświeżanie zostają w trasie, tu tylko przekazane wywołania.
import React from 'react';
import { View } from 'react-native';
import { WidokWzoruNatywny, type PropsWidokuNatywnego, type UchwytWidokuWzoru } from '../../modules/oczko-wzor';
import type { Wynik } from '../domena/bledy';
import { domyslnyRzadBazowy, gornaKrawedzRzedu, krokZnacznika, rzadPoPrzeniesieniu } from '../domena/znacznik-wzoru';
import { narzedzieRysika, poPierwszymRysiku, type Narzedzie } from '../domena/rysik';
import type { Uklad } from '../domena/uklad';
import type { Aplikacja } from '../kompozycja/Kontekst';
import type { Kontener } from '../kompozycja/kontener';
import { zglosBladZapisu } from '../kompozycja/po-zapisie';
import type { WidokLicznika } from '../przypadki-uzycia/widok-licznika';
import { zapiszRysunek } from '../przypadki-uzycia/wzor';
import { zapamietajPozycjeWzoru } from '../przypadki-uzycia/wzor-miejsce';
import type { WidokWzoru } from '../przypadki-uzycia/wzor-widok';
import type { Tlumacz } from './wspolne';

/** Co trasa przekazuje widokowi: stan do narysowania i wywołania, którymi widok zgłasza zdarzenia. */
export type ParametryWidokuNatywnego = {
  t: Tlumacz;
  aplikacja: Aplikacja;
  zw: Kontener['wzor']['z'];
  widok: WidokWzoru;
  lw: WidokLicznika;
  dokument: PropsWidokuNatywnego['dokument'] | null;
  uchwyt: React.RefObject<UchwytWidokuWzoru | null>;
  katalogRysunkow: string;
  strona: { n: number; razem: number } | null;
  startStrona: number; // strona zapisana w chwili otwarcia wzoru (gdy `strona` jeszcze nieznana)
  nastepnaStrona: boolean;
  narzedzie: Narzedzie;
  polityka: PropsWidokuNatywnego['polityka'];
  cofnij: number;
  uklad: Uklad;
  tylkoRysik: boolean;
  bladRysunku: { current: boolean };
  ustawOtwartyChip: (rzad: number) => void;
  ustawNiezapisane: React.Dispatch<React.SetStateAction<boolean | null>>;
  ustawStrone: (s: { n: number; razem: number }) => void;
  ustawZakreslenia: (liczba: number) => void;
  ustawNarzedzie: (n: Narzedzie) => void;
  ustawRysik: (s: { tylkoRysik: boolean }) => void;
  ustawPrzytrzymanie: (p: { strona: number; y: number }) => void;
  poZapisieRysunku: (r: Wynik<unknown>, oczekujace?: number) => void;
  przejdzNaNastepna: () => void;
  postaw: (w: { strona: number; y: number; rzadBazowy: number; kierunek: 1 | -1; wysokoscRzedu?: number }) => Promise<unknown>;
};

export function widokNatywnyWzoru(p: ParametryWidokuNatywnego): React.ReactElement {
  const { t, aplikacja, zw, widok, lw, dokument, uklad, postaw } = p;
  const zn = widok.znacznik;
  const notatkiNatywne = widok.notatki.map((c) => {
    const etykieta = c.notatki.length > 1 ? t('wzor.notatki_wiele', { count: c.notatki.length }) : t('wzor.notatka_chip', { n: c.rzadWzoru, tekst: c.notatki[0]?.tekst ?? '' });
    return { id: String(c.rzad), strona: c.strona, y: c.y, wysokosc: c.wysokosc, etykieta, a11y: t('wzor.notatka_chip_a11y', { n: c.rzadWzoru, tekst: c.notatki.length > 1 ? etykieta : (c.notatki[0]?.tekst ?? '') }) };
  });
  if (!WidokWzoruNatywny || !dokument) return <View style={{ flex: 1 }} />;
  return (
    <WidokWzoruNatywny ref={p.uchwyt} style={{ flex: 1 }} testID="wzor-pdf" dokument={dokument} katalogRysunkow={p.katalogRysunkow} strona={p.strona ? p.strona.n - 1 : p.startStrona} narzedzie={p.narzedzie} narzedzieRysika={narzedzieRysika(uklad.klasa)} polityka={p.polityka} cofnij={p.cofnij} notatki={notatkiNatywne}
      onNotatka={(e) => p.ustawOtwartyChip(Number(e.nativeEvent.id))}
      onZnacznik={(e) => { const n = e.nativeEvent; if (zn && n.wzorId === widok.wzorId) void postaw({ strona: n.strona, y: n.y, wysokoscRzedu: n.wysokosc, rzadBazowy: Math.max(1, zn.rzad), kierunek: zn.kierunek }); }}
      onZnacznikKrok={(e) => { const n = e.nativeEvent; const k = zn && n.wzorId === widok.wzorId ? krokZnacznika(zn, n.delta) : null; if (zn && k) void postaw({ strona: zn.strona, y: k.y, rzadBazowy: k.rzadBazowy, kierunek: zn.kierunek }); }}
      onNastepnaStrona={p.przejdzNaNastepna}
      znacznik={zn ? { strona: zn.strona, y: zn.y, wysokosc: zn.wysokosc, pozaStrona: zn.pozaStrona, przedSchematem: zn.przedSchematem, kierunek: zn.kierunek,
        napis: zn.pozaStrona ? t('wzor.etykieta_koniec', { n: zn.rzad }) : `${t('wzor.znacznik_napis', { n: Math.max(1, zn.rzad) })} ${zn.kierunek === -1 ? '↑' : '↓'}`,
        akcjaNastepnaStrona: zn.pozaStrona && p.nastepnaStrona ? t('wzor.nastepna_strona_a11y') : '',
        etykieta: t(zn.kierunek === -1 ? 'wzor.znacznik_a11y_gora' : 'wzor.znacznik_a11y_dol', { n: Math.max(1, zn.rzad) }) } : null}
      onRysunek={(e) => { const ocz = e.nativeEvent.oczekujace ?? 0; if (ocz === 0) p.ustawNiezapisane((n) => (n === null ? null : false)); void zapiszRysunek(zw, { wzorId: e.nativeEvent.wzorId, strona: e.nativeEvent.strona, plikTymczasowy: e.nativeEvent.plikTymczasowy }).then((r) => p.poZapisieRysunku(r, ocz)); }} // wzorId ze zdarzenia: kreski starego wzoru po przełączeniu trafiają do niego; M1-084
      onBladZapisu={(e) => { p.ustawNiezapisane(e.nativeEvent.oczekujace > 0); if (!p.bladRysunku.current) p.bladRysunku.current = zglosBladZapisu(aplikacja, 'zapis', 'rysunek_niezapisany'); }}
      onStrona={(e) => { p.ustawStrone({ n: e.nativeEvent.strona + 1, razem: e.nativeEvent.stron }); void zapamietajPozycjeWzoru(zw, { licznikId: lw.licznikId, wzorId: widok.wzorId, strona: e.nativeEvent.strona }); }} // zapis pozycji: nieudany zostaje we wpisie błędów (operacjaZapisu), wzór dalej działa
      onPowiekszenie={(e) => { if (e.nativeEvent.wzorId === widok.wzorId) void zapamietajPozycjeWzoru(zw, { licznikId: lw.licznikId, wzorId: widok.wzorId, powiekszenie: e.nativeEvent.powiekszenie }); }}
      onPierwszyRysik={() => { const po = poPierwszymRysiku({ narzedzie: p.narzedzie, tylkoRysik: p.tylkoRysik }, uklad.klasa); p.ustawNarzedzie(po.narzedzie); p.ustawRysik({ tylkoRysik: po.tylkoRysik }); }} // P-327 (a), P-360: bez narzędzia Pen (compact: Highlighter)
      onZakreslenia={(e) => p.ustawZakreslenia(e.nativeEvent.liczba)}
      onStukniecie={(e) => { // przytrzymanie: pas staje w tym miejscu, rząd zostaje (S3); pierwszy znacznik pyta o kierunek (3a) i bierze rząd w robocie (S2)
        const n = e.nativeEvent;
        if (n.wzorId !== widok.wzorId) return;
        if (zn) void postaw({ strona: n.strona, y: gornaKrawedzRzedu(n.y, zn.wysokosc), rzadBazowy: rzadPoPrzeniesieniu(zn, domyslnyRzadBazowy(lw.wartosc)), kierunek: zn.kierunek });
        else p.ustawPrzytrzymanie({ strona: n.strona, y: n.y });
      }} />
  );
}
