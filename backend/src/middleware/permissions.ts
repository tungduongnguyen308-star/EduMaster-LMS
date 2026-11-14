import type { Request, Response, NextFunction } from "express";
import type { Role } from "@prisma/client";
import prisma from "../config/prisma";
import { HttpError } from "../lib/http";
import { authenticate } from "./auth.middleware";

export function requireRoles(...allowed: Role[]) {
  return [authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: res.locals.userId }, select: { id: true, role: true } });
      if (!user) throw new HttpError(401, "Tài khoản không tồn tại");
      res.locals.role = user.role;
      if (!allowed.includes(user.role)) throw new HttpError(403, "Bạn không có quyền thực hiện");
      next();
    } catch (err) { next(err); }
  }];
}

export async function requireCourseManager(courseId: number, userId: number) {
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, instructorId: true, price: true, status: true } });
  if (!course) throw new HttpError(404, "Khóa học không tồn tại");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== "ADMIN" && course.instructorId !== userId)) throw new HttpError(403, "Không được quản lý khóa học này");
  return course;
}
export async function requireLessonManager(lessonId: number, userId: number) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { section: true } });
  if (!lesson) throw new HttpError(404, "Bài học không tồn tại");
  await requireCourseManager(lesson.section.courseId, userId);
  return lesson;
}
export async function canReadLesson(lessonId: number, userId: number) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { section: { include: { course: true } } } });
  if (!lesson) throw new HttpError(404, "Bài học không tồn tại");
  const course = lesson.section.course;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) throw new HttpError(401, "Tài khoản không tồn tại");
  if (user.role === "ADMIN" || (user.role === "INSTRUCTOR" && course.instructorId === userId)) return lesson;
  if (course.status !== "PUBLISHED") throw new HttpError(403, "Khóa học chưa công khai");
  const enrollment = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId: userId, courseId: course.id } } });
  if (!enrollment) throw new HttpError(403, "Bạn chưa đăng ký khóa học");
  return lesson;
}
