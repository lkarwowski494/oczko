// Nazwa zapasowa części (BY-002, 04-studio-projektowe-002): część projektu roboczego dostaje jako nazwę dzień utworzenia RRRR-MM-DD
// (`utworzSzybkiLicznik`, `utworzProjekt` bez nazwy; RD-16, dane.md „Projekt roboczy bez nazwy”). Taka nazwa nie jest słowami użytkowniczki,
// więc ekran jej nie pokazuje — także po nazwaniu samego projektu (flaga `nienazwany` należy do projektu, nie do części).
// Rozpoznanie po formacie: jedyne miejsce, w którym powstaje taka nazwa, to dzień ISO z zegara aplikacji; część nazwana ręcznie dokładnie tak
// (poprawna data i nic więcej) też zostaje ukryta — kompromis bez migracji schematu (decyzja P-842).

/** Czy nazwa części to poprawny dzień RRRR-MM-DD (nazwa zapasowa, nie wpisana przez użytkowniczkę). */
export function jestNazwaZapasowaCzesci(nazwa: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(nazwa);
  if (!m) return false;
  const [, r, mies, dz] = m;
  const d = new Date(Date.UTC(Number(r), Number(mies) - 1, Number(dz)));
  return d.getUTCFullYear() === Number(r) && d.getUTCMonth() === Number(mies) - 1 && d.getUTCDate() === Number(dz);
}

/** Nazwa części do pokazania jako podpis (licznik, wzór, pole nazwy): `null`, gdy to nazwa zapasowa. */
export function czescNaLiczniku(nazwa: string): string | null {
  return jestNazwaZapasowaCzesci(nazwa) ? null : nazwa;
}
