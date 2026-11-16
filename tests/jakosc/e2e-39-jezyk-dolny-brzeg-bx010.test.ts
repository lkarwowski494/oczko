/* BX-010 (P-190, scenariusz 39): po restarcie język jest polski, opis „Ekran pozostaje włączony…” ma 3 linie i wiersz „Język” leży na dolnym brzegu
 * przewijanego obszaru Ustawień. `scrollUntilVisible` kończy, gdy ramka elementu mieści się na EKRANIE (402×874 pt), choć ScrollView kończy się wyżej
 * (dolne wcięcie bezpiecznego obszaru): w przebiegu 43774048947 (część 1, krok 62) hierarchia dała `ustawienia` [0,62][402,840], wiersz
 * `ustawienia-jezyk` [20,823][382,867], pasek przewijania 81% — środek wiersza (y=845) leży poza ScrollView, więc stuknięcie nic nie otwiera.
 * Reguła: po `scrollUntilVisible` na `ustawienia-jezyk` scenariusz robi jeszcze `scroll` (do końca listy wiersz jest w całości nad krawędzią), potem stuka.
 * Dlaczego: asercja `jezyk` po stuknięciu pozostaje bez zmian — poprawka nie osłabia scenariusza, tylko stuka w widoczną część wiersza. */
import * as path from 'path';
import { wczytaj, kroki } from './maestro-runner';

const plik = path.join(__dirname, '..', '..', 'e2e/scenariusze/39-p-190-jezyk-trwaly.yaml');
const jestJezyk = (arg: any) => (typeof arg === 'string' ? arg : arg?.id) === 'ustawienia-jezyk';

test('BX-010: stuknięcie wiersza „Język” po przewinięciu jest poprzedzone dodatkowym `scroll` (dolny brzeg ScrollView)', () => {
  const lista = [...kroki(wczytaj(plik).polecenia)];
  const nazwy = lista.map((k) => ({ n: k.nazwa, jezyk: k.nazwa === 'tapOn' && jestJezyk(k.arg), przewin: k.nazwa === 'scrollUntilVisible' && jestJezyk(k.arg?.element) }));
  const stuknieciaPoRestarcie = nazwy.map((x, i) => ({ ...x, i })).filter((x) => x.jezyk);
  expect(stuknieciaPoRestarcie.length).toBe(3);
  // pierwsze stuknięcie (przed restartem, język angielski) pomijamy; dwa po restarcie wymagają `scroll` między przewinięciem a stuknięciem
  for (const s of stuknieciaPoRestarcie.slice(1)) {
    let j = s.i - 1;
    while (j >= 0 && nazwy[j]!.n === 'waitForAnimationToEnd') j--;
    expect(nazwy[j]!.n).toBe('scroll');
  }
});
