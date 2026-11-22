// Rachunek pomocniczy (rola 02, sesja 3, 2026-10-22): mnożnik stanu ustalonego za odnowienia rocznej subskrypcji.
// Wejście: podział planów [mies., rok, dożywotni] z warianty-s3/*.json (norm.), 5 opłaconych miesięcy (sesja 2),
// retencja rocznej po roku 36% ("up to 36.0%", MS-12a, górna granica) przez 2 kolejne lata, jak w sesji 2 („Jak czytać rachunek”).
const ceny = [0.99, 6.99, 14.99], mies = 5, r = 0.36;
const warianty = { 'V4 (podział A)': [0.30, 0.45, 0.25], 'V3 (próba przesuwa do subskrypcji)': [0.35, 0.45, 0.20], 'B': [0, 0, 1] };
for (const [n, u] of Object.entries(warianty)) {
  const rok1 = u[0] * mies * ceny[0] + u[1] * ceny[1] + u[2] * ceny[2];
  const z = rok1 + u[1] * ceny[1] * (r + r * r);
  console.log(`${n}: 1. rok ${rok1.toFixed(2)} USD brutto/płacącego; z odnowieniami rocznej przez 3 lata ${z.toFixed(2)}; mnożnik ${(z / rok1).toFixed(3)}`);
}
