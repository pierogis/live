export const load = async ({ parent, params, data }) => {
	const { user, plate, categories } = data;

	const { sessionUser } = await parent();
	const isUser = sessionUser?.id == user.id;

	const scores = plate.model.scores.filter((score) => score.userId == user.id);

	return { plate, scores, serial: params.serial, isUser, categories };
};
