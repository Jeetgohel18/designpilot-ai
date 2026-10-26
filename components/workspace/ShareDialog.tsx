"use client";
import { useState } from "react";
import { Button, CopyButton, Dialog, Notice, useToast } from "../ui";
import type { Share } from "@/lib/types";
import type { Snapshot } from "@/lib/server/shareSchema";

type Props = { open: boolean; onClose: () => void; title: string; kind: "project" | "moodboard"; share?: Share; onChange: (s: Share | undefined) => void; buildSnapshot: () => Snapshot };

export function ShareDialog({ open, onClose, title, kind, share, onChange, buildSnapshot }: Props) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = share ? `${typeof window !== "undefined" ? window.location.origin : ""}/s/${share.token}` : "";

  async function call<T>(fn: () => Promise<Response>, ok: (d: T) => void) {
    setBusy(true); setError(null);
    try {
      const res = await fn();
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? `Request failed (${res.status})`);
      ok(d as T);
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); } finally { setBusy(false); }
  }

  const create = () => call<{ token: string; ownerKey: string }>(
    () => fetch("/api/share", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, snapshot: buildSnapshot() }) }),
    (d) => { onChange({ token: d.token, ownerKey: d.ownerKey, enabled: true, kind, createdAt: Date.now() }); toast("Share link created"); });
  const toggle = (enabled: boolean) => share && call<{ enabled: boolean }>(
    () => fetch(`/api/share/${share.token}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ownerKey: share.ownerKey, enabled }) }),
    (d) => { onChange({ ...share, enabled: d.enabled }); toast(d.enabled ? "Public access enabled" : "Public access disabled"); });
  const refresh = () => share && call(
    () => fetch(`/api/share/${share.token}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ownerKey: share.ownerKey, snapshot: buildSnapshot() }) }),
    () => toast("Shared page updated with your latest changes"));
  const remove = () => share && call(
    () => fetch(`/api/share/${share.token}`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ ownerKey: share.ownerKey }) }),
    () => { onChange(undefined); toast("Share link deleted"); });

  const status = !share ? { label: "Private", sub: "Only you can see this. It is stored in this browser only.", dot: "bg-faint" } : share.enabled ? { label: "Public — read-only", sub: "Anyone with the link can view a snapshot.", dot: "bg-emerald-400" } : { label: "Link disabled", sub: "The link exists but returns “not found” until you re-enable it.", dot: "bg-amber-400" };

  return (
    <Dialog open={open} onClose={onClose} title={title} wide>
      <div className="flex items-start gap-3 rounded-lg border border-line bg-elevated p-3">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${status.dot}`} />
        <div><p className="text-sm font-medium">{status.label}</p><p className="text-xs text-muted">{status.sub}</p></div>
      </div>
      {share && (
        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-muted" htmlFor="share-url">Share link</label>
          <div className="flex gap-2">
            <input id="share-url" readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="w-full rounded-lg border border-line-strong bg-elevated px-3 py-2 font-mono text-xs" />
            <CopyButton text={url} label="Copy link" what="Link" size="md" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => toggle(!share.enabled)} disabled={busy}>{share.enabled ? "Disable public access" : "Enable public access"}</Button>
            <Button size="sm" onClick={refresh} disabled={busy}>Update shared snapshot</Button>
            <a href={url} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="ghost">Preview ↗</Button></a>
            <Button size="sm" variant="danger" onClick={remove} disabled={busy}>Delete link</Button>
          </div>
        </div>
      )}
      {!share && <div className="mt-4"><Button variant="primary" onClick={create} disabled={busy}>{busy ? "Creating…" : "Create read-only link"}</Button></div>}
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
      <div className="mt-4"><Notice>A share link publishes a <strong>snapshot</strong> of this {kind}: name, brief, analysis, directions{kind === "project" ? " and moodboards" : " and this moodboard"}. Bookmarks, activity and other projects are never included. Only this browser holds the key to change or delete the link — clearing browser data means you can no longer manage it.</Notice></div>
    </Dialog>
  );
}
