import BaseModel from "../../common/model/orm/base.js";

export default class AddressRepository extends BaseModel {
  static table = "addresses";

  static publicFields = [
    "id",
    "user_id",
    "address_line",
    "city",
    "state",
    "postal_code",
    "created_at",
    "updated_at"
  ];

  // Trace point: findByUserId()
  static async findByUserId(userId, db = null) {
    const conn = db ?? this.pool;

    const [rows] = await conn.query(
      `SELECT * FROM ${this.table} WHERE user_id = ? LIMIT 1`,
      [userId]
    );

    return rows[0];
  }

  // Trace point: upsertByUserId()
  static async upsertByUserId(userId, data, db = null) {
    const conn = db ?? this.pool;
    const existing = await this.findByUserId(userId, conn);

    if (!existing) {
      const [result] = await conn.query(
        `
        INSERT INTO ${this.table} (user_id, address_line, city, state, postal_code)
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          userId,
          data.address_line ?? null,
          data.city ?? null,
          data.state ?? null,
          data.postal_code ?? null,
        ]
      );

      return result;
    }

    const [result] = await conn.query(
      `
      UPDATE ${this.table}
      SET address_line = ?,
          city = ?,
          state = ?,
          postal_code = ?
      WHERE user_id = ?
      `,
      [
        data.address_line ?? null,
        data.city ?? null,
        data.state ?? null,
        data.postal_code ?? null,
        userId,
      ]
    );

    return result;
  }
}
