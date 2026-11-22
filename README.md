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
- Khu quản trị chia theo từng trang, có danh sách điều hướng tại `/admin`:
  tổng quan, `/admin/menu`, `/admin/orders`, `/admin/revenue`,
  `/admin/health`, `/admin/seo`, `/admin/analytics`, `/admin/payroll`,
  `/admin/staff` và `/admin/accounts`. Quản trị viên tạo tài khoản nhân viên
  tại `/admin/staff`; danh sách tài khoản ở trang riêng. Trang sức khỏe kiểm
  tra API và database; SEO hiển thị domain, sitemap, robots.txt và tình trạng
  metadata; lượt truy cập là lượt xem trang, không phải khách duy nhất.
- Nhân viên đăng nhập để đăng ký giờ làm tại `/shifts`, xem bảng công riêng ở
  `/payroll` và xử lý đơn tại `/orders`. Menu tài khoản hiển thị chức năng phù
  hợp với vai trò; khách hàng có liên kết đến cộng đồng. Nhân viên và quản trị
  viên đã đăng nhập đều có thể đăng ký ca. Chỉ nhân viên và quản trị viên
  được xem trang và dữ liệu lịch làm. Nhân viên xem lịch
  theo từng ngày trong 7 ngày tới, vuốt để xem ngày liền kề và xem lại hai ngày
  trước; chỉ được đăng ký ca chưa qua trong khung 7 ngày. Nhân viên xem lịch
  công theo tháng và lương tạm tính của mình; quản trị viên xem toàn bộ nhân
  sự và xác nhận ngày công. Lịch đăng ký cần quản trị viên xác nhận trước khi
  nhân viên check-in; nút check-in chỉ mở trong ngày ca từ giờ bắt đầu đến giờ
  kết thúc. Nhân viên checkout trong ngày làm, sau đó quản trị viên xác nhận
  ngày công.
  Tổng thời gian tính từ check-in đến check-out, không tự trừ giờ nghỉ. Mỗi ca
  chuẩn tối đa 5 giờ tính 20.000đ/giờ; phần thời gian vượt 5 giờ tính
  30.000đ/giờ. Ca chỉ được tính lương sau khi có đủ check-in/check-out và được
  quản trị viên xác nhận.
- Trang `/admin/menu` có form đăng món mới, xem trước ảnh,
  giới thiệu chi tiết từ 1.001 ký tự, thư viện đúng 3 ảnh, danh sách món hiện
  tại, chỉnh sửa sản phẩm và tùy chọn đánh dấu món bán chạy. Sản phẩm được
  phân vào một trong bốn danh mục: nước ép, cà phê, sinh tố hoặc trà sữa. Món
  được đánh dấu bán chạy sẽ được gợi ý trên trang chi tiết các món khác. Nội
  dung giới thiệu sản phẩm và bài Blog có trình soạn thảo hỗ trợ in đậm,
  in nghiêng, tiêu đề, danh sách, trích dẫn và đường dẫn.
- Blog tại `/blog` hiển thị bài viết công khai; chỉ quản trị viên đã đăng nhập
  mới có thể đăng bài. Trang chi tiết từng bài có đường dẫn `/blog/:blogId`;
  trang sản phẩm hiển thị món gợi ý và ba bài blog mới nhất ở cột bên phải.
- Trang chi tiết món hiển thị phần giới thiệu, điểm trung bình và nhận xét của
  khách hàng. Tài khoản khách hàng đã đăng nhập có thể gửi hoặc cập nhật một
  đánh giá cho mỗi món; tài khoản chưa đăng nhập chỉ xem được đánh giá.
- Khách có thể thêm món vào đơn, chọn dùng tại quán hoặc mang đi và gửi đơn mà
  không cần đăng nhập; nếu đang đăng nhập, đơn được gắn với tài khoản. Khu vực
  đơn hàng mở từ nút nổi cạnh thanh cuộn. Sau khi gửi đơn, khách thấy thẻ QR
  chuyển khoản nền xanh đang chờ ảnh QR của quán và trạng thái chờ thanh toán.
- Nhân viên xử lý đơn tại `/orders` và quản trị viên tại `/admin/orders`,
  chuyển trạng thái từ chờ thanh toán sang đã xác nhận, đang chuẩn bị rồi hoàn
  tất. Trang `/admin/revenue` hiển thị tổng doanh thu chỉ tính các đơn đã hoàn
  tất.
