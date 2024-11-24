/// <reference types="@sveltejs/kit" />

import { KVNamespace } from '@sveltejs/adapter-cloudflare';

declare namespace App {
	interface SessionUser {
		id: number;
		email: string;
		serial: string;
		isAdmin: boolean;
	}

	interface Locals {
		sessionUser: SessionUser | null;
	}
	interface PageData {
		title: string;
		canonical: string;
		description: string;
	}
	interface Platform {
		env: {
			EMPORIUM_KV: KVNamespace;
		};
	}
}
