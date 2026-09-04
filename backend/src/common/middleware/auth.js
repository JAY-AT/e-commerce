import jwt from "jsonwebtoken";
import AppError from "../utilities/error.js";

// Trace point: authMiddleware()
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized: No token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type && decoded.type !== "access") {
      return res.status(401).json({
        message: "Unauthorized: Invalid token type",
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    next(new AppError(
        error.message,
        401
    ))
  }
};

export default authMiddleware;
