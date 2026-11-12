import type { Level } from '../engine';
import { levelsFrom } from '../../shared/levels';

// Vite needs the glob pattern written in this folder.
export const { PACKS, LEVELS } = levelsFrom(
	import.meta.glob<{ default: { name: string; levels: Level[] } }>('./*.json', { eager: true })
);
