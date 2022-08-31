/// <reference types="@sveltejs/kit" />

interface UserCookie {
	id: number;
	email: string;
	serial: string;
	isAdmin: boolean;
}

declare namespace App {
	interface Locals {
		user: UserCookie;
	}
	// interface PageData {}
	// interface Platform {}
}
