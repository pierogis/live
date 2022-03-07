/// <reference types="@sveltejs/kit" />

interface User {
	id: number;
	email: string;
	name: string;
}

// See https://kit.svelte.dev/docs/typescript
// for information about these interfaces
declare namespace App {
	interface Locals {
		userId?: number;
	}

	interface Platform {}

	interface Session {
		user?: User;
	}

	interface Stuff {}
}
