import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import type { Reminder } from "@shared/types";
import { REMINDERS_FILE, USER_DATA_DIR } from "@bun/paths";
import { digitsToJid } from "@shared/phone";
import type { ReminderInput } from "@shared/types";

type Data = { reminders: Reminder[] };

const defaultData: Data = { reminders: [] };

let db: Low<Data> | null = null;

export async function initRemindersStore(): Promise<void> {
	if (!existsSync(USER_DATA_DIR)) {
		await mkdir(USER_DATA_DIR, { recursive: true });
	}
	const adapter = new JSONFile<Data>(REMINDERS_FILE);
	db = new Low<Data>(adapter, defaultData);
	await db.read();
	if (!db.data) db.data = structuredClone(defaultData);
	await db.write();
}

function nextId(reminders: Reminder[]): number {
	const max = reminders.reduce((m, r) => Math.max(m, r.id), 0);
	return max + 1;
}

export function listReminders(): Reminder[] {
	if (!db?.data) return [];
	return [...db.data.reminders].sort((a, b) => a.id - b.id);
}

export async function upsertReminder(input: ReminderInput): Promise<Reminder> {
	if (!db?.data) throw new Error("Database not initialized.");
	const jid = digitsToJid(input.phoneDigits);
	const enabled = input.enabled ?? true;

	let reminder: Reminder;
	if (input.id != null) {
		const idx = db.data.reminders.findIndex((r) => r.id === input.id);
		if (idx === -1) throw new Error(`Reminder ${input.id} not found.`);
		reminder = {
			...db.data.reminders[idx],
			target: jid,
			time: input.time,
			message: input.message,
			enabled,
		};
		db.data.reminders[idx] = reminder;
	} else {
		reminder = {
			id: nextId(db.data.reminders),
			target: jid,
			time: input.time,
			message: input.message,
			enabled,
		};
		db.data.reminders.push(reminder);
	}
	await db.write();
	return reminder;
}

export async function deleteReminder(id: number): Promise<void> {
	if (!db?.data) throw new Error("Database not initialized.");
	const before = db.data.reminders.length;
	db.data.reminders = db.data.reminders.filter((r) => r.id !== id);
	if (db.data.reminders.length === before) {
		throw new Error(`Reminder ${id} not found.`);
	}
	await db.write();
}

export async function setReminderEnabled(id: number, enabled: boolean): Promise<void> {
	if (!db?.data) throw new Error("Database not initialized.");
	const r = db.data.reminders.find((x) => x.id === id);
	if (!r) throw new Error(`Reminder ${id} not found.`);
	r.enabled = enabled;
	await db.write();
}
