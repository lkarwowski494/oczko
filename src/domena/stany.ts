// Listy stanów i rodzajów (ADR-0013). Jedyna definicja: docs/architektura/stany.json; test porównuje tę kopię z JSON i z CHECK w schemat.sql.
export const STANY = {
  'projekt.stan': ['w_toku', 'ukonczony'],
  'projekt.narzedzie': ['druty', 'szydelko'], // P-184: numer US z RD-11 albo RD-19
  'licznik.rodzaj': ['rzedy', 'oczka'],
  'licznik.znaczenie': ['skonczone', 'w_trakcie'],
  'zdarzenie.rodzaj': ['plus', 'minus', 'wpisanie', 'zerowanie', 'cofniecie', 'rozstrzygniecie'],
  'zdarzenie.zrodlo': ['aplikacja', 'ekran_blokady', 'zegarek', 'synchronizacja', 'import'],
  'zdarzenie.urzadzenie_rodzaj': ['iphone', 'ipad'], // P-247 U6a
  'sesja.stan': ['trwa', 'wstrzymana', 'zakonczona'],
  'wzor.zrodlo': ['pdf', 'obraz', 'www', 'word'],
  'narzedzie.rodzaj': ['druty', 'szydelko', 'inne'],
  'obliczenie.rodzaj': ['oczka_z_probki', 'jednostki', 'grubosc'],
} as const;
export type RodzajZdarzenia = (typeof STANY)['zdarzenie.rodzaj'][number];
export type ZrodloZdarzenia = (typeof STANY)['zdarzenie.zrodlo'][number];
export type RodzajUrzadzenia = (typeof STANY)['zdarzenie.urzadzenie_rodzaj'][number];
export type StanProjektu = (typeof STANY)['projekt.stan'][number];
export type NarzedzieProjektu = (typeof STANY)['projekt.narzedzie'][number];
export type StanSesji = (typeof STANY)['sesja.stan'][number];
export type ZnaczenieLicznika = (typeof STANY)['licznik.znaczenie'][number];
