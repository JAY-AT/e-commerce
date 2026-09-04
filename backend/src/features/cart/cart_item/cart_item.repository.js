import BaseModel from "../../../common/model/orm/base.js";

export default class CartItemRepository extends BaseModel {
    static table = "cart_items";

    // Trace point: findByCartId()
    static async findByCartId(id) {
        const [rows] = await this.pool.query(
            `SELECT * FROM ${this.table} WHERE cart_id = ?`,
            [id]
        );
        return rows;
    }

    // Trace point: findItemByCartId()
    static async findItemByCartId(cartId, productId) {
        const [rows] = await this.pool.query(
            `SELECT * FROM ${this.table} WHERE cart_id = ? AND product_id = ?`,
            [cartId, productId]
        );
        return rows[0];
    }

    // Trace point: deleteByCartId()
    static async deleteByCartId(cartId, db = null) {
        const conn = db ?? this.pool;
        const [result] = await conn.query(
            `DELETE FROM ${this.table} WHERE cart_id = ?`,
            [cartId]
        );

        return result.affectedRows > 0;
    }

    // Trace point: deleteItemByCartId()
    static async deleteItemByCartId(cartId, productId) {
        const [result] = await this.pool.query(
            `DELETE FROM ${this.table} WHERE cart_id = ? AND product_id = ?`,
            [cartId, productId]
        );

        return result.affectedRows > 0;
    }

    // Trace point: updateItemQuantityByCartId()
    static async updateItemQuantityByCartId(cartId, productId, quantity) {
        const [result] = await this.pool.query(
            `UPDATE ${this.table} SET quantity = ? WHERE cart_id = ? AND product_id = ?`,
            [quantity, cartId, productId]
        );

        return result;
    }
}
