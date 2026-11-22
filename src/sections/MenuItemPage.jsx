import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { useApiResource } from "../api.js";
import MenuItemSidebar from "../components/MenuItemSidebar.jsx";
import MenuReviews from "../components/MenuReviews.jsx";
import { RichTextContent } from "../components/RichTextEditor.jsx";
import ResourceStatus from "../components/ResourceStatus.jsx";
import SeoMetadata from "../components/SeoMetadata.jsx";
import NotFoundPage from "./NotFoundPage.jsx";
import { getMenuItemPath } from "../menuSlug.js";

export default function MenuItemPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: items, loading, error } = useApiResource("/menu");
  const {
    data: blogPosts,
    loading: blogLoading,
    error: blogError,
  } = useApiResource("/blog");
  const item = items.find((menuItem) => getMenuItemPath(menuItem).slice(6) === slug);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const galleryImages = item?.galleryImages?.length
    ? item.galleryImages
    : item
      ? [{ url: item.image, alt: item.imageAlt }]
      : [];

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [item?.id]);

  if (loading || error) {
    return (
      <section className="menu-section menu-item-section">
        <div className="container">
          <ResourceStatus loading={loading} error={error} />
        </div>
      </section>
    );
  }
  if (!item) return <NotFoundPage />;

  const title = `${item.name} – Thực đơn | Mộc Nhiên Coffee`;
  const introduction = item.introduction || item.description;
  const bestSellerItems = items.filter(
    (menuItem) => Boolean(menuItem.bestSeller) && menuItem.id !== item.id,
  );
  const otherItems = items.filter((menuItem) => menuItem.id !== item.id);
  const suggestedItems = [
    ...otherItems.filter((menuItem) => Boolean(menuItem.bestSeller)),
    ...otherItems.filter(
      (menuItem) => menuItem.category === item.category && !menuItem.bestSeller,
    ),
    ...otherItems.filter(
      (menuItem) => menuItem.category !== item.category && !menuItem.bestSeller,
    ),
  ].slice(0, 3);
  const description = `${introduction} Thưởng thức ${item.name} tại Mộc Nhiên Coffee, 448 Tây Sơn, Đống Đa, Hà Nội.`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    description: introduction,
    image: galleryImages.map((galleryImage) => galleryImage.url),
    offers: {
      "@type": "Offer",
      price: item.price,
      priceCurrency: "VND",
      availability: "https://schema.org/InStock",
      url: window.location.href,
      seller: {
        "@type": "CafeOrCoffeeShop",
        name: "Mộc Nhiên Coffee",
      },
    },
  };

  return (
    <>
      <SeoMetadata
        title={title}
        description={description}
        image={galleryImages[0].url}
        structuredData={structuredData}
      />
      <section className="menu-item-section">
        <div className="container">
          <nav className="menu-breadcrumb" aria-label="Điều hướng">
            <Link to="/">Trang chủ</Link>
            <span aria-hidden="true">/</span>
            <Link to="/menu">Thực đơn</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{item.name}</span>
          </nav>
          <div
            className={`menu-item-page-layout${user?.role === "admin" ? " is-admin" : ""}`}
          >
            <div className="menu-item-main">
              <article className="menu-item-detail">
                <div className="menu-item-gallery">
                  <div className="menu-item-image-wrap">
                    <img
                      src={galleryImages[selectedImageIndex].url}
                      alt={galleryImages[selectedImageIndex].alt}
                    />
                  </div>
                  {galleryImages.length > 1 && (
                    <div
                      className="menu-item-gallery-thumbnails"
                      aria-label="Thư viện hình ảnh sản phẩm"
                    >
                      {galleryImages.map((galleryImage, index) => (
                        <button
                          aria-label={`Xem hình ${index + 1}: ${galleryImage.alt}`}
                          aria-pressed={selectedImageIndex === index}
                          className={selectedImageIndex === index ? "is-selected" : ""}
                          key={`${galleryImage.url}-${index}`}
                          onClick={() => {
                            setSelectedImageIndex(index);
                          }}
                          type="button"
                        >
                          <img src={galleryImage.url} alt="" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="menu-item-copy">
                  <span className="eyebrow">Món ngon tại Mộc Nhiên Coffee</span>
                  <h1>{item.name}</h1>
                  {Boolean(item.bestSeller) && (
                    <span className="best-seller-badge">Món bán chạy</span>
                  )}
                  <p className="menu-item-description">{item.description}</p>
                  <p className="menu-item-price">
                    {item.price.toLocaleString("vi-VN")}đ
                  </p>
                  <p className="menu-item-location">
                    Thưởng thức tại Mộc Nhiên Coffee, 448 Tây Sơn, Đống Đa, Hà Nội.
                  </p>
                  <div className="menu-item-actions">
                    <button
                      className="button"
                      type="button"
                      onClick={() =>
                        navigate("/menu", { state: { addToOrder: item.id } })
                      }
                    >
                      Thêm vào đơn
                    </button>
                    <Link className="text-link" to="/menu">
                      ← Quay lại thực đơn
                    </Link>
                    {user?.role === "admin" && (
                      <Link
                        className="text-link"
                        to={`/admin?edit=${encodeURIComponent(item.id)}#admin-product-form`}
                      >
                        Chỉnh sửa sản phẩm →
                      </Link>
                    )}
                  </div>
                </div>
              </article>
              <section
                className="menu-item-introduction"
                aria-labelledby="menu-introduction-heading"
              >
                <span className="eyebrow">Câu chuyện hương vị</span>
                <h2 id="menu-introduction-heading">Giới thiệu về {item.name}</h2>
                <RichTextContent
                  className="menu-item-introduction-content"
                  content={introduction}
                />
              </section>
              <MenuReviews
                menuId={item.id}
                menuName={item.name}
              />
              {user?.role === "admin" && bestSellerItems.length > 0 && (
                <section
                  className="best-seller-recommendations"
                  aria-labelledby="best-seller-heading"
                >
                  <div className="best-seller-heading">
                    <div>
                      <span className="eyebrow">Được yêu thích tại Mộc</span>
                      <h2 id="best-seller-heading">Món bán chạy</h2>
                    </div>
                    <Link className="text-link" to="/menu">
                      Xem toàn bộ thực đơn →
                    </Link>
                  </div>
                  <div className="best-seller-grid">
                    {bestSellerItems.map((recommendedItem) => (
                      <Link
                        className="best-seller-card"
                        key={recommendedItem.id}
                        to={getMenuItemPath(recommendedItem)}
                      >
                        <img
                          src={recommendedItem.image}
                          alt={recommendedItem.imageAlt}
                          loading="lazy"
                        />
                        <div>
                          <span className="best-seller-badge">Bán chạy</span>
                          <h3>{recommendedItem.name}</h3>
                          <span className="price">
                            {recommendedItem.price.toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
            <MenuItemSidebar
              products={suggestedItems}
              blogPosts={Array.isArray(blogPosts) ? blogPosts : []}
              blogLoading={blogLoading}
              blogError={blogError}
            />
          </div>
        </div>
      </section>
    </>
  );
}
