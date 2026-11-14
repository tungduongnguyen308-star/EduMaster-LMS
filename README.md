<div align="center">

# 🎓 EduMaster LMS

### HỆ THỐNG QUẢN LÝ HỌC TẬP TRỰC TUYẾN

**Learning Management System — Đồ án / dự án thực hành Full-stack**

**Node.js · Express · TypeScript · MySQL · Prisma · React · Vite**

[Giới thiệu](#1-giới-thiệu) · [Cài đặt](#5-cài-đặt-và-chạy-trên-windows) · [Hướng dẫn sử dụng](#7-hướng-dẫn-sử-dụng-theo-vai-trò) · [API](#8-api-chính) · [Khắc phục lỗi](#11-các-lỗi-thường-gặp)

</div>

---

## 1. Giới thiệu

**EduMaster** là ứng dụng quản lý học tập trực tuyến (LMS), xây dựng theo kiến trúc **frontend – REST API – database**. Hệ thống hỗ trợ ba vai trò **Học viên (STUDENT)**, **Giảng viên (INSTRUCTOR)** và **Quản trị viên (ADMIN)**, đáp ứng các luồng nghiệp vụ chính từ đăng ký tài khoản đến quản lý khóa học, học bài, theo dõi tiến độ và làm bài kiểm tra trắc nghiệm.

Dự án phục vụ **mục đích học tập, trình diễn và đồ án**; chưa phải một nền tảng thương mại sẵn sàng triển khai công khai cho người dùng thật. Những giới hạn cần lưu ý được mô tả tại [mục 13](#13-giới-hạn-và-hướng-phát-triển).

### Mục tiêu

- Vận dụng Node.js, Express và TypeScript để phát triển REST API theo module và middleware.
- Sử dụng MySQL 8 và Prisma ORM để tổ chức, truy vấn và quản lý dữ liệu.
- Triển khai xác thực JWT, Refresh Token và phân quyền dựa trên vai trò (RBAC).
- Xây dựng giao diện SPA bằng React và TypeScript.
- Tổ chức quy trình học tập gồm khóa học → chương → bài giảng → quiz → tiến độ.
- Thực hành kiểm thử API, migration, Docker và CI.

## 2. Công nghệ sử dụng

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| Frontend | React 19, TypeScript, Vite 7, React Router, Lucide | Giao diện và định tuyến |
| Backend | Node.js, Express 5, TypeScript | REST API, xử lý nghiệp vụ |
| Database | MySQL 8.x | Lưu người dùng, khóa học, nội dung và kết quả học tập |
| ORM / Migration | Prisma 6 | Truy vấn, quản lý schema, migration |
| Xác thực | JWT, bcrypt | Access Token, Refresh Token, mã hóa mật khẩu |
| Kiểm tra dữ liệu | Zod | Xác thực dữ liệu đầu vào API |
| API / Testing | Swagger/OpenAPI, Postman, Jest | Tài liệu và kiểm thử |
| Triển khai | Docker Compose, Nginx, GitHub Actions | Môi trường container, phục vụ frontend, CI |

**Phiên bản:** xem chính xác tại `backend/package.json` và `frontend/package.json`. Có thể dùng Node.js **22.x** tương ứng với Dockerfile/CI của dự án; khi dùng phiên bản khác cần kiểm tra tính tương thích của native dependencies.

## 3. Chức năng chính

### 3.1. Học viên (STUDENT)

- Đăng ký, đăng nhập và đăng xuất tài khoản.
- Tìm kiếm, xem danh sách và chi tiết khóa học đã xuất bản.
- Đăng ký **khóa học miễn phí**.
- Xem nội dung, đường dẫn video và tài liệu của bài giảng được phép truy cập.
- Đánh dấu hoàn thành bài học, theo dõi tiến độ khóa học.
- Làm bài trắc nghiệm, nộp đáp án, xem điểm và lịch sử làm bài.
- Đánh giá khóa học.

### 3.2. Giảng viên (INSTRUCTOR)

- Tạo, chỉnh sửa, xóa **khóa học do mình quản lý**.
- Thêm/sửa/xóa chương học, bài giảng và đường dẫn tài liệu.
- Biên soạn quiz trắc nghiệm theo bài giảng; thêm câu hỏi và đáp án.
- Xem danh sách khóa học trong không gian giảng dạy.
- Khóa học tạo mới có trạng thái **DRAFT** và cần Admin xuất bản nếu muốn hiển thị cho học viên.

> **Lưu ý phiên bản giao diện:** Nút **Xóa chương** và nút **Xóa bài giảng** có trong bản vá `EduMaster_Va_Xoa_Chuong_BaiGiang.zip`. Nếu đã chép hai file `frontend/src/App.tsx` và `frontend/src/styles.css` từ bản vá này, giảng viên có thể thao tác xóa trực tiếp trên giao diện. Backend đã có API DELETE tương ứng.

### 3.3. Quản trị viên (ADMIN)

- Xem thống kê tổng quan hệ thống.
- Xem danh sách người dùng; phân quyền STUDENT / INSTRUCTOR / ADMIN.
- Quản lý danh sách khóa học và trạng thái **DRAFT / PUBLISHED / ARCHIVED**.
- Quản lý nội dung giảng dạy theo quyền quản trị.

### 3.4. Bảo mật cơ bản

- Mật khẩu được hash bằng **bcrypt**, không lưu trực tiếp mật khẩu gốc trong cột `password`.
- JWT Access Token dùng để gọi API bảo vệ.
- Refresh Token được lưu trong database ở dạng hash; có cơ chế xoay vòng và thu hồi khi đăng xuất.
- Middleware kiểm tra quyền và quyền sở hữu khóa học trước khi sửa/xóa dữ liệu.
- Đáp án đúng không được đưa vào phản hồi API quiz dành cho học viên trước khi nộp bài.

## 4. Kiến trúc và cấu trúc thư mục

```text
EduMaster/
├── .github/
│   └── workflows/ci.yml              # GitHub Actions CI
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # Các model Prisma
│   │   └── migrations/               # Lịch sử thay đổi database
│   ├── postman/                       # Postman Collection
│   ├── scripts/
│   │   ├── promote-user.ts            # Cấp/chỉnh quyền người dùng
│   │   ├── seed-demo.ts               # Tạo khóa học mẫu
│   │   └── test-auth.ps1              # Kiểm thử Authentication
│   ├── src/
│   │   ├── app.ts                     # Cấu hình Express và route
│   │   ├── server.ts                  # Kết nối MySQL, chạy server
│   │   ├── config/prisma.ts           # Khởi tạo Prisma Client
│   │   ├── controllers/               # Auth controller
│   │   ├── services/                  # Auth service
│   │   ├── routes/                    # Auth, course, student, quiz, admin
│   │   ├── middleware/                # Xác thực, phân quyền
│   │   ├── lib/                       # HTTP helper, chấm điểm quiz
│   │   ├── utils/                     # JWT helper
│   │   └── docs/                      # Đặc tả OpenAPI
│   ├── tests/                         # Kiểm thử Jest
│   ├── .env.example                   # Mẫu biến môi trường
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx                    # Trang và luồng giao diện
│   │   ├── api.ts                     # Gọi API, quản lý phiên
│   │   ├── main.tsx                   # Entry point React
│   │   └── styles.css                 # Style giao diện
│   ├── vite.config.ts                 # Vite + proxy /api
│   ├── package.json
│   ├── nginx.conf
│   └── Dockerfile
├── .env.docker.example
├── docker-compose.yml
├── CHAY_NHANH_WINDOWS.md
└── README.md
```

Luồng xử lý:

```text
Trình duyệt / React (localhost:5173)
       │ HTTP / JSON, Bearer JWT
       ▼
Express REST API (localhost:5000)
       │ Routes → Middleware → Controllers / Services
       ▼
Prisma Client
       │
       ▼
MySQL (localhost:3306 trên Windows)
```

**Các model cơ sở dữ liệu chính:** `User`, `Course`, `Section`, `Lesson`, `Enrollment`, `LessonProgress`, `Review`, `RefreshToken`, `Quiz`, `QuizQuestion`, `QuizOption`, `QuizAttempt`, `QuizAnswer`, `LessonResource`.

## 5. Cài đặt và chạy trên Windows

### 5.1. Chuẩn bị

- Windows 10/11, VS Code.
- Node.js và npm (`node -v`, `npm -v`).
- MySQL Server 8.x đang chạy ở `localhost:3306` (nếu chạy trực tiếp trên Windows).
- Có thể dùng MySQL Workbench để kiểm tra bảng và tài khoản.
- Trình duyệt hiện đại để mở React.

**Với dự án đã làm và có dữ liệu:** trước khi chép bản vá hoặc migration mới, sao lưu thư mục dự án **và** database `edumaster_db`. Giữ file `backend/.env` hiện tại; không đưa file này lên Git.

### 5.2. Cấu hình MySQL và `.env`

Nếu chưa có database, vào MySQL với tài khoản đủ quyền và tạo:

```sql
CREATE DATABASE IF NOT EXISTS edumaster_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Vào thư mục backend và tạo `.env` nếu chưa có:

```powershell
cd C:\Users\tungd\Downloads\EduMaster\backend
Copy-Item .env.example .env
```

Mẫu cấu hình:

```dotenv
DATABASE_URL="mysql://YOUR_DB_USER:YOUR_URL_ENCODED_PASSWORD@localhost:3306/edumaster_db"
JWT_SECRET="YOUR_RANDOM_SECRET_AT_LEAST_32_CHARACTERS"
PORT=5000
CLIENT_URL="http://localhost:5173"
```

Tạo khóa JWT ngẫu nhiên trong PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Dán khóa vào `JWT_SECRET`. Mật khẩu MySQL có ký tự đặc biệt (`@`, `#`, `%`, `:`...) cần **URL-encode** trong `DATABASE_URL`. Khuyến nghị dùng tài khoản DB riêng cho ứng dụng, thay vì sử dụng `root` lâu dài. Không chia sẻ ảnh chứa `.env`, mật khẩu hoặc Access/Refresh Token.

### 5.3. Cài và chạy backend

Mở **Terminal 1** tại `backend/`:

```powershell
cd C:\Users\tungd\Downloads\EduMaster\backend
npm install
npx prisma validate
npx prisma migrate status
npx prisma migrate deploy
npx prisma generate
npx tsc --noEmit
npm run dev
```

**Quan trọng:**

- `migrate deploy` áp dụng migration có sẵn; không tự xóa dữ liệu để tạo schema mới.
- Nếu lệnh báo cần reset, drift hoặc xung đột migration, **không xác nhận xóa dữ liệu**; kiểm tra nguyên nhân và sao lưu trước.
- Khi chạy `prisma generate` trên Windows, hãy dừng backend và Prisma Studio đang sử dụng Client cũ để tránh lỗi khóa DLL `EPERM`.

Thông báo mong đợi:

```text
MySQL connected successfully!
Server running at http://localhost:5000
```

Kiểm tra:

- API: http://localhost:5000/
- Health: http://localhost:5000/api/health
- Swagger UI: http://localhost:5000/api/docs
- OpenAPI JSON: http://localhost:5000/api/openapi.json

### 5.4. Cài và chạy frontend

Mở **Terminal 2** (giữ Terminal 1 chạy):

```powershell
cd C:\Users\tungd\Downloads\EduMaster\frontend
npm install
npm run dev
```

Mở: **http://localhost:5173**.

Trong chế độ phát triển, Vite chuyển tiếp các request `/api` tới `http://localhost:5000` qua cấu hình `frontend/vite.config.ts`.

### 5.5. Lệnh thường dùng

| Vị trí | Lệnh | Mục đích |
|---|---|---|
| `backend/` | `npm run dev` | Backend chế độ watch |
| `backend/` | `npm run build` | Biên dịch TypeScript |
| `backend/` | `npm run start` | Chạy mã đã build |
| `backend/` | `npm run typecheck` | Kiểm tra lỗi kiểu |
| `backend/` | `npx prisma migrate status` | Kiểm tra migration |
| `backend/` | `npx prisma migrate deploy` | Áp dụng migration có sẵn |
| `backend/` | `npx prisma generate` | Tạo Prisma Client |
| `backend/` | `npx prisma studio` | Xem dữ liệu database |
| `frontend/` | `npm run dev` | Chạy React/Vite |
| `frontend/` | `npm run build` | Build frontend |
| `frontend/` | `npm run preview` | Xem bản build |

## 6. Tài khoản, phân quyền và dữ liệu mẫu

### 6.1. Đăng ký tài khoản

Truy cập **http://localhost:5173/register** và đăng ký với email riêng, mật khẩu mạnh. Tài khoản mới được cấp quyền **STUDENT** theo mặc định.

Không có tài khoản Admin hoặc Instructor cố định cùng mật khẩu công khai trong mã nguồn.

### 6.2. Cấp quyền cho giảng viên hoặc quản trị viên

Sau khi **tài khoản đã được đăng ký thành công**, từ terminal `backend/` chạy:

```powershell
npm run promote -- "instructor@example.com" INSTRUCTOR
npm run promote -- "admin@example.com" ADMIN
```

Thay email mẫu bằng email bạn đã đăng ký. Nếu thấy:

```text
Account not found: register first, then promote
```

nghĩa là tài khoản chưa tồn tại trong database hiện tại; hãy đăng ký trước. Sau khi nâng quyền, **đăng xuất và đăng nhập lại** để giao diện cập nhật vai trò.

> Lệnh `promote` là tiện ích dành cho người vận hành backend. Không cho phép người dùng tự đăng ký thành `ADMIN` qua form công khai.

### 6.3. Tạo khóa học mẫu

Sau khi đã có tài khoản `INSTRUCTOR` hoặc `ADMIN`, chạy:

```powershell
npm run seed:demo -- "instructor@example.com"
```

Script tạo tối đa ba khóa mẫu nếu chưa tồn tại với giảng viên đó:

1. Node.js & Express từ cơ bản.
2. React & TypeScript thực chiến.
3. MySQL & thiết kế cơ sở dữ liệu.

Khóa mẫu có các chương, bài học và quiz; được đặt `PUBLISHED` để có thể xem ngay trên trang chủ. Script có kiểm tra để tránh tạo trùng theo tiêu đề và giảng viên; **không thay thế nội dung khóa cũ**.

## 7. Hướng dẫn sử dụng theo vai trò

### 7.1. Học viên

1. Vào `/register` hoặc `/login`.
2. Ở trang chủ (`/`), xem danh sách và chọn một khóa học.
3. Tại `/courses/:id`, nhấn đăng ký đối với khóa học **miễn phí**.
4. Mở `/my-learning`, chọn khóa học đã đăng ký để học.
5. Tại `/learn/:courseId/:lessonId?`, xem bài và đánh dấu hoàn thành.
6. Nếu bài học có quiz, vào `/quiz/:lessonId` để trả lời và xem điểm.

### 7.2. Giảng viên

1. Đăng nhập bằng tài khoản `INSTRUCTOR`.
2. Chọn **Giảng dạy** hoặc vào `/instructor`.
3. Tạo khóa học mới: **Tên khóa học**, **Mô tả**, **Học phí** (để thử đăng ký trong demo, nhập `0`).
4. Chọn khóa đã tạo, thêm chương; trong mỗi chương thêm bài giảng, nội dung, URL video hoặc tài liệu.
5. Thêm quiz trắc nghiệm và chọn đáp án đúng.
6. Nhờ Admin đổi trạng thái khóa học từ `DRAFT` sang `PUBLISHED`.
7. Có thể chỉnh sửa/xóa nội dung mình sở hữu; **xóa chương sẽ làm mất các bài liên quan** và có thể xóa dữ liệu học tập phụ thuộc.

### 7.3. Quản trị viên

1. Đăng nhập bằng tài khoản `ADMIN`, vào `/admin`.
2. Mở phần **Người dùng** để xem và cấp vai trò.
3. Mở phần **Khóa học** để xuất bản (`PUBLISHED`) hoặc lưu trữ (`ARCHIVED`).
4. Xem thống kê tổng quan; có thể truy cập giao diện giảng dạy để quản lý nội dung.

### 7.4. Các đường dẫn giao diện

| Trang | URL |
|---|---|
| Danh sách khóa học | `http://localhost:5173/` |
| Đăng nhập | `http://localhost:5173/login` |
| Đăng ký | `http://localhost:5173/register` |
| Chi tiết khóa học | `http://localhost:5173/courses/:id` |
| Khóa học của tôi | `http://localhost:5173/my-learning` |
| Học bài | `http://localhost:5173/learn/:courseId/:lessonId?` |
| Làm quiz | `http://localhost:5173/quiz/:lessonId` |
| Giảng dạy | `http://localhost:5173/instructor` |
| Quản trị | `http://localhost:5173/admin` |

## 8. API chính

Các API yêu cầu đăng nhập sử dụng header:

```http
Authorization: Bearer <ACCESS_TOKEN>
```

### Xác thực

| Phương thức | Endpoint | Chức năng |
|---|---|---|
| `POST` | `/api/auth/register` | Tạo tài khoản Student |
| `POST` | `/api/auth/login` | Đăng nhập, trả Access/Refresh Token |
| `POST` | `/api/auth/refresh` | Xoay vòng Refresh Token |
| `POST` | `/api/auth/logout` | Thu hồi Refresh Token |
| `GET` | `/api/auth/me` | Lấy thông tin người dùng đăng nhập |

### Khóa học, chương, bài giảng

| Phương thức | Endpoint | Chức năng |
|---|---|---|
| `GET` | `/api/courses?search=&page=&limit=` | Danh sách khóa công khai |
| `GET` | `/api/courses/:id` | Chi tiết khóa công khai |
| `GET` | `/api/courses/mine` | Khóa giảng viên/Admin quản lý |
| `GET` | `/api/courses/manage/:id` | Chi tiết khóa để biên tập |
| `POST` | `/api/courses` | Tạo khóa học |
| `PATCH`, `DELETE` | `/api/courses/:id` | Sửa/xóa khóa học |
| `POST` | `/api/courses/:id/sections` | Thêm chương |
| `PATCH`, `DELETE` | `/api/course-content/sections/:id` | Sửa/xóa chương |
| `POST` | `/api/course-content/sections/:id/lessons` | Thêm bài giảng |
| `PATCH`, `DELETE` | `/api/course-content/lessons/:id` | Sửa/xóa bài giảng |
| `GET` | `/api/course-content/lessons/:id/content` | Lấy nội dung bài theo quyền |
| `POST` | `/api/course-content/lessons/:id/resources` | Thêm liên kết tài liệu |
| `DELETE` | `/api/course-content/resources/:id` | Xóa liên kết tài liệu |

### Học tập, quiz, quản trị

| Phương thức | Endpoint | Chức năng |
|---|---|---|
| `GET` | `/api/enrollments/me` | Khóa học đã đăng ký, tiến độ |
| `POST` | `/api/enrollments/courses/:id` | Đăng ký khóa miễn phí |
| `PATCH` | `/api/enrollments/lessons/:id/progress` | Đánh dấu hoàn thành bài |
| `PUT` | `/api/enrollments/courses/:id/review` | Đánh giá khóa học |
| `PUT` | `/api/quizzes/lessons/:id` | Tạo hoặc thay quiz của bài |
| `GET` | `/api/quizzes/lessons/:id` | Lấy quiz cho học viên |
| `POST` | `/api/quizzes/:id/submit` | Nộp và chấm bài |
| `GET` | `/api/quizzes/:id/attempts` | Lịch sử làm bài |
| `GET` | `/api/admin/stats` | Thống kê |
| `GET` | `/api/admin/users` | Danh sách người dùng |
| `PATCH` | `/api/admin/users/:id/role` | Chỉnh quyền |
| `GET` | `/api/admin/courses` | Tất cả khóa học |
| `PATCH` | `/api/admin/courses/:id/status` | Duyệt/xuất bản/lưu trữ |

**Tài liệu API:** http://localhost:5000/api/docs hoặc `/api/openapi.json`. Swagger UI dùng tài nguyên CDN nên cần Internet để hiển thị giao diện; JSON OpenAPI vẫn lấy trực tiếp từ backend.

## 9. Kiểm thử

### Kiểm tra biên dịch và dữ liệu

```powershell
# Tại backend/
npm run typecheck
npm test
npx prisma migrate status

# Tại frontend/
npm run build
```

### Kiểm thử Authentication bằng PowerShell

Đảm bảo backend đang chạy tại `localhost:5000`:

```powershell
cd C:\Users\tungd\Downloads\EduMaster\backend
powershell -ExecutionPolicy Bypass -File .\scripts\test-auth.ps1
```

Script kiểm tra đăng ký → đăng nhập → `/me` → xoay vòng Refresh Token → logout → từ chối token đã thu hồi. **Script có tạo tài khoản test ngẫu nhiên** trong database.

### Postman

Import file `backend/postman/EduMaster.postman_collection.json` vào Postman để thực hiện kiểm thử API theo vai trò. Không chia sẻ các bản export chứa Access/Refresh Token thật.

> Kết quả kiểm thử phụ thuộc môi trường máy chạy. README mô tả phương án kiểm tra và kết quả dự kiến, **không khẳng định mọi chức năng đã được xác nhận chạy tích hợp trên mọi máy**.

## 10. Chạy bằng Docker Compose (tùy chọn)

Docker tạo một **database MySQL riêng**; không tự sử dụng database đang chạy dưới dịch vụ MySQL80 trên Windows.

Tại thư mục gốc:

```powershell
cd C:\Users\tungd\Downloads\EduMaster
Copy-Item .env.docker.example .env.docker
```

Mở `.env.docker`, nhập mật khẩu mạnh cho `DB_ROOT_PASSWORD`, `DB_PASSWORD` và khóa `JWT_SECRET` ngẫu nhiên. Không commit file này.

```powershell
docker compose --env-file .env.docker up -d --build
docker compose --env-file .env.docker ps
```

| Dịch vụ | Địa chỉ |
|---|---|
| React qua Nginx | http://localhost:8080 |
| API Express | http://localhost:5000 |
| MySQL Docker | `127.0.0.1:3307` (host) |
| MySQL trong Docker network | `db:3306` |

**Lưu ý:** Nếu backend trên Windows đang sử dụng cổng `5000`, phải dừng tiến trình đó trước khi chạy Docker backend. **Không chạy `docker compose down -v`** nếu cần giữ dữ liệu vì `-v` xóa Docker volume.

## 11. Các lỗi thường gặp

<details>
<summary><strong>Prisma: Property 'refreshToken' does not exist on type PrismaClient</strong></summary>

Migration có thể đã chạy nhưng Prisma Client chưa generate đúng phiên bản. Dừng backend và Prisma Studio, rồi tại `backend/`:

```powershell
npx prisma migrate status
npx prisma generate
npx tsc --noEmit
```

Nếu VS Code vẫn hiện gạch đỏ dù `tsc` thành công: `Ctrl + Shift + P` → **TypeScript: Restart TS Server**.
</details>

<details>
<summary><strong>Prisma: EPERM khi thay query_engine-windows.dll.node</strong></summary>

Windows đang khóa native DLL. Dừng `npm run dev` và Prisma Studio; chỉ kết thúc đúng tiến trình Node.js của EduMaster, không dừng dịch vụ MySQL. Sau đó chạy lại `npx prisma generate`. Nếu cần, khởi động lại Windows và generate **trước khi chạy backend**.
</details>

<details>
<summary><strong>Frontend: ERR_DLOPEN_FAILED / Application Control blocked Rollup</strong></summary>

Đây là chính sách bảo mật Windows chặn module native `rollup.win32-x64-msvc.node`; **không phải** lỗi MySQL và không nhất thiết do thiếu package. Dự án đã có bản vá `EduMaster_Va_Frontend_Rollup_WASM.zip`, sử dụng Rollup WebAssembly qua cấu hình `overrides` trong `frontend/package.json`.

Nếu bạn đã áp dụng bản vá, kiểm tra có `overrides.vite.rollup` trỏ tới `npm:@rollup/wasm-node`, rồi tại `frontend/`:

```powershell
# Sao lưu package.json nếu đã tự sửa
Remove-Item -Recurse -Force .\node_modules
Remove-Item .\package-lock.json -ErrorAction SilentlyContinue
npm install
npm run dev
```

Không tắt Windows Defender hay chính sách Application Control để chạy thư viện chưa được kiểm chứng. Nếu máy do trường/công ty quản lý, nhờ quản trị viên hỗ trợ chính sách thực thi.
</details>

<details>
<summary><strong>API báo Cannot POST /api/auth/login hoặc 404</strong></summary>

Kiểm tra backend đang chạy đúng thư mục, `backend/src/app.ts` đã `app.use('/api/auth', authRoutes)`, `auth.routes.ts` có khai báo route, rồi khởi động lại `npm run dev`. Dùng `http://localhost:5000/api/health` để kiểm tra server.
</details>

<details>
<summary><strong>npm run promote báo Account not found</strong></summary>

Tài khoản email truyền vào chưa có trong database hiện tại. Đăng ký tại `/register` rồi mới chạy `npm run promote -- "email@example.com" ADMIN` hoặc `INSTRUCTOR`.
</details>

<details>
<summary><strong>Trang chủ không có khóa học</strong></summary>

Cần có khóa học trạng thái `PUBLISHED`. Admin có thể duyệt các khóa giảng viên tạo hoặc dùng `npm run seed:demo -- "instructor@example.com"` sau khi tạo và cấp quyền Instructor.
</details>

<details>
<summary><strong>MySQL Access denied / lỗi kết nối</strong></summary>

Kiểm tra MySQL80 đang chạy, cấu hình user/password/port trong `backend/.env` và quyền truy cập `edumaster_db`. Không đổi cổng hoặc reset mật khẩu khi chưa xác minh nguyên nhân; Docker và MySQL Windows có thể dùng hai database khác nhau. Không chụp hoặc gửi mật khẩu.
</details>

## 12. Quy trình phát triển qua 9 giai đoạn

| Giai đoạn | Nội dung |
|---|---|
| 1 | Khởi tạo Node.js, Express, TypeScript, MySQL và Prisma |
| 2 | Authentication: Register, Login, JWT, Refresh Token, Logout |
| 3 | Phân quyền STUDENT, INSTRUCTOR, ADMIN bằng middleware |
| 4 | Quản lý khóa học: CRUD, tìm kiếm, phân trang |
| 5 | Nội dung học: chương, bài giảng, video URL và tài liệu |
| 6 | Đăng ký học, đánh dấu hoàn thành và tính tiến độ |
| 7 | Quiz trắc nghiệm, nộp bài, tự động chấm điểm |
| 8 | React SPA cho ba nhóm người dùng |
| 9 | Kiểm thử, tài liệu API, CI, Docker Compose |

## 13. Giới hạn và hướng phát triển

**Đã triển khai ở mức demo:** các luồng cơ bản của 9 giai đoạn, dùng MySQL/Prisma; bảo vệ API bằng JWT và phân quyền; thao tác qua giao diện React.

**Chưa tích hợp hoặc chưa đủ mức production:**

- Chưa có cổng thanh toán. Hệ thống hiện **không cho học viên đăng ký khóa học có phí** nếu chưa thanh toán.
- Video và tài liệu lưu **URL tham chiếu**, chưa tích hợp upload file, CDN/streaming riêng hay quét file độc hại.
- Refresh Token đang được frontend lưu bằng `sessionStorage` ở bản demo; với production nên thiết kế lại bằng `HttpOnly + Secure + SameSite` cookie và bảo vệ CSRF thích hợp.
- Quiz chỉ chấm câu trắc nghiệm; chưa có tự luận và chưa thực thi giới hạn thời gian quiz ở phía server.
- Khi **thay thế quiz**, dữ liệu lượt làm bài cũ có thể bị xóa theo quan hệ dữ liệu; nên version hóa bài kiểm tra nếu triển khai thực tế.
- Cần bổ sung audit log, rate limiting, giám sát, kiểm thử bảo mật, khôi phục mật khẩu và backup/restore tự động trước khi triển khai công khai.

## 14. Thông tin dự án

| Mục | Nội dung |
|---|---|
| Tên hệ thống | EduMaster LMS |
| Loại dự án | Ứng dụng quản lý học tập trực tuyến |
| Kiến trúc | React SPA + Express REST API + Prisma ORM + MySQL |

---

<div align="center">

**EduMaster LMS — Học tập chủ động · Quản lý hiệu quả · Phát triển kỹ năng**

*© 2026 EduMaster — Tài liệu hướng dẫn dự án học tập.*

</div>
