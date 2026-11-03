// Kontener stopera na liczniku (F-21; P-191 P1a–P3a; P-199 Q3c): czyta otwartą sesję, woła przypadki użycia sesji, ogłasza wynik dopiero
// po zapisie (R-148) i po każdym przejściu woła `poZmianie` (stan ekranu blokady i zegarka, przeładowanie kresek licznika).
import React, { useCallback, useEffect, useState } from 'react';
import type { Wynik } from '../domena/bledy';
import { LiniaSprawdzenia, Stoper, czasStopera, type StanStopera } from '../ekrany/Stoper';
import type { Oglos } from '../ekrany/wspolne';
import { formatujGodzine } from '../i18n/format';
import { otwartaSesja, przelaczSesje, sesjaDoSprawdzenia, startSesji, wstrzymajSesje, wznowSesje, zakonczSesje, type SesjaNaEkranie } from '../przypadki-uzycia/sesja';
import type { Zaleznosci } from '../przypadki-uzycia/zaleznosci';
import { zglosBladZapisu, type ZrodloBleduZapisu } from './po-zapisie';
import { czasPracy } from './ukonczenie';
import { etykietaRobocza, type Jezyk } from './licznik';
import { liczba, tekst, wiersze } from '../dane/repozytoria/wiersze';

/** `zrodlo` = to, co trasa ma z `useAplikacja()` (port haptyki i preferencje wibracji; M1-107). */
export function StoperLicznika({ z, j, zrodlo, projektId, oglos, poZmianie }: { z: Zaleznosci; j: Jezyk; zrodlo: ZrodloBleduZapisu; projektId: string; oglos: Oglos; poZmianie(): Promise<void> }): React.ReactElement {
  const [sesja, ustawSesje] = useState<SesjaNaEkranie | null>(null);
  const [inny, ustawInny] = useState<{ projekt: string; biezacy: string } | null>(null);
  const wczytaj = useCallback(async () => { const o = await otwartaSesja(z); ustawSesje(o.ok ? o.wartosc : null); }, [z]);
  useEffect(() => { void wczytaj(); }, [wczytaj]);

  const ch = z.zegar.teraz();
  const godzina = (ms: number) => formatujGodzine(new Date(ms), j.jezyk(), { uses24h: j.zegar24h(), strefa: ch.strefa });
  const stan: StanStopera = !sesja || sesja.projektId !== projektId ? { rodzaj: 'brak' }
    : sesja.stan === 'trwa' ? { rodzaj: 'trwa', znacznikMs: sesja.startMs + sesja.przerwyMs, startGodzina: godzina(sesja.startMs) }
    : { rodzaj: 'wstrzymana', czasMs: (sesja.wstrzymanoMs ?? ch.ms) - sesja.startMs - sesja.przerwyMs, startGodzina: godzina(sesja.startMs) };

  async function nazwa(id: string): Promise<string> {
    const [p] = await wiersze(z.baza.all('SELECT nazwa, nienazwany, utworzono_ms FROM projekt WHERE id = ?', [id]), 'stoper');
    if (!p) return '';
    return liczba(p, 'nienazwany') === 1 ? etykietaRobocza(liczba(p, 'utworzono_ms'), z.zegar.teraz().ms, j, z.zegar.teraz().strefa) : tekst(p, 'nazwa');
  }
  // M1-085: błąd zapisu (`zapis`, `brak_miejsca`) → alert błędu zapisu (M1-006, M1-102: stoper.blad_zapisu) z haptyką `bladZapisu` przy włączonych
  // wibracjach (M1-107, aneks P2 poz. 5); inny powód jak dotąd bez komunikatu. `start`: haptyka `stoperStart` po udanym zapisie (design-spec: „haptyka lekka”).
  async function po(w: Wynik<unknown>, tekst: () => string, start = false): Promise<void> {
    if (!w.ok) { zglosBladZapisu(zrodlo, w.powod, 'stoper'); return; }
    if (start && zrodlo.preferencje.stan().wibracje) zrodlo.kontener.porty.haptyka.zagraj('stoperStart');
    await wczytaj();
    oglos(tekst());
    await poZmianie();
  }
  const sekundyTeraz = () => (stan.rodzaj === 'trwa' ? z.zegar.teraz().ms - stan.znacznikMs : 0);

  return (
    <Stoper stan={stan} inny={inny} t={j.t} teraz={() => z.zegar.teraz().ms}
      naStart={() => void (async () => {
        if (sesja && sesja.projektId !== projektId) { ustawInny({ projekt: await nazwa(sesja.projektId), biezacy: await nazwa(projektId) }); return; }
        const w = await startSesji(z, { projektId });
        await po(w, () => j.t('stoper.uruchomiono'), true);
      })()}
      naWstrzymaj={() => void (async () => {
        if (!sesja) return;
        const czas = czasStopera(sekundyTeraz());
        await po(await wstrzymajSesje(z, { sesjaId: sesja.id }), () => j.t('stoper.wstrzymano', { czas }));
      })()}
      naWznow={() => void (async () => { if (sesja) await po(await wznowSesje(z, { sesjaId: sesja.id }), () => j.t('stoper.wznowiono')); })()}
      naZatrzymaj={() => void (async () => {
        if (!sesja) return;
        const w = await zakonczSesje(z, { sesjaId: sesja.id });
        await po(w, () => j.t('stoper.zapisano', { czas: w.ok ? czasPracy(w.wartosc.czasMs, j) : '' }));
      })()}
      naInnyPotwierdz={() => void (async () => {
        ustawInny(null);
        await po(await przelaczSesje(z, { projektId }), () => j.t('stoper.uruchomiono'), true);
      })()}
      naInnyAnuluj={() => ustawInny(null)}
    />
  );
}

/** Sesje, dla których otwarto korektę z linii (P-191 P5a: „linia znika po otwarciu korekty”) — do końca procesu, bez zapisu w bazie. */
const otwarteKorekty = new Set<string>();
/**
 * Linia „zapomniany stoper” na liczniku (P-191 P5a): dane mówią, czy jest sesja do sprawdzenia bez +1 po jej końcu (`sesjaDoSprawdzenia`);
 * po +1 licznik przerysowuje się (klucz wersji), więc linia liczy się od nowa i znika.
 */
export function SprawdzStopera({ z, j, projektId, naKorekta }: { z: Zaleznosci; j: Jezyk; projektId: string; naKorekta(sesjaId: string): void }): React.ReactElement | null {
  const [s, ustaw] = useState<{ sesjaId: string; godziny: number } | null>(null);
  useEffect(() => {
    let zywy = true;
    void sesjaDoSprawdzenia(z, { projektId }).then((w) => { if (zywy) ustaw(w.ok && w.wartosc && !otwarteKorekty.has(w.wartosc.sesjaId) ? w.wartosc : null); });
    return () => { zywy = false; };
  }, [z, projektId]);
  if (!s) return null;
  return <LiniaSprawdzenia t={j.t} godziny={s.godziny} naSprawdz={() => { otwarteKorekty.add(s.sesjaId); ustaw(null); naKorekta(s.sesjaId); }} />;
}
