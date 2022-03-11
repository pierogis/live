export enum FlowCode {
	noEmail = 0,
	generated = 1,
	badPassphrase = 2,
	badEmail = 3,
	signedIn = 4
}

export interface FlowStatus {
	alertState: boolean;
	emailState: boolean;
	passphraseState: boolean;
	message: string;
}

export const flowStatuses: { [code in FlowCode]: FlowStatus } = {
	0: {
		alertState: false,
		emailState: false,
		passphraseState: null,
		message: 'email required'
	},
	1: {
		alertState: true,
		emailState: true,
		passphraseState: null,
		message: `1 minute passphrase emailed`
	},
	2: {
		alertState: false,
		emailState: true,
		passphraseState: false,
		message: `wrong passphrase`
	},
	3: {
		alertState: false,
		emailState: false,
		passphraseState: null,
		message: `wrong email`
	},
	4: {
		alertState: true,
		emailState: null,
		passphraseState: null,
		message: `signed in`
	}
};
