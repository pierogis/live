import { NewCategory } from '../src/db/schema';

export const seedCategories: NewCategory[] = [
	{ name: 'overall', symbol: '🌡️', wareName: 'plate' },
	{ name: 'identifiability', symbol: '👁️', wareName: 'plate' },
	{ name: 'colors', symbol: '🎨', wareName: 'plate' },
	{ name: 'symbols', symbol: '💫', wareName: 'plate' },
	{ name: 'typeface', symbol: '🔤', wareName: 'plate' },
	{ name: 'clarity', symbol: '👓', wareName: 'plate' }
];
