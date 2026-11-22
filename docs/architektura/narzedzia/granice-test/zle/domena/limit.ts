import * as SQLite from 'expo-sqlite';
import { zapisz } from '../dane/repo';
export const limit = () => zapisz(SQLite);
