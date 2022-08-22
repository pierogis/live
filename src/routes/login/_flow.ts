export enum FlowCode {
	Default = 0,
	NoEmail = 1,
	Generated = 2,
	BadPassphrase = 3,
	BadEmail = 4,
	SignedIn = 5
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
		message: 'generate a 2 minute passphrase'
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
		message: `2 minute passphrase emailed`
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
