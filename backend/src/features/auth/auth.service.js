import { authDTO } from "../../common/dtos/auth.js";
import { publicUserDTO } from "../../common/dtos/user.js";
import AppError from "../../common/utilities/error.js";
import {
  decodeToken,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  hashRefreshToken,
  verifyAccessOrRefreshToken,
  verifyPassword,
} from "../../common/utilities/auth.js";
import { withTransaction } from "../../common/utilities/handler.js";
import UserModel from "../user/user.repository.js";
import AuthRepository from "./auth.repository.js";
import AddressRepository from "../address/address.repository.js";

const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

// Trace point: buildTokenPair()
function buildTokenPair(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken({ id: user.id }),
  };
}

// Trace point: getRefreshTokenExpiry()
function getRefreshTokenExpiry(refreshToken) {
  const decoded = decodeToken(refreshToken);

  if (!decoded || !decoded.exp) {
    throw new AppError("Invalid refresh token", 401);
  }

  return new Date(decoded.exp * 1000);
}

// Trace point: getRefreshTokenFromRequest()
function getRefreshTokenFromRequest(req) {
  return (
    req.body?.refresh_token ||
    req.cookies?.refresh_token ||
    req.headers["x-refresh-token"] ||
    null
  );
}

// Trace point: persistRefreshToken()
async function persistRefreshToken(conn, userId, refreshToken) {
  return AuthRepository.createRefreshToken(
    {
      user_id: userId,
      token_hash: hashRefreshToken(refreshToken),
      expires_at: getRefreshTokenExpiry(refreshToken),
    },
    conn
  );
}

// Trace point: loadUserById()
async function loadUserById(id, db = null) {
  const user = await AuthRepository.findUserById(id, db);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}

// Trace point: register()
export const register = async (payload) => {
  const existingUser = await AuthRepository.findUserByEmail(payload.email);

  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  return withTransaction(UserModel.pool, async (conn) => {
    const result = await AuthRepository.createUser(
      {
        email: payload.email,
        password_hash: hashPassword(payload.password),
        first_name: payload.first_name,
        last_name: payload.last_name,
        phone: payload.phone ?? null,
        role: "customer",
      },
      conn
    );

    await AddressRepository.upsertByUserId(
      result.insertId,
      {
        address_line: null,
        city: null,
        state: null,
        postal_code: null,
      },
      conn
    );

    const user = await loadUserById(result.insertId, conn);
    const tokens = buildTokenPair(user);

    await persistRefreshToken(conn, user.id, tokens.refreshToken);

    return authDTO(user, tokens);
  });
};

// Trace point: login()
export const login = async (payload) => {
  const user = await AuthRepository.findUserByEmail(payload.email);

  if (!user || !verifyPassword(payload.password, user.password_hash)) {
    throw new AppError("Invalid email or password", 401);
  }

  const tokens = buildTokenPair(user);

  await persistRefreshToken(UserModel.pool, user.id, tokens.refreshToken);

  return authDTO(user, tokens);
};

// Trace point: me()
export const me = async (userId) => {
  const user = await loadUserById(userId);
  return publicUserDTO(user);
};

// Trace point: logout()
export const logout = async (req) => {
  const refreshToken = getRefreshTokenFromRequest(req);

  if (!refreshToken) {
    throw new AppError("Refresh token is required", 400);
  }

  const tokenHash = hashRefreshToken(refreshToken);
  await AuthRepository.revokeRefreshTokenByHash(tokenHash);

  return {
    message: "Logged out successfully",
  };
};

// Trace point: refresh()
export const refresh = async (req) => {
  const refreshToken = getRefreshTokenFromRequest(req);

  if (!refreshToken) {
    throw new AppError("Refresh token is required", 400);
  }

  const decoded = verifyAccessOrRefreshToken(refreshToken);

  if (decoded.type && decoded.type !== "refresh") {
    throw new AppError("Invalid refresh token", 401);
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const user = await loadUserById(decoded.id);

  return withTransaction(UserModel.pool, async (conn) => {
    const storedToken = await AuthRepository.findRefreshTokenByHash(tokenHash, conn);

    if (!storedToken) {
      throw new AppError("Refresh token is invalid or expired", 401);
    }

    await AuthRepository.revokeRefreshTokenByHash(tokenHash, conn);

    const tokens = buildTokenPair(user);
    await persistRefreshToken(conn, user.id, tokens.refreshToken);

    return authDTO(user, tokens);
  });
};

export const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: REFRESH_COOKIE_MAX_AGE,
};
