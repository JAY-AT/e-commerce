import { getPool } from "../../../core/config/pool.js";
import { getSafe } from "../../utilities/sanitizer.js";

export default class BaseModel {
  static table = "";
  static publicFields = [];

  // Trace point: pool()
  static get pool() {
    return getPool();
  }

  // Trace point: findById()
  static async findById(id, db = null) {
    const conn = db ?? this.pool;
    const [rows] = await conn.query(
      `SELECT * FROM ${this.table} WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0];
  }

  // Trace point: findByIdSafe()
  static async findByIdSafe(id) {
    const data = await this.findById(id);
    return getSafe(data, this.publicFields);
  }

  // Trace point: findAll()
  static async findAll() {
    const [rows] = await this.pool.query(
      `SELECT * FROM ${this.table}`
    );
    return rows;
  }

  // Trace point: findAllSafe()
  static async findAllSafe() {
    const data = await this.findAll();
    return getSafe(data, this.publicFields);
  }

  // Trace point: create()
  static async create(data, conn = null) {
    const db = conn ?? this.pool;

    const keys = Object.keys(data);
    const values = Object.values(data);

    const [result] = await db.query(
      `INSERT INTO ${this.table} (${keys.join(",")})
       VALUES (${keys.map(() => "?").join(",")})`,
      values
    );

    return result;

  }

  // Trace point: bulkCreate()
  static async bulkCreate(data, conn = null) {
    const db = conn ?? this.pool;

  if (Array.isArray(data)) {
    if (data.length === 0) return null;

    const keys = Object.keys(data[0]);
    const placeholders = data
      .map(() => `(${keys.map(() => "?").join(",")})`)
      .join(",");
    
    const values = data.flatMap(obj => keys.map(k => obj[k]));

    const [result] = await db.query(
      `INSERT INTO ${this.table} (${keys.join(",")})
       VALUES ${placeholders}`,
      values
    );

    return result;
  }
  }

  // Trace point: update()
  static async update(id, data) {
    const keys = Object.keys(data);

    if (keys.length === 0) throw new Error("No fields provided");

    const values = Object.values(data);
    const setClause = keys.map(k => `${k} = ?`).join(", ");

    const [result] = await this.pool.query(
      `UPDATE ${this.table} SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    if (result.affectedRows === 0) return null;

    return this.findByIdSafe(id);
  }

  // Trace point: delete()
  static async delete(id, db = null) {
    const conn = db ?? this.pool;
    const [result] = await conn.query(
      `DELETE FROM ${this.table} WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }
}
