import { storeScores } from '$lib/api/scores';

export const load = async ({ parent, fetch, data }) => {
	const { sessionUser } = await parent();
	const { jurisdiction, categories } = data;

	const platesInfo = jurisdiction.plates.map((plate) => {
		const { userScores, editorialScores, allScores } = storeScores(
			plate.model.scores,
			plate.modelId,
			sessionUser?.id,
			categories,
			fetch
		);

		return { plate, userScores, editorialScores, allScores };
	});

	return { jurisdiction, categories, platesInfo };
};
