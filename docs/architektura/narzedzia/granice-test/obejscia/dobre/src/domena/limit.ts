import type { PortBazy } from '../dane/baza/port'; import { LIMIT } from '../konfiguracja'; export const x = (p: PortBazy | null) => (p ? LIMIT : 0);
