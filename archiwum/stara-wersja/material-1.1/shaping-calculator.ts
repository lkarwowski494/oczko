/**
 * Oczko — Silnik Kształtowania i Równomiernego Dodawania/Odejmowania Oczek
 * (Even Increases & Decreases / Multi-Row Shaping Engine)
 *
 * Deterministyczny algorytm euklidesowy do symetrycznego i estetycznego
 * rozmieszczania modyfikacji oczek w rzędzie oraz w pionie (wielorzędowo).
 */

export type IncreaseMethod = 'M1L' | 'M1R' | 'kfb' | 'yo';
export type DecreaseMethod = 'k2tog' | 'ssk' | 'p2tog';

export interface EvenRowInstructionGroup {
  normalStitches: number;
  actionStitches: number; // ile oczek tworzy/odejmuje akcja
  actionLabel: string;
  repeatCount: number;
}

export interface EvenRowShapingResult {
  mode: 'increase' | 'decrease' | 'none';
  initialStitches: number;
  targetStitches: number;
  difference: number;
  edgeStitches: number;
  method: string;
  groups: EvenRowInstructionGroup[];
  summaryPL: string;
  summaryEN: string;
  shortNotation: string;
  isValid: boolean;
  errorMessage?: string;
}

export interface MultiRowShapingParams {
  startStitches: number;
  endStitches: number;
  totalRows: number;
  shapingPlacement: 'both_edges' | 'single_edge';
  workSidePreference?: 'right_side_only' | 'any_row';
}

export interface MultiRowShapingPhase {
  repeatTimes: number;
  everyNthRow: number;
  stitchesChangedPerAction: number;
}

