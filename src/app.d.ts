import type { User } from './lib/database/models';
/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/typescript
// for information about these interfaces
declare namespace App {
	interface Locals {}

	interface Platform {}

	interface Session {
		user: User;
	}

	interface Stuff {}
}
