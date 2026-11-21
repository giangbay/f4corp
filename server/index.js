import "dotenv/config";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { Server as SocketServer } from "socket.io";
import { closeDatabase, database, execute, initializeDatabase, many, one } from "./database.js";
import { getMenuItemPath } from "../src/menuSlug.js";
import {
  bootstrapAdmin,
  clearSessionCookie,
  createSession,
  getSessionUser,
  hashPassword,
  hashSessionToken,
  readSessionToken,
  requireAdmin,
  requireAuth,
  requireStaffOrAdmin,
  sessionCookie,
  verifyPassword,
} from "./auth.js";

await initializeDatabase();
await bootstrapAdmin();

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer);
const port = Number(process.env.PORT ?? 3001);
const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const isProduction =
  process.env.NODE_ENV === "production" || process.argv.includes("--production");

app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "https://images.unsplash.com"],
      "connect-src": ["'self'", "ws:", "wss:"],
    },
  },
}));
app.use(express.json({ limit: "32kb" }));
app.use("/api/auth", (_request, response, next) => {
  response.setHeader("Cache-Control", "no-store");
  next();
});
app.use("/api", (request, response, next) => {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
    request.get("x-requested-with") !== "XMLHttpRequest"
  ) {
    response.status(403).json({ error: "Yêu cầu không hợp lệ." });
    return;
  }
  next();
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Bạn đã thử quá nhiều lần. Vui lòng chờ và thử lại." },
});
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Bạn đã tạo quá nhiều tài khoản. Vui lòng thử lại sau." },
});
const chatWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Bạn đang gửi quá nhanh. Vui lòng chờ một chút." },
});

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

function setSessionCookie(response, token, expiresAt) {
  response.setHeader("Set-Cookie", sessionCookie(token, expiresAt, isProduction));
}

async function getUserById(id) {
  return await one(`
    SELECT id, name, email, role
    FROM users
    WHERE id = ?
  `, [id]);
}

async function getPostById(id) {
  const post = await one(`
    SELECT posts.id, posts.content, posts.created_at AS createdAt,
      users.id AS userId, users.name AS authorName, users.role AS authorRole
    FROM posts
    JOIN users ON users.id = posts.user_id
    WHERE posts.id = ?
  `, [id]);
  if (!post) return null;

  const comments = await many(`
    SELECT comments.id, comments.message, comments.created_at AS createdAt,
      users.id AS userId, users.name AS authorName, users.role AS authorRole
    FROM comments
    JOIN users ON users.id = comments.user_id
    WHERE comments.post_id = ?
    ORDER BY comments.id
  `, [id]);

  return {
    id: post.id,
    content: post.content,
    createdAt: post.createdAt,
    author: { id: post.userId, name: post.authorName, role: post.authorRole },
    comments: comments.map((comment) => ({
      id: comment.id,
      message: comment.message,
      createdAt: comment.createdAt,
      author: {
        id: comment.userId,
        name: comment.authorName,
        role: comment.authorRole,
      },
    })),
  };
}

async function authenticateSocket(socket, next) {
  try {
    const cookies = socket.handshake.headers.cookie ?? "";
    const token = cookies
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("moc_session="))
      ?.slice("moc_session=".length);
    socket.data.user = await getSessionUser(token ? decodeURIComponent(token) : null);
    next();
  } catch (error) {
    next(error);
  }
}

io.use(authenticateSocket);
io.on("connection", (socket) => {
  socket.join("chat");
});

app.get("/api/auth/me", asyncRoute(async (request, response) => {
  response.json({ user: await getSessionUser(readSessionToken(request)) });
}));

