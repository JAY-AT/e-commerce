import BaseModel from "../../common/model/orm/base.js";

export default class RefreshTokenModel extends BaseModel {
  static table = "refresh_tokens";

  static publicFields = [
    "id",
    "user_id",
    "token_hash",
    "expires_at",
    "revoked_at",
    "created_at"
  ];

  // Trace point: findActiveByHash()
  static async findActiveByHash(tokenHash, db = null) {
    const conn = db ?? this.pool;

    const [rows] = await conn.query(
      `
      SELECT *
      FROM ${this.table}
      WHERE token_hash = ?
        AND revoked_at IS NULL
        AND expires_at > NOW()
      LIMIT 1 FOR UPDATE
      `,
      [tokenHash]
    );

    return rows[0];
  }

  // Trace point: revokeByHash()
  static async revokeByHash(tokenHash, conn = null) {
    const db = conn ?? this.pool;

    const [result] = await db.query(
      `
      UPDATE ${this.table}
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE token_hash = ?
        AND revoked_at IS NULL
      `,
      [tokenHash]
    );

    return result.affectedRows > 0;
  }

  // Trace point: revokeByUserId()
  static async revokeByUserId(userId, conn = null) {
    const db = conn ?? this.pool;

    const [result] = await db.query(
      `
      UPDATE ${this.table}
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
        AND revoked_at IS NULL
      `,
      [userId]
    );

    return result.affectedRows > 0;
  }
}
