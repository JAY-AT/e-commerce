import BaseModel from "../../common/model/orm/base.js";

export default class ProductRepository extends BaseModel {
  static table = "products";

  // Trace point: findByName()
  static async findByName(name, db = null) {
    const conn = db ?? this.pool;

    const [rows] = await conn.query(
      `SELECT * FROM ${this.table} WHERE name = ? LIMIT 1`,
      [name]
    );

    return rows[0] ?? null;
  }

  // Trace point: findByNameExceptId()
  static async findByNameExceptId(name, id, db = null) {
    const conn = db ?? this.pool;

    const [rows] = await conn.query(
      `SELECT * FROM ${this.table} WHERE name = ? AND id <> ? LIMIT 1`,
      [name, id]
    );

    return rows[0] ?? null;
  }

  // Trace point: update()
  static async update(id, data) {
    const allowedFields = ["name", "description", "price", "stock", "category_id"];
    const fields = allowedFields.filter((field) => Object.prototype.hasOwnProperty.call(data, field));

    if (!fields.length) {
      throw new Error("No editable product fields provided");
    }

    const values = fields.map((field) => data[field]);
    const [result] = await this.pool.query(
      `UPDATE ${this.table}
       SET ${fields.map((field) => `${field} = ?`).join(", ")}
       WHERE id = ?`,
      [...values, id]
    );

    return this.findById(id);
  }

  // Trace point: findStocksForUpdate()
  static async findStocksForUpdate(productIds, db = null) {
    if (!productIds.length) return [];

    const conn = db ?? this.pool;
    const placeholders = productIds.map(() => "?").join(",");

    const [rows] = await conn.query(
      `SELECT id, name, stock
       FROM ${this.table}
       WHERE id IN (${placeholders})
       FOR UPDATE`,
      productIds
    );

    return rows;
  }

  // Trace point: decrementStock()
  static async decrementStock(productId, quantity, db = null) {
    const conn = db ?? this.pool;

    const [result] = await conn.query(
      `UPDATE ${this.table}
       SET stock = stock - ?
       WHERE id = ? AND stock >= ?`,
      [quantity, productId, quantity]
    );

    return result.affectedRows > 0;
  }


  // Trace point: findFullById()
  static async findFullById(id) {
        const [rows] = await this.pool.query(
            `SELECT 
                p.id AS product_id,
                p.name,
                p.description,
                p.price,
                p.stock,
                p.category_id,
                p.created_at,
                p.updated_at,

                c.id,
                c.name,
                c.slug,

                pi.id AS image_id,
                pi.image_url
            FROM products p
            LEFT JOIN product_images pi ON pi.product_id = p.id
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.id = ?`,
            [id]
        );

        return rows; 
    }

  // Trace point: findAllFull()
  static async findAllFull() {
        const [rows] = await this.pool.query(
            `SELECT 
                p.id AS product_id,
                p.name,
                p.description,
                p.price,
                p.stock,
                p.category_id,
                c.name AS category_name,
                pi.id AS image_id,
                pi.image_url
            FROM products p
            LEFT JOIN product_images pi ON pi.product_id = p.id
            LEFT JOIN categories c ON c.id = p.category_id`
        );

        return rows;
    }
}