app.post(
  "/api/auth/register",
  registrationLimiter,
  asyncRoute(async (request, response) => {
    const name = typeof request.body?.name === "string" ? request.body.name.trim() : "";
    const email =
      typeof request.body?.email === "string"
        ? request.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof request.body?.password === "string" ? request.body.password : "";

    if (name.length < 2 || name.length > 60) {
      response.status(400).json({ error: "Tên cần có từ 2 đến 60 ký tự." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      response.status(400).json({ error: "Vui lòng nhập email hợp lệ." });
      return;
    }
    if (password.length < 10 || password.length > 128) {
      response.status(400).json({ error: "Mật khẩu cần có từ 10 đến 128 ký tự." });
      return;
    }

    const passwordHash = await hashPassword(password);
    let result;
    try {
      result = await execute(`
        INSERT INTO users (name, email, role, password_hash)
        VALUES (?, ?, 'customer', ?)
      `, [name, email, passwordHash]);
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        response.status(409).json({ error: "Email này đã được đăng ký." });
        return;
      }
      throw error;
    }

    const user = await getUserById(result.insertId);
    const session = await createSession(user.id);
    setSessionCookie(response, session.token, session.expiresAt);
    response.status(201).json({ user });
  }),
);

app.post(
  "/api/auth/login",
  loginLimiter,
  asyncRoute(async (request, response) => {
    const email =
      typeof request.body?.email === "string"
        ? request.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof request.body?.password === "string" ? request.body.password : "";
    const account = await one(`
      SELECT id, password_hash AS passwordHash
      FROM users
      WHERE email = ?
    `, [email]);

    if (
      !account?.passwordHash ||
      !(await verifyPassword(password, account.passwordHash))
    ) {
      response.status(401).json({ error: "Email hoặc mật khẩu không chính xác." });
      return;
    }

    const user = await getUserById(account.id);
    const session = await createSession(user.id);
    setSessionCookie(response, session.token, session.expiresAt);
    response.json({ user });
  }),
);

app.post("/api/auth/logout", requireAuth, asyncRoute(async (request, response) => {
  await execute("DELETE FROM sessions WHERE token_hash = ?", [
    hashSessionToken(request.sessionToken),
  ]);
  response.setHeader("Set-Cookie", clearSessionCookie(isProduction));
  response.status(204).end();
}));

app.get("/api/menu", asyncRoute(async (_request, response) => {
  const items = await many(`
    SELECT id, name, description, introduction, price, image,
      image_alt AS imageAlt,
      gallery_images AS galleryImages,
      best_seller AS bestSeller
    FROM menu_items
    ORDER BY sort_order, id
  `);
  response.json(items.map((item) => ({
    ...item,
    galleryImages:
      typeof item.galleryImages === "string"
        ? JSON.parse(item.galleryImages)
        : item.galleryImages,
  })));
}));

app.get(
  "/api/menu/:menuId/reviews",
  asyncRoute(async (request, response) => {
    const menuId = Number(request.params.menuId);
    if (!Number.isSafeInteger(menuId) || menuId < 1) {
      response.status(400).json({ error: "Món ăn không hợp lệ." });
      return;
    }

    const menuItem = await one("SELECT id FROM menu_items WHERE id = ?", [menuId]);
    if (!menuItem) {
      response.status(404).json({ error: "Không tìm thấy món ăn." });
      return;
    }

    const [reviews, summary, currentUser] = await Promise.all([
      many(`
        SELECT menu_reviews.id, menu_reviews.rating, menu_reviews.content,
          menu_reviews.created_at AS createdAt,
          users.name AS authorName
        FROM menu_reviews
        JOIN users ON users.id = menu_reviews.user_id
        WHERE menu_reviews.menu_item_id = ?
        ORDER BY menu_reviews.created_at DESC, menu_reviews.id DESC
        LIMIT 50
      `, [menuId]),
      one(`
        SELECT COUNT(*) AS totalReviews, AVG(rating) AS averageRating
        FROM menu_reviews
        WHERE menu_item_id = ?
      `, [menuId]),
      getSessionUser(readSessionToken(request)),
    ]);

    const ownReview = currentUser?.role === "customer"
      ? await one(`
          SELECT id, rating, content
          FROM menu_reviews
          WHERE menu_item_id = ? AND user_id = ?
        `, [menuId, currentUser.id])
      : null;

    response.setHeader("Cache-Control", "no-store");
    response.json({
      reviews,
      totalReviews: Number(summary.totalReviews),
      averageRating: summary.averageRating
        ? Number(summary.averageRating)
        : 0,
      ownReview,
    });
  }),
);

app.post(
  "/api/menu/:menuId/reviews",
  chatWriteLimiter,
  requireAuth,
  asyncRoute(async (request, response) => {
    if (request.user.role !== "customer") {
      response.status(403).json({ error: "Chỉ tài khoản khách hàng mới có thể đánh giá món." });
      return;
    }

    const menuId = Number(request.params.menuId);
    if (!Number.isSafeInteger(menuId) || menuId < 1) {
      response.status(400).json({ error: "Món ăn không hợp lệ." });
      return;
    }
    const menuItem = await one("SELECT id FROM menu_items WHERE id = ?", [menuId]);
    if (!menuItem) {
      response.status(404).json({ error: "Không tìm thấy món ăn." });
      return;
    }

    const rating = request.body?.rating;
    const content =
      typeof request.body?.content === "string" ? request.body.content.trim() : "";
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      response.status(400).json({ error: "Điểm đánh giá cần từ 1 đến 5 sao." });
      return;
    }
    if (content.length < 3 || content.length > 600) {
      response.status(400).json({ error: "Nhận xét cần có từ 3 đến 600 ký tự." });
      return;
    }

    await execute(`
      INSERT INTO menu_reviews (menu_item_id, user_id, rating, content)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        rating = VALUES(rating),
        content = VALUES(content),
        updated_at = CURRENT_TIMESTAMP
    `, [menuId, request.user.id, rating, content]);

    const review = await one(`
      SELECT menu_reviews.id, menu_reviews.rating, menu_reviews.content,
        menu_reviews.created_at AS createdAt, users.name AS authorName
      FROM menu_reviews
      JOIN users ON users.id = menu_reviews.user_id
      WHERE menu_reviews.menu_item_id = ? AND menu_reviews.user_id = ?
    `, [menuId, request.user.id]);
    response.status(201).json(review);
  }),
);

