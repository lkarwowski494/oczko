/**
 * Oczko Core — Estymator zużycia włóczki i wagi wyrobu (BR-MAG-004)
 * Zapewnia rzetelne obliczenia craftowe, wykrywanie ryzyka Yarn Chicken
 * oraz integrację z inwentarzem magazynu włóczek (stash) i projektami.
 */

export type YarnChickenRisk = 'safe' | 'warning' | 'danger';

export interface ProgressYarnInput {
  completedRows: number;
  targetRows: number;
  usedWeightGrams: number;
  skeinWeightGrams: number;
  skeinLengthMeters?: number;
  availableSkeins?: number;
  safetyMarginPercent?: number; // domyślnie 10%
}

export interface SwatchYarnInput {
  swatchWidthCm: number;
  swatchHeightCm: number;
  swatchWeightGrams: number;
  finishedWidthCm: number;
  finishedHeightCm: number;
  pieceCount?: number; // domyślnie 1
  skeinWeightGrams: number;
  skeinLengthMeters?: number;
  availableSkeins?: number;
  safetyMarginPercent?: number; // domyślnie 10%
}

export interface YarnEstimateResult {
  rawTotalWeightGrams: number;
  estimatedTotalWeightGrams: number;
  remainingWeightGrams: number;
  estimatedTotalLengthMeters?: number;
  remainingLengthMeters?: number;
  requiredSkeins: number;
  gramsPerRow?: number;
  gramsPerCm2?: number;
  availableSkeins?: number;
  isSufficient?: boolean;
  differenceGrams?: number;
  missingSkeins?: number;
  surplusGrams?: number;
  yarnChickenRisk: YarnChickenRisk;
  advice: string;
}

export interface YarnGristResult {
  metersPerGram: number;
  metersPer100g: number;
}

export interface ProjectPartYarnEstimateInput {
  partName: string;
  currentRow: number;
  targetRows: number;
  usedWeightGrams: number;
  yarn: {
    brand: string;
    name: string;
    skeinWeightGrams: number;
    skeinLengthMeters?: number;
    skeinsRemaining: number;
  };
  safetyMarginPercent?: number;
}

export interface ProjectPartYarnEstimateResult {
  partName: string;
  yarnName: string;
  estimate: YarnEstimateResult;
}

/**
 * Oblicza wskaźnik grist przędzy (metry na gram oraz metry na 100g).
 */
export function calculateYarnGrist(weightGrams: number, lengthMeters: number): YarnGristResult {
  if (weightGrams <= 0) {
    throw new Error('Waga musi być większa od zera');
  }
  if (lengthMeters <= 0) {
    throw new Error('Długość musi być większa od zera');
  }

  const metersPerGram = lengthMeters / weightGrams;
  return {
    metersPerGram,
    metersPer100g: metersPerGram * 100,
  };
}

/**
 * Wylicza estymowane zużycie i wagę na podstawie dotychczas wykonanych rzędów i wagi przerobionej dzianiny.
 */
