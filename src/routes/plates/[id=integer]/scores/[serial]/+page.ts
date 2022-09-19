import type { PageLoad } from './$types';
export const load: PageLoad = async ({ parent, params, data }) => {
	const { user, plate, categories } = data;

	const session = await parent();
	const isUser = session.user?.serial == params.serial;

	const scores = plate.model.scores.filter((score) => score.userId == user.id);

	return { plate, scores, serial: params.serial, isUser, categories };
};
