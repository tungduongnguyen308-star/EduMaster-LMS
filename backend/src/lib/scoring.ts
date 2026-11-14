export function scoreAnswers(correctOptionIds: ReadonlyMap<number, number>, selectedOptionIds: ReadonlyMap<number, number>) {
  if (correctOptionIds.size === 0) throw new Error("Quiz must have at least one question");
  let score = 0;
  for (const [questionId, correctId] of correctOptionIds) {
    if (selectedOptionIds.get(questionId) === correctId) score += 1;
  }
  return { score, total: correctOptionIds.size, percent: Math.round(100 * score / correctOptionIds.size) };
}
