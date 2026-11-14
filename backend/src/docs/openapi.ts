const bearer = [{ bearerAuth: [] }];
const item = (summary: string, method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', secured = true, body = false) => ({
  [method.toLowerCase()]: {
    tags: [method === 'GET' ? 'Read' : 'Write'], summary,
    ...(secured ? { security: bearer } : {}),
    ...(body ? { requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } } } : {}),
    responses: { '200': { description: 'Success' }, '201': { description: 'Created' }, '400': { description: 'Bad Request' }, '401': { description: 'Unauthorized' }, '403': { description: 'Forbidden' }, '404': { description: 'Not Found' } },
  },
});
const idParameter = [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }];
const withId = (x: object) => ({ parameters: idParameter, ...x });
export const openapi = {
  openapi: '3.0.3', info: { title: 'EduMaster LMS REST API', version: '1.0.0', description: 'API reference for course, lesson, enrollment, quiz and administration. Use Bearer access token for protected endpoints.' },
  servers: [{ url: 'http://localhost:5000' }],
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  paths: {
    '/api/health': item('Service health', 'GET', false),
    '/api/auth/register': item('Register student', 'POST', false, true),
    '/api/auth/login': item('Login with email and password', 'POST', false, true),
    '/api/auth/refresh': item('Rotate refresh token', 'POST', false, true),
    '/api/auth/logout': item('Revoke refresh token', 'POST', false, true),
    '/api/auth/me': item('Current user profile', 'GET'),
    '/api/courses': { ...item('Search published courses', 'GET', false), ...item('Create course (instructor/admin)', 'POST', true, true) },
    '/api/courses/{id}': withId(item('Published course details', 'GET', false)),
    '/api/courses/mine': item('Managed courses (instructor/admin)', 'GET'),
    '/api/courses/manage/{id}': withId(item('Edit course and full lesson outline', 'GET')),
    '/api/courses/{id}/sections': withId(item('Add course section', 'POST', true, true)),
    '/api/course-content/sections/{id}/lessons': withId(item('Add lesson in a section', 'POST', true, true)),
    '/api/course-content/lessons/{id}/content': withId(item('Get lesson content (enrolled or course manager)', 'GET')),
    '/api/course-content/lessons/{id}/resources': withId(item('Add resource link', 'POST', true, true)),
    '/api/enrollments/me': item('My enrolled courses and progress', 'GET'),
    '/api/enrollments/courses/{id}': withId(item('Enroll in free published course', 'POST', true, true)),
    '/api/enrollments/lessons/{id}/progress': withId(item('Mark lesson completed/uncompleted', 'PATCH', true, true)),
    '/api/quizzes/lessons/{id}': withId({ ...item('Read quiz without answer key', 'GET'), ...item('Create/replace quiz', 'PUT', true, true) }),
    '/api/quizzes/{id}/submit': withId(item('Grade submitted MCQ answers', 'POST', true, true)),
    '/api/quizzes/{id}/attempts': withId(item('My quiz attempts', 'GET')),
    '/api/admin/stats': item('Admin aggregate statistics', 'GET'),
    '/api/admin/users': item('Admin user list', 'GET'),
    '/api/admin/users/{id}/role': withId(item('Change user role', 'PATCH', true, true)),
    '/api/admin/courses': item('Admin all courses', 'GET'),
    '/api/admin/courses/{id}/status': withId(item('Publish/archive course', 'PATCH', true, true)),
  },
};
