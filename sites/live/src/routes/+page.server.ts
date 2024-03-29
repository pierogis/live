import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const taglines = [
		'live pierogis multimedia experiences',
		'data driven restaurant',
		'not dead yet !',
		'virtual food truck'
	];
	const tagline = taglines[Math.floor(Math.random() * taglines.length)];

	const sites = [
		{ href: 'https://emporium.pierogis.live', tagline: 'a place for plates', title: 'emporium' },
		{ href: 'https://stale.pierogis.live', tagline: 'well beyond the pale', title: 'stale' },
		{ href: 'https://kitchen.pierogis.live', tagline: 'work on a recipe', title: 'kitchen' },
		{ href: 'https://colors.pierogis.live', tagline: 'refine your palette', title: 'colors' },
		{
			href: 'https://utensils.pierogis.live',
			tagline: 'some implements to aid consumption',
			title: 'utensils'
		}
	];

	const canonical = 'https://pierogis.live';
	const title = 'pierogis live';
	const description = 'a basecamp for pierogis';

	return {
		canonical,
		title,
		description,
		tagline,
		sites
	};
};
