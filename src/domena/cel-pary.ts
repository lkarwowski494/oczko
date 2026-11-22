// Cel części (U-8) z celem drugiej części pary (BR-PRJ-014 S1, S3; P-199 Q2a, moduly.md „Kontrakt partii 5”): własny cel wygrywa; część pary bez
// własnego celu ma cel = rzędy pierwszej części, liczony przy każdym odczycie (pojawia się, gdy pierwsza ma rzędy). Jedna funkcja dla ekranu
// projektu, ekranu licznika i arkusza „What’s next?” (ARCH-02).
export function celZPary(w: { cel: number | null; paraZ: string | null; rzedyPary: number }): number | null {
  if (w.cel !== null) return w.cel;
  return w.paraZ !== null && w.rzedyPary > 0 ? w.rzedyPary : null;
}
