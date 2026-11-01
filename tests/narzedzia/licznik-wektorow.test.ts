// 07-jakosc-001 (JAK-05): test liczności wektorów nie może zależeć od kolejności testów w pliku (jest --randomize, -t, --shard).
import { licznikWektorow } from './akceptacja';

describe('licznikWektorow: wynik bez zależności od kolejności', () => {
  test('07-jakosc-001: wynik() przed jakimkolwiek sprawdz() nie pada (kolejność losowa)', () => {
    const licznik = licznikWektorow();
    expect(() => licznik.wynik(3)).not.toThrow();
  });
  test('pusty zbiór wektorów to porażka', () => {
    expect(() => licznikWektorow().wynik(0)).toThrow();
  });
  test('wektor, który pada, zostaje porażką tego wektora', () => {
    const licznik = licznikWektorow();
    expect(() => licznik.sprawdz(() => { throw new Error('zły wynik'); })).toThrow('zły wynik');
  });
});
