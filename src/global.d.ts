interface ImportMetaEnv {}

import type { Jurisdiction, Plate, Score, User, Image } from '$lib/database/models';
import { knex } from 'knex';
import type { Knex } from 'knex';

declare module 'knex/types/tables' {
	interface Tables {
		// This is same as specifying `knex<User>('users')`
		users: Knex.CompositeTableType<User, Omit<User, 'id' | 'isAdmin'>, Partial<Omit<User, 'id'>>>;
		plates: Knex.CompositeTableType<Plate, Omit<Plate, 'id'>, Partial<Omit<Plate, 'id'>>>;
		jurisdictions: Knex.CompositeTableType<Jurisdiction, Jurisdiction, Partial<Omit<Plate, 'id'>>>;
		scores: Knex.CompositeTableType<Score, Score, Partial<Pick<Score, 'value' | 'description'>>>;
		images: Knex.CompositeTableType<Image, Omit<Image, 'id'>, Pick<Image, 'url'>>;
	}
}
