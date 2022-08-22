import type { PageLoad } from './$types';
export const load: PageLoad = async ({ url, data }) => {
	const email = url.searchParams.get('email') || '';
	const generated = url.searchParams.get('generated') == 'true' || false;

	const redirectUrl = url.searchParams.get('redirectUrl');

	return {
		status: 200,
		...data,
		email,
		generated,
		redirectUrl
	};
};
