import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { asyncRoute, body, HttpError, positiveId } from "../lib/http";
import { canReadLesson, requireRoles } from "../middleware/permissions";
const router = Router();

router.get("/me", ...requireRoles("STUDENT"), asyncRoute(async (_req, res) => {
  const enrollments = await prisma.enrollment.findMany({ where: { studentId: res.locals.userId }, include: { course: { include: { instructor: { select: { fullName: true } }, sections: { include: { lessons: { select: { id: true } } } } } } }, orderBy: { enrolledAt: "desc" } });
  const lessonIds = enrollments.flatMap(e => e.course.sections.flatMap(s => s.lessons.map(l => l.id)));
  const progress = await prisma.lessonProgress.findMany({ where: { studentId: res.locals.userId, lessonId: { in: lessonIds }, completed: true }, select: { lessonId: true } });
  const completed = new Set(progress.map(p => p.lessonId));
  res.json({ items: enrollments.map(e => {
    const all = e.course.sections.flatMap(s => s.lessons.map(l => l.id));
    return { id: e.id, enrolledAt: e.enrolledAt, course: { id: e.course.id, title: e.course.title, thumbnail: e.course.thumbnail, instructor: e.course.instructor }, progress: all.length ? Math.round(100 * all.filter(id => completed.has(id)).length / all.length) : 0, completedLessonIds: all.filter(id => completed.has(id)) };
  }) });
}));
router.post("/courses/:id", ...requireRoles("STUDENT"), asyncRoute(async (req, res) => {
  const courseId = positiveId(req.params.id);
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.status !== "PUBLISHED") throw new HttpError(404, "Khóa học chưa công khai");
  if (Number(course.price) !== 0) throw new HttpError(403, "Khóa học có phí cần thanh toán; bản demo chưa tích hợp cổng thanh toán");
  const result = await prisma.enrollment.upsert({ where: { studentId_courseId: { studentId: res.locals.userId, courseId } }, update: {}, create: { studentId: res.locals.userId, courseId } });
  res.status(201).json({ enrollment: result });
}));
router.patch("/lessons/:id/progress", ...requireRoles("STUDENT"), asyncRoute(async (req, res) => {
  const lessonId = positiveId(req.params.id);
  await canReadLesson(lessonId, res.locals.userId);
  const { completed } = body(z.object({ completed: z.boolean() }), req.body);
  const progress = await prisma.lessonProgress.upsert({ where: { studentId_lessonId: { studentId: res.locals.userId, lessonId } }, create: { studentId: res.locals.userId, lessonId, completed, completedAt: completed ? new Date() : null }, update: { completed, completedAt: completed ? new Date() : null } });
  res.json({ progress });
}));
router.put("/courses/:id/review", ...requireRoles("STUDENT"), asyncRoute(async (req, res) => {
  const courseId = positiveId(req.params.id);
  const studentId = res.locals.userId as number;
  const enrolled = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId, courseId } } });
  if (!enrolled) throw new HttpError(403, "Bạn cần đăng ký học trước khi đánh giá");
  const data = body(z.object({ rating: z.number().int().min(1).max(5), comment: z.string().trim().max(2000).nullable().optional() }), req.body);
  const review = await prisma.review.upsert({ where: { userId_courseId: { userId: studentId, courseId } }, create: { ...data, userId: studentId, courseId }, update: data });
  res.json({ review });
}));
export default router;
