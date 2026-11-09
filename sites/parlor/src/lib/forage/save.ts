/* Forage's saved progress: one small cookie, so the server can resume your level too. */
import { gameSave } from '../shared/save';
import LIST from 'virtual:level-list/forage';

/** See gameSave in shared/save.ts. */
export const forageSave = gameSave('forage', () => LIST);
