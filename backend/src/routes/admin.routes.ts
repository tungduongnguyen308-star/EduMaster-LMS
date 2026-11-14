import { Router } from "express";
import { CourseStatus, Role } from "@prisma/client";
import { z } from "zod";
import prisma from "../config/prisma";
import { asyncRoute, body, HttpError, pageQuery, positiveId } from "../lib/http";
import { requireRoles } from "../middleware/permissions";
const router = Router();
router.use(...requireRoles("ADMIN"));
router.get("/stats", asyncRoute(async (_req, res) => {
  const [users, courses, enrollments, lessons, attempts] = await prisma.$transaction([
    prisma.user.count(), prisma.course.count(), prisma.enrollment.count(), prisma.lesson.count(), prisma.quizAttempt.count(),
  ]);
  res.json({ users, courses, enrollments, lessons, attempts });
}));
router.get("/users", asyncRoute(async (req, res) => {
  const { skip, limit, page } = pageQuery(req);
  const search = String(req.query.search || "").slice(0, 120);
  const where = search ? { OR: [{ email: { contains: search } }, { fullName: { contains: search } }] } : {};
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({ where, select: { id: true, fullName: true, email: true, role: true, createdAt: true }, take: limit, skip, orderBy: { id: "desc" } }),
    prisma.user.count({ where }),
  ]);
  res.json({ items, total, page, limit });
}));
router.patch("/users/:id/role", asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id);
  const { role } = body(z.object({ role: z.nativeEnum(Role) }), req.body);
  if (id === res.locals.userId && role !== "ADMIN") throw new HttpError(400, "Không thể tự thu hồi quyền quản trị của mình");
  const user = await prisma.user.update({ where: { id }, data: { role }, select: { id: true, fullName: true, email: true, role: true } });
  res.json({ user });
}));
router.get("/courses", asyncRoute(async (_req, res) => {
  const items = await prisma.course.findMany({ include: { instructor: { select: { fullName: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
  res.json({ items });
}));
router.patch("/courses/:id/status", asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id);
  const { status } = body(z.object({ status: z.nativeEnum(CourseStatus) }), req.body);
  res.json({ course: await prisma.course.update({ where: { id }, data: { status } }) });
}));
export default router;
