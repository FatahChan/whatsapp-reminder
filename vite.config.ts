import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
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
	},
	resolve: {
		tsconfigPaths: true,
	}
	
});
