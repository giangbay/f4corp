import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchApi, useApiResource } from "./api.js";
import { getMenuCategoryLabel, MENU_CATEGORIES } from "./menuCategories.js";
import { getMenuItemPath } from "./menuSlug.js";

const EMPTY_PRODUCT = {
  name: "",
  category: "coffee",
  description: "",
  introduction: "",
  price: "",
  galleryImages: [
    { url: "", alt: "" },
    { url: "", alt: "" },
    { url: "", alt: "" },
  ],
  bestSeller: false,
};

function ProductPreview({ product }) {
  const firstImage = product.galleryImages[0];
  return (
    <article className="admin-product-preview">
      {firstImage.url ? (
        <img src={firstImage.url} alt={firstImage.alt || "Ảnh xem trước món"} />
      ) : (
        <div className="admin-product-placeholder">Ảnh món sẽ hiển thị ở đây</div>
      )}
      <div className="admin-product-preview-gallery">
        {product.galleryImages.map((image, index) =>
          image.url ? (
            <img key={index} src={image.url} alt={image.alt || `Ảnh sản phẩm ${index + 1}`} />
          ) : (
            <div className="admin-product-preview-gallery-empty" key={index}>
              Ảnh {index + 1}
            </div>
          ),
        )}
      </div>
      <div className="admin-product-preview-copy">
        <div className="admin-product-preview-heading">
          <strong>{product.name || "Tên món mới"}</strong>
          {product.bestSeller && <span className="best-seller-badge">Bán chạy</span>}
        </div>
        <p>{product.description || "Mô tả món ăn, hương vị và nguyên liệu."}</p>
        {product.introduction && (
          <p className="admin-product-introduction-preview">
            {product.introduction}
          </p>
        )}
        <span className="price">
          {Number(product.price || 0).toLocaleString("vi-VN")}đ
        </span>
      </div>
    </article>
  );
}

