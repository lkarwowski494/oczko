// P-255 (c), NFR-WYD-001, scenariusz 31: panel buildu E2E `e2e-pomiar-plus` — „p95 … ms, n = N” z czasów od stuknięcia +1 do klatki
// po nowej wartości (bez t(), e2e/README.md). p95 metodą najbliższej rangi (ceil(0,95 · n)); pusta lista → brak panelu.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { p95, PanelPomiaru } from '../../src/kompozycja/e2e/panele';

test('p95 najbliższej rangi', () => {
  expect(p95([])).toBeNull();
  expect(p95([5])).toBe(5);
  expect(p95(Array.from({ length: 20 }, (_, i) => i + 1))).toBe(19); // ceil(0,95·20) = 19. pozycja
  expect(p95([30, 10, 20])).toBe(30);
});
// P-456 (M1-062): pierwsze stuknięcie (zimna ścieżka) osobno, informacyjnie; p95 i n liczone z kolejnych (stan ustalony).
test('panel: „p95 19 ms, n = 20 · first 350 ms” (zaokrąglenie do ms); jedno stuknięcie — tylko „first”; bez próbek nic', () => {
  const { rerender } = render(<PanelPomiaru probkiMs={[]} />);
  expect(screen.queryByTestId('e2e-pomiar-plus')).toBeNull();
  rerender(<PanelPomiaru probkiMs={[350.2, ...Array.from({ length: 20 }, (_, i) => i + 1.4)]} />);
  expect(screen.getByTestId('e2e-pomiar-plus').props.children).toBe('p95 19 ms, n = 20 · first 350 ms');
  rerender(<PanelPomiaru probkiMs={[412.6]} />);
  expect(screen.getByTestId('e2e-pomiar-plus').props.children).toBe('first 413 ms');
});
