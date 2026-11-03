// „Zgłoś problem” w trybie awaryjnym (ADR-0018 uzupełnienie fix-6, P-194 Q4a): bez otwarcia bazy do zapisu. Treść techniczna (nie tekst
// interfejsu, jak `przygotujZgloszenie`): wersja i build, system, model, powód trybu awaryjnego, liczba nieudanych startów (ADR-0019) i etap ostatniego startu (P-271);
// kody `blad` (bez szczegółów) z kopii tylko do odczytu — gdy się nie da, „database=not_opened”. Żaden błąd odczytu nie blokuje zgłoszenia.
import type { PoleDiagnostyki } from '../ekrany/ZglosProblem';
import { OSTATNIE_BLEDY } from '../konfiguracja';

export async function diagnostykaAwaryjna(o: {
  powod: string; nieudaneStarty: () => Promise<number>; etap?: () => Promise<string>; bledy: () => Promise<{ czasMs: number; kod: string }[]>;
  srodowisko: { wersja: string; system: string; model: string };
}): Promise<PoleDiagnostyki[]> {
  const starty = await o.nieudaneStarty().then(String, () => '?');
  const etap = o.etap ? await o.etap().then((e) => ` ${e}`, () => ' boot_phase=?') : ''; // P-271: etap ostatniego startu normalnego
  const bledy = await o.bledy().then((l) => l.slice(0, OSTATNIE_BLEDY), () => null);
  const tresc = [
    `safe_mode=${o.powod} failed_starts=${starty}${etap}`,
    ...(bledy === null ? ['database=not_opened'] : ['errors:', ...bledy.map((b) => `${new Date(b.czasMs).toISOString()} ${b.kod}`)]),
  ].join('\n');
  return [
    { pole: 'wersja', wartosc: o.srodowisko.wersja },
    { pole: 'system', wartosc: o.srodowisko.system },
    { pole: 'model', wartosc: o.srodowisko.model },
    { pole: 'bledy', wartosc: tresc },
  ];
}
