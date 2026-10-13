import { neon } from "@neondatabase/serverless";
import { Lead } from "./leads";
import { InboxItem } from "./quotes";

/**
 * Session-scoped storage. Backed by Postgres when DATABASE_URL is set, and by
 * an in-process Map otherwise, so the app runs locally and in preview without
 * a database. The Map is per-instance and clears on redeploy — acceptable only
 * as the no-database fallback.
 */

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  ownerApproved?: boolean;
  ts: number;
}

export interface SessionRecord {
  sessionId: string;
  bizId: string;
  mode: "product" | "service";
  messages: StoredMessage[];
  lead: Lead;
  inbox: InboxItem[];
  updatedAt: number;
}

export interface Store {
  getSession(sessionId: string, bizId: string): Promise<SessionRecord | null>;
  saveSession(rec: SessionRecord): Promise<void>;
  /** Every session for a business — this is what the owner sidebar lists. */
  listSessions(bizId: string): Promise<SessionRecord[]>;
  /**
   * Cheap change watermark: latest updated_at plus a row count, so the live
   * stream can tell whether anything moved without fetching every session.
   */
  watermark(bizId: string): Promise<string>;
}

// ── In-memory fallback ────────────────────────────────────────────────────────

const mem = new Map<string, SessionRecord>();
const key = (sessionId: string, bizId: string) => `${bizId}:${sessionId}`;

const memoryStore: Store = {
  async getSession(sessionId, bizId) {
    return mem.get(key(sessionId, bizId)) ?? null;
  },
  async saveSession(rec) {
    mem.set(key(rec.sessionId, rec.bizId), rec);
  },
  async listSessions(bizId) {
    return [...mem.values()]
      .filter(r => r.bizId === bizId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
  async watermark(bizId) {
    const rows = [...mem.values()].filter(r => r.bizId === bizId);
    const latest = rows.reduce((max, r) => Math.max(max, r.updatedAt), 0);
    return `${rows.length}:${latest}`;
  },
};

// ── Postgres ──────────────────────────────────────────────────────────────────

let pgStore: Store | null = null;
let schemaReady: Promise<void> | null = null;

function getPgStore(): Store {
  if (pgStore) return pgStore;

  const sql = neon(process.env.DATABASE_URL!);

  const ensureSchema = () => {
    if (!schemaReady) {
      schemaReady = (async () => {
        await sql`
          CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT NOT NULL,
            biz_id     TEXT NOT NULL,
            mode       TEXT NOT NULL,
            messages   JSONB NOT NULL DEFAULT '[]',
            lead       JSONB NOT NULL DEFAULT '{}',
            inbox      JSONB NOT NULL DEFAULT '[]',
            updated_at BIGINT NOT NULL,
            PRIMARY KEY (session_id, biz_id)
          )`;
        await sql`CREATE INDEX IF NOT EXISTS sessions_biz_updated ON sessions (biz_id, updated_at DESC)`;
      })();
    }
    return schemaReady;
  };

  type Row = {
    session_id: string; biz_id: string; mode: "product" | "service";
    messages: StoredMessage[]; lead: Lead; inbox: InboxItem[]; updated_at: string | number;
  };

  const toRecord = (r: Row): SessionRecord => ({
    sessionId: r.session_id,
    bizId: r.biz_id,
    mode: r.mode,
    messages: r.messages ?? [],
    lead: r.lead as Lead,
    inbox: r.inbox ?? [],
    updatedAt: Number(r.updated_at),
  });

  pgStore = {
    async getSession(sessionId, bizId) {
      await ensureSchema();
      const rows = (await sql`
        SELECT * FROM sessions WHERE session_id = ${sessionId} AND biz_id = ${bizId}
      `) as Row[];
      return rows[0] ? toRecord(rows[0]) : null;
    },

    async saveSession(rec) {
      await ensureSchema();
      await sql`
        INSERT INTO sessions (session_id, biz_id, mode, messages, lead, inbox, updated_at)
        VALUES (${rec.sessionId}, ${rec.bizId}, ${rec.mode},
                ${JSON.stringify(rec.messages)}::jsonb,
                ${JSON.stringify(rec.lead)}::jsonb,
                ${JSON.stringify(rec.inbox)}::jsonb,
                ${rec.updatedAt})
        ON CONFLICT (session_id, biz_id) DO UPDATE SET
          messages   = EXCLUDED.messages,
          lead       = EXCLUDED.lead,
          inbox      = EXCLUDED.inbox,
          updated_at = EXCLUDED.updated_at
      `;
    },

    async listSessions(bizId) {
      await ensureSchema();
      const rows = (await sql`
        SELECT * FROM sessions WHERE biz_id = ${bizId}
        ORDER BY updated_at DESC LIMIT 50
      `) as Row[];
      return rows.map(toRecord);
    },

    async watermark(bizId) {
      await ensureSchema();
      const rows = (await sql`
        SELECT COUNT(*)::int AS n, COALESCE(MAX(updated_at), 0) AS latest
        FROM sessions WHERE biz_id = ${bizId}
      `) as { n: number; latest: string | number }[];
      const r = rows[0];
      return `${r?.n ?? 0}:${Number(r?.latest ?? 0)}`;
    },
  };

  return pgStore;
}

export function getStore(): Store {
  return process.env.DATABASE_URL ? getPgStore() : memoryStore;
}

export const storeBackend = () => (process.env.DATABASE_URL ? "postgres" : "memory");
