import { limit } from '../domena/limit';
export interface PortBazy { run(sql: string): Promise<void> }
export const x = limit;
