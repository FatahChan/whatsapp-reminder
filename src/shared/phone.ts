/** Normalize user input to digits only (international, no leading +). */
export function normalizePhoneDigits(raw: string): string {
	return raw.replace(/\D/g, "");
}

/** Build WhatsApp Web JID from digits. */
export function digitsToJid(digits: string): string {
	const d = normalizePhoneDigits(digits);
	if (!d) throw new Error("Phone number is empty.");
	return `${d}@c.us`;
}
