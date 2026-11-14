const { scoreAnswers } = require('../dist/lib/scoring.js');
describe('quiz scoring', () => {
  test('scores full credit', () => {
    expect(scoreAnswers(new Map([[1, 10], [2, 20]]), new Map([[1, 10], [2, 20]]))).toEqual({ score: 2, total: 2, percent: 100 });
  });
  test('scores partial credit', () => {
    expect(scoreAnswers(new Map([[1, 10], [2, 20]]), new Map([[1, 10], [2, 99]]))).toEqual({ score: 1, total: 2, percent: 50 });
  });
  test('does not accept a zero-question quiz', () => {
    expect(() => scoreAnswers(new Map(), new Map())).toThrow();
  });
});
