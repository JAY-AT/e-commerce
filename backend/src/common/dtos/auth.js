import { publicUserDTO } from "./user.js";

// Trace point: authDTO()
export const authDTO = (user, tokens) => ({
  user: publicUserDTO(user),
  access_token: tokens.accessToken,
  refresh_token: tokens.refreshToken
})
