import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/token";

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Bạn chưa cung cấp Access Token" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    res.status(401).json({ message: "Bạn chưa cung cấp Access Token" });
    return;
  }

  try {
    res.locals.userId = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Access Token không hợp lệ hoặc đã hết hạn" });
  }
}
