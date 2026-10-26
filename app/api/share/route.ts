import { z } from "zod";
import { createShare } from "@/lib/server/shares";
import { snapshotSchema } from "@/lib/server/shareSchema";
import { rateLimit, tooMany } from "@/lib/server/ratelimit";

const body = z.object({ kind: z.enum(["project", "moodboard"]), snapshot: snapshotSchema });

export async function POST(req: Request) {
  const rl = rateLimit(req, "share-create", 20);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const raw = await req.text();
  if (raw.length > 400_000) return Response.json({ error: "Project is too large to share." }, { status: 413 });
  let json: unknown;
  try { json = JSON.parse(raw); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = body.safeParse(json);
  if (!parsed.success) return Response.json({ error: "Invalid project data", details: parsed.error.issues.slice(0, 3).map((i) => i.path.join(".") + ": " + i.message) }, { status: 400 });
  const { token, ownerKey } = await createShare(parsed.data.kind, parsed.data.snapshot);
  return Response.json({ token, ownerKey }, { status: 201 });
}
