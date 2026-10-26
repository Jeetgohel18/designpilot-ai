import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Snapshot } from "./shareSchema";

// File-backed store: works on a normal server/VPS/local machine. On serverless hosts (e.g. Vercel) the
// filesystem is ephemeral — switch this module to Supabase/Postgres before going live (see README).
interface Row { ownerHash: string; enabled: boolean; kind: "project" | "moodboard"; snapshot: Snapshot; createdAt: number; updatedAt: number }

const dir = () => process.env.SHARE_DATA_DIR || path.join(process.cwd(), ".data");
const file = () => path.join(dir(), "shares.json");
let chain: Promise<unknown> = Promise.resolve();

async function load(): Promise<Record<string, Row>> {
  try { return JSON.parse(await readFile(file(), "utf8")); } catch { return {}; }
}
async function save(db: Record<string, Row>) {
  await mkdir(dir(), { recursive: true });
  const tmp = file() + "." + process.pid + ".tmp";
  await writeFile(tmp, JSON.stringify(db));
  await rename(tmp, file());
}
/** Serialise read-modify-write cycles so concurrent requests don't clobber each other. */
function tx<T>(fn: (db: Record<string, Row>) => Promise<T> | T): Promise<T> {
  const run = chain.then(async () => { const db = await load(); const out = await fn(db); await save(db); return out; });
  chain = run.catch(() => undefined);
  return run;
}

const hash = (k: string) => createHash("sha256").update(k).digest();
const ownerOk = (row: Row, key: string) => { const a = Buffer.from(row.ownerHash, "hex"), b = hash(key); return a.length === b.length && timingSafeEqual(a, b); };

export async function createShare(kind: Row["kind"], snapshot: Snapshot) {
  const token = randomBytes(12).toString("base64url");
  const ownerKey = randomBytes(24).toString("base64url");
  const now = Date.now();
  await tx((db) => { db[token] = { ownerHash: hash(ownerKey).toString("hex"), enabled: true, kind, snapshot, createdAt: now, updatedAt: now }; });
  return { token, ownerKey };
}

/** Public read: only returns data when sharing is enabled. Disabled/missing are indistinguishable. */
export async function readShare(token: string) {
  const row = (await load())[token];
  return row && row.enabled ? { kind: row.kind, snapshot: row.snapshot, updatedAt: row.updatedAt } : null;
}

export type Mutation = { ok: true; enabled: boolean } | { ok: false; status: 403 | 404 };
export async function updateShare(token: string, ownerKey: string, patch: { enabled?: boolean; snapshot?: Snapshot }): Promise<Mutation> {
  return tx((db) => {
    const row = db[token];
    if (!row) return { ok: false, status: 404 } as const;
    if (!ownerOk(row, ownerKey)) return { ok: false, status: 403 } as const;
    if (patch.enabled !== undefined) row.enabled = patch.enabled;
    if (patch.snapshot) row.snapshot = patch.snapshot;
    row.updatedAt = Date.now();
    return { ok: true, enabled: row.enabled } as const;
  });
}

export async function deleteShare(token: string, ownerKey: string): Promise<Mutation> {
  return tx((db) => {
    const row = db[token];
    if (!row) return { ok: false, status: 404 } as const;
    if (!ownerOk(row, ownerKey)) return { ok: false, status: 403 } as const;
    delete db[token];
    return { ok: true, enabled: false } as const;
  });
}