app.post(
  "/api/admin/menu",
  requireAuth,
  requireAdmin,
  asyncRoute(async (request, response) => {
    const name =
      typeof request.body?.name === "string" ? request.body.name.trim() : "";
    const description =
      typeof request.body?.description === "string"
        ? request.body.description.trim()
        : "";
    const introduction =
      typeof request.body?.introduction === "string"
        ? request.body.introduction.trim()
        : "";
    const galleryImages = request.body?.galleryImages;
    const price = request.body?.price;
    const bestSeller = request.body?.bestSeller === true;

    if (name.length < 2 || name.length > 120) {
      response.status(400).json({ error: "Tên món cần có từ 2 đến 120 ký tự." });
      return;
    }
    if (description.length < 2 || description.length > 500) {
      response.status(400).json({ error: "Mô tả cần có từ 2 đến 500 ký tự." });
      return;
    }
    if (introduction.length < 1001 || introduction.length > 5000) {
      response.status(400).json({ error: "Phần giới thiệu cần có ít nhất 1.001 và tối đa 5.000 ký tự." });
      return;
    }
    if (!Number.isSafeInteger(price) || price < 0 || price > 100_000_000) {
      response.status(400).json({ error: "Giá món cần là số nguyên từ 0 đến 100.000.000." });
      return;
    }
    if (!Array.isArray(galleryImages) || galleryImages.length !== 3) {
      response.status(400).json({ error: "Mỗi món cần có đúng 3 hình ảnh." });
      return;
    }
    const validatedGallery = [];
    for (const galleryImage of galleryImages) {
      const url =
        typeof galleryImage?.url === "string" ? galleryImage.url.trim() : "";
      const alt =
        typeof galleryImage?.alt === "string" ? galleryImage.alt.trim() : "";
      if (url.length > 1000 || alt.length < 2 || alt.length > 250) {
        response.status(400).json({ error: "Vui lòng nhập đủ đường dẫn và mô tả cho cả 3 hình ảnh." });
        return;
      }
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch {
        response.status(400).json({ error: "Đường dẫn hình ảnh không hợp lệ." });
        return;
      }
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        response.status(400).json({ error: "Hình ảnh phải dùng đường dẫn HTTP hoặc HTTPS." });
        return;
      }
      validatedGallery.push({ url, alt });
    }
    if (new Set(validatedGallery.map(({ url }) => url)).size !== 3) {
      response.status(400).json({ error: "Ba hình ảnh cần có đường dẫn khác nhau." });
      return;
    }
    const [mainImage] = validatedGallery;

    let result;
    try {
      result = await execute(`
        INSERT INTO menu_items
          (name, description, introduction, price, image, image_alt,
            gallery_images, best_seller, sort_order)
        SELECT ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(MAX(sort_order), 0) + 1
        FROM menu_items
      `, [
        name,
        description,
        introduction,
        price,
        mainImage.url,
        mainImage.alt,
        JSON.stringify(validatedGallery),
        bestSeller,
      ]);
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        response.status(409).json({ error: "Tên món này đã có trong thực đơn." });
        return;
      }
      throw error;
    }

    const item = await one(`
      SELECT id, name, description, introduction, price, image,
        image_alt AS imageAlt, gallery_images AS galleryImages,
        best_seller AS bestSeller
      FROM menu_items
      WHERE id = ?
    `, [result.insertId]);
    response.status(201).json({
      ...item,
      galleryImages:
        typeof item.galleryImages === "string"
          ? JSON.parse(item.galleryImages)
          : item.galleryImages,
    });
  }),
);

