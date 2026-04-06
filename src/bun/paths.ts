import { homedir } from "node:os";
import { join } from "node:path";

/** Per-user app data (reminders DB + WhatsApp auth). */
export const USER_DATA_DIR = join(homedir(), ".whatsapp-reminder-desktop");

export const REMINDERS_FILE = join(USER_DATA_DIR, "reminders.json");

export const WWEBJS_AUTH_DIR = join(USER_DATA_DIR, ".wwebjs_auth");
