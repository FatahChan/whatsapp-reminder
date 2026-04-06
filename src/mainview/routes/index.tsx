import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { isElectrobunWebview, rpc, setRpcListeners } from '@/lib/rpc'
import type { Reminder, WaState } from '../../shared/types'

export const Route = createFileRoute('/')({
  component: Index,
})

function jidToDigits(jid: string): string {
  return jid.replace(/@c\.us$/i, '').replace(/\D/g, '')
}

function waStatusLabel(s: WaState): string {
  switch (s.state) {
    case 'disconnected':
      return 'Disconnected'
    case 'initializing':
      return 'Starting…'
    case 'qr':
      return 'Scan QR'
    case 'authenticated':
      return 'Authenticated…'
    case 'ready':
      return 'Connected'
    case 'auth_failure':
      return s.detail ? `Auth failed: ${s.detail}` : 'Auth failed'
    default:
      return String((s as WaState).state)
  }
}

function Index() {
  const rpcReady = isElectrobunWebview()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [wa, setWa] = useState<WaState>({ state: 'disconnected' })
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [phoneDigits, setPhoneDigits] = useState('')
  const [time, setTime] = useState('09:00')
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isElectrobunWebview()) return
    const list = await rpc.request.listReminders(undefined as void)
    setReminders(list)
    setWa(await rpc.request.getWhatsAppState(undefined as void))
  }, [])

  useEffect(() => {
    setRpcListeners({
      onQr: (url) => setQrDataUrl(url),
      onWaStatus: (s) => {
        setWa(s)
        if (s.state !== 'qr') setQrDataUrl(null)
      },
      onReminders: (list) => setReminders(list),
    })
    if (rpcReady) void refresh()
    return () => {
      setRpcListeners({
        onQr: () => {},
        onWaStatus: () => {},
        onReminders: () => {},
      })
    }
  }, [refresh, rpcReady])

  async function handleSave() {
    setError(null)
    if (!rpcReady) {
      setError('Not connected to the desktop host. Use the window opened by Electrobun, not a browser tab on :5173.')
      return
    }
    setSaving(true)
    try {
      const digits = phoneDigits.replace(/\D/g, '')
      if (!digits) {
        setError('Enter a phone number (digits only, country code included).')
        return
      }
      await rpc.request.upsertReminder({
        id: editingId ?? undefined,
        phoneDigits: digits,
        time,
        message: message.trim() || 'Reminder',
        enabled: true,
      })
      setPhoneDigits('')
      setTime('09:00')
      setMessage('')
      setEditingId(null)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  function startEdit(r: Reminder) {
    setEditingId(r.id)
    setPhoneDigits(jidToDigits(r.target))
    setTime(r.time)
    setMessage(r.message)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {!rpcReady ? (
        <div
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-950 text-sm dark:bg-amber-500/15 dark:text-amber-100"
          role="status"
        >
          Preview mode: this page is open in a normal browser, so the Electrobun RPC bridge is not available.
          Use the <strong>desktop window</strong> launched by <code className="rounded bg-black/10 px-1 py-0.5">bun dev</code> to
          manage reminders and WhatsApp.
        </div>
      ) : null}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">WhatsApp Reminders</h1>
        <p className="text-muted-foreground text-sm">
          Daily messages at a fixed local time. Keep this app running (tray) so the scheduler can fire.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">WhatsApp</CardTitle>
          <CardDescription>Link your account once; the session is stored on this machine.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">Status:</span>
            <Badge variant="secondary">{waStatusLabel(wa)}</Badge>
          </div>
          {wa.state === 'qr' && qrDataUrl ? (
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm">Scan with WhatsApp on your phone (Linked devices).</p>
              <img src={qrDataUrl} alt="WhatsApp QR" className="rounded-md border bg-white p-2" />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{editingId != null ? `Edit reminder #${editingId}` : 'New reminder'}</CardTitle>
          <CardDescription>Phone number without + (include country code). Time is local (24h).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="e.g. 14155552671"
                value={phoneDigits}
                disabled={!rpcReady}
                onChange={(e) => setPhoneDigits(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time (HH:mm)</Label>
              <Input
                id="time"
                type="time"
                value={time}
                disabled={!rpcReady}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="msg">Message</Label>
            <Textarea
              id="msg"
              rows={3}
              placeholder="Message to send"
              value={message}
              disabled={!rpcReady}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={!rpcReady || saving} onClick={() => void handleSave()}>
              {saving ? 'Saving…' : editingId != null ? 'Update' : 'Add reminder'}
            </Button>
            {editingId != null ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null)
                  setPhoneDigits('')
                  setTime('09:00')
                  setMessage('')
                  setError(null)
                }}
              >
                Cancel edit
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Scheduled reminders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="w-[90px]">On</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reminders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground h-16 text-center">
                    No reminders yet.
                  </TableCell>
                </TableRow>
              ) : (
                reminders.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell className="max-w-[140px] truncate font-mono text-xs">{r.target}</TableCell>
                    <TableCell>{r.time}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{r.message}</TableCell>
                    <TableCell>
                      <Switch
                        checked={r.enabled}
                        disabled={!rpcReady}
                        onCheckedChange={async (checked) => {
                          if (!rpcReady) return
                          await rpc.request.toggleReminder({ id: r.id, enabled: checked })
                          await refresh()
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          disabled={!rpcReady}
                          onClick={() => startEdit(r)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          disabled={!rpcReady}
                          onClick={async () => {
                            if (!rpcReady) return
                            const res = await rpc.request.sendTestNow({ id: r.id })
                            if (!res.ok) setError(res.error ?? 'Send failed')
                            else setError(null)
                          }}
                        >
                          Test
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          type="button"
                          disabled={!rpcReady}
                          onClick={async () => {
                            if (!rpcReady) return
                            await rpc.request.deleteReminder({ id: r.id })
                            await refresh()
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
