// Odczyt workflowu w testach kontroli CI (bez logiki kontroli — ta jest w scripts/).
import { YAML } from './maestro-runner'; // dist CommonJS (wejście „browser” pakietu yaml to ESM)

export type Krok = { name?: string; run?: string; uses?: string; env?: Record<string, string> };
export type Workflow = { jobs: Record<string, { steps?: Krok[]; 'continue-on-error'?: unknown }> };
export function parse(tekst: string): Workflow {
  const w: unknown = YAML.parse(tekst);
  if (typeof w !== 'object' || w === null || !('jobs' in w) || typeof w.jobs !== 'object' || w.jobs === null) throw new Error('workflow bez jobs');
  return { jobs: w.jobs as Workflow['jobs'] }; // dane z repo, nie z zewnątrz
}
export const yamlKroki = (w: Workflow, zadanie: string): Krok[] => w.jobs[zadanie]?.steps ?? [];

/** Sekcja `on` workflowu (YAML 1.2: klucz `on` zostaje napisem). */
export function wyzwalacze(tekst: string): Record<string, unknown> {
  const w: unknown = YAML.parse(tekst);
  if (typeof w !== 'object' || w === null || !('on' in w) || typeof w.on !== 'object' || w.on === null) throw new Error('workflow bez on');
  return w.on as Record<string, unknown>; // dane z repo, nie z zewnątrz
}
