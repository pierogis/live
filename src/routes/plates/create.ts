import type { Plate } from '@prisma/client';

/** @type {import('./plates/create').RequestHandler} */
export async function post({ locals, request }) {
	if (locals.user?.isAdmin) {
		const formData: FormData = await request.formData();

		const jurisdictionEntry = formData.get('jurisdiction');
		const startYearEntry = formData.get('startYear');
		const endYearEntry = formData.get('endYear');
		const imageUrlEntry = formData.get('imageUrl');

		if (!jurisdictionEntry) {
			return {
				status: 400,
				body: { error: `jurisdiction not provided` }
			};
		}

		const data = {
			jurisdiction: { connect: { abbreviation: jurisdictionEntry.toString() } },
			startYear: startYearEntry ? parseInt(startYearEntry.toString()) : null,
			endYear: endYearEntry ? parseInt(endYearEntry.toString()) : null,
			images: imageUrlEntry
				? {
						create: [{ url: imageUrlEntry.toString() }]
				  }
				: undefined
		};

		const response = await fetch('/api/plates', {
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});

		const plate: Plate = await response.json();

		// redirect to the newly created plate
		return {
			status: 303,
			headers: {
				location: `/plates/${plate.id}/edit`
			}
		};
	} else {
		return {
			status: 403,
			body: { error: `not admin` }
		};
	}
}
