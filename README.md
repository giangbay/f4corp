# Mộc Nhiên Coffee

Ứng dụng React + Vite cho giao diện quán cà phê, với API Express và dịch vụ
MySQL chạy riêng bằng Docker Compose.

## Chạy trên máy

Yêu cầu Node.js 22.13 trở lên, Docker Engine và Docker Compose.

```sh
cp .env.example .env
# Edit .env and set unique passwords before starting the database.
npm install
npm run db:up
npm run dev
```

Sao chép `.env.example` thành `.env` và điền mật khẩu dài, ngẫu nhiên cho
`MYSQL_PASSWORD` và `MYSQL_ROOT_PASSWORD` trước khi chạy. `npm run db:up` khởi
động MySQL 8.4; API chạy ở máy chủ Node riêng và kết nối qua `MYSQL_HOST`/
`MYSQL_PORT`. Bản Vite chuyển tiếp `/api` và `/socket.io` đến API ở
`http://localhost:3001`. Lần đầu API chạy, nó tạo schema và dữ liệu seed mẫu.
Điền `ADMIN_EMAIL` và `ADMIN_PASSWORD` (tối thiểu 14 ký tự) nếu cần tạo tài
khoản quản trị; để trống hai biến này thì không tạo admin.

Các lệnh cơ sở dữ liệu:

```sh
npm run db:logs
npm run db:down
```

Volume `mysql_data` lưu dữ liệu MySQL qua các lần khởi động. `npm run db:down`
giữ volume và dữ liệu. Chỉ khi cần xóa dữ liệu local hoàn toàn mới chạy
`docker compose down --volumes`; lệnh này sẽ xóa database local.

Tạo bản build và chạy bằng Express:

```sh
npm run build
npm start
```

## Đăng nhập và cộng đồng

- Khách hàng tạo tài khoản tại `/login`; vai trò được gán phía máy chủ và mật
  khẩu được băm bằng scrypt.
- Quản trị viên được khởi tạo bằng `ADMIN_EMAIL` và `ADMIN_PASSWORD` (tối thiểu
  14 ký tự). Không có tài khoản/mật khẩu quản trị mặc định; đặt hai biến này
  trong `.env` hoặc môi trường chạy, không đưa bí mật vào Git.
- Phiên đăng nhập dùng cookie `HttpOnly`, `SameSite=Lax`, thời hạn 24 giờ; ở
  production cookie được đánh dấu `Secure`.
- Bảng chat tại `/chat` cập nhật bài đăng và bình luận qua Socket.IO. Người dùng
  chỉ xóa bài của mình; quản trị viên có thể xóa bài và bình luận. Trang
  `/admin` hiển thị danh sách tài khoản.
- Việc tạo tài khoản và đăng nhập được giới hạn tần suất. Các thao tác ghi API
  yêu cầu header cùng nguồn; không bật CORS công khai.

## Dữ liệu

API tự tạo các bảng MySQL cho thực đơn, tài khoản mẫu, đơn hàng, món trong đơn,
địa điểm, bài đăng, phiên đăng nhập và bình luận mẫu. API hiện tại gồm:

- `GET /api/menu`
- `GET /api/locations`
- `GET /api/comments`
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`,
  `GET /api/auth/me`
- `GET /api/posts`, `POST /api/posts`, `POST /api/posts/:postId/comments`
- Các thao tác quản trị tài khoản/bình luận yêu cầu phiên admin.

Tài khoản và đơn hàng mẫu cũ không có mật khẩu đăng nhập. Tài khoản admin chỉ
được tạo lần đầu khi cấu hình biến môi trường; nếu email admin đã tồn tại với
vai trò khác, máy chủ sẽ dừng thay vì tự nâng quyền tài khoản đó.

## Git, triển khai và dữ liệu hiện có

Git nên lưu `docker-compose.yml`, `.env.example`, schema/seed và mã nguồn; không
commit `.env`, mật khẩu, bản dump database hoặc thư mục/volume MySQL. Database
local không tự được đẩy lên Git. Khi triển khai, tạo MySQL riêng trên server
hoặc dịch vụ managed, cấu hình các biến `MYSQL_*` và `ADMIN_*` trong secret
manager của môi trường đó, rồi chạy API. Không mở cổng MySQL ra Internet công
cộng.

SQLite local cũ (nếu có) vẫn nằm trên máy và không được tự chuyển sang MySQL;
MySQL mới sẽ được khởi tạo bằng dữ liệu seed mẫu. Cần xuất/nhập dữ liệu riêng
nếu muốn giữ các đăng ký, bài viết hoặc dữ liệu phát sinh trên SQLite.
