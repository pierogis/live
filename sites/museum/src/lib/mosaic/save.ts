import { gameSave, type GameOption } from '../shared/save';
import LIST from 'virtual:level-list/mosaic';

const OPTIONS: GameOption[] = [{ key: 'relaxed', label: 'bigger tray' }];

export const mosaicSave = gameSave('mosaic', () => LIST, OPTIONS);
