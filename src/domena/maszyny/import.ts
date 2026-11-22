// Maszyna importu archiwum (moduly.md, „Import archiwum (ADR-0004)”).
export type StanImportu = 'sprawdzanie' | 'odrzucony' | 'gotowy' | 'kopia_przed' | 'wczytywanie' | 'gotowe' | 'wycofany';
export type ZdarzenieImportu = 'sprawdzono_ok' | 'sprawdzono_zle' | 'wybrano' | 'kopia_gotowa' | 'wczytano' | 'blad';

const PRZEJSCIA: Partial<Record<StanImportu, Partial<Record<ZdarzenieImportu, StanImportu>>>> = {
  sprawdzanie: { sprawdzono_ok: 'gotowy', sprawdzono_zle: 'odrzucony', blad: 'odrzucony' },
  gotowy: { wybrano: 'kopia_przed', blad: 'odrzucony' },
  // `blad` przed `wczytywanie` (np. VACUUM INTO bez miejsca): moduly.md nie opisuje — baza jest bez zmian, więc `odrzucony` (wybór 08, zgłoszenie do 05).
  kopia_przed: { kopia_gotowa: 'wczytywanie', blad: 'odrzucony' },
  wczytywanie: { wczytano: 'gotowe', blad: 'wycofany' },
};
export function przejdzImport(s: StanImportu, z: ZdarzenieImportu): StanImportu | 'niedozwolone' {
  return PRZEJSCIA[s]?.[z] ?? 'niedozwolone';
}
/** Czy w tym stanie baza mogła już zostać zmieniona (przed `wczytywanie` zawsze false; `wycofany`: tak — była zmieniana i przywrócona z kopii). */
export function bazaZmieniona(s: StanImportu): boolean {
  return s === 'wczytywanie' || s === 'gotowe' || s === 'wycofany';
}
