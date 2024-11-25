import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const canonical = `https://emporium.pierogis.live/plates/faq`;
	const title = `faq`;
	const description = `frequently asked questions about the emporium`;

	return {
		canonical,
		title,
		description
	};
};
