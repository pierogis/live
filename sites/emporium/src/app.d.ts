/// <reference types="@sveltejs/kit" />

declare namespace App {
	interface SessionUser {
		id: number;
		email: string;
		serial: string;
		isAdmin: boolean;
	}

	interface Locals {
		sessionUser: SessionUser | null;
		kv_binding: KVNamespace;
		db: import('$lib/server/database').DrizzleClient;
	}
	interface PageData {
		title: string;
		canonical: string;
		description: string;
	}
	interface Platform {
		env: Cloudflare.Env;
		context: {
			waitUntil(promise: Promise<any>): void;
		};
		caches: CacheStorage & { default: Cache };
	}
}
