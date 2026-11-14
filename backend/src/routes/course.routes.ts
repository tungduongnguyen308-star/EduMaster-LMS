import { Router } from "express";
import { Prisma, CourseStatus } from "@prisma/client";
import { z } from "zod";
import prisma from "../config/prisma";
import { asyncRoute, body, HttpError, nameSchema, pageQuery, positiveId, urlSchema, resourceUrlSchema } from "../lib/http";
import { authenticate } from "../middleware/auth.middleware";
import { requireCourseManager, requireLessonManager, canReadLesson, requireRoles } from "../middleware/permissions";

const router = Router();
const optionalUrl = urlSchema.nullable().optional();
const courseCreate = z.object({
  title: nameSchema,
  description: z.string().trim().min(10).max(20000),
  thumbnail: optionalUrl,
  price: z.number().min(0).max(99999999).default(0),
});
const coursePatch = courseCreate.partial();
const sectionBody = z.object({ title: nameSchema, position: z.number().int().min(0).optional() });
const lessonBody = z.object({ title: nameSchema, content: z.string().max(50000).nullable().optional(), videoUrl: optionalUrl, position: z.number().int().min(0).optional() });
const courseOutline = { instructor: { select: { id: true, fullName: true } }, sections: { orderBy: { position: "asc" as const }, include: { lessons: { orderBy: { position: "asc" as const }, select: { id: true, title: true, position: true } } } }, _count: { select: { enrollments: true, reviews: true } } };

router.get("/", asyncRoute(async (req, res) => {
  const { page, limit, skip } = pageQuery(req);
  const search = String(req.query.search || "").trim().slice(0, 120);
  const order = req.query.sort === "newest" ? "desc" : "asc";
  const where: Prisma.CourseWhereInput = { status: "PUBLISHED", ...(search ? { OR: [{ title: { contains: search } }, { description: { contains: search } }] } : {}) };
  const [items, total] = await prisma.$transaction([
    prisma.course.findMany({ where, orderBy: { createdAt: order }, skip, take: limit, select: { id: true, title: true, description: true, thumbnail: true, price: true, createdAt: true, instructor: { select: { id: true, fullName: true } }, _count: { select: { enrollments: true } } } }),
    prisma.course.count({ where }),
  ]);
  res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
}));
router.get("/mine", ...requireRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (_req, res) => {
  const where = res.locals.role === "ADMIN" ? {} : { instructorId: res.locals.userId as number };
  res.json({ items: await prisma.course.findMany({ where, include: { _count: { select: { enrollments: true, sections: true } } }, orderBy: { updatedAt: "desc" } }) });
}));
router.get("/manage/:id", ...requireRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id);
  await requireCourseManager(id, res.locals.userId);
  const course = await prisma.course.findUnique({ where: { id }, include: { sections: { orderBy: { position: "asc" }, include: { lessons: { orderBy: { position: "asc" }, include: { resources: true } } } } } });
  res.json({ course });
}));
router.get("/:id", asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id);
  const course = await prisma.course.findFirst({ where: { id, status: "PUBLISHED" }, include: courseOutline });
  if (!course) throw new HttpError(404, "Không tìm thấy khóa học công khai");
  res.json({ course });
}));
router.post("/", ...requireRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const data = body(courseCreate, req.body);
  const course = await prisma.course.create({ data: { ...data, instructorId: res.locals.userId } });
  res.status(201).json({ course });
}));
router.patch("/:id", ...requireRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id); await requireCourseManager(id, res.locals.userId);
  const data = body(coursePatch, req.body);
  res.json({ course: await prisma.course.update({ where: { id }, data }) });
}));
router.delete("/:id", ...requireRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id); await requireCourseManager(id, res.locals.userId);
  await prisma.course.delete({ where: { id } }); res.json({ message: "Đã xóa khóa học" });
}));
router.post("/:id/sections", ...requireRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id); await requireCourseManager(id, res.locals.userId);
  const data = body(sectionBody, req.body);
  res.status(201).json({ section: await prisma.section.create({ data: { ...data, courseId: id } }) });
}));
router.patch("/sections/:id", ...requireRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id);
  const section = await prisma.section.findUnique({ where: { id } });
  if (!section) throw new HttpError(404, "Chương học không tồn tại");
  await requireCourseManager(section.courseId, res.locals.userId);
  res.json({ section: await prisma.section.update({ where: { id }, data: body(sectionBody.partial(), req.body) }) });
}));
router.delete("/sections/:id", ...requireRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id);
  const section = await prisma.section.findUnique({ where: { id } });
  if (!section) throw new HttpError(404, "Chương học không tồn tại");
  await requireCourseManager(section.courseId, res.locals.userId);
  await prisma.section.delete({ where: { id } }); res.json({ message: "Đã xóa chương học" });
}));
router.post("/sections/:id/lessons", ...requireRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id);
  const section = await prisma.section.findUnique({ where: { id } });
  if (!section) throw new HttpError(404, "Chương học không tồn tại");
  await requireCourseManager(section.courseId, res.locals.userId);
  res.status(201).json({ lesson: await prisma.lesson.create({ data: { ...body(lessonBody, req.body), sectionId: id } }) });
}));
router.patch("/lessons/:id", ...requireRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id); await requireLessonManager(id, res.locals.userId);
  res.json({ lesson: await prisma.lesson.update({ where: { id }, data: body(lessonBody.partial(), req.body) }) });
}));
router.delete("/lessons/:id", ...requireRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id); await requireLessonManager(id, res.locals.userId);
  await prisma.lesson.delete({ where: { id } }); res.json({ message: "Đã xóa bài học" });
}));
router.get("/lessons/:id/content", authenticate, asyncRoute(async (req, res) => {
  const lesson = await canReadLesson(positiveId(req.params.id), res.locals.userId);
  const resources = await prisma.lessonResource.findMany({ where: { lessonId: lesson.id } });
  res.json({ lesson: { id: lesson.id, title: lesson.title, content: lesson.content, videoUrl: lesson.videoUrl, resources } });
}));
router.post("/lessons/:id/resources", ...requireRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id); await requireLessonManager(id, res.locals.userId);
  const data = body(z.object({ name: nameSchema, url: resourceUrlSchema }), req.body);
  res.status(201).json({ resource: await prisma.lessonResource.create({ data: { ...data, lessonId: id } }) });
}));
router.delete("/resources/:id", ...requireRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id);
  const resource = await prisma.lessonResource.findUnique({ where: { id }, include: { lesson: { include: { section: true } } } });
  if (!resource) throw new HttpError(404, "Tài liệu không tồn tại");
  await requireCourseManager(resource.lesson.section.courseId, res.locals.userId);
  await prisma.lessonResource.delete({ where: { id } }); res.json({ message: "Đã xóa tài liệu" });
}));
export default router;
