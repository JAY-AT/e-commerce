import BaseModel from "../../common/model/orm/base.js";

export default class UserModel extends BaseModel {
  static table = "users";

  static publicFields = [
    "id",
    "first_name",
    "last_name",
    "phone",
    "email",
    "role",
    "created_at"
  ];

  // Trace point: findAllWithProfile()
  static async findAllWithProfile(db = null) {
    const conn = db ?? this.pool;

    const [rows] = await conn.query(
      `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.role,
        u.created_at,
        u.updated_at,
        a.address_line,
        a.city,
        a.state,
        a.postal_code
      FROM ${this.table} u
      LEFT JOIN addresses a ON a.user_id = u.id
      ORDER BY u.id ASC
      `
    );

    return rows;
  }

  // Trace point: findByIdWithProfile()
  static async findByIdWithProfile(id, db = null) {
    const conn = db ?? this.pool;

    const [rows] = await conn.query(
      `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.role,
        u.created_at,
        u.updated_at,
        a.address_line,
        a.city,
        a.state,
        a.postal_code
      FROM ${this.table} u
      LEFT JOIN addresses a ON a.user_id = u.id
      WHERE u.id = ?
      LIMIT 1
      `,
      [id]
    );

    return rows[0];
  }

  // Trace point: updateById()
  static async updateById(id, data, db = null) {
    const conn = db ?? this.pool;
    const keys = Object.keys(data);

    if (keys.length === 0) {
      return this.findByIdWithProfile(id, conn);
    }

    const values = Object.values(data);
    const setClause = keys.map(k => `${k} = ?`).join(", ");

    const [result] = await conn.query(
      `UPDATE ${this.table} SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    if (result.affectedRows === 0) {
      return null;
    }

    return this.findByIdWithProfile(id, conn);
  }
}
