import type { Category } from '@prisma/client';

export const categoriesInfo: {
	[category in Category]: { emoji: string };
} = {
	overall: { emoji: '🌡️' },
	identifiability: { emoji: '👁️' },
	colors: { emoji: '🎨' },
	symbols: { emoji: '💫' },
	typeface: { emoji: '🔤' },
	clarity: { emoji: '👓' }
};
