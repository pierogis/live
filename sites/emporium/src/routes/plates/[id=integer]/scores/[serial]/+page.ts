import type { PageLoad } from './$types';

export const load: PageLoad = async ({ data, parent, params }) => {
	const { user, isUser } = data;

	const { plate } = await parent();

	const scores = plate.model.scores.filter((score) => score.userId == user.id);

	const canonical = `https://emporium.pierogis.live/plates/${params.id}/scores/${params.serial}`;
	const title = `${plate.jurisdiction.name} plate (${plate.startYear || '?'}-${
		plate.endYear || '?'
	}) scores by ${user.serial.toUpperCase()}`;
	const description = title;

	return { canonical, title, description, scores, serial: params.serial, isUser };
};
