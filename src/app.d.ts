/// <reference types="@sveltejs/kit" />

interface UserCookie {
	id: number;
	email: string;
	serial: string;
	isAdmin: boolean;
}

// See https://kit.svelte.dev/docs/typescript
// for information about these interfaces
declare namespace App {
	interface Locals {
		user: UserCookie;
	}

	// interface Platform {}

	interface Session {
		user?: UserCookie;
	}

	// interface Stuff {}
}
