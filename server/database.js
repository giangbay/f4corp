import mysql from "mysql2/promise";

const requiredEnvironment = ["MYSQL_HOST", "MYSQL_DATABASE", "MYSQL_USER", "MYSQL_PASSWORD"];
const sampleMenuItems = [
  {
    name: "Cà phê sữa đá",
    category: "coffee",
    description: "Robusta rang vừa, sữa thơm, hậu vị đậm đà thân quen.",
    price: 39000,
    bestSeller: true,
    image:
      "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Cà phê sữa đá Việt Nam",
    galleryImages: [
      {
        url: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=1200&q=85",
        alt: "Cà phê sữa đá Việt Nam trong ly thủy tinh",
      },
      {
        url: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=85",
        alt: "Cà phê được rót chậm qua dụng cụ pha",
      },
      {
        url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85",
        alt: "Góc bàn cà phê ấm cúng với tách cà phê",
      },
    ],
    introduction:
      `Cà phê sữa đá là thức uống quen thuộc của người Việt, nhưng mỗi ly ngon đều bắt đầu từ sự chăm chút ở những điều nhỏ nhất. Tại Mộc Nhiên, chúng tôi chọn hạt Robusta có hương thơm rõ, vị đậm tự nhiên và hậu vị bền. Hạt được rang vừa để đánh thức mùi cacao, chút hạt rang và nét đắng dịu, không làm mất đi cá tính vốn có của cà phê. Khi xay và pha, lượng cà phê cùng thời gian chiết xuất được cân chỉnh để tạo nên phần nước cốt đậm, thơm và cân bằng.

Ly cà phê được pha mới, nhỏ chậm qua phin để từng giọt cô lại, mang theo mùi thơm ấm áp. Sữa được thêm vừa đủ để làm mềm vị đắng chứ không lấn át hương cà phê. Khi đá tan nhẹ, các tầng vị hòa vào nhau: đầu tiên là vị ngọt dịu, tiếp đến là hương cà phê đậm đà và cuối cùng là chút dư vị thơm kéo dài. Tỷ lệ được giữ cân bằng để ly uống mát nhưng vẫn tròn vị đến ngụm cuối, không quá ngọt và cũng không nhạt đi nhanh chóng.

Chúng tôi yêu thích món uống này vì nó gợi nhắc nhịp sống chậm rãi: tiếng đá chạm thành ly, mùi cà phê lan trong không gian và một khoảng nghỉ vừa đủ giữa ngày bận rộn. Cà phê sữa đá hợp với buổi sáng cần sự tỉnh táo, cũng hợp khi gặp bạn bè vào một chiều Hà Nội. Bạn có thể nhấp một ngụm trước khi khuấy để cảm nhận lớp sữa và cà phê, sau đó khuấy đều để vị ngọt, đắng và mát quyện trọn. Mỗi ly tại quán đều được chuẩn bị ngay khi gọi, dùng ly sạch và đá viên trong để giữ cảm giác sảng khoái.

Ở Mộc Nhiên, món quen không có nghĩa là làm qua loa. Chúng tôi chú ý từ độ tươi của hạt, cách bảo quản, độ mịn khi xay đến việc vệ sinh dụng cụ sau mỗi lần pha. Mục tiêu là đem đến một ly cà phê dễ uống, có dấu ấn riêng nhưng vẫn giữ được tinh thần thân thuộc của cà phê Việt. Nếu bạn đang tìm một thức uống đậm vị, mát lành và gần gũi, cà phê sữa đá là lời chào giản dị mà chân thành từ quầy bar nhà Mộc.`,
  },
  {
    name: "Latte dịu êm",
    category: "coffee",
    description: "Espresso cân bằng cùng sữa tươi đánh mịn, thơm nhẹ nhàng.",
    price: 49000,
    bestSeller: true,
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Tách latte nóng với lớp bọt sữa mịn",
    galleryImages: [
      {
        url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=85",
        alt: "Tách latte nóng với lớp bọt sữa mịn",
      },
      {
        url: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=1200&q=85",
        alt: "Barista rót sữa tạo hình trên tách latte",
      },
      {
        url: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=85",
        alt: "Tách cà phê sữa đặt cạnh hạt cà phê rang",
      },
    ],
    introduction:
      `Latte dịu êm dành cho những ai yêu hương cà phê nhưng muốn thưởng thức một vị mềm mại, cân bằng. Nền của mỗi tách là espresso được chiết xuất từ hạt rang vừa, với hương thơm gợi nhớ cacao và chút caramel. Barista điều chỉnh lượng cà phê, nhiệt độ nước và thời gian chiết xuất để phần espresso có thân vị rõ ràng, không chua gắt cũng không đắng khô. Tách được làm nóng vừa đủ để hương thơm mở ra ngay khi rót.

Sữa tươi được đánh nóng và tạo bọt mịn, giữ kết cấu bóng nhẹ thay vì bọt lớn, khô. Khi hòa cùng espresso, sữa làm dịu nét đậm của cà phê, tạo cảm giác béo thơm nhưng không nặng. Ngụm đầu tiên thường mang vị sữa êm, tiếp theo là hương cà phê rõ nét và một hậu vị ngọt tự nhiên. Lớp bọt mỏng giúp tách latte mềm mại, đồng thời là bề mặt để barista gửi một hình vẽ nhỏ bằng sữa. Hình trang trí có thể thay đổi theo từng tách, nhưng sự cân bằng trong hương vị luôn được giữ.

Latte ngon nhất khi uống nóng và nhấp chậm, để nhiệt độ vừa phải làm nổi bật mùi espresso cùng vị sữa. Món phù hợp cho buổi sáng nhẹ nhàng, một cuộc trò chuyện ngắn hoặc giờ làm việc cần chút cảm hứng. Nếu thích vị cà phê rõ hơn, bạn có thể nhờ barista điều chỉnh lượng espresso; nếu muốn dịu hơn, sữa tươi sẽ làm tách uống êm và tròn vị. Chúng tôi luôn hỏi kỹ lựa chọn của bạn để đồ uống hợp với khẩu vị riêng, thay vì cố định một công thức cho tất cả mọi người.

Phía sau vẻ giản dị của latte là sự phối hợp giữa kỹ thuật và cảm nhận. Hạt được xay ngay trước khi pha để giữ mùi thơm, espresso được chiết xuất theo từng lượt, còn sữa được đánh mới cho mỗi đơn hàng. Barista quan sát độ mịn và độ bóng của bọt sữa để tách không bị loãng hoặc quá nóng. Tại Mộc Nhiên, chúng tôi mong mỗi tách latte là một khoảng dừng dễ chịu: hương cà phê đủ để đánh thức giác quan, vị sữa đủ để vỗ về và không gian đủ yên để bạn tận hưởng trọn vẹn.`,
  },
  {
    name: "Matcha mây xanh",
    category: "milk-tea",
    description: "Matcha thơm dịu, sữa mát lành và một lớp kem mềm mượt.",
    price: 55000,
    bestSeller: false,
    image:
      "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Ly matcha xanh mát",
    galleryImages: [
      {
        url: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=1200&q=85",
        alt: "Ly matcha xanh mát với lớp kem mềm",
      },
      {
        url: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=1200&q=85",
        alt: "Matcha sữa được phục vụ trong ly thủy tinh",
      },
      {
        url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=85",
        alt: "Cận cảnh sắc xanh dịu của matcha",
      },
    ],
    introduction:
      `Matcha mây xanh mang sắc xanh dịu mắt và hương trà thanh, dành cho những ngày bạn muốn đổi vị khỏi cà phê. Matcha được chọn vì có màu tự nhiên, mùi cỏ non nhẹ và vị trà rõ nhưng không quá chát. Bột trà được rây mịn để hạn chế vón, sau đó khuấy cùng nước ở nhiệt độ phù hợp cho đến khi hòa tan và dậy hương. Cách chuẩn bị cẩn thận giúp thức uống giữ được màu xanh tươi và vị trà đặc trưng.

Phần matcha được kết hợp với sữa mát lành để tạo vị béo nhẹ, dễ uống. Tùy cách thưởng thức, các lớp có thể được giữ riêng trong ly để nhìn thấy màu xanh và trắng đan xen, hoặc khuấy đều để vị trà và sữa hòa quyện ngay từ ngụm đầu. Trên cùng là lớp kem mềm mượt, tạo cảm giác đầy đặn nhưng không quá ngọt. Khi đá tan chậm, vị trà vẫn còn rõ, sữa vẫn thơm và tổng thể không bị gắt. Mỗi ly được pha theo đơn gọi để hương vị luôn tươi mới.

Matcha mây xanh phù hợp với buổi trưa cần chút mát lành, những buổi trò chuyện cùng bạn bè hoặc lúc muốn thưởng thức một thức uống có vẻ ngoài dịu dàng. Bạn có thể thử uống qua ống hút khi các lớp còn nguyên để cảm nhận sự thay đổi theo từng ngụm, rồi khuấy nhẹ để lớp kem tan dần. Với người mới uống matcha, vị sữa và kem làm món dễ tiếp cận; với người đã quen trà xanh, hương matcha vẫn đủ nổi bật để tạo dư vị riêng. Độ ngọt được giữ vừa phải để không che đi mùi trà.

Ở quầy bar Mộc Nhiên, chúng tôi chuẩn bị matcha từng phần nhỏ, dùng dụng cụ sạch và khuấy ngay trước khi hoàn thiện ly. Bột trà được bảo quản kín để tránh ánh sáng và hơi ẩm làm giảm hương thơm. Sữa và đá được cân đối để giữ độ mát mà không khiến thức uống nhạt nhanh. Sắc xanh trong ly gợi cảm giác thư thái, còn tên gọi “mây xanh” nhắc đến lớp kem nhẹ phía trên. Đó là một lựa chọn vừa tươi mát vừa êm dịu, mang đến khoảng nghỉ dễ chịu giữa nhịp phố.`,
  },
  {
    name: "Cam tươi nắng sớm",
    category: "juice",
    description: "Nước cam ép tươi mát, vị chua ngọt tự nhiên.",
    price: 45000,
    bestSeller: false,
    image:
      "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Ly nước cam ép tươi",
    galleryImages: [
      {
        url: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=1200&q=85",
        alt: "Ly nước cam ép tươi màu vàng nắng",
      },
      {
        url: "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=1200&q=85",
        alt: "Những quả cam tươi được chọn để ép nước",
      },
      {
        url: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=1200&q=85",
        alt: "Nước ép cam rót vào ly thủy tinh",
      },
    ],
    introduction:
      `Cam tươi nắng sớm là lựa chọn dành cho những ai yêu hương vị trái cây nguyên bản và cảm giác sảng khoái ngay từ ngụm đầu tiên. Chúng tôi chọn cam chín vừa, vỏ còn thơm tinh dầu và cầm chắc tay để phần múi mọng nước. Mỗi ngày, cam được kiểm tra độ tươi, rửa sạch trước khi sơ chế và chỉ ép khi khách gọi. Nhờ vậy ly nước giữ được mùi cam tự nhiên, sắc vàng tươi và vị chua ngọt cân bằng, không cần dựa vào hương liệu để tạo cảm giác đậm đà.

Trước khi ép, barista gọt bỏ phần vỏ dày và hạt để hạn chế vị đắng, sau đó ép nhẹ tay nhằm lấy phần nước cốt trong, thơm. Tùy độ ngọt của từng mẻ cam, chúng tôi điều chỉnh lượng đá và có thể gợi ý thêm chút mật ong nếu bạn muốn vị dịu hơn. Công thức cơ bản giữ nguyên sự giản dị: cam tươi, đá sạch và một chút thời gian để hương trái cây lan ra. Nước ép được phục vụ ngay trong ly mát, có thể thêm lát cam trang trí để bạn cảm nhận mùi thơm trước khi thưởng thức.

Ngụm đầu đem lại vị chua nhẹ đánh thức vị giác, tiếp theo là vị ngọt tự nhiên và mùi tinh dầu thoảng trên mũi. Khi uống chậm, bạn sẽ cảm nhận rõ độ tươi của cam thay vì vị ngọt gắt. Nếu muốn vị thanh, hãy thưởng thức khi đá vừa tan; nếu thích đậm hơn, khuấy đều để phần nước và đá hòa quyện. Cam tươi nắng sớm phù hợp với buổi sáng, bữa trưa hoặc một khoảng nghỉ giữa ngày nóng. Đây cũng là thức uống dễ kết hợp cùng bánh ngọt và các món ăn nhẹ tại quán.

Chúng tôi tin rằng một ly nước ép ngon bắt đầu từ nguyên liệu tốt và cách làm cẩn thận. Dao, thớt và dụng cụ ép được vệ sinh sau mỗi lượt; trái cây sơ chế vừa đủ để tránh để lâu làm giảm hương vị. Phần nước thừa không được giữ qua ngày, còn đá luôn được bảo quản kín và dùng dụng cụ riêng. Những nguyên tắc nhỏ ấy giúp mỗi ly cam tươi giữ trọn sự trong lành mà bạn mong đợi. Tại Mộc Nhiên, cam tươi nắng sớm là lời mời bạn nạp thêm chút tươi vui, nhẹ nhàng và tự nhiên cho ngày của mình.`,
  },
  {
    name: "Sinh tố xoài nhiệt đới",
    category: "smoothie",
    description: "Xoài chín xay mịn cùng sữa chua, thơm ngọt và mát lành.",
    price: 55000,
    bestSeller: false,
    image:
      "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Sinh tố xoài vàng mịn",
    galleryImages: [
      {
        url: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=1200&q=85",
        alt: "Ly sinh tố trái cây màu vàng mịn",
      },
      {
        url: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=1200&q=85",
        alt: "Sinh tố xoài xay với trái cây tươi",
      },
      {
        url: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=1200&q=85",
        alt: "Thức uống sinh tố mát lạnh trong ly thủy tinh",
      },
    ],
    introduction:
      `Sinh tố xoài nhiệt đới mang vị ngọt thơm của xoài chín vào một ly uống mát lành, sánh mịn và giàu cảm giác mùa hè. Xoài được chọn khi thịt quả vàng, thơm tự nhiên và có độ mềm vừa phải để khi xay không cần thêm quá nhiều đường. Trái cây được rửa sạch, gọt vỏ và cắt ngay trước khi pha. Chúng tôi kết hợp xoài với sữa chua cùng một lượng đá vừa đủ, tạo kết cấu mượt mà nhưng vẫn giữ được vị trái cây rõ ràng.

Khi máy xay hoạt động, các nguyên liệu được hòa quyện đến khi bề mặt mịn và không còn vụn đá lớn. Sữa chua tạo nét chua nhẹ giúp cân bằng vị ngọt của xoài, đồng thời làm ly sinh tố có cảm giác tươi và dễ uống hơn. Nếu xoài trong ngày đã ngọt, chúng tôi giảm phần chất tạo ngọt để hương trái cây được nổi bật. Từng công thức được hoàn thiện theo lượng vừa đủ cho một phần, không xay sẵn để lưu trữ, nhờ đó ly uống giữ được màu sắc và độ thơm ngon tự nhiên.

Ngụm đầu tiên mềm mịn, tiếp đó là hương xoài chín lan tỏa và vị sữa chua thoảng nhẹ ở cuối. Độ sánh vừa đủ để thưởng thức từ từ bằng ống hút lớn, nhưng không nặng như món tráng miệng. Bạn có thể chọn dùng ít đá hơn nếu muốn vị trái cây đậm, hoặc thêm đá nếu thích cảm giác mát sâu. Một chút miếng xoài tươi có thể được đặt trên mặt ly để tăng độ giòn và tạo điểm nhấn. Sinh tố xoài nhiệt đới thích hợp cho buổi trưa, sau giờ vận động hoặc khi bạn muốn một món uống no nhẹ.

Ở Mộc Nhiên, chúng tôi chú trọng độ tươi và vệ sinh trong từng bước. Trái cây được bảo quản lạnh đúng cách, thớt và dao được làm sạch trước khi sơ chế, còn cối xay được rửa ngay sau mỗi lần dùng để không lẫn mùi giữa các loại đồ uống. Mỗi phần sinh tố được cân chỉnh để vừa đủ thơm, ngọt và mát mà không che mất vị xoài. Sự kết hợp giản dị giữa trái cây chín, sữa chua và đá đem lại cảm giác gần gũi, dễ chịu. Hãy chọn sinh tố xoài nhiệt đới khi bạn muốn thưởng thức vị ngọt tự nhiên của mùa hè trong một ly mịn màng, tươi mới và được chuẩn bị riêng cho mình.`,
  },
];
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
      category VARCHAR(20) NOT NULL DEFAULT 'coffee',
      description VARCHAR(500) NOT NULL,
      introduction TEXT NOT NULL,
      price INT UNSIGNED NOT NULL,
      image VARCHAR(1000) NOT NULL,
      image_alt VARCHAR(250) NOT NULL,
      gallery_images JSON NOT NULL,
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
      user_id BIGINT UNSIGNED NULL,
      customer_name VARCHAR(120) NOT NULL,
      customer_phone VARCHAR(40) NOT NULL,
      fulfillment ENUM('dine_in', 'takeaway') NOT NULL,
      table_number VARCHAR(20) NULL,
      status ENUM('awaiting_payment', 'pending', 'preparing', 'completed') NOT NULL,
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

  const [orderColumns] = await database.query("SHOW COLUMNS FROM orders");
  const orderColumnNames = new Set(orderColumns.map(({ Field }) => Field));
  const orderStatusColumn = orderColumns.find(({ Field }) => Field === "status");
  if (!orderStatusColumn.Type.includes("'awaiting_payment'")) {
    await database.query(`
      ALTER TABLE orders
      MODIFY status ENUM('awaiting_payment', 'pending', 'preparing', 'completed') NOT NULL
    `);
  }
  if (orderColumns.find(({ Field }) => Field === "user_id")?.Null === "NO") {
    await database.query("ALTER TABLE orders MODIFY user_id BIGINT UNSIGNED NULL");
  }
  if (!orderColumnNames.has("customer_name")) {
    await database.query(
      "ALTER TABLE orders ADD COLUMN customer_name VARCHAR(120) NOT NULL DEFAULT '' AFTER user_id",
    );
    await database.query(`
      UPDATE orders
      JOIN users ON users.id = orders.user_id
      SET orders.customer_name = users.name
      WHERE orders.customer_name = ''
    `);
  }
  if (!orderColumnNames.has("customer_phone")) {
    await database.query(
      "ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(40) NOT NULL DEFAULT '' AFTER customer_name",
    );
  }
  if (!orderColumnNames.has("fulfillment")) {
    await database.query(
      "ALTER TABLE orders ADD COLUMN fulfillment ENUM('dine_in', 'takeaway') NOT NULL DEFAULT 'takeaway' AFTER customer_phone",
    );
  }
  if (!orderColumnNames.has("table_number")) {
    await database.query(
      "ALTER TABLE orders ADD COLUMN table_number VARCHAR(20) NULL AFTER fulfillment",
    );
  }
  await database.query(`
    UPDATE orders
    JOIN users ON users.id = orders.user_id
    SET orders.customer_name = users.name
    WHERE orders.customer_name = ''
  `);

  const [categoryColumn] = await database.query(
    "SHOW COLUMNS FROM menu_items LIKE 'category'",
  );
  if (categoryColumn.length === 0) {
    await database.query(
      "ALTER TABLE menu_items ADD COLUMN category VARCHAR(20) NOT NULL DEFAULT 'coffee' AFTER name",
    );
    await database.query(
      "UPDATE menu_items SET category = 'milk-tea' WHERE name = ?",
      ["Matcha mây xanh"],
    );
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

  const [galleryColumn] = await database.query(
    "SHOW COLUMNS FROM menu_items LIKE 'gallery_images'",
  );
  if (galleryColumn.length === 0) {
    await database.query(
      "ALTER TABLE menu_items ADD COLUMN gallery_images JSON NULL AFTER image_alt",
    );
  }
  await database.query(`
    UPDATE menu_items
    SET gallery_images = JSON_ARRAY(
      JSON_OBJECT('url', image, 'alt', image_alt),
      JSON_OBJECT('url', image, 'alt', image_alt),
      JSON_OBJECT('url', image, 'alt', image_alt)
    )
    WHERE gallery_images IS NULL
  `);
  for (const sample of sampleMenuItems) {
    await database.execute(
      `UPDATE menu_items
       SET introduction = ?, gallery_images = ?
       WHERE name = ?
         AND (
           CHAR_LENGTH(introduction) < 1001
           OR (
             JSON_UNQUOTE(JSON_EXTRACT(gallery_images, '$[0].url')) =
               JSON_UNQUOTE(JSON_EXTRACT(gallery_images, '$[1].url'))
             AND JSON_UNQUOTE(JSON_EXTRACT(gallery_images, '$[1].url')) =
               JSON_UNQUOTE(JSON_EXTRACT(gallery_images, '$[2].url'))
           )
         )`,
      [sample.introduction, JSON.stringify(sample.galleryImages), sample.name],
    );
  }
  if (galleryColumn.length === 0 || galleryColumn[0].Null === "YES") {
    await database.query(
      "ALTER TABLE menu_items MODIFY gallery_images JSON NOT NULL",
    );
  }

  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    const seedExecute = async (sql, parameters = []) => {
      const [result] = await connection.execute(sql, parameters);
      return result;
    };
    for (const [index, sample] of sampleMenuItems.entries()) {
      await seedExecute(
        `INSERT IGNORE INTO menu_items
          (name, category, description, introduction, price, image, image_alt,
            gallery_images, best_seller, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sample.name,
          sample.category,
          sample.description,
          sample.introduction,
          sample.price,
          sample.image,
          sample.imageAlt,
          JSON.stringify(sample.galleryImages),
          sample.bestSeller,
          index + 1,
        ],
      );
    }

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
        `INSERT INTO orders
          (user_id, customer_name, customer_phone, fulfillment, status, total)
         VALUES (?, 'Khách Mộc', '', 'takeaway', 'completed', ?)`,
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
        `INSERT INTO orders
          (user_id, customer_name, customer_phone, fulfillment, status, total)
         VALUES (?, 'Khách Mộc', '', 'takeaway', 'preparing', ?)`,
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
