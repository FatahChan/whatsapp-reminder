import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
	// Relative URLs so views:// (Electrobun) can load /assets chunks; absolute "/" breaks lazy devtools chunk.
	base: "./",
	plugins: [
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
			// Vite root is src/mainview; defaults use src/routes under root
			routesDirectory: "./routes",
			generatedRouteTree: "./routeTree.gen.ts",
		}),
		react(), tailwindcss()],
	root: "src/mainview",
	build: {
		outDir: "../../dist",
		emptyOutDir: true,
	},
	server: {
		port: 5173,
		strictPort: true,
		// Bind IPv4 so Bun + WebKit in Electrobun resolve the same host as wait / fetch probes.
		host: "127.0.0.1",
		hmr: {
			host: "127.0.0.1",
			protocol: "ws",
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src/mainview"),
		},
		tsconfigPaths: true,
	},
	
});
