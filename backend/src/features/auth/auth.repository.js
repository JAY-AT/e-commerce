import UserModel from "../user/user.repository.js";
import RefreshTokenModel from "./auth.model.js";

export default class AuthRepository {
  // Trace point: findUserByEmail()
  static async findUserByEmail(email, db = null) {
    const conn = db ?? UserModel.pool;

    const [rows] = await conn.query(
      `
      SELECT
        u.id,
        u.email,
        u.password_hash,
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
      FROM users u
      LEFT JOIN addresses a ON a.user_id = u.id
      WHERE u.email = ?
      LIMIT 1
      `,
      [email]
    );

    return rows[0];
  }

  // Trace point: findUserById()
  static async findUserById(id, db = null) {
    const conn = db ?? UserModel.pool;

    const [rows] = await conn.query(
      `
      SELECT
        u.id,
        u.email,
        u.password_hash,
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
      FROM users u
      LEFT JOIN addresses a ON a.user_id = u.id
      WHERE u.id = ?
      LIMIT 1
      `,
      [id]
    );

    return rows[0];
  }

  // Trace point: createUser()
  static async createUser(data, db = null) {
    return UserModel.create(data, db);
  }

  // Trace point: createRefreshToken()
  static async createRefreshToken(data, db = null) {
    return RefreshTokenModel.create(data, db);
  }

  // Trace point: findRefreshTokenByHash()
  static async findRefreshTokenByHash(tokenHash, db = null) {
    return RefreshTokenModel.findActiveByHash(tokenHash, db);
  }

  // Trace point: revokeRefreshTokenByHash()
  static async revokeRefreshTokenByHash(tokenHash, db = null) {
    return RefreshTokenModel.revokeByHash(tokenHash, db);
  }

  // Trace point: revokeRefreshTokensByUserId()
  static async revokeRefreshTokensByUserId(userId, db = null) {
    return RefreshTokenModel.revokeByUserId(userId, db);
  }
}
