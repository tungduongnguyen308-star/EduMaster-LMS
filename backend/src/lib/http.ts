import type { Request, Response, NextFunction, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const asyncRoute = (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next) => { Promise.resolve(fn(req, res)).catch(next); };
export function positiveId(raw: string | string[]): number {
  if (Array.isArray(raw)) throw new HttpError(400, "ID không hợp lệ");
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n < 1) throw new HttpError(400, "ID không hợp lệ");
  return n;
}
export function body<T extends z.ZodTypeAny>(schema: T, input: unknown): z.output<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '));
  return parsed.data;
}
export function pageQuery(req: Request) {
  const page = Math.min(10000, Math.max(1, Number(req.query.page) || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 9));
  return { page, limit, skip: (page - 1) * limit };
}
export function apiError(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return res.status(409).json({ message: "Dữ liệu đã tồn tại" });
    if (err.code === "P2025") return res.status(404).json({ message: "Không tìm thấy dữ liệu" });
    if (err.code === "P2003") return res.status(400).json({ message: "Dữ liệu liên quan không hợp lệ" });
  }
  console.error("Unhandled API error:", err);
  return res.status(500).json({ message: "Lỗi máy chủ" });
}
export const nameSchema = z.string().trim().min(2).max(191);
export const urlSchema = z.string().trim().url().max(191).refine(s => /^(https?):\/\//i.test(s), "URL phải bắt đầu bằng http:// hoặc https://");
export const resourceUrlSchema = z.string().trim().url().max(2000).refine(s => /^(https?):\/\//i.test(s), "URL phải bắt đầu bằng http:// hoặc https://");
