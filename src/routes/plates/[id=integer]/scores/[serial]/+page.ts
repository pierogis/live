export const load = async ({ parent, params, data }) => {
	const { user, isUser } = data;

	const { plate } = await parent();

	const scores = plate.model.scores.filter((score) => score.userId == user.id);

	return { scores, serial: params.serial, isUser };
};
