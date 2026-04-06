/**
 * Production pipeline: Vite (UI → dist/) then Electrobun (desktop bundle).
 * Run: bun run bundle
 */
import { join } from "node:path";

const root = join(import.meta.dir, "..");

function spawn(
	cmd: string[],
	label: string,
): Promise<number> {
	console.log(`\n[build-bundle] ${label}`);
	return new Promise((resolve) => {
		const proc = Bun.spawn(cmd, {
			cwd: root,
			stdout: "inherit",
			stderr: "inherit",
			env: process.env,
		});
		void proc.exited.then(resolve);
	});
}

const viteExit = await spawn(
	["bunx", "vite", "build"],
	"Vite: compile React views to dist/",
);
if (viteExit !== 0) {
	console.error(`[build-bundle] Vite failed (exit ${viteExit}).`);
	process.exit(viteExit);
}

const ebExit = await spawn(
	["bunx", "electrobun", "build", "--env=canary"],
	"Electrobun: bundle Bun main process + copy views → build/ & artifacts/",
);
if (ebExit !== 0) {
	console.error(`[build-bundle] Electrobun failed (exit ${ebExit}).`);
	process.exit(ebExit);
}

console.log("\n[build-bundle] Done. See build/ and artifacts/ under the project root.");
