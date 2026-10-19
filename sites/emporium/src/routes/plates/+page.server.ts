import { getFullPlates } from '#lib/server/database/plates.js';

export const load = async (event) => {
	const canonical = `https://emporium.pierogis.live/plates`;
	const title = `plates`;
	const description = `plates in the emporium`;

	const plates = getFullPlates(event.locals.db, {});

	return { canonical, title, description, plates };
};