export function estimateYarnFromProgress(input: ProgressYarnInput): YarnEstimateResult {
  const {
    completedRows,
    targetRows,
    usedWeightGrams,
    skeinWeightGrams,
    skeinLengthMeters,
    availableSkeins,
    safetyMarginPercent = 10,
  } = input;

  if (completedRows <= 0) {
    throw new Error('Liczba ukończonych rzędów musi być większa od zera');
  }
  if (targetRows <= 0) {
    throw new Error('Docelowa liczba rzędów musi być większa od zera');
  }
  if (usedWeightGrams <= 0) {
    throw new Error('Waga zużytej włóczki musi być większa od zera');
  }
  if (skeinWeightGrams <= 0) {
    throw new Error('Waga motka musi być większa od zera');
  }

  const margin = Math.max(0, safetyMarginPercent) / 100;
  const gramsPerRow = usedWeightGrams / completedRows;
  const rawTotalWeightGrams = gramsPerRow * targetRows;
  const estimatedTotalWeightGrams = rawTotalWeightGrams * (1 + margin);
  const isCompleted = completedRows >= targetRows;
  const remainingWeightGrams = isCompleted
    ? 0
    : Math.max(0, estimatedTotalWeightGrams - usedWeightGrams);
  const requiredSkeins = Math.ceil(estimatedTotalWeightGrams / skeinWeightGrams);

  let estimatedTotalLengthMeters: number | undefined;
  let remainingLengthMeters: number | undefined;

  if (skeinLengthMeters && skeinLengthMeters > 0) {
    const metersPerGram = skeinLengthMeters / skeinWeightGrams;
    estimatedTotalLengthMeters = estimatedTotalWeightGrams * metersPerGram;
    remainingLengthMeters = remainingWeightGrams * metersPerGram;
  }

  let isSufficient: boolean | undefined;
  let differenceGrams: number | undefined;
  let missingSkeins: number | undefined;
  let surplusGrams: number | undefined;
  let yarnChickenRisk: YarnChickenRisk = 'safe';
  let advice = '';

  if (isCompleted) {
    yarnChickenRisk = 'safe';
    advice = 'Część robótki jest już ukończona lub osiągnęła cel rzędów.';
    if (availableSkeins !== undefined) {
      differenceGrams = availableSkeins * skeinWeightGrams - estimatedTotalWeightGrams;
      isSufficient = true;
    }
  } else if (availableSkeins !== undefined) {
    const availableWeightGrams = availableSkeins * skeinWeightGrams;
    differenceGrams = availableWeightGrams - estimatedTotalWeightGrams;
    isSufficient = differenceGrams >= 0;

    if (!isSufficient) {
      yarnChickenRisk = 'danger';
      const missingWeight = Math.abs(differenceGrams);
      missingSkeins = Math.max(1, Math.ceil(missingWeight / skeinWeightGrams));
      advice = `Ryzyko Yarn Chicken! Brakuje ok. ${Math.round(missingWeight)} g włóczki (${missingSkeins} ${missingSkeins === 1 ? 'motka' : 'motków'}). Dokup włóczkę z tego samego lotu farbowania lub skróć ściągacz.`;
    } else if (differenceGrams < estimatedTotalWeightGrams * 0.05) {
      yarnChickenRisk = 'warning';
      surplusGrams = differenceGrams;
      advice = `Zapas na styk! Masz jedynie ok. ${Math.round(differenceGrams)} g rezerwy (< 5%). Pilnuj naprężenia nitki (tension), aby ukończyć robótkę bez prucia.`;
    } else {
      yarnChickenRisk = 'safe';
      surplusGrams = differenceGrams;
      advice = `Zapas włóczki jest wystarczający. Szacowana bezpieczna nadwyżka wynosi ok. ${Math.round(differenceGrams)} g.`;
    }
  } else {
    advice = `Szacowane łączne zapotrzebowanie to ${Math.round(estimatedTotalWeightGrams)} g (${requiredSkeins} ${requiredSkeins === 1 ? 'motek' : 'motków'}).`;
  }

  return {
    rawTotalWeightGrams,
    estimatedTotalWeightGrams,
    remainingWeightGrams,
    estimatedTotalLengthMeters,
    remainingLengthMeters,
    requiredSkeins,
    gramsPerRow,
    availableSkeins,
    isSufficient,
    differenceGrams,
    missingSkeins,
    surplusGrams,
    yarnChickenRisk,
    advice,
  };
}

/**
 * Wylicza estymowane zużycie włóczki na podstawie próbki ściegu (swatch) i powierzchni gotowego wyrobu.
 */
