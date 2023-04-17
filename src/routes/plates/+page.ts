import { storeScores } from '$lib/api/scores';

export const load = async ({ parent }) => {
	const { plates, sessionUser, categories } = await parent();

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

	return {
		categories,
		platesInfo
	};
};
