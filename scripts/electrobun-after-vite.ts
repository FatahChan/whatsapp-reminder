import { connect } from "node:net";
import { join } from "node:path";

const projectRoot = join(import.meta.dir, "..");

/** Wait until something listens on port (Vite is up) then start Electrobun. */
function waitForPort(
	port: number,
	host = "127.0.0.1",
	timeoutMs = 60_000,
): Promise<void> {
	const deadline = Date.now() + timeoutMs;

	return new Promise((resolve, reject) => {
		const schedule = () => {
			if (Date.now() > deadline) {
				reject(new Error(`Timed out waiting for ${host}:${port} (start Vite first).`));
				return;
			}
			const socket = connect({ port, host }, () => {
				socket.end();
				resolve();
			});
			socket.on("error", () => {
				socket.destroy();
				setTimeout(schedule, 150);
			});
		};
		schedule();
	});
}

await waitForPort(5173);

const proc = Bun.spawn(["bunx", "electrobun", "dev", "--watch"], {
	cwd: projectRoot,
	stdout: "inherit",
	stderr: "inherit",
	stdin: "inherit",
});

const code = await proc.exited;
process.exit(code === 0 ? 0 : code);