app.get("/api/locations", asyncRoute(async (_request, response) => {
  const locations = await many(`
    SELECT id, name, address, city, phone,
      opening_hours AS openingHours, amenities
    FROM locations
    ORDER BY id
  `);
  response.json(locations.map((location) => ({
    ...location,
    amenities:
      typeof location.amenities === "string"
        ? JSON.parse(location.amenities)
        : location.amenities,
  })));
}));

app.get("/api/comments", asyncRoute(async (_request, response) => {
  const comments = await many(`
    SELECT comments.id, comments.name, comments.message,
      comments.created_at AS createdAt
    FROM comments
    WHERE comments.post_id IS NULL
    ORDER BY comments.id DESC
    LIMIT 50
  `);
  response.json(comments);
}));

app.post(
  "/api/comments",
  chatWriteLimiter,
  requireAuth,
  asyncRoute(async (request, response) => {
    const message =
      typeof request.body?.message === "string" ? request.body.message.trim() : "";
    if (message.length < 2 || message.length > 600) {
      response.status(400).json({ error: "Bình luận cần có từ 2 đến 600 ký tự." });
      return;
    }

    const result = await execute(`
      INSERT INTO comments (name, message, user_id)
      VALUES (?, ?, ?)
    `, [request.user.name, message, request.user.id]);
    const comment = await one(`
      SELECT id, name, message, created_at AS createdAt
      FROM comments
      WHERE id = ?
    `, [result.insertId]);
    io.emit("comments:created", comment);
    response.status(201).json(comment);
  }),
);

app.get("/api/staff-shifts", asyncRoute(async (_request, response) => {
  response.setHeader("Cache-Control", "no-store");
  const shifts = await many(`
    SELECT staff_shifts.id, staff_shifts.user_id AS userId,
      users.name AS staffName,
      DATE_FORMAT(staff_shifts.shift_date, '%Y-%m-%d') AS shiftDate,
      TIME_FORMAT(staff_shifts.start_time, '%H:%i') AS startTime,
      TIME_FORMAT(staff_shifts.end_time, '%H:%i') AS endTime,
      staff_shifts.note, staff_shifts.created_at AS createdAt
    FROM staff_shifts
    JOIN users ON users.id = staff_shifts.user_id
    ORDER BY staff_shifts.shift_date, staff_shifts.start_time, staff_shifts.id
    LIMIT 200
  `);
  response.json(shifts);
}));

