import { Link, useParams } from "react-router-dom";
import { useApiResource } from "../api.js";
import ResourceStatus from "../components/ResourceStatus.jsx";
import SeoMetadata from "../components/SeoMetadata.jsx";
import NotFoundPage from "./NotFoundPage.jsx";
import { getMenuItemPath } from "../menuSlug.js";

export default function MenuItemPage() {
  const { slug } = useParams();
  const { data: items, loading, error } = useApiResource("/menu");
  const item = items.find((menuItem) => getMenuItemPath(menuItem).slice(6) === slug);

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
  const bestSellerItems = items.filter(
    (menuItem) => menuItem.bestSeller && menuItem.id !== item.id,
  );
  const description = `${item.description} Thưởng thức ${item.name} tại Mộc Nhiên Coffee, 448 Tây Sơn, Đống Đa, Hà Nội.`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    description: item.description,
    image: item.image,
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
        image={item.image}
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
          <article className="menu-item-detail">
            <div className="menu-item-image-wrap">
              <img src={item.image} alt={item.imageAlt} />
            </div>
            <div className="menu-item-copy">
              <span className="eyebrow">Món ngon tại Mộc Nhiên Coffee</span>
              <h1>{item.name}</h1>
              {item.bestSeller && <span className="best-seller-badge">Món bán chạy</span>}
              <p className="menu-item-description">{item.description}</p>
              <p className="menu-item-price">
                {item.price.toLocaleString("vi-VN")}đ
              </p>
              <p className="menu-item-location">
                Thưởng thức tại Mộc Nhiên Coffee, 448 Tây Sơn, Đống Đa, Hà Nội.
              </p>
              <div className="menu-item-actions">
                <Link className="button" to="/visit">
                  Ghé quán thưởng thức
                </Link>
                <Link className="text-link" to="/menu">
                  ← Quay lại thực đơn
                </Link>
              </div>
            </div>
          </article>
          {bestSellerItems.length > 0 && (
            <section className="best-seller-recommendations" aria-labelledby="best-seller-heading">
              <div className="best-seller-heading">
                <div>
                  <span className="eyebrow">Được yêu thích tại Mộc</span>
                  <h2 id="best-seller-heading">Món bán chạy</h2>
                </div>
                <Link className="text-link" to="/menu">Xem toàn bộ thực đơn →</Link>
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
      </section>
    </>
  );
}
