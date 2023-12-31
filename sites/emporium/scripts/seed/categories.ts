import { NewCategory } from '../../src/db/schema';

export const seedCategories: NewCategory[] = [
	{ name: 'overall', symbol: '🌡️', ware: 'plate' },
	{ name: 'identifiability', symbol: '👁️', ware: 'plate' },
	{ name: 'colors', symbol: '🎨', ware: 'plate' },
	{ name: 'symbols', symbol: '💫', ware: 'plate' },
	{ name: 'typeface', symbol: '🔤', ware: 'plate' },
	{ name: 'clarity', symbol: '👓', ware: 'plate' }
];
