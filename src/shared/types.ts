export type Reminder = {
	id: number;
	/** WhatsApp JID, e.g. 201555604177@c.us */
	target: string;
	/** Local time HH:mm (24h) */
	time: string;
	message: string;
	enabled: boolean;
};

export type ReminderInput = {
	id?: number;
	/** Digits only, country code included (no +) */
	phoneDigits: string;
	time: string;
	message: string;
	enabled?: boolean;
};

export type WaState =
	| { state: "disconnected" }
	| { state: "initializing" }
	| { state: "qr" }
	| { state: "authenticated" }
	| { state: "ready" }
	| { state: "auth_failure"; detail?: string };