export interface MultiRowShapingResult {
  mode: 'increase' | 'decrease' | 'none';
  startStitches: number;
  endStitches: number;
  totalRows: number;
  shapingPlacement: 'both_edges' | 'single_edge';
  totalStitchDiff: number;
  actionCount: number;
  phases: MultiRowShapingPhase[];
  summaryPL: string;
  summaryEN: string;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Równomierne dodawanie oczek w rzędzie (Increase Evenly).
 */
export function calculateEvenIncreases(
  currentStitches: number,
  targetStitches: number,
  edgeStitches: number = 0,
  method: IncreaseMethod = 'M1L'
): EvenRowShapingResult {
  const safeCurrent = Math.max(0, Math.floor(currentStitches));
  const safeTarget = Math.max(0, Math.floor(targetStitches));
  const safeEdge = Math.max(0, Math.floor(edgeStitches));

  if (safeCurrent === safeTarget) {
    return {
      mode: 'none',
      initialStitches: safeCurrent,
      targetStitches: safeTarget,
      difference: 0,
      edgeStitches: safeEdge,
      method,
      groups: [],
      summaryPL: 'Liczba oczek jest zgodna — nie wykonuj dodawań.',
      summaryEN: 'Stitch count is equal — no increases needed.',
      shortNotation: 'Bez zmian',
      isValid: true,
    };
  }

  if (safeTarget < safeCurrent) {
    return {
      mode: 'increase',
      initialStitches: safeCurrent,
      targetStitches: safeTarget,
      difference: safeCurrent - safeTarget,
      edgeStitches: safeEdge,
      method,
      groups: [],
      summaryPL: 'Docelowa liczba oczek jest mniejsza niż początkowa. Użyj kalkulatora odejmowania.',
      summaryEN: 'Target stitches is less than current. Use decrease mode instead.',
      shortNotation: 'Błąd danych',
      isValid: false,
      errorMessage: 'TARGET_LESS_THAN_CURRENT',
    };
  }

  const diff = safeTarget - safeCurrent;
  const usableStitches = safeCurrent - 2 * safeEdge;

  if (usableStitches < 0) {
    return {
      mode: 'increase',
      initialStitches: safeCurrent,
      targetStitches: safeTarget,
      difference: diff,
      edgeStitches: safeEdge,
      method,
      groups: [],
      summaryPL: `Oczka brzegowe (2 × ${safeEdge} = ${2 * safeEdge}) przekraczają liczbę oczek (${safeCurrent}).`,
      summaryEN: `Edge stitches (2 x ${safeEdge}) exceed total stitches (${safeCurrent}).`,
      shortNotation: 'Błąd brzegów',
      isValid: false,
      errorMessage: 'EDGE_EXCEEDS_TOTAL',
    };
  }

  // Rozpatrujemy specyfikę kfb vs M1/yo
  if (method === 'kfb' && usableStitches < diff) {
    return {
      mode: 'increase',
      initialStitches: safeCurrent,
      targetStitches: safeTarget,
      difference: diff,
      edgeStitches: safeEdge,
      method,
      groups: [],
      summaryPL: `Metoda kfb wymaga co najmniej ${diff} dostępnych oczek do przerobienia, a masz ${usableStitches}.`,
      summaryEN: `kfb method requires at least ${diff} stitches to work into, but only ${usableStitches} available.`,
      shortNotation: 'Brak oczek na kfb',
      isValid: false,
      errorMessage: 'INSUFFICIENT_STITCHES_FOR_KFB',
    };
  }

  // Obliczenie rozkładu:
  // W metodzie M1/yo dodajemy w odstępach między oczkami lub po k przerobionych oczkach.
  // Dzielimy usableStitches na diff sekcji.
  const baseK = Math.floor(usableStitches / diff);
  const remainder = usableStitches % diff;

  const groups: EvenRowInstructionGroup[] = [];
  const actionLabel = method;

  if (remainder === 0) {
    groups.push({
      normalStitches: baseK,
      actionStitches: 1,
      actionLabel,
      repeatCount: diff,
    });
  } else {
    // Rozkładamy większe grupy (baseK + 1) i mniejsze (baseK)
    const largerCount = remainder;
    const smallerCount = diff - remainder;

    groups.push({
      normalStitches: baseK + 1,
      actionStitches: 1,
      actionLabel,
      repeatCount: largerCount,
    });

    groups.push({
      normalStitches: baseK,
      actionStitches: 1,
      actionLabel,
      repeatCount: smallerCount,
    });
  }

  // Budujemy słowny opis
  const edgeStrPL = safeEdge > 0 ? `Brzeg: ${safeEdge} o. ` : '';
  const edgeEndStrPL = safeEdge > 0 ? `, ${safeEdge} o. brzeg` : '';
  const edgeStrEN = safeEdge > 0 ? `Edge ${safeEdge} sts, ` : '';
  const edgeEndStrEN = safeEdge > 0 ? `, edge ${safeEdge} sts` : '';

  const groupsPL = groups
    .map(g => `*${g.normalStitches > 0 ? `przerób ${g.normalStitches} o., ` : ''}dodaj 1 o. (${g.actionLabel})* × ${g.repeatCount}`)
    .join(', ');

  const groupsEN = groups
    .map(g => `*${g.normalStitches > 0 ? `k${g.normalStitches}, ` : ''}${g.actionLabel}* x ${g.repeatCount}`)
    .join(', ');

  const shortGroups = groups
    .map(g => `[${g.normalStitches > 0 ? `k${g.normalStitches}, ` : ''}${g.actionLabel}] × ${g.repeatCount}`)
    .join(', ');

  const summaryPL = `${edgeStrPL}${groupsPL}${edgeEndStrPL}. Wynik: ${safeTarget} o. (+${diff})`;
  const summaryEN = `${edgeStrEN}${groupsEN}${edgeEndStrEN}. Result: ${safeTarget} sts (+${diff})`;
  const shortNotation = safeEdge > 0 ? `${safeEdge} o., ${shortGroups}, ${safeEdge} o.` : shortGroups;

  return {
    mode: 'increase',
    initialStitches: safeCurrent,
    targetStitches: safeTarget,
    difference: diff,
    edgeStitches: safeEdge,
    method,
    groups,
    summaryPL,
    summaryEN,
    shortNotation,
    isValid: true,
  };
}

/**
 * Równomierne odejmowanie oczek w rzędzie (Decrease Evenly).
 */
export function calculateEvenDecreases(
  currentStitches: number,
  targetStitches: number,
  edgeStitches: number = 0,
  method: DecreaseMethod = 'k2tog'
): EvenRowShapingResult {
  const safeCurrent = Math.max(0, Math.floor(currentStitches));
  const safeTarget = Math.max(0, Math.floor(targetStitches));
  const safeEdge = Math.max(0, Math.floor(edgeStitches));

  if (safeCurrent === safeTarget) {
    return {
      mode: 'none',
      initialStitches: safeCurrent,
      targetStitches: safeTarget,
      difference: 0,
      edgeStitches: safeEdge,
      method,
      groups: [],
      summaryPL: 'Liczba oczek jest zgodna — nie wykonuj odejmowań.',
      summaryEN: 'Stitch count is equal — no decreases needed.',
      shortNotation: 'Bez zmian',
      isValid: true,
    };
  }

  if (safeTarget > safeCurrent) {
    return {
      mode: 'decrease',
      initialStitches: safeCurrent,
      targetStitches: safeTarget,
      difference: safeTarget - safeCurrent,
      edgeStitches: safeEdge,
      method,
      groups: [],
      summaryPL: 'Docelowa liczba oczek jest większa niż początkowa. Użyj kalkulatora dodawania.',
      summaryEN: 'Target stitches is greater than current. Use increase mode instead.',
      shortNotation: 'Błąd danych',
      isValid: false,
      errorMessage: 'TARGET_GREATER_THAN_CURRENT',
    };
  }

  const diff = safeCurrent - safeTarget;
  const usableStitches = safeCurrent - 2 * safeEdge;

  if (usableStitches < 0) {
    return {
      mode: 'decrease',
      initialStitches: safeCurrent,
      targetStitches: safeTarget,
      difference: diff,
      edgeStitches: safeEdge,
      method,
      groups: [],
      summaryPL: `Oczka brzegowe (2 × ${safeEdge} = ${2 * safeEdge}) przekraczają liczbę oczek (${safeCurrent}).`,
      summaryEN: `Edge stitches (2 x ${safeEdge}) exceed total stitches (${safeCurrent}).`,
      shortNotation: 'Błąd brzegów',
      isValid: false,
      errorMessage: 'EDGE_EXCEEDS_TOTAL',
    };
  }

  // Każde odejmowanie k2tog/ssk zużywa 2 oczka z rzędu bazowego
  const stitchesRequiredForDecreases = diff * 2;

  if (usableStitches < stitchesRequiredForDecreases) {
    return {
      mode: 'decrease',
      initialStitches: safeCurrent,
      targetStitches: safeTarget,
      difference: diff,
      edgeStitches: safeEdge,
      method,
      groups: [],
      summaryPL: `Do odjęcia ${diff} oczek metodą ${method} potrzeba minimum ${stitchesRequiredForDecreases} oczek (zużywa po 2 o.). Masz ${usableStitches}. Rozłóż odejmowania na więcej rzędów.`,
      summaryEN: `Decreasing ${diff} stitches requires at least ${stitchesRequiredForDecreases} stitches. Available: ${usableStitches}. Spread over multiple rows.`,
      shortNotation: 'Zbyt mało oczek',
      isValid: false,
      errorMessage: 'EXCESSIVE_DECREASES_FOR_ROW',
    };
  }

  // Pozostałe zwykłe oczka (poza 2*diff oczkami zużytymi na odejmowania)
  const remainingPlainStitches = usableStitches - stitchesRequiredForDecreases;
  const baseK = Math.floor(remainingPlainStitches / diff);
  const remainder = remainingPlainStitches % diff;

  const groups: EvenRowInstructionGroup[] = [];
  const actionLabel = method;

  if (remainder === 0) {
    groups.push({
      normalStitches: baseK,
      actionStitches: 2, // zużywa 2, daje 1
      actionLabel,
      repeatCount: diff,
    });
  } else {
    const largerCount = remainder;
    const smallerCount = diff - remainder;

    groups.push({
      normalStitches: baseK + 1,
      actionStitches: 2,
      actionLabel,
      repeatCount: largerCount,
    });

    groups.push({
      normalStitches: baseK,
      actionStitches: 2,
      actionLabel,
      repeatCount: smallerCount,
    });
  }

  const edgeStrPL = safeEdge > 0 ? `Brzeg: ${safeEdge} o. ` : '';
  const edgeEndStrPL = safeEdge > 0 ? `, ${safeEdge} o. brzeg` : '';
  const edgeStrEN = safeEdge > 0 ? `Edge ${safeEdge} sts, ` : '';
  const edgeEndStrEN = safeEdge > 0 ? `, edge ${safeEdge} sts` : '';

  const groupsPL = groups
    .map(g => `*${g.normalStitches > 0 ? `przerób ${g.normalStitches} o., ` : ''}${g.actionLabel}* × ${g.repeatCount}`)
    .join(', ');

  const groupsEN = groups
    .map(g => `*${g.normalStitches > 0 ? `k${g.normalStitches}, ` : ''}${g.actionLabel}* x ${g.repeatCount}`)
    .join(', ');

  const shortGroups = groups
    .map(g => `[${g.normalStitches > 0 ? `k${g.normalStitches}, ` : ''}${g.actionLabel}] × ${g.repeatCount}`)
    .join(', ');

  const summaryPL = `${edgeStrPL}${groupsPL}${edgeEndStrPL}. Wynik: ${safeTarget} o. (-${diff})`;
  const summaryEN = `${edgeStrEN}${groupsEN}${edgeEndStrEN}. Result: ${safeTarget} sts (-${diff})`;
  const shortNotation = safeEdge > 0 ? `${safeEdge} o., ${shortGroups}, ${safeEdge} o.` : shortGroups;

  return {
    mode: 'decrease',
    initialStitches: safeCurrent,
    targetStitches: safeTarget,
    difference: diff,
    edgeStitches: safeEdge,
    method,
    groups,
    summaryPL,
    summaryEN,
    shortNotation,
    isValid: true,
  };
}

/**
 * Kształtowanie wielorzędowe (Multi-Row Shaping / Rękawy, Dekolty, Klińce).
 */
export function calculateMultiRowShaping(
  params: MultiRowShapingParams
): MultiRowShapingResult {
  const start = Math.max(1, Math.floor(params.startStitches));
  const end = Math.max(1, Math.floor(params.endStitches));
  const totalRows = Math.max(1, Math.floor(params.totalRows));
  const placement = params.shapingPlacement;
  const rightSideOnly = params.workSidePreference !== 'any_row';

  if (start === end) {
    return {
      mode: 'none',
      startStitches: start,
      endStitches: end,
      totalRows,
      shapingPlacement: placement,
      totalStitchDiff: 0,
      actionCount: 0,
      phases: [],
      summaryPL: `Przerabiaj ${totalRows} rzędów prosto bez zmiany liczby oczek (${start} o.).`,
      summaryEN: `Work ${totalRows} rows straight without shaping (${start} sts).`,
      isValid: true,
    };
  }

  const mode = end > start ? 'increase' : 'decrease';
  const totalDiff = Math.abs(end - start);
  const stitchesPerAction = placement === 'both_edges' ? 2 : 1;

  if (placement === 'both_edges' && totalDiff % 2 !== 0) {
    return {
      mode,
      startStitches: start,
      endStitches: end,
      totalRows,
      shapingPlacement: placement,
      totalStitchDiff: totalDiff,
      actionCount: 0,
      phases: [],
      summaryPL: `Symetryczne kształtowanie po obu brzegach wymaga parzystej różnicy oczek (różnica wynosi ${totalDiff}).`,
      summaryEN: `Shaping on both edges requires an even stitch difference (difference is ${totalDiff}).`,
      isValid: false,
      errorMessage: 'ODD_DIFF_FOR_BOTH_EDGES',
    };
  }

  const actionCount = totalDiff / stitchesPerAction;

  if (actionCount > totalRows) {
    return {
      mode,
      startStitches: start,
      endStitches: end,
      totalRows,
      shapingPlacement: placement,
      totalStitchDiff: totalDiff,
      actionCount,
      phases: [],
      summaryPL: `Liczba akcji kształtowania (${actionCount}) przewyższa liczbę dostępnych rzędów (${totalRows}). Zwiększ liczbę rzędów.`,
      summaryEN: `Shaping actions (${actionCount}) exceed available rows (${totalRows}). Increase total rows.`,
      isValid: false,
      errorMessage: 'ACTIONS_EXCEED_ROWS',
    };
  }

  // Obliczenie rozstawienia w rzędach
  // Jeśli preferujemy tylko prawe strony (RS), rzędy akcji muszą być parzyste (np. co 2, co 4, co 6 rzędów).
  let baseInterval = Math.floor(totalRows / actionCount);
  let remainder = totalRows % actionCount;

  if (rightSideOnly) {
    // Zaokrąglamy w dół do liczby parzystej
    if (baseInterval % 2 !== 0 && baseInterval > 1) {
      baseInterval -= 1;
      remainder = totalRows - (baseInterval * actionCount);
    }
  }

  const phases: MultiRowShapingPhase[] = [];

  if (remainder === 0 || baseInterval === 0) {
    const interval = Math.max(1, baseInterval);
    phases.push({
      repeatTimes: actionCount,
      everyNthRow: interval,
      stitchesChangedPerAction: stitchesPerAction,
    });
  } else {
    // Podział na 2 fazy: faza częstsza i faza rzadsza
    const nextInterval = rightSideOnly ? baseInterval + 2 : baseInterval + 1;
    const intervalDiff = nextInterval - baseInterval;
    const phase2Count = Math.floor(remainder / intervalDiff);
    const phase1Count = actionCount - phase2Count;

    if (phase1Count > 0) {
      phases.push({
        repeatTimes: phase1Count,
        everyNthRow: Math.max(1, baseInterval),
        stitchesChangedPerAction: stitchesPerAction,
      });
    }
    if (phase2Count > 0) {
      phases.push({
        repeatTimes: phase2Count,
        everyNthRow: nextInterval,
        stitchesChangedPerAction: stitchesPerAction,
      });
    }
  }

  // Generowanie opisu
  const verbPL = mode === 'increase' ? 'Dodawaj' : 'Odejmuj';
  const verbEN = mode === 'increase' ? 'Increase' : 'Decrease';
  const wherePL = placement === 'both_edges' ? 'po 1 o. na każdym brzegu' : '1 o.';
  const whereEN = placement === 'both_edges' ? '1 st at each edge' : '1 st';

  const phaseStringsPL = phases.map(p => `co ${p.everyNthRow} rzędów × ${p.repeatTimes} razy`);
  const phaseStringsEN = phases.map(p => `every ${p.everyNthRow} rows x ${p.repeatTimes} times`);

  const summaryPL = `${verbPL} ${wherePL} ${phaseStringsPL.join(', a następnie ')}. Razem: ${totalRows} rzędów, wynik: ${end} o.`;
  const summaryEN = `${verbEN} ${whereEN} ${phaseStringsEN.join(', then ')}. Total: ${totalRows} rows, result: ${end} sts.`;

  return {
    mode,
    startStitches: start,
    endStitches: end,
    totalRows,
    shapingPlacement: placement,
    totalStitchDiff: totalDiff,
    actionCount,
    phases,
    summaryPL,
    summaryEN,
    isValid: true,
  };
}
