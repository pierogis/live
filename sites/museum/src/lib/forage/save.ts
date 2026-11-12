import { gameSave } from '../shared/save';
import LIST from 'virtual:level-list/forage';

export const forageSave = gameSave('forage', () => LIST);
