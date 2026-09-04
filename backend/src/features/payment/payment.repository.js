import BaseModel from "../../common/model/orm/base.js";

export default class PaymentsRepository extends BaseModel {
  static table = "payments";

  static publicFields = [
    "id",
    "order_id",
    "amount",
    "payment_method",
    "status",
    "transaction_id",
    "created_at"
  ];


  // FIND BY ORDER ID
  static async findByOrderId(orderId) {
    const [rows] = await this.pool.query(
      `SELECT * FROM ${this.table} WHERE order_id = ? LIMIT 1`,
      [orderId]
    );
    return rows[0];
  }

  // JOIN: Payment + Order details
  static async findFullById(paymentId) {
    const [rows] = await this.pool.query(
      `
      SELECT 
        p.id AS payment_id,
        p.order_id,
        p.amount,
        p.payment_method,
        p.status AS payment_status,
        p.transaction_id,
        p.created_at AS payment_created_at,

        o.id AS order_id,
        o.user_id,
        o.total_amount,
        o.status AS order_status,
        o.shipping_addr,
        o.created_at AS order_created_at

      FROM payments p
      INNER JOIN orders o ON o.id = p.order_id
      WHERE p.id = ?
      LIMIT 1
      `,
      [paymentId]
    );

    return rows[0];
  }

  // Trace point: updateCheckoutFields()
  static async updateCheckoutFields(paymentId, data) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    if (fields.length === 0) return false;

    const [result] = await this.pool.query(
      `UPDATE ${this.table} SET ${fields.join(", ")} WHERE id = ?`,
      [...values, paymentId]
    );

    return result.affectedRows > 0;
  }

  // UPDATE PAYMENT STATUS
  static async updateStatus(paymentId, status) {
    const [result] = await this.pool.query(
      `UPDATE ${this.table} SET status = ? WHERE id = ?`,
      [status, paymentId]
    );

    return result.affectedRows > 0;
  }

  // UPDATE TRANSACTION ID
  static async updateTransactionId(paymentId, transactionId) {
    const [result] = await this.pool.query(
      `UPDATE ${this.table} SET transaction_id = ? WHERE id = ?`,
      [transactionId, paymentId]
    );

    return result.affectedRows > 0;
  }
}
