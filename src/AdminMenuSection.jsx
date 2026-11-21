import { useState } from "react";
import { Link } from "react-router-dom";
import { fetchApi, useApiResource } from "./api.js";
import { getMenuItemPath } from "./menuSlug.js";

const EMPTY_PRODUCT = {
  name: "",
  description: "",
  price: "",
  image: "",
  imageAlt: "",
  bestSeller: false,
};

function ProductPreview({ product }) {
  return (
    <article className="admin-product-preview">
      {product.image ? (
        <img src={product.image} alt={product.imageAlt || "Ảnh xem trước món"} />
      ) : (
        <div className="admin-product-placeholder">Ảnh món sẽ hiển thị ở đây</div>
      )}
      <div className="admin-product-preview-copy">
        <div className="admin-product-preview-heading">
          <strong>{product.name || "Tên món mới"}</strong>
          {product.bestSeller && <span className="best-seller-badge">Bán chạy</span>}
        </div>
        <p>{product.description || "Mô tả món ăn, hương vị và nguyên liệu."}</p>
        <span className="price">
          {Number(product.price || 0).toLocaleString("vi-VN")}đ
        </span>
      </div>
    </article>
  );
}

export default function AdminMenuSection() {
  const { data: products, setData: setProducts, loading, error } = useApiResource("/menu");
  const [product, setProduct] = useState(EMPTY_PRODUCT);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    const { name, value, checked, type } = event.target;
    setProduct((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const createdProduct = await fetchApi("/admin/menu", {
        method: "POST",
        body: JSON.stringify({
          ...product,
          price: Number(product.price),
        }),
      });
      setProducts((current) => [...current, createdProduct]);
      setProduct(EMPTY_PRODUCT);
      setSuccess(`Đã đăng "${createdProduct.name}" lên thực đơn.`);
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="admin-menu-section" id="admin-menu">
      <div className="admin-menu-heading">
        <div>
          <span className="eyebrow">Thực đơn Mộc Nhiên</span>
          <h2>Thêm món mới</h2>
          <p>
            Tạo trang riêng cho món và chọn món bán chạy để giới thiệu ở trang
            chi tiết.
          </p>
        </div>
        <span className="admin-menu-total">
          <strong>{products.length}</strong> món
        </span>
      </div>

      <div className="admin-menu-layout">
        <form className="admin-product-form" onSubmit={handleSubmit}>
          <div className="admin-product-form-heading">
            <span className="admin-form-step">01</span>
            <div>
              <h3>Thông tin sản phẩm</h3>
              <p>Điền nội dung sẽ hiển thị công khai trên menu.</p>
            </div>
          </div>
          <label htmlFor="product-name">Tên món</label>
          <input
            id="product-name"
            name="name"
            value={product.name}
            onChange={updateField}
            minLength={2}
            maxLength={120}
            placeholder="Ví dụ: Cà phê cốt dừa"
            required
          />

          <label htmlFor="product-description">Mô tả món</label>
          <textarea
            id="product-description"
            name="description"
            value={product.description}
            onChange={updateField}
            minLength={2}
            maxLength={500}
            rows={3}
            placeholder="Hương vị, nguyên liệu hoặc điểm đặc biệt của món"
            required
          />

          <label htmlFor="product-price">Giá bán (đ)</label>
          <input
            id="product-price"
            name="price"
            type="number"
            value={product.price}
            onChange={updateField}
            min="0"
            max="100000000"
            step="1000"
            placeholder="45000"
            required
          />

          <label htmlFor="product-image">Đường dẫn hình ảnh</label>
          <input
            id="product-image"
            name="image"
            type="url"
            value={product.image}
            onChange={updateField}
            maxLength={1000}
            placeholder="https://..."
            required
          />

          <label htmlFor="product-image-alt">Mô tả hình ảnh (alt)</label>
          <input
            id="product-image-alt"
            name="imageAlt"
            value={product.imageAlt}
            onChange={updateField}
            minLength={2}
            maxLength={250}
            placeholder="Mô tả ngắn để hỗ trợ SEO và trợ năng"
            required
          />

          <label className="admin-best-seller-option">
            <input
              name="bestSeller"
              type="checkbox"
              checked={product.bestSeller}
              onChange={updateField}
            />
            <span>
              <strong>Đánh dấu món bán chạy</strong>
              <small>Món sẽ được gợi ý trên trang chi tiết sản phẩm khác.</small>
            </span>
          </label>

          <ProductPreview product={product} />
          {formError && (
            <p className="form-message form-message-error" role="alert">
              {formError}
            </p>
          )}
          {success && (
            <p className="form-message form-message-success" role="status">
              {success}
            </p>
          )}
          <button className="button admin-product-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang đăng món…" : "Đăng lên thực đơn"}
          </button>
        </form>

        <div className="admin-product-list">
          <div className="admin-product-list-heading">
            <div>
              <span className="admin-form-step">02</span>
              <h3>Món đang hiển thị</h3>
            </div>
            <span>{products.length} sản phẩm</span>
          </div>
          {loading && <p className="resource-message">Đang tải thực đơn…</p>}
          {error && (
            <p className="form-message form-message-error" role="alert">
              {error}
            </p>
          )}
          {!loading && !error && products.length === 0 && (
            <p className="resource-message">Chưa có món nào trong thực đơn.</p>
          )}
          {!loading &&
            !error &&
            products.map((item) => (
              <article className="admin-product-row" key={item.id}>
                <img src={item.image} alt={item.imageAlt} loading="lazy" />
                <div>
                  <div className="admin-product-row-title">
                    <strong>{item.name}</strong>
                    {item.bestSeller && (
                      <span className="best-seller-badge">Bán chạy</span>
                    )}
                  </div>
                  <span className="price">
                    {item.price.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <Link
                  className="admin-product-view"
                  to={getMenuItemPath(item)}
                  aria-label={`Xem trang ${item.name}`}
                >
                  ↗
                </Link>
              </article>
            ))}
        </div>
      </div>
    </section>
  );
}
