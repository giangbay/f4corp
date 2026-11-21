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
      introduction TEXT NOT NULL,
      price INT UNSIGNED NOT NULL,
      image VARCHAR(1000) NOT NULL,
      image_alt VARCHAR(250) NOT NULL,
      best_seller BOOLEAN NOT NULL DEFAULT FALSE,
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

    CREATE TABLE IF NOT EXISTS menu_reviews (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      menu_item_id BIGINT UNSIGNED NOT NULL,
      user_id BIGINT UNSIGNED NOT NULL,
      rating TINYINT UNSIGNED NOT NULL,
      content VARCHAR(600) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT menu_reviews_item_fk FOREIGN KEY (menu_item_id)
        REFERENCES menu_items(id) ON DELETE CASCADE,
      CONSTRAINT menu_reviews_user_fk FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY menu_reviews_item_user_unique (menu_item_id, user_id),
      INDEX menu_reviews_item_created_idx (menu_item_id, created_at)
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

    CREATE TABLE IF NOT EXISTS staff_shifts (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      shift_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      note VARCHAR(300) NOT NULL DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT staff_shifts_user_fk FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
      INDEX staff_shifts_date_idx (shift_date, start_time)
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

  const [bestSellerColumn] = await database.query(
    "SHOW COLUMNS FROM menu_items LIKE 'best_seller'",
  );
  if (bestSellerColumn.length === 0) {
    await database.query(
      "ALTER TABLE menu_items ADD COLUMN best_seller BOOLEAN NOT NULL DEFAULT FALSE AFTER image_alt",
    );
    await database.query(
      "UPDATE menu_items SET best_seller = TRUE WHERE name IN (?, ?)",
      ["Cà phê sữa đá", "Latte dịu êm"],
    );
  }

  const [introductionColumn] = await database.query(
    "SHOW COLUMNS FROM menu_items LIKE 'introduction'",
  );
  if (introductionColumn.length === 0) {
    await database.query(
      "ALTER TABLE menu_items ADD COLUMN introduction TEXT NOT NULL AFTER description",
    );
    await database.query(
      "UPDATE menu_items SET introduction = description WHERE introduction = ''",
    );
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
        (name, description, introduction, price, image, image_alt, best_seller, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "Cà phê sữa đá",
        "Robusta rang vừa, sữa thơm, hậu vị đậm đà thân quen.",
        "Cà phê sữa đá nhà Mộc bắt đầu từ những hạt Robusta được tuyển chọn và rang vừa để giữ trọn hương thơm tự nhiên. Cà phê được pha đậm, hòa cùng sữa thơm và đá mát, tạo nên vị ngọt dịu ở đầu lưỡi cùng hậu vị đậm đà thân quen. Một lựa chọn giản dị để bắt đầu ngày mới hoặc nhâm nhi trong buổi chiều Hà Nội.",
        39000,
        "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=85",
        "Cà phê sữa đá Việt Nam",
        true,
        1,
      ],
    );
    await seedExecute(
      `INSERT IGNORE INTO menu_items
        (name, description, introduction, price, image, image_alt, best_seller, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "Latte dịu êm",
        "Espresso cân bằng cùng sữa tươi đánh mịn, thơm nhẹ nhàng.",
        "Latte dịu êm kết hợp espresso được chiết xuất cân bằng với sữa tươi đánh mịn, tạo nên kết cấu mềm mượt và lớp bọt nhẹ nhàng. Hương cà phê vẫn rõ nét nhưng không quá đậm, quyện cùng vị sữa thơm béo vừa phải. Món ngon khi thưởng thức nóng, phù hợp cho những lúc bạn muốn chậm lại và tận hưởng một khoảng nghỉ nhỏ.",
        49000,
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=85",
        "Tách latte nóng với lớp bọt sữa mịn",
        true,
        2,
      ],
    );
    await seedExecute(
      `INSERT IGNORE INTO menu_items
        (name, description, introduction, price, image, image_alt, best_seller, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "Matcha mây xanh",
        "Matcha thơm dịu, sữa mát lành và một lớp kem mềm mượt.",
        "Matcha mây xanh mang sắc xanh dịu mắt cùng hương trà thanh nhẹ. Matcha được khuấy mịn rồi kết hợp với sữa mát lành và lớp kem mềm mượt phía trên, tạo nên nhiều tầng vị hài hòa: thơm trà, béo nhẹ và ngọt vừa. Một thức uống tươi mát cho buổi trưa hoặc những ngày bạn muốn đổi vị khỏi cà phê.",
        55000,
        "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=800&q=85",
        "Ly matcha xanh mát",
        false,
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
        "448 Tây Sơn",
        "Đống Đa, Hà Nội",
        "0348211711",
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