app.post(
  "/api/staff-shifts",
  chatWriteLimiter,
  requireAuth,
  requireStaffOrAdmin,
  asyncRoute(async (request, response) => {
    const shiftDate =
      typeof request.body?.shiftDate === "string" ? request.body.shiftDate : "";
    const startTime =
      typeof request.body?.startTime === "string" ? request.body.startTime : "";
    const endTime =
      typeof request.body?.endTime === "string" ? request.body.endTime : "";
    const note =
      typeof request.body?.note === "string" ? request.body.note.trim() : "";
    const parsedDate = new Date(`${shiftDate}T00:00:00.000Z`);
    const allowedShiftTimes = new Map([
      ["07:00", "12:00"],
      ["12:00", "17:00"],
      ["17:00", "22:00"],
    ]);

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(shiftDate) ||
      !Number.isFinite(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== shiftDate
    ) {
      response.status(400).json({ error: "Vui lòng chọn ngày đăng ký hợp lệ." });
      return;
    }
    if (allowedShiftTimes.get(startTime) !== endTime) {
      response.status(400).json({ error: "Ca làm đã chọn không hợp lệ." });
      return;
    }
    if (note.length > 300) {
      response.status(400).json({ error: "Ghi chú tối đa 300 ký tự." });
      return;
    }

    const connection = await database.getConnection();
    const lockName = `staff-shift:${shiftDate}:${startTime}`;
    let hasLock = false;
    let transactionStarted = false;
    try {
      const [lockRows] = await connection.execute(
        "SELECT GET_LOCK(?, 5) AS acquired",
        [lockName],
      );
      hasLock = Number(lockRows[0]?.acquired) === 1;
      if (!hasLock) {
        response.status(503).json({
          error: "Không thể đăng ký ca ngay lúc này. Vui lòng thử lại.",
        });
        return;
      }

      await connection.beginTransaction();
      transactionStarted = true;
      const [registeredShifts] = await connection.execute(`
        SELECT id, user_id AS userId
        FROM staff_shifts
        WHERE shift_date = ? AND start_time = ? AND end_time = ?
      `, [shiftDate, startTime, endTime]);
      if (registeredShifts.length >= 2) {
        response.status(409).json({ error: "Ca này đã đủ 2 nhân viên đăng ký." });
        return;
      }
      if (
        registeredShifts.some(
          (shift) => String(shift.userId) === String(request.user.id),
        )
      ) {
        response.status(409).json({ error: "Bạn đã đăng ký ca này rồi." });
        return;
      }

      const [result] = await connection.execute(`
        INSERT INTO staff_shifts (user_id, shift_date, start_time, end_time, note)
        VALUES (?, ?, ?, ?, ?)
      `, [request.user.id, shiftDate, startTime, endTime, note]);
      const [rows] = await connection.execute(`
        SELECT staff_shifts.id, staff_shifts.user_id AS userId,
          users.name AS staffName,
          DATE_FORMAT(staff_shifts.shift_date, '%Y-%m-%d') AS shiftDate,
          TIME_FORMAT(staff_shifts.start_time, '%H:%i') AS startTime,
          TIME_FORMAT(staff_shifts.end_time, '%H:%i') AS endTime,
          staff_shifts.note, staff_shifts.created_at AS createdAt
        FROM staff_shifts
        JOIN users ON users.id = staff_shifts.user_id
        WHERE staff_shifts.id = ?
      `, [result.insertId]);
      const shift = rows[0];
      await connection.commit();
      transactionStarted = false;

      io.emit("staff-shift:created", shift);
      response.status(201).json(shift);
    } catch (error) {
      if (transactionStarted) {
        await connection.rollback();
        transactionStarted = false;
      }
      throw error;
    } finally {
      try {
        if (transactionStarted) await connection.rollback();
        if (hasLock) {
          await connection.execute("SELECT RELEASE_LOCK(?)", [lockName]);
        }
      } finally {
        connection.release();
      }
    }
  }),
);

app.delete(
  "/api/staff-shifts/:shiftId",
  requireAuth,
  requireStaffOrAdmin,
  asyncRoute(async (request, response) => {
    const shiftId = Number(request.params.shiftId);
    if (!Number.isSafeInteger(shiftId) || shiftId < 1) {
      response.status(400).json({ error: "Ca làm không hợp lệ." });
      return;
    }

    const shift = await one(`
      SELECT id, user_id AS userId,
        DATE_FORMAT(shift_date, '%Y-%m-%d') AS shiftDate,
        TIME_FORMAT(start_time, '%H:%i') AS startTime,
        TIME_FORMAT(end_time, '%H:%i') AS endTime
      FROM staff_shifts
      WHERE id = ?
    `, [shiftId]);
    if (!shift) {
      response.status(404).json({ error: "Không tìm thấy ca làm này." });
      return;
    }
    if (
      request.user.role !== "admin" &&
      String(shift.userId) !== String(request.user.id)
    ) {
      response.status(403).json({ error: "Bạn chỉ có thể hủy ca do mình đăng ký." });
      return;
    }

    const result = await execute("DELETE FROM staff_shifts WHERE id = ?", [shiftId]);
    if (result.affectedRows !== 1) {
      response.status(404).json({ error: "Ca làm này đã được hủy." });
      return;
    }

    io.emit("staff-shift:deleted", { id: shiftId });
    response.status(204).end();
  }),
);