- Quản trị viên được khởi tạo bằng `ADMIN_EMAIL` và `ADMIN_PASSWORD` (tối thiểu
  14 ký tự). Không có tài khoản/mật khẩu quản trị mặc định; đặt hai biến này
  trong `.env` hoặc môi trường chạy, không đưa bí mật vào Git.
- Phiên đăng nhập dùng cookie `HttpOnly`, `SameSite=Lax`, thời hạn 24 giờ; ở
  production cookie được đánh dấu `Secure`.
- Bảng chat tại `/chat` cập nhật bài đăng và bình luận qua Socket.IO. Người dùng
  chỉ xóa bài của mình; quản trị viên có thể xóa bài và bình luận. Trang
  `/admin/accounts` hiển thị danh sách tài khoản.
- Việc tạo tài khoản và đăng nhập được giới hạn tần suất. Các thao tác ghi API
  yêu cầu header cùng nguồn; không bật CORS công khai.

## Dữ liệu

API tự tạo các bảng MySQL cho thực đơn, tài khoản mẫu, đơn hàng, món trong đơn,
địa điểm, bài đăng, phiên đăng nhập và bình luận mẫu. API hiện tại gồm:

- `GET /api/menu`
- `POST /api/orders` (có thể dùng phiên đăng nhập; giá được xác thực từ thực
  đơn phía máy chủ)
- `GET /api/orders`, `PATCH /api/orders/:orderId/status` (yêu cầu phiên nhân
  viên hoặc quản trị viên)
- `GET /api/menu/:menuId/reviews`
- `POST /api/menu/:menuId/reviews` (yêu cầu phiên khách hàng; gửi hoặc cập nhật
  điểm 1–5 sao và nhận xét)
- `POST /api/admin/menu` (yêu cầu phiên admin; tạo món với `name`,
  `category`, `description`, `introduction` dài ít nhất 1.001 ký tự, `price`,
  `galleryImages` gồm đúng 3 URL/alt ảnh khác nhau và `bestSeller`)
- `PUT /api/admin/menu/:menuId` (yêu cầu phiên admin; cập nhật thông tin món)
- Mỗi món có trang riêng tại `/menu/<ten-mon>-<id>`; `/sitemap.xml` liệt kê
  các trang món để công cụ tìm kiếm thu thập.
- `GET /api/locations`
- `GET /api/comments`
- `GET /api/blog`, `GET /api/blog/:blogId`, `POST /api/blog` (POST yêu cầu
  phiên quản trị viên)
- `GET /api/staff-shifts` (yêu cầu phiên nhân viên hoặc quản trị viên; thêm
  `?month=YYYY-MM` để nhân viên xem bảng công của mình hoặc quản trị viên xem
  toàn bộ)
- `POST /api/staff-shifts` (yêu cầu tài khoản nhân viên hoặc quản trị viên),
- `POST /api/staff-shifts/:shiftId/check-in` và
  `POST /api/staff-shifts/:shiftId/check-out` (nhân viên chấm công cho ca của
  mình trong ngày làm)
- `PATCH /api/staff-shifts/:shiftId/attendance` (yêu cầu quản trị viên; sửa
  giờ chấm công), `PATCH /api/staff-shifts/:shiftId/completion` (yêu cầu quản
  trị viên; duyệt hoặc bỏ duyệt ca)
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`,
  `GET /api/auth/me`
- `GET /api/admin/website/health`, `GET /api/admin/website/seo` và
  `GET /api/admin/analytics/page-views` (yêu cầu phiên admin)
- `POST /api/analytics/page-view` (ghi lượt xem theo ngày và đường dẫn; không
  lưu IP hoặc thông tin nhận dạng cá nhân, bỏ qua các trang quản trị/đăng nhập)
- `GET /api/posts`, `POST /api/posts`, `POST /api/posts/:postId/comments`,
  `POST /api/admin/staff` (yêu cầu phiên admin)
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
cộng. Đặt `SITE_URL` thành URL HTTPS chính thức của website để sitemap dùng
đúng domain khi triển khai.

SQLite local cũ (nếu có) vẫn nằm trên máy và không được tự chuyển sang MySQL;
MySQL mới sẽ được khởi tạo bằng dữ liệu seed mẫu. Cần xuất/nhập dữ liệu riêng
nếu muốn giữ các đăng ký, bài viết hoặc dữ liệu phát sinh trên SQLite.
