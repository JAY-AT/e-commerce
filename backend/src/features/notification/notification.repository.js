import BaseModel from "../../common/model/orm/base.js";

export default class NotificationModel extends BaseModel {
  static table = "notifications";

  static publicFields = [
    "id",
    "user_id",
    "type",
    "message",
    "is_read",
    "created_at"
  ];

  // Trace point: findByUserId()
  static async findByUserId(userId, db = null) {
    const conn = db ?? this.pool;

    const [rows] = await conn.query(
      `
      SELECT ${this.publicFields.join(", ")}
      FROM ${this.table}
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return rows;
  }

  // Trace point: markAsRead()
  static async markAsRead(id, db = null) {
    const conn = db ?? this.pool;

    const [result] = await conn.query(
      `UPDATE ${this.table} SET is_read = TRUE WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) return null;

    return this.findById(id, conn);
  }

  // Trace point: markAllAsReadForUser()
  static async markAllAsReadForUser(userId, db = null) {
    const conn = db ?? this.pool;

    const [result] = await conn.query(
      `UPDATE ${this.table} SET is_read = TRUE WHERE user_id = ?`,
      [userId]
    );

    return result.affectedRows;
  }

  // Trace point: markAllAsReadForAdmin()
  static async markAllAsReadForAdmin(db = null) {
    const conn = db ?? this.pool;

    const [result] = await conn.query(
      `UPDATE ${this.table} SET is_read = TRUE WHERE target_role = 'admin'`
    );

    return result.affectedRows;
  }

  // Trace point: deleteAllForUser()
  static async deleteAllForUser(userId, db = null) {
    const conn = db ?? this.pool;

    const [result] = await conn.query(
      `DELETE FROM ${this.table} WHERE user_id = ?`,
      [userId]
    );

    return result.affectedRows;
  }

  // Trace point: deleteAllForAdmin()
  static async deleteAllForAdmin(db = null) {
    const conn = db ?? this.pool;

    const [result] = await conn.query(
      `DELETE FROM ${this.table} WHERE target_role = 'admin'`
    );

    return result.affectedRows;
  }

  // Trace point: findAdminNotifications()
  static async findAdminNotifications(db = null) {
  const conn = db ?? this.pool;

  const [rows] = await conn.query(
    `
    SELECT ${this.publicFields.join(", ")}, target_role
    FROM ${this.table}
    WHERE target_role = 'admin'
    ORDER BY created_at DESC
    `
  );

  return rows;
}
}
