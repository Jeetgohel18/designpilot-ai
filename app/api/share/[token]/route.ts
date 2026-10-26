import { z } from "zod";
import { deleteShare, readShare, updateShare } from "@/lib/server/shares";
import { snapshotSchema } from "@/lib/server/shareSchema";
import { rateLimit, tooMany } from "@/lib/server/ratelimit";

type Ctx = { params: Promise<{ token: string }> };
const validToken = (t: string) => /^[A-Za-z0-9_-]{8,40}$/.test(t);

export async function GET(req: Request, { params }: Ctx) {
  const { token } = await params;
  const rl = rateLimit(req, "share-read", 120);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const share = validToken(token) ? await readShare(token) : null;
  if (!share) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(share, { headers: { "Cache-Control": "no-store" } });
}

const patch = z.object({ ownerKey: z.string().min(10).max(100), enabled: z.boolean().optional(), snapshot: snapshotSchema.optional() });

export async function PATCH(req: Request, { params }: Ctx) {
  const { token } = await params;
  const rl = rateLimit(req, "share-write", 40);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const parsed = patch.safeParse(await req.json().catch(() => null));
  if (!validToken(token) || !parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const r = await updateShare(token, parsed.data.ownerKey, { enabled: parsed.data.enabled, snapshot: parsed.data.snapshot });
  if (!r.ok) return Response.json({ error: r.status === 403 ? "You don't own this share link" : "Not found" }, { status: r.status });
  return Response.json({ enabled: r.enabled });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { token } = await params;
  const rl = rateLimit(req, "share-write", 40);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const parsed = z.object({ ownerKey: z.string().min(10).max(100) }).safeParse(await req.json().catch(() => null));
  if (!validToken(token) || !parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const r = await deleteShare(token, parsed.data.ownerKey);
  if (!r.ok) return Response.json({ error: r.status === 403 ? "You don't own this share link" : "Not found" }, { status: r.status });
  return Response.json({ deleted: true });
}
