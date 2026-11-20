import mysql from "mysql2/promise";

const requiredEnvironment = ["MYSQL_HOST", "MYSQL_DATABASE", "MYSQL_USER", "MYSQL_PASSWORD"];
const missingEnvironment = requiredEnvironment.filter((key) => !process.env[key]);
if (missingEnvironment.length > 0) {
  throw new Error(
    `Missing MySQL configuration: ${missingEnvironment.join(", ")}. Copy .env.example to .env and set the values.`,
  );
}

export const database = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT ?? 3306),
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT ?? 10),
  queueLimit: 0,
  charset: "utf8mb4",
  timezone: "Z",
  decimalNumbers: true,
});

export async function execute(sql, parameters = []) {
  const [result] = await database.execute(sql, parameters);
  return result;
}

export async function one(sql, parameters = []) {
  const [rows] = await database.execute(sql, parameters);
  return rows[0] ?? null;
}

export async function many(sql, parameters = []) {
  const [rows] = await database.execute(sql, parameters);
  return rows;
}

export async function initializeDatabase() {
  const schema = `
    CREATE TABLE IF NOT EXISTS menu_items (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL UNIQUE,
      description VARCHAR(500) NOT NULL,
      price INT UNSIGNED NOT NULL,
      image VARCHAR(1000) NOT NULL,
      image_alt VARCHAR(250) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(60) NOT NULL,
      email VARCHAR(254) NOT NULL UNIQUE,
      role ENUM('customer', 'staff', 'admin') NOT NULL DEFAULT 'customer',
      password_hash VARCHAR(255) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash CHAR(64) NOT NULL PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      expires_at BIGINT UNSIGNED NOT NULL,
      CONSTRAINT sessions_user_fk FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
      INDEX sessions_user_id_idx (user_id),
      INDEX sessions_expiry_idx (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS posts (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      content VARCHAR(2000) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT posts_user_fk FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
      INDEX posts_created_at_idx (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS orders (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      status ENUM('pending', 'preparing', 'completed') NOT NULL,
      total INT UNSIGNED NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT orders_user_fk FOREIGN KEY (user_id)
        REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS order_items (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      order_id BIGINT UNSIGNED NOT NULL,
      item_name VARCHAR(120) NOT NULL,
      quantity INT UNSIGNED NOT NULL,
      unit_price INT UNSIGNED NOT NULL,
      CONSTRAINT order_items_order_fk FOREIGN KEY (order_id)
        REFERENCES orders(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS locations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      address VARCHAR(250) NOT NULL,
      city VARCHAR(120) NOT NULL,
      phone VARCHAR(40) NOT NULL,
      opening_hours VARCHAR(120) NOT NULL,
      amenities JSON NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS comments (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(60) NOT NULL,
      message VARCHAR(600) NOT NULL,
      user_id BIGINT UNSIGNED NULL,
      post_id BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT comments_user_fk FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT comments_post_fk FOREIGN KEY (post_id)
        REFERENCES posts(id) ON DELETE CASCADE,
      INDEX comments_post_idx (post_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  for (const statement of schema.split(";").map((item) => item.trim()).filter(Boolean)) {
    await database.query(statement);
  }

  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    const seedExecute = async (sql, parameters = []) => {
      const [result] = await connection.execute(sql, parameters);
      return result;
    };
    await seedExecute(
      `INSERT IGNORE INTO menu_items
        (name, description, price, image, image_alt, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "Cà phê sữa đá",
        "Robusta rang vừa, sữa thơm, hậu vị đậm đà thân quen.",
        39000,
        "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=85",
        "Cà phê sữa đá Việt Nam",
        1,
      ],
    );
    await seedExecute(
      `INSERT IGNORE INTO menu_items
        (name, description, price, image, image_alt, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "Latte dịu êm",
        "Espresso cân bằng cùng sữa tươi đánh mịn, thơm nhẹ nhàng.",
        49000,
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=85",
        "Tách latte nóng với lớp bọt sữa mịn",
        2,
      ],
    );
    await seedExecute(
      `INSERT IGNORE INTO menu_items
        (name, description, price, image, image_alt, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "Matcha mây xanh",
        "Matcha thơm dịu, sữa mát lành và một lớp kem mềm mượt.",
        55000,
        "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=800&q=85",
        "Ly matcha xanh mát",
        3,
      ],
    );

    await seedExecute(
      `INSERT IGNORE INTO users (name, email, role)
       VALUES (?, ?, 'customer'), (?, ?, 'staff')`,
      [
        "Khách Mộc",
        "khach.moc@example.test",
        "Nhân viên Mộc",
        "nhanvien.moc@example.test",
      ],
    );

    const [sampleUsers] = await connection.execute(
      "SELECT id FROM users WHERE email = ?",
      ["khach.moc@example.test"],
    );
    const sampleUser = sampleUsers[0] ?? null;
    const [orderCountRows] = await connection.query(
      "SELECT COUNT(*) AS count FROM orders",
    );
    if (Number(orderCountRows[0].count) === 0 && sampleUser) {
      const completedOrder = await seedExecute(
        "INSERT INTO orders (user_id, status, total) VALUES (?, 'completed', ?)",
        [sampleUser.id, 88000],
      );
      await seedExecute(
        `INSERT INTO order_items (order_id, item_name, quantity, unit_price)
         VALUES (?, ?, 1, ?), (?, ?, 1, ?)`,
        [
          completedOrder.insertId,
          "Cà phê sữa đá",
          39000,
          completedOrder.insertId,
          "Latte dịu êm",
          49000,
        ],
      );
      const preparingOrder = await seedExecute(
        "INSERT INTO orders (user_id, status, total) VALUES (?, 'preparing', ?)",
        [sampleUser.id, 55000],
      );
      await seedExecute(
        `INSERT INTO order_items (order_id, item_name, quantity, unit_price)
         VALUES (?, ?, 1, ?)`,
        [preparingOrder.insertId, "Matcha mây xanh", 55000],
      );
    }

    await seedExecute(
      `INSERT INTO locations (name, address, city, phone, opening_hours, amenities)
       SELECT ?, ?, ?, ?, ?, ?
       WHERE NOT EXISTS (SELECT 1 FROM locations)`,
      [
        "Mộc Nhiên Coffee",
        "25 Nguyễn Thị Minh Khai",
        "Quận 1, TP. Hồ Chí Minh",
        "0901 234 567",
        "Mỗi ngày · 07:00 — 22:00",
        JSON.stringify(["Wifi miễn phí", "Có chỗ ngồi ngoài trời"]),
      ],
    );

    await seedExecute(
      `INSERT INTO comments (name, message)
       SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM comments)`,
      ["Linh", "Góc quán rất yên bình, latte thơm và dễ uống."],
    );
    await seedExecute(
      `INSERT INTO comments (name, message)
       SELECT ?, ? WHERE NOT EXISTS (
         SELECT 1 FROM comments WHERE message = ?
       )`,
      [
        "Minh",
        "Mình thích cảm giác chậm rãi và thân thiện ở đây.",
        "Mình thích cảm giác chậm rãi và thân thiện ở đây.",
      ],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function closeDatabase() {
  await database.end();
}
