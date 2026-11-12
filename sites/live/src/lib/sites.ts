export interface Site {
	title: string;
	tagline: string;
	href: string;
}

/** The sites on the homepage. */
export const MAIN: Site[] = [
	{ title: 'stale', tagline: 'well beyond the pale', href: 'https://stale.pierogis.live' },
	{ title: 'emporium', tagline: 'a place for plates', href: 'https://emporium.pierogis.live' },
	{
		title: 'museum',
		tagline: 'a quiet room with pictures',
		href: 'https://museum.pierogis.live'
	}
];

/** The rest, listed on /other. */
export const OTHER: Site[] = [
	{ title: 'kitchen', tagline: 'work on a recipe', href: 'https://kitchen.pierogis.live' },
	{ title: 'colors', tagline: 'refine your palette', href: 'https://colors.pierogis.live' },
	{
		title: 'utensils',
		tagline: 'some implements to aid consumption',
		href: 'https://utensils.pierogis.live'
	},
	{
		title: 'careers',
		tagline: 'a good place to start working with pierogis',
		href: 'https://careers.pierogis.live'
	}
];
