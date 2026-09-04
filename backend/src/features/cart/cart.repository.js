import BaseModel from "../../common/model/orm/base.js";

export default class CartRepository extends BaseModel {
    static table = "carts";

    // Trace point: findFullByUserId()
    static async findFullByUserId(userId, db = null) {
        const conn = db ?? this.pool;
        const [rows] = await conn.query(
            `
            SELECT 
            c.id AS cart_id,
            c.user_id,
            c.created_at,

            ci.id AS cart_item_id,
            ci.product_id AS cart_item_product_id,
            ci.quantity,

            p.id AS product_id,
            p.name,
            p.price,
            p.description,
            p.stock,

            pi.image_url

            FROM carts c
            LEFT JOIN cart_items ci ON ci.cart_id = c.id
            LEFT JOIN products p ON p.id = ci.product_id
            LEFT JOIN product_images pi ON pi.product_id = p.id

            WHERE c.user_id = ?
            `,
            [userId]
        );

        return rows;
    }

    // Trace point: findCheckoutItemsByUserId()
    static async findCheckoutItemsByUserId(userId, db = null) {
        const conn = db ?? this.pool;
        const [rows] = await conn.query(
            `
            SELECT
            c.id AS cart_id,
            c.user_id,
            c.created_at,

            ci.id AS cart_item_id,
            ci.product_id AS cart_item_product_id,
            ci.quantity,

            p.id AS product_id,
            p.name,
            p.price,
            p.description,
            p.stock,

            NULL AS image_url

            FROM carts c
            INNER JOIN cart_items ci ON ci.cart_id = c.id
            INNER JOIN products p ON p.id = ci.product_id

            WHERE c.user_id = ?
            FOR UPDATE
            `,
            [userId]
        );

        return rows;
    }

    // Trace point: findByUserId()
    static async findByUserId(userId, db = null) {
        const conn = db ?? this.pool;
        const [rows] = await conn.query(
        `SELECT * FROM ${this.table} WHERE user_id = ?`,
        [userId]
        );
        return rows[0];
    }

    // Trace point: createForUser()
    static async createForUser(userId, db = null) {
        return this.create({ user_id: userId }, db);
    }
}
