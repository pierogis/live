import { storeScores } from '$lib/api/scores';

export const load = async ({ parent, fetch, data }) => {
	const { categories, sessionUser } = await parent();
	const { plates } = data;

	const platesInfo = plates.map((plate) => {
		const { userScores, editorialScores, allScores } = storeScores(
			plate.model.scores,
			plate.modelId,
			sessionUser?.id,
			categories,
			fetch
		);

		return { plate, userScores, editorialScores, allScores };
	});

	const canonical = `https://emporium.pierogis.live/plates`;
	const title = `plates`;
	const description = `plates in the emporium`;

	return { canonical, title, description, platesInfo };
};
