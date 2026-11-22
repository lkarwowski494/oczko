// Rozmiar US drutu albo szydełka z mm (RD-11, RD-19; wyrocznia: docs/tresci/wektory.json druty, szydelka). Brak w tabeli = null, bez najbliższej wartości.
// mm zaokrąglone do 0,001 przed dokładnym porównaniem (RD-11-W5–W7, RD-19-W6); mm ≤ 0 albo nieliczba → BladDanych (RD-11-W4, RD-19-W7).
import { BladDanych } from '../bledy';
import { DRUTY, SZYDELKA } from './parametry';

const tysiecznych = (mm: number): number => Math.round(mm * 1000);

export function rozmiarUS(mm: number, narzedzie: 'druty' | 'szydelko'): string | null {
  if (!Number.isFinite(mm) || mm <= 0) throw new BladDanych(`rozmiarUS: zły rozmiar ${mm}`);
  const t = tysiecznych(mm);
  const wpis = (narzedzie === 'druty' ? DRUTY : SZYDELKA).find((r) => tysiecznych(r.mm) === t);
  return wpis ? wpis.us : null;
}
