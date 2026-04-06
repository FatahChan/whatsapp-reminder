import nodeCron, { type ScheduledTask } from "node-cron";
import type { Reminder } from "../shared/types";

const tasks: ScheduledTask[] = [];

function clearAll(): void {
	for (const t of tasks) {
		t.stop();
	}
	tasks.length = 0;
}

/** Parse "HH:mm" into cron minute/hour (local time). */
function timeToCronParts(time: string): { minute: string; hour: string } | null {
	const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
	if (!m) return null;
	const hour = Number(m[1]);
	const minute = Number(m[2]);
	if (hour > 23 || minute > 59) return null;
	return { minute: String(minute), hour: String(hour) };
}

export function rescheduleAll(
	reminders: Reminder[],
	onTick: (reminder: Reminder) => void,
): void {
	clearAll();
	for (const r of reminders) {
		if (!r.enabled) continue;
		const parts = timeToCronParts(r.time);
		if (!parts) {
			console.warn(`Invalid time for reminder ${r.id}: ${r.time}`);
			continue;
		}
		const expression = `${parts.minute} ${parts.hour} * * *`;
		const task = nodeCron.schedule(expression, () => {
			onTick(r);
		});
		tasks.push(task);
	}
}
