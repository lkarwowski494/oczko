// Arytmetyka dat kalendarzowych RRRR-MM-DD (RD-16): bez strefy i bez zegara systemu — dzień to data, nie chwila.
export function dodajDni(dzien: string, dni: number): string {
  const [r, m, d] = dzien.split('-').map(Number);
  return new Date(Date.UTC(r, m - 1, d + dni)).toISOString().slice(0, 10);
}
/** Prawdziwa data kalendarzowa RRRR-MM-DD (np. 2026-02-30 nie jest). */
export function jestDniem(dzien: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dzien) && dodajDni(dzien, 0) === dzien;
}
