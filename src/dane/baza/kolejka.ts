// Kolejka FIFO zapisów (ADR-0002): każda pozycja zaczyna się po zakończeniu poprzedniej; błąd jednej nie blokuje następnych.
export type Kolejka = <T>(zadanie: () => Promise<T>) => Promise<T>;

export function kolejka(): Kolejka {
  let ogon: Promise<unknown> = Promise.resolve();
  return <T>(zadanie: () => Promise<T>): Promise<T> => {
    const wynik = ogon.then(zadanie, zadanie);
    ogon = wynik.catch(() => undefined); // błąd zostaje u wołającego; następna pozycja i tak rusza
    return wynik;
  };
}
