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
		kv_binding: Cloudflare.Env['KV'];
		db: import('#lib/server/database/index.js').DrizzleClient;
	}
	interface PageData {
		title: string;
		canonical: string;
		description: string;
	}
}

// The bindings of wrangler.jsonc. Generated `wrangler types` add about 600 KB of
// workerd runtime types, which merge with the DOM types, so the bindings are
// typed here from the module form of @cloudflare/workers-types.
declare namespace Cloudflare {
	interface Env {
		DB: import('@cloudflare/workers-types').D1Database;
		KV: import('@cloudflare/workers-types').KVNamespace;
	}
}

declare module 'cloudflare:workers' {
	export const env: Cloudflare.Env;
}
