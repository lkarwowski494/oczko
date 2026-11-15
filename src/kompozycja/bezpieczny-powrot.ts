// BY-001 (P3 z docs/programista/bw-recenzja.md): powrót z trasy, który po jej zamknięciu nic nie robi. „Back” albo gest zamykają trasę `/wzor` w czasie importu;
// gdy import kończy się potem powrotem na projekt („czeka na sieć”, `zapiszCzekanieNaSiec`), drugie `router.back()` zdjęłoby ekran projektu spod użytkowniczki.
import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';

export function useBezpiecznyPowrot(): () => void {
  const router = useRouter();
  const zywa = useRef(true);
  useEffect(() => { zywa.current = true; return () => { zywa.current = false; }; }, []);
  return useCallback(() => { if (zywa.current) router.back(); }, [router]);
}
