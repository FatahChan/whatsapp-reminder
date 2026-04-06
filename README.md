# WhatsApp Reminder

Desktop app for **scheduled WhatsApp messages** (daily at a set local time). Built with [Electrobun](https://electrobun.dev/) (Bun + system webview), React, Tailwind, and [shadcn/ui](https://ui.shadcn.com/) (Base UI preset). Uses [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js) with a warm session and local JSON storage.

## Features

- **Tray** — keep running while the window is closed (`exitOnLastWindowClosed: false`).
- **Reminders** — phone (international digits), time `HH:mm`, message; enable/disable, edit, test send.
- **Scheduler** — `node-cron` in the Bun process (no OS task scheduler).
- **QR in the UI** — login via WhatsApp “Linked devices”.

## Prerequisites

- **[Bun](https://bun.sh)** ≥ 1.0
- **Google Chrome** (or Chromium) on the machine — used by WhatsApp Web via Puppeteer. Optional env: `WHATSAPP_CHROME_PATH` / `chrome.exe` path if not auto-detected.
- **Windows 11+** or **Ubuntu 22.04+** (GTK/WebKit stack for Electrobun on Linux).

Tags for releases (used by CI):

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Local development

```bash
bun install
bun dev
```

This starts Vite on `127.0.0.1:5173` and Electrobun. **Use the desktop window** Electrobun opens — not a normal browser tab on :5173 — so the RPC bridge and WhatsApp integration work.

## Build locally (Vite + Electrobun)

```bash
bun run bundle
```

Equivalent to:

```bash
bun run build:web      # Vite → dist/
bun run build:desktop  # electrobun build --env=canary
```

Outputs go under `build/` and `artifacts/` (ignored by git).

## Data on disk

- **Reminders:** `%USERPROFILE%\.whatsapp-reminder-desktop\reminders.json` (Windows) or `~/.whatsapp-reminder-desktop/` (Linux/macOS).
- **WhatsApp session:** `.wwebjs_auth` under the same folder.

## GitHub Actions — release builds

Workflow: [`.github/workflows/release.yml`](.github/workflows/release.yml).

- **On push of a tag **`v*`** (e.g. `v0.2.0`):** builds **Windows** and **Linux** bundles in parallel, then creates a **GitHub Release** and uploads everything under `artifacts/` from each run.
- **Manual “Run workflow”:** runs the same builds and uploads **workflow artifacts** (no release unless you also tagged).

Linux runners install the packages Electrobun expects (GTK/WebKit). Windows uses the default `windows-latest` image.

If a build fails (timeouts, disk space, or missing system libs), check the job logs; Electrobun + CEF downloads are large.

## Project layout

```
src/
  bun/           # Electronbun main process: tray, RPC, scheduler, WhatsApp, lowdb
  mainview/      # React UI (Vite root)
  shared/        # Types + RPC schema shared by name only
electrobun.config.ts
vite.config.ts
```

## License

MIT (see `package.json` / your choice).
