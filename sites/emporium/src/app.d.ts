import type { KVNamespace, D1Database } from '@cloudflare/workers-types';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { schema } from '$db';

declare global {
	namespace App {
		interface SessionUser {
			id: number;
			email: string;
			serial: string;
			isAdmin: boolean;
		}

		interface Locals {
			sessionUser: SessionUser | null;
			kv: KVNamespace;
			db: PostgresJsDatabase<typeof schema>;
		}
		interface PageData {
			title: string;
			canonical: string;
			description: string;
		}
		interface Platform {
			env: {
				KV: KVNamespace;
				DB: D1Database;
			};
			context: {
				waitUntil(promise: Promise<any>): void;
			};
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
