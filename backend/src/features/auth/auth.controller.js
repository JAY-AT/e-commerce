import { asyncHandler } from "../../common/utilities/handler.js";
import { login, logout, me, register, refresh, authCookieOptions } from "./auth.service.js";

// Trace point: setRefreshCookie()
function setRefreshCookie(res, token) {
  res.cookie("refresh_token", token, authCookieOptions);
}

// Trace point: clearRefreshCookie()
function clearRefreshCookie(res) {
  res.clearCookie("refresh_token", {
    path: authCookieOptions.path,
    sameSite: authCookieOptions.sameSite,
    secure: authCookieOptions.secure,
  });
}

export const registerController = asyncHandler(async (req, res) => {
  const result = await register(req.body);
  setRefreshCookie(res, result.refresh_token);
  res.status(201).json(result);
});

export const loginController = asyncHandler(async (req, res) => {
  const result = await login(req.body);
  setRefreshCookie(res, result.refresh_token);
  res.json(result);
});

export const meController = asyncHandler(async (req, res) => {
  const user = await me(req.user.id);
  res.json(user);
});

export const logoutController = asyncHandler(async (req, res) => {
  const result = await logout(req);
  clearRefreshCookie(res);
  res.json(result);
});

export const refreshController = asyncHandler(async (req, res) => {
  const result = await refresh(req);
  setRefreshCookie(res, result.refresh_token);
  res.json(result);
});
