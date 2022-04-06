export enum FlowCode {
	default = 0,
	noEmail = 1,
	generated = 2,
	badPassphrase = 3,
	badEmail = 4,
	signedIn = 5
}

export interface FlowStatus {
	alertState: boolean;
	emailState: boolean;
	passphraseState: boolean;
	message: string;
}

export const flowStatuses: { [code in FlowCode]: FlowStatus } = {
	0: {
		alertState: null,
		emailState: null,
		passphraseState: null,
		message: 'generate a 1 minute passphrase'
	},
	1: {
		alertState: false,
		emailState: false,
		passphraseState: null,
		message: 'email required'
	},
	2: {
		alertState: true,
		emailState: true,
		passphraseState: null,
		message: `1 minute passphrase emailed`
	},
	3: {
		alertState: false,
		emailState: true,
		passphraseState: false,
		message: `wrong passphrase`
	},
	4: {
		alertState: false,
		emailState: false,
		passphraseState: null,
		message: `wrong email`
	},
	5: {
		alertState: true,
		emailState: null,
		passphraseState: null,
		message: `signed in`
	}
};
