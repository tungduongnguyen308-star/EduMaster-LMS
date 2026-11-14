import 'dotenv/config';
import prisma from '../src/config/prisma';
async function main() {
  const email = process.argv[2]?.toLowerCase();
  if (!email) throw new Error('Usage: npm run seed:demo -- instructor@example.com');
  const instructor = await prisma.user.findUnique({ where: { email } });
  if (!instructor || !['INSTRUCTOR', 'ADMIN'].includes(instructor.role)) throw new Error('Register this account and promote it to INSTRUCTOR first.');
  const drafts = [
    { title: 'Node.js & Express từ cơ bản', description: 'Xây dựng REST API với Node.js, Express và TypeScript. Học các bước thiết kế, validation, middleware và tương tác database.', price: 0,
      sections: [ { title: 'Làm quen backend', lessons: [ ['Node.js là gì?', 'Node.js là môi trường chạy JavaScript phía server. Trong chương này bạn sẽ làm quen với runtime, npm và kiến trúc backend.'], ['Khởi tạo Express', 'Express hỗ trợ định tuyến request, middleware và response. Hãy tạo một ứng dụng API đơn giản.'] ] }, { title: 'Xây dựng REST API', lessons: [ ['CRUD với Prisma', 'Sử dụng Prisma ORM để tạo, truy vấn và sửa dữ liệu an toàn.'], ['Authentication', 'Giới thiệu JWT, hash mật khẩu và middleware xác thực.'] ] } ] },
    { title: 'React & TypeScript thực chiến', description: 'Thành thạo component, state, hooks và kết nối API trong dự án React TypeScript có cấu trúc, giao diện hiện đại.', price: 0,
      sections: [ { title: 'Nền tảng React', lessons: [ ['Component và JSX', 'Component là đơn vị giao diện. JSX cho phép mô tả UI theo cách khai báo.'], ['State và useEffect', 'Sử dụng useState để lưu trạng thái, useEffect cho side effects.'] ] }, { title: 'Làm việc với API', lessons: [ ['Fetch và quản lý dữ liệu', 'Sử dụng fetch để tải dữ liệu và xử lý lỗi từ server.'] ] } ] },
    { title: 'MySQL & thiết kế cơ sở dữ liệu', description: 'Làm chủ mô hình quan hệ, khóa chính, khóa ngoại, chuẩn hóa dữ liệu và các câu truy vấn SQL thường gặp.', price: 0,
      sections: [ { title: 'Nền tảng dữ liệu', lessons: [ ['Thiết kế bảng quan hệ', 'Hiểu primary key, foreign key và tính toàn vẹn tham chiếu.'], ['SELECT và JOIN', 'Truy vấn dữ liệu qua nhiều bảng với INNER JOIN và LEFT JOIN.'] ] } ] },
  ];
  for (const courseData of drafts) {
    const exists = await prisma.course.findFirst({ where: { title: courseData.title, instructorId: instructor.id } });
    if (exists) { console.log('SKIP:', courseData.title); continue; }
    const course = await prisma.course.create({ data: { title: courseData.title, description: courseData.description, price: courseData.price, instructorId: instructor.id, status: 'PUBLISHED', sections: { create: courseData.sections.map((s, si) => ({ title: s.title, position: si, lessons: { create: s.lessons.map(([title, content], li) => ({ title, content, position: li })) } })) } }, include: { sections: { include: { lessons: true } } } });
    const first = course.sections[0]?.lessons[0];
    if (first) await prisma.quiz.create({ data: { lessonId: first.id, title: `Ôn tập: ${first.title}`, questions: { create: [{ text: 'Trong LMS, vai trò nào học các bài giảng và làm bài kiểm tra?', position: 0, options: { create: [{ text: 'STUDENT', isCorrect: true }, { text: 'INSTRUCTOR', isCorrect: false }, { text: 'ADMIN', isCorrect: false }] } }, { text: 'Công nghệ nào được dùng làm cơ sở dữ liệu trong EduMaster?', position: 1, options: { create: [{ text: 'MySQL', isCorrect: true }, { text: 'MongoDB', isCorrect: false }, { text: 'Redis', isCorrect: false }] } }] } } });
    console.log('CREATED:', course.title);
  }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