export default function AdminMenuSection() {
  const {
    data: products,
    setData: setProducts,
    loading,
    error,
  } = useApiResource("/menu");
  const [searchParams, setSearchParams] = useSearchParams();
  const [product, setProduct] = useState(EMPTY_PRODUCT);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [uploadingImageIndex, setUploadingImageIndex] = useState(null);

  function updateField(event) {
    const { name, value, checked, type } = event.target;
    const galleryMatch = name.match(/^galleryImages\.(\d+)\.(url|alt)$/);
    if (galleryMatch) {
      const [, index, field] = galleryMatch;
      setProduct((current) => ({
        ...current,
        galleryImages: current.galleryImages.map((image, imageIndex) =>
          imageIndex === Number(index) ? { ...image, [field]: value } : image,
        ),
      }));
      return;
    }
    setProduct((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function startEditing(item) {
    setSearchParams({ edit: String(item.id) }, { replace: true });
    setEditingProductId(item.id);
    setProduct({
      name: item.name,
      category: item.category,
      description: item.description,
      introduction: item.introduction,
      price: String(item.price),
      galleryImages: item.galleryImages.map((image) => ({ ...image })),
      bestSeller: Boolean(item.bestSeller),
    });
    setFormError("");
    setSuccess("");
    document.getElementById("admin-product-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function cancelEditing() {
    setSearchParams({}, { replace: true });
    setEditingProductId(null);
    setProduct(EMPTY_PRODUCT);
    setFormError("");
    setSuccess("");
  }

  async function handleImageUpload(index, file) {
    if (!file) return;
    setUploadingImageIndex(index);
    setFormError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const uploaded = await fetchApi("/admin/menu/upload-image", {
        method: "POST",
        body: formData,
      });
      setProduct((current) => ({
        ...current,
        galleryImages: current.galleryImages.map((image, imageIndex) =>
          imageIndex === index
            ? { ...image, url: uploaded.url, alt: image.alt || uploaded.originalName }
            : image,
        ),
      }));
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setUploadingImageIndex(null);
    }
  }

  useEffect(() => {
    const requestedId = searchParams.get("edit");
    if (loading || error || !requestedId || editingProductId !== null) return;

    const requestedProduct = products.find(
      (item) => String(item.id) === requestedId,
    );
    if (requestedProduct) {
      startEditing(requestedProduct);
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [editingProductId, error, loading, products, searchParams, setSearchParams]);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const savedProduct = await fetchApi(
        editingProductId ? `/admin/menu/${editingProductId}` : "/admin/menu",
        {
        method: editingProductId ? "PUT" : "POST",
        body: JSON.stringify({
          ...product,
          introduction: product.introduction.trim(),
          price: Number(product.price),
        }),
      });
      if (editingProductId) {
        setProducts((current) =>
          current.map((item) =>
            item.id === savedProduct.id ? savedProduct : item,
          ),
        );
      } else {
        setProducts((current) => [...current, savedProduct]);
      }
      setEditingProductId(null);
      setSearchParams({}, { replace: true });
      setProduct(EMPTY_PRODUCT);
      setSuccess(
        editingProductId
          ? `Đã cập nhật "${savedProduct.name}".`
          : `Đã đăng "${savedProduct.name}" lên thực đơn.`,
      );
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
          <h2>{editingProductId ? "Chỉnh sửa sản phẩm" : "Thêm món mới"}</h2>
          <p>
            {editingProductId
              ? "Cập nhật danh mục, hình ảnh và nội dung hiển thị của món."
              : "Tạo trang riêng cho món, phân loại thực đơn và chọn món bán chạy để giới thiệu ở trang chi tiết."}
          </p>
        </div>
        <span className="admin-menu-total">
          <strong>{products.length}</strong> món
        </span>
      </div>

      <div className="admin-menu-layout">
        <form
          className="admin-product-form"
          id="admin-product-form"
          onSubmit={handleSubmit}
        >
          <div className="admin-product-form-heading">
            <span className="admin-form-step">01</span>
            <div>
              <h3>{editingProductId ? "Chỉnh sửa sản phẩm" : "Thông tin sản phẩm"}</h3>
              <p>
                {editingProductId
                  ? "Cập nhật thông tin sẽ hiển thị công khai trên menu."
                  : "Điền nội dung sẽ hiển thị công khai trên menu."}
              </p>
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

          <label htmlFor="product-category">Danh mục</label>
          <select
            id="product-category"
            name="category"
            value={product.category}
            onChange={updateField}
            required
          >
            {MENU_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

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

          <label htmlFor="product-introduction">
            Giới thiệu chi tiết (tối thiểu 1.001 ký tự)
          </label>
          <textarea
            id="product-introduction"
            name="introduction"
            value={product.introduction}
            onChange={updateField}
            minLength={1001}
            maxLength={5000}
            rows={9}
            placeholder="Viết câu chuyện, nguyên liệu, cách pha chế, hương vị và trải nghiệm thưởng thức của món (ít nhất 1.001 ký tự)"
            required
          />
          <span className="admin-character-count">
            {product.introduction.length.toLocaleString("vi-VN")}/5.000 ký tự
          </span>

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

          <fieldset className="admin-gallery-fields">
            <legend>Thư viện ảnh · cần đúng 3 ảnh khác nhau</legend>
            {product.galleryImages.map((image, index) => (
              <div className="admin-gallery-image-fields" key={index}>
                <span className="admin-gallery-image-number">
                  Ảnh {index + 1}{index === 0 ? " · ảnh đại diện" : ""}
                </span>
                <input
                  className="admin-gallery-file"
                  id={`product-image-${index}`}
                  name={`galleryImages.${index}.url`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => handleImageUpload(index, event.target.files?.[0])}
                  required={!image.url}
                />
                {uploadingImageIndex === index && (
                  <span className="admin-upload-status">Đang tải ảnh lên…</span>
                )}
                {image.url && (
                  <span className="admin-upload-status">Đã có ảnh · {image.url}</span>
                )}
                <label className="visually-hidden" htmlFor={`product-image-alt-${index}`}>
                  Mô tả hình ảnh {index + 1}
                </label>
                <input
                  id={`product-image-alt-${index}`}
                  name={`galleryImages.${index}.alt`}
                  value={image.alt}
                  onChange={updateField}
                  minLength={2}
                  maxLength={250}
                  placeholder="Mô tả ảnh để hỗ trợ SEO và trợ năng"
                  required
                />
              </div>
            ))}
          </fieldset>

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
          <div className="admin-product-form-actions">
            <button className="button admin-product-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? editingProductId
                  ? "Đang lưu…"
                  : "Đang đăng món…"
                : editingProductId
                  ? "Lưu thay đổi"
                  : "Đăng lên thực đơn"}
            </button>
            {editingProductId && (
              <button
                className="admin-product-cancel"
                type="button"
                onClick={cancelEditing}
                disabled={isSubmitting}
              >
                Hủy chỉnh sửa
              </button>
            )}
          </div>
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
                    <span className="admin-product-category">
                      {getMenuCategoryLabel(item.category)}
                    </span>
                    {Boolean(item.bestSeller) && (
                      <span className="best-seller-badge">Bán chạy</span>
                    )}
                  </div>
                  <span className="price">
                    {item.price.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <div className="admin-product-row-actions">
                  <button
                    className="admin-product-edit"
                    type="button"
                    onClick={() => startEditing(item)}
                    aria-label={`Chỉnh sửa ${item.name}`}
                  >
                    Sửa
                  </button>
                  <Link
                    className="admin-product-view"
                    to={getMenuItemPath(item)}
                    aria-label={`Xem trang ${item.name}`}
                  >
                    ↗
                  </Link>
                </div>
              </article>
            ))}
        </div>
      </div>
    </section>
  );
}
