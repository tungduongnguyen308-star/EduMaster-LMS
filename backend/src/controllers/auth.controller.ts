import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  getUserProfile,
  loginUser,
  logoutUser,
  refreshUserToken,
  registerStudent,
} from "../services/auth.service";

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(191),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(40).max(256),
});

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Thông tin đăng ký không hợp lệ",
      errors: parsed.error.flatten(),
    });
  }

  // bcrypt gioi han do dai mat khau o 72 byte, khong phai 72 ky tu.
  if (Buffer.byteLength(parsed.data.password, "utf8") > 72) {
    return res.status(400).json({ message: "Mật khẩu vượt quá 72 byte" });
  }

  try {
    const user = await registerStudent(parsed.data);
    return res.status(201).json({ message: "Đăng ký thành công", user });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({ message: "Email đã được sử dụng" });
    }
    console.error("Register error:", error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Thông tin đăng nhập không hợp lệ" });
  }
  try {
    const data = await loginUser(parsed.data.email, parsed.data.password);
    if (!data) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không chính xác" });
    }
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(data);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

export async function getMe(_req: Request, res: Response) {
  try {
    const userId = res.locals.userId as number;
    const user = await getUserProfile(userId);
    if (!user) {
      return res.status(401).json({ message: "Tài khoản không tồn tại" });
    }
    return res.status(200).json({ message: "Lấy thông tin thành công", user });
  } catch (error) {
    console.error("GetMe error:", error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

export async function refresh(req: Request, res: Response) {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Refresh token không hợp lệ" });
  }
  try {
    const result = await refreshUserToken(parsed.data.refreshToken);
    if (!result) {
      return res.status(401).json({ message: "Refresh token không hợp lệ hoặc hết hạn" });
    }
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(result);
  } catch (error) {
    console.error("Refresh error:", error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

export async function logout(req: Request, res: Response) {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Thiếu refresh token" });
  }
  try {
    await logoutUser(parsed.data.refreshToken);
    return res.status(200).json({ message: "Đăng xuất thành công" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}
