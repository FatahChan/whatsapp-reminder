import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "WhatsApp Reminders",
		identifier: "dev.electrobun.whatsapp-reminders",
		version: "0.1.0",
	},
	runtime: {
		exitOnLastWindowClosed: false,
	},
	build: {
		// Vite builds to dist/, we copy from there
		copy: {
			"dist/index.html": "views/mainview/index.html",
			"dist/assets": "views/mainview/assets",
		},
		// Ignore Vite output in watch mode — HMR handles view rebuilds separately
		watchIgnore: ["dist/**"],
		mac: {
			bundleCEF: true,
		},
		linux: {
			bundleCEF: true,
		},
		win: {
			bundleCEF: true,
		},
	},
} satisfies ElectrobunConfig;
