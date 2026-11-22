// Arkusz skrzynki importu na trasie (design-spec R2 :775): „dopiero na liście projektów albo ekranie projektu”, nigdy nad licznikiem (P-046).
// Wspólny dla app/projekty.tsx i app/projekt/[id].tsx: stan skrzynki z kompozycji wzoru, projekty w toku (lista od wołającego, nazwy jak na liście),
// podgląd rodzaju pozycji (`opisZlecenia`), wybór projektu, „Not now”; błąd pozycji → alert `skrzynka.nie_dodano`, po „OK” pozycja znika.
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { ArkuszSkrzynki } from '../ekrany/WzorSkrzynka';
import type { Wynik } from '../domena/bledy';
import type { Tlumacz } from '../ekrany/wspolne';
import { alertImportu, opisZlecenia } from './wzor-dodawanie';
import type { StanSkrzynki } from './wzor';

export type ZrodloSkrzynki = { stan(): StanSkrzynki; naZmiane(f: () => void): () => void; wybierzProjekt(id: string | null): Promise<Wynik<number>>; nieTeraz(): void; potwierdzBlad(id: string): Promise<unknown> };

export function SkrzynkaNaEkranie(p: { wz: ZrodloSkrzynki; t: Tlumacz; aktywny?: boolean; projekty(): Promise<{ id: string; nazwa: string; film?: boolean }[]>; naPoWyborze(): void }): React.ReactElement | null {
  const { wz, t } = p;
  const aktywny = p.aktywny ?? true; // trasa pod inną w stosie (np. lista pod projektem): bez arkusza i alertu — jeden naraz
  const [stan, ustawStan] = useState(wz.stan());
  const [projekty, ustawProjekty] = useState<{ id: string; nazwa: string; film?: boolean }[] | null>(null);
  useEffect(() => wz.naZmiane(() => ustawStan(wz.stan())), [wz]);
  const czeka = aktywny && stan.doWyboru.length > 0;
  useEffect(() => {
    if (!czeka) return;
    let zywy = true;
    void p.projekty().then((x) => { if (zywy) ustawProjekty(x); });
    return () => { zywy = false; };
  }, [czeka]); // eslint-disable-line react-hooks/exhaustive-deps -- lista przy pojawieniu się pozycji
  const blad = aktywny ? stan.bledy[0] : undefined;
  useEffect(() => { // błąd pozycji: alert z przyczyną, po „OK” pozycja znika ze skrzynki (R2)
    if (!blad) return;
    const przyczyna = blad.powod === 'uszkodzony' ? t('skrzynka.uszkodzony') : alertImportu(blad.powod, blad.zlecenie.nazwa, t)?.opis ?? '';
    Alert.alert(t('skrzynka.nie_dodano', { plik: blad.zlecenie.nazwa }), przyczyna, [{ text: t('wspolne.ok'), onPress: () => void wz.potwierdzBlad(blad.zlecenie.id) }]);
  }, [blad, t, wz]);
  if (!czeka || !projekty) return null;
  const film = stan.doWyboru.some((x) => x.rodzaj === 'film'); // P-283 (a): link zastąpi istniejący film projektu
  return (
    <ArkuszSkrzynki t={t} pozycje={stan.doWyboru.map((x) => ({ id: x.id, nazwa: x.nazwa, opis: opisZlecenia(x, t) }))} projekty={projekty.map((x) => ({ id: x.id, nazwa: x.nazwa, opis: film && x.film ? t('skrzynka.film_zastapi') : undefined }))}
      naWybierz={(pid) => void wz.wybierzProjekt(pid).then(p.naPoWyborze)} naNieTeraz={() => wz.nieTeraz()} />
  );
}
