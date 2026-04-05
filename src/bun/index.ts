import { connect } from "node:net";
import { BrowserWindow, Updater } from "electrobun/bun";

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

/** Use Vite on loopback when channel is dev so HMR works; otherwise bundled views. */
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

// Create the main application window
const url = await getMainViewUrl();

new BrowserWindow({
	title: "React + Tailwind + Vite",
	url,
	frame: {
		width: 900,
		height: 700,
		x: 200,
		y: 200,
	},
});

console.log("React Tailwind Vite app started!");
