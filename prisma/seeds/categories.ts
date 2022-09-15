import type { Category } from '@prisma/client';

export const categories: Omit<Category, 'id' | 'wareId'>[] = [
	{ name: 'overall', symbol: '🌡️', wareName: 'plate' },
	{ name: 'identifiability', symbol: '👁️', wareName: 'plate' },
	{ name: 'colors', symbol: '🎨', wareName: 'plate' },
	{ name: 'symbols', symbol: '💫', wareName: 'plate' },
	{ name: 'typeface', symbol: '🔤', wareName: 'plate' },
	{ name: 'clarity', symbol: '👓', wareName: 'plate' }
];
