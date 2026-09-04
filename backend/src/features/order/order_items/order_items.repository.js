import BaseModel from "../../../common/model/orm/base.js";

export default class OrderItemRepository extends BaseModel {
    static table = "order_items"

    // Trace point: createBulk()
    static async createBulk(orderId, items, conn=null) {
        if (!items.length) return;

        const values = items.map(item => [
        orderId,
        item.product_id,
        item.quantity,
        item.price
        ]);
        
        const db = conn ?? this.pool;
        const [rows] = await db.query(
            `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?`,
            [values]
        );

        return rows;
    }

    // Trace point: findByOrderId()
    static async findByOrderId(orderId) {
        const [rows] = await this.pool.query(
            `SELECT * FROM ${this.table} WHERE order_id = ?`,
            [orderId]
        );

        return rows;
    }

    // Trace point: deleteByOrderId()
    static async deleteByOrderId(orderId) {
        const [result] = await this.pool.query(
            `DELETE FROM ${this.table} WHERE order_id = ?`,
            [orderId]
        );

        return result;
    }
}