app.get("/api/posts", asyncRoute(async (_request, response) => {
  const posts = await many(`
    SELECT id
    FROM posts
    ORDER BY id DESC
    LIMIT 50
  `);
  response.json(await Promise.all(posts.map((post) => getPostById(post.id))));
}));

app.post(
  "/api/posts",
  chatWriteLimiter,
  requireAuth,
  asyncRoute(async (request, response) => {
    const content =
      typeof request.body?.content === "string" ? request.body.content.trim() : "";
    if (content.length < 1 || content.length > 2000) {
      response.status(400).json({ error: "Bài viết tối đa 2.000 ký tự." });
      return;
    }
    const result = await execute(
      "INSERT INTO posts (user_id, content) VALUES (?, ?)",
      [request.user.id, content],
    );
    const post = await getPostById(result.insertId);
    io.to("chat").emit("chat:post-created", post);
    response.status(201).json(post);
  }),
);

app.post(
  "/api/posts/:postId/comments",
  chatWriteLimiter,
  requireAuth,
  asyncRoute(async (request, response) => {
    const postId = Number(request.params.postId);
    const post = Number.isSafeInteger(postId)
      ? await one("SELECT id FROM posts WHERE id = ?", [postId])
      : null;
    if (!post) {
      response.status(404).json({ error: "Không tìm thấy bài viết." });
      return;
    }

    const message =
      typeof request.body?.message === "string" ? request.body.message.trim() : "";
    if (message.length < 1 || message.length > 600) {
      response.status(400).json({ error: "Bình luận tối đa 600 ký tự." });
      return;
    }

    const result = await execute(`
      INSERT INTO comments (name, message, user_id, post_id)
      VALUES (?, ?, ?, ?)
    `, [request.user.name, message, request.user.id, postId]);
    const comment = await one(`
      SELECT comments.id, comments.message, comments.created_at AS createdAt,
        users.id AS userId, users.name AS authorName, users.role AS authorRole
      FROM comments
      JOIN users ON users.id = comments.user_id
      WHERE comments.id = ?
    `, [result.insertId]);
    const publicComment = {
      id: comment.id,
      message: comment.message,
      createdAt: comment.createdAt,
      author: {
        id: comment.userId,
        name: comment.authorName,
        role: comment.authorRole,
      },
    };
    io.to("chat").emit("chat:comment-created", { postId, comment: publicComment });
    response.status(201).json(publicComment);
  }),
);

app.delete(
  "/api/posts/:postId",
  requireAuth,
  asyncRoute(async (request, response) => {
    const postId = Number(request.params.postId);
    const post = Number.isSafeInteger(postId)
      ? await one("SELECT user_id AS userId FROM posts WHERE id = ?", [postId])
      : null;
    if (!post) {
      response.status(404).json({ error: "Không tìm thấy bài viết." });
      return;
    }
    if (request.user.role !== "admin" && post.userId !== request.user.id) {
      response.status(403).json({ error: "Bạn không có quyền xóa bài viết này." });
      return;
    }
    await execute("DELETE FROM posts WHERE id = ?", [postId]);
    io.to("chat").emit("chat:post-deleted", { postId });
    response.status(204).end();
  }),
);

app.get(
  "/api/admin/users",
  requireAuth,
  requireAdmin,
  asyncRoute(async (_request, response) => {
    response.setHeader("Cache-Control", "no-store");
    const users = await many(`
      SELECT id, name, email, role, created_at AS createdAt
      FROM users
      ORDER BY id DESC
    `);
    response.json(users);
  }),
);

