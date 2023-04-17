import { storeScores } from '$lib/api/scores';

export const load = async ({ parent, fetch, data }) => {
	const { sessionUser, categories } = await parent();
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
	return { platesInfo };
};
