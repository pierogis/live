import type { PageLoad } from './$types';

export const load: PageLoad = async (event) => {
	const { user, isUser } = event.data;

	const { plate } = await event.parent();

	const scores = plate.model.scores.filter((score) => score.userId == user.id);

	const canonical = `https://emporium.pierogis.live/plates/${event.params.id}/scores/${event.params.serial}`;
	const title = `${plate.jurisdiction.name} plate (${plate.startYear || '?'}-${
		plate.endYear || '?'
	}) scores by ${user.serial.toUpperCase()}`;
	const description = title;

	return { canonical, title, description, scores, serial: event.params.serial, isUser };
};
