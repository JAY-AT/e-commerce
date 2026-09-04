import BaseModel from "../../common/model/orm/base.js";

export default class OrderReviewRepository extends BaseModel {
    static table = "order_reviews";

    static publicFields = [
        "id",
        "order_id",
        "user_id",
        "rating",
        "comment",
        "created_at"
    ];

    // =========================
    // CREATE REVIEW
    // =========================
    static async createReview(data, conn = null) {
        return await this.create(data, conn);
    }

    // =========================
    // GET REVIEW BY ORDER ID
    // (because order_id is UNIQUE)
    // =========================
    static async findByOrderId(orderId) {
        const [rows] = await this.pool.query(
            `SELECT * FROM ${this.table} WHERE order_id = ? LIMIT 1`,
            [orderId]
        );

        return rows[0] || null;
    }

    // Trace point: findByOrderIdSafe()
    static async findByOrderIdSafe(orderId) {
        const data = await this.findByOrderId(orderId);
        return this.applySafe(data);
    }

    // =========================
    // GET ALL REVIEWS BY USER
    // =========================
    static async findByUserId(userId) {
        const [rows] = await this.pool.query(
            `SELECT * FROM ${this.table} WHERE user_id = ? ORDER BY created_at DESC`,
            [userId]
        );

        return rows;
    }

    // Trace point: findByUserIdSafe()
    static async findByUserIdSafe(userId) {
        const data = await this.findByUserId(userId);
        return this.applySafe(data);
    }

    // =========================
    // DELETE BY ORDER ID
    // =========================
    static async deleteByOrderId(orderId) {
        const [result] = await this.pool.query(
            `DELETE FROM ${this.table} WHERE order_id = ?`,
            [orderId]
        );

        return result.affectedRows > 0;
    }

    // =========================
    // CHECK IF REVIEW EXISTS
    // =========================
    static async existsByOrderId(orderId) {
        const [rows] = await this.pool.query(
            `SELECT id FROM ${this.table} WHERE order_id = ? LIMIT 1`,
            [orderId]
        );

        return rows.length > 0;
    }

    // =========================
    // SAFE HELPER (matches BaseModel pattern)
    // =========================
    static applySafe(data) {
        if (!data) return null;
        return Array.isArray(data)
            ? data.map(d => this.safePick(d))
            : this.safePick(data);
    }

    // Trace point: safePick()
    static safePick(row) {
        if (!row) return null;

        const safe = {};
        for (const field of this.publicFields) {
            safe[field] = row[field];
        }
        return safe;
    }

    // =========================
    // GET TOP HIGH RATING REVIEWS
    // =========================
    static async findTopHighRating(limit = 10) {
        const [rows] = await this.pool.query(
            `SELECT 
                r.*,
                u.first_name,
                u.last_name
            FROM ${this.table} r
            JOIN users u ON u.id = r.user_id
            ORDER BY r.rating DESC, r.created_at DESC
            LIMIT ?`,
            [limit]
        );

        return rows;
}

    // Trace point: findTopHighRatingSafe()
    static async findTopHighRatingSafe(limit = 10) {
        const data = await this.findTopHighRating(limit);
        return this.applySafe(data);
    }
}