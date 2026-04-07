import { Electroview } from "electrobun/view";
import type { AppRPCSchema } from "@shared/app-rpc-schema";
import type { Reminder, WaState } from "@shared/types";

type Listeners = {
	onQr: (dataUrl: string) => void;
	onWaStatus: (s: WaState) => void;
	onReminders: (list: Reminder[]) => void;
};

const listeners: Listeners = {
	onQr: () => {},
	onWaStatus: () => {},
	onReminders: () => {},
};

export function setRpcListeners(next: Partial<Listeners>) {
	Object.assign(listeners, next);
}

export const rpc = Electroview.defineRPC<AppRPCSchema>({
	handlers: {
		requests: {},
		messages: {
			qr: (payload) => {
				listeners.onQr(payload);
			},
			waStatus: (payload) => {
				listeners.onWaStatus(payload);
			},
			remindersUpdated: (payload) => {
				listeners.onReminders(payload);
			},
		},
	},
});

/** True only inside the Electrobun shell (preload sets these). False in a normal browser on :5173. */
export function isElectrobunWebview(): boolean {
	if (typeof window === "undefined") return false;
	const w = window as unknown as {
		__electrobunWebviewId?: number;
		__electrobunRpcSocketPort?: number;
	};
	return (
		typeof w.__electrobunWebviewId === "number" &&
		typeof w.__electrobunRpcSocketPort === "number"
	);
}

if (isElectrobunWebview()) {
	new Electroview({ rpc });
} else if (import.meta.env.DEV) {
	console.info(
		"[whatsapp-reminder] Opened outside Electrobun (e.g. Vite in a browser). RPC is inactive; use the desktop window from `bun dev` for full functionality.",
	);
}
