import { connect } from "node:net";
import {
	BrowserWindow,
	BrowserView,
	Tray,
	Utils,
	Updater,
} from "electrobun/bun";
import type { AppRPCSchema } from "../shared/app-rpc-schema";
import type { Reminder, ReminderInput } from "../shared/types";
import {
	initRemindersStore,
	listReminders,
	upsertReminder,
	deleteReminder,
	setReminderEnabled,
} from "./reminders-store";
import { rescheduleAll } from "./scheduler";
import {
	getWaState,
	onWaStateChange,
	onQrCode,
	startWhatsAppClient,
	sendWhatsAppMessage,
	getLastQrDataUrl,
} from "./whatsapp-engine";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_HOST = "127.0.0.1";
const DEV_SERVER_URL = `http://${DEV_SERVER_HOST}:${DEV_SERVER_PORT}`;

function waitForDevServerPort(
	opts: { attempts?: number; delayMs?: number } = {},
): Promise<boolean> {
	const attempts = opts.attempts ?? 80;
	const delayMs = opts.delayMs ?? 200;

	return new Promise((resolve) => {
		let n = 0;
		const tryOnce = () => {
			const socket = connect(
				{ port: DEV_SERVER_PORT, host: DEV_SERVER_HOST },
				() => {
					socket.end();
					resolve(true);
				},
			);
			socket.on("error", () => {
				socket.destroy();
				n++;
				if (n >= attempts) resolve(false);
				else setTimeout(tryOnce, delayMs);
			});
		};
		tryOnce();
	});
}

async function getMainViewUrl(): Promise<string> {
	const channel = await Updater.localInfo.channel();
	if (channel === "dev") {
		console.log("Waiting for Vite on 127.0.0.1:5173 (TCP)…");
		if (await waitForDevServerPort()) {
			console.log(`HMR: loading ${DEV_SERVER_URL}`);
			return DEV_SERVER_URL;
		}
		console.warn(
			"Vite not reachable on 127.0.0.1:5173 — using views:// (no HMR). Use `bun dev` so Vite starts before Electrobun.",
		);
	}
	return "views://mainview/index.html";
}

/** Active UI RPC for Bun → webview messages (cleared when window closes). */
let uiRpc: ReturnType<typeof BrowserView.defineRPC<AppRPCSchema>> | null =
	null;
let mainWindow: BrowserWindow | null = null;

function pushWaStatus() {
	uiRpc?.send.waStatus(getWaState());
}

function pushQr(dataUrl: string) {
	uiRpc?.send.qr(dataUrl);
}

function pushReminders(list: Reminder[]) {
	uiRpc?.send.remindersUpdated(list);
}

function rescheduleJobs() {
	rescheduleAll(listReminders(), async (r) => {
		try {
			await sendWhatsAppMessage(r.target, r.message);
		} catch (e) {
			console.error(`Scheduled send failed for reminder ${r.id}:`, e);
		}
	});
}

function createMainRpc() {
	return BrowserView.defineRPC<AppRPCSchema>({
		maxRequestTime: 120_000,
		handlers: {
			requests: {
				listReminders: (_params: unknown) => listReminders(),
				getWhatsAppState: (_params: unknown) => getWaState(),
				upsertReminder: async (params: unknown) => {
					const r = await upsertReminder(params as ReminderInput);
					rescheduleJobs();
					pushReminders(listReminders());
					return r;
				},
				deleteReminder: async (params: unknown) => {
					const { id } = params as { id: number };
					await deleteReminder(id);
					rescheduleJobs();
					pushReminders(listReminders());
					return null;
				},
				toggleReminder: async (params: unknown) => {
					const { id, enabled } = params as {
						id: number;
						enabled: boolean;
					};
					await setReminderEnabled(id, enabled);
					rescheduleJobs();
					pushReminders(listReminders());
					return null;
				},
				sendTestNow: async (params: unknown) => {
					const { id } = params as { id: number };
					const all = listReminders();
					const r = all.find((x) => x.id === id);
					if (!r) return { ok: false, error: "Reminder not found." };
					try {
						await sendWhatsAppMessage(r.target, r.message);
						return { ok: true };
					} catch (e) {
						return {
							ok: false,
							error: e instanceof Error ? e.message : String(e),
						};
					}
				},
			},
			messages: {},
		},
	});
}

function openMainWindow(url: string) {
	if (mainWindow) {
		mainWindow.focus();
		return;
	}

	const rpc = createMainRpc();
	uiRpc = rpc;

	const win = new BrowserWindow({
		title: "WhatsApp Reminders",
		url,
		rpc,
		frame: {
			width: 960,
			height: 780,
			x: 120,
			y: 80,
		},
	});

	mainWindow = win;

	win.on("close", () => {
		mainWindow = null;
		uiRpc = null;
	});

	pushWaStatus();
	pushReminders(listReminders());
	const pendingQr = getLastQrDataUrl();
	if (getWaState().state === "qr" && pendingQr) {
		pushQr(pendingQr);
	}
}

onWaStateChange(() => {
	pushWaStatus();
});

onQrCode((dataUrl) => {
	pushQr(dataUrl);
});

await initRemindersStore();
rescheduleJobs();

startWhatsAppClient().catch((e) => {
	console.error("WhatsApp failed to start:", e);
});

const url = await getMainViewUrl();
openMainWindow(url);

const tray = new Tray({
	title: "WhatsApp Reminders",
});

tray.setMenu([
	{ type: "normal", label: "Show window", action: "show" },
	{ type: "separator" },
	{ type: "normal", label: "Quit", action: "quit" },
]);

tray.on("tray-clicked", (e: unknown) => {
	const ev = e as { data?: { action?: string } };
	const action = ev.data?.action;
	if (action === "show") {
		void getMainViewUrl().then((u) => openMainWindow(u));
	}
	if (action === "quit") {
		Utils.quit();
	}
});

console.log("WhatsApp Reminders started.");
