// Trace point: asyncHandler()
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Trace point: globalErrorHandler()
export const globalErrorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors
    });
}

// Trace point: withTransaction()
export async function withTransaction(pool, callback) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const result = await callback(conn); 

        await conn.commit();

        return result;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}
