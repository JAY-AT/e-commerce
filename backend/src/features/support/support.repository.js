import BaseModel from "../../common/model/orm/base.js";

const THREAD_COLUMNS = [
  "id",
  "user_id",
  "visitor_key",
  "user_name",
  "user_email",
  "status",
  "unread_count",
  "messages",
  "last_message_at",
  "created_at",
  "updated_at",
];

// Trace point: parseMessages()
const parseMessages = (messages) => {
  if (!messages) {
    return [];
  }

  if (Array.isArray(messages)) {
    return messages;
  }

  try {
    const parsed = JSON.parse(messages);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Trace point: normalizeThread()
const normalizeThread = (thread) => {
  if (!thread) {
    return null;
  }

  return {
    ...thread,
    unread_count: Number(thread.unread_count ?? 0),
    messages: parseMessages(thread.messages),
  };
};

// Trace point: serializeThread()
const serializeThread = (thread) => ({
  ...thread,
  messages: JSON.stringify(thread.messages ?? []),
});

// Trace point: buildWritableThread()
const buildWritableThread = (thread) => {
  const {
    id,
    created_at,
    updated_at,
    ...writable
  } = thread ?? {};

  return writable;
};

export default class SupportThreadModel extends BaseModel {
  static table = "support_threads";

  // Trace point: findAllThreads()
  static async findAllThreads(db = null) {
    const conn = db ?? this.pool;

    const [rows] = await conn.query(
      `
      SELECT ${THREAD_COLUMNS.join(", ")}
      FROM ${this.table}
      ORDER BY last_message_at DESC, updated_at DESC
      `
    );

    return rows.map(normalizeThread);
  }

  // Trace point: findByUserId()
  static async findByUserId(userId, db = null) {
    const conn = db ?? this.pool;

    const [rows] = await conn.query(
      `
      SELECT ${THREAD_COLUMNS.join(", ")}
      FROM ${this.table}
      WHERE user_id = ?
      LIMIT 1
      `,
      [userId]
    );

    return normalizeThread(rows[0]);
  }

  // Trace point: findByVisitorKey()
  static async findByVisitorKey(visitorKey, db = null) {
    const conn = db ?? this.pool;

    const [rows] = await conn.query(
      `
      SELECT ${THREAD_COLUMNS.join(", ")}
      FROM ${this.table}
      WHERE visitor_key = ?
      LIMIT 1
      `,
      [visitorKey]
    );

    return normalizeThread(rows[0]);
  }

  // Trace point: findThreadById()
  static async findThreadById(id, db = null) {
    const thread = await this.findById(id, db);
    return normalizeThread(thread);
  }

  // Trace point: createThread()
  static async createThread(data, db = null) {
    const conn = db ?? this.pool;
    const payload = serializeThread(buildWritableThread(data));
    const keys = Object.keys(payload);
    const values = Object.values(payload);

    const [result] = await conn.query(
      `INSERT INTO ${this.table} (${keys.join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`,
      values
    );

    return this.findThreadById(result.insertId, conn);
  }

  // Trace point: replaceThread()
  static async replaceThread(id, data, db = null) {
    const conn = db ?? this.pool;
    const payload = serializeThread(buildWritableThread(data));
    const keys = Object.keys(payload);

    if (keys.length === 0) {
      return this.findThreadById(id, conn);
    }

    const values = Object.values(payload);
    const setClause = keys.map((key) => `${key} = ?`).join(", ");

    const [result] = await conn.query(
      `UPDATE ${this.table} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, id]
    );

    if (result.affectedRows === 0) {
      return null;
    }

    return this.findThreadById(id, conn);
  }
}
