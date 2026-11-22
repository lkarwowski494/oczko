// Typowane klucze t(): literówka w kluczu to błąd kompilacji. Źródło: en.json; końcówki liczby mnogiej (_one, _other…) schodzą do jednego klucza.
import type en from './slowniki/en.json';

type Sciezki<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Sciezki<T[K], `${P}${K}.`>;
}[keyof T & string];
type BezKategorii<S extends string> = S extends `${infer B}_${'zero' | 'one' | 'two' | 'few' | 'many' | 'other'}` ? B : S;

export type Klucz = BezKategorii<Sciezki<typeof en>>;