export function estimateYarnFromSwatch(input: SwatchYarnInput): YarnEstimateResult {
  const {
    swatchWidthCm,
    swatchHeightCm,
    swatchWeightGrams,
    finishedWidthCm,
    finishedHeightCm,
    pieceCount = 1,
    skeinWeightGrams,
    skeinLengthMeters,
    availableSkeins,
    safetyMarginPercent = 10,
  } = input;

  if (swatchWidthCm <= 0 || swatchHeightCm <= 0) {
    throw new Error('Wymiary próbki muszą być większe od zera');
  }
  if (swatchWeightGrams <= 0) {
    throw new Error('Waga próbki musi być większa od zera');
  }
  if (finishedWidthCm <= 0 || finishedHeightCm <= 0) {
    throw new Error('Wymiary wyrobu muszą być większe od zera');
  }
  if (skeinWeightGrams <= 0) {
    throw new Error('Waga motka musi być większa od zera');
  }

  const pieces = pieceCount > 0 ? pieceCount : 1;
  const swatchArea = swatchWidthCm * swatchHeightCm;
  const gramsPerCm2 = swatchWeightGrams / swatchArea;
  const finishedArea = finishedWidthCm * finishedHeightCm * pieces;
  const rawTotalWeightGrams = finishedArea * gramsPerCm2;
  const margin = Math.max(0, safetyMarginPercent) / 100;
  const estimatedTotalWeightGrams = rawTotalWeightGrams * (1 + margin);
  const remainingWeightGrams = estimatedTotalWeightGrams; // Przed rozpoczęciem robótki całość jest wymagana
  const requiredSkeins = Math.ceil(estimatedTotalWeightGrams / skeinWeightGrams);

  let estimatedTotalLengthMeters: number | undefined;
  let remainingLengthMeters: number | undefined;

  if (skeinLengthMeters && skeinLengthMeters > 0) {
    const metersPerGram = skeinLengthMeters / skeinWeightGrams;
    estimatedTotalLengthMeters = estimatedTotalWeightGrams * metersPerGram;
    remainingLengthMeters = remainingWeightGrams * metersPerGram;
  }

  let isSufficient: boolean | undefined;
  let differenceGrams: number | undefined;
  let missingSkeins: number | undefined;
  let surplusGrams: number | undefined;
  let yarnChickenRisk: YarnChickenRisk = 'safe';
  let advice = '';

  if (availableSkeins !== undefined) {
    const availableWeightGrams = availableSkeins * skeinWeightGrams;
    differenceGrams = availableWeightGrams - estimatedTotalWeightGrams;
    isSufficient = differenceGrams >= 0;

    if (!isSufficient) {
      yarnChickenRisk = 'danger';
      const missingWeight = Math.abs(differenceGrams);
      missingSkeins = Math.max(1, Math.ceil(missingWeight / skeinWeightGrams));
      advice = `Ryzyko Yarn Chicken! Brakuje ok. ${Math.round(missingWeight)} g włóczki (${missingSkeins} ${missingSkeins === 1 ? 'motka' : 'motków'}). Dokup włóczkę przed rozpoczęciem.`;
    } else if (differenceGrams < estimatedTotalWeightGrams * 0.05) {
      yarnChickenRisk = 'warning';
      surplusGrams = differenceGrams;
      advice = `Zapas na styk! Masz jedynie ok. ${Math.round(differenceGrams)} g rezerwy (< 5%). Warto mieć dodatkowy motek asekuracyjny.`;
    } else {
      yarnChickenRisk = 'safe';
      surplusGrams = differenceGrams;
      advice = `Zapas włóczki w magazynie jest wystarczający. Nadwyżka wynosi ok. ${Math.round(differenceGrams)} g.`;
    }
  } else {
    advice = `Na wyrób o łącznej powierzchni ${Math.round(finishedArea)} cm² potrzeba ok. ${Math.round(estimatedTotalWeightGrams)} g (${requiredSkeins} ${requiredSkeins === 1 ? 'motek' : 'motków'}).`;
  }

  return {
    rawTotalWeightGrams,
    estimatedTotalWeightGrams,
    remainingWeightGrams,
    estimatedTotalLengthMeters,
    remainingLengthMeters,
    requiredSkeins,
    gramsPerCm2,
    availableSkeins,
    isSufficient,
    differenceGrams,
    missingSkeins,
    surplusGrams,
    yarnChickenRisk,
    advice,
  };
}

/**
 * Pomocnik do szybkiego wyliczenia estymacji bezpośrednio ze struktury części robótki oraz rekordu z magazynu włóczek.
 */
export function estimateFromProjectPart(
  input: ProjectPartYarnEstimateInput
): ProjectPartYarnEstimateResult {
  const estimate = estimateYarnFromProgress({
    completedRows: input.currentRow,
    targetRows: input.targetRows,
    usedWeightGrams: input.usedWeightGrams,
    skeinWeightGrams: input.yarn.skeinWeightGrams,
    skeinLengthMeters: input.yarn.skeinLengthMeters,
    availableSkeins: input.yarn.skeinsRemaining,
    safetyMarginPercent: input.safetyMarginPercent,
  });

  return {
    partName: input.partName,
    yarnName: `${input.yarn.brand} ${input.yarn.name}`,
    estimate,
  };
}
