import "dotenv/config";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { Server as SocketServer } from "socket.io";
import { closeDatabase, database, execute, initializeDatabase, many, one } from "./database.js";
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
app.use(express.json({ limit: "8kb" }));
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
    SELECT id, name, description, price, image, image_alt AS imageAlt
    FROM menu_items
    ORDER BY sort_order, id
  `);
  response.json(items);
}));

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
