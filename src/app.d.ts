/// <reference types="@sveltejs/kit" />

interface SessionUser {
	id: number;
	email: string;
	serial: string;
	isAdmin: boolean;
}

declare namespace App {
	interface Locals {
		sessionUser: SessionUser | null;
	}
	// interface PageData {}
	// interface Platform {}
}
