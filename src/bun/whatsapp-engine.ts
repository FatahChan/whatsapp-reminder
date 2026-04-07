import QRCode from "qrcode";
import pkg from "whatsapp-web.js";
import type { WaState } from "../shared/types";
import { WWEBJS_AUTH_DIR } from "./paths";

const { Client, LocalAuth } = pkg;

type Listener = (s: WaState) => void;

let client: InstanceType<typeof Client> | null = null;
let state: WaState = { state: "disconnected" };
let stateListener: Listener | null = null;
let qrListener: ((dataUrl: string) => void) | null = null;
let lastQrDataUrl: string | null = null;

function setState(next: WaState) {
	state = next;
	stateListener?.(next);
}

export function getWaState(): WaState {
	return state;
}

export function onWaStateChange(cb: Listener) {
	stateListener = cb;
	cb(state);
}

export function onQrCode(cb: (dataUrl: string) => void) {
	qrListener = cb;
}

function puppeteerOptions() {
	const executablePath =
		process.env.CHROME_PATH ||
		process.env.PUPPETEER_EXECUTABLE_PATH ||
		process.env.WHATSAPP_CHROME_PATH ||
		undefined;
	return {
		headless: true,
		...(executablePath ? { executablePath } : {}),
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-dev-shm-usage",
			"--disable-gpu",
		],
		protocolTimeout: 0,
	};
}

export async function startWhatsAppClient(): Promise<void> {
	if (client) return;

	setState({ state: "initializing" });
	const c = new Client({
		authStrategy: new LocalAuth({ dataPath: WWEBJS_AUTH_DIR }),
		authTimeoutMs: 0,
		puppeteer: puppeteerOptions(),
	});

	c.on("qr", async (qr: string) => {
		setState({ state: "qr" });
		const dataUrl = await QRCode.toDataURL(qr, { margin: 2, width: 256 });
		lastQrDataUrl = dataUrl;
		qrListener?.(dataUrl);
	});

	c.on("authenticated", () => {
		setState({ state: "authenticated" });
	});

	c.on("ready", () => {
		lastQrDataUrl = null;
		setState({ state: "ready" });
	});

	c.on("auth_failure", (msg: string) => {
		setState({ state: "auth_failure", detail: String(msg) });
	});

	c.on("disconnected", (reason: string) => {
		setState({ state: "disconnected" });
		console.warn("WhatsApp disconnected:", reason);
		client = null;
	});

	client = c;
	try {
		await c.initialize();
	} catch (e) {
		client = null;
		setState({
			state: "auth_failure",
			detail: e instanceof Error ? e.message : String(e),
		});
		throw e;
	}
}

export function getLastQrDataUrl(): string | null {
	return lastQrDataUrl;
}

export async function sendWhatsAppMessage(target: string, message: string): Promise<void> {
	if (!client) throw new Error("WhatsApp client is not running.");
	const st = getWaState();
	if (st.state !== "ready") {
		throw new Error(`WhatsApp is not ready (state: ${st.state}).`);
	}
	await client.sendMessage(target, message);
}
