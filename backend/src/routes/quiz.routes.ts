import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { asyncRoute, body, HttpError, positiveId } from "../lib/http";
import { scoreAnswers } from "../lib/scoring";
import { requireLessonManager, canReadLesson, requireRoles } from "../middleware/permissions";
import { authenticate } from "../middleware/auth.middleware";
const router = Router();

const optionSchema = z.object({ text: z.string().trim().min(1).max(191), isCorrect: z.boolean() });
const quizInput = z.object({
  title: z.string().trim().min(3).max(191),
  questions: z.array(z.object({ text: z.string().trim().min(5).max(5000), options: z.array(optionSchema).min(2).max(6) })).min(1).max(50),
}).superRefine((quiz, ctx) => {
  quiz.questions.forEach((q, i) => {
    if (q.options.filter(o => o.isCorrect).length !== 1) ctx.addIssue({ code: "custom", path: ["questions", i, "options"], message: "Mỗi câu chỉ có một đáp án đúng" });
  });
});

// Replacing a quiz deletes earlier attempts. Only course owner/admin can do this.
router.put("/lessons/:id", ...requireRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const lessonId = positiveId(req.params.id);
  await requireLessonManager(lessonId, res.locals.userId);
  const data = body(quizInput, req.body);
  const quiz = await prisma.$transaction(async tx => {
    await tx.quiz.deleteMany({ where: { lessonId } });
    return tx.quiz.create({ data: { lessonId, title: data.title, questions: { create: data.questions.map((q, index) => ({ text: q.text, position: index, options: { create: q.options } })) } }, include: { questions: { include: { options: true } } } });
  });
  res.json({ quiz });
}));
router.get("/lessons/:id", authenticate, asyncRoute(async (req, res) => {
  const lessonId = positiveId(req.params.id);
  await canReadLesson(lessonId, res.locals.userId);
  const quiz = await prisma.quiz.findUnique({ where: { lessonId }, include: { questions: { orderBy: { position: "asc" }, include: { options: { select: { id: true, text: true } } } } } });
  if (!quiz) throw new HttpError(404, "Bài kiểm tra chưa được tạo");
  // NEVER include isCorrect in student response.
  res.json({ quiz });
}));
router.get("/manage/lessons/:id", ...requireRoles("INSTRUCTOR", "ADMIN"), asyncRoute(async (req, res) => {
  const lessonId = positiveId(req.params.id);
  await requireLessonManager(lessonId, res.locals.userId);
  const quiz = await prisma.quiz.findUnique({ where: { lessonId }, include: { questions: { orderBy: { position: "asc" }, include: { options: true } } } });
  res.json({ quiz });
}));
router.post("/:id/submit", ...requireRoles("STUDENT"), asyncRoute(async (req, res) => {
  const quizId = positiveId(req.params.id);
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { questions: { include: { options: true } } } });
  if (!quiz) throw new HttpError(404, "Không tìm thấy quiz");
  await canReadLesson(quiz.lessonId, res.locals.userId);
  const parsed = body(z.object({ answers: z.array(z.object({ questionId: z.number().int().positive(), optionId: z.number().int().positive() })).max(100) }), req.body);
  const submitted = new Map<number, number>();
  for (const a of parsed.answers) {
    if (submitted.has(a.questionId)) throw new HttpError(400, "Câu hỏi được trả lời nhiều lần");
    submitted.set(a.questionId, a.optionId);
  }
  const questionIds = new Set(quiz.questions.map(q => q.id));
  if (submitted.size !== quiz.questions.length || Array.from(submitted.keys()).some(id => !questionIds.has(id))) throw new HttpError(400, "Cần trả lời đầy đủ câu hỏi của quiz");
  const answers = quiz.questions.map(q => {
    const optionId = submitted.get(q.id)!;
    const selected = q.options.find(o => o.id === optionId);
    if (!selected) throw new HttpError(400, "Phương án trả lời không thuộc câu hỏi");
    return { questionId: q.id, optionId, isCorrect: selected.isCorrect };
  });
  const grade = scoreAnswers(
    new Map(quiz.questions.map(q => [q.id, q.options.find(o => o.isCorrect)!.id])),
    submitted
  );
  const score = grade.score;
  const attempt = await prisma.quizAttempt.create({ data: { quizId, studentId: res.locals.userId, score, total: answers.length, answers: { create: answers } }, select: { id: true, score: true, total: true, createdAt: true } });
  res.status(201).json({ attempt, percent: grade.percent });
}));
router.get("/:id/attempts", ...requireRoles("STUDENT"), asyncRoute(async (req, res) => {
  const quizId = positiveId(req.params.id);
  res.json({ items: await prisma.quizAttempt.findMany({ where: { quizId, studentId: res.locals.userId }, select: { id: true, score: true, total: true, createdAt: true }, orderBy: { createdAt: "desc" } }) });
}));
export default router;