app.post(
  "/api/admin/staff",
  requireAuth,
  requireAdmin,
  registrationLimiter,
  asyncRoute(async (request, response) => {
    const name = typeof request.body?.name === "string" ? request.body.name.trim() : "";
    const email =
      typeof request.body?.email === "string"
        ? request.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof request.body?.password === "string" ? request.body.password : "";

    if (name.length < 2 || name.length > 60) {
      response.status(400).json({ error: "Tên cần có từ 2 đến 60 ký tự." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      response.status(400).json({ error: "Vui lòng nhập email hợp lệ." });
      return;
    }
    if (password.length < 10 || password.length > 128) {
      response.status(400).json({ error: "Mật khẩu cần có từ 10 đến 128 ký tự." });
      return;
    }

    const passwordHash = await hashPassword(password);
    let result;
    try {
      result = await execute(`
        INSERT INTO users (name, email, role, password_hash)
        VALUES (?, ?, 'staff', ?)
      `, [name, email, passwordHash]);
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        response.status(409).json({ error: "Email này đã được đăng ký." });
        return;
      }
      throw error;
    }

    response.setHeader("Cache-Control", "no-store");
    const staff = await one(`
      SELECT id, name, email, role, created_at AS createdAt
      FROM users
      WHERE id = ?
    `, [result.insertId]);
    response.status(201).json(staff);
  }),
);

app.delete(
  "/api/admin/comments/:commentId",
  requireAuth,
  requireAdmin,
  asyncRoute(async (request, response) => {
    const commentId = Number(request.params.commentId);
    const comment = Number.isSafeInteger(commentId)
      ? await one("SELECT id, post_id AS postId FROM comments WHERE id = ?", [commentId])
      : null;
    if (!comment) {
      response.status(404).json({ error: "Không tìm thấy bình luận." });
      return;
    }
    await execute("DELETE FROM comments WHERE id = ?", [commentId]);
    if (comment.postId !== null) {
      io.to("chat").emit("chat:comment-deleted", {
        postId: comment.postId,
        commentId,
      });
    }
    response.status(204).end();
  }),
);

function getPublicSiteUrl(request) {
  const configuredSiteUrl = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (configuredSiteUrl) return configuredSiteUrl;

  const forwardedHost = request.get("x-forwarded-host")?.split(",")[0].trim();
  const forwardedProtocol = request
    .get("x-forwarded-proto")
    ?.split(",")[0]
    .trim();
  const host = forwardedHost || request.get("host");
  return `${forwardedProtocol || request.protocol}://${host}`;
}

app.get("/sitemap.xml", asyncRoute(async (request, response) => {
  const items = await many("SELECT id, name FROM menu_items ORDER BY sort_order, id");
  const siteUrl = getPublicSiteUrl(request);
  const paths = [
    "/",
    "/story",
    "/menu",
    "/visit",
    ...items.map((item) => getMenuItemPath(item)),
  ];
  const escapeXml = (value) =>
    value.replace(/[<>&'"]/g, (character) => ({
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&apos;",
      '"': "&quot;",
    })[character]);

  response.setHeader("Cache-Control", "public, max-age=3600");
  response.type("application/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
      paths.map((path) => `<url><loc>${escapeXml(`${siteUrl}${path}`)}</loc></url>`).join("") +
      `</urlset>`,
  );
}));

app.get("/robots.txt", (request, response) => {
  const siteUrl = getPublicSiteUrl(request);
  response
    .type("text/plain")
    .send(`User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
});

app.use("/api", (_request, response) => {
  response.status(404).json({ error: "Không tìm thấy API này." });
});

if (isProduction) {
  const distDirectory = resolve(projectRoot, "dist");
  app.use(express.static(distDirectory));
  app.get("*", (_request, response) => {
    response.sendFile(resolve(distDirectory, "index.html"));
  });
}

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({ error: "Nội dung JSON không hợp lệ." });
    return;
  }

  if (error.status === 413) {
    response.status(413).json({ error: "Nội dung gửi lên vượt quá giới hạn." });
    return;
  }

  console.error(error);
  response.status(500).json({ error: "Máy chủ gặp lỗi khi xử lý yêu cầu." });
});

const server = httpServer.listen(port, () => {
  console.log(`Mộc Nhiên API đang chạy tại http://localhost:${port}`);
});

function shutdown() {
  io.close(() => {
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
