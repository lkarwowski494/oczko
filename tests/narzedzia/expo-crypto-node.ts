// Zastępnik expo-crypto w Jest (jak expo-file-system-node.ts, P-120 Q1a): ta sama funkcja z node:crypto — UUID v4 (RFC 4122).
import { randomUUID as uuid } from 'node:crypto';

export const randomUUID = (): string => uuid();
