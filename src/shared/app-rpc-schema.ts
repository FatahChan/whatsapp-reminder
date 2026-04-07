import type { RPCSchema } from "electrobun/bun";
import type { Reminder, ReminderInput, WaState } from "./types";

/**
 * Bun handles `bun.requests` (webview RPC calls).
 * Bun → webview one-way messages use keys under `webview.messages`.
 */
export type AppRPCSchema = {
	bun: RPCSchema<{
		requests: {
			listReminders: { params: void; response: Reminder[] };
			upsertReminder: { params: ReminderInput; response: Reminder };
			deleteReminder: { params: { id: number }; response: null };
			toggleReminder: { params: { id: number; enabled: boolean }; response: null };
			sendTestNow: { params: { id: number }; response: { ok: boolean; error?: string } };
			getWhatsAppState: { params: void; response: WaState };
		};
		messages: Record<string, never>;
	}>;
	webview: RPCSchema<{
		requests: Record<string, never>;
		messages: {
			qr: string;
			waStatus: WaState;
			remindersUpdated: Reminder[];
		};
	}>;
};